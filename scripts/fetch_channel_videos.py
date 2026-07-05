#!/usr/bin/env python3
"""
fetch_channel_videos.py — Auto-discovers videos from a YouTube channel via
its RSS feed (free, no API key, no quota). Cross-platform duplicate
merging lives in video_merge_utils.py, shared with fetch_rumble_channel.py.

Usage:
    python3 scripts/fetch_channel_videos.py --youtube-channel-id UCNlAFfQIh6Eycmd2yntbK7Q
"""
import argparse
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET

from video_merge_utils import merge_discovered, dedupe_slugs, load_json, save_json, OUTPUT_FILE, OVERRIDES_FILE

YT_NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "media": "http://search.yahoo.com/mrss/",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


def fetch_youtube_channel_feed(channel_id: str) -> list:
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            root = ET.fromstring(resp.read())
    except (urllib.error.URLError, urllib.error.HTTPError, ET.ParseError) as e:
        print(f"⚠ Could not fetch/parse YouTube channel feed: {e}", file=sys.stderr)
        return []

    items = []
    for entry in root.findall("atom:entry", YT_NS):
        video_id = entry.findtext("yt:videoId", default="", namespaces=YT_NS)
        title = entry.findtext("atom:title", default="", namespaces=YT_NS)
        published = entry.findtext("atom:published", default="", namespaces=YT_NS)
        media_group = entry.find("media:group", YT_NS)
        thumb = None
        if media_group is not None:
            thumb_el = media_group.find("media:thumbnail", YT_NS)
            if thumb_el is not None:
                thumb = thumb_el.get("url")

        if video_id and title:
            items.append({
                "platform": "youtube",
                "videoId": video_id,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "title": title,
                "thumbnail": thumb or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "date": published[:10] if published else None,
            })
    return items


def main():
    parser = argparse.ArgumentParser(description="Auto-discover videos from a YouTube channel's RSS feed.")
    parser.add_argument("--youtube-channel-id", required=True)
    args = parser.parse_args()

    discovered = fetch_youtube_channel_feed(args.youtube_channel_id)
    if not discovered:
        print("⚠ 0 videos discovered — leaving existing data untouched.", file=sys.stderr)
        sys.exit(1)

    existing_doc = load_json(OUTPUT_FILE, {"items": []})
    overrides_doc = load_json(OVERRIDES_FILE, {"sources": []})

    merged = merge_discovered(discovered, existing_doc.get("items", []), overrides_doc)
    dedupe_slugs(merged)

    save_json(OUTPUT_FILE, {"items": merged})
    print(f"\n✓ {len(merged)} total videos → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()