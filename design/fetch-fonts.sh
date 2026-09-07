#!/usr/bin/env bash
# Pulls Fraunces and Inter locally so the design pages render identically offline
# and so headless Chrome does not stall on a network font fetch. The font files are
# not committed; this script reproduces them.

set -euo pipefail
cd "$(dirname "$0")/fonts"

SPEC="family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
# A UA without woff2 support, so Google serves plain TTF and no decoding is needed.
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36"

curl -sSf --max-time 60 -A "$UA" "https://fonts.googleapis.com/css2?${SPEC}" -o goog.css

i=0
for url in $(grep -oE 'https://fonts\.gstatic\.com[^)]*' goog.css | sort -u); do
  family=$(echo "$url" | sed -E 's#.*/s/([a-z]+)/.*#\1#')
  curl -sSf --max-time 60 -o "${family}-${i}.ttf" "$url"
  i=$((i + 1))
done

python3 - <<'PY'
import re, pathlib
css = pathlib.Path("goog.css").read_text()
urls = sorted(set(re.findall(r"https://fonts\.gstatic\.com[^)]*", css)))
files = sorted(
    (p.name for p in pathlib.Path(".").glob("*.ttf")),
    key=lambda n: int(n.rsplit("-", 1)[1].split(".")[0]),
)
assert len(urls) == len(files), (len(urls), len(files))
for url, name in zip(urls, files):
    css = css.replace(url, name)
pathlib.Path("fonts.css").write_text(css)
print(f"wrote fonts.css with {len(files)} faces")
PY
