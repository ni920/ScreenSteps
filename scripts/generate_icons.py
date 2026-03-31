"""
Generates ScreenSteps extension icons at 16, 32, 48 and 128 px.
Design: black background · red dot · white bold "REC" text
Requires: pip install Pillow
"""
from PIL import Image, ImageDraw, ImageFont
import os

SIZES   = [16, 32, 48, 128]
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BLACK = (0,   0,   0,   255)
RED   = (255, 59,  48,  255)   # iOS-red, matches the image
WHITE = (255, 255, 255, 255)


def draw_icon(size: int) -> Image.Image:
    img  = Image.new("RGBA", (size, size), BLACK)
    draw = ImageDraw.Draw(img)

    # ── at 16 px: just a red dot, no text ───────────────────────────────────
    if size <= 16:
        r  = size * 0.30
        cx = size * 0.50
        cy = size * 0.50
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=RED)
        return img

    # ── at 32 px: dot + tiny "REC" ──────────────────────────────────────────
    # ── at 48 / 128 px: full layout ─────────────────────────────────────────

    # relative measurements
    pad    = size * 0.14
    dot_r  = size * 0.14
    gap    = size * 0.07          # gap between dot and text

    # vertical centre
    cy = size / 2

    # pick font size
    font_size = max(6, int(size * 0.30))
    font = None
    for candidate in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]:
        if os.path.exists(candidate):
            try:
                font = ImageFont.truetype(candidate, font_size)
                break
            except Exception:
                pass
    if font is None:
        font = ImageFont.load_default()

    # measure text
    bbox = draw.textbbox((0, 0), "REC", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # total block width: dot_diameter + gap + text_width
    total_w = dot_r * 2 + gap + tw
    start_x = (size - total_w) / 2

    # dot
    dx = start_x + dot_r
    draw.ellipse([dx - dot_r, cy - dot_r, dx + dot_r, cy + dot_r], fill=RED)

    # text
    tx = start_x + dot_r * 2 + gap
    ty = cy - th / 2 - bbox[1]          # correct for ascender offset
    draw.text((tx, ty), "REC", fill=WHITE, font=font)

    return img


for size in SIZES:
    icon = draw_icon(size)
    path = os.path.join(OUT_DIR, f"icon{size}.png")
    icon.save(path)
    print(f"  ✓ icon{size}.png")

print("Icons saved to assets/icons/")
