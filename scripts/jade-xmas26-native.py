#!/usr/bin/env python3
"""Prepare fixed image_gen jobs and preserve originals plus authorized 2K exports.

This helper does not generate images, call paid providers, upload, or approve QA.
The user explicitly authorized post-generation scaling on 2026-10-18.
"""
import argparse
import fcntl
import hashlib
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/jade/xmas26"
OUTPUT = Path("/workspace/jade-xmas26-native")
BATCH = "jade-xmas26-600-2026-10-18"
AUTHORIZATION = "User explicitly approved: Evet, üret ve 2K’ya ölçekle (2026-10-18)."


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    os.replace(temporary, path)


def prepare():
    raw = (SOURCE / "prompts.json").read_bytes()
    prompts = json.loads(raw)
    overrides = json.loads((SOURCE / "qa-prompt-overrides.json").read_text())
    assert sha(raw) == overrides["source_prompt_file_sha256"]
    corrections = {(r["product_code"], r["source_shot_code"]): r for r in overrides["records"]}
    jobs = []
    for family in "BNEP":
        for number in range(1, 11):
            code = f"{family}{number}"
            reference = SOURCE / f"images/heroes/crops/{code}.jpg"
            for position in range(1, 16):
                shot = next(s for s in prompts[code] if s["code"] == f"{position+1:02}")
                correction = corrections[(code, shot["code"])]
                prompt = shot["prompt"]
                assert sha(prompt.encode()) == correction["source_prompt_sha256"]
                for replacement in correction["replacements"]:
                    assert prompt.count(replacement["find"]) == replacement["expected_count"]
                    prompt = prompt.replace(replacement["find"], replacement["replace"])
                assert sha(prompt.encode()) == correction["result_prompt_sha256"]
                prompt += (
                    "\nGenerate ONE NEW landscape photograph with a 4:3 aspect ratio at the highest "
                    "native resolution available. This is a new composition based on the reference jewelry, "
                    "not a crop of the reference. The reference is the visual authority for silhouette, "
                    "proportions, visible detail count, stone placement, enamel and grooves. "
                    "Preserve that exact product when text conflicts. Follow the requested shot and scene; "
                    "do not copy the reference background or camera composition. "
                    "Representative 14K yellow-gold design visualization for a listing offering 10K, 14K "
                    "and 18K choices. No invented hallmark, karat stamp, logo, lettering, dimensions, "
                    "certificate or watermark. No collage. Return a single complete image."
                )
                jobs.append({
                    "product_code": code, "position": position, "shot_code": shot["code"],
                    "purpose": shot["purpose"], "alt": shot["alt"], "prompt": prompt,
                    "prompt_sha256": sha(prompt.encode()), "reference_path": str(reference),
                    "reference_sha256": sha(reference.read_bytes()),
                })
    write_json(OUTPUT / "native-jobs.json", {
        "batch_id": BATCH, "provider": "openai_imagegen", "jobs": jobs,
        "copy_sha256": sha((SOURCE / "listing-copy-2026-10-18.json").read_bytes()),
        "resize_authorization": AUTHORIZATION,
    })
    print(json.dumps({"jobs": len(jobs), "path": str(OUTPUT / "native-jobs.json")}))


def job_data():
    return json.loads((OUTPUT / "native-jobs.json").read_text())


def category_manifest(category):
    path = OUTPUT / f"manifests/{category}.json"
    data = json.loads(path.read_text()) if path.exists() else {
        "batch_id": BATCH, "category": category, "images": [],
        "copy_sha256": job_data()["copy_sha256"], "resize_authorization": AUTHORIZATION,
    }
    return path, data


def jobs(category, limit, products=None):
    _, existing = category_manifest(category)
    done = {(x["product_code"], x["position"]) for x in existing["images"]}
    revised = OUTPUT / 'revised/plan.json'
    if not revised.exists():
        revised = SOURCE / 'import/revised-plan.json'
    selected = ({(code, position) for code, positions in json.loads(revised.read_text())['products'].items()
                 for position in positions} if revised.exists() else None)
    pending = [j for j in job_data()["jobs"] if j["product_code"].startswith(category)
               and (selected is None or (j['product_code'], j['position']) in selected)
               and (not products or j["product_code"] in products)
               and (j["product_code"], j["position"]) not in done]
    print(json.dumps(pending[:limit], ensure_ascii=False))


def record(args):
    code, raw_position = args.job.split(":")
    position = int(raw_position)
    if code not in {f"{family}{number}" for family in "BNEP" for number in range(1, 11)} or not 1 <= position <= 15:
        raise ValueError("Invalid catalog slot")
    slot_lock = OUTPUT / f"slot-locks/{code}-{position:02}.lock"
    slot_lock.parent.mkdir(parents=True, exist_ok=True)
    with slot_lock.open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        record_locked(args)


def record_locked(args):
    code, raw_position = args.job.split(":")
    position = int(raw_position)
    revised = OUTPUT / 'revised/plan.json'
    if not revised.exists():
        revised = SOURCE / 'import/revised-plan.json'
    if revised.exists() and position not in json.loads(revised.read_text())['products'].get(code, []):
        raise ValueError('This image slot was canceled by the updated user request')
    job = next(j for j in job_data()["jobs"] if j["product_code"] == code and j["position"] == position)
    source = Path(args.source).resolve()
    assert source.is_file() and source.is_relative_to(Path("/workspace/generated_images"))
    original_bytes = source.read_bytes()
    original_hash = sha(original_bytes)
    with Image.open(source) as image:
        native_width, native_height = image.size
        image.verify()
    if abs(native_width / native_height - 4 / 3) > 0.02:
        raise ValueError(f"Unexpected native aspect ratio {native_width}x{native_height}; do not distort or crop")
    originals = OUTPUT / f"originals/{code}/{position:02}.png"
    delivery = OUTPUT / f"delivery/{code}/{position:02}.jpg"
    originals.parent.mkdir(parents=True, exist_ok=True)
    delivery.parent.mkdir(parents=True, exist_ok=True)
    if originals.exists() and sha(originals.read_bytes()) != original_hash:
        if not args.replace_rejected:
            raise ValueError("Slot already has another original; use --replace-rejected after visual QA")
        review_path = OUTPUT / "qa/reviews.json"
        review = json.loads(review_path.read_text())["reviews"].get(args.job, {})
        old_hash = sha(delivery.read_bytes())
        old_original_hash = sha(originals.read_bytes())
        if (review.get("qa_status") != "rejected" or review.get("sha256") != old_hash
                or review.get("original_sha256") != old_original_hash):
            raise ValueError("Replacement requires a rejection of the current delivery hash in the QA ledger")
        _, previous = category_manifest(code[0])
        previous_entry = next(i for i in previous["images"]
                              if (i["product_code"], i["position"]) == (code, position))
        if previous_entry.get("sha256") != old_hash or previous_entry.get("original_sha256") != old_original_hash:
            raise ValueError("Existing slot files do not match the recorded provenance")
        revision = OUTPUT / f"revisions/{code}/{position:02}/{old_hash}"
        revision.mkdir(parents=True, exist_ok=True)
        shutil.copy2(originals, revision / "original.png")
        shutil.copy2(delivery, revision / "delivery.jpg")
        write_json(revision / "provenance.json", {"image": previous_entry, "review": review})
    shutil.copy2(source, originals)
    with Image.open(originals) as image:
        image.convert("RGB").resize((2048, 1536), Image.Resampling.LANCZOS).save(
            delivery, "JPEG", quality=95, subsampling=0, optimize=True
        )
    prompt = Path(args.prompt_file).read_text() if args.prompt_file else job["prompt"]
    entry = {
        "product_code": code, "position": position, "shot_code": job["shot_code"],
        "file": str(delivery.relative_to(OUTPUT)), "local_path": str(delivery),
        "original_file": str(originals.relative_to(OUTPUT)), "original_tool_path": str(source),
        "native_width": native_width, "native_height": native_height,
        "original_sha256": original_hash, "width": 2048, "height": 1536,
        "sha256": sha(delivery.read_bytes()), "upscaled": native_width < 2048,
        "resize_method": "Pillow LANCZOS; JPEG quality95, chroma subsampling0",
        "resize_authorization": AUTHORIZATION, "provider": "openai_imagegen",
        "model": "image_gen tool; model version not exposed",
        "generation_id": f"image_gen:{source.stem}",
        "recorded_at_utc": datetime.now(timezone.utc).isoformat(),
        "reference_path": job["reference_path"], "reference_sha256": job["reference_sha256"],
        "prompt_sha256": sha(prompt.encode()), "prompt": prompt,
        "purpose": args.purpose or job["purpose"],
        "alt": args.alt or job["alt"], "qa_status": "pending",
        "qa_note": "Actual visual review required; resizing and hashes alone do not approve this image.",
        "initial_observation": args.observation or "Not yet recorded",
    }
    lock_path = OUTPUT / f"manifests/{code[0]}.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        path, manifest = category_manifest(code[0])
        manifest["images"] = [i for i in manifest["images"] if (i["product_code"], i["position"]) != (code, position)]
        manifest["images"].append(entry)
        manifest["images"].sort(key=lambda i: (int(i["product_code"][1:]), i["position"]))
        write_json(path, manifest)
    print(json.dumps({"recorded": f"{code}:{position}", "native": [native_width, native_height],
                      "delivery": [2048, 1536], "category_count": len(manifest["images"]),
                      "file": str(delivery), "qa_status": "pending"}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    get = sub.add_parser("jobs")
    get.add_argument("--category", choices=list("BNEP"), required=True)
    get.add_argument("--limit", type=int, default=3)
    get.add_argument("--product", action="append", help="Restrict jobs to assigned product codes; repeatable")
    add = sub.add_parser("record")
    add.add_argument("--job", required=True)
    add.add_argument("--source", required=True)
    add.add_argument("--prompt-file")
    add.add_argument("--observation")
    add.add_argument("--purpose", help="Actual shot intent when adapting a source shot to observable reference detail")
    add.add_argument("--alt", help="Actual image description when the shot is adapted")
    add.add_argument("--replace-rejected", action="store_true",
                     help="Preserve and replace a current image explicitly rejected in the QA ledger")
    args = parser.parse_args()
    if args.command == "prepare": prepare()
    elif args.command == "jobs": jobs(args.category, args.limit, args.product)
    else: record(args)


if __name__ == "__main__":
    main()
