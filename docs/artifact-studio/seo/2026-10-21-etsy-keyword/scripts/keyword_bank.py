#!/usr/bin/env python3
"""keyword_bank.py
Builds data/keyword-bank.json from the Alura exports (data/raw/alura-keywords-*.txt),
the eRank batches (data/raw/erank-batch*.tsv) and the Etsy search-term file.
Each keyword gets: alura volume, 3-mo change, competition, KD, score; erank avg searches, clicks, competition, KD;
etsy_visits (from the shop's own Etsy Search report); tag_valid (<= 20 chars).
"""
import json, csv, glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)

def num(s):
    s = str(s).replace(',', '').replace('%', '').replace('+', '').strip()
    if s in ('', '-', 'unknown') or s.startswith('<'):
        return None
    try:
        return float(s)
    except ValueError:
        return None

def main():
    bank = {}
    for path in sorted(glob.glob(D('raw', 'alura-keywords-*.txt'))):
        for line in open(path):
            line = line.strip()
            if not line:
                continue
            kw, vol, chg, comp, kd, score = line.split('|')
            k = kw.lower().strip()
            bank.setdefault(k, {'keyword': k})
            bank[k].update({'alura_volume': num(vol), 'alura_change_3mo': num(chg), 'alura_competition': num(comp),
                            'alura_kd': num(kd), 'alura_score': num(score)})
    for path in sorted(glob.glob(D('raw', 'erank-batch*.tsv'))):
        with open(path) as f:
            for r in csv.DictReader(f, delimiter='\t'):
                k = r['keyword'].lower().strip()
                bank.setdefault(k, {'keyword': k})
                bank[k].update({'erank_sep2026': num(r['sep2026_searches']), 'erank_avg_searches': num(r['avg_searches']),
                                'erank_avg_clicks': num(r['avg_clicks']), 'erank_ctr': num(r['avg_ctr']),
                                'erank_competition': num(r['etsy_competition']), 'erank_kd': num(r['kd']),
                                'google_searches': num(r['google_searches'])})
    with open(D('etsy-search-terms-30d.tsv')) as f:
        for r in csv.DictReader(f, delimiter='\t'):
            k = r['search_term'].lower().strip()
            bank.setdefault(k, {'keyword': k})
            bank[k]['etsy_visits_30d'] = int(r['visits'])
    for k, v in bank.items():
        v['tag_valid'] = len(k) <= 20
        # opportunity = demand relative to competition, Alura first (breadth), eRank as a sanity check
        vol = v.get('alura_volume') or (v.get('erank_avg_searches') or 0) * 100
        comp = v.get('alura_competition') or v.get('erank_competition') or 1
        v['opportunity'] = round(vol / (comp + 1000), 3)
    json.dump(bank, open(D('keyword-bank.json'), 'w'), indent=1)
    print(len(bank), 'keywords;', sum(1 for v in bank.values() if v['tag_valid']), 'tag-valid')

if __name__ == '__main__':
    main()
