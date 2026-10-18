#!/usr/bin/env python3
"""Join exact generation, upload and visual-review hashes; never infer QA approval."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BATCH = 'jade-xmas26-600-2026-10-18'
EXPECTED = {(f'{family}{number}', position) for family in 'BNEP'
            for number in range(1, 11) for position in range(1, 16)}
PRODUCTS = tuple(f'{family}{number}' for family in 'BNEP' for number in range(1, 11))


def read(path):
    return json.loads(path.read_text())


def indexed(entries):
    result = {}
    for entry in entries:
        key = (entry['product_code'], entry['position'])
        if key not in EXPECTED or key in result:
            raise ValueError(f'Unexpected or duplicate slot: {key}')
        result[key] = entry
    return result


def assemble(native, uploads, reviews, products=None):
    selected = tuple(code for code in PRODUCTS if products is None or code in products)
    if not selected or (products is not None and set(products) - set(PRODUCTS)):
        raise ValueError('Invalid product selection')
    expected = {(code, position) for code in selected for position in range(1, 16)}
    copy_sha = hashlib.sha256((ROOT / 'docs/jade/xmas26/listing-copy-2026-10-18.json').read_bytes()).hexdigest()
    generated_entries = []
    for family in 'BNEP':
        path = native / f'manifests/{family}.json'
        if path.exists():
            data = read(path)
            if data.get('batch_id') != BATCH or data.get('copy_sha256') != copy_sha:
                raise ValueError(f'{family}: batch or listing copy mismatch')
            generated_entries.extend(data['images'])
    generated = indexed(generated_entries)
    # Check the whole current catalog even when emitting one completed product.
    # A scoped attachment must not hide duplicate bytes in another category.
    delivery_hashes = {}
    for key, entry in generated.items():
        previous = delivery_hashes.get(entry['sha256'])
        if previous is not None:
            raise ValueError(f'Duplicate current delivery SHA across {previous} and {key}')
        delivery_hashes[entry['sha256']] = key
    upload_data = read(uploads) if uploads.exists() else {'images': []}
    if upload_data['images'] and (upload_data.get('batch_id') != BATCH or upload_data.get('copy_sha256') != copy_sha):
        raise ValueError('Upload batch or listing copy mismatch')
    uploaded = indexed(upload_data['images'])
    reviewed = read(reviews).get('reviews', {}) if reviews.exists() else {}
    approved, issues = [], {}
    statuses = Counter()
    for key in sorted(expected):
        label = f'{key[0]}:{key[1]}'
        source = generated.get(key)
        if source is None:
            issues[label] = 'not_generated'
            continue
        upload = uploaded.get(key)
        review = reviewed.get(label, {})
        if review.get('sha256') != source['sha256'] or review.get('original_sha256') != source['original_sha256']:
            issues[label] = 'awaiting_review_of_current_bytes'
            continue
        statuses[review.get('qa_status', 'pending')] += 1
        if review.get('qa_status') != 'passed':
            issues[label] = 'visually_rejected' if review.get('qa_status') == 'rejected' else 'awaiting_visual_review'
            continue
        if not review.get('qa_note') or not review.get('reviewer') or not review.get('reviewed_at_utc'):
            issues[label] = 'incomplete_review_evidence'
            continue
        if upload is None or upload.get('sha256') != source['sha256'] or upload.get('original_sha256') != source['original_sha256']:
            issues[label] = 'awaiting_upload_of_current_bytes'
            continue
        if not upload.get('public_bytes_verified'):
            issues[label] = 'public_bytes_not_verified'
            continue
        entry = {**source,
                 'public_url': upload['public_url'], 'storage_path': upload['storage_path'],
                 'public_bytes_verified': True,
                 'qa_status': 'passed', 'qa_note': review['qa_note'],
                 'qa_reviewer': review['reviewer'], 'qa_reviewed_at_utc': review['reviewed_at_utc']}
        approved.append(entry)
    report = {
        'batch_id': BATCH, 'copy_sha256': copy_sha,
        'checked_at_utc': datetime.now(timezone.utc).isoformat(),
        'selected_products': list(selected), 'expected_image_count': len(expected),
        'generated': len(set(generated) & expected), 'uploaded': len(set(uploaded) & expected),
        'reviewed_current_bytes': dict(statuses), 'approved_and_uploaded': len(approved),
        'issue_counts': dict(Counter(issues.values())), 'issues': issues,
    }
    return {'batch_id': BATCH, 'copy_sha256': copy_sha, 'selected_products': list(selected), 'images': approved}, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--native-dir', type=Path, default=Path('/workspace/jade-xmas26-native'))
    parser.add_argument('--uploads', type=Path, default=Path('/workspace/jade-xmas26-output/verified-assets.json'))
    parser.add_argument('--reviews', type=Path)
    parser.add_argument('--product', choices=PRODUCTS, action='append', help='Require all15 approved images for each selected product; repeatable. Default: all600.')
    parser.add_argument('--output', type=Path, help='Write only a completely approved manifest for the selected scope')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    manifest, report = assemble(args.native_dir, args.uploads, args.reviews or args.native_dir / 'qa/reviews.json', args.product)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'issues'}, ensure_ascii=False))
    if args.output:
        if report['approved_and_uploaded'] != report['expected_image_count']:
            raise SystemExit('Incomplete or unapproved batch: final manifest was not written')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.output.with_suffix(args.output.suffix + '.tmp')
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        os.replace(temporary, args.output)


if __name__ == '__main__':
    main()
