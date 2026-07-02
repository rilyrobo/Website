#!/usr/bin/env python3
"""
fetch_deviantart_api.py — Pulls gallery folders via DeviantArt's official
OAuth2 API instead of the (CloudFront-blocked) public RSS endpoint.

v2 changes:
  - Sends access_token via Authorization: Bearer header instead of a query
    parameter. Query-string tokens are (a) increasingly rejected by APIs
    that have hardened their auth handling, and (b) bad practice regardless
    since they leak into access logs — so this is correct either way, not
    just a guess at fixing the observed 401.
  - Prints the granted `scope` from the token response (not the secret/token
    itself) so a scope-related 401 is diagnosable without another blind
    round trip.

Usage:
    DA_CLIENT_ID=xxx DA_CLIENT_SECRET=yyy python3 fetch_deviantart_api.py \
        --username RilyRobo \
        --folder-id 31357645 \
        --output data/da-featured.json
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error

TOKEN_URL = "https://www.deviantart.com/oauth2/token"
GALLERY_URL = "https://www.deviantart.com/api/v1/oauth2/gallery/{folder_id}"


def _load_dotenv(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip()
            os.environ.setdefault(key, value)

_load_dotenv()

def list_folders(token: str, username: str) -> list:
    """
    Returns every gallery folder for a user, as the API actually identifies
    them — used to verify/replace the legacy numeric IDs scraped from the
    old RSS query format, which may not correspond to real API folder IDs
    at all (see: identical item counts returned for 4 different "folder"
    IDs, which strongly suggests the API was silently ignoring an
    unrecognized folder_id and returning the whole gallery each time).
    """
    params = urllib.parse.urlencode({
        "username": username,
        "calculate_size": "0",
    })
    url = f"https://www.deviantart.com/api/v1/oauth2/gallery/folders?{params}"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RuntimeError(f"Folder list request failed (HTTP {e.code}): {body}") from e

    return [{"name": f.get("name", ""), "folderid": f.get("folderid", "")}
            for f in data.get("results", [])]

def get_access_token(client_id: str, client_secret: str) -> dict:
    """
    Returns the full token response (not just the token string) so callers
    can inspect the granted `scope` — essential for diagnosing 401s that
    are actually scope problems rather than transport problems.
    """
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


def fetch_gallery_folder(token: str, username: str, folder_id: str, limit: int = 24) -> list:
    """
    Fetches one gallery folder. Token is sent via Authorization header
    (not query string) — this is both the likely fix for the observed 401
    and the more secure transport regardless of whether it was the cause.
    """
    items = []
    offset = 0

    while True:
        params = urllib.parse.urlencode({
            "username": username,
            "mode": "newest",
            "limit": limit,
            "offset": offset,
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
                items.append({"title": title, "link": link, "image": image})

        if not data.get("has_more"):
            break
        offset = data.get("next_offset", offset + limit)

    return items


def main():
    parser = argparse.ArgumentParser(description="Fetch a DeviantArt gallery folder via the OAuth2 API.")
    parser.add_argument("--username", required=True)
    parser.add_argument("--folder-id", help="Folder UUID from --list-folders (required unless using --list-folders)")
    parser.add_argument("--output", help="Path to write the JSON result (required unless using --list-folders)")
    parser.add_argument("--list-folders", action="store_true",
                         help="Print all gallery folders with their real API folder IDs, then exit")
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

    with open(args.output, "w") as f:
        json.dump({"items": items}, f)

    print(f"✓ {len(items)} items → {args.output}")


if __name__ == "__main__":
    main()