#!/usr/bin/env python3
"""Run the private fixed-catalog Vercel worker; download and hash every result.

Credentials belong in a mode-0600 JSON file outside the repository. Generated
files and the resumable manifest default to /workspace/jade-xmas26-output.
This command never marks visual QA passed and never writes gallery DB rows.
"""
import argparse
import concurrent.futures
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image

BATCH = "jade-xmas26-600-2026-10-18"
ORG = "f155b853-dfaf-48fd-94c5-ddfcb856e07c"
PREFIX = f"https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/listing-images/{ORG}/{BATCH}/"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="/tmp/jade-xmas26-client.json")
    parser.add_argument("--output", default="/workspace/jade-xmas26-output")
    parser.add_argument("--code")
    parser.add_argument("--position", type=int)
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--retries", type=int, default=0)
    args = parser.parse_args()
    if not args.all and not args.code:
        parser.error("Choose --code or --all")
    if not 1 <= args.concurrency <= 6 or not 0 <= args.retries <= 2:
        parser.error("Concurrency must be1..6; retries0..2")
    config = json.loads(Path(args.config).read_text())
    if not config["url"].startswith("https://") or not urllib.parse.urlparse(config["url"]).hostname.endswith(".vercel.app"):
        raise ValueError("Expected exact HTTPS Vercel deployment URL")
    if not config.get("cookie"):
        cookies = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
        try:
            opener.open(config["url"] + "?_vercel_share=" + urllib.parse.quote(config["bypass"]), timeout=45)
        except urllib.error.HTTPError as error:
            if error.code != 405:
                raise RuntimeError(f"Deployment share bootstrap failed ({error.code})") from None
        config["cookie"] = "; ".join(cookie.name + "=" + cookie.value for cookie in cookies)
        Path(args.config).write_text(json.dumps(config))
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / "verified-assets.json"
    copy_sha = hashlib.sha256((Path(__file__).resolve().parents[1] / "docs/jade/xmas26/listing-copy-2026-10-18.json").read_bytes()).hexdigest()
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {
        "version": 1, "batch_id": BATCH, "org_id": ORG, "copy_sha256": copy_sha,
        "provider": "google_gemini", "model": "gemini-nano-banana-2.1", "images": [],
    }
    lock = threading.Lock()
    stop = threading.Event()
    valid_codes = [f"{family}{i}" for family in "BNEP" for i in range(1, 11)]
    codes = valid_codes if args.all else [args.code]
    if any(code not in valid_codes for code in codes) or args.position and not 1 <= args.position <= 15:
        parser.error("Invalid fixed-catalog slot")
    slots = [(code, position) for code in codes for position in ([args.position] if args.position else range(1, 16))]
    if args.all:
        slots = [(f"{family}{i}", position) for i in range(1, 11) for position in ([args.position] if args.position else range(1, 16)) for family in "BNEP"]

    def record_event(event):
        with lock:
            with (output / "generation-attempts.jsonl").open("a") as stream:
                stream.write(json.dumps({"time": time.time(), **event}) + "\n")

    def generate(slot):
        code, position = slot
        if stop.is_set():
            return
        request_body = json.dumps({"action": "generate", "code": code, "position": position}).encode()
        normal_attempts = 0
        rate_attempts = 0
        while not stop.is_set():
            record_event({"event": "request", "code": code, "position": position})
            request = urllib.request.Request(config["url"], data=request_body, headers={
                "Authorization": "Bearer " + config["bearer"], "Cookie": config["cookie"], "Content-Type": "application/json",
            })
            try:
                with urllib.request.urlopen(request, timeout=285) as response:
                    result = json.load(response)
            except urllib.error.HTTPError as error:
                try:
                    result = json.loads(error.read())
                except (ValueError, UnicodeDecodeError):
                    result = {"error": "HTTP error", "status": error.code}
                record_event({"event": "failure", "code": code, "position": position, "result": result})
                # An image may already exist; never retry a repair-required slot.
                if result.get("repair_needed"):
                    return {"code": code, "position": position, "error": result}
                if error.code == 429:
                    rate_attempts += 1
                    message = json.dumps(result).lower()
                    if "limit: 0" in message or "billing" in message or rate_attempts >= 10:
                        stop.set()
                        return {"code": code, "position": position, "error": result}
                    time.sleep(min(60, 10 * rate_attempts))
                    continue
                normal_attempts += 1
                if normal_attempts <= args.retries and error.code >= 500:
                    time.sleep(3)
                    continue
                return {"code": code, "position": position, "error": result}
            except Exception as error:
                # Request outcome may be unknown. Resume explicitly after checking
                # worker status; do not automatically spend again on timeouts.
                record_event({"event": "transport_failure", "code": code, "position": position, "error_type": type(error).__name__})
                return {"code": code, "position": position, "error": type(error).__name__}
            if not result.get("ok") or not result.get("image"):
                return {"code": code, "position": position, "error": result}
            image = result["image"]
            url = image["public_url"]
            if not url.startswith(PREFIX + code + "/"):
                raise ValueError("Worker returned a URL outside the fixed storage batch")
            with urllib.request.urlopen(url, timeout=90) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != image["sha256"]:
                raise ValueError(f"Public image hash mismatch for {code}/{position}")
            relative = Path("images") / code / f"{position:02}{Path(image['storage_path']).suffix}"
            local = output / relative
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(data)
            with Image.open(local) as decoded:
                width, height = decoded.size
                decoded.verify()
            if (width, height) != (image["width"], image["height"]) or max(width, height) < 2048 or abs(width / height - 4 / 3) > 0.02:
                raise ValueError(f"Decoded native 2K 4:3 requirement failed for {code}/{position}")
            image.update({"file": str(relative), "download_verified": True, "dimensions_verified": True, "qa_status": "pending"})
            with lock:
                manifest["images"] = [item for item in manifest["images"] if (item["product_code"], item["position"]) != slot]
                manifest["images"].append(image)
                manifest["images"].sort(key=lambda item: (valid_codes.index(item["product_code"]), item["position"]))
                temporary = output / "verified-assets.json.tmp"
                temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
                os.replace(temporary, manifest_path)
                print(json.dumps({"completed": len(manifest["images"]), "code": code, "position": position, "width": width, "height": height, "cached": result.get("cached", False)}), flush=True)
            record_event({"event": "verified", "code": code, "position": position, "cached": result.get("cached", False), "sha256": image["sha256"], "generation_id": image["generation_id"]})
            return None

    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        for future in concurrent.futures.as_completed([pool.submit(generate, slot) for slot in slots]):
            failure = future.result()
            if failure:
                failures.append(failure)
                print(json.dumps(failure), flush=True)
    (output / "last-run-failures.json").write_text(json.dumps(failures, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"saved": len(manifest["images"]), "failures": len(failures), "stopped": stop.is_set()}), flush=True)
    return 1 if failures or stop.is_set() else 0


if __name__ == "__main__":
    raise SystemExit(main())
