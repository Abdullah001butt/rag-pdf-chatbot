# -*- coding: utf-8 -*-
"""Builds Documind_AI_Presentation.pdf — condensed 4-slide deck matching
build_pptx.py, rendered as landscape slide-style pages via reportlab (no
LibreOffice available in this environment for a direct pptx->pdf
conversion).
"""
import os
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

import deck_content as C

PAGE_W_IN, PAGE_H_IN = 13.333, 7.5
PAGE_W, PAGE_H = landscape((PAGE_W_IN * inch, PAGE_H_IN * inch))
FONT = "Helvetica"
FONT_B = "Helvetica-Bold"


def hexc(h):
    return HexColor(f"#{h}")


class Deck:
    def __init__(self, path, total):
        self.c = canvas.Canvas(path, pagesize=(PAGE_W, PAGE_H))
        self.page_no = 0
        self.total = total

    def save(self):
        self.c.save()

    def new_page(self):
        if self.page_no > 0:
            self.c.showPage()
        self.page_no += 1
        self.c.setFillColor(hexc(C.BG))
        self.c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    def text(self, x, y, s, size=14, color=C.TEXT, bold=False, align="left", font=None):
        self.c.setFillColor(hexc(color))
        f = font or (FONT_B if bold else FONT)
        self.c.setFont(f, size)
        y_pdf_in = PAGE_H_IN - y
        if align == "left":
            self.c.drawString(x * inch, y_pdf_in * inch, s)
        elif align == "center":
            self.c.drawCentredString(x * inch, y_pdf_in * inch, s)
        elif align == "right":
            self.c.drawRightString(x * inch, y_pdf_in * inch, s)

    def wrapped(self, x, y, s, max_width_in, size=11, color=C.MUTED, bold=False, leading=1.25, font=None):
        f = font or (FONT_B if bold else FONT)
        self.c.setFont(f, size)
        words = s.split()
        lines, cur = [], ""
        for w in words:
            trial = (cur + " " + w).strip()
            if self.c.stringWidth(trial, f, size) / inch > max_width_in:
                lines.append(cur)
                cur = w
            else:
                cur = trial
        if cur:
            lines.append(cur)
        for i, line in enumerate(lines):
            self.text(x, y + i * (size * leading / 72), line, size=size, color=color, font=f)
        return len(lines)

    def rect(self, x, y, w, h, color, radius=None, stroke_color=None, stroke_w=0.75):
        self.c.setFillColor(hexc(color))
        y_pdf_in = PAGE_H_IN - y - h
        if stroke_color:
            self.c.setStrokeColor(hexc(stroke_color))
            self.c.setLineWidth(stroke_w)
        if radius:
            self.c.roundRect(x * inch, y_pdf_in * inch, w * inch, h * inch, radius * inch,
                              fill=1, stroke=1 if stroke_color else 0)
        else:
            self.c.rect(x * inch, y_pdf_in * inch, w * inch, h * inch, fill=1, stroke=1 if stroke_color else 0)

    def circle(self, cx, cy, r, color, alpha=1.0):
        self.c.saveState()
        self.c.setFillColor(hexc(color), alpha=alpha)
        y_pdf_in = PAGE_H_IN - cy
        self.c.circle(cx * inch, y_pdf_in * inch, r * inch, fill=1, stroke=0)
        self.c.restoreState()

    def footer(self, section=""):
        self.rect(0, PAGE_H_IN - 0.04, PAGE_W_IN, 0.04, C.ACCENT)
        self.text(0.55, PAGE_H_IN - 0.25, "DOCUMIND AI", size=8, color=C.MUTED, bold=True)
        if section:
            self.text(PAGE_W_IN / 2, PAGE_H_IN - 0.25, section.upper(), size=8, color=C.MUTED, align="center")
        self.text(PAGE_W_IN - 0.55, PAGE_H_IN - 0.25, f"{self.page_no:02d} / {self.total:02d}",
                   size=8, color=C.MUTED, align="right")

    def kicker(self, x, y, s, color=C.ACCENT):
        self.text(x, y, s.upper(), size=12, color=color, bold=True)

    def header(self, kick, title):
        self.kicker(0.7, 0.7, kick)
        self.text(0.7, 1.15, title, size=24, bold=True, color=C.TEXT)


def build():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "Documind_AI_Presentation.pdf")
    d = Deck(out_path, total=4)

    # 1. Title
    d.new_page()
    d.circle(-1, -1, 4.5, C.ACCENT, alpha=0.08)
    d.circle(9, 5, 3.5, C.BLUE, alpha=0.08)
    d.rect(0.7, 2.05, 0.55, 0.08, C.ACCENT)
    d.text(0.7, 3.0, C.TITLE, size=42, bold=True, color=C.TEXT)
    d.wrapped(0.72, 3.55, C.SUBTITLE, 9.8, size=14, color=C.MUTED)

    d.text(0.72, 4.35, "TEAM", size=10, bold=True, color=C.ACCENT)
    for i, name in enumerate(C.TEAM):
        col, row = i % 2, i // 2
        d.text(0.72 + 4.2 * col, 4.7 + 0.35 * row, name, size=13, color=C.TEXT)

    d.text(0.72, 6.3, C.UNIVERSITY, size=11, color=C.MUTED)
    d.text(0.72, 6.6, f"{C.DEPARTMENT}  |  {C.SUPERVISOR}", size=11, color=C.MUTED)
    d.text(PAGE_W_IN - 0.7, 6.6, C.DATE, size=12, bold=True, color=C.ACCENT, align="right")

    # 2. Problem & Solution
    d.new_page()
    d.header("Overview", "The Problem & Our Solution")

    d.text(0.7, 1.65, "THE PROBLEM", size=10.5, bold=True, color=C.MUTED)
    y = 2.0
    for p in C.PROBLEM_POINTS:
        d.rect(0.7, y - 0.1, 0.1, 0.1, C.MUTED)
        n = d.wrapped(1.0, y, p, 5.3, size=11, color=C.MUTED)
        y += 0.32 * n + 0.35

    d.text(6.9, 1.65, "OUR SOLUTION", size=10.5, bold=True, color=C.ACCENT)
    y = 2.0
    for p in C.SOLUTION_POINTS:
        d.rect(6.9, y - 0.1, 0.1, 0.1, C.ACCENT)
        n = d.wrapped(7.2, y, p, 5.3, size=11.5, color=C.TEXT)
        y += 0.32 * n + 0.4

    d.text(0.7, 5.55, "BUILT WITH", size=10, bold=True, color=C.MUTED)
    x, yy = 0.7, 5.85
    for chip in C.TECH_STACK:
        w = 0.35 + 0.095 * len(chip)
        if x + w > PAGE_W_IN - 0.7:
            x = 0.7
            yy += 0.5
        d.rect(x, yy, w, 0.35, C.SURFACE, radius=0.17, stroke_color=C.BORDER)
        d.text(x + w / 2, yy + 0.12, chip, size=9.5, color=C.TEXT, align="center")
        x += w + 0.15

    d.footer("Problem & Solution")

    # 3. Features
    d.new_page()
    d.header("Product", "Features & Standout Innovations")

    d.text(0.7, 1.6, "CORE FEATURES", size=10, bold=True, color=C.MUTED)
    y = 1.95
    for title, body in C.CORE_FEATURES:
        d.rect(0.7, y, 5.7, 1.0, C.SURFACE, radius=0.08, stroke_color=C.BORDER)
        d.rect(0.7, y, 0.06, 1.0, C.MUTED)
        d.text(0.95, y + 0.3, title, size=12.5, bold=True, color=C.TEXT)
        d.wrapped(0.95, y + 0.62, body, 5.3, size=9, color=C.MUTED)
        y += 1.15

    d.text(6.9, 1.6, "STANDOUT INNOVATIONS", size=10, bold=True, color=C.ACCENT)
    colors = [C.ACCENT, C.BLUE, C.PURPLE, C.AMBER]
    y = 1.95
    for i, (title, body) in enumerate(C.STANDOUT_FEATURES):
        color = colors[i % len(colors)]
        d.rect(6.9, y, 5.7, 1.0, C.SURFACE, radius=0.08, stroke_color=color)
        d.rect(6.9, y, 0.06, 1.0, color)
        d.text(7.15, y + 0.3, title, size=12.5, bold=True, color=color)
        d.wrapped(7.15, y + 0.62, body, 5.3, size=9, color=C.MUTED)
        y += 1.15

    d.footer("Features")

    # 4. Architecture + Demo + Thank you
    d.new_page()
    d.circle(4, 6.5, 9, C.ACCENT, alpha=0.05)
    d.header("System Design", "Architecture, Live Demo & Thank You")

    x = 0.7
    for label, desc, color in C.ARCHITECTURE_LAYERS:
        w = 2.85
        d.rect(x, 1.85, w, 1.3, C.SURFACE, radius=0.1, stroke_color=color)
        d.rect(x, 1.85, w, 0.06, color)
        d.text(x + 0.2, 2.15, label, size=13, bold=True, color=color)
        d.wrapped(x + 0.2, 2.5, desc, w - 0.4, size=8.5, color=C.MUTED)
        x += w + 0.2

    d.text(0.7, 3.7, "Live Demo", size=18, bold=True, color=C.TEXT)
    d.rect(0.7, 4.0, 5.0, 0.5, C.SURFACE, radius=0.25, stroke_color=C.BORDER)
    d.text(0.7 + 2.5, 4.2, C.LIVE_URL, size=13, bold=True, color=C.ACCENT, align="center")

    d.text(0.7, 5.15, "Thank You — Questions & Discussion", size=20, bold=True, color=C.TEXT)
    yy = 5.75
    for label, url in C.CLOSING_LINKS:
        d.text(0.7, yy, label.upper(), size=9, bold=True, color=C.ACCENT)
        d.text(2.6, yy, url, size=11, color=C.TEXT)
        yy += 0.4

    d.footer("Demo & Thank You")

    d.save()
    print("Saved:", out_path)


if __name__ == "__main__":
    build()
