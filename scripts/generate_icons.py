"""
Generates ScreenSteps extension icons at 16, 32, 48 and 128 px.
Requires: pip install Pillow
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

SIZES = [16, 32, 48, 128]
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

# Brand colours
BG      = (30,  41,  59)   # slate-800
ACCENT  = (99, 179, 237)   # blue-300
WHITE   = (255, 255, 255)


def draw_icon(size: int) -> Image.Image:
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded-rectangle background
    r = max(2, size // 8)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG)

    pad  = size * 0.15
    inner = size - 2 * pad

    # ── Camera body ──────────────────────────────────────────────────────────
    body_h  = inner * 0.55
    body_y0 = pad + inner * 0.28
    body_x0 = pad
    body_x1 = pad + inner
    body_y1 = body_y0 + body_h
    br      = max(1, size // 14)
    draw.rounded_rectangle(
        [body_x0, body_y0, body_x1, body_y1],
        radius=br,
        fill=ACCENT,
    )

    # ── Viewfinder bump ──────────────────────────────────────────────────────
    bump_w  = inner * 0.30
    bump_h  = inner * 0.14
    bump_x0 = pad + (inner - bump_w) / 2
    bump_y0 = body_y0 - bump_h + 1
    bump_x1 = bump_x0 + bump_w
    bump_y1 = body_y0 + br
    if size >= 32:
        draw.rounded_rectangle(
            [bump_x0, bump_y0, bump_x1, bump_y1],
            radius=max(1, size // 20),
            fill=ACCENT,
        )

    # ── Lens (circle) ────────────────────────────────────────────────────────
    cx      = size / 2
    cy      = body_y0 + body_h / 2
    lr      = inner * 0.20
    draw.ellipse(
        [cx - lr, cy - lr, cx + lr, cy + lr],
        fill=BG,
        outline=WHITE,
        width=max(1, size // 32),
    )

    # ── Step dots (bottom-left) ───────────────────────────────────────────────
    if size >= 48:
        dot_r  = max(1, size // 32)
        dot_y  = body_y1 - body_h * 0.22
        for i, x in enumerate([pad + inner * 0.14, pad + inner * 0.26, pad + inner * 0.38]):
            draw.ellipse(
                [x - dot_r, dot_y - dot_r, x + dot_r, dot_y + dot_r],
                fill=WHITE,
            )

    return img


for size in SIZES:
    icon = draw_icon(size)
    path = os.path.join(OUT_DIR, f"icon{size}.png")
    icon.save(path)
    print(f"  ✓ icon{size}.png")

print("Icons saved to assets/icons/")

