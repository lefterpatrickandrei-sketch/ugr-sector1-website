#!/usr/bin/env python3
"""
split_html.py
-------------
Extract inline <style> and <script> blocks from an HTML file and write them
to separate .css and .js files, leaving a clean HTML file that links to them.

Usage:
    python split_html.py source.html
    # produces: source_index.html, source_style.css, source_script.js
"""

import sys
import re
from pathlib import Path

def extract_blocks(html: str):
    """Return (html_without_blocks, css_content, js_content)"""
    # ---- 1. Extract <style> ... </style> (case‑insensitive, dot matches newlines) ----
    style_pattern = re.compile(r"<style\b[^>]*>(.*?)</style>", re.IGNORECASE | re.DOTALL)
    style_matches = style_pattern.findall(html)
    css_content = "\n\n".join(m.strip() for m in style_matches if m.strip())
    # Remove the style tags from the HTML
    html_no_style = style_pattern.sub("", html)

    # ---- 2. Extract <script> ... </script> (case‑insensitive) ----
    script_pattern = re.compile(r"<script\b[^>]*>(.*?)</script>", re.IGNORECASE | re.DOTALL)
    script_matches = script_pattern.findall(html_no_style)
    js_content = "\n\n".join(m.strip() for m in script_matches if m.strip())
    # Remove the script tags from the HTML
    html_clean = script_pattern.sub("", html_no_style)

    # ---- 3. Insert link & script tags in the right places ----
    # We'll put the <link> just before the closing </head> (or at the end of <head> if none)
    # and the <script src> just before the closing </body>
    link_tag = '\n    <link rel="stylesheet" href="style.css">'
    script_tag = '\n    <script src="script.js"></script>'

    # Insert <link> before </head>
    head_close = html_clean.lower().find("</head>")
    if head_close != -1:
        html_clean = html_clean[:head_close] + link_tag + "\n" + html_clean[head_close:]
    else:
        # Fallback: put it right after the opening <html> tag (unlikely but safe)
        html_clean = html_clean.replace("<html>", f"<html>{link_tag}", 1)

    # Insert <script> before </body>
    body_close = html_clean.lower().find("</body>")
    if body_close != -1:
        html_clean = html_clean[:body_close] + script_tag + "\n" + html_clean[body_close:]
    else:
        # Fallback: append before the closing </html>
        html_clean = html_clean.replace("</html>", f"{script_tag}\n</html>", 1)

    return html_clean, css_content, js_content


def main():
    if len(sys.argv) < 2:
        print("Usage: python split_html.py <path-to-html-file>")
        sys.exit(1)

    src_path = Path(sys.argv[1])
    if not src_path.is_file():
        print(f"❌ File not found: {src_path}")
        sys.exit(1)

    html_raw = src_path.read_text(encoding="utf-8")
    html_clean, css, js = extract_blocks(html_raw)

    # Build output filenames (e.g. uniunea_geodezilor..._index.html)
    stem = src_path.stem
    out_html = src_path.with_name(f"{stem}_index.html")
    out_css  = src_path.with_name(f"{stem}_style.css")
    out_js   = src_path.with_name(f"{stem}_script.js")

    out_html.write_text(html_clean, encoding="utf-8")
    out_css.write_text(css, encoding="utf-8")
    out_js.write_text(js, encoding="utf-8")

    print("✅ Done!")
    print(f"   HTML  → {out_html.name}")
    print(f"   CSS   → {out_css.name}")
    print(f"   JS    → {out_js.name}")


if __name__ == "__main__":
    main()
