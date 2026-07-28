# -*- coding: utf-8 -*-
"""Builds Documind_AI_Presentation.pdf — same content/order as the .pptx,
rendered as landscape slide-style pages via reportlab (no LibreOffice
available in this environment for a direct pptx->pdf conversion).
"""
import os
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

import deck_content as C

PAGE_W, PAGE_H = landscape((13.333 * inch, 7.5 * inch))
FONT = "Helvetica"
FONT_B = "Helvetica-Bold"


def hexc(h):
    return HexColor(f"#{h}")


class Deck:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=(PAGE_W, PAGE_H))
        self.page_no = 0
        self.total = 12

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
        y_pdf = PAGE_H - y
        if align == "left":
            self.c.drawString(x * inch, y_pdf * inch, s)
        elif align == "center":
            self.c.drawCentredString(x * inch, y_pdf * inch, s)
        elif align == "right":
            self.c.drawRightString(x * inch, y_pdf * inch, s)

    def wrapped(self, x, y, s, max_width_in, size=11, color=C.MUTED, bold=False, leading=1.3, font=None):
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
        y_pdf = PAGE_H - y - h
        if stroke_color:
            self.c.setStrokeColor(hexc(stroke_color))
            self.c.setLineWidth(stroke_w)
        if radius:
            self.c.roundRect(x * inch, y_pdf * inch, w * inch, h * inch, radius * inch,
                              fill=1, stroke=1 if stroke_color else 0)
        else:
            self.c.rect(x * inch, y_pdf * inch, w * inch, h * inch, fill=1, stroke=1 if stroke_color else 0)

    def circle(self, cx, cy, r, color, alpha=1.0):
        self.c.saveState()
        self.c.setFillColor(hexc(color), alpha=alpha)
        y_pdf = PAGE_H - cy
        self.c.circle(cx * inch, y_pdf * inch, r * inch, fill=1, stroke=0)
        self.c.restoreState()

    def footer(self, section=""):
        self.rect(0, PAGE_H - 0.04, PAGE_W / inch, 0.04, C.ACCENT)
        self.text(0.55, PAGE_H / inch - 0.25, "DOCUMIND AI", size=8, color=C.MUTED, bold=True)
        if section:
            self.text(PAGE_W / inch / 2, PAGE_H / inch - 0.25, section.upper(), size=8, color=C.MUTED, align="center")
        self.text(PAGE_W / inch - 0.55, PAGE_H / inch - 0.25, f"{self.page_no:02d} / {self.total:02d}",
                   size=8, color=C.MUTED, align="right")

    def kicker(self, x, y, s, color=C.ACCENT):
        self.text(x, y, s.upper(), size=12, color=color, bold=True)

    def header(self, kicker, title, subtitle=None):
        self.kicker(0.7, 0.75, kicker)
        self.text(0.7, 1.25, title, size=26, bold=True, color=C.TEXT)
        if subtitle:
            self.text(0.7, 1.7, subtitle, size=12, color=C.MUTED)


def build():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "Documind_AI_Presentation.pdf")
    d = Deck(out_path)

    # 1. Title
    d.new_page()
    d.circle(-1, -1, 4.5, C.ACCENT, alpha=0.08)
    d.circle(9, 5, 3.5, C.BLUE, alpha=0.08)
    d.rect(0.7, 2.55, 0.55, 0.08, C.ACCENT)
    d.text(0.7, 3.55, C.TITLE, size=44, bold=True, color=C.TEXT)
    d.wrapped(0.72, 4.15, C.SUBTITLE, 9.5, size=15, color=C.MUTED)
    d.text(0.72, 5.85, C.AUTHOR, size=14, bold=True, color=C.TEXT)
    d.text(0.72, 6.2, C.UNIVERSITY, size=11, color=C.MUTED)
    d.text(0.72, 6.45, C.DEPARTMENT, size=11, color=C.MUTED)
    d.text(0.72, 6.7, C.SUPERVISOR, size=11, color=C.MUTED)
    d.text(PAGE_W / inch - 0.7, 6.7, C.DATE, size=11, bold=True, color=C.ACCENT, align="right")

    # 2. Agenda
    d.new_page()
    d.header("Overview", "Agenda")
    y = 2.3
    for i, item in enumerate(C.AGENDA):
        d.rect(0.7, y, 0.4, 0.35, C.SURFACE, radius=0.18, stroke_color=C.BORDER)
        d.text(0.9, y + 0.24, f"{i+1:02d}", size=11, bold=True, color=C.ACCENT, align="center")
        d.text(1.3, y + 0.24, item, size=13, color=C.TEXT)
        y += 0.5
    d.footer()

    # 3. Problem
    d.new_page()
    d.header("The Problem", "Working with PDFs is Still Slow and Fragmented")
    card_w, card_h = 5.55, 1.9
    start_x, start_y = 0.7, 2.3
    for i, (title, body) in enumerate(C.PROBLEM_POINTS):
        col, row = i % 2, i // 2
        x = start_x + col * (card_w + 0.4)
        y = start_y + row * (card_h + 0.3)
        d.rect(x, y, card_w, card_h, C.SURFACE, radius=0.08, stroke_color=C.BORDER)
        d.rect(x, y, 0.06, card_h, C.ACCENT)
        d.text(x + 0.3, y + 0.35, title, size=14, bold=True, color=C.TEXT)
        d.wrapped(x + 0.3, y + 0.7, body, card_w - 0.6, size=10.5, color=C.MUTED)
    d.footer("Problem Statement")

    # 4. Solution
    d.new_page()
    d.header("The Solution", "Documind AI: One Platform, Every Document Workflow")
    y = 2.5
    for point in C.SOLUTION_POINTS:
        d.circle(1.0, y - 0.1, 0.18, C.ACCENT)
        d.text(0.93, y - 0.15, "v", size=12, bold=True, color=C.BG, align="center")
        d.wrapped(1.45, y - 0.15, point, 10.5, size=13.5, color=C.TEXT)
        y += 0.85
    d.footer("Solution Overview")

    # 5. Tech stack
    d.new_page()
    d.header("Technology", "Technology Stack")
    card_w, card_h = 5.55, 0.95
    start_x, start_y = 0.7, 2.2
    for i, (label, val) in enumerate(C.TECH_STACK):
        col, row = i % 2, i // 2
        x = start_x + col * (card_w + 0.4)
        y = start_y + row * (card_h + 0.2)
        d.rect(x, y, card_w, card_h, C.SURFACE, radius=0.12, stroke_color=C.BORDER)
        d.text(x + 0.3, y + 0.3, label.upper(), size=10, bold=True, color=C.ACCENT)
        d.wrapped(x + 0.3, y + 0.6, val, card_w - 0.6, size=11, color=C.TEXT)
    d.footer("Technology Stack")

    # 6. Architecture
    d.new_page()
    d.header("System Design", "System Architecture")
    x, w, y, h, gap = 0.9, 11.5, 2.3, 0.8, 0.15
    for label, desc, color in C.ARCHITECTURE_LAYERS:
        d.rect(x, y, w, h, C.SURFACE, radius=0.1, stroke_color=color)
        d.rect(x, y, 0.08, h, color)
        d.text(x + 0.35, y + 0.48, label, size=13, bold=True, color=color)
        d.wrapped(x + 2.6, y + 0.48, desc, w - 2.9, size=10.5, color=C.MUTED)
        y += h + gap
    d.footer("System Architecture")

    # 7. Core features
    d.new_page()
    d.header("Product", "Core Features")
    card_w, card_h = 3.65, 1.5
    start_x, start_y = 0.7, 2.1
    for i, (title, body) in enumerate(C.CORE_FEATURES):
        col, row = i % 3, i // 3
        x = start_x + col * (card_w + 0.3)
        y = start_y + row * (card_h + 0.22)
        d.rect(x, y, card_w, card_h, C.SURFACE, radius=0.07, stroke_color=C.BORDER)
        d.wrapped(x + 0.25, y + 0.35, title, card_w - 0.5, size=12, bold=True, color=C.TEXT)
        d.wrapped(x + 0.25, y + 0.7, body, card_w - 0.5, size=9, color=C.MUTED)
    d.footer("Core Features")

    # 8. Standout
    d.new_page()
    d.header("What Makes It Different", "Standout Innovations")
    colors = [C.ACCENT, C.BLUE, C.PURPLE, C.ACCENT, C.AMBER]
    y = 2.2
    for i, (title, body) in enumerate(C.STANDOUT_FEATURES):
        color = colors[i % len(colors)]
        row_h = 0.88
        d.rect(0.7, y, 11.9, row_h, C.SURFACE, radius=0.08, stroke_color=color)
        d.rect(0.7, y, 0.08, row_h, color)
        d.wrapped(1.0, y + 0.35, title, 2.9, size=12.5, bold=True, color=color)
        d.wrapped(4.2, y + 0.3, body, 8.2, size=10, color=C.MUTED)
        y += row_h + 0.12
    d.footer("Standout Innovations")

    # 9. Security
    d.new_page()
    d.header("Trust", "Security, Privacy & Billing")
    y = 2.25
    for title, body in C.SECURITY_POINTS:
        row_h = 0.8
        d.rect(0.7, y, 11.9, row_h, C.SURFACE, radius=0.08, stroke_color=C.BORDER)
        d.wrapped(1.0, y + 0.32, title, 2.9, size=12, bold=True, color=C.ACCENT)
        d.wrapped(4.1, y + 0.28, body, 8.3, size=9.5, color=C.MUTED)
        y += row_h + 0.12
    d.footer("Security & Privacy")

    # 10. Challenges
    d.new_page()
    d.header("Engineering", "Challenges & Key Learnings")
    card_w, card_h = 5.55, 2.05
    start_x, start_y = 0.7, 2.25
    for i, (title, body) in enumerate(C.CHALLENGES):
        col, row = i % 2, i // 2
        x = start_x + col * (card_w + 0.4)
        y = start_y + row * (card_h + 0.3)
        d.rect(x, y, card_w, card_h, C.SURFACE, radius=0.06, stroke_color=C.BORDER)
        d.rect(x, y, 0.06, card_h, C.AMBER)
        d.wrapped(x + 0.3, y + 0.4, title, card_w - 0.6, size=13, bold=True, color=C.TEXT)
        d.wrapped(x + 0.3, y + 0.75, body, card_w - 0.6, size=10, color=C.MUTED)
    d.footer("Challenges & Learnings")

    # 11. Demo
    d.new_page()
    d.circle(6.5, 3.5, 5, C.ACCENT, alpha=0.06)
    d.kicker(0.7, 2.6, "Live Demonstration")
    d.text(0.7, 3.3, "Let's See It in Action", size=34, bold=True, color=C.TEXT)
    d.text(0.72, 3.85, "Chat -> Audio Overview -> Knowledge Graph -> Live Collaboration", size=13, color=C.MUTED)
    d.rect(0.72, 4.4, 5.4, 0.6, C.SURFACE, radius=0.3, stroke_color=C.BORDER)
    d.text(0.72 + 2.7, 4.78, C.LIVE_URL, size=13, bold=True, color=C.ACCENT, align="center")
    d.footer("Live Demo")

    # 12. Thanks
    d.new_page()
    d.circle(-1, 4, 3.5, C.BLUE, alpha=0.08)
    d.circle(9, -1, 3.5, C.ACCENT, alpha=0.08)
    d.text(0.7, 3.4, "Thank You", size=42, bold=True, color=C.TEXT)
    d.text(0.72, 3.95, "Questions & Discussion", size=15, color=C.MUTED)
    y = 4.7
    for label, url in C.CLOSING_LINKS:
        d.text(0.72, y + 0.2, label.upper(), size=10, bold=True, color=C.ACCENT)
        d.text(0.72, y + 0.5, url, size=12.5, color=C.TEXT)
        y += 0.75
    d.footer()

    d.save()
    print("Saved:", out_path)


if __name__ == "__main__":
    build()
