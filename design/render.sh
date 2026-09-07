#!/usr/bin/env bash
# Renders a design page to PNG at 2x and trims the unused canvas below the content.
#
# Chrome's --screenshot captures exactly the window height rather than the document
# height, so pages are rendered tall and then cropped back to their real extent.
#
#   ./render.sh brand-sheet.html /tmp/brand.png [width] [max-height]

set -euo pipefail
page="$1"
out="$2"
width="${3:-1440}"
maxheight="${4:-3400}"
here="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "$here/fonts/fonts.css" ]]; then
  echo "fonts missing — run ./fetch-fonts.sh first" >&2
  exit 1
fi

rm -f "$out"

# Chrome writes the PNG promptly and then hangs for minutes on shutdown in this
# container (no dbus, no GPU). Waiting for the file to appear and stop growing, then
# killing the browser, turns a six-minute render into a ten-second one.
google-chrome \
  --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage \
  --no-first-run --no-default-browser-check --disable-extensions \
  --disable-background-networking --disable-sync --disable-default-apps \
  --disable-features=Translate,MediaRouter,OptimizationHints,DialMediaRouteProvider \
  --user-data-dir="$(mktemp -d)" \
  --hide-scrollbars --force-device-scale-factor=2 \
  --window-size="${width},${maxheight}" --virtual-time-budget=4000 \
  --screenshot="$out" "$here/$page" >/dev/null 2>&1 &
chrome_pid=$!

size=0
for _ in $(seq 1 120); do
  sleep 1
  [[ -f "$out" ]] || continue
  now=$(stat -c%s "$out")
  if [[ "$now" -gt 0 && "$now" -eq "$size" ]]; then break; fi
  size="$now"
done

kill -9 "$chrome_pid" 2>/dev/null || true
wait "$chrome_pid" 2>/dev/null || true

if [[ ! -s "$out" ]]; then
  echo "render failed: no output at $out" >&2
  exit 1
fi

python3 - "$out" <<'PY'
import sys
from PIL import Image, ImageChops

path = sys.argv[1]
im = Image.open(path).convert("RGB")
w, h = im.size
# The top-left pixel is page padding in every layout here, so it is the background.
# Differencing against a solid field of it and taking the bounding box finds the
# real content extent in one C-level pass.
bg = im.getpixel((2, 2))
box = ImageChops.difference(im, Image.new("RGB", im.size, bg)).getbbox()
bottom = h if box is None else min(h, box[3] + 128)  # keep the page's bottom margin
im.crop((0, 0, w, bottom)).save(path)
print(f"{path}: {w}x{bottom}")
PY
