#!/usr/bin/env python3
"""Minimal Etsy Open API v3 client for EON listing optimization.

Setup (one time, by the shop owner):
  1. https://www.etsy.com/developers/your-apps  -> create an app (personal use). Copy the Keystring (API key).
  2. export ETSY_API_KEY=...   (never commit it; put it in .env, which is gitignored)
  3. python3 scripts/etsy_client.py auth      -> opens the OAuth2 PKCE consent URL, paste the redirect URL back.
     Scopes requested: listings_r listings_w shops_r
     Token is stored in .etsy_token.json (gitignored).
  4. python3 scripts/etsy_client.py whoami    -> prints shop id/name to confirm.

Only title, tags, materials and section are written by this project. Prices, quantities, images,
variations and descriptions are never touched by the scripts.
"""
import base64, hashlib, json, os, secrets, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKEN_FILE = ROOT / ".etsy_token.json"
API = "https://openapi.etsy.com/v3/application"
AUTH_URL = "https://www.etsy.com/oauth/connect"
TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token"
REDIRECT = "http://localhost:3003/oauth/redirect"
SCOPES = "listings_r listings_w shops_r"
SHOP_ID = 61324215


def _load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def api_key():
    _load_env()
    k = os.environ.get("ETSY_API_KEY")
    if not k:
        sys.exit("ETSY_API_KEY missing. Put it in .env as ETSY_API_KEY=... (see docstring).")
    return k


def _post_form(url, data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def auth():
    key = api_key()
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = secrets.token_hex(8)
    params = {"response_type": "code", "redirect_uri": REDIRECT, "scope": SCOPES, "client_id": key,
              "state": state, "code_challenge": challenge, "code_challenge_method": "S256"}
    print("\nOpen this URL in the browser logged in as the EON shop owner, approve, then paste the FULL redirect URL here:\n")
    print(AUTH_URL + "?" + urllib.parse.urlencode(params))
    redirected = input("\nRedirect URL: ").strip()
    code = urllib.parse.parse_qs(urllib.parse.urlparse(redirected).query)["code"][0]
    tok = _post_form(TOKEN_URL, {"grant_type": "authorization_code", "client_id": key, "redirect_uri": REDIRECT,
                                 "code": code, "code_verifier": verifier})
    tok["obtained_at"] = int(time.time())
    TOKEN_FILE.write_text(json.dumps(tok, indent=1))
    print("Token saved to", TOKEN_FILE)


def token():
    if not TOKEN_FILE.exists():
        sys.exit("No token. Run: python3 scripts/etsy_client.py auth")
    tok = json.loads(TOKEN_FILE.read_text())
    if time.time() > tok["obtained_at"] + tok.get("expires_in", 3600) - 120:
        tok = _post_form(TOKEN_URL, {"grant_type": "refresh_token", "client_id": api_key(), "refresh_token": tok["refresh_token"]})
        tok["obtained_at"] = int(time.time())
        TOKEN_FILE.write_text(json.dumps(tok, indent=1))
    return tok["access_token"]


def call(method, path, data=None, retries=4):
    url = API + path
    headers = {"x-api-key": api_key(), "Authorization": "Bearer " + token()}
    body = None
    if data is not None:
        body = urllib.parse.urlencode(data, doseq=True).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode() or "{}")
        except urllib.error.HTTPError as e:
            txt = e.read().decode(errors="replace")
            if e.code in (429, 500, 502, 503) and attempt < retries - 1:
                time.sleep(2 ** attempt * 2)
                continue
            raise RuntimeError(f"{method} {path} -> {e.code}: {txt}") from None
        except urllib.error.URLError:
            if attempt < retries - 1:
                time.sleep(2 ** attempt * 2)
                continue
            raise


def get_listing(listing_id):
    return call("GET", f"/listings/{listing_id}?includes=Images")


def update_listing(listing_id, title=None, tags=None, materials=None, section_id=None):
    data = {}
    if title is not None: data["title"] = title
    if tags is not None: data["tags"] = ",".join(tags)
    if materials is not None: data["materials"] = ",".join(materials)
    if section_id is not None: data["shop_section_id"] = section_id
    return call("PATCH", f"/shops/{SHOP_ID}/listings/{listing_id}", data)


def whoami():
    me = call("GET", "/users/me")
    shop = call("GET", f"/shops/{SHOP_ID}")
    print(json.dumps({"user_id": me.get("user_id"), "shop": shop.get("shop_name"), "listing_active_count": shop.get("listing_active_count")}, indent=1))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "auth": auth()
    elif cmd == "whoami": whoami()
    elif cmd == "get": print(json.dumps(get_listing(sys.argv[2]), indent=1)[:4000])
    else: print(__doc__)
