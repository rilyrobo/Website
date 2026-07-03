#!/usr/bin/env python3
"""
fetch_deviantart_api.py — Pulls gallery folders via DeviantArt's official
OAuth2 API instead of the (CloudFront-blocked) public RSS endpoint.

v3 changes:
  - Captures each deviation's `published_time` (Unix timestamp, per DA's
    documented deviation object schema) and stores it as an ISO date
    string (YYYY-MM-DD) under "date". Used by the frontend merge engine
    for chronological sorting across DA + ArtStation.
  - Warns (non-fatally) if a successful fetch returns items with zero
    parseable dates — signals a possible DA API schema change rather than
    failing silently and leaving every item permanently unsorted.

Usage:
    DA_CLIENT_ID=xxx DA_CLIENT_SECRET=yyy python3 fetch_deviantart_api.py \
        --username RilyRobo --folder-id <uuid> --output data/da-featured.json
    python3 fetch_deviantart_api.py --username RilyRobo --list-folders
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone

TOKEN_URL = "https://www.deviantart.com/oauth2/token"
GALLERY_URL = "https://www.deviantart.com/api/v1/oauth2/gallery/{folder_id}"
FOLDERS_URL = "https://www.deviantart.com/api/v1/oauth2/gallery/folders"


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


def get_access_token(client_id: str, client_secret: str) -> dict:
    params = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    }).encode()

    req = urllib.request.Request(TOKEN_URL, data=params, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RuntimeError(f"Token request failed (HTTP {e.code}): {body}") from e

    if "access_token" not in data:
        raise RuntimeError(f"No access_token in response: {data}")
    return data


def _extract_date(entry: dict) -> str:
    """
    DA's deviation object includes `published_time` as a Unix timestamp
    string. Converted to YYYY-MM-DD for simple, timezone-unambiguous
    lexical/chronological sorting downstream. Returns "" (not None) on any
    missing/malformed value so callers can rely on a consistent string type.
    """
    raw = entry.get("published_time")
    if not raw:
        return ""
    try:
        return datetime.fromtimestamp(int(raw), tz=timezone.utc).strftime("%Y-%m-%d")
    except (ValueError, TypeError, OSError):
        return ""


def list_folders(token: str, username: str) -> list:
    params = urllib.parse.urlencode({"username": username, "calculate_size": "0"})
    req = urllib.request.Request(f"{FOLDERS_URL}?{params}", method="GET")
    req.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RuntimeError(f"Folder list request failed (HTTP {e.code}): {body}") from e

    return [{"name": f.get("name", ""), "folderid": f.get("folderid", "")}
            for f in data.get("results", [])]


def fetch_gallery_folder(token: str, username: str, folder_id: str, limit: int = 24) -> list:
    items = []
    offset = 0

    while True:
        params = urllib.parse.urlencode({
            "username": username, "mode": "newest",
            "limit": limit, "offset": offset,
        })
        url = f"{GALLERY_URL.format(folder_id=folder_id)}?{params}"

        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {token}")

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            raise RuntimeError(f"Gallery request failed (HTTP {e.code}): {body}") from e

        for entry in data.get("results", []):
            title = entry.get("title", "").strip()
            link = entry.get("url", "").strip()

            image = ""
            if entry.get("preview"):
                image = entry["preview"].get("src", "")
            elif entry.get("thumbs"):
                image = entry["thumbs"][-1].get("src", "")

            if title and link and image:
                items.append({
                    "title": title, "link": link, "image": image,
                    "date": _extract_date(entry),
                })

        if not data.get("has_more"):
            break
        offset = data.get("next_offset", offset + limit)

    return items


def main():
    parser = argparse.ArgumentParser(description="Fetch a DeviantArt gallery folder via the OAuth2 API.")
    parser.add_argument("--username", required=True)
    parser.add_argument("--folder-id")
    parser.add_argument("--output")
    parser.add_argument("--list-folders", action="store_true")
    args = parser.parse_args()

    client_id = os.environ.get("DA_CLIENT_ID")
    client_secret = os.environ.get("DA_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("✗ DA_CLIENT_ID and DA_CLIENT_SECRET must be set (via .env or real env vars).", file=sys.stderr)
        sys.exit(1)

    try:
        token_data = get_access_token(client_id, client_secret)
        print(f"  Token acquired. Granted scope: {token_data.get('scope', '(not provided)')}", file=sys.stderr)

        if args.list_folders:
            folders = list_folders(token_data["access_token"], args.username)
            print(f"\nFound {len(folders)} folders for {args.username}:\n")
            for f in folders:
                print(f"  {f['folderid']}   {f['name']}")
            return

        if not args.folder_id or not args.output:
            print("✗ --folder-id and --output are required unless using --list-folders.", file=sys.stderr)
            sys.exit(1)

        items = fetch_gallery_folder(token_data["access_token"], args.username, args.folder_id)
    except RuntimeError as e:
        print(f"✗ {e}", file=sys.stderr)
        sys.exit(1)

    if not items:
        print(f"⚠ 0 items returned for folder {args.folder_id} — NOT overwriting {args.output}.", file=sys.stderr)
        sys.exit(1)

    dated = sum(1 for i in items if i["date"])
    if dated == 0:
        print(f"⚠ Warning: none of {len(items)} items had a parseable published_time — "
              f"check DA API response schema (items will still save, just unsorted-by-date).", file=sys.stderr)

    with open(args.output, "w") as f:
        json.dump({"items": items}, f)

    print(f"✓ {len(items)} items ({dated} dated) → {args.output}")


if __name__ == "__main__":
    main()