#!/usr/bin/env python3
import json
import re
import sys
import xml.etree.ElementTree as ET

NS = {"media": "http://search.yahoo.com/mrss/"}


def parse_feed(text: str) -> dict:
    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        return {"error": str(exc), "items": []}

    items = []
    for item in root.findall(".//item"):
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()

        img = None
        media_content = item.find("media:content", NS)
        if media_content is not None:
            img = media_content.get("url")

        if not img:
            thumbnail = item.find("media:thumbnail", NS)
            if thumbnail is not None:
                img = thumbnail.get("url")

        if not img:
            enclosure = item.find("enclosure")
            if enclosure is not None:
                img = enclosure.get("url")

        if not img:
            description = item.findtext("description", "") or ""
            match = re.search(r'<img[^>]+src="([^"]+)"', description)
            if match:
                img = match.group(1)

        if title and link and img:
            items.append({"title": title, "link": link, "image": img})

    return {"items": items}


def main() -> None:
    text = sys.stdin.read()
    print(json.dumps(parse_feed(text)))


if __name__ == "__main__":
    main()
