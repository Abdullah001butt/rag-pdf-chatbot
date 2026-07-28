# -*- coding: utf-8 -*-
"""Builds Documind_AI_Presentation.pptx — condensed 4-slide deck for a
2-3 minute talk, enterprise dark theme matching the product's own
emerald-on-black branding.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

import deck_content as C

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
FONT = "Segoe UI"


def rgb(hex_str):
    return RGBColor.from_string(hex_str)


def set_bg(slide, color=C.BG):
    bg = slide.background
    bg.fill.solid()
    bg.fill.fore_color.rgb = rgb(color)


def no_line(shape):
    shape.line.fill.background()


def add_rect(slide, x, y, w, h, color):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = rgb(color)
    no_line(shp)
    shp.shadow.inherit = False
    return shp


def add_rounded(slide, x, y, w, h, color, radius=0.08, line=False, line_color=None):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    try:
        shp.adjustments[0] = radius
    except Exception:
        pass
    shp.fill.solid()
    shp.fill.fore_color.rgb = rgb(color)
    if line:
        shp.line.color.rgb = rgb(line_color or C.BORDER)
        shp.line.width = Pt(1)
    else:
        no_line(shp)
    shp.shadow.inherit = False
    return shp


def add_text(slide, x, y, w, h, text, size=18, color=C.TEXT, bold=False, align=PP_ALIGN.LEFT,
             font=FONT, anchor=MSO_ANCHOR.TOP, line_spacing=1.0):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    lines = text.split("\n")
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line_spacing
        r = p.add_run()
        r.text = line
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.name = font
        r.font.color.rgb = rgb(color)
    return box


def _set_alpha(shape, pct_visible):
    srgb = shape.fill.fore_color._xFill.find(qn("a:srgbClr"))
    alpha = srgb.makeelement(qn("a:alpha"), {"val": str(int(pct_visible * 1000))})
    srgb.append(alpha)


def glow(slide, cx, cy, r, color=C.ACCENT):
    shp = slide.shapes.add_shape(MSO_SHAPE.OVAL, cx, cy, r, r)
    shp.fill.solid()
    shp.fill.fore_color.rgb = rgb(color)
    _set_alpha(shp, 12)
    no_line(shp)
    shp.shadow.inherit = False
    return shp


def new_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide)
    return slide


def kicker(slide, x, y, text, color=C.ACCENT):
    add_text(slide, x, y, Inches(8), Inches(0.35), text.upper(), size=13, color=color, bold=True)


def footer(slide, page_no, total, section=""):
    add_rect(slide, 0, SLIDE_H - Inches(0.04), SLIDE_W, Inches(0.04), C.ACCENT)
    add_text(slide, Inches(0.55), SLIDE_H - Inches(0.45), Inches(6), Inches(0.3),
              "DOCUMIND AI", size=9, color=C.MUTED, bold=True)
    if section:
        add_text(slide, Inches(4.5), SLIDE_H - Inches(0.45), Inches(5), Inches(0.3),
                  section.upper(), size=9, color=C.MUTED, align=PP_ALIGN.CENTER)
    add_text(slide, SLIDE_W - Inches(1.2), SLIDE_H - Inches(0.45), Inches(0.8), Inches(0.3),
              f"{page_no:02d} / {total:02d}", size=9, color=C.MUTED, align=PP_ALIGN.RIGHT)


def header(slide, kick, title):
    kicker(slide, Inches(0.7), Inches(0.5), kick)
    add_text(slide, Inches(0.7), Inches(0.8), Inches(11.5), Inches(0.8), title, size=30, bold=True, color=C.TEXT)


# ---------------------------------------------------------------- slides ---

def slide_title(prs):
    slide = new_slide(prs)
    glow(slide, Inches(-2), Inches(-2), Inches(9), C.ACCENT)
    glow(slide, Inches(9), Inches(4), Inches(7), C.BLUE)
    add_rect(slide, Inches(0.7), Inches(2.05), Inches(0.55), Inches(0.08), C.ACCENT)
    add_text(slide, Inches(0.7), Inches(2.25), Inches(11.5), Inches(1.2), C.TITLE, size=52, bold=True, color=C.TEXT)
    add_text(slide, Inches(0.72), Inches(3.15), Inches(10.5), Inches(0.6), C.SUBTITLE, size=16, color=C.MUTED)

    add_text(slide, Inches(0.72), Inches(4.15), Inches(6), Inches(0.3), "TEAM", size=11, bold=True, color=C.ACCENT)
    for i, name in enumerate(C.TEAM):
        col, row = i % 2, i // 2
        add_text(slide, Inches(0.72) + Inches(4.2) * col, Inches(4.5) + Inches(0.4) * row, Inches(4), Inches(0.35),
                  name, size=14, color=C.TEXT)

    add_text(slide, Inches(0.72), Inches(6.3), Inches(8), Inches(0.35), C.UNIVERSITY, size=12, color=C.MUTED)
    add_text(slide, Inches(0.72), Inches(6.6), Inches(8), Inches(0.35), f"{C.DEPARTMENT}  |  {C.SUPERVISOR}",
              size=12, color=C.MUTED)
    add_text(slide, SLIDE_W - Inches(2.2), Inches(6.6), Inches(1.6), Inches(0.35), C.DATE,
              size=13, color=C.ACCENT, bold=True, align=PP_ALIGN.RIGHT)


def slide_problem_solution(prs, idx, total):
    slide = new_slide(prs)
    header(slide, "Overview", "The Problem & Our Solution")

    add_text(slide, Inches(0.7), Inches(1.75), Inches(5.6), Inches(0.35), "THE PROBLEM", size=12, bold=True, color=C.MUTED)
    y = Inches(2.15)
    for p in C.PROBLEM_POINTS:
        add_rect(slide, Inches(0.7), y + Inches(0.08), Inches(0.12), Inches(0.12), C.MUTED)
        add_text(slide, Inches(1.0), y, Inches(5.3), Inches(0.75), p, size=12.5, color=C.MUTED, line_spacing=1.1)
        y += Inches(0.85)

    add_text(slide, Inches(6.9), Inches(1.75), Inches(5.6), Inches(0.35), "OUR SOLUTION", size=12, bold=True, color=C.ACCENT)
    y = Inches(2.15)
    for p in C.SOLUTION_POINTS:
        add_rect(slide, Inches(6.9), y + Inches(0.08), Inches(0.12), Inches(0.12), C.ACCENT)
        add_text(slide, Inches(7.2), y, Inches(5.3), Inches(0.9), p, size=13, color=C.TEXT, line_spacing=1.1)
        y += Inches(1.0)

    add_text(slide, Inches(0.7), Inches(5.6), Inches(3), Inches(0.3), "BUILT WITH", size=11, bold=True, color=C.MUTED)
    x = Inches(0.7)
    yy = Inches(5.95)
    for chip in C.TECH_STACK:
        w = Inches(0.35 + 0.11 * len(chip))
        if x + w > SLIDE_W - Inches(0.7):
            x = Inches(0.7)
            yy += Inches(0.5)
        add_rounded(slide, x, yy, w, Inches(0.4), C.SURFACE, radius=0.5, line=True)
        add_text(slide, x, yy, w, Inches(0.4), chip, size=10.5, color=C.TEXT, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        x += w + Inches(0.15)

    footer(slide, idx, total, "Problem & Solution")


def slide_features(prs, idx, total):
    slide = new_slide(prs)
    header(slide, "Product", "Features & Standout Innovations")

    add_text(slide, Inches(0.7), Inches(1.7), Inches(5.6), Inches(0.3), "CORE FEATURES", size=11, bold=True, color=C.MUTED)
    y = Inches(2.05)
    for title, body in C.CORE_FEATURES:
        add_rounded(slide, Inches(0.7), y, Inches(5.7), Inches(1.05), C.SURFACE, radius=0.08, line=True)
        add_rect(slide, Inches(0.7), y, Inches(0.06), Inches(1.05), C.MUTED)
        add_text(slide, Inches(0.95), y + Inches(0.12), Inches(5.3), Inches(0.35), title, size=13, bold=True, color=C.TEXT)
        add_text(slide, Inches(0.95), y + Inches(0.48), Inches(5.3), Inches(0.5), body, size=10, color=C.MUTED, line_spacing=1.05)
        y += Inches(1.2)

    add_text(slide, Inches(6.9), Inches(1.7), Inches(5.6), Inches(0.3), "STANDOUT INNOVATIONS", size=11, bold=True, color=C.ACCENT)
    y = Inches(2.05)
    colors = [C.ACCENT, C.BLUE, C.PURPLE, C.AMBER]
    for i, (title, body) in enumerate(C.STANDOUT_FEATURES):
        color = colors[i % len(colors)]
        add_rounded(slide, Inches(6.9), y, Inches(5.7), Inches(1.05), C.SURFACE, radius=0.08, line=True, line_color=color)
        add_rect(slide, Inches(6.9), y, Inches(0.06), Inches(1.05), color)
        add_text(slide, Inches(7.15), y + Inches(0.12), Inches(5.3), Inches(0.35), title, size=13, bold=True, color=color)
        add_text(slide, Inches(7.15), y + Inches(0.48), Inches(5.3), Inches(0.5), body, size=10, color=C.MUTED, line_spacing=1.05)
        y += Inches(1.2)

    footer(slide, idx, total, "Features")


def slide_closing(prs, idx, total):
    slide = new_slide(prs)
    glow(slide, Inches(4), Inches(1), Inches(9), C.ACCENT)
    header(slide, "System Design", "Architecture, Live Demo & Thank You")

    x = Inches(0.7)
    for label, desc, color in C.ARCHITECTURE_LAYERS:
        w = Inches(2.85)
        add_rounded(slide, x, Inches(1.85), w, Inches(1.3), C.SURFACE, radius=0.1, line=True, line_color=color)
        add_rect(slide, x, Inches(1.85), w, Inches(0.06), color)
        add_text(slide, x + Inches(0.2), Inches(2.1), w - Inches(0.4), Inches(0.35), label, size=14, bold=True, color=color)
        add_text(slide, x + Inches(0.2), Inches(2.5), w - Inches(0.4), Inches(0.6), desc, size=9.5, color=C.MUTED, line_spacing=1.05)
        x += w + Inches(0.2)

    add_text(slide, Inches(0.7), Inches(3.65), Inches(10), Inches(0.4), "Live Demo", size=20, bold=True, color=C.TEXT)
    add_rounded(slide, Inches(0.7), Inches(4.15), Inches(5.0), Inches(0.55), C.SURFACE, radius=0.5, line=True)
    add_text(slide, Inches(0.7), Inches(4.15), Inches(5.0), Inches(0.55), C.LIVE_URL,
              size=14, bold=True, color=C.ACCENT, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    add_text(slide, Inches(0.7), Inches(5.15), Inches(10), Inches(0.6), "Thank You — Questions & Discussion",
              size=22, bold=True, color=C.TEXT)
    yy = Inches(5.95)
    for label, url in C.CLOSING_LINKS:
        add_text(slide, Inches(0.7), yy, Inches(2.2), Inches(0.3), label.upper(), size=10, bold=True, color=C.ACCENT)
        add_text(slide, Inches(2.9), yy, Inches(6), Inches(0.3), url, size=12, color=C.TEXT)
        yy += Inches(0.4)

    footer(slide, idx, total, "Demo & Thank You")


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    total = 4
    slide_title(prs)
    slide_problem_solution(prs, 2, total)
    slide_features(prs, 3, total)
    slide_closing(prs, 4, total)

    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "Documind_AI_Presentation.pptx")
    prs.save(out_path)
    print("Saved:", out_path)


if __name__ == "__main__":
    main()
