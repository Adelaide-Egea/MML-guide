#!/usr/bin/env python3
"""Renders the app icons from the arc mark.

Kept as a script rather than hand-exported PNGs so the icons cannot drift from the
mark. Run it after changing app/icon.svg:

    python3 apps/web/scripts/icons.py
"""

import io
import pathlib

from PIL import Image, ImageDraw

WEB = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = WEB / "public"
# Next serves apple-icon.png from app/ by convention, not from public/.
APP = WEB / "app"

BRAND = (68, 95, 114, 255)  # --brand, the manifest's Lisette blue
PAPER = (239, 231, 218, 255)  # --surface, the manifest's Ground

# The quadratic arc from the mark, in the 48-unit viewBox it was drawn in.
P0, P1, P2 = (12.0, 31.0), (24.0, 11.0), (36.0, 31.0)
STROKE = 3.6
DOT = 4.0
BBOX = (8.0, 7.0, 40.0, 35.0)

SS = 4  # supersample, then downscale — anti-aliasing without a vector renderer


def curve(steps: int):
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        yield (
            u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0],
            u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1],
        )


def render(size: int, fill: float) -> bytes:
    s = size * SS
    img = Image.new("RGBA", (s, s), BRAND)
    draw = ImageDraw.Draw(img)

    scale = fill * s / (BBOX[2] - BBOX[0])
    cx, cy = (BBOX[0] + BBOX[2]) / 2, (BBOX[1] + BBOX[3]) / 2

    def to(p):
        return (s / 2 + (p[0] - cx) * scale, s / 2 + (p[1] - cy) * scale)

    # Stamping a disc along the curve gives a seamless round-capped stroke.
    # ImageDraw.line's mitre joints leave visible notches on an arc this tight.
    def disc(x, y, r):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=PAPER)

    for point in curve(600):
        disc(*to(point), STROKE * scale / 2)
    for point in (P0, P2):
        disc(*to(point), DOT * scale)

    buf = io.BytesIO()
    img.resize((size, size), Image.LANCZOS).save(buf, "PNG", optimize=True)
    return buf.getvalue()


PUBLIC.mkdir(parents=True, exist_ok=True)
for target, name, size, fill in [
    (PUBLIC, "icon-192.png", 192, 0.62),
    (PUBLIC, "icon-512.png", 512, 0.62),
    # Maskable icons are cropped to a circle by Android, so the mark sits smaller.
    (PUBLIC, "icon-maskable.png", 512, 0.44),
    (APP, "apple-icon.png", 180, 0.62),
]:
    (target / name).write_bytes(render(size, fill))
    print(f"wrote {target / name}")
