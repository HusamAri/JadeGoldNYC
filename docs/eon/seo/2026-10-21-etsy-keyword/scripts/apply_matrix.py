#!/usr/bin/env python3
"""Apply the optimization matrix to Etsy, listing by listing, with a resumable state file.

Usage:
  python3 scripts/apply_matrix.py validate                 # rules check only, no network
  python3 scripts/apply_matrix.py plan [--top N]           # show what would change, in priority order
  python3 scripts/apply_matrix.py apply --top N [--yes]    # write the top N pending listings (default dry-run unless --yes)
  python3 scripts/apply_matrix.py verify                   # re-read every applied listing from Etsy and compare
  python3 scripts/apply_matrix.py status                   # counts per state
  python3 scripts/apply_matrix.py skip <id> "reason"       # mark a listing as skipped (manual decision)

State file: data/apply-state.json  {listing_id: {status: pending|applied|verified|failed|skipped, attempts, last_error, applied_at, before:{title,tags}}}
Never deletes or recreates listings. Never touches price, quantity, images, variations, description.
Rate: 1 write every 1.5 s (Etsy allows 10 qps; we stay far below). Max 40 writes per run by default (--top).
"""
import json, sys, time, re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
MATRIX = DATA / "optimization-matrix.json"
STATE = DATA / "apply-state.json"
SECTIONS = {v: int(k) for k, v in json.loads((DATA / "listings-master.json").read_text())["sections"].items()}

BANNED_TAG_WORDS = {"hi", "to", "and", "a", "christma", "religiou", "u"}
BANNED_ANYWHERE = re.compile(r"tungsten|titanium|silver|silicone|plated|moissanite|cartier|tiffany|mejuri|benchmark|hypoallergenic|diamond(?! cut)", re.I)
MASTER = {l["id"]: l for l in json.loads((DATA / "listings-master.json").read_text())["listings"]}
PANEL = json.loads((DATA / "panel-variants.json").read_text())["listings"]
BANK = set(json.loads((DATA / "tag-banks.json").read_text())) if (DATA / "tag-banks.json").exists() else set()


def load_matrix():
    return json.loads(MATRIX.read_text(encoding="utf-8"))


def load_state():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save_state(s):
    STATE.write_text(json.dumps(s, indent=1, ensure_ascii=False))


def validate_one(o):
    errs = []
    t = o["new_title"]
    if not (1 <= len(t) <= 140): errs.append(f"title length {len(t)}")
    if re.search(r"[|%$^`]", t) or "&#" in t: errs.append("title has banned chars")
    if t.upper() == t: errs.append("title all caps")
    tags = o["new_tags"]
    if len(tags) != 13: errs.append(f"{len(tags)} tags")
    if len(set(tags)) != len(tags): errs.append("duplicate tags")
    for tag in tags:
        if len(tag) > 20: errs.append(f"tag >20: {tag}")
        if not re.fullmatch(r"[a-z0-9' ]+", tag): errs.append(f"tag chars: {tag}")
        if " " not in tag and tag not in ("milgrain",): errs.append(f"single-word tag: {tag}")
        if tag.split()[-1] in BANNED_TAG_WORDS: errs.append(f"ends with filler: {tag}")
    if o["group"].startswith("wedding-") and not t.lower().startswith("mens "):
        errs.append("wedding title must start with Mens (55% of search visits are mens queries)")
    if o["group"].startswith("wedding-") and "mens wedding band" not in tags:
        errs.append("wedding listing missing head tag 'mens wedding band'")
    # Checks added 2026-10-21 after the first matrix passed this validator while being wrong.
    if BANNED_ANYWHERE.search(t): errs.append("title has a banned word")
    for tag in tags:
        if BANNED_ANYWHERE.search(tag): errs.append(f"banned word in tag: {tag}")
    src = MASTER.get(o["id"], {})
    salad = set(src.get("salad_tags", []))
    old = {x.lower().strip() for x in src.get("tags", [])}
    for tag in tags:
        if tag in salad: errs.append(f"salad tag carried over: {tag}")
        if src.get("tag_quality") != "OK" and tag in old and tag not in BANK: errs.append(f"old tag kept on {src.get('tag_quality')} listing: {tag}")
    pv = PANEL.get(o["id"], {})
    if pv.get("karats"):
        want = " ".join(k.upper() for k in pv["karats"])
        if o["group"].startswith("wedding-") and want not in t:
            errs.append(f"title karat does not match variants ({want})")
        for k in ("10K", "14K", "18K"):
            if re.search(rf"\b{k}\b", t) and k.lower() not in pv["karats"]:
                errs.append(f"title claims {k}, variants do not sell it")
    if pv.get("widths_mm"):
        offered = set(pv["widths_mm"])
        mm = re.search(r"(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)mm Width", t) or re.search(r"(\d+(?:\.\d+)?)mm Width", t)
        if mm:
            lo, hi = float(mm.group(1)), float(mm.group(mm.lastindex))
            if (lo, hi) != (min(offered), max(offered)):
                errs.append(f"title width {lo:g}-{hi:g} != variants {min(offered):g}-{max(offered):g}")
        for tag in tags:
            w = re.match(r"(\d+)mm ", tag)
            if w and float(w.group(1)) not in offered:
                errs.append(f"width tag not sold: {tag}")
    return errs


def cmd_validate():
    m = load_matrix(); bad = 0
    for o in m:
        e = validate_one(o)
        if e:
            bad += 1; print(o["id"], e)
    print(f"{len(m)} listings, {bad} with rule violations")
    return bad == 0


def cmd_plan(top):
    m = load_matrix(); s = load_state()
    pend = [o for o in m if s.get(o["id"], {}).get("status", "pending") == "pending"][:top]
    for o in pend:
        print(f"\n[{o['priority']}] {o['id']} {o['group']} visits3m={o['visits_3m']} tagq={o['tag_quality']}")
        print("  OLD:", o["current_title"]); print("  NEW:", o["new_title"])
        print("  TAGS:", " | ".join(o["new_tags"]))
        if o["section_fix"]: print("  SECTION:", o["section_fix"])
        if o["attributes_to_fill"]: print("  ATTRIBUTES (manual in Etsy UI):", "; ".join(o["attributes_to_fill"]))
    print(f"\n{len(pend)} pending shown")


def cmd_apply(top, yes):
    from etsy_client import get_listing, update_listing  # local import so validate/plan work offline
    m = load_matrix(); s = load_state()
    if not cmd_validate():
        sys.exit("Fix rule violations before applying.")
    pend = [o for o in m if s.get(o["id"], {}).get("status", "pending") in ("pending", "failed")][:top]
    for o in pend:
        st = s.setdefault(o["id"], {"status": "pending", "attempts": 0})
        if st["attempts"] >= 3:
            st["status"] = "failed"; continue
        try:
            live = get_listing(o["id"])
            st["before"] = {"title": live.get("title"), "tags": live.get("tags")}
            if live.get("state") != "active":
                st["status"] = "skipped"; st["last_error"] = f"state={live.get('state')}"; save_state(s); continue
            section_id = None
            if o["section_fix"]:
                want = o["section_fix"].split(" -> ")[1]
                section_id = SECTIONS.get(want)
            print(("DRY " if not yes else "WRITE ") + o["id"], "->", o["new_title"][:70])
            if yes:
                update_listing(o["id"], title=o["new_title"], tags=o["new_tags"], section_id=section_id)
                st["status"] = "applied"; st["applied_at"] = datetime.now(timezone.utc).isoformat()
                time.sleep(1.5)
        except Exception as e:  # noqa
            st["attempts"] += 1; st["last_error"] = str(e)[:300]; st["status"] = "failed" if st["attempts"] >= 3 else "pending"
            print("ERROR", o["id"], st["last_error"])
            time.sleep(3)
        save_state(s)
    cmd_status()


def cmd_verify():
    from etsy_client import get_listing
    m = {o["id"]: o for o in load_matrix()}; s = load_state(); ok = 0
    for lid, st in s.items():
        if st.get("status") != "applied": continue
        live = get_listing(lid)
        same = live.get("title") == m[lid]["new_title"] and sorted(live.get("tags", [])) == sorted(m[lid]["new_tags"])
        st["status"] = "verified" if same else "failed"
        st["last_error"] = "" if same else "live listing differs from matrix after apply"
        ok += same
        time.sleep(0.5)
    save_state(s); print("verified", ok); cmd_status()


def cmd_status():
    s = load_state(); m = load_matrix()
    counts = {}
    for o in m:
        counts[s.get(o["id"], {}).get("status", "pending")] = counts.get(s.get(o["id"], {}).get("status", "pending"), 0) + 1
    print(json.dumps(counts))


if __name__ == "__main__":
    a = sys.argv[1:]
    cmd = a[0] if a else "help"
    top = int(a[a.index("--top") + 1]) if "--top" in a else 40
    if cmd == "validate": cmd_validate()
    elif cmd == "plan": cmd_plan(top)
    elif cmd == "apply": cmd_apply(top, "--yes" in a)
    elif cmd == "verify": cmd_verify()
    elif cmd == "status": cmd_status()
    elif cmd == "skip":
        s = load_state(); s[a[1]] = {"status": "skipped", "attempts": 0, "last_error": a[2] if len(a) > 2 else "manual"}; save_state(s); print("skipped", a[1])
    else: print(__doc__)
