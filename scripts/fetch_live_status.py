#!/usr/bin/env python3
"""
fetch_live_status.py — Checks whether RilyRobo is currently live on
Twitch, YouTube, and Picarto (Kick best-effort), and writes the result to
data/live-status.json for the frontend (scripts/scriptlive.js) to read.

Rumble is intentionally NOT checked — it has no public live-status API.

Safety contract (matches every other fetch script in this repo): if a
platform's check fails for any reason (network error, API change, bot
detection), that platform's PREVIOUS entry in live-status.json is left
untouched rather than overwritten with a guess. A transient failure should
never incorrectly hide (or show) the live section.

Usage:
    TWITCH_CLIENT_ID=xxx TWITCH_CLIENT_SECRET=yyy python3 fetch_live_status.py
"""
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone

OUTPUT_FILE = "data/live-status.json"

TWITCH_USERNAME = "RilyRobo"
YOUTUBE_CHANNEL_ID = "UCNlAFfQIh6Eycmd2yntbK7Q"
PICARTO_USERNAME = "RilyRobo"

# ⚠ UNVERIFIED — could not be confirmed via web search (Kick profile pages
# aren't reliably indexed) or direct fetch (Cloudflare bot detection blocks
# it, same as ArtStation/Rumble elsewhere in this repo). Configurable via
# the KICK_USERNAME repo variable (Settings > Secrets and variables >
# Actions > Variables) so correcting it later needs no code change — see
# check-live-status.yml. Falls back to this literal if the variable is
# unset. MUST be kept in sync by hand with scripts/scriptlive.js's
# LIVE_CONFIG.kick.username — that file is static client JS with no build
# step, so it can't read this env var directly.
KICK_USERNAME = os.environ.get("KICK_USERNAME") or "RilyRobo"

# When set (1/true/yes), runs every platform check and prints the result
# exactly as it would be written, but never touches OUTPUT_FILE and (per
# check-live-status.yml) never commits. Exists specifically so a newly
# guessed/updated KICK_USERNAME or RUMBLE_CHANNEL_URL can be verified
# safely — a wrong guess just prints an error instead of landing in git
# history or silently overwriting a previously-good live-status.json.
#   Local:  DRY_RUN=1 python3 scripts/fetch_live_status.py
#   CI:     run the "Check Live Status" workflow manually (workflow_dispatch)
#           with the "dry_run" input checked.
DRY_RUN = os.environ.get("DRY_RUN", "").strip().lower() in ("1", "true", "yes")

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def _load_dotenv(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

_load_dotenv()


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_existing() -> dict:
    if not os.path.exists(OUTPUT_FILE):
        return {}
    try:
        with open(OUTPUT_FILE) as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}


def save(data: dict) -> None:
    os.makedirs(os.path.dirname(OUTPUT_FILE) or ".", exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ── Twitch (Helix API, client_credentials grant — same OAuth pattern as
#    fetch_deviantart_api.py) ─────────────────────────────────────────────────
def get_twitch_token(client_id: str, client_secret: str) -> str:
    params = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    }).encode()
    req = urllib.request.Request("https://id.twitch.tv/oauth2/token", data=params, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())["access_token"]


def check_twitch_live(client_id: str, client_secret: str, username: str) -> bool:
    token = get_twitch_token(client_id, client_secret)
    params = urllib.parse.urlencode({"user_login": username})
    req = urllib.request.Request(f"https://api.twitch.tv/helix/streams?{params}", method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Client-Id", client_id)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    return len(data.get("data", [])) > 0


# ── YouTube (no API key/quota — checks the channel's /live page for a
#    live marker embedded in YouTube's inline page data) ─────────────────────
def check_youtube_live(channel_id: str) -> bool:
    url = f"https://www.youtube.com/channel/{channel_id}/live"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode(errors="replace")
    # Best-effort HTML scraping — same fragility category as this repo's
    # ArtStation Playwright fetch. If YouTube changes their markup, this
    # degrades to "assume not live" (caught by the try/except in main()),
    # not a crash.
    return '"isLive":true' in html


# ── Picarto (public, unauthenticated API) ────────────────────────────────────
def check_picarto_live(username: str) -> bool:
    req = urllib.request.Request(
        f"https://api.picarto.tv/api/v1/channel/name/{username}",
        headers={"User-Agent": UA},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    return bool(data.get("online"))


# ── Kick (unofficial JSON endpoint — may hit Cloudflare bot-detection,
#    same risk category as ArtStation) ────────────────────────────────────────
def check_kick_live(username: str) -> bool:
    """
    NOTE: KICK_USERNAME is unverified (see the module-level comment above).
    A wrong handle and a genuine "not currently streaming" state render
    identically on the frontend (both show as "offline"), which would hide
    a misconfigured username indefinitely. To prevent that, a 404 here is
    raised as its own distinct, clearly-labeled error rather than folded
    into the generic "check failed, keeping previous value" path in
    main() — so a bad handle surfaces unambiguously in the scheduled
    workflow's logs instead of silently masquerading as "just not live"
    forever.
    """
    req = urllib.request.Request(
        f"https://kick.com/api/v2/channels/{username}",
        headers={"User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise RuntimeError(
                f"Kick returned 404 for username '{username}' — this almost certainly "
                f"means KICK_USERNAME is wrong, not a transient failure. Confirm the "
                f"actual handle at https://kick.com/ and update the KICK_USERNAME repo "
                f"variable (Settings > Secrets and variables > Actions > Variables)."
            ) from e
        raise
    return data.get("livestream") is not None


def main():
    existing = load_existing()
    result = dict(existing)  # start from previous state; only touch what succeeds this run

    checks = []
    client_id = os.environ.get("TWITCH_CLIENT_ID")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET")
    if client_id and client_secret:
        checks.append(("twitch", lambda: check_twitch_live(client_id, client_secret, TWITCH_USERNAME)))
    else:
        print("⚠ TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET not set — skipping Twitch check.", file=sys.stderr)

    checks.append(("youtube", lambda: check_youtube_live(YOUTUBE_CHANNEL_ID)))
    checks.append(("picarto", lambda: check_picarto_live(PICARTO_USERNAME)))
    checks.append(("kick", lambda: check_kick_live(KICK_USERNAME)))

    any_success = False
    for platform, check_fn in checks:
        try:
            live = check_fn()
            result[platform] = {"live": live, "checkedAt": now_iso()}
            any_success = True
            print(f"  {platform}: {'LIVE' if live else 'offline'}")
        except Exception as e:
            prev = existing.get(platform, {"live": False, "checkedAt": None})
            result[platform] = prev
            print(f"⚠ {platform} check failed ({e}) — keeping previous value "
                  f"({'live' if prev.get('live') else 'offline'}).", file=sys.stderr)

    if not any_success and not existing:
        print("✗ No platform checks succeeded and no previous data exists — not writing an empty file.", file=sys.stderr)
        sys.exit(1)

    if DRY_RUN:
        print(f"\n🧪 DRY_RUN set — NOT writing {OUTPUT_FILE}. Would have written:")
        print(json.dumps(result, indent=2))
        return

    save(result)
    print(f"✓ Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()