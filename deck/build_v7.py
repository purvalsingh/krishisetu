"""
KrishiSetu — PPT 7, the picture-led deck in the official SIH 2026 template.

The format's own instructions ask for six slides, no paragraphs, and the idea
presented in points, diagrams, infographics and pictures. This build follows
that literally: every panel leads with an illustration and a figure, the
sentences live in the speaker notes, and only a one-line caveat stays on screen.

The illustrations in art/ carry no text of their own — every word and number on
a slide is real PowerPoint text, so nothing can be garbled or go stale.

Figures come from the running application via scripts/deckfacts.ts.
Run from this directory:  python3 build_v7.py
"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = Path(__file__).parent
ART = HERE / "art"
TEMPLATE = HERE.parent / "docs" / "templates" / "SIH2026-IDEA-Presentation-Format.pptx"

INK = RGBColor(0x11, 0x14, 0x0F)
GREEN = RGBColor(0x2F, 0x6B, 0x3A)
AMBER = RGBColor(0xB7, 0x79, 0x1F)
MUTED = RGBColor(0x65, 0x70, 0x62)
LINE = RGBColor(0xDF, 0xE4, 0xDB)
TINT = RGBColor(0xF2, 0xF5, 0xEF)
PAPER = RGBColor(0xFF, 0xFF, 0xFF)
SLATE = RGBColor(0x6B, 0x8C, 0xAE)
PLUM = RGBColor(0x8A, 0x7F, 0xAE)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

BODY = "Calibri"
HEAD = "Cambria"

prs = Presentation(str(TEMPLATE))


def drop_slide(index):
    xml_slides = prs.slides._sldIdLst
    slides = list(xml_slides)
    rid = slides[index].get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    prs.part.drop_rel(rid)
    xml_slides.remove(slides[index])


def find(slide, predicate):
    for sh in slide.shapes:
        if predicate(sh):
            return sh
    return None


def delete(shape):
    shape._element.getparent().remove(shape._element)


def txt(slide, text, x, y, w, h, size=11, bold=False, color=INK, font=BODY,
        align=PP_ALIGN.LEFT, italic=False, spacing=None, anchor=MSO_ANCHOR.TOP, line=None):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    if line:
        p.line_spacing = Pt(line)
    run = p.add_run()
    run.text = text
    f = run.font
    f.name, f.size, f.bold, f.italic = font, Pt(size), bold, italic
    f.color.rgb = color
    if spacing is not None:
        run.font._rPr.set("spc", str(int(spacing * 100)))
    return box


def rich(slide, parts, x, y, w, h, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    for text, style in parts:
        run = p.add_run()
        run.text = text
        f = run.font
        f.name = style.get("font", BODY)
        f.size = Pt(style.get("size", 11))
        f.bold = style.get("bold", False)
        f.italic = style.get("italic", False)
        f.color.rgb = style.get("color", INK)
    return box


def card(slide, x, y, w, h, fill=PAPER, border=LINE):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if border is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = border
        shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    shape.adjustments[0] = 0.07
    shape.text_frame.text = ""
    return shape


def bar(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def dot(slide, x, y, label, fill=GREEN, size=0.3, font_size=10, color=WHITE):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(size), Inches(size))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    shape.shadow.inherit = False
    tf = shape.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    run.font.name, run.font.size, run.font.bold = BODY, Pt(font_size), True
    run.font.color.rgb = color
    return shape


def pic(slide, name, x, y, size):
    """One illustration, square, placed by its top-left corner."""
    path = ART / f"{name}.png"
    if not path.exists():
        raise FileNotFoundError(f"missing illustration: {path}")
    return slide.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(size), Inches(size))


def set_title(slide, text):
    ph = find(slide, lambda s: s.has_text_frame and s.name.startswith("Title"))
    p = ph.text_frame.paragraphs[0]
    for r in list(p.runs)[1:]:
        r._r.getparent().remove(r._r)
    if p.runs:
        p.runs[0].text = text
    else:
        p.add_run().text = text


def set_team(slide, name="Logic_Lords"):
    oval = find(slide, lambda s: s.name.startswith("Oval"))
    if oval is None:
        return
    p = oval.text_frame.paragraphs[0]
    for r in list(p.runs)[1:]:
        r._r.getparent().remove(r._r)
    if p.runs:
        p.runs[0].text = name
        p.runs[0].font.size = Pt(10)
    else:
        run = p.add_run()
        run.text = name
        run.font.size = Pt(10)


def clear_instructions(slide):
    for sh in list(slide.shapes):
        if sh.has_text_frame and sh.name.startswith("TextBox") and sh.text_frame.text.strip():
            delete(sh)


def subtitle(slide, text, size=15):
    return txt(slide, text, 0.55, 1.18, 12.3, 0.36, size=size, bold=True, color=INK, font=HEAD)


def eyebrow(slide, text, x, y, w=6.0):
    return txt(slide, text, x, y, w, 0.2, size=8.5, bold=True, color=MUTED, spacing=1.4)


def note(slide, text, y=6.62):
    return txt(slide, text, 0.55, y, 12.3, 0.26, size=8, italic=True, color=MUTED)


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def tile(slide, x, y, w, h, art, heading, caption, accent=GREEN, art_size=0.82):
    """An illustration above a short heading and a caption of a few words."""
    card(slide, x, y, w, h, fill=TINT)
    pic(slide, art, x + (w - art_size) / 2, y + 0.12, art_size)
    txt(slide, heading, x + 0.1, y + art_size + 0.18, w - 0.2, 0.22,
        size=10.5, bold=True, color=accent, align=PP_ALIGN.CENTER)
    txt(slide, caption, x + 0.1, y + art_size + 0.42, w - 0.2, 0.4,
        size=8.5, color=MUTED, align=PP_ALIGN.CENTER, line=10)


# ── slide 7 is the instructions page the format asks us to remove ──────────
drop_slide(6)
s1, s2, s3, s4, s5, s6 = prs.slides

# ═══════════════════════════ 1 · title page ════════════════════════════════
sub = find(s1, lambda s: s.name.startswith("Subtitle"))
sub.left, sub.top, sub.width, sub.height = Inches(0.36), Inches(1.10), Inches(6.2), Inches(0.85)
sub.text_frame.clear()
p = sub.text_frame.paragraphs[0]
p.alignment = PP_ALIGN.LEFT
run = p.add_run()
run.text = "KrishiSetu"
run.font.name, run.font.size, run.font.bold = HEAD, Pt(40), True
run.font.color.rgb = INK

meta = find(s1, lambda s: s.name.startswith("TextBox") and "Problem Statement" in (s.text_frame.text or ""))
meta.top = Inches(2.02)
tf = meta.text_frame
tf.clear()
for i, (k, v) in enumerate([
    ("Problem Statement ID", "SIH26033"),
    ("Problem Statement Title", "Farmer-first agricultural trading platform with pooled delivery"),
    ("Theme", "Agriculture, FoodTech & Rural Development"),
    ("PS Category", "Software"),
    ("Team ID", "SIH26-SW059"),
    ("Team Name", "Logic_Lords — Ramrao Adik Institute of Technology"),
]):
    para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    para.space_after = Pt(6)
    a = para.add_run()
    a.text = f"{k} – "
    a.font.name, a.font.size = BODY, Pt(12.5)
    a.font.color.rgb = MUTED
    b = para.add_run()
    b.text = v
    b.font.name, b.font.size, b.font.bold = BODY, Pt(12.5), True
    b.font.color.rgb = INK

pic(s1, "art_handshake", 0.42, 4.92, 1.5)
txt(s1, "The farmer names the price.\nEverything after it is shared transport.",
    2.06, 5.24, 4.4, 0.8, size=13, color=GREEN, font=HEAD, line=17)
txt(s1, "Working prototype · krishisetu-weld.vercel.app", 2.06, 6.06, 4.4, 0.26, size=10, color=MUTED)

notes(s1,
      "Open with the problem in one line: a small farmer cannot fill a tempo alone, so hiring one eats the margin, "
      "and that is why the farmer keeps only a modest share of what the buyer finally pays. KrishiSetu pools the produce "
      "of several farmers all sending to the same neighbourhood, moves it once, and drops it at one pickup point a hundred "
      "households already live around. Close by saying this is a working application, not a mockup: every number in this "
      "deck is read out of the running system, and anything that is an estimate is labelled as one on the slide.")

# ═════════════════════ 2 · the idea, in one bill ═══════════════════════════
set_title(s2, "KRISHISETU — POOLED DELIVERY")
set_team(s2)
clear_instructions(s2)
subtitle(s2, "The farmer's rate is an input to the price, never the leftover")

# One kilogram of tomato, built upward from the farmer's rate.
eyebrow(s2, "ONE KILOGRAM OF TOMATO, BUILT UPWARD", 0.55, 1.66)
parts = [("Farmer", 34.00, GREEN), ("Transport", 4.70, SLATE),
         ("Packing", 3.96, AMBER), ("Site fee", 3.00, PLUM)]
total = sum(v for _, v, _ in parts)
bx, bw = 0.55, 5.9
for _, v, colour in parts:
    w = bw * v / total
    bar(s2, bx, 1.94, w, 0.4, colour)
    bx += w
for i, (label, v, colour) in enumerate(parts):
    x = 0.55 + i * 1.48
    e = s2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(2.46), Inches(0.1), Inches(0.1))
    e.fill.solid(); e.fill.fore_color.rgb = colour; e.line.fill.background(); e.shadow.inherit = False
    txt(s2, label, x + 0.16, 2.4, 0.9, 0.22, size=9)
    txt(s2, f"₹{v:.2f}", x + 0.16, 2.62, 0.9, 0.22, size=10.5, bold=True, color=colour)

rich(s2, [("₹45.66", {"font": HEAD, "size": 26, "bold": True, "color": INK}),
          ("  buyer pays   ", {"size": 10.5, "color": MUTED}),
          ("vs ₹55.00 quick-commerce", {"size": 10.5, "color": AMBER})],
     0.55, 2.96, 5.9, 0.42)

# The same order, drawn from two named farms.
eyebrow(s2, "ONE 5 KG ORDER · TWO NAMED FARMS", 0.55, 3.52)
for i, (art, name, place, qty, amt) in enumerate([
    ("art_farmer_phone", "Sanjay Patil", "Khalapur, Raigad", "3.0 kg", "₹102.00"),
    ("art_farmer_woman", "Meena Bhoir", "Panvel Rural, Raigad", "2.0 kg", "₹68.00"),
]):
    y = 3.78 + i * 0.88
    card(s2, 0.55, y, 5.9, 0.78, fill=TINT)
    pic(s2, art, 0.64, y + 0.03, 0.72)
    txt(s2, name, 1.46, y + 0.14, 2.3, 0.24, size=11.5, bold=True)
    txt(s2, place, 1.46, y + 0.4, 2.3, 0.22, size=9, color=MUTED)
    txt(s2, qty, 3.8, y + 0.26, 0.9, 0.26, size=11, align=PP_ALIGN.RIGHT)
    txt(s2, amt, 4.8, y + 0.24, 1.5, 0.3, size=13, bold=True, color=GREEN, align=PP_ALIGN.RIGHT)

# Six differences, each one picture and three words.
RX = 6.75
eyebrow(s2, "WHAT IS ACTUALLY DIFFERENT", RX, 1.66, 6.0)
for i, (art, head, cap, accent) in enumerate([
    ("art_farmer_phone", "Net rate", "nothing deducted, ever", GREEN),
    ("art_tempo_loaded", "Pooled by place", "one neighbourhood, one vehicle", SLATE),
    ("art_clipboard_tick", "Sold before loaded", "no stock written off", GREEN),
    ("art_basket", "Fresher, cheaper", "shorter chain, lower price", GREEN),
    ("art_city_pins", "Demand by place", "Nerul 246 · Kharghar 207", PLUM),
    ("art_tomato_crate", "Surplus re-placed", "151 kg split across three", AMBER),
]):
    x = RX + (i % 3) * 2.03
    y = 1.92 + (i // 3) * 1.68
    tile(s2, x, y, 1.92, 1.56, art, head, cap, accent, art_size=0.74)

# How the buyer receives it: three tiers, three pictures, three fees.
eyebrow(s2, "HOW THE BUYER RECEIVES IT", RX, 5.3, 6.0)
for i, (art, name, fee, colour) in enumerate([
    ("art_kirana", "Cluster pickup", "₹10", GREEN),
    ("art_handcart", "Last 300 m", "₹20", AMBER),
    ("art_scooter_crossed", "Express", "not offered", MUTED),
]):
    x = RX + i * 2.03
    card(s2, x, 5.54, 1.92, 0.94, fill=PAPER)
    pic(s2, art, x + 0.08, 5.6, 0.8)
    txt(s2, name, x + 0.94, 5.74, 0.92, 0.22, size=9.5, bold=True)
    txt(s2, fee, x + 0.94, 5.98, 0.92, 0.26, size=12, bold=True, color=colour)

note(s2, "Free above a ₹500 basket on the last 300 m. ₹55/kg is an assumed quick-commerce reference, not a live scrape.")
notes(s2,
      "The bar is the whole argument. We do not start from a retail price and work down to whatever is left for the farmer; "
      "we start from the rate the farmer accepted and add the real shared costs on top. Sanjay Patil and Meena Bhoir are named "
      "because a pooled consignment must never hide whose produce it is: one buyer order can draw from two farms, and each farm's "
      "kilograms and rupees stay its own row. The six tiles on the right are what no competitor does together, and the last two "
      "are new: demand is forecast per neighbourhood, not just per crop, and an unsold lot is re-placed across the pickup points "
      "that can still take it inside its freshness limit. On delivery, note that the door drop is tier B, not the default. A weekly "
      "household basket is about six kilograms, so a dedicated rider would eat a tenth of the order value. Collection at a "
      "neighbourhood point is the default, the last 300 metres is free above a ₹500 basket, and ten-minute express is deliberately "
      "not offered because at this basket size it cannot pay for itself.")

# ═══════════════════ 3 · technical approach ════════════════════════════════
set_title(s3, "TECHNICAL APPROACH")
set_team(s3)
clear_instructions(s3)
subtitle(s3, "D-COA — Decision & Coordination Optimisation Algorithm")
txt(s3, "Our own engine's working name, not a claim of a new published algorithm.",
    0.55, 1.54, 12.3, 0.24, size=9.5, color=MUTED)

# The chain, left to right: a picture and two words per stage.
stages = [
    ("art_clipboard_tick", "Confirmed orders"),
    ("art_puzzle", "Compatibility"),
    ("art_city_pins", "Lot allocation"),
    ("art_freshness", "Capacity & freshness"),
    ("art_route_pins", "Route plan"),
    ("art_tempo_loaded", "Explained batch"),
]
for i, (art, label) in enumerate(stages):
    x = 0.55 + i * 2.1
    last = i == len(stages) - 1
    card(s3, x, 1.84, 1.86, 1.38, fill=TINT, border=GREEN if last else LINE)
    pic(s3, art, x + 0.51, 1.9, 0.84)
    txt(s3, label, x + 0.08, 2.82, 1.7, 0.3, size=9.5, bold=True,
        color=GREEN if last else INK, align=PP_ALIGN.CENTER, line=11)
    if not last:
        txt(s3, "›", x + 1.86, 2.32, 0.24, 0.3, size=16, color=GREEN, align=PP_ALIGN.CENTER)

# Eight considerations: colour, label, and the kind of rule it is.
eyebrow(s3, "EIGHT CONSIDERATIONS, EVERY RUN", 0.55, 3.42, 7.6)
for i, (label, kind) in enumerate([
    ("Product compatibility", "hard"), ("Pickup & delivery geography", "hard"),
    ("Quantity vs vehicle capacity", "hard"), ("Delivery time windows", "hard"),
    ("Perishability & freshness", "hard"), ("Estimated transport cost", "ranking"),
    ("Order priority", "ranking"), ("Cancellations & new orders", "replan"),
]):
    x = 0.55 + (i % 2) * 3.95
    y = 3.68 + (i // 2) * 0.5
    colour = GREEN if kind == "hard" else AMBER if kind == "ranking" else SLATE
    card(s3, x, y, 3.75, 0.4)
    e = s3.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x + 0.14), Inches(y + 0.15), Inches(0.1), Inches(0.1))
    e.fill.solid(); e.fill.fore_color.rgb = colour; e.line.fill.background(); e.shadow.inherit = False
    txt(s3, label, x + 0.32, y + 0.08, 2.7, 0.24, size=10)
    txt(s3, kind, x + 3.0, y + 0.1, 0.62, 0.22, size=8, bold=True, color=colour, align=PP_ALIGN.RIGHT)

# Built, and the rules the code will not bend.
RX, RW = 8.75, 4.1
card(s3, RX, 3.42, RW, 3.02, fill=TINT)
pic(s3, "art_dashboard", RX + 1.55, 3.5, 1.0)
txt(s3, "Next.js 16 · PostgreSQL · Prisma\nVercel · live mandi prices, daily",
    RX + 0.22, 4.56, RW - 0.44, 0.5, size=10, color=MUTED, align=PP_ALIGN.CENTER, line=13)
eyebrow(s3, "RULES THE CODE ENFORCES", RX + 0.22, 5.16, RW - 0.44)
for i, t in enumerate([
    "Under 70% fill, the run is held",
    "Atomic reservations: no kilogram twice",
    "A forecast shows only if it beats the baseline",
]):
    txt(s3, "•  " + t, RX + 0.22, 5.42 + i * 0.32, RW - 0.44, 0.3, size=9.5, line=11)

note(s3, "Routing returns a feasible nearest-neighbour plan measured against a fixed-order baseline. We claim no global optimum.")
notes(s3,
      "D-COA stands for Decision and Coordination Optimisation Algorithm. Say the full form out loud: it is our working name for the "
      "decision layer in our own codebase, not a claim that we invented or published a new algorithm. Walk the chain left to right, "
      "then explain the chips: five of the eight considerations are hard feasibility conditions, so if any one fails the order cannot "
      "be on that run. Cost and priority only rank among options that are already feasible, and a cancellation or new order forces a "
      "replan before dispatch. The important part for a judge: when an order is left out, the engine says which of these eight rules "
      "rejected it, in plain English, on the operator's screen. Nothing is a black-box score. The same engine answers the second "
      "question a farmer asks — not only what is in demand, but where an unsold lot should now go, ranked by which pickup point can "
      "still absorb it inside the freshness limit.")

# ═══════════════ 4 · feasibility and viability ═════════════════════════════
set_title(s4, "FEASIBILITY AND VIABILITY")
set_team(s4)
clear_instructions(s4)
subtitle(s4, "Return loads, the fill threshold, and what can go wrong")

card(s4, 0.55, 1.62, 7.2, 2.5, fill=TINT)
eyebrow(s4, "RETURN LOADS — THE EMPTY HALF OF EVERY TRIP", 0.8, 1.78, 6.7)
pic(s4, "art_farms", 0.82, 2.06, 1.3)
pic(s4, "art_society", 6.16, 2.06, 1.3)
out = bar(s4, 2.36, 2.36, 3.6, 0.3, GREEN)
tfo = out.text_frame; tfo.vertical_anchor = MSO_ANCHOR.MIDDLE
po = tfo.paragraphs[0]; po.alignment = PP_ALIGN.CENTER
ro = po.add_run(); ro.text = "loaded  747.7 kg  ›"
ro.font.name, ro.font.size, ro.font.bold, ro.font.color.rgb = BODY, Pt(10), True, WHITE
back = bar(s4, 2.36, 2.92, 3.6, 0.3, RGBColor(0xD9, 0xE2, 0xD5))
tfb = back.text_frame; tfb.vertical_anchor = MSO_ANCHOR.MIDDLE
pb = tfb.paragraphs[0]; pb.alignment = PP_ALIGN.CENTER
rb = pb.add_run(); rb.text = "‹  returns empty today"
rb.font.name, rb.font.size, rb.font.bold, rb.font.color.rgb = BODY, Pt(10), True, MUTED
txt(s4, "The empty half is already priced into what he charges us.",
    2.36, 3.36, 3.6, 0.3, size=9.5, color=MUTED, align=PP_ALIGN.CENTER)

# One real run, in four numbers.
for i, (v, k) in enumerate([("123", "orders pooled"), ("747.7 kg", "on a 750 kg tempo"),
                            ("5", "stops: 4 farms, 1 drop"), ("₹5.37", "transport per kg")]):
    x = 0.55 + i * 1.84
    card(s4, x, 4.3, 1.72, 1.0, fill=PAPER)
    txt(s4, v, x, 4.44, 1.72, 0.4, size=19, bold=True, color=GREEN, font=HEAD, align=PP_ALIGN.CENTER)
    txt(s4, k, x + 0.06, 4.88, 1.6, 0.34, size=8.5, color=MUTED, align=PP_ALIGN.CENTER, line=10)
txt(s4, "One real run, planned by the live system", 0.55, 5.42, 7.2, 0.26, size=9.5, italic=True, color=MUTED)

# Four risks, each with the answer beside it.
RX, RW = 8.15, 4.7
eyebrow(s4, "RISK, AND WHAT IS BUILT AGAINST IT", RX, 1.62, RW)
for i, (art, h, sub_t) in enumerate([
    ("art_warning", "Too few orders", "Held below 70% fill, rolls to the next window"),
    ("art_freshness", "Spoilage in transit", "Freshness is a hard constraint, per commodity"),
    ("art_handshake", "Quality disputes", "Graded, handover recorded, deduction by agreement"),
    ("art_language", "Farmer cannot use an app", "Marathi, Hindi, English · one decision card"),
]):
    y = 1.88 + i * 1.18
    card(s4, RX, y, RW, 1.06)
    pic(s4, art, RX + 0.1, y + 0.13, 0.8)
    txt(s4, h, RX + 1.0, y + 0.24, RW - 1.15, 0.26, size=11, bold=True)
    txt(s4, sub_t, RX + 1.0, y + 0.52, RW - 1.15, 0.42, size=9, color=MUTED, line=11)

note(s4, "Return-load matching is designed and specified. It sits deliberately after the core proof and is not claimed as shipped.")
notes(s4,
      "Return loads, in plain words: today a transporter brings vegetables into the city and drives back with an empty vehicle. He is "
      "already charging us for that empty half, because he has to. A return load — also called a backhaul — is any cargo he can carry "
      "on the journey home: seed, fertiliser, crates, an FPO's supplies. Because we already know his corridor, his time window and his "
      "spare capacity, we can offer him compatible work on the way back, which lowers the cost per kilogram of the outbound vegetable "
      "trip without anyone subsidising it. Two honest caveats: empty space does not automatically mean a cheaper or suitable trip, and "
      "the driver must accept the work with the payment covering the actual detour. It is specified but not yet shipped, and the slide "
      "says so. On the fill threshold: 123 orders filled a 750 kg tempo to 100 percent and brought transport down to ₹5.37 per "
      "kilogram. Below 70 percent we hold the run rather than deliver at a loss.")

# ═════════════════════ 5 · impact and benefits ═════════════════════════════
set_title(s5, "IMPACT AND BENEFITS")
set_team(s5)
clear_instructions(s5)
subtitle(s5, "More for the farmer, less for the buyer, and still self-funding")

eyebrow(s5, "FARMER'S SHARE OF WHAT THE BUYER PAYS", 0.55, 1.62, 7.0)
for i, (label, pct, colour) in enumerate([
    ("Fragmented mandi chain", 30.0, RGBColor(0xA8, 0xB7, 0xA2)),
    ("KrishiSetu · 126 orders", 64.2, GREEN),
    ("KrishiSetu · tomato example", 74.0, GREEN),
]):
    y = 1.94 + i * 0.66
    txt(s5, label, 0.55, y, 2.5, 0.26, size=10)
    bar(s5, 3.15, y - 0.02, 3.3 * pct / 100, 0.3, colour)
    txt(s5, f"{pct:.1f}%", 6.56, y - 0.02, 0.8, 0.3, size=12, bold=True, color=colour)
txt(s5, "The fragmented-chain figure is a widely reported estimate. The two KrishiSetu bars are computed from orders in the running system.",
    0.55, 3.96, 6.9, 0.44, size=8.5, italic=True, color=MUTED, line=10)

# Where the platform's own money comes from.
RX, RW = 7.7, 5.15
card(s5, RX, 1.62, RW, 2.82, fill=TINT)
pic(s5, "art_coins", RX + 0.16, 1.72, 0.85)
txt(s5, "WHERE OUR OWN MONEY COMES FROM", RX + 1.08, 1.96, RW - 1.3, 0.24,
    size=9, bold=True, color=MUTED, spacing=1.4)
for i, (k, v, colour, strong) in enumerate([
    ("Disclosed buyer-side fee, per order", "₹19.89", INK, False),
    ("Gateway, messaging, support", "− ₹5.60", MUTED, False),
    ("Contribution per order", "₹14.29", GREEN, True),
    ("Assumed monthly fixed cost", "₹60,000", INK, False),
    ("Orders a month to break even", "4,199", GREEN, True),
]):
    y = 2.66 + i * 0.34
    txt(s5, k, RX + 0.22, y, RW - 1.6, 0.26, size=10, bold=strong, color=INK if strong else MUTED)
    txt(s5, v, RX + RW - 1.42, y - 0.02, 1.2, 0.28, size=12 if strong else 10.5,
        bold=True, color=colour, align=PP_ALIGN.RIGHT)
txt(s5, "No listing fee. No commission. To hold a price, our fee is cut to zero first — never the farmer's amount.",
    RX, 4.5, RW, 0.4, size=8.5, color=INK, line=10)

# What each party gets.
for i, (art, who, what, colour) in enumerate([
    ("art_farmer_woman", "Farmer", "₹34.00/kg, paid in full", GREEN),
    ("art_buyer_bag", "Buyer", "₹45.66/kg vs ₹55 reference", SLATE),
    ("art_tempo_empty", "Transporter", "₹4,016 a run, agreed first", AMBER),
    ("art_dashboard", "Platform", "₹14.29, one disclosed fee", PLUM),
]):
    x = 0.55 + i * 3.14
    card(s5, x, 5.1, 2.98, 1.3)
    pic(s5, art, x + 0.12, 5.28, 0.9)
    txt(s5, who, x + 1.14, 5.42, 1.7, 0.26, size=11.5, bold=True, color=colour)
    txt(s5, what, x + 1.14, 5.68, 1.75, 0.5, size=9, color=MUTED, line=11)

note(s5, "Figures are computed over synthetic demonstration orders: they size the model rather than measure a business. No column here is farming profit.")
notes(s5,
      "Three claims, in order. First, the farmer keeps far more of the buyer's rupee: 64 percent across all 126 orders in the system, "
      "74 percent on the worked tomato example, against the quarter-to-a-third widely reported for fragmented vegetable trade. That "
      "estimate is labelled as an estimate on the slide. Second, the buyer still pays less than the quick-commerce reference, so nobody "
      "is being asked to pay extra out of sympathy. Third, and this is the question every judge asks, where does our money come from. "
      "It comes from one disclosed line on the buyer's bill, ₹19.89 per order. After gateway and support costs we keep ₹14.29, so at an "
      "assumed ₹60,000 monthly fixed cost we break even at about 4,199 orders a month, roughly four clusters running twice a week. Be "
      "honest about the limit: a single-cluster pilot covers its fulfilment cost but not that fixed cost, and our own operator screen "
      "shows the shortfall. What we will not do is close it from the farmer's side.")

# ═════════════════ 6 · research and references ═════════════════════════════
set_title(s6, "RESEARCH AND REFERENCES")
set_team(s6)
clear_instructions(s6)
subtitle(s6, "Sources, and what they do and do not prove")

refs = [
    ("art_govt_building", "Government of India open data portal", "data.gov.in — daily mandi prices", "LIVE IN APP", GREEN),
    ("art_dashboard", "eNAM — trading and FPO pages", "enam.gov.in/web/trading-details", "INCUMBENT", MUTED),
    ("art_tempo_loaded", "Ninjacart and Ninja Mandi", "ninjacart.com/ninja-mandi", "INCUMBENT", MUTED),
    ("art_kirana", "agribazaar", "agribazaar.com/quick-links/steps", "INCUMBENT", MUTED),
    ("art_coins", "Samunnati", "samunnati.com/innovations", "INCUMBENT", MUTED),
    ("art_route_pins", "Google OR-Tools, VRP with time windows", "developers.google.com/optimization/routing/vrptw", "METHOD", GREEN),
    ("art_govt_building", "PIB release on agricultural marketing", "pib.gov.in — PRID 2222802", "POLICY", MUTED),
    ("art_clipboard_tick", "SIH 2026 idea submission format", "sih.gov.in/letters/2026", "FORMAT", MUTED),
]
for i, (art, name, link, tag, colour) in enumerate(refs):
    x = 0.55 + (i % 2) * 6.22
    y = 1.62 + (i // 2) * 1.2
    card(s6, x, y, 6.0, 1.08, fill=TINT)
    pic(s6, art, x + 0.12, y + 0.14, 0.8)
    txt(s6, name, x + 1.04, y + 0.2, 3.5, 0.26, size=10.5, bold=True)
    txt(s6, tag, x + 4.5, y + 0.22, 1.35, 0.22, size=8, bold=True, color=colour,
        align=PP_ALIGN.RIGHT, spacing=1.1)
    txt(s6, link, x + 1.04, y + 0.56, 4.8, 0.26, size=8.5, color=GREEN)

note(s6, "What this does not prove: demand history and the fitted price series are synthetic and labelled so on screen. An unmentioned "
         "capability on a competitor's page is not evidence they lack it, and we claim no measured superiority without a comparable pilot.",
     y=6.5)
notes(s6,
      "Keep this slide short. The first source is live in the product, not just cited: the daily mandi price feed from the Government "
      "of India open data portal refreshes on a cron and every price on our screens carries its source label and date. The four "
      "incumbents are the ones we studied for gaps, and our positioning page states, for each gap, both what we built and where it "
      "stops. The routing reference is a formulation we follow, not a library we claim to have beaten. Then read the closing caveat "
      "aloud — the synthetic demand history is the honest limit of this prototype, and saying it first is stronger than being asked.")

out = HERE / "output" / "KrishiSetu_SIH2026_PPT7.pptx"
prs.save(str(out))
print(f"saved {out}")
