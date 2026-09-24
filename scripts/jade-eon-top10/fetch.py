#!/usr/bin/env python3
"""Download finished Higgsfield jobs into docs/jade/eon-top10/images/<key>/<shot>.jpg.
stdin: JSON list [{"index":102,"job_id":"...","result_url":"..."}]. JPEG re-encode drops
PNG tEXt generator metadata (hf-job-id). Appends to jobs.json."""
import io, json, sys, urllib.request
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "docs/jade/eon-top10"
D = json.loads((BASE / "prompts.json").read_text())
keys = list(D)
log_p = BASE / "jobs.json"
log = {}
for j in [x for x in json.load(sys.stdin) if x.get("result_url")]:
    key = keys[j["index"] // 100 - 1]
    shot = next(r for r in D[key] if int(r["shot"][:2]) == j["index"] % 100)
    raw = urllib.request.urlopen(j["result_url"], timeout=120).read()
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    assert im.size == (2048, 2048), (key, shot["shot"], im.size)
    out = BASE / "images" / key / shot["file"]
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "JPEG", quality=88, optimize=True)
    log[f"{key}/{shot['file']}"] = j["job_id"]
    print("ok", key, shot["file"])
# merge at write time: parallel runners share this file
merged = json.loads(log_p.read_text()) if log_p.exists() else {}
merged.update(log)
log_p.write_text(json.dumps(merged, indent=1, sort_keys=True) + "\n")
