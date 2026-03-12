#!/usr/bin/env python3
"""
VARK Slide Deck Generator — Sensory Cartography
Generates a multi-page PDF slide deck about VARK learning styles.
Uses the Sensory Cartography design philosophy.
Font sizes optimized for projector presentation.
"""

import math
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Fonts ──────────────────────────────────────────────────────────────
FONT_DIR = "/Users/shawnlee/.claude/plugins/cache/anthropic-agent-skills/document-skills/7029232b9212/skills/canvas-design/canvas-fonts"

pdfmetrics.registerFont(TTFont("WorkSans", f"{FONT_DIR}/WorkSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("WorkSans-Bold", f"{FONT_DIR}/WorkSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("WorkSans-Italic", f"{FONT_DIR}/WorkSans-Italic.ttf"))
pdfmetrics.registerFont(TTFont("InstrumentSerif", f"{FONT_DIR}/InstrumentSerif-Regular.ttf"))
pdfmetrics.registerFont(TTFont("InstrumentSerif-Italic", f"{FONT_DIR}/InstrumentSerif-Italic.ttf"))
pdfmetrics.registerFont(TTFont("JetBrainsMono", f"{FONT_DIR}/JetBrainsMono-Regular.ttf"))
pdfmetrics.registerFont(TTFont("JetBrainsMono-Bold", f"{FONT_DIR}/JetBrainsMono-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Outfit", f"{FONT_DIR}/Outfit-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Outfit-Bold", f"{FONT_DIR}/Outfit-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Italiana", f"{FONT_DIR}/Italiana-Regular.ttf"))
pdfmetrics.registerFont(TTFont("DMMono", f"{FONT_DIR}/DMMono-Regular.ttf"))

# ── Colors ─────────────────────────────────────────────────────────────
CHARCOAL = HexColor("#1A1A2E")
DARK_BG = HexColor("#0F0F1A")
CREAM = HexColor("#FAF8F5")
WARM_WHITE = HexColor("#F5F3F0")
LIGHT_GRAY = HexColor("#E8E6E3")
MID_GRAY = HexColor("#999999")
DARK_GRAY = HexColor("#333333")

# VARK quaternary palette (from the app)
V_ORANGE = HexColor("#FF7600")
A_BLUE = HexColor("#007AFF")
R_GREEN = HexColor("#34C759")
K_PURPLE = HexColor("#AF52DE")

V_ORANGE_LIGHT = HexColor("#FFF3E6")
A_BLUE_LIGHT = HexColor("#E6F2FF")
R_GREEN_LIGHT = HexColor("#E6F9ED")
K_PURPLE_LIGHT = HexColor("#F3E6FC")

# ── Page Setup ─────────────────────────────────────────────────────────
W, H = landscape(A4)  # 297mm x 210mm
MARGIN = 20 * mm
OUT = "/Users/shawnlee/lyfe-app/assets/vark-deck/vark-slide-deck.pdf"


def draw_grid_dots(c, x0, y0, w, h, spacing=8*mm, radius=0.4, color=None):
    """Draw a subtle dot grid pattern."""
    col = color or HexColor("#DDDDDD")
    c.setFillColor(col)
    cols = int(w / spacing)
    rows = int(h / spacing)
    for row in range(rows + 1):
        for col_i in range(cols + 1):
            cx = x0 + col_i * spacing
            cy = y0 + row * spacing
            if x0 <= cx <= x0 + w and y0 <= cy <= y0 + h:
                c.circle(cx, cy, radius, fill=1, stroke=0)


def draw_horizontal_rule(c, x, y, w, color=LIGHT_GRAY, thickness=0.5):
    c.setStrokeColor(color)
    c.setLineWidth(thickness)
    c.line(x, y, x + w, y)


def draw_rounded_rect(c, x, y, w, h, r=3*mm, fill=None, stroke=None, stroke_width=0.5):
    """Draw a rounded rectangle."""
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(stroke_width)
    c.roundRect(x, y, w, h, r, fill=1 if fill else 0, stroke=1 if stroke else 0)


def draw_circle_badge(c, cx, cy, r, fill_color, letter, font_size=14):
    """Draw a filled circle with a centered letter."""
    c.setFillColor(fill_color)
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("WorkSans-Bold", font_size)
    tw = c.stringWidth(letter, "WorkSans-Bold", font_size)
    c.drawString(cx - tw / 2, cy - font_size * 0.35, letter)


def draw_centered_text(c, text, y, font="WorkSans", size=14, color=DARK_GRAY):
    """Draw horizontally centered text."""
    c.setFillColor(color)
    c.setFont(font, size)
    tw = c.stringWidth(text, font, size)
    c.drawString((W - tw) / 2, y, text)


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 1 — TITLE
# ═══════════════════════════════════════════════════════════════════════
def slide_title(c):
    c.setFillColor(DARK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    draw_grid_dots(c, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN,
                   spacing=12 * mm, radius=0.3, color=HexColor("#2A2A3E"))

    # Four color specimen bars at top
    bar_w = 40 * mm
    bar_h = 3.5 * mm
    bar_y = H - MARGIN - 15 * mm
    colors = [V_ORANGE, A_BLUE, R_GREEN, K_PURPLE]
    bar_labels = ["V", "A", "R", "K"]
    total_w = 4 * bar_w + 3 * 6 * mm
    bar_x = (W - total_w) / 2
    for i, (col, lbl) in enumerate(zip(colors, bar_labels)):
        bx = bar_x + i * (bar_w + 6 * mm)
        c.setFillColor(col)
        c.rect(bx, bar_y, bar_w, bar_h, fill=1, stroke=0)
        c.setFillColor(HexColor("#444455"))
        c.setFont("DMMono", 6)
        c.drawRightString(bx + bar_w, bar_y - 4.5 * mm, lbl)

    # Reference index
    c.setFillColor(HexColor("#444455"))
    c.setFont("DMMono", 8)
    c.drawString(bar_x, bar_y - 12 * mm, "REF. 01  —  SENSORY CARTOGRAPHY INSTITUTE")

    # Title — large for projector
    c.setFillColor(CREAM)
    c.setFont("InstrumentSerif", 88)
    title = "VARK"
    tw = c.stringWidth(title, "InstrumentSerif", 88)
    title_y = H / 2 + 8 * mm
    c.drawString((W - tw) / 2, title_y, title)

    # Subtitle
    c.setFillColor(HexColor("#AAAABB"))
    c.setFont("WorkSans", 22)
    sub = "Understanding Your Learning Style"
    tw2 = c.stringWidth(sub, "WorkSans", 22)
    c.drawString((W - tw2) / 2, title_y - 26 * mm, sub)

    # Bottom index line
    c.setFont("DMMono", 8)
    c.setFillColor(HexColor("#444455"))
    c.drawString(MARGIN, MARGIN + 5 * mm, "VISUAL  ·  AURAL  ·  READ/WRITE  ·  KINESTHETIC")
    c.drawRightString(W - MARGIN, MARGIN + 5 * mm, "LYFE TRAINING MODULE  ·  SEEDLYFE")

    # Four small circles at bottom center
    dot_y = MARGIN + 20 * mm
    dot_spacing = 14 * mm
    dot_x = W / 2 - 1.5 * dot_spacing
    for i, col in enumerate(colors):
        draw_circle_badge(c, dot_x + i * dot_spacing, dot_y, 4 * mm, col,
                          ["V", "A", "R", "K"][i], 9)


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 2 — WHAT IS VARK?
# ═══════════════════════════════════════════════════════════════════════
def slide_what_is_vark(c):
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setFillColor(MID_GRAY)
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN, "02  ·  FRAMEWORK OVERVIEW")
    c.drawRightString(W - MARGIN, H - MARGIN, "VARK  ·  FLEMING & MILLS, 1992")

    draw_horizontal_rule(c, MARGIN, H - MARGIN - 4 * mm, W - 2 * MARGIN, LIGHT_GRAY)

    # Section title
    y = H - MARGIN - 24 * mm
    c.setFillColor(DARK_GRAY)
    c.setFont("InstrumentSerif", 48)
    c.drawString(MARGIN, y, "What is VARK?")

    # Body text — left column
    y -= 20 * mm
    c.setFont("WorkSans", 15)
    c.setFillColor(HexColor("#555555"))
    body_lines = [
        "VARK is a learning preference model developed",
        "by Neil Fleming in 1987. It identifies four",
        "primary sensory modalities through which",
        "individuals prefer to receive and process",
        "new information.",
        "",
        "Rather than measuring intelligence or ability,",
        "VARK maps your natural preferences — the",
        "pathways your mind favors when absorbing",
        "new concepts.",
    ]
    for line in body_lines:
        c.drawString(MARGIN, y, line)
        y -= 6.5 * mm

    # Right side — four type cards
    card_x = W / 2 + 10 * mm
    card_w = W / 2 - MARGIN - 10 * mm
    card_h = 30 * mm
    card_gap = 5 * mm
    card_y = H - MARGIN - 34 * mm

    types_data = [
        ("V", "Visual", V_ORANGE, V_ORANGE_LIGHT, "Maps, diagrams, charts, spatial layouts"),
        ("A", "Aural", A_BLUE, A_BLUE_LIGHT, "Listening, discussion, verbal explanation"),
        ("R", "Read/Write", R_GREEN, R_GREEN_LIGHT, "Text, notes, manuals, written words"),
        ("K", "Kinesthetic", K_PURPLE, K_PURPLE_LIGHT, "Practice, examples, hands-on experience"),
    ]

    for letter, label, col, bg, desc in types_data:
        draw_rounded_rect(c, card_x, card_y - card_h, card_w, card_h, r=2 * mm, fill=bg)

        c.setFillColor(col)
        c.rect(card_x, card_y - card_h, 3.5 * mm, card_h, fill=1, stroke=0)

        draw_circle_badge(c, card_x + 16 * mm, card_y - card_h / 2, 6 * mm, col, letter, 14)

        c.setFillColor(DARK_GRAY)
        c.setFont("WorkSans-Bold", 16)
        c.drawString(card_x + 27 * mm, card_y - card_h / 2 + 3 * mm, label)

        c.setFillColor(HexColor("#666666"))
        c.setFont("WorkSans", 11)
        c.drawString(card_x + 27 * mm, card_y - card_h / 2 - 7 * mm, desc)

        card_y -= card_h + card_gap

    # Bottom note
    c.setFillColor(MID_GRAY)
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, MARGIN + 3 * mm, "NOTE: VARK measures preference, not ability. All modalities can be developed.")


# ═══════════════════════════════════════════════════════════════════════
# MODALITY PROFILE SLIDE — reusable for V, A, R, K
# ═══════════════════════════════════════════════════════════════════════
def slide_modality(c, slide_num, letter, label, color, color_light, subhead, desc_lines, tips):
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Top color bar
    c.setFillColor(color)
    c.rect(0, H - 7 * mm, W, 7 * mm, fill=1, stroke=0)

    c.setFillColor(MID_GRAY)
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN - 2 * mm, f"{slide_num:02d}  ·  MODALITY PROFILE")
    c.drawRightString(W - MARGIN, H - MARGIN - 2 * mm, f"ZONE {letter}  ·  {label.upper()}")

    # Large watermark letter
    c.setFillColor(color_light)
    c.setFont("InstrumentSerif", 250)
    c.drawString(W - MARGIN - 130 * mm, -15 * mm, letter)

    # Badge + Title
    y = H - MARGIN - 22 * mm
    draw_circle_badge(c, MARGIN + 10 * mm, y, 10 * mm, color, letter, 22)
    c.setFillColor(DARK_GRAY)
    c.setFont("InstrumentSerif", 44)
    c.drawString(MARGIN + 26 * mm, y - 6 * mm, f"{label} Learner")

    # Subhead
    y -= 22 * mm
    c.setFillColor(color)
    c.setFont("WorkSans-Bold", 13)
    c.drawString(MARGIN, y, subhead)

    # Description
    y -= 14 * mm
    c.setFillColor(HexColor("#555555"))
    c.setFont("WorkSans", 15)
    for line in desc_lines:
        c.drawString(MARGIN, y, line)
        y -= 7 * mm

    # Study tips
    y -= 8 * mm
    c.setFillColor(DARK_GRAY)
    c.setFont("WorkSans-Bold", 16)
    c.drawString(MARGIN, y, "Study Strategies")
    y -= 4 * mm
    draw_horizontal_rule(c, MARGIN, y, 70 * mm, color, 2)

    y -= 12 * mm
    col1_x = MARGIN
    col2_x = W / 2 + 5 * mm
    tip_h = 20 * mm

    for i, (num, title, sub) in enumerate(tips):
        tx = col1_x if i < 3 else col2_x
        ty = y - (i % 3) * (tip_h + 3 * mm)

        c.setFillColor(color)
        c.setFont("DMMono", 26)
        c.drawString(tx, ty, num)

        c.setFillColor(DARK_GRAY)
        c.setFont("WorkSans-Bold", 13)
        c.drawString(tx + 16 * mm, ty + 3 * mm, title)

        c.setFillColor(HexColor("#777777"))
        c.setFont("WorkSans", 11)
        c.drawString(tx + 16 * mm, ty - 6 * mm, sub)


def slide_visual(c):
    slide_modality(c, 3, "V", "Visual", V_ORANGE, V_ORANGE_LIGHT,
        "PREFERS SPATIAL & GRAPHIC INFORMATION",
        [
            "Visual learners process information best through",
            "maps, diagrams, charts, flowcharts, and spatial",
            "arrangements. They think in pictures and need to",
            "see information organized visually.",
        ],
        [
            ("01", "Draw mind maps and diagrams", "Convert text into visual flowcharts"),
            ("02", "Use color-coding systems", "Highlight with consistent color schemes"),
            ("03", "Watch video demonstrations", "Pause and sketch key concepts"),
            ("04", "Create spatial layouts", "Arrange notes physically on a surface"),
            ("05", "Use charts and graphs", "Transform data into visual formats"),
        ])


def slide_aural(c):
    slide_modality(c, 4, "A", "Aural", A_BLUE, A_BLUE_LIGHT,
        "PREFERS LISTENING & VERBAL EXCHANGE",
        [
            "Aural learners absorb information through",
            "listening, discussion, and verbal explanation.",
            "They learn best when they can hear ideas spoken",
            "aloud and engage in dialogue about concepts.",
        ],
        [
            ("01", "Attend lectures and discussions", "Engage actively — ask questions aloud"),
            ("02", "Record and replay key points", "Listen to recordings during commutes"),
            ("03", "Explain concepts to others", "Teaching solidifies your understanding"),
            ("04", "Use mnemonic devices", "Create rhythmic or musical memory aids"),
            ("05", "Join study groups", "Verbal debate deepens comprehension"),
        ])


def slide_readwrite(c):
    slide_modality(c, 5, "R", "Read/Write", R_GREEN, R_GREEN_LIGHT,
        "PREFERS TEXT-BASED INFORMATION",
        [
            "Read/Write learners thrive with text — articles,",
            "manuals, notes, and written explanations. They",
            "process information by reading carefully and",
            "rewriting it in their own words.",
        ],
        [
            ("01", "Rewrite notes in your own words", "Paraphrasing strengthens retention"),
            ("02", "Create detailed written summaries", "Condense chapters into key points"),
            ("03", "Use lists and written outlines", "Structure information hierarchically"),
            ("04", "Read widely around the topic", "Multiple sources deepen understanding"),
            ("05", "Write practice answers", "Simulate exam conditions in writing"),
        ])


def slide_kinesthetic(c):
    slide_modality(c, 6, "K", "Kinesthetic", K_PURPLE, K_PURPLE_LIGHT,
        "PREFERS HANDS-ON EXPERIENCE",
        [
            "Kinesthetic learners need to do things to",
            "understand them. They learn through practice,",
            "real-world examples, simulations, and physical",
            "engagement. Theory comes alive through application.",
        ],
        [
            ("01", "Learn through real-life examples", "Connect theory to practical situations"),
            ("02", "Role-play and simulate scenarios", "Act out processes to internalize them"),
            ("03", "Use hands-on practice exercises", "Build physical models or prototypes"),
            ("04", "Take frequent study breaks", "Move between topics to stay engaged"),
            ("05", "Apply concepts immediately", "Practice before moving to the next idea"),
        ])


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 7 — QUIZ CTA (NEW — middle of deck)
# ═══════════════════════════════════════════════════════════════════════
def slide_quiz_cta(c):
    c.setFillColor(DARK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    draw_grid_dots(c, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN,
                   spacing=12 * mm, radius=0.3, color=HexColor("#2A2A3E"))

    c.setFillColor(HexColor("#555566"))
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN, "07  ·  ACTIVITY")
    c.drawRightString(W - MARGIN, H - MARGIN, "YOUR TURN")

    # Four small VARK dots above the title
    colors = [V_ORANGE, A_BLUE, R_GREEN, K_PURPLE]
    dot_spacing = 16 * mm
    dot_x = W / 2 - 1.5 * dot_spacing
    dot_y = H / 2 + 52 * mm
    for i, col in enumerate(colors):
        draw_circle_badge(c, dot_x + i * dot_spacing, dot_y, 5 * mm, col,
                          ["V", "A", "R", "K"][i], 12)

    # Main CTA title
    y = H / 2 + 18 * mm
    draw_centered_text(c, "Time to Discover", y,
                       "InstrumentSerif", 52, CREAM)

    y -= 18 * mm
    draw_centered_text(c, "Your Learning Style", y,
                       "InstrumentSerif", 52, CREAM)

    # Divider line
    div_w = 80 * mm
    y -= 14 * mm
    c.setStrokeColor(V_ORANGE)
    c.setLineWidth(2)
    c.line(W / 2 - div_w / 2, y, W / 2 + div_w / 2, y)

    # Instructions
    y -= 18 * mm
    draw_centered_text(c, "Open the Lyfe App", y,
                       "WorkSans-Bold", 22, HexColor("#CCCCDD"))

    y -= 14 * mm
    draw_centered_text(c, "Go to Quizzes  >  VARK Assessment", y,
                       "WorkSans", 18, HexColor("#888899"))

    y -= 22 * mm
    draw_centered_text(c, "Take the quiz now — we'll discuss your results!", y,
                       "WorkSans-Italic", 16, V_ORANGE)

    # Bottom reference
    c.setFillColor(HexColor("#444455"))
    c.setFont("DMMono", 8)
    c.drawString(MARGIN, MARGIN + 5 * mm, "SENSORY CARTOGRAPHY INSTITUTE  ·  LYFE TRAINING")


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 8 — MULTIMODAL & PREFERENCES
# ═══════════════════════════════════════════════════════════════════════
def slide_multimodal(c):
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setFillColor(MID_GRAY)
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN, "08  ·  PREFERENCE CLASSIFICATION")
    c.drawRightString(W - MARGIN, H - MARGIN, "MULTIMODAL LEARNING")

    draw_horizontal_rule(c, MARGIN, H - MARGIN - 4 * mm, W - 2 * MARGIN, LIGHT_GRAY)

    y = H - MARGIN - 24 * mm
    c.setFillColor(DARK_GRAY)
    c.setFont("InstrumentSerif", 44)
    c.drawString(MARGIN, y, "Most People Are Multimodal")

    y -= 16 * mm
    c.setFillColor(HexColor("#555555"))
    c.setFont("WorkSans", 15)
    lines = [
        "Research shows that most learners don't fit neatly into a single",
        "category. Instead, they blend multiple modalities. Your VARK",
        "profile classifies your preference into one of four categories:",
    ]
    for line in lines:
        c.drawString(MARGIN, y, line)
        y -= 7 * mm

    # Four preference cards
    y -= 8 * mm
    card_data = [
        ("Single", "One dominant modality", "You strongly prefer one learning channel above all others.",
         V_ORANGE, "1 type"),
        ("Bimodal", "Two strong modalities", "You flex between two preferred channels depending on context.",
         A_BLUE, "2 types"),
        ("Trimodal", "Three strong modalities", "You comfortably use three channels, adapting to the material.",
         R_GREEN, "3 types"),
        ("Multimodal", "All four modalities", "You have no strong single preference — you're adaptable across all.",
         K_PURPLE, "4 types"),
    ]

    card_w = (W - 2 * MARGIN - 3 * 5 * mm) / 4
    card_h = 58 * mm

    for i, (title, sub, desc, col, badge_text) in enumerate(card_data):
        cx = MARGIN + i * (card_w + 5 * mm)
        cy = y - card_h

        draw_rounded_rect(c, cx, cy, card_w, card_h, r=2 * mm, fill=white,
                          stroke=LIGHT_GRAY, stroke_width=0.5)

        # Top color bar
        c.setFillColor(col)
        c.roundRect(cx, cy + card_h - 9 * mm, card_w, 9 * mm, 2 * mm, fill=1, stroke=0)
        c.rect(cx, cy + card_h - 9 * mm, card_w, 4.5 * mm, fill=1, stroke=0)

        c.setFillColor(white)
        c.setFont("DMMono", 8)
        tw = c.stringWidth(badge_text, "DMMono", 8)
        c.drawString(cx + card_w - tw - 3 * mm, cy + card_h - 7 * mm, badge_text)

        c.setFillColor(DARK_GRAY)
        c.setFont("WorkSans-Bold", 16)
        c.drawString(cx + 4 * mm, cy + card_h - 22 * mm, title)

        c.setFillColor(col)
        c.setFont("WorkSans-Bold", 9)
        c.drawString(cx + 4 * mm, cy + card_h - 30 * mm, sub.upper())

        c.setFillColor(HexColor("#666666"))
        c.setFont("WorkSans", 10)
        words = desc.split()
        line = ""
        ty = cy + card_h - 38 * mm
        for word in words:
            test = line + " " + word if line else word
            if c.stringWidth(test, "WorkSans", 10) < card_w - 8 * mm:
                line = test
            else:
                c.drawString(cx + 4 * mm, ty, line)
                ty -= 4.5 * mm
                line = word
        if line:
            c.drawString(cx + 4 * mm, ty, line)

    # Bottom insight
    bottom_y = y - card_h - 12 * mm
    draw_horizontal_rule(c, MARGIN, bottom_y + 6 * mm, W - 2 * MARGIN, LIGHT_GRAY)
    c.setFillColor(HexColor("#555555"))
    c.setFont("WorkSans-Italic", 13)
    c.drawString(MARGIN, bottom_y,
                 "Tip: Multimodal learners benefit from combining strategies — experiment to find your ideal mix.")


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 9 — THE VARK COMPASS
# ═══════════════════════════════════════════════════════════════════════
def slide_compass(c):
    c.setFillColor(DARK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    draw_grid_dots(c, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN,
                   spacing=10 * mm, radius=0.25, color=HexColor("#1A1A2A"))

    c.setFillColor(HexColor("#555566"))
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN, "09  ·  SENSORY CARTOGRAPHY")
    c.drawRightString(W - MARGIN, H - MARGIN, "THE FOUR ZONES")

    center_x, center_y = W / 2, H / 2 + 2 * mm
    outer_r = 52 * mm
    core_r = 7 * mm

    for ring_r in [18 * mm, 35 * mm, outer_r]:
        c.setStrokeColor(HexColor("#252538"))
        c.setLineWidth(0.4)
        c.circle(center_x, center_y, ring_r, fill=0, stroke=1)

    colors_data = [
        (V_ORANGE, "V", "VISUAL", 0, 90),
        (A_BLUE, "A", "AURAL", 90, 180),
        (R_GREEN, "R", "READ/WRITE", 180, 270),
        (K_PURPLE, "K", "KINESTHETIC", 270, 360),
    ]

    for col, letter, label, start_deg, end_deg in colors_data:
        muted = HexColor("#%02x%02x%02x" % (
            int(col.red * 255 * 0.25 + 15),
            int(col.green * 255 * 0.25 + 15),
            int(col.blue * 255 * 0.25 + 15),
        ))
        c.setFillColor(muted)
        p = c.beginPath()
        p.moveTo(center_x, center_y)
        steps = 40
        for s in range(steps + 1):
            angle = math.radians(90 - start_deg - (end_deg - start_deg) * s / steps)
            p.lineTo(center_x + outer_r * math.cos(angle),
                     center_y + outer_r * math.sin(angle))
        p.close()
        c.drawPath(p, fill=1, stroke=0)

        edge_angle = math.radians(90 - start_deg)
        c.setStrokeColor(HexColor("#1A1A28"))
        c.setLineWidth(1.2)
        c.line(center_x, center_y,
               center_x + (outer_r + 1 * mm) * math.cos(edge_angle),
               center_y + (outer_r + 1 * mm) * math.sin(edge_angle))

        mid_deg = (start_deg + end_deg) / 2
        badge_r = outer_r + 16 * mm
        bx = center_x + badge_r * math.cos(math.radians(90 - mid_deg))
        by = center_y + badge_r * math.sin(math.radians(90 - mid_deg))

        draw_circle_badge(c, bx, by, 7 * mm, col, letter, 17)

        c.setFillColor(HexColor("#888899"))
        c.setFont("DMMono", 8)
        tw = c.stringWidth(label, "DMMono", 8)
        c.drawString(bx - tw / 2, by - 12 * mm, label)

    c.setFillColor(HexColor("#1A1A28"))
    c.circle(center_x, center_y, core_r, fill=1, stroke=0)
    c.setStrokeColor(HexColor("#444455"))
    c.setLineWidth(0.6)
    c.circle(center_x, center_y, core_r, fill=0, stroke=1)
    c.setFillColor(HexColor("#CCCCDD"))
    c.setFont("DMMono", 7)
    tw = c.stringWidth("YOU", "DMMono", 7)
    c.drawString(center_x - tw / 2, center_y - 2.5, "YOU")

    c.setStrokeColor(HexColor("#2A2A3E"))
    c.setLineWidth(0.3)
    c.setDash(1.5, 3)
    c.line(center_x, center_y - outer_r - 20 * mm, center_x, center_y + outer_r + 20 * mm)
    c.line(center_x - outer_r - 20 * mm, center_y, center_x + outer_r + 20 * mm, center_y)
    c.setDash()

    c.setFillColor(CREAM)
    c.setFont("InstrumentSerif", 24)
    c.drawString(MARGIN, MARGIN + 14 * mm, "Your Sensory Landscape")
    c.setFillColor(HexColor("#666677"))
    c.setFont("WorkSans", 12)
    c.drawString(MARGIN, MARGIN + 3 * mm,
                 "Every learner's map is unique — your results show which zones you naturally gravitate toward.")


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 10 — APPLYING YOUR RESULTS
# ═══════════════════════════════════════════════════════════════════════
def slide_applying(c):
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setFillColor(MID_GRAY)
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN, "10  ·  PRACTICAL APPLICATION")
    c.drawRightString(W - MARGIN, H - MARGIN, "MAKING IT WORK FOR YOU")

    draw_horizontal_rule(c, MARGIN, H - MARGIN - 4 * mm, W - 2 * MARGIN, LIGHT_GRAY)

    y = H - MARGIN - 24 * mm
    c.setFillColor(DARK_GRAY)
    c.setFont("InstrumentSerif", 44)
    c.drawString(MARGIN, y, "Applying Your Results")

    y -= 16 * mm
    c.setFillColor(HexColor("#555555"))
    c.setFont("WorkSans", 15)
    lines = [
        "Now that you know your VARK profile, here's how to use it",
        "in your insurance training and professional development:",
    ]
    for line in lines:
        c.drawString(MARGIN, y, line)
        y -= 7 * mm

    # Three application columns
    y -= 10 * mm
    col_w = (W - 2 * MARGIN - 2 * 8 * mm) / 3

    columns = [
        ("In Training Sessions", V_ORANGE, [
            "Identify which parts of the",
            "curriculum match your style.",
            "",
            "Request materials in your",
            "preferred format when possible.",
            "",
            "Use your VARK profile to",
            "choose study methods that",
            "maximize retention.",
        ]),
        ("With Your Team", A_BLUE, [
            "Share your learning style with",
            "colleagues and managers.",
            "",
            "When explaining concepts to",
            "others, consider their VARK",
            "type — not just yours.",
            "",
            "Adapt presentations to cover",
            "multiple modalities.",
        ]),
        ("For Client Work", R_GREEN, [
            "Match your communication",
            "style to each client's needs.",
            "",
            "Visual clients want charts;",
            "aural clients want calls;",
            "R/W clients want documents.",
            "",
            "Kinesthetic clients need to",
            "walk through scenarios.",
        ]),
    ]

    for i, (title, col, lines_list) in enumerate(columns):
        cx = MARGIN + i * (col_w + 8 * mm)
        cy = y

        c.setFillColor(col)
        c.rect(cx, cy, col_w, 2.5, fill=1, stroke=0)

        cy -= 9 * mm
        c.setFillColor(DARK_GRAY)
        c.setFont("WorkSans-Bold", 15)
        c.drawString(cx, cy, title)

        cy -= 9 * mm
        c.setFillColor(HexColor("#666666"))
        c.setFont("WorkSans", 11)
        for line in lines_list:
            c.drawString(cx, cy, line)
            cy -= 4.8 * mm


# ═══════════════════════════════════════════════════════════════════════
# SLIDE 11 — CLOSING (audience engagement)
# ═══════════════════════════════════════════════════════════════════════
def slide_closing(c):
    c.setFillColor(DARK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    draw_grid_dots(c, MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN,
                   spacing=12 * mm, radius=0.3, color=HexColor("#2A2A3E"))

    c.setFillColor(HexColor("#555566"))
    c.setFont("DMMono", 9)
    c.drawString(MARGIN, H - MARGIN, "11  ·  REFLECTION")
    c.drawRightString(W - MARGIN, H - MARGIN, "OVER TO YOU")

    # Four VARK circles — smaller, positioned as accent
    colors = [V_ORANGE, A_BLUE, R_GREEN, K_PURPLE]
    letters = ["V", "A", "R", "K"]
    circle_r = 8 * mm
    dot_spacing = 20 * mm
    dot_x = W / 2 - 1.5 * dot_spacing
    dot_y = H - MARGIN - 28 * mm
    for i, (col, letter) in enumerate(zip(colors, letters)):
        draw_circle_badge(c, dot_x + i * dot_spacing, dot_y, circle_r, col, letter, 16)

    # Main question — large, centered, multi-line
    y = H / 2 + 16 * mm
    draw_centered_text(c, "Now that you know", y,
                       "InstrumentSerif", 44, HexColor("#AAAABB"))

    y -= 18 * mm
    draw_centered_text(c, "your learning style...", y,
                       "InstrumentSerif-Italic", 44, HexColor("#AAAABB"))

    # Divider
    div_w = 60 * mm
    y -= 16 * mm
    c.setStrokeColor(V_ORANGE)
    c.setLineWidth(2.5)
    c.line(W / 2 - div_w / 2, y, W / 2 + div_w / 2, y)

    # The engagement question — bold, bright
    y -= 24 * mm
    draw_centered_text(c, "What is one thing you will", y,
                       "WorkSans-Bold", 28, CREAM)

    y -= 14 * mm
    draw_centered_text(c, "do differently?", y,
                       "WorkSans-Bold", 28, CREAM)

    # Bottom reference
    c.setFillColor(HexColor("#444455"))
    c.setFont("DMMono", 8)
    c.drawString(MARGIN, MARGIN + 5 * mm, "SENSORY CARTOGRAPHY INSTITUTE  ·  LYFE TRAINING")
    c.drawRightString(W - MARGIN, MARGIN + 5 * mm, "SEEDLYFE MODULE  ·  11/11")


# ═══════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════
def main():
    pdf = canvas.Canvas(OUT, pagesize=landscape(A4))
    pdf.setTitle("VARK — Understanding Your Learning Style")
    pdf.setAuthor("Lyfe Training · Sensory Cartography Institute")

    slides = [
        slide_title,          # 1  — Title
        slide_what_is_vark,   # 2  — What is VARK?
        slide_visual,         # 3  — Visual Learner
        slide_aural,          # 4  — Aural Learner
        slide_readwrite,      # 5  — Read/Write Learner
        slide_kinesthetic,    # 6  — Kinesthetic Learner
        slide_quiz_cta,       # 7  — Go take the quiz! (NEW)
        slide_multimodal,     # 8  — Multimodal Preferences
        slide_compass,        # 9  — Sensory Compass
        slide_applying,       # 10 — Applying Your Results
        slide_closing,        # 11 — What will you do differently? (NEW)
    ]

    for i, slide_fn in enumerate(slides):
        slide_fn(pdf)
        if i < len(slides) - 1:
            pdf.showPage()

    pdf.save()
    print(f"Generated {len(slides)}-page deck -> {OUT}")


if __name__ == "__main__":
    main()
