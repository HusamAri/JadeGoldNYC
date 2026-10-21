#!/usr/bin/env python3
"""apply_matrix.py  validate | plan | apply [--yes] [--batch N] [--start K] | verify | status

Applies data/optimization-matrix.json to the live shop through the Etsy Open API v3, in resumable batches.
State lives in data/apply-state.json (listing_id -> {status, applied_at, title, tags}).

Environment (never commit these):
  ETSY_API_KEY       keystring of your Etsy app
  ETSY_ACCESS_TOKEN  OAuth2 token with listings_w scope (get it with scripts/etsy_oauth.py or any OAuth helper)
  ETSY_SHOP_ID       68033014

Only title, tags and shop_section_id are written. Price, quantity, images, variations, descriptions are never touched.
Attributes and video are manual tasks for the owner (see CLAUDE.md).
"""
import json, os, sys, re, time, argparse, collections, datetime

try:
    import requests
except ImportError:  # validate/plan/status work without requests
    requests = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)
BANNED = {'silver', 'sterling', 'plated', 'vermeil', 'filled', 'brass', 'tungsten', 'moissanite', 'platinum', 'titanium',
          'steel', 'cz', 'zirconia', 'wood', 'wooden', 'meteorite', 'etsy', 'pandora', 'tiffany', 'cartier', 'mejuri'}
FILLERS_ONLY = {'minimalist statement', 'handcrafted everyday', 'sophisticated luxury', 'everyday jewelry', 'delicate everyday',
                'elegant classic', 'premium handcrafted', 'artisan designer', 'contemporary modern'}
SECTIONS = {s['title']: s['id'] for s in json.load(open(D('listings.json')))['sections']} if os.path.exists(D('listings.json')) else {}

def load_matrix():
    return json.load(open(D('optimization-matrix.json')))

def load_state():
    return json.load(open(D('apply-state.json'))) if os.path.exists(D('apply-state.json')) else {}

def save_state(s):
    json.dump(s, open(D('apply-state.json'), 'w'), indent=1)

def check_row(r):
    errs = []
    t = r['new_title']; tags = r['new_tags']
    if len(t) > 140: errs.append(f'title {len(t)} chars')
    if len(t) < 20: errs.append('title too short')
    first = t[:40].lower()
    head = t.split(',')[0].lower()
    if not any(w in first for w in ['gold', 'evil eye', 'anklet', 'necklace', 'bracelet', 'ring', 'earrings', 'band', 'cuff']):
        errs.append('no primary keyword in first 40 chars')
    if len(head) > 40: errs.append('head clause longer than 40 chars')
    if re.search(r'[–—â]', t): errs.append('dash or circumflex in title')
    if len(tags) != 13: errs.append(f'{len(tags)} tags')
    if len(set(tags)) != len(tags): errs.append('duplicate tags')
    for g in tags:
        if len(g) > 20: errs.append(f'tag >20: {g}')
        if g != g.lower(): errs.append(f'tag not lowercase: {g}')
        if ' ' not in g: errs.append(f'single-word tag: {g}')
        if any(b in g.split() or b in g for b in BANNED): errs.append(f'banned material/brand: {g}')
        if g in FILLERS_ONLY: errs.append(f'filler tag: {g}')
        if re.search(r'[^a-z0-9 ]', g): errs.append(f'bad chars: {g}')
        if len(g.split()) != len(set(g.split())): errs.append(f'repeated word: {g}')
    return errs

def cmd_validate(m):
    bad = 0
    sets = collections.Counter(tuple(sorted(r['new_tags'])) for r in m)
    dups = [k for k, c in sets.items() if c > 1]
    for r in m:
        e = check_row(r)
        if e:
            bad += 1
            print(r['listing_id'], '|', r['new_title'][:60], '|', '; '.join(e))
    print(f'{bad} with rule violations out of {len(m)}; {len(dups)} tag sets shared by more than one listing')
    for k in dups:
        ids = [r['listing_id'] for r in m if tuple(sorted(r['new_tags'])) == k]
        print('  shared tag set:', ids)
    return bad == 0 and not dups

def cmd_plan(m, state, batch, start):
    todo = [r for r in m if state.get(r['listing_id'], {}).get('status') != 'applied'][start:start + batch]
    for r in todo:
        print(f"{r['listing_id']}  p{r['priority']:3d}  {r['tag_class']:5s}  views {r['views_30d']:3d}")
        print('   OLD', r['current_title'])
        print('   NEW', r['new_title'])
        print('   TAGS', ' | '.join(r['new_tags']))
        if r['section_fix']: print('   SECTION', r['current_section'], '->', r['target_section'])
    print(f'{len(todo)} listings in this batch; {sum(1 for r in m if state.get(r["listing_id"], {}).get("status") == "applied")} already applied')

def api(method, path, **kw):
    key = os.environ['ETSY_API_KEY']; tok = os.environ['ETSY_ACCESS_TOKEN']
    h = {'x-api-key': key, 'Authorization': f'Bearer {tok}'}
    for attempt in range(4):
        r = requests.request(method, 'https://openapi.etsy.com/v3/application' + path, headers=h, timeout=30, **kw)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(2 ** attempt * 2); continue
        return r
    return r

def cmd_apply(m, state, batch, start, yes):
    shop = os.environ.get('ETSY_SHOP_ID', '68033014')
    todo = [r for r in m if state.get(r['listing_id'], {}).get('status') != 'applied'][start:start + batch]
    if not yes:
        print('DRY RUN (add --yes to write). Would update:')
        for r in todo: print(' ', r['listing_id'], '->', r['new_title'][:80])
        return
    if requests is None: sys.exit('pip install requests')
    for r in todo:
        body = {'title': r['new_title'], 'tags': ','.join(r['new_tags'])}
        if r['section_fix'] and r['target_section'] in SECTIONS and SECTIONS[r['target_section']]:
            body['shop_section_id'] = SECTIONS[r['target_section']]
        resp = api('PATCH', f'/shops/{shop}/listings/{r["listing_id"]}', data=body)
        ok = resp.status_code == 200
        state[r['listing_id']] = {'status': 'applied' if ok else 'error', 'code': resp.status_code,
                                  'applied_at': datetime.datetime.utcnow().isoformat(), 'title': r['new_title'],
                                  'tags': r['new_tags'], 'error': None if ok else resp.text[:300]}
        save_state(state)
        print(r['listing_id'], resp.status_code, '' if ok else resp.text[:120])
        time.sleep(0.6)

def cmd_verify(m, state):
    if requests is None: sys.exit('pip install requests')
    shop = os.environ.get('ETSY_SHOP_ID', '68033014')
    bad = 0
    for lid, s in state.items():
        if s.get('status') != 'applied': continue
        r = api('GET', f'/listings/{lid}')
        if r.status_code != 200: print(lid, 'GET', r.status_code); bad += 1; continue
        j = r.json()
        if j.get('title') != s['title'] or sorted(j.get('tags', [])) != sorted(s['tags']):
            bad += 1; print(lid, 'MISMATCH', j.get('title')[:60])
            s['status'] = 'mismatch'
    save_state(state)
    print(f'{bad} mismatches')

def cmd_status(m, state):
    c = collections.Counter(s.get('status') for s in state.values())
    print(f"applied {c['applied']}  error {c['error']}  mismatch {c['mismatch']}  pending {len(m) - sum(c.values())}")

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['validate', 'plan', 'apply', 'verify', 'status'])
    ap.add_argument('--yes', action='store_true'); ap.add_argument('--batch', type=int, default=20); ap.add_argument('--start', type=int, default=0)
    a = ap.parse_args()
    m = load_matrix(); st = load_state()
    if a.cmd == 'validate': sys.exit(0 if cmd_validate(m) else 1)
    if a.cmd == 'plan': cmd_plan(m, st, a.batch, a.start)
    if a.cmd == 'apply': cmd_apply(m, st, a.batch, a.start, a.yes)
    if a.cmd == 'verify': cmd_verify(m, st)
    if a.cmd == 'status': cmd_status(m, st)
