#!/usr/bin/env python3
"""Screen named candidates against the App Store, in both storefronts that matter.

Different from the previous round in one way that turned out to matter: it also
reports how heavily the word is used in the store *without* an exact match, because
a word that returns forty adjacent products is a word whose search results you will
never own even if nobody has taken the exact name.
"""

import json
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor


def search(name, country):
    url = "https://itunes.apple.com/search?" + urllib.parse.urlencode(
        {"term": name, "entity": "software", "limit": 50, "country": country}
    )
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r).get("results", [])
    except Exception:
        return None


def check(name):
    rows = {}
    for country in ("us", "fr", "gb"):
        results = search(name, country)
        if results is None:
            rows[country] = ("?", 0, "")
            continue
        exact = [
            t["trackName"]
            for t in results
            if re.match(rf"^{re.escape(name)}\b", t.get("trackName", ""), re.I)
        ]
        rows[country] = (
            "USED" if exact else "clear",
            len(results),
            exact[0][:44] if exact else "",
        )
    return name, rows


if __name__ == "__main__":
    names = [l.strip() for l in sys.stdin if l.strip() and not l.startswith("#")]
    with ThreadPoolExecutor(max_workers=5) as ex:
        for name, rows in ex.map(check, names):
            flags = " ".join(f"{c}:{rows[c][0]}" for c in ("us", "fr", "gb"))
            noise = max(rows[c][1] for c in rows)
            hit = next((rows[c][2] for c in rows if rows[c][2]), "")
            print(f"{name:<12} {flags:<34} noise={noise:<3} {hit}")
