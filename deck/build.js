/**
 * KrishiSetu — SIH 2026 idea presentation.
 *
 * Every figure on these slides comes from the working application (see
 * web/scripts/deckfacts.ts), or is explicitly labelled as an estimate.
 * Each slide has its own centrepiece so no two read as the same template.
 */
const pptxgen = require("pptxgenjs");

const INK = "11140F";
const PANEL = "1B2018";
const GREEN = "2F6B3A";
const LIGHT = "7DBD6B";
const AMBER = "B7791F";
const PAPER = "FFFFFF";
const TINT = "F2F5EF";
const LINE = "DFE4DB";
const MUTED = "657062";
const SLATE = "6B8CAE";
const PLUM = "8A7FAE";

const HEAD = "Cambria";
const BODY = "Calibri";

const W = 13.33;
const M = 0.62;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Team Logic_Lords";
pres.title = "KrishiSetu — SIH26033";

/** Small caps label used above every slide title. */
function eyebrow(s, text, x = M, y = 0.42, color = MUTED) {
  s.addText(text, {
    x, y, w: 8, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2, color,
  });
}

function title(s, text, opts = {}) {
  s.addText(text, {
    x: M, y: 0.66, w: opts.w || 12.1, h: opts.h || 0.74, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: opts.size || 31, bold: true, color: opts.color || INK,
  });
}

function footer(s, n, dark = false) {
  s.addText("SIH26033 · Team Logic_Lords · SIH26-SW059 · RAIT", {
    x: M, y: 7.02, w: 8, h: 0.24, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 9, color: dark ? "6F7B68" : MUTED,
  });
  s.addText(String(n), {
    x: W - M - 0.5, y: 7.02, w: 0.5, h: 0.24, isTextBox: true, margin: 0, align: "right",
    fontFace: BODY, fontSize: 9, bold: true, color: dark ? "6F7B68" : MUTED,
  });
}

/** Filled circle carrying a numeral or glyph — the one motif repeated across slides. */
function dot(s, x, y, label, fill = GREEN, size = 0.34, fontSize = 12) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color: fill } });
  s.addText(label, {
    x, y, w: size, h: size, isTextBox: true, margin: 0, align: "center", valign: "middle",
    fontFace: BODY, fontSize, bold: true, color: "FFFFFF",
  });
}

function card(s, x, y, w, h, opts = {}) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: opts.fill || PAPER },
    line: { color: opts.line || LINE, width: 1 },
  });
}

// ───────────────────────────── Slide 1 · title ─────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: INK };

  s.addText("SMART INDIA HACKATHON 2026", {
    x: M, y: 0.7, w: 9, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 12, bold: true, charSpacing: 3, color: LIGHT,
  });

  s.addText("KrishiSetu", {
    x: M, y: 1.15, w: 8.4, h: 1.0, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 60, bold: true, color: "FFFFFF",
  });

  s.addText("The farmer names their price. Everything after that is shared transport and a bill you can read.", {
    x: M, y: 2.25, w: 7.9, h: 1.0, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 21, color: "D8E2D3", lineSpacing: 30,
  });

  // The whole idea as one strip, so the first slide already states the mechanic.
  const steps = [
    ["Several farms", "one neighbourhood, one window"],
    ["One tempo", "loaded only against confirmed orders"],
    ["One pickup point", "collected, or walked the last 300 m"],
  ];
  steps.forEach(([h, sub], i) => {
    const x = M + i * 4.05;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 3.62, w: 3.72, h: 1.12, rectRadius: 0.06,
      fill: { color: PANEL }, line: { color: "36402F", width: 1 },
    });
    dot(s, x + 0.24, 3.84, String(i + 1), GREEN, 0.3, 11);
    s.addText(h, {
      x: x + 0.64, y: 3.8, w: 2.9, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 14, bold: true, color: "FFFFFF",
    });
    s.addText(sub, {
      x: x + 0.64, y: 4.12, w: 2.95, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 10.5, color: "9FAE98",
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 3.74, y: 4.0, w: 0.3, h: 0.3, isTextBox: true, margin: 0, align: "center",
        fontFace: BODY, fontSize: 14, color: LIGHT,
      });
    }
  });

  const meta = [
    ["Problem Statement ID", "SIH26033"],
    ["Theme", "Agriculture, FoodTech & Rural Development"],
    ["PS Category", "Software"],
    ["Team ID · Team Name", "SIH26-SW059 · Logic_Lords"],
  ];
  meta.forEach(([k, v], i) => {
    const x = M + i * 3.05;
    s.addText(k.toUpperCase(), {
      x, y: 5.28, w: 2.9, h: 0.24, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 9, bold: true, charSpacing: 1.6, color: "7F8C78",
    });
    s.addText(v, {
      x, y: 5.52, w: 2.9, h: 0.62, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 12.5, bold: true, color: "E6EDE2",
    });
  });

  s.addText("Ramrao Adik Institute of Technology · working prototype live at krishisetu-weld.vercel.app", {
    x: M, y: 6.42, w: 11, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 11, color: LIGHT,
  });
  footer(s, 1, true);

  s.addNotes(
    "Open with the problem in one line: a small farmer cannot fill a tempo alone, so hiring one eats the margin, " +
    "and that is why the farmer keeps roughly a quarter to a third of what the buyer finally pays. " +
    "KrishiSetu pools the produce of several farmers who are all sending to the same neighbourhood, moves it once, " +
    "and drops it at one pickup point a hundred households already live around. " +
    "Say clearly that this is a working application, not a mockup: every number in this deck is read out of the running system, " +
    "and anything that is an estimate is labelled as one on the slide."
  );
}

// ──────────────────────── Slide 2 · proposed solution ───────────────────────
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  eyebrow(s, "PROPOSED SOLUTION");
  title(s, "The farmer's rate is an input, never the leftover");

  // Left: the rupee anatomy for one kilogram, drawn as a real stacked bar.
  const parts = [
    { label: "Farmer", v: 34.0, color: GREEN },
    { label: "Transport", v: 4.7, color: SLATE },
    { label: "Packing, handling", v: 3.96, color: AMBER },
    { label: "Site fee", v: 3.0, color: PLUM },
  ];
  const total = parts.reduce((a, b) => a + b.v, 0);
  const barX = M, barY = 2.12, barW = 6.5;

  s.addText("ONE KILOGRAM OF TOMATO, BUILT UPWARD", {
    x: M, y: 1.62, w: 6.5, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });

  let cx = barX;
  parts.forEach((p) => {
    const w = (p.v / total) * barW;
    s.addShape(pres.ShapeType.rect, { x: cx, y: barY, w, h: 0.42, fill: { color: p.color } });
    cx += w;
  });

  parts.forEach((p, i) => {
    const x = barX + (i % 2) * 3.3;
    const y = 2.72 + Math.floor(i / 2) * 0.42;
    s.addShape(pres.ShapeType.ellipse, { x, y: y + 0.07, w: 0.12, h: 0.12, fill: { color: p.color } });
    s.addText(`${p.label}`, {
      x: x + 0.2, y, w: 1.85, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11.5, color: INK,
    });
    s.addText(`₹${p.v.toFixed(2)}`, {
      x: x + 2.0, y, w: 0.9, h: 0.28, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: 11.5, bold: true, color: p.color,
    });
  });

  s.addText(
    [
      { text: "₹45.66", options: { fontFace: HEAD, fontSize: 30, bold: true, color: INK } },
      { text: "  buyer pays  ", options: { fontFace: BODY, fontSize: 12, color: MUTED } },
      { text: "vs ₹55.00 quick-commerce reference", options: { fontFace: BODY, fontSize: 12, color: AMBER } },
    ],
    { x: M, y: 3.62, w: 6.5, h: 0.48, isTextBox: true, margin: 0 }
  );

  // Named farmers, because a pooled consignment must never hide whose produce it is.
  s.addText("ONE 5 KG BUYER ORDER, FILLED FROM TWO NAMED FARMS", {
    x: M, y: 4.2, w: 6.5, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });

  const farmers = [
    ["Sanjay Patil", "Khalapur, Raigad", "3.0 kg", "₹102.00"],
    ["Meena Bhoir", "Panvel Rural, Raigad", "2.0 kg", "₹68.00"],
  ];
  farmers.forEach(([name, place, qty, amt], i) => {
    const y = 4.54 + i * 0.86;
    card(s, M, y, 6.5, 0.74, { fill: TINT });
    dot(s, M + 0.2, y + 0.2, name[0], GREEN, 0.34, 13);
    s.addText(name, {
      x: M + 0.66, y: y + 0.11, w: 3.0, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 13, bold: true, color: INK,
    });
    s.addText(place, {
      x: M + 0.66, y: y + 0.39, w: 3.0, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 10.5, color: MUTED,
    });
    s.addText(qty, {
      x: M + 3.8, y: y + 0.22, w: 1.0, h: 0.3, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: 12.5, color: INK,
    });
    s.addText(amt, {
      x: M + 5.0, y: y + 0.2, w: 1.3, h: 0.34, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: 14, bold: true, color: GREEN,
    });
  });

  // Right column: what is different, and how the buyer receives it.
  const rx = 7.55, rw = W - rx - M;
  card(s, rx, 1.58, rw, 2.42, { fill: TINT });
  s.addText("WHAT IS ACTUALLY DIFFERENT", {
    x: rx + 0.3, y: 1.76, w: rw - 0.6, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  [
    ["Farmer sets the net rate", "No commission, listing charge or logistics cost is deducted from it anywhere."],
    ["Orders are pooled by destination", "Only lots going to the same neighbourhood share a vehicle."],
    ["Nothing moves unsold", "The tempo is loaded against confirmed orders, so there is no stock to write off."],
  ].forEach(([h, sub], i) => {
    const y = 2.1 + i * 0.63;
    dot(s, rx + 0.3, y + 0.03, String(i + 1), GREEN, 0.26, 10);
    s.addText(h, {
      x: rx + 0.68, y, w: rw - 1.0, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 12.5, bold: true, color: INK,
    });
    s.addText(sub, {
      x: rx + 0.68, y: y + 0.26, w: rw - 1.0, h: 0.36, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 10.5, color: MUTED,
    });
  });

  s.addText("HOW THE BUYER RECEIVES IT", {
    x: rx, y: 4.2, w: rw, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  const tiers = [
    ["A", "Cluster pickup point", "Kirana or society office holds the batch, 6–9 pm window", "₹10", GREEN],
    ["B", "Last 300 metres", "Hand cart inside the same society, free above a ₹500 basket", "₹20", AMBER],
    ["C", "Express, on demand", "Not offered — it cannot pay for itself at a 6 kg basket", "—", MUTED],
  ];
  tiers.forEach(([tag, name, sub, fee, color], i) => {
    const y = 4.54 + i * 0.72;
    card(s, rx, y, rw, 0.62);
    dot(s, rx + 0.16, y + 0.14, tag, color, 0.34, 12);
    s.addText(name, {
      x: rx + 0.62, y: y + 0.05, w: rw - 1.6, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 12, bold: true, color: INK,
    });
    s.addText(sub, {
      x: rx + 0.62, y: y + 0.29, w: rw - 1.6, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 9.5, color: MUTED,
    });
    s.addText(fee, {
      x: rx + rw - 0.95, y: y + 0.16, w: 0.8, h: 0.3, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: 13, bold: true, color,
    });
  });

  s.addText("Worked with the same pricing function the live site uses. ₹55/kg is an assumed quick-commerce reference, not a live scrape.", {
    x: M, y: 6.5, w: 12.1, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED,
  });
  footer(s, 2);

  s.addNotes(
    "The bar is the whole argument. We do not start from a retail price and work down to whatever is left for the farmer; " +
    "we start from the rate the farmer accepted and add the real shared costs on top. " +
    "Sanjay Patil and Meena Bhoir are named because a pooled consignment must never hide whose produce it is: " +
    "one buyer order can draw from two farms, and each farm's kilograms and rupees stay its own row in the database. " +
    "On the right, note that door delivery is tier B, not the default. A weekly household basket is about six kilograms, " +
    "so a dedicated rider drop would eat a tenth of the order value. Collection from a neighbourhood point is the default, " +
    "the last 300 metres is a priced extra that is free above a ₹500 basket, and ten-minute express is deliberately not offered " +
    "because at this basket size it cannot pay for itself."
  );
}

// ──────────────────────── Slide 3 · technical approach ──────────────────────
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  eyebrow(s, "TECHNICAL APPROACH");
  title(s, "D-COA — Decision & Coordination Optimisation Algorithm", { size: 27, w: 12.1 });

  s.addText("Our working name for the decision layer. It is a product name for our own engine, not a claim of a new published algorithm.", {
    x: M, y: 1.42, w: 11.6, h: 0.28, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 11.5, color: MUTED,
  });

  // A pipeline, drawn as a chain: this slide's centrepiece is flow, not cards.
  const stages = ["Confirmed orders", "Compatibility", "Lot allocation", "Capacity & freshness", "Route plan", "Explained batch"];
  const bw = 1.82, gap = 0.19;
  stages.forEach((label, i) => {
    const x = M + i * (bw + gap);
    const last = i === stages.length - 1;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.92, w: bw, h: 0.88, rectRadius: 0.06,
      fill: { color: last ? GREEN : TINT }, line: { color: last ? GREEN : LINE, width: 1 },
    });
    s.addText(label, {
      x: x + 0.1, y: 2.02, w: bw - 0.2, h: 0.68, isTextBox: true, margin: 0,
      align: "center", valign: "middle",
      fontFace: BODY, fontSize: 11, bold: true, color: last ? "FFFFFF" : INK,
    });
    if (!last) {
      s.addText("→", {
        x: x + bw, y: 2.22, w: gap, h: 0.28, isTextBox: true, margin: 0, align: "center",
        fontFace: BODY, fontSize: 12, color: GREEN,
      });
    }
  });

  // Eight considerations as compact chips.
  s.addText("EIGHT CONSIDERATIONS, EVERY TIME A RUN IS PLANNED", {
    x: M, y: 3.06, w: 7.4, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  const checks = [
    ["Product compatibility", "hard"], ["Pickup & delivery geography", "hard"],
    ["Quantity vs vehicle capacity", "hard"], ["Delivery time windows", "hard"],
    ["Perishability & freshness", "hard"], ["Estimated transport cost", "ranking"],
    ["Order priority", "ranking"], ["Cancellations & new orders", "replan"],
  ];
  checks.forEach(([label, kind], i) => {
    const x = M + (i % 2) * 3.72;
    const y = 3.4 + Math.floor(i / 2) * 0.55;
    const color = kind === "hard" ? GREEN : kind === "ranking" ? AMBER : SLATE;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 3.52, h: 0.44, rectRadius: 0.05, fill: { color: PAPER }, line: { color: LINE, width: 1 },
    });
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.14, y: y + 0.16, w: 0.12, h: 0.12, fill: { color } });
    s.addText(label, {
      x: x + 0.34, y: y + 0.08, w: 2.5, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11, color: INK,
    });
    s.addText(kind, {
      x: x + 2.82, y: y + 0.1, w: 0.62, h: 0.26, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: 9, bold: true, color,
    });
  });

  // Right: the stack and the rules that are enforced in code.
  const rx = 8.1, rw = W - rx - M;
  card(s, rx, 3.06, rw, 3.5, { fill: TINT });
  s.addText("BUILT AND RUNNING", {
    x: rx + 0.28, y: 3.26, w: rw - 0.56, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  [
    "Next.js 16 + TypeScript, server components",
    "PostgreSQL via Prisma, integer paise and grams",
    "Pooling, routing and forecasting in one codebase",
    "Live mandi prices from data.gov.in, daily cron",
    "Deployed on Vercel with Neon Postgres",
  ].forEach((t, i) => {
    s.addText(t, {
      x: rx + 0.28, y: 3.6 + i * 0.32, w: rw - 0.56, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11, color: INK, bullet: true,
    });
  });

  s.addText("RULES THE CODE ENFORCES", {
    x: rx + 0.28, y: 5.24, w: rw - 0.56, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  [
    "A run under 70% fill is held, not dispatched",
    "Reservations are atomic: no kilogram sells twice",
    "A forecast shows only if it beats a naive baseline",
  ].forEach((t, i) => {
    s.addText(t, {
      x: rx + 0.28, y: 5.56 + i * 0.33, w: rw - 0.56, h: 0.32, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11, color: INK, bullet: true,
    });
  });

  s.addText("Routing returns a feasible nearest-neighbour plan compared against a fixed-order baseline over the same stops. We do not claim a global optimum.", {
    x: M, y: 6.5, w: 12.1, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED,
  });
  footer(s, 3);

  s.addNotes(
    "D-COA stands for Decision and Coordination Optimisation Algorithm. Say the full form out loud: it is our working name for " +
    "the decision layer in our own codebase, not a claim that we invented or published a new algorithm. " +
    "Walk the chain left to right, then explain the chips: five of the eight considerations are hard feasibility conditions — " +
    "if any one fails the order simply cannot be on that run. Cost and priority only rank among options that are already feasible, " +
    "and a cancellation or a new order forces a replan before dispatch. " +
    "The important part for a judge: when an order is left out, the engine says which of these eight rules rejected it, in plain English, " +
    "on the operator's screen. Nothing is a black box score."
  );
}

// ─────────────────── Slide 4 · feasibility and viability ────────────────────
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  eyebrow(s, "FEASIBILITY AND VIABILITY");
  title(s, "Return loads, fill thresholds, and what can go wrong", { size: 30 });

  // Centrepiece: the return-load diagram.
  card(s, M, 1.5, 6.7, 3.42, { fill: TINT });
  s.addText("RETURN LOADS — WHY THE EMPTY HALF OF A TRIP MATTERS", {
    x: M + 0.3, y: 1.68, w: 6.1, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });

  s.addShape(pres.ShapeType.ellipse, { x: M + 0.42, y: 2.24, w: 1.34, h: 1.34, fill: { color: GREEN } });
  s.addText("Raigad\nfarms", {
    x: M + 0.42, y: 2.24, w: 1.34, h: 1.34, isTextBox: true, margin: 0, align: "center", valign: "middle",
    fontFace: BODY, fontSize: 11.5, bold: true, color: "FFFFFF",
  });
  s.addShape(pres.ShapeType.ellipse, { x: M + 4.92, y: 2.24, w: 1.34, h: 1.34, fill: { color: INK } });
  s.addText("Navi Mumbai\ncluster", {
    x: M + 4.92, y: 2.24, w: 1.34, h: 1.34, isTextBox: true, margin: 0, align: "center", valign: "middle",
    fontFace: BODY, fontSize: 11.5, bold: true, color: "FFFFFF",
  });

  s.addShape(pres.ShapeType.rect, { x: M + 1.9, y: 2.52, w: 2.9, h: 0.26, fill: { color: GREEN } });
  s.addText("loaded 747.7 kg  →", {
    x: M + 1.9, y: 2.5, w: 2.9, h: 0.3, isTextBox: true, margin: 0, align: "center", valign: "middle",
    fontFace: BODY, fontSize: 10, bold: true, color: "FFFFFF",
  });
  s.addShape(pres.ShapeType.rect, { x: M + 1.9, y: 3.06, w: 2.9, h: 0.26, fill: { color: "D9E2D5" }, line: { color: LINE, width: 1 } });
  s.addText("←  returns empty today", {
    x: M + 1.9, y: 3.04, w: 2.9, h: 0.3, isTextBox: true, margin: 0, align: "center", valign: "middle",
    fontFace: BODY, fontSize: 10, bold: true, color: MUTED,
  });

  s.addText(
    "A transporter who brings vegetables into the city drives home with an empty vehicle, and that wasted half is already " +
    "priced into what he charges us. A return load is any cargo he can carry on the way back — seed, fertiliser, packaging, " +
    "an FPO's supplies — matched to the corridor and time window he has already committed to. He accepts or declines it himself, " +
    "and the quoted payment must still cover the real detour: empty space does not automatically mean a cheaper trip.",
    { x: M + 0.3, y: 3.72, w: 6.1, h: 1.08, isTextBox: true, margin: 0, fontFace: BODY, fontSize: 10, color: INK, lineSpacing: 13 }
  );

  // Right: risks and the mitigation actually built.
  const rx = 7.62, rw = W - rx - M;
  s.addText("RISK, AND WHAT IS BUILT AGAINST IT", {
    x: rx, y: 1.5, w: rw, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  [
    ["Too few orders in one locality", "The run is held below 70% fill and rolls to the next window. A public invite page shows neighbours the exact shortfall."],
    ["Produce spoils in transit", "Freshness is a hard constraint per commodity; an over-age lot is never loaded on an unrefrigerated run."],
    ["Quality disputes", "Declared grade, per-stop handover records, and a resolution that can only deduct from a farmer with recorded agreement."],
    ["Farmer cannot use an app", "Marathi, Hindi and English on the farmer screens; one decision card answers what to send and what it pays."],
  ].forEach(([h, sub], i) => {
    const y = 1.84 + i * 1.12;
    card(s, rx, y, rw, 1.0);
    dot(s, rx + 0.18, y + 0.18, "!", AMBER, 0.28, 12);
    s.addText(h, {
      x: rx + 0.58, y: y + 0.1, w: rw - 0.8, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11.5, bold: true, color: INK,
    });
    s.addText(sub, {
      x: rx + 0.58, y: y + 0.36, w: rw - 0.8, h: 0.56, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 10, color: MUTED, lineSpacing: 12,
    });
  });

  // Measured run, bottom left.
  const facts = [["123", "orders pooled"], ["747.7 kg", "on a 750 kg tempo"], ["5", "stops: 4 farms, 1 drop"], ["₹5.37", "transport per kg"]];
  facts.forEach(([v, k], i) => {
    const x = M + i * 1.72;
    s.addText(v, {
      x, y: 5.28, w: 1.62, h: 0.42, isTextBox: true, margin: 0,
      fontFace: HEAD, fontSize: 20, bold: true, color: GREEN,
    });
    s.addText(k, {
      x, y: 5.7, w: 1.62, h: 0.44, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 9.5, color: MUTED,
    });
  });
  s.addText("One real run, planned by the live system", {
    x: M, y: 6.14, w: 6.7, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, italic: true, color: MUTED,
  });

  s.addText("Return-load matching is designed and specified; it is deliberately after the core proof, and is not claimed as shipped.", {
    x: M, y: 6.5, w: 12.1, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED,
  });
  footer(s, 4);

  s.addNotes(
    "Return loads, in plain words: today a transporter brings vegetables into the city and drives back with an empty vehicle. " +
    "He is already charging us for that empty half, because he has to. A return load — also called a backhaul — is any cargo he can " +
    "carry on the journey home: seed, fertiliser, crates, an FPO's supplies. Because we already know his corridor, his time window " +
    "and his spare capacity, we can offer him compatible work on the way back, which lowers the cost per kilogram of the outbound " +
    "vegetable trip without anyone subsidising it. Two honest caveats: empty space does not automatically mean a cheaper or suitable trip, " +
    "and the driver must accept the work with the payment covering the actual detour. It is specified but not yet shipped, and the slide says so. " +
    "On the fill threshold: 123 orders filled a 750 kg tempo to 100 percent and brought transport down to ₹5.37 per kilogram. " +
    "Below 70 percent we hold the run rather than deliver at a loss."
  );
}

// ───────────────────── Slide 5 · impact and benefits ────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  eyebrow(s, "IMPACT AND BENEFITS");
  title(s, "Better for the farmer, cheaper for the buyer, self-funding", { size: 29 });

  s.addChart(
    pres.ChartType.bar,
    [{
      name: "Farmer's share of the buyer's rupee",
      labels: ["Fragmented mandi chain\n(widely cited estimate)", "KrishiSetu, all 126\ndemo orders", "KrishiSetu, worked\ntomato example"],
      values: [30, 64.2, 74],
    }],
    {
      x: M, y: 1.56, w: 6.6, h: 2.5,
      barDir: "bar",
      showTitle: true,
      title: "Farmer's share of what the buyer pays (%)",
      titleFontSize: 12, titleColor: MUTED, titleFontFace: BODY,
      chartColors: ["A8B7A2", GREEN, GREEN],
      varyColors: true,
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFontSize: 11,
      dataLabelColor: INK,
      dataLabelFormatCode: '0.0"%"',
      showLegend: false,
      catAxisLabelColor: INK,
      catAxisLabelFontSize: 9.5,
      valAxisLabelColor: MUTED,
      valAxisMaxVal: 100,
      valGridLine: { color: "EDEFEA", size: 1 },
      catGridLine: { style: "none" },
      valAxisHidden: true,
      plotArea: { fill: { color: PAPER } },
    }
  );

  s.addText("The fragmented-chain figure is a widely reported range for Indian vegetables, shown as an estimate. The two KrishiSetu bars are computed from orders in the running system.", {
    x: M, y: 4.08, w: 6.6, h: 0.42, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED, lineSpacing: 12,
  });

  // The self-funding arithmetic, spelled out.
  const rx = 7.5, rw = W - rx - M;
  card(s, rx, 1.56, rw, 3.0, { fill: TINT });
  s.addText("WHERE THE PLATFORM'S OWN MONEY COMES FROM", {
    x: rx + 0.3, y: 1.74, w: rw - 0.6, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, bold: true, charSpacing: 1.6, color: MUTED,
  });
  const rows = [
    ["Disclosed buyer-side fee per order", "₹19.89", INK],
    ["Payment gateway, messaging, support", "− ₹5.60", MUTED],
    ["Contribution per completed order", "₹14.29", GREEN],
    ["Assumed monthly fixed cost", "₹60,000", INK],
    ["Orders per month to break even", "4,199", GREEN],
  ];
  rows.forEach(([k, v, color], i) => {
    const y = 2.1 + i * 0.44;
    const strong = i === 2 || i === 4;
    s.addText(k, {
      x: rx + 0.3, y, w: rw - 1.8, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11.5, bold: strong, color: strong ? INK : MUTED,
    });
    s.addText(v, {
      x: rx + rw - 1.55, y: y - 0.02, w: 1.25, h: 0.32, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: strong ? 14 : 12, bold: true, color,
    });
  });
  s.addText("No farmer listing fee. No commission on settlement. When a price must be held under the quick-commerce reference, the site fee is cut to zero first — the farmer's accepted amount is never touched.", {
    x: rx + 0.3, y: 4.62, w: rw - 0.6, h: 0.6, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 10, color: INK, lineSpacing: 12,
  });

  // Bottom: who gains what.
  const gains = [
    ["Farmer", "₹34.00/kg accepted and paid in full, beside a dated mandi comparison on the same quantity", GREEN],
    ["Buyer", "₹45.66/kg against a ₹55 reference, with all four bill lines itemised before confirming", SLATE],
    ["Transporter", "₹4,016 for one full run agreed before acceptance, instead of a half-empty trip", AMBER],
    ["Platform", "₹14.29 per order, entirely from a disclosed buyer-side fee", PLUM],
  ];
  gains.forEach(([who, what, color], i) => {
    const x = M + i * 3.11;
    card(s, x, 5.34, 2.92, 1.0);
    dot(s, x + 0.18, 5.5, who[0], color, 0.3, 12);
    s.addText(who, {
      x: x + 0.58, y: 5.46, w: 2.2, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 12.5, bold: true, color: INK,
    });
    s.addText(what, {
      x: x + 0.2, y: 5.8, w: 2.56, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 9.5, color: MUTED, lineSpacing: 11.5,
    });
  });

  s.addText("Figures are computed over synthetic demonstration orders, so they size the model rather than measure a business. No production cost is recorded, so no column here is farming profit.", {
    x: M, y: 6.5, w: 12.1, h: 0.26, isTextBox: true, margin: 0,
    fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED,
  });
  footer(s, 5);

  s.addNotes(
    "Three claims, in order. First, the farmer keeps far more of the buyer's rupee: 64 percent across all 126 orders in the system, " +
    "74 percent on the worked tomato example, against the quarter-to-a-third that is widely reported for fragmented vegetable trade. " +
    "That estimate is labelled as an estimate on the slide — we are not pretending it is our measurement. " +
    "Second, the buyer still pays less than the quick-commerce reference, so nobody is being asked to pay extra out of sympathy. " +
    "Third — and this is the question every judge asks — where does our money come from. " +
    "It comes from one disclosed line on the buyer's bill, ₹19.89 per order. After gateway and support costs we keep ₹14.29, " +
    "so at an assumed ₹60,000 monthly fixed cost we break even at about 4,199 orders a month, roughly four clusters running twice a week. " +
    "Be honest about the limit: a single-cluster pilot covers its fulfilment cost but not that fixed cost, and our own operator screen shows the shortfall. " +
    "What we will not do is close it from the farmer's side — there is no listing fee and no commission on settlement."
  );
}

// ─────────────────── Slide 6 · research and references ──────────────────────
{
  const s = pres.addSlide();
  s.background = { color: INK };
  eyebrow(s, "RESEARCH AND REFERENCES", M, 0.42, LIGHT);
  title(s, "Sources, and what they do and do not prove", { color: "FFFFFF" });

  const refs = [
    ["Government of India open data portal", "Daily mandi prices, resource 9ef84268 — the live price feed in the app", "data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi", "DATA"],
    ["eNAM — trading and FPO pages", "Existing national electronic trade and FPO onboarding", "enam.gov.in/web/trading-details", "INCUMBENT"],
    ["Ninjacart and Ninja Mandi", "B2B vegetable supply chain and mandi operations", "ninjacart.com/ninja-mandi", "INCUMBENT"],
    ["agribazaar", "Marketplace, logistics and warehousing claims", "agribazaar.com/quick-links/steps", "INCUMBENT"],
    ["Samunnati", "FPO financing and market linkage", "samunnati.com/innovations", "INCUMBENT"],
    ["Google OR-Tools, VRP with time windows", "Reference formulation for capacitated routing with windows", "developers.google.com/optimization/routing/vrptw", "METHOD"],
    ["PIB release on agricultural marketing", "Government position on market reform", "pib.gov.in — PRID 2222802", "POLICY"],
    ["SIH 2026 idea submission format", "The template this deck follows", "sih.gov.in/letters/2026", "FORMAT"],
  ];

  refs.forEach(([name, what, link, tag], i) => {
    const x = M + (i % 2) * 6.18;
    const y = 1.62 + Math.floor(i / 2) * 1.16;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 5.9, h: 1.0, rectRadius: 0.06, fill: { color: PANEL }, line: { color: "36402F", width: 1 },
    });
    s.addText(name, {
      x: x + 0.24, y: y + 0.11, w: 4.2, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 12, bold: true, color: "FFFFFF",
    });
    s.addText(tag, {
      x: x + 4.5, y: y + 0.13, w: 1.2, h: 0.24, isTextBox: true, margin: 0, align: "right",
      fontFace: BODY, fontSize: 8.5, bold: true, charSpacing: 1.2,
      color: tag === "DATA" ? LIGHT : tag === "METHOD" ? "C9B27A" : "8FA087",
    });
    s.addText(what, {
      x: x + 0.24, y: y + 0.39, w: 5.4, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 10, color: "A9B6A2",
    });
    s.addText(link, {
      x: x + 0.24, y: y + 0.66, w: 5.4, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 9, color: LIGHT,
    });
  });

  s.addText(
    "What this does not prove: demand history and the fitted price series in the prototype are synthetic and labelled so on screen. " +
    "An unmentioned capability on a competitor's public page is not evidence they lack it, and we claim no measured superiority without a comparable pilot.",
    { x: M, y: 6.28, w: 12.1, h: 0.5, isTextBox: true, margin: 0, fontFace: BODY, fontSize: 10, italic: true, color: "8FA087", lineSpacing: 13 }
  );
  footer(s, 6, true);

  s.addNotes(
    "Keep this slide short. Point out three things. The first source is live in the product, not just cited: the daily mandi price feed " +
    "from the Government of India open data portal refreshes on a cron and every price on our screens carries its source label and date. " +
    "The four incumbents are the ones we studied for gaps, and our positioning page states, for each gap, both what we built and where it stops. " +
    "The routing reference is a formulation we follow, not a library we claim to have beaten. " +
    "Then read the closing caveat aloud — the synthetic demand history is the honest limit of this prototype, and saying it first is stronger " +
    "than being asked about it."
  );
}

pres.writeFile({ fileName: "KrishiSetu_SIH2026_v5.pptx" }).then((f) => console.log("wrote", f));
