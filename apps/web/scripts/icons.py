#!/usr/bin/env python3
"""Renders Domela app icons — clay tile, pine D-door, marigold punctum.

Spec: design/domela-brand.md

    python3 apps/web/scripts/icons.py
"""

import io
import pathlib

from PIL import Image, ImageDraw

WEB = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = WEB / "public"
APP = WEB / "app"
DESIGN = WEB.parent.parent / "design" / "logo"

CLAY = (227, 211, 188, 255)  # #E3D3BC
PINE = (34, 51, 44, 255)  # #22332C
MARIGOLD = (208, 138, 44, 255)  # #D08A2C

SS = 4


def render(size: int, fill: float) -> bytes:
    s = size * SS
    img = Image.new("RGBA", (s, s), CLAY)
    draw = ImageDraw.Draw(img)

    box = 48.0
    scale = fill * s / box
    ox = s / 2
    oy = s / 2 - 0.02 * s

    def to(x, y):
        return (ox + (x - 24) * scale, oy + (y - 24) * scale)

    stroke = max(2, 3.4 * scale)

    def line(points):
        draw.line(points, fill=PINE, width=int(round(stroke)), joint="curve")
        r = stroke / 2
        for x, y in (points[0], points[-1]):
            draw.ellipse([x - r, y - r, x + r, y + r], fill=PINE)

    # Stem
    line([to(13, 9), to(13, 39)])

    # Open bowl (polyline approximation of the D doorway)
    bowl = []
    for i in range(21):
        t = i / 20
        # top bar then arc then partial bottom
        if t < 0.15:
            u = t / 0.15
            x = 13 + (25 - 13) * u
            y = 9
        elif t < 0.85:
            u = (t - 0.15) / 0.7
            # semicircle-ish from top to bottom on the right
            import math

            ang = -math.pi / 2 + math.pi * u
            cx, cy, rad = 25, 24, 14
            x = cx + rad * math.cos(ang)
            y = cy + rad * math.sin(ang)
        else:
            u = (t - 0.85) / 0.15
            x = 25 + (18 - 25) * u
            y = 39
        bowl.append(to(x, y))
    line(bowl)

    # Punctum
    half = 3 * scale
    cx, cy = to(24, 24)
    draw.rectangle([cx - half, cy - half, cx + half, cy + half], fill=MARIGOLD)

    buf = io.BytesIO()
    img.resize((size, size), Image.LANCZOS).save(buf, "PNG", optimize=True)
    return buf.getvalue()


PUBLIC.mkdir(parents=True, exist_ok=True)
DESIGN.mkdir(parents=True, exist_ok=True)
for target, name, size, fill in [
    (PUBLIC, "icon-192.png", 192, 0.55),
    (PUBLIC, "icon-512.png", 512, 0.55),
    (PUBLIC, "icon-maskable.png", 512, 0.40),
    (APP, "apple-icon.png", 180, 0.55),
    (DESIGN, "domela-icon-1024.png", 1024, 0.55),
]:
    (target / name).write_bytes(render(size, fill))
    print(f"wrote {target / name}")
