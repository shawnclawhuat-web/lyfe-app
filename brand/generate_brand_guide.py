#!/usr/bin/env python3
"""Generate Lyfe Brand Identity Guide PDF."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# ── Constants ──────────────────────────────────────────────────
W, H = A4  # 595.27 x 841.89 points
MARGIN = 40
CONTENT_W = W - 2 * MARGIN

# ── Colors ─────────────────────────────────────────────────────
ORANGE = HexColor('#FF7600')
ORANGE_LIGHT = HexColor('#FFF1E5')
ORANGE_DARK = HexColor('#CC5E00')
ORANGE_MUTED = HexColor('#FFB366')
DARK_BG = HexColor('#1C1C1E')
DARK_ELEVATED = HexColor('#2C2C2E')
LIGHT_BG = HexColor('#F2F2F7')
NEAR_BLACK = HexColor('#111111')
GRAY_TEXT = HexColor('#3C3C43')
GRAY_LIGHT = HexColor('#8E8E93')
SUCCESS = HexColor('#34C759')
WARNING = HexColor('#EAB308')
DANGER = HexColor('#FF3B30')
INFO = HexColor('#007AFF')
SEED_LYFE = HexColor('#8BC34A')
SPROUT_LYFE = HexColor('#6DAF3E')
INDIGO = HexColor('#6366F1')
PINK = HexColor('#EC4899')
AMBER = HexColor('#F59E0B')

LOGO_PATH = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images', 'lyfe-logo-orange.png')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'Lyfe-Brand-Identity.pdf')


def hex_to_rgb_str(hex_color):
    """Convert HexColor to 'R, G, B' string (0-255)."""
    return f'{int(hex_color.red*255)}, {int(hex_color.green*255)}, {int(hex_color.blue*255)}'


class BrandGuide:
    def __init__(self):
        self.c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)
        self.c.setTitle('Lyfe Brand Identity Guide')
        self.c.setAuthor('Lyfe')
        self.c.setSubject('Brand Identity Guidelines')
        self.page_num = 0

    def save(self):
        self.c.save()
        print(f'PDF saved to: {OUTPUT_PATH}')

    def new_page(self, bg=None):
        if self.page_num > 0:
            self.c.showPage()
        self.page_num += 1
        if bg:
            self.c.setFillColor(bg)
            self.c.rect(0, 0, W, H, fill=1, stroke=0)

    def draw_page_number(self, color=GRAY_LIGHT):
        self.c.setFillColor(color)
        self.c.setFont('Helvetica', 9)
        self.c.drawRightString(W - MARGIN, 25, f'{self.page_num:02d}')

    def draw_section_header(self, y, number, title, color=NEAR_BLACK):
        """Draw a section header with number and title."""
        self.c.setFillColor(ORANGE)
        self.c.setFont('Helvetica', 11)
        self.c.drawString(MARGIN, y, f'{number:02d}')
        self.c.setFillColor(color)
        self.c.setFont('Helvetica-Bold', 28)
        self.c.drawString(MARGIN, y - 34, title)
        return y - 34

    def draw_body(self, x, y, text, size=11, color=GRAY_TEXT, leading=18, max_width=CONTENT_W, font='Helvetica'):
        """Draw wrapped body text. Returns new y position."""
        self.c.setFillColor(color)
        self.c.setFont(font, size)
        words = text.split(' ')
        line = ''
        for word in words:
            test = f'{line} {word}'.strip()
            if self.c.stringWidth(test, font, size) > max_width:
                self.c.drawString(x, y, line)
                y -= leading
                line = word
            else:
                line = test
        if line:
            self.c.drawString(x, y, line)
            y -= leading
        return y

    def draw_color_swatch(self, x, y, w, h, color, label, hex_str, sublabel=None):
        """Draw a color swatch rectangle with label."""
        self.c.setFillColor(color)
        self.c.roundRect(x, y - h, w, h, 8, fill=1, stroke=0)
        # Label below
        label_y = y - h - 16
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(x, label_y, label)
        self.c.setFillColor(GRAY_LIGHT)
        self.c.setFont('Helvetica', 9)
        self.c.drawString(x, label_y - 14, hex_str)
        if sublabel:
            self.c.drawString(x, label_y - 26, sublabel)

    # ── Page 1: Cover ──────────────────────────────────────────
    def page_cover(self):
        self.new_page(bg=white)
        # Top orange accent bar
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        # Logo
        if os.path.exists(LOGO_PATH):
            logo = ImageReader(LOGO_PATH)
            logo_w, logo_h = 180, 180
            self.c.drawImage(logo, (W - logo_w) / 2, H - 300, logo_w, logo_h,
                             preserveAspectRatio=True, mask='auto')

        # Title
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 42)
        self.c.drawCentredString(W / 2, H - 370, 'Brand Identity')
        self.c.setFont('Helvetica', 42)
        self.c.drawCentredString(W / 2, H - 420, 'Guide')

        # Divider
        self.c.setStrokeColor(ORANGE)
        self.c.setLineWidth(3)
        self.c.line(W / 2 - 40, H - 450, W / 2 + 40, H - 450)

        # Subtitle
        self.c.setFillColor(GRAY_TEXT)
        self.c.setFont('Helvetica', 13)
        self.c.drawCentredString(W / 2, H - 480, 'A comprehensive guide to the Lyfe visual identity,')
        self.c.drawCentredString(W / 2, H - 498, 'voice, and design system.')

        # Version info
        self.c.setFillColor(GRAY_LIGHT)
        self.c.setFont('Helvetica', 10)
        self.c.drawCentredString(W / 2, 80, 'Version 1.0  |  March 2026')
        self.c.drawCentredString(W / 2, 64, 'Confidential  —  Internal Use Only')

    # ── Page 2: Table of Contents ──────────────────────────────
    def page_toc(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 32)
        self.c.drawString(MARGIN, H - 80, 'Contents')

        items = [
            ('01', 'Brand Overview'),
            ('02', 'Logo'),
            ('03', 'Color Palette'),
            ('04', 'Dark Mode'),
            ('05', 'Typography'),
            ('06', 'Iconography'),
            ('07', 'Voice & Tone'),
            ('08', 'UI Patterns'),
            ('09', "Do's & Don'ts"),
        ]

        y = H - 140
        for num, title in items:
            self.c.setFillColor(ORANGE)
            self.c.setFont('Helvetica', 12)
            self.c.drawString(MARGIN, y, num)
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica', 16)
            self.c.drawString(MARGIN + 40, y, title)
            # Dotted line
            self.c.setStrokeColor(HexColor('#E5E5EA'))
            self.c.setLineWidth(0.5)
            self.c.setDash(2, 4)
            line_start = MARGIN + 40 + self.c.stringWidth(title, 'Helvetica', 16) + 10
            self.c.line(line_start, y + 3, W - MARGIN - 30, y + 3)
            self.c.setDash()
            # Page hint
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 11)
            self.c.drawRightString(W - MARGIN, y, f'{int(num) + 2:02d}')
            y -= 50

        self.draw_page_number()

    # ── Page 3: Brand Overview ─────────────────────────────────
    def page_brand_overview(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 1, 'Brand Overview')

        y -= 30
        y = self.draw_body(MARGIN, y,
            'Lyfe is an insurance agency management platform that empowers agencies '
            'to train, grow, and manage their teams with clarity and confidence. '
            'From onboarding new candidates through structured learning roadmaps '
            'to coordinating events and tracking team performance, Lyfe brings '
            'every workflow into one seamless mobile experience.',
            size=12, leading=20)

        y -= 20
        # Mission box
        self.c.setFillColor(ORANGE_LIGHT)
        box_h = 100
        self.c.roundRect(MARGIN, y - box_h, CONTENT_W, box_h, 12, fill=1, stroke=0)
        self.c.setFillColor(ORANGE_DARK)
        self.c.setFont('Helvetica-Bold', 11)
        self.c.drawString(MARGIN + 20, y - 28, 'OUR MISSION')
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica', 13)
        self.c.drawString(MARGIN + 20, y - 52, 'To simplify and elevate the insurance agency experience')
        self.c.drawString(MARGIN + 20, y - 70, 'so every team member can grow with purpose.')

        y -= box_h + 35
        # Brand pillars
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 18)
        self.c.drawString(MARGIN, y, 'Brand Pillars')
        y -= 30

        pillars = [
            ('Clarity', 'Clean interfaces that reduce cognitive load. Every screen has a single, obvious purpose.'),
            ('Growth', 'Structured learning roadmaps (SeedLYFE, SproutLYFE) that guide career progression visibly.'),
            ('Trust', 'Reliable data, consistent patterns, and professional polish that inspires confidence.'),
            ('Warmth', 'Vibrant orange energy balanced with calm neutrals — approachable yet professional.'),
        ]

        col_w = (CONTENT_W - 20) / 2
        for i, (title, desc) in enumerate(pillars):
            col = i % 2
            row = i // 2
            px = MARGIN + col * (col_w + 20)
            py = y - row * 130

            # Pillar card
            self.c.setFillColor(LIGHT_BG)
            self.c.roundRect(px, py - 100, col_w, 100, 10, fill=1, stroke=0)

            # Orange dot
            self.c.setFillColor(ORANGE)
            self.c.circle(px + 16, py - 18, 5, fill=1, stroke=0)

            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 13)
            self.c.drawString(px + 28, py - 22, title)

            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 9.5)
            # Wrap desc
            words = desc.split(' ')
            line = ''
            dy = py - 44
            for word in words:
                test = f'{line} {word}'.strip()
                if self.c.stringWidth(test, 'Helvetica', 9.5) > col_w - 30:
                    self.c.drawString(px + 16, dy, line)
                    dy -= 14
                    line = word
                else:
                    line = test
            if line:
                self.c.drawString(px + 16, dy, line)

        y -= 290
        # Target audience
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 18)
        self.c.drawString(MARGIN, y, 'Audience')
        y -= 24

        roles = [
            ('Directors & Managers', 'Agency leaders who oversee teams and drive performance'),
            ('Agents', 'Field representatives managing leads and client relationships'),
            ('Personal Assistants', 'Support staff coordinating candidates and scheduling'),
            ('Candidates', 'New recruits progressing through training programmes'),
        ]

        for role, desc in roles:
            self.c.setFillColor(ORANGE)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(MARGIN + 10, y, role)
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 180, y, desc)
            y -= 22

        self.draw_page_number()

    # ── Page 4: Logo ───────────────────────────────────────────
    def page_logo(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 2, 'Logo')

        y -= 20
        y = self.draw_body(MARGIN, y,
            'The Lyfe wordmark uses the Pacifico typeface — a friendly, flowing script '
            'that conveys warmth and approachability. The letterforms are organic and '
            'connected, reflecting our emphasis on human connection and growth.',
            size=11, leading=18)

        y -= 15
        # Primary logo on white
        self.c.setFillColor(LIGHT_BG)
        box_h = 160
        self.c.roundRect(MARGIN, y - box_h, CONTENT_W, box_h, 12, fill=1, stroke=0)
        self.c.setFillColor(GRAY_LIGHT)
        self.c.setFont('Helvetica', 9)
        self.c.drawString(MARGIN + 12, y - 16, 'PRIMARY — ON LIGHT')

        if os.path.exists(LOGO_PATH):
            logo = ImageReader(LOGO_PATH)
            lw, lh = 130, 130
            self.c.drawImage(logo, (W - lw) / 2, y - box_h + 10, lw, lh,
                             preserveAspectRatio=True, mask='auto')

        y -= box_h + 15
        # Logo on dark
        self.c.setFillColor(DARK_BG)
        box_h2 = 160
        self.c.roundRect(MARGIN, y - box_h2, CONTENT_W, box_h2, 12, fill=1, stroke=0)
        self.c.setFillColor(GRAY_LIGHT)
        self.c.setFont('Helvetica', 9)
        self.c.drawString(MARGIN + 12, y - 16, 'PRIMARY — ON DARK')

        if os.path.exists(LOGO_PATH):
            self.c.drawImage(logo, (W - lw) / 2, y - box_h2 + 10, lw, lh,
                             preserveAspectRatio=True, mask='auto')

        y -= box_h2 + 25
        # Clear space & sizing
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Clear Space & Minimum Size')
        y -= 20
        y = self.draw_body(MARGIN, y,
            'Maintain a clear space equal to the height of the lowercase "y" on all sides '
            'of the logo. The minimum display size is 80px wide for digital and 20mm for print.',
            size=10, leading=16)

        y -= 10
        # Sizing specs
        sizes = [
            ('App Icon', '1024 x 1024 px'),
            ('In-app (sm)', 'fontSize 20, lineHeight 28'),
            ('In-app (md)', 'fontSize 32, lineHeight 40'),
            ('In-app (lg)', 'fontSize 48, lineHeight 72'),
            ('Letter Spacing', '1px'),
        ]
        for label, val in sizes:
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 10, y, label)
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 10)
            self.c.drawString(MARGIN + 160, y, val)
            y -= 18

        self.draw_page_number()

    # ── Page 5: Color Palette ──────────────────────────────────
    def page_colors(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 3, 'Color Palette')

        y -= 20
        y = self.draw_body(MARGIN, y,
            'Our palette is anchored by Vibrant Orange — energetic and confident. '
            'It is supported by a neutral system that ensures legibility and '
            'a set of semantic colors for functional communication.',
            size=11, leading=18)

        y -= 20
        # Primary accent row
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 14)
        self.c.drawString(MARGIN, y, 'Primary Accent')
        y -= 15

        swatch_h = 70
        swatch_w = (CONTENT_W - 30) / 4
        accents = [
            (ORANGE, 'Vibrant Orange', '#FF7600'),
            (ORANGE_LIGHT, 'Light', '#FFF1E5'),
            (ORANGE_DARK, 'Dark', '#CC5E00'),
            (ORANGE_MUTED, 'Muted', '#FFB366'),
        ]
        for i, (col, label, hx) in enumerate(accents):
            sx = MARGIN + i * (swatch_w + 10)
            self.draw_color_swatch(sx, y, swatch_w, swatch_h, col, label, hx)

        y -= swatch_h + 50
        # Semantic colors
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 14)
        self.c.drawString(MARGIN, y, 'Semantic Colors')
        y -= 15

        semantics = [
            (SUCCESS, 'Success', '#34C759'),
            (WARNING, 'Warning', '#EAB308'),
            (DANGER, 'Danger', '#FF3B30'),
            (INFO, 'Info', '#007AFF'),
        ]
        for i, (col, label, hx) in enumerate(semantics):
            sx = MARGIN + i * (swatch_w + 10)
            self.draw_color_swatch(sx, y, swatch_w, swatch_h, col, label, hx)

        y -= swatch_h + 50
        # Programme colors
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 14)
        self.c.drawString(MARGIN, y, 'Programme Colors')
        y -= 15

        progs = [
            (SEED_LYFE, 'SeedLYFE', '#8BC34A'),
            (SPROUT_LYFE, 'SproutLYFE', '#6DAF3E'),
            (INDIGO, 'Manager', '#6366F1'),
            (PINK, 'Roadshow', '#EC4899'),
        ]
        for i, (col, label, hx) in enumerate(progs):
            sx = MARGIN + i * (swatch_w + 10)
            self.draw_color_swatch(sx, y, swatch_w, swatch_h, col, label, hx)

        y -= swatch_h + 50
        # Neutrals
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 14)
        self.c.drawString(MARGIN, y, 'Neutrals — Light Mode')
        y -= 15

        neutrals = [
            (HexColor('#000000'), 'Primary Text', '#000000'),
            (HexColor('#3C3C43'), 'Secondary Text', '#3C3C43'),
            (HexColor('#8E8E93'), 'Tertiary Text', '#8E8E93'),
            (HexColor('#F2F2F7'), 'Background', '#F2F2F7'),
        ]
        for i, (col, label, hx) in enumerate(neutrals):
            sx = MARGIN + i * (swatch_w + 10)
            self.draw_color_swatch(sx, y, swatch_w, swatch_h, col, label, hx)

        self.draw_page_number()

    # ── Page 6: Dark Mode ──────────────────────────────────────
    def page_dark_mode(self):
        self.new_page(bg=DARK_BG)

        y = H - 70
        self.c.setFillColor(HexColor('#FF8A2E'))
        self.c.setFont('Helvetica', 11)
        self.c.drawString(MARGIN, y, '04')
        self.c.setFillColor(white)
        self.c.setFont('Helvetica-Bold', 28)
        self.c.drawString(MARGIN, y - 34, 'Dark Mode')
        y -= 34

        y -= 25
        self.draw_body(MARGIN, y,
            'Dark mode uses true black (#000000) backgrounds with elevated surfaces '
            'in dark gray. The accent orange shifts to #FF8A2E for improved contrast '
            'against dark surfaces. All semantic colors are adjusted for dark backgrounds.',
            size=11, leading=18, color=HexColor('#EBEBF5'))

        y -= 40
        swatch_h = 65
        swatch_w = (CONTENT_W - 30) / 4

        # Dark accent
        self.c.setFillColor(white)
        self.c.setFont('Helvetica-Bold', 13)
        self.c.drawString(MARGIN, y, 'Accent — Dark Mode')
        y -= 15

        dark_accents = [
            (HexColor('#FF8A2E'), 'Accent', '#FF8A2E'),
            (HexColor('#2D1F0A'), 'Accent Light', '#2D1F0A'),
            (HexColor('#FF7600'), 'Accent Dark', '#FF7600'),
            (HexColor('#B85A1A'), 'Accent Muted', '#B85A1A'),
        ]
        for i, (col, label, hx) in enumerate(dark_accents):
            sx = MARGIN + i * (swatch_w + 10)
            self.c.setFillColor(col)
            self.c.roundRect(sx, y - swatch_h, swatch_w, swatch_h, 8, fill=1, stroke=0)
            label_y = y - swatch_h - 16
            self.c.setFillColor(white)
            self.c.setFont('Helvetica-Bold', 9)
            self.c.drawString(sx, label_y, label)
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 8)
            self.c.drawString(sx, label_y - 13, hx)

        y -= swatch_h + 50
        # Dark surfaces
        self.c.setFillColor(white)
        self.c.setFont('Helvetica-Bold', 13)
        self.c.drawString(MARGIN, y, 'Surface Hierarchy')
        y -= 15

        dark_surfaces = [
            (HexColor('#000000'), 'Background', '#000000'),
            (HexColor('#1C1C1E'), 'Surface Primary', '#1C1C1E'),
            (HexColor('#2C2C2E'), 'Elevated', '#2C2C2E'),
            (HexColor('#38383A'), 'Border', '#38383A'),
        ]
        for i, (col, label, hx) in enumerate(dark_surfaces):
            sx = MARGIN + i * (swatch_w + 10)
            self.c.setFillColor(col)
            self.c.setStrokeColor(HexColor('#38383A'))
            self.c.setLineWidth(0.5)
            self.c.roundRect(sx, y - swatch_h, swatch_w, swatch_h, 8, fill=1, stroke=1)
            label_y = y - swatch_h - 16
            self.c.setFillColor(white)
            self.c.setFont('Helvetica-Bold', 9)
            self.c.drawString(sx, label_y, label)
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 8)
            self.c.drawString(sx, label_y - 13, hx)

        y -= swatch_h + 50
        # Dark semantic
        self.c.setFillColor(white)
        self.c.setFont('Helvetica-Bold', 13)
        self.c.drawString(MARGIN, y, 'Semantic — Dark Mode')
        y -= 15

        dark_semantic = [
            (HexColor('#30D158'), 'Success', '#30D158'),
            (HexColor('#FACC15'), 'Warning', '#FACC15'),
            (HexColor('#FF453A'), 'Danger', '#FF453A'),
            (HexColor('#0A84FF'), 'Info', '#0A84FF'),
        ]
        for i, (col, label, hx) in enumerate(dark_semantic):
            sx = MARGIN + i * (swatch_w + 10)
            self.c.setFillColor(col)
            self.c.roundRect(sx, y - swatch_h, swatch_w, swatch_h, 8, fill=1, stroke=0)
            label_y = y - swatch_h - 16
            self.c.setFillColor(white)
            self.c.setFont('Helvetica-Bold', 9)
            self.c.drawString(sx, label_y, label)
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 8)
            self.c.drawString(sx, label_y - 13, hx)

        y -= swatch_h + 55
        # Key principle
        self.c.setFillColor(DARK_ELEVATED)
        self.c.roundRect(MARGIN, y - 80, CONTENT_W, 80, 10, fill=1, stroke=0)
        self.c.setFillColor(HexColor('#FF8A2E'))
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(MARGIN + 16, y - 24, 'KEY PRINCIPLE')
        self.c.setFillColor(HexColor('#EBEBF5'))
        self.c.setFont('Helvetica', 10.5)
        self.c.drawString(MARGIN + 16, y - 44, 'Never hardcode colors. Always use colors.* from useTheme().')
        self.c.drawString(MARGIN + 16, y - 60, 'The theme system automatically handles light/dark mode switching.')

        self.draw_page_number(color=GRAY_LIGHT)

    # ── Page 7: Typography ─────────────────────────────────────
    def page_typography(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 5, 'Typography')

        y -= 25
        y = self.draw_body(MARGIN, y,
            'Lyfe relies on the system font stack — SF Pro on iOS and Roboto on Android — '
            'for all interface text. This ensures native-feeling typography with optimal '
            'rendering on each platform. The Pacifico script font is reserved exclusively '
            'for the Lyfe wordmark.',
            size=11, leading=18)

        y -= 20
        # Font families
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Font Families')
        y -= 25

        fonts = [
            ('Pacifico', 'Brand wordmark only', 'Script / Display'),
            ('SF Pro (iOS)', 'All interface text', 'System Sans-serif'),
            ('Roboto (Android)', 'All interface text', 'System Sans-serif'),
            ('SpaceMono', 'Code / special display', 'Monospace'),
        ]
        for name, usage, cat in fonts:
            self.c.setFillColor(LIGHT_BG)
            self.c.roundRect(MARGIN, y - 32, CONTENT_W, 32, 6, fill=1, stroke=0)
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(MARGIN + 12, y - 22, name)
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 200, y - 22, usage)
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 9)
            self.c.drawRightString(W - MARGIN - 12, y - 22, cat)
            y -= 40

        y -= 10
        # Type scale
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Type Scale')
        y -= 25

        scale = [
            ('Display', 28, 'Bold (800 iOS / 700 Android)', '-0.5px letter-spacing'),
            ('Title 1', 22, 'Bold', 'Default'),
            ('Title 2', 18, 'Semibold (600)', 'Default'),
            ('Body', 15, 'Regular (400)', 'Default'),
            ('Callout', 13, 'Regular', 'Default'),
            ('Footnote', 11, 'Regular', '0.2px letter-spacing'),
            ('Caption', 9, 'Regular', '0.2px letter-spacing'),
        ]

        for name, size, weight, spacing in scale:
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', size if size <= 22 else 22)
            self.c.drawString(MARGIN + 10, y, name)
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 9)
            self.c.drawString(MARGIN + 200, y + 2, f'{size}px  |  {weight}')
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 8)
            self.c.drawString(MARGIN + 200, y - 12, spacing)
            y -= 38

        y -= 10
        # Principle box
        self.c.setFillColor(ORANGE_LIGHT)
        self.c.roundRect(MARGIN, y - 70, CONTENT_W, 70, 10, fill=1, stroke=0)
        self.c.setFillColor(ORANGE_DARK)
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(MARGIN + 16, y - 22, 'TYPOGRAPHY PRINCIPLE')
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica', 10.5)
        self.c.drawString(MARGIN + 16, y - 42, 'Rely on size and weight to create hierarchy — not color.')
        self.c.drawString(MARGIN + 16, y - 58, 'Reserve accent orange for interactive elements only.')

        self.draw_page_number()

    # ── Page 8: Iconography ────────────────────────────────────
    def page_iconography(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 6, 'Iconography')

        y -= 25
        y = self.draw_body(MARGIN, y,
            'Lyfe uses Ionicons exclusively throughout the interface. This icon set '
            'provides a consistent, iOS-native aesthetic with both outline and filled '
            'variants. No emoji are used anywhere in the UI.',
            size=11, leading=18)

        y -= 20
        # Icon sizing
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Icon Sizes')
        y -= 20

        icon_sizes = [
            ('SM', '16px', 'Inline text, badges, metadata', LIGHT_BG),
            ('MD', '20px', 'List items, secondary actions', LIGHT_BG),
            ('LG', '24px', 'Headers, primary actions, navigation', LIGHT_BG),
            ('XL', '32px', 'Empty states, hero moments', LIGHT_BG),
        ]
        for name, px, usage, bg in icon_sizes:
            self.c.setFillColor(bg)
            self.c.roundRect(MARGIN, y - 36, CONTENT_W, 36, 6, fill=1, stroke=0)
            # Size badge
            self.c.setFillColor(ORANGE)
            self.c.roundRect(MARGIN + 10, y - 30, 40, 22, 4, fill=1, stroke=0)
            self.c.setFillColor(white)
            self.c.setFont('Helvetica-Bold', 10)
            self.c.drawCentredString(MARGIN + 30, y - 24, name)
            # Pixel
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(MARGIN + 62, y - 24, px)
            # Usage
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 120, y - 24, usage)
            y -= 44

        y -= 15
        # Icon patterns
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Icon Patterns')
        y -= 20

        patterns = [
            ('Navigation Tabs', 'Outline when inactive, filled when active (e.g., home-outline / home)'),
            ('Tab Selection', 'Selected tab icon uses accent color; unselected uses #8E8E93'),
            ('Action Buttons', 'Filled style, paired with label text'),
            ('Status Indicators', 'Color-coded with semantic colors (success, warning, danger)'),
            ('Empty States', 'XL size (32px), centered, tertiary color'),
        ]
        for title, desc in patterns:
            self.c.setFillColor(ORANGE)
            self.c.circle(MARGIN + 8, y - 4, 3, fill=1, stroke=0)
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(MARGIN + 20, y - 8, title)
            y -= 18
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 20, y - 6, desc)
            y -= 24

        y -= 15
        # Key icons table
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Key Icon Mappings')
        y -= 20

        icons = [
            ('Home', 'home / home-outline'),
            ('Leads', 'people / people-outline'),
            ('Roadmap', 'map / map-outline'),
            ('Events', 'calendar / calendar-outline'),
            ('Profile', 'person / person-outline'),
            ('Team', 'briefcase / briefcase-outline'),
            ('Admin', 'settings / settings-outline'),
            ('Training', 'school'),
            ('Roadshow', 'megaphone'),
        ]
        col_w = (CONTENT_W - 10) / 3
        for i, (label, icon) in enumerate(icons):
            col = i % 3
            row = i // 3
            px = MARGIN + col * (col_w + 5)
            py = y - row * 22
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 9)
            self.c.drawString(px, py, label)
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 9)
            self.c.drawString(px + 70, py, icon)

        self.draw_page_number()

    # ── Page 9: Voice & Tone ───────────────────────────────────
    def page_voice_tone(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 7, 'Voice & Tone')

        y -= 25
        y = self.draw_body(MARGIN, y,
            'Lyfe speaks with professional warmth. We are clear, supportive, and '
            'action-oriented — never corporate jargon, never overly casual. Our voice '
            'builds trust while keeping things human.',
            size=11, leading=18)

        y -= 20
        # Voice attributes
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Voice Attributes')
        y -= 10

        col_w = (CONTENT_W - 20) / 2
        attributes = [
            ('Clear', 'Short sentences. Plain language.\nNo jargon or abbreviations\nwithout context.'),
            ('Supportive', 'Celebrate progress. Guide through\nchallenges. Never blame\nor use negative framing.'),
            ('Professional', 'Respect expertise. Provide facts.\nAvoid hype, exclamation marks,\nand empty enthusiasm.'),
            ('Action-Oriented', 'Lead with verbs. Tell users what\nto do, not what happened.\nEvery message earns its space.'),
        ]
        for i, (title, desc) in enumerate(attributes):
            col = i % 2
            row = i // 2
            px = MARGIN + col * (col_w + 20)
            py = y - row * 120

            self.c.setFillColor(LIGHT_BG)
            self.c.roundRect(px, py - 95, col_w, 95, 10, fill=1, stroke=0)
            self.c.setFillColor(ORANGE)
            self.c.roundRect(px, py - 4, col_w, 4, 2, fill=1, stroke=0)
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 13)
            self.c.drawString(px + 14, py - 24, title)
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 9.5)
            for j, line in enumerate(desc.split('\n')):
                self.c.drawString(px + 14, py - 44 - j * 14, line)

        y -= 260
        # Examples
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Writing Examples')
        y -= 25

        examples = [
            ('Button labels', 'Mark Complete', 'Click here to complete this'),
            ('Empty states', 'No modules available yet', 'There are currently no modules...'),
            ('Confirmation', 'Module marked as complete', 'The module has been successfully...'),
            ('Error messages', 'Could not save. Try again.', 'An error occurred while saving...'),
            ('Progress', '3 of 8 modules complete', 'You have completed 37.5% of...'),
        ]

        # Header row
        self.c.setFillColor(GRAY_LIGHT)
        self.c.setFont('Helvetica-Bold', 9)
        self.c.drawString(MARGIN + 10, y, 'CONTEXT')
        self.c.drawString(MARGIN + 150, y, 'DO')
        self.c.drawString(MARGIN + 360, y, "DON'T")
        y -= 6
        self.c.setStrokeColor(HexColor('#E5E5EA'))
        self.c.setLineWidth(0.5)
        self.c.line(MARGIN, y, W - MARGIN, y)
        y -= 16

        for ctx, do, dont in examples:
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 10, y, ctx)
            self.c.setFillColor(SUCCESS)
            self.c.setFont('Helvetica-Bold', 10)
            self.c.drawString(MARGIN + 150, y, do)
            self.c.setFillColor(DANGER)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 360, y, dont)
            y -= 24

        y -= 15
        # Formatting rules
        self.c.setFillColor(ORANGE_LIGHT)
        self.c.roundRect(MARGIN, y - 90, CONTENT_W, 90, 10, fill=1, stroke=0)
        self.c.setFillColor(ORANGE_DARK)
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(MARGIN + 16, y - 20, 'FORMATTING RULES')
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica', 10)
        rules = [
            'Date format: YYYY-MM-DD (e.g., 2026-03-11)',
            'No emoji in UI — use Ionicons for visual indicators',
            'Error display: inline red text for validation, red banner (#FEE2E2) for async errors',
        ]
        for i, rule in enumerate(rules):
            self.c.drawString(MARGIN + 16, y - 40 - i * 18, f'    {rule}')

        self.draw_page_number()

    # ── Page 10: UI Patterns ───────────────────────────────────
    def page_ui_patterns(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 8, 'UI Patterns')

        y -= 25
        y = self.draw_body(MARGIN, y,
            'Our interface follows iOS Human Interface Guidelines with a layered surface '
            'model. Cards float on grouped backgrounds without visible borders, '
            'relying on background color contrast for visual separation.',
            size=11, leading=18)

        y -= 15
        # Layout grid
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Spacing System — 4pt Grid')
        y -= 20

        spacings = [
            ('XS', '4px', ORANGE),
            ('SM', '8px', ORANGE_MUTED),
            ('MD', '12px', ORANGE),
            ('LG', '16px', ORANGE_MUTED),
            ('XL', '20px', ORANGE),
            ('XXL', '24px', ORANGE_MUTED),
        ]
        bar_max = 200
        for name, px, col in spacings:
            val = int(px.replace('px', ''))
            bar_w = (val / 24) * bar_max
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 10)
            self.c.drawString(MARGIN + 10, y, name)
            self.c.setFillColor(GRAY_LIGHT)
            self.c.setFont('Helvetica', 9)
            self.c.drawString(MARGIN + 50, y, px)
            self.c.setFillColor(col)
            self.c.roundRect(MARGIN + 100, y - 3, bar_w, 14, 3, fill=1, stroke=0)
            y -= 24

        y -= 15
        # Component patterns
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Component Patterns')
        y -= 15

        components = [
            ('Cards', 'White surface (#FFFFFF), 12px border-radius, no visible border. '
             'Elevation via subtle shadow (opacity 0.04). Group on #F2F2F7 background.'),
            ('Tab Bar', 'Fixed bottom, 72px height (iOS) / 60px (Android). '
             'Accent-colored selected icon, gray (#8E8E93) unselected. 11px semibold labels.'),
            ('Buttons', 'Primary: orange (#FF7600) fill, white text, 12px radius. '
             'Secondary: transparent with orange text. Minimum 44px touch target.'),
            ('Inputs', 'White background, #E5E5EA border, 8px radius. '
             'Focus state: orange border. Error state: #FF3B30 border with red text below.'),
            ('Lists', 'Full-width rows on card surface. Hairline dividers (#C6C6C8 light, '
             '#38383A dark). 16px horizontal padding.'),
            ('Modals', 'iOS sheet style (slide up) on iOS, fade on Android. '
             'Elevated surface (#FFFFFF light, #2C2C2E dark).'),
        ]

        for title, desc in components:
            self.c.setFillColor(LIGHT_BG)
            # Calculate needed height
            words = desc.split(' ')
            lines = 1
            line = ''
            for word in words:
                test = f'{line} {word}'.strip()
                if self.c.stringWidth(test, 'Helvetica', 9.5) > CONTENT_W - 40:
                    lines += 1
                    line = word
                else:
                    line = test
            box_h = max(48, 30 + lines * 14)
            self.c.roundRect(MARGIN, y - box_h, CONTENT_W, box_h, 8, fill=1, stroke=0)

            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(MARGIN + 14, y - 18, title)

            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 9.5)
            words = desc.split(' ')
            line = ''
            dy = y - 34
            for word in words:
                test = f'{line} {word}'.strip()
                if self.c.stringWidth(test, 'Helvetica', 9.5) > CONTENT_W - 40:
                    self.c.drawString(MARGIN + 14, dy, line)
                    dy -= 14
                    line = word
                else:
                    line = test
            if line:
                self.c.drawString(MARGIN + 14, dy, line)

            y -= box_h + 8

        y -= 10
        # Animation
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica-Bold', 15)
        self.c.drawString(MARGIN, y, 'Animation Timing')
        y -= 20

        anims = [
            ('Micro', '200ms', 'Hover, press states, toggles'),
            ('Transition', '300ms', 'Tab switches, modal slides'),
            ('Reveal', '600ms', 'Progress bars, entrance animations'),
        ]
        for name, dur, usage in anims:
            self.c.setFillColor(ORANGE)
            self.c.setFont('Helvetica-Bold', 10)
            self.c.drawString(MARGIN + 10, y, name)
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica-Bold', 10)
            self.c.drawString(MARGIN + 100, y, dur)
            self.c.setFillColor(GRAY_TEXT)
            self.c.setFont('Helvetica', 10)
            self.c.drawString(MARGIN + 170, y, usage)
            y -= 20

        self.draw_page_number()

    # ── Page 11: Do's and Don'ts ───────────────────────────────
    def page_dos_donts(self):
        self.new_page(bg=white)
        self.c.setFillColor(ORANGE)
        self.c.rect(0, H - 8, W, 8, fill=1, stroke=0)

        y = H - 70
        y = self.draw_section_header(y, 9, "Do's & Don'ts")

        y -= 30
        col_w = (CONTENT_W - 20) / 2

        dos = [
            'Use colors.* from useTheme() for all colors',
            'Use Ionicons for all icons and indicators',
            'Follow the 4pt spacing grid (XS to XXL)',
            'Use Pacifico only for the Lyfe wordmark',
            'Support both light and dark mode',
            'Use YYYY-MM-DD for all date strings',
            'Keep cards borderless — contrast via bg layers',
            'Use inline red text for form validation errors',
            'Maintain 44px minimum touch targets',
            'Use outline/filled icon pairs for tab state',
            'Use semantic colors for status communication',
            'Celebrate progress with confetti animations',
        ]

        donts = [
            'Hardcode hex colors anywhere in components',
            'Use emoji in the UI — Ionicons only',
            "Use the logo font (Pacifico) for body text",
            'Add visible borders to cards',
            'Use color alone to create text hierarchy',
            'Skip dark mode support for new screens',
            "Use href: '/tabname' — causes double-push bug",
            'Use red banners for form validation (async only)',
            'Create touch targets smaller than 44px',
            'Mix icon sets — Ionicons is the only icon set',
            'Use orange for non-interactive elements',
            'Add shadows heavier than the defined levels',
        ]

        # Do's column
        self.c.setFillColor(SUCCESS)
        self.c.setFont('Helvetica-Bold', 16)
        self.c.drawString(MARGIN, y, "Do")
        y_do = y - 20

        for item in dos:
            # Green check circle
            self.c.setFillColor(HexColor('#E8F9ED'))
            self.c.roundRect(MARGIN, y_do - 18, col_w, 22, 4, fill=1, stroke=0)
            self.c.setFillColor(SUCCESS)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(MARGIN + 8, y_do - 14, '+')
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica', 9.5)
            self.c.drawString(MARGIN + 22, y_do - 14, item)
            y_do -= 28

        # Don'ts column
        self.c.setFillColor(DANGER)
        self.c.setFont('Helvetica-Bold', 16)
        self.c.drawString(MARGIN + col_w + 20, y, "Don't")
        y_dont = y - 20

        for item in donts:
            px = MARGIN + col_w + 20
            self.c.setFillColor(HexColor('#FFEDEC'))
            self.c.roundRect(px, y_dont - 18, col_w, 22, 4, fill=1, stroke=0)
            self.c.setFillColor(DANGER)
            self.c.setFont('Helvetica-Bold', 11)
            self.c.drawString(px + 8, y_dont - 14, 'x')
            self.c.setFillColor(NEAR_BLACK)
            self.c.setFont('Helvetica', 9.5)
            self.c.drawString(px + 22, y_dont - 14, item)
            y_dont -= 28

        y = min(y_do, y_dont) - 20
        # Footer note
        self.c.setFillColor(ORANGE_LIGHT)
        self.c.roundRect(MARGIN, y - 50, CONTENT_W, 50, 10, fill=1, stroke=0)
        self.c.setFillColor(ORANGE_DARK)
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(MARGIN + 16, y - 20, 'REMEMBER')
        self.c.setFillColor(NEAR_BLACK)
        self.c.setFont('Helvetica', 10)
        self.c.drawString(MARGIN + 16, y - 38, 'When in doubt, look at iOS Settings and Apple Health for design inspiration.')

        self.draw_page_number()

    # ── Page 12: Back Cover ────────────────────────────────────
    def page_back_cover(self):
        self.new_page(bg=NEAR_BLACK)

        # Large logo
        if os.path.exists(LOGO_PATH):
            logo = ImageReader(LOGO_PATH)
            lw, lh = 200, 200
            self.c.drawImage(logo, (W - lw) / 2, H / 2 + 20, lw, lh,
                             preserveAspectRatio=True, mask='auto')

        # Tagline
        self.c.setFillColor(HexColor('#EBEBF5'))
        self.c.setFont('Helvetica', 14)
        self.c.drawCentredString(W / 2, H / 2 - 20, 'Grow with purpose.')

        # Divider
        self.c.setStrokeColor(HexColor('#38383A'))
        self.c.setLineWidth(0.5)
        self.c.line(W / 2 - 60, H / 2 - 50, W / 2 + 60, H / 2 - 50)

        # Info
        self.c.setFillColor(GRAY_LIGHT)
        self.c.setFont('Helvetica', 10)
        self.c.drawCentredString(W / 2, H / 2 - 80, 'lyfe-app  |  v1.1.0  |  2026')
        self.c.setFont('Helvetica', 9)
        self.c.drawCentredString(W / 2, H / 2 - 100, 'This document is confidential and intended for internal use only.')

    # ── Build ──────────────────────────────────────────────────
    def build(self):
        self.page_cover()
        self.page_toc()
        self.page_brand_overview()
        self.page_logo()
        self.page_colors()
        self.page_dark_mode()
        self.page_typography()
        self.page_iconography()
        self.page_voice_tone()
        self.page_ui_patterns()
        self.page_dos_donts()
        self.page_back_cover()
        self.save()


if __name__ == '__main__':
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    guide = BrandGuide()
    guide.build()
