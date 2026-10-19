#!/usr/bin/env python3
"""Render the single source Traço icon to iOS and PWA raster sizes.

The SVG is committed to Git. Pages generates its PNG siblings before the
integrity checks and publishes all four icons together.
"""
from pathlib import Path
from io import BytesIO
import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / "assets" / "icon.svg"

def main():
    source = SVG.read_bytes()
    assert b"#CDFF4C" in source and b"costas em V" in source, "Unexpected icon source"
    for size in (180, 192, 512):
        dest = ROOT / "assets" / f"traco-icon-{size}-v3.png"
        data = cairosvg.svg2png(bytestring=source, output_width=size, output_height=size)
        picture = Image.open(BytesIO(data)).convert("RGBA")
        assert picture.size == (size, size), f"Wrong output size: {dest}"
        assert picture.getpixel((size//2, size//4))[1] > 150, "Lime silhouette absent"
        assert picture.getpixel((8, 8))[0] < 50, "Dark background absent"
        dest.write_bytes(data)
        print(f"Created {dest.relative_to(ROOT)} ({len(data)} bytes, {size}x{size})")

if __name__ == "__main__":
    main()
