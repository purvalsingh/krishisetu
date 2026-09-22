"""
KrishiSetu — the same content, laid into the official SIH 2026 idea template.

The template's own branding is kept exactly as issued: the SIH mark, the title
placeholders, the footer band and the slide numbers are untouched. Only the
instruction text is replaced, and our content is placed inside the empty body
area of each slide. Slide 7 (the instructions page) is removed, leaving the six
slides the format allows.

Every figure comes from the running application via web/scripts/deckfacts.ts.
"""
import copy
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION

INK = RGBColor(0x11, 0x14, 0x0F)
GREEN = RGBColor(0x2F, 0x6B, 0x3A)
LIGHT = RGBColor(0x7D, 0xBD, 0x6B)
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

prs = Presentation("sih_template.pptx")


def drop_slide(index):
    """Remove a slide and its relationship, leaving the rest of the package intact."""
    xml_slides = prs.slides._sldIdLst
    slides = list(xml_slides)
    rid = slides[index].get(
        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    )
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
        align=PP_ALIGN.LEFT, italic=False, spacing=None, anchor=MSO_ANCHOR.TOP,
        wrap=True, line=None):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = wrap
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
        # Letter spacing has no python-pptx accessor; write the attribute directly.
        run.font._rPr.set("spc", str(int(spacing * 100)))
    return box


def rich(slide, parts, x, y, w, h, align=PP_ALIGN.LEFT):
    """One paragraph made of differently styled runs."""
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


def card(slide, x, y, w, h, fill=PAPER, border=LINE, radius=True):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h),
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if border is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = border
        shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    if radius:
        shape.adjustments[0] = 0.06
    tf = shape.text_frame
    tf.text = ""
    return shape


def bar(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def dot(slide, x, y, label, fill=GREEN, size=0.32, font_size=11, color=WHITE):
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


def set_title(slide, text):
    ph = find(slide, lambda s: s.has_text_frame and s.name.startswith("Title"))
    tf = ph.text_frame
    p = tf.paragraphs[0]
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
    """Remove the template's grey instruction text, keeping every other shape."""
    for sh in list(slide.shapes):
        if sh.has_text_frame and sh.name.startswith("TextBox") and sh.text_frame.text.strip():
            delete(sh)


def subtitle(slide, text, size=17):
    return txt(slide, text, 0.55, 1.20, 12.3, 0.4, size=size, bold=True, color=INK, font=HEAD)


def eyebrow(slide, text, x, y, w=6.0):
    return txt(slide, text, x, y, w, 0.22, size=9, bold=True, color=MUTED, spacing=1.4)


def note(slide, text, y=6.52):
    return txt(slide, text, 0.55, y, 12.3, 0.3, size=8.5, italic=True, color=MUTED)


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


# ── Slide 7 is the instructions page the format asks us to remove ──────────
drop_slide(6)

s1, s2, s3, s4, s5, s6 = prs.slides

# ───────────────────────────── 1 · title page ──────────────────────────────
# The subtitle placeholder sits centred under the SIH title, which collides with
# it. Move it into the left column where the rest of the title-page content lives.
sub = find(s1, lambda s: s.name.startswith("Subtitle"))
sub.left, sub.top, sub.width, sub.height = Inches(0.36), Inches(1.16), Inches(6.2), Inches(0.9)
sub.text_frame.clear()
p = sub.text_frame.paragraphs[0]
p.alignment = PP_ALIGN.LEFT
run = p.add_run()
run.text = "KrishiSetu"
run.font.name, run.font.size, run.font.bold = HEAD, Pt(40), True
run.font.color.rgb = INK

meta = find(s1, lambda s: s.name.startswith("TextBox") and "Problem Statement" in (s.text_frame.text or ""))
meta.top = Inches(2.16)
tf = meta.text_frame
tf.clear()
rows = [
    ("Problem Statement ID", "SIH26033"),
    ("Problem Statement Title", "Farmer-first agricultural trading platform with pooled delivery"),
    ("Theme", "Agriculture, FoodTech & Rural Development"),
    ("PS Category", "Software"),
    ("Team ID", "SIH26-SW059"),
    ("Team Name", "Logic_Lords — Ramrao Adik Institute of Technology"),
]
for i, (k, v) in enumerate(rows):
    para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    para.space_after = Pt(7)
    a = para.add_run()
    a.text = f"{k} – "
    a.font.name, a.font.size, a.font.bold = BODY, Pt(13), False
    a.font.color.rgb = MUTED
    b = para.add_run()
    b.text = v
    b.font.name, b.font.size, b.font.bold = BODY, Pt(13), True
    b.font.color.rgb = INK

txt(s1, "The farmer names their price. Everything after that is shared transport and a bill you can read.",
    0.36, 5.28, 6.2, 0.8, size=13, color=GREEN, font=HEAD, line=17)
txt(s1, "Working prototype live at krishisetu-weld.vercel.app",
    0.36, 6.16, 6.2, 0.3, size=11, color=MUTED)

notes(s1,
      "Open with the problem in one line: a small farmer cannot fill a tempo alone, so hiring one eats the margin, "
      "and that is why the farmer keeps only a modest share of what the buyer finally pays. KrishiSetu pools the produce "
      "of several farmers all sending to the same neighbourhood, moves it once, and drops it at one pickup point a hundred "
      "households already live around. Close by saying this is a working application, not a mockup: every number in this "
      "deck is read out of the running system, and anything that is an estimate is labelled as one on the slide.")

# ────────────────────────── 2 · proposed solution ──────────────────────────
set_title(s2, "PROPOSED SOLUTION")
set_team(s2)
clear_instructions(s2)
subtitle(s2, "The farmer's rate is an input to the price, never the leftover")

eyebrow(s2, "ONE KILOGRAM OF TOMATO, BUILT UPWARD", 0.55, 1.74)
parts = [("Farmer", 34.00, GREEN), ("Transport", 4.70, SLATE),
         ("Packing, handling", 3.96, AMBER), ("Site fee", 3.00, PLUM)]
total = sum(v for _, v, _ in parts)
bx, bw = 0.55, 6.1
for label, v, colour in parts:
    w = bw * v / total
    bar(s2, bx, 2.02, w, 0.36, colour)
    bx += w
for i, (label, v, colour) in enumerate(parts):
    x = 0.55 + (i % 2) * 3.1
    y = 2.52 + (i // 2) * 0.36
    e = s2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y + 0.06), Inches(0.11), Inches(0.11))
    e.fill.solid(); e.fill.fore_color.rgb = colour; e.line.fill.background(); e.shadow.inherit = False
    txt(s2, label, x + 0.19, y, 1.8, 0.26, size=10.5)
    txt(s2, f"₹{v:.2f}", x + 1.9, y, 0.9, 0.26, size=10.5, bold=True, color=colour, align=PP_ALIGN.RIGHT)

rich(s2, [("₹45.66", {"font": HEAD, "size": 26, "bold": True, "color": INK}),
          ("  buyer pays   ", {"size": 11, "color": MUTED}),
          ("vs ₹55.00 quick-commerce reference", {"size": 11, "color": AMBER})],
     0.55, 3.34, 6.1, 0.45)

eyebrow(s2, "ONE 5 KG BUYER ORDER, FILLED FROM TWO NAMED FARMS", 0.55, 3.92)
for i, (name, place, qty, amt) in enumerate([
    ("Sanjay Patil", "Khalapur, Raigad", "3.0 kg", "₹102.00"),
    ("Meena Bhoir", "Panvel Rural, Raigad", "2.0 kg", "₹68.00"),
]):
    y = 4.22 + i * 0.82
    card(s2, 0.55, y, 6.1, 0.7, fill=TINT)
    dot(s2, 0.72, y + 0.19, name[0], GREEN, 0.32, 12)
    txt(s2, name, 1.16, y + 0.1, 2.6, 0.26, size=12, bold=True)
    txt(s2, place, 1.16, y + 0.37, 2.6, 0.24, size=9.5, color=MUTED)
    txt(s2, qty, 3.9, y + 0.22, 0.9, 0.28, size=11.5, align=PP_ALIGN.RIGHT)
    txt(s2, amt, 4.95, y + 0.2, 1.5, 0.3, size=13, bold=True, color=GREEN, align=PP_ALIGN.RIGHT)

RX, RW = 7.05, 5.75
card(s2, RX, 1.68, RW, 2.3, fill=TINT)
eyebrow(s2, "WHAT IS ACTUALLY DIFFERENT", RX + 0.26, 1.86, RW - 0.5)
for i, (h, sub_t) in enumerate([
    ("Farmer sets the net rate", "No commission, listing charge or logistics cost is deducted from it anywhere."),
    ("Orders are pooled by destination", "Only lots going to the same neighbourhood share a vehicle."),
    ("Nothing moves unsold", "The tempo is loaded against confirmed orders, so there is no stock to write off."),
]):
    y = 2.16 + i * 0.58
    dot(s2, RX + 0.26, y + 0.02, str(i + 1), GREEN, 0.24, 9)
    txt(s2, h, RX + 0.6, y, RW - 0.9, 0.24, size=11.5, bold=True)
    txt(s2, sub_t, RX + 0.6, y + 0.24, RW - 0.9, 0.32, size=9.5, color=MUTED, line=11)

eyebrow(s2, "HOW THE BUYER RECEIVES IT", RX, 4.12, RW)
for i, (tag, name, sub_t, fee, colour) in enumerate([
    ("A", "Cluster pickup point", "Kirana or society office holds the batch, 6–9 pm window", "₹10", GREEN),
    ("B", "Last 300 metres", "Hand cart inside the same society, free above a ₹500 basket", "₹20", AMBER),
    ("C", "Express, on demand", "Not offered — it cannot pay for itself at a 6 kg basket", "—", MUTED),
]):
    y = 4.42 + i * 0.7
    card(s2, RX, y, RW, 0.6)
    dot(s2, RX + 0.15, y + 0.14, tag, colour, 0.32, 11)
    txt(s2, name, RX + 0.58, y + 0.06, RW - 1.5, 0.24, size=11.5, bold=True)
    txt(s2, sub_t, RX + 0.58, y + 0.29, RW - 1.5, 0.24, size=9, color=MUTED)
    txt(s2, fee, RX + RW - 0.9, y + 0.16, 0.75, 0.28, size=12.5, bold=True, color=colour, align=PP_ALIGN.RIGHT)

note(s2, "Worked with the same pricing function the live site uses. ₹55/kg is an assumed quick-commerce reference, not a live scrape.")
notes(s2,
      "The bar is the whole argument. We do not start from a retail price and work down to whatever is left for the farmer; "
      "we start from the rate the farmer accepted and add the real shared costs on top. Sanjay Patil and Meena Bhoir are named "
      "because a pooled consignment must never hide whose produce it is: one buyer order can draw from two farms, and each farm's "
      "kilograms and rupees stay its own row. On the right, note that door delivery is tier B, not the default. A weekly household "
      "basket is about six kilograms, so a dedicated rider drop would eat a tenth of the order value. Collection at a neighbourhood "
      "point is the default, the last 300 metres is a priced extra that is free above a ₹500 basket, and ten-minute express is "
      "deliberately not offered because at this basket size it cannot pay for itself.")

# ───────────────────────── 3 · technical approach ──────────────────────────
set_title(s3, "TECHNICAL APPROACH")
set_team(s3)
clear_instructions(s3)
subtitle(s3, "D-COA — Decision & Coordination Optimisation Algorithm", size=16)
txt(s3, "Our working name for the decision layer. It is a product name for our own engine, not a claim of a new published algorithm.",
    0.55, 1.62, 12.3, 0.26, size=10.5, color=MUTED)

stages = ["Confirmed orders", "Compatibility", "Lot allocation", "Capacity & freshness", "Route plan", "Explained batch"]
sw, gap = 1.88, 0.2
for i, label in enumerate(stages):
    x = 0.55 + i * (sw + gap)
    last = i == len(stages) - 1
    shape = card(s3, x, 1.96, sw, 0.8, fill=GREEN if last else TINT, border=GREEN if last else LINE)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para = tf.paragraphs[0]
    para.alignment = PP_ALIGN.CENTER
    run = para.add_run()
    run.text = label
    run.font.name, run.font.size, run.font.bold = BODY, Pt(10.5), True
    run.font.color.rgb = WHITE if last else INK
    if not last:
        txt(s3, "→", x + sw, 2.22, gap, 0.26, size=11, color=GREEN, align=PP_ALIGN.CENTER)

eyebrow(s3, "EIGHT CONSIDERATIONS, EVERY TIME A RUN IS PLANNED", 0.55, 3.0, 7.0)
checks = [("Product compatibility", "hard"), ("Pickup & delivery geography", "hard"),
          ("Quantity vs vehicle capacity", "hard"), ("Delivery time windows", "hard"),
          ("Perishability & freshness", "hard"), ("Estimated transport cost", "ranking"),
          ("Order priority", "ranking"), ("Cancellations & new orders", "replan")]
for i, (label, kind) in enumerate(checks):
    x = 0.55 + (i % 2) * 3.55
    y = 3.28 + (i // 2) * 0.52
    colour = GREEN if kind == "hard" else AMBER if kind == "ranking" else SLATE
    card(s3, x, y, 3.35, 0.42)
    e = s3.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x + 0.13), Inches(y + 0.15), Inches(0.11), Inches(0.11))
    e.fill.solid(); e.fill.fore_color.rgb = colour; e.line.fill.background(); e.shadow.inherit = False
    txt(s3, label, x + 0.32, y + 0.08, 2.4, 0.26, size=10.5)
    txt(s3, kind, x + 2.7, y + 0.1, 0.55, 0.24, size=8.5, bold=True, color=colour, align=PP_ALIGN.RIGHT)

RX, RW = 7.9, 4.9
card(s3, RX, 3.0, RW, 3.42, fill=TINT)
eyebrow(s3, "BUILT AND RUNNING", RX + 0.26, 3.18, RW - 0.5)
for i, t in enumerate([
    "Next.js 16 + TypeScript, server components",
    "PostgreSQL via Prisma, integer paise and grams",
    "Pooling, routing and forecasting in one codebase",
    "Live mandi prices from data.gov.in, daily cron",
    "Deployed on Vercel with Neon Postgres",
]):
    txt(s3, "•  " + t, RX + 0.26, 3.46 + i * 0.3, RW - 0.5, 0.28, size=10.5)
eyebrow(s3, "RULES THE CODE ENFORCES", RX + 0.26, 5.06, RW - 0.5)
for i, t in enumerate([
    "A run under 70% fill is held, not dispatched",
    "Reservations are atomic: no kilogram sells twice",
    "A forecast shows only if it beats a naive baseline",
]):
    txt(s3, "•  " + t, RX + 0.26, 5.34 + i * 0.3, RW - 0.5, 0.28, size=10.5)

note(s3, "Routing returns a feasible nearest-neighbour plan compared against a fixed-order baseline over the same stops. We do not claim a global optimum.")
notes(s3,
      "D-COA stands for Decision and Coordination Optimisation Algorithm. Say the full form out loud: it is our working name for the "
      "decision layer in our own codebase, not a claim that we invented or published a new algorithm. Walk the chain left to right, "
      "then explain the chips: five of the eight considerations are hard feasibility conditions, so if any one fails the order cannot "
      "be on that run. Cost and priority only rank among options that are already feasible, and a cancellation or new order forces a "
      "replan before dispatch. The important part for a judge: when an order is left out, the engine says which of these eight rules "
      "rejected it, in plain English, on the operator's screen. Nothing is a black-box score.")

# ────────────────────── 4 · feasibility and viability ──────────────────────
set_title(s4, "FEASIBILITY AND VIABILITY")
set_team(s4)
clear_instructions(s4)
subtitle(s4, "Return loads, fill thresholds, and what can go wrong")

card(s4, 0.55, 1.66, 6.4, 3.2, fill=TINT)
eyebrow(s4, "RETURN LOADS — WHY THE EMPTY HALF OF A TRIP MATTERS", 0.82, 1.84, 5.9)

circle = s4.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.95), Inches(2.3), Inches(1.25), Inches(1.25))
circle.fill.solid(); circle.fill.fore_color.rgb = GREEN; circle.line.fill.background(); circle.shadow.inherit = False
tf = circle.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
para = tf.paragraphs[0]; para.alignment = PP_ALIGN.CENTER
r = para.add_run(); r.text = "Raigad\nfarms"
r.font.name, r.font.size, r.font.bold, r.font.color.rgb = BODY, Pt(11), True, WHITE

circle2 = s4.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.3), Inches(2.3), Inches(1.25), Inches(1.25))
circle2.fill.solid(); circle2.fill.fore_color.rgb = INK; circle2.line.fill.background(); circle2.shadow.inherit = False
tf = circle2.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
para = tf.paragraphs[0]; para.alignment = PP_ALIGN.CENTER
r = para.add_run(); r.text = "Navi Mumbai\ncluster"
r.font.name, r.font.size, r.font.bold, r.font.color.rgb = BODY, Pt(11), True, WHITE

out = bar(s4, 2.32, 2.56, 2.8, 0.26, GREEN)
tfo = out.text_frame; tfo.vertical_anchor = MSO_ANCHOR.MIDDLE
po = tfo.paragraphs[0]; po.alignment = PP_ALIGN.CENTER
ro = po.add_run(); ro.text = "loaded 747.7 kg  →"
ro.font.name, ro.font.size, ro.font.bold, ro.font.color.rgb = BODY, Pt(9.5), True, WHITE

back = bar(s4, 2.32, 3.06, 2.8, 0.26, RGBColor(0xD9, 0xE2, 0xD5))
tfb = back.text_frame; tfb.vertical_anchor = MSO_ANCHOR.MIDDLE
pb = tfb.paragraphs[0]; pb.alignment = PP_ALIGN.CENTER
rb = pb.add_run(); rb.text = "←  returns empty today"
rb.font.name, rb.font.size, rb.font.bold, rb.font.color.rgb = BODY, Pt(9.5), True, MUTED

txt(s4, "A transporter who brings vegetables into the city drives home with an empty vehicle, and that wasted half is already "
        "priced into what he charges us. A return load is any cargo he can carry on the way back — seed, fertiliser, packaging, "
        "an FPO's supplies — matched to the corridor and time window he has already committed to. He accepts or declines it "
        "himself, and the quoted payment must still cover the real detour: empty space does not automatically mean a cheaper trip.",
    0.82, 3.66, 5.9, 1.05, size=9.5, line=12)

for i, (v, k) in enumerate([("123", "orders pooled"), ("747.7 kg", "on a 750 kg tempo"),
                            ("5", "stops: 4 farms, 1 drop"), ("₹5.37", "transport per kg")]):
    x = 0.55 + i * 1.64
    txt(s4, v, x, 5.0, 1.55, 0.36, size=18, bold=True, color=GREEN, font=HEAD)
    txt(s4, k, x, 5.38, 1.55, 0.4, size=9, color=MUTED)
txt(s4, "One real run, planned by the live system", 0.55, 5.84, 6.4, 0.26, size=9.5, italic=True, color=MUTED)

RX, RW = 7.3, 5.5
eyebrow(s4, "RISK, AND WHAT IS BUILT AGAINST IT", RX, 1.66, RW)
for i, (h, sub_t) in enumerate([
    ("Too few orders in one locality", "The run is held below 70% fill and rolls to the next window. A public invite page shows neighbours the exact shortfall."),
    ("Produce spoils in transit", "Freshness is a hard constraint per commodity; an over-age lot is never loaded on an unrefrigerated run."),
    ("Quality disputes", "Declared grade, per-stop handover records, and a resolution that can only deduct from a farmer with recorded agreement."),
    ("Farmer cannot use an app", "Marathi, Hindi and English on the farmer screens; one decision card answers what to send and what it pays."),
]):
    y = 1.94 + i * 1.08
    card(s4, RX, y, RW, 0.96)
    dot(s4, RX + 0.16, y + 0.18, "!", AMBER, 0.26, 11)
    txt(s4, h, RX + 0.52, y + 0.12, RW - 0.7, 0.24, size=11, bold=True)
    txt(s4, sub_t, RX + 0.52, y + 0.36, RW - 0.75, 0.55, size=9.5, color=MUTED, line=11.5)

note(s4, "Return-load matching is designed and specified; it is deliberately after the core proof, and is not claimed as shipped.")
notes(s4,
      "Return loads, in plain words: today a transporter brings vegetables into the city and drives back with an empty vehicle. He is "
      "already charging us for that empty half, because he has to. A return load — also called a backhaul — is any cargo he "
      "can carry on the journey home: seed, fertiliser, crates, an FPO's supplies. Because we already know his corridor, his time window "
      "and his spare capacity, we can offer him compatible work on the way back, which lowers the cost per kilogram of the outbound "
      "vegetable trip without anyone subsidising it. Two honest caveats: empty space does not automatically mean a cheaper or suitable "
      "trip, and the driver must accept the work with the payment covering the actual detour. It is specified but not yet shipped, and "
      "the slide says so. On the fill threshold: 123 orders filled a 750 kg tempo to 100 percent and brought transport down to "
      "₹5.37 per kilogram. Below 70 percent we hold the run rather than deliver at a loss.")

# ─────────────────────── 5 · impact and benefits ───────────────────────────
set_title(s5, "IMPACT AND BENEFITS")
set_team(s5)
clear_instructions(s5)
subtitle(s5, "Better for the farmer, cheaper for the buyer, and still self-funding")

data = CategoryChartData()
data.categories = ["Fragmented mandi chain\n(widely cited estimate)", "KrishiSetu, all 126\ndemo orders", "KrishiSetu, worked\ntomato example"]
data.add_series("Farmer's share of what the buyer pays (%)", (30.0, 64.2, 74.0))
frame = s5.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, Inches(0.55), Inches(1.64), Inches(6.3), Inches(2.5), data)
chart = frame.chart
chart.has_legend = False
chart.has_title = True
chart.chart_title.text_frame.text = "Farmer's share of what the buyer pays (%)"
tr = chart.chart_title.text_frame.paragraphs[0].runs[0]
tr.font.size, tr.font.bold, tr.font.name, tr.font.color.rgb = Pt(11), False, BODY, MUTED
plot = chart.plots[0]
plot.gap_width = 60
plot.vary_by_categories = True
plot.has_data_labels = True
labels = plot.data_labels
labels.number_format = '0.0"%"'
labels.number_format_is_linked = False
labels.position = XL_LABEL_POSITION.OUTSIDE_END
labels.font.size = Pt(10)
labels.font.color.rgb = INK
labels.font.name = BODY
series = plot.series[0]
for idx, colour in enumerate([RGBColor(0xA8, 0xB7, 0xA2), GREEN, GREEN]):
    point = series.points[idx]
    point.format.fill.solid()
    point.format.fill.fore_color.rgb = colour
chart.value_axis.has_major_gridlines = False
chart.value_axis.visible = False
chart.value_axis.maximum_scale = 100
chart.category_axis.tick_labels.font.size = Pt(9)
chart.category_axis.tick_labels.font.name = BODY
chart.category_axis.tick_labels.font.color.rgb = INK
chart.font.size = Pt(9)

txt(s5, "The fragmented-chain figure is a widely reported range for Indian vegetables, shown as an estimate. The two KrishiSetu bars "
        "are computed from orders in the running system.",
    0.55, 4.24, 6.3, 0.45, size=9, italic=True, color=MUTED, line=11)

RX, RW = 7.25, 5.55
card(s5, RX, 1.64, RW, 2.62, fill=TINT)
eyebrow(s5, "WHERE THE PLATFORM'S OWN MONEY COMES FROM", RX + 0.26, 1.82, RW - 0.5)
for i, (k, v, colour, strong) in enumerate([
    ("Disclosed buyer-side fee per order", "₹19.89", INK, False),
    ("Payment gateway, messaging, support", "− ₹5.60", MUTED, False),
    ("Contribution per completed order", "₹14.29", GREEN, True),
    ("Assumed monthly fixed cost", "₹60,000", INK, False),
    ("Orders per month to break even", "4,199", GREEN, True),
]):
    y = 2.14 + i * 0.4
    txt(s5, k, RX + 0.26, y, RW - 1.7, 0.28, size=10.5, bold=strong, color=INK if strong else MUTED)
    txt(s5, v, RX + RW - 1.5, y - 0.02, 1.24, 0.3, size=12.5 if strong else 11, bold=True, color=colour, align=PP_ALIGN.RIGHT)

txt(s5, "No farmer listing fee. No commission on settlement. When a price must be held under the quick-commerce reference, the site fee "
        "is cut to zero first — the farmer's accepted amount is never touched.",
    RX, 4.38, RW, 0.55, size=9.5, line=11.5)

for i, (who, what, colour) in enumerate([
    ("Farmer", "₹34.00/kg accepted and paid in full, beside a dated mandi comparison", GREEN),
    ("Buyer", "₹45.66/kg against a ₹55 reference, every bill line itemised", SLATE),
    ("Transporter", "₹4,016 for one full run, agreed before acceptance", AMBER),
    ("Platform", "₹14.29 per order, entirely from a disclosed buyer-side fee", PLUM),
]):
    x = 0.55 + i * 3.14
    card(s5, x, 5.1, 2.95, 1.2)
    dot(s5, x + 0.16, 5.26, who[0], colour, 0.28, 11)
    txt(s5, who, x + 0.52, 5.24, 2.2, 0.26, size=11.5, bold=True)
    txt(s5, what, x + 0.18, 5.62, 2.6, 0.6, size=9, color=MUTED, line=11)

note(s5, "Figures are computed over synthetic demonstration orders, so they size the model rather than measure a business. No production cost is recorded, so no column here is farming profit.")
notes(s5,
      "Three claims, in order. First, the farmer keeps far more of the buyer's rupee: 64 percent across all 126 orders in the system, "
      "74 percent on the worked tomato example, against the quarter-to-a-third widely reported for fragmented vegetable trade. That "
      "estimate is labelled as an estimate on the slide. Second, the buyer still pays less than the quick-commerce reference, so nobody "
      "is being asked to pay extra out of sympathy. Third, and this is the question every judge asks, where does our money come from. "
      "It comes from one disclosed line on the buyer's bill, ₹19.89 per order. After gateway and support costs we keep ₹14.29, "
      "so at an assumed ₹60,000 monthly fixed cost we break even at about 4,199 orders a month, roughly four clusters running twice "
      "a week. Be honest about the limit: a single-cluster pilot covers its fulfilment cost but not that fixed cost, and our own operator "
      "screen shows the shortfall. What we will not do is close it from the farmer's side.")

# ───────────────────── 6 · research and references ─────────────────────────
set_title(s6, "RESEARCH AND REFERENCES")
set_team(s6)
clear_instructions(s6)
subtitle(s6, "Sources, and what they do and do not prove")

refs = [
    ("Government of India open data portal", "Daily mandi prices, resource 9ef84268 — the live price feed in the app",
     "data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi", "DATA"),
    ("eNAM — trading and FPO pages", "Existing national electronic trade and FPO onboarding",
     "enam.gov.in/web/trading-details", "INCUMBENT"),
    ("Ninjacart and Ninja Mandi", "B2B vegetable supply chain and mandi operations",
     "ninjacart.com/ninja-mandi", "INCUMBENT"),
    ("agribazaar", "Marketplace, logistics and warehousing claims",
     "agribazaar.com/quick-links/steps", "INCUMBENT"),
    ("Samunnati", "FPO financing and market linkage",
     "samunnati.com/innovations", "INCUMBENT"),
    ("Google OR-Tools, VRP with time windows", "Reference formulation for capacitated routing with windows",
     "developers.google.com/optimization/routing/vrptw", "METHOD"),
    ("PIB release on agricultural marketing", "Government position on market reform",
     "pib.gov.in — PRID 2222802", "POLICY"),
    ("SIH 2026 idea submission format", "The template this deck follows",
     "sih.gov.in/letters/2026", "FORMAT"),
]
for i, (name, what, link, tag) in enumerate(refs):
    x = 0.55 + (i % 2) * 6.22
    y = 1.66 + (i // 2) * 1.16
    card(s6, x, y, 6.0, 1.04, fill=TINT)
    txt(s6, name, x + 0.22, y + 0.1, 4.3, 0.26, size=11, bold=True)
    txt(s6, tag, x + 4.5, y + 0.12, 1.3, 0.22, size=8, bold=True, color=GREEN if tag in ("DATA", "METHOD") else MUTED,
        align=PP_ALIGN.RIGHT, spacing=1.1)
    txt(s6, what, x + 0.22, y + 0.38, 5.5, 0.26, size=9.5, color=MUTED)
    txt(s6, link, x + 0.22, y + 0.66, 5.5, 0.26, size=8.5, color=GREEN)

note(s6, "What this does not prove: demand history and the fitted price series in the prototype are synthetic and labelled so on screen. "
         "An unmentioned capability on a competitor's public page is not evidence they lack it, and we claim no measured superiority "
         "without a comparable pilot.", y=6.38)
notes(s6,
      "Keep this slide short. The first source is live in the product, not just cited: the daily mandi price feed from the Government "
      "of India open data portal refreshes on a cron and every price on our screens carries its source label and date. The four "
      "incumbents are the ones we studied for gaps, and our positioning page states, for each gap, both what we built and where it "
      "stops. The routing reference is a formulation we follow, not a library we claim to have beaten. Then read the closing caveat "
      "aloud — the synthetic demand history is the honest limit of this prototype, and saying it first is stronger than being asked.")

prs.save("KrishiSetu_SIH2026_Template_v5.pptx")
print("saved")
