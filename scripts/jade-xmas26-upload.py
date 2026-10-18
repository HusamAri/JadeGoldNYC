#!/usr/bin/env python3
"""Upload one approved delivery image using a fixed-path signed Supabase URL.

No generation or resizing. Originals remain on disk. Credentials and signed URLs
are never printed. Verify the downloaded public bytes before appending the manifest.
"""
import argparse
import fcntl
import hashlib
import http.cookiejar
import io
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image

BATCH = "jade-xmas26-600-2026-10-18"
ORG = "f155b853-dfaf-48fd-94c5-ddfcb856e07c"
SUPABASE = "https://sewbrqflcrlgczilrusw.supabase.co"
ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def merge_asset(manifest, asset):
    """Refresh provenance even when different originals produce identical JPEGs."""
    matches = [item for item in manifest["images"] if item["product_code"] == asset["product_code"] and item["position"] == asset["position"]]
    if len(matches) > 1:
        raise ValueError("Duplicate upload manifest slot")
    if matches and any(matches[0].get(field) != asset.get(field) for field in ("sha256", "original_sha256")):
        manifest.setdefault("superseded_images", []).extend(matches)
        manifest["images"] = [item for item in manifest["images"] if item not in matches]
        manifest["images"].append(asset)
    elif not matches:
        manifest["images"].append(asset)


def request_json(url, payload, headers):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={**headers, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Do not print response URLs, cookies, signed URLs or arbitrary error body.
        raise RuntimeError(f"Upload signer failed (HTTP {error.code})") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default="/tmp/jade-xmas26-upload-client.json")
    parser.add_argument("--file", required=True)
    parser.add_argument("--original", required=True)
    parser.add_argument("--code", required=True)
    parser.add_argument("--position", type=int, required=True)
    parser.add_argument("--generation-id", required=True)
    parser.add_argument("--prompt-sha256")
    parser.add_argument("--expected-sha256")
    parser.add_argument("--expected-original-sha256")
    parser.add_argument("--user-authorized-upscale", action="store_true")
    parser.add_argument("--manifest", default="/workspace/jade-xmas26-output/verified-assets.json")
    args = parser.parse_args()
    if not re.fullmatch(r"[BNEP](?:[1-9]|10)", args.code) or not 1 <= args.position <= 15:
        parser.error("Invalid fixed-catalog slot")
    if not args.generation_id.strip():
        parser.error("Generation provenance is required")
    for value in (args.prompt_sha256, args.expected_sha256, args.expected_original_sha256):
        if value is not None and not re.fullmatch(r"[0-9a-f]{64}", value):
            parser.error("Invalid provenance hash")
    file, original = Path(args.file).resolve(), Path(args.original).resolve()
    data, native_data = file.read_bytes(), original.read_bytes()
    if args.expected_sha256 and sha(data) != args.expected_sha256:
        raise ValueError("Delivery changed after generation manifest was read")
    if args.expected_original_sha256 and sha(native_data) != args.expected_original_sha256:
        raise ValueError("Original changed after generation manifest was read")
    if len(data) > 25 * 1024 * 1024:
        parser.error("Delivery file exceeds25MiB")
    with Image.open(io.BytesIO(data)) as image:
        image.verify()
        delivered_size, image_format = image.size, image.format
    with Image.open(io.BytesIO(native_data)) as image:
        image.verify()
        native_size = image.size
    if delivered_size != (2048, 1536) or image_format not in ("PNG", "JPEG"):
        parser.error("Delivery must be2048x1536PNG or JPEG")
    upscaled = native_size[0] < delivered_size[0] or native_size[1] < delivered_size[1]
    if upscaled and not args.user_authorized_upscale:
        parser.error("Explicit user authorization for upscaling must be recorded")
    extension = "png" if image_format == "PNG" else "jpg"
    path = f"{ORG}/{BATCH}/{args.code}/{args.position:02d}-{sha(data)}.{extension}"
    public_url = f"{SUPABASE}/storage/v1/object/public/listing-images/{path}"
    config_path = Path(args.config)
    with config_path.open("r+") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        config = json.load(stream)
        if not re.fullmatch(r"https://[a-z0-9-]+\.vercel\.app/api/upload", config.get("url", "")):
            raise ValueError("Expected exact HTTPS Vercel upload deployment")
        if not config.get("cookie"):
            cookies = http.cookiejar.CookieJar()
            opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
            try:
                opener.open(config["url"] + "?_vercel_share=" + urllib.parse.quote(config["bypass"]), timeout=45)
            except urllib.error.HTTPError as error:
                if error.code != 405:
                    raise RuntimeError(f"Deployment share bootstrap failed (HTTP {error.code})") from None
            config["cookie"] = "; ".join(cookie.name + "=" + cookie.value for cookie in cookies)
            stream.seek(0)
            json.dump(config, stream)
            stream.truncate()
    result = request_json(config["url"], {"code": args.code, "position": args.position, "extension": extension, "sha256": sha(data)}, {"Authorization": "Bearer " + config["bearer"], "Cookie": config["cookie"]})
    if result.get("storage_path") != path or result.get("public_url") != public_url:
        raise ValueError("Signer path mismatch")
    if not result.get("exists"):
        signed_url = result.get("signed_upload_url", "")
        expected = f"{SUPABASE}/storage/v1/object/upload/sign/listing-images/{path}?token="
        if not signed_url.startswith(expected):
            raise ValueError("Unexpected signed URL")
        req = urllib.request.Request(signed_url, data=data, method="PUT", headers={"Content-Type": "image/png" if extension == "png" else "image/jpeg", "x-upsert": "false", "Cache-Control": "3600"})
        try:
            with urllib.request.urlopen(req, timeout=180) as response:
                response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (400, 409):
                raise RuntimeError(f"Signed upload failed (HTTP {error.code})") from None
            # A racing successful uploader can already have created this path;
            # the public hash below must still match our exact expected bytes.
    try:
        with urllib.request.urlopen(public_url, timeout=90) as response:
            remote = response.read(25 * 1024 * 1024 + 1)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Public byte verification failed (HTTP {error.code})") from None
    if sha(remote) != sha(data):
        raise ValueError("Remote bytes differ; existing image was not overwritten")
    reference = ROOT / "docs/jade/xmas26/images/heroes/crops" / f"{args.code}.jpg"
    asset = {
        "product_code": args.code, "position": args.position, "source_shot_code": f"{args.position + 1:02d}",
        "public_url": public_url, "storage_path": path, "width": delivered_size[0], "height": delivered_size[1],
        "native_width": native_size[0], "native_height": native_size[1],
        "native_resolution": f"{native_size[0]}x{native_size[1]}", "delivery_resolution": "2048x1536",
        "upscaled": upscaled, "user_authorized": args.user_authorized_upscale,
        "resize_authorization": "User explicitly approved: Evet, üret ve 2K’ya ölçekle (2026-10-18)." if args.user_authorized_upscale else None,
        "sha256": sha(data), "native_sha256": sha(native_data), "original_sha256": sha(native_data), "reference_sha256": sha(reference.read_bytes()),
        "bytes": len(data), "file": str(file), "original_file": str(original),
        "provider": "openai_imagegen", "model": "image_gen tool; model version not exposed", "generation_id": args.generation_id,
        "qa_status": "pending", "qa_note": "Public bytes and delivery dimensions verified; visual review pending.",
        "public_bytes_verified": True,
    }
    if args.prompt_sha256:
        asset["prompt_sha256"] = args.prompt_sha256
    output = Path(args.manifest)
    output.parent.mkdir(parents=True, exist_ok=True)
    with Path(str(output) + ".lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        manifest = json.loads(output.read_text()) if output.exists() else {
            "version": 1, "batch_id": BATCH, "org_id": ORG,
            "copy_sha256": sha((ROOT / "docs/jade/xmas26/listing-copy-2026-10-18.json").read_bytes()),
            "provider": "openai_imagegen", "model": "image_gen tool; model version not exposed", "images": [],
        }
        if manifest.get("batch_id") != BATCH or manifest.get("provider") != "openai_imagegen" or manifest.get("copy_sha256") != sha((ROOT / "docs/jade/xmas26/listing-copy-2026-10-18.json").read_bytes()):
            raise ValueError("Manifest batch/provider/copy mismatch")
        merge_asset(manifest, asset)
        temporary = output.with_suffix(output.suffix + ".tmp")
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        os.replace(temporary, output)
    print(json.dumps({"ok": True, "code": args.code, "position": args.position, "sha256": asset["sha256"], "public_url": public_url, "upscaled": upscaled, "manifest": str(output)}))


if __name__ == "__main__":
    main()
