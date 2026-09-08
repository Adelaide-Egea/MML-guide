#!/usr/bin/env python3
"""Renders the Notula app icons from the punctum mark.

Spec (design/notula-brand.md): putty tile, punctum + rule in ink, optically
centred ~4% above true centre.

    python3 apps/web/scripts/icons.py
"""

import io
import pathlib

from PIL import Image, ImageDraw

WEB = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = WEB / "public"
APP = WEB / "app"

PUTTY = (224, 210, 188, 255)  # --putty #e0d2bc
INK = (44, 39, 33, 255)  # --ink #2c2721

SS = 4


def render(size: int, fill: float) -> bytes:
    s = size * SS
    img = Image.new("RGBA", (s, s), PUTTY)
    draw = ImageDraw.Draw(img)

    # Mark geometry in a 48-unit box, then scale into the tile.
    # Optical lift: centre the mark slightly above geometric mid.
    box = 48.0
    scale = fill * s / box
    ox = s / 2
    oy = s / 2 - 0.04 * s  # ~4% above centre

    def to(x, y):
        return (ox + (x - 24) * scale, oy + (y - 24) * scale)

    # Rule
    x0, y0 = to(10, 22)
    x1, y1 = to(38, 22)
    stroke = max(2, 3 * scale)
    draw.line([(x0, y0), (x1, y1)], fill=INK, width=int(round(stroke)))
    # Round caps
    r = stroke / 2
    for x, y in ((x0, y0), (x1, y1)):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=INK)

    # Punctum (square)
    half = 4 * scale
    cx, cy = to(24, 20)
    draw.rectangle([cx - half, cy - half, cx + half, cy + half], fill=INK)

    buf = io.BytesIO()
    img.resize((size, size), Image.LANCZOS).save(buf, "PNG", optimize=True)
    return buf.getvalue()


PUBLIC.mkdir(parents=True, exist_ok=True)
for target, name, size, fill in [
    (PUBLIC, "icon-192.png", 192, 0.55),
    (PUBLIC, "icon-512.png", 512, 0.55),
    (PUBLIC, "icon-maskable.png", 512, 0.40),
    (APP, "apple-icon.png", 180, 0.55),
]:
    (target / name).write_bytes(render(size, fill))
    print(f"wrote {target / name}")
