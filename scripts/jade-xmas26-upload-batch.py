#!/usr/bin/env python3
"""Upload completed own-engine images as their native category manifests arrive."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
NATIVE = Path('/workspace/jade-xmas26-native')


def identity(entry):
    return (entry['product_code'], entry['position'], entry['sha256'], entry['original_sha256'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--watch', action='store_true')
    parser.add_argument('--seconds', type=int, default=3600)
    parser.add_argument('--concurrency', type=int, default=4)
    parser.add_argument('--manifest', default='/workspace/jade-xmas26-output/verified-assets.json')
    args = parser.parse_args()
    if not 1 <= args.concurrency <= 6 or not 1 <= args.seconds <= 86400:
        parser.error('Concurrency must be1..6; watch duration1..86400seconds')
    deadline = time.monotonic() + args.seconds
    attempts = {}

    def upload(entry):
        original = NATIVE / entry['original_file']
        delivery = NATIVE / entry['file']
        if hashlib.sha256(delivery.read_bytes()).hexdigest() != entry['sha256'] or hashlib.sha256(original.read_bytes()).hexdigest() != entry['original_sha256']:
            return {'ok': False, 'code': entry['product_code'], 'position': entry['position'], 'error': 'Local image hash mismatch'}
        command = [sys.executable, str(ROOT / 'scripts/jade-xmas26-upload.py'), '--code', entry['product_code'], '--position', str(entry['position']), '--original', str(original), '--file', str(delivery), '--generation-id', entry['generation_id'], '--prompt-sha256', entry['prompt_sha256'], '--expected-sha256', entry['sha256'], '--expected-original-sha256', entry['original_sha256'], '--user-authorized-upscale', '--manifest', args.manifest]
        result = subprocess.run(command, capture_output=True, text=True, timeout=360)
        if result.returncode:
            # Uploader errors never contain signing tokens; keep the last line only.
            return {'ok': False, 'code': entry['product_code'], 'position': entry['position'], 'error': result.stderr.strip().splitlines()[-1] if result.stderr.strip() else 'Uploader failed'}
        return json.loads(result.stdout)

    while True:
        output = Path(args.manifest)
        verified = json.loads(output.read_text()).get('images', []) if output.exists() else []
        done = {identity(entry) for entry in verified}
        pending = []
        revised_path = NATIVE / 'revised/plan.json'
        if not revised_path.exists():
            revised_path = ROOT / 'docs/jade/xmas26/import/revised-plan.json'
        revised_slots = ({(code, position) for code, positions in json.loads(revised_path.read_text())['products'].items()
                          for position in positions} if revised_path.exists() else None)
        for family in 'BNEP':
            path = NATIVE / f'manifests/{family}.json'
            if not path.exists():
                continue
            for entry in json.loads(path.read_text()).get('images', []):
                if revised_slots is not None and (entry['product_code'], entry['position']) not in revised_slots:
                    continue
                slot = identity(entry)
                if slot not in done and attempts.get(slot, 0) < 3:
                    pending.append(entry)
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            futures = {executor.submit(upload, entry): identity(entry) for entry in pending}
            for future in concurrent.futures.as_completed(futures):
                slot = futures[future]
                attempts[slot] = attempts.get(slot, 0) + 1
                try:
                    result = future.result()
                except Exception as error:
                    result = {'ok': False, 'code': slot[0], 'position': slot[1], 'error': type(error).__name__}
                print(json.dumps(result), flush=True)
        # Continue after600 initial uploads so later QA replacements are picked up.
        if not args.watch or time.monotonic() >= deadline:
            break
        time.sleep(15)


if __name__ == '__main__':
    main()
