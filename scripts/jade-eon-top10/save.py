#!/usr/bin/env python3
"""Shorthand for fetch.py: args like 173028:2005:<job_id> (hf timestamp:index:job)."""
import json, subprocess, sys
from pathlib import Path
U = "https://d8j0ntlcm91z4.cloudfront.net/user_2y2d8GaiZx1n1TAQvt4Zj3UOc3e/hf_20260924_"
jobs = []
for a in sys.argv[1:]:
    ts, idx, job = a.split(":")
    jobs.append({"index": int(idx), "job_id": job, "result_url": f"{U}{ts}_{job}.png"})
subprocess.run([sys.executable, str(Path(__file__).with_name("fetch.py"))], input=json.dumps(jobs), text=True, check=True)
