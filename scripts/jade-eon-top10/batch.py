#!/usr/bin/env python3
"""Print generate_image_batch requests JSON for listing keys (skip existing files).
usage: batch.py KEY[:shot,shot] ...   index = listing_no*100 + shot_no"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
D = json.loads((ROOT / "docs/jade/eon-top10/prompts.json").read_text())
IMG = ROOT / "docs/jade/eon-top10/images"
keys = list(D)
reqs = []
for arg in sys.argv[1:]:
    key, _, only = arg.partition(":")
    for r in D[key]:
        n = int(r["shot"][:2])
        if only and str(n) not in only.split(","):
            continue
        if (IMG / key / r["file"]).exists():
            continue
        reqs.append({"index": (keys.index(key) + 1) * 100 + n, "params": {
            "model": "gpt_image_2_5", "aspect_ratio": "1:1", "quality": "medium", "resolution": "2k",
            "medias": [{"role": "image_references", "value": v} for v in r["refs"]],
            "prompt": r["prompt"]}})
print(json.dumps(reqs, ensure_ascii=False))
