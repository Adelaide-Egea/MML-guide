#!/usr/bin/env python3
"""
Held — one-command deploy helper.

What it does, so you never hand-edit a version again:
  1. Bumps the service-worker cache version (held-v7 -> held-v8).
  2. Stamps the same version into index.html as <meta name="app-version">
     and a ?v= query on the sw.js registration (belt-and-braces cache-bust).
  3. (optional) git add + commit + push, which triggers your Vercel deploy.

Run it from the folder that holds index.html and sw.js:
    python3 bump.py            # bump + stamp only
    python3 bump.py --deploy   # bump + stamp + git commit & push

No arguments to remember, no numbers to type.
"""

import re
import sys
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
SW = HERE / "sw.js"
INDEX = HERE / "index.html"


def bump_sw() -> str:
    """Increment held-vN in sw.js and return the new version string."""
    text = SW.read_text(encoding="utf-8")
    m = re.search(r"held-v(\d+)", text)
    if not m:
        sys.exit("✗ Couldn't find 'held-vN' in sw.js — is CACHE_VERSION intact?")
    new_n = int(m.group(1)) + 1
    new_ver = f"held-v{new_n}"
    text = re.sub(r"held-v\d+", new_ver, text, count=1)
    SW.write_text(text, encoding="utf-8")
    print(f"✓ sw.js  cache version -> {new_ver}")
    return new_ver


def stamp_index(version: str) -> None:
    """Put the version in a <meta> tag and on the sw.js registration URL."""
    if not INDEX.exists():
        print("• index.html not found next to bump.py — skipping stamp.")
        return
    html = INDEX.read_text(encoding="utf-8")

    # 1) meta tag (insert or update)
    meta = f'<meta name="app-version" content="{version}">'
    if 'name="app-version"' in html:
        html = re.sub(r'<meta name="app-version" content="[^"]*">', meta, html)
    else:
        html = re.sub(r"(<head[^>]*>)", r"\1\n  " + meta, html, count=1)

    # 2) cache-bust the SW registration so the browser re-checks sw.js itself
    html = re.sub(r"register\('/sw\.js(?:\?v=[^']*)?'\)",
                  f"register('/sw.js?v={version}')", html)

    INDEX.write_text(html, encoding="utf-8")
    print(f"✓ index.html stamped with {version}")


def deploy(version: str) -> None:
    """git add/commit/push — triggers Vercel. Safe no-op if not a git repo."""
    try:
        subprocess.run(["git", "add", "-A"], cwd=HERE, check=True)
        subprocess.run(["git", "commit", "-m", f"deploy {version}"], cwd=HERE, check=True)
        subprocess.run(["git", "push"], cwd=HERE, check=True)
        print(f"✓ pushed {version} — Vercel will redeploy shortly.")
    except FileNotFoundError:
        print("• git not installed — bump done, deploy skipped.")
    except subprocess.CalledProcessError as e:
        print(f"• git step failed ({e}). Bump is saved; you can push manually.")


if __name__ == "__main__":
    ver = bump_sw()
    stamp_index(ver)
    if "--deploy" in sys.argv:
        deploy(ver)
    else:
        print("\nDone. Run  python3 bump.py --deploy  to also push & redeploy.")
