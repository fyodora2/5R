const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, PageBreak, ExternalHyperlink, LevelFormat,
} = require("docx");

const FIG = path.join(__dirname, "figures");

const FA_RTL = "Tahoma";
const FA_LTR = "Calibri";

const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
function faNum(n) {
  return String(n).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
}
function fa(text, opts = {}) {
  return new TextRun({ text, font: FA_RTL, rightToLeft: true, ...opts });
}
function en(text, opts = {}) {
  return new TextRun({ text, font: FA_LTR, ...opts });
}
function pFa(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [fa(children)];
  return new Paragraph({ children: runs, bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 160, line: 300 }, ...opts });
}
function pEn(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [en(children)];
  return new Paragraph({ children: runs, alignment: AlignmentType.LEFT, spacing: { after: 160, line: 280 }, ...opts });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { before: 400, after: 200 },
    children: [fa(text, { bold: true, size: 30, color: "0b0b0b" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { before: 280, after: 160 },
    children: [fa(text, { bold: true, size: 25, color: "1c5cab" })],
  });
}
function h1en(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 400, after: 200 },
    children: [en(text, { bold: true, size: 30, color: "0b0b0b" })],
  });
}
function bulletsFa(items) {
  return items.map((t) => new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    bullet: { level: 0 },
    spacing: { after: 120, line: 280 },
    children: [fa(t)],
  }));
}
function hr() {
  return new Paragraph({
    border: { bottom: { color: "c3c2b7", space: 4, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 200, after: 200 },
  });
}
function figure(file, caption, widthPx = 620) {
  const buf = fs.readFileSync(path.join(FIG, file));
  const dims = getPngDims(buf);
  const ratio = dims.height / dims.width;
  const w = widthPx, hgt = Math.round(widthPx * ratio);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({ data: buf, type: "png", transformation: { width: w, height: hgt } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, bidirectional: true,
      spacing: { after: 260 },
      children: [fa(caption, { italics: true, size: 18, color: "52514e" })],
    }),
  ];
}
function getPngDims(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function tableFa(headers, rows, colWidthsPct) {
  const total = 9350;
  const widths = colWidthsPct ? colWidthsPct.map((p) => Math.round((p / 100) * total)) : headers.map(() => Math.round(total / headers.length));
  const headerRow = new TableRow({
    children: headers.map((htxt, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: "1c5cab" },
      children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [fa(htxt, { bold: true, color: "ffffff", size: 19 })] })],
    })),
  });
  const bodyRows = rows.map((r, ridx) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ridx % 2 === 0 ? "f9f9f7" : "ffffff" },
      children: [new Paragraph({ bidirectional: true, alignment: i === 0 ? AlignmentType.RIGHT : AlignmentType.CENTER, children: [fa(String(cell), { size: 18 })] })],
    })),
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

function tableEn(headers, rows, colWidthsPct, size = 16) {
  const total = 9350;
  const widths = colWidthsPct.map((p) => Math.round((p / 100) * total));
  const cell = (txt, i, opts) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    ...opts,
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [en(String(txt), { size, ...(opts.run || {}) })] })],
  });
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, i, { shading: { type: ShadingType.CLEAR, fill: "1c5cab" }, run: { bold: true, color: "ffffff" } })),
  });
  const bodyRows = rows.map((r, ridx) => new TableRow({
    children: r.map((c, i) => cell(c, i, { shading: { type: ShadingType.CLEAR, fill: ridx % 2 === 0 ? "f9f9f7" : "ffffff" } })),
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}
function caption(text) {
  return new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 200, after: 100 },
    children: [fa(text, { bold: true, size: 20 })] });
}
function note(text) {
  return new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 60, after: 240 },
    children: [fa(text, { size: 17, color: "52514e" })] });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

// ---------------------------------------------------------------------------
// DATA (every number in the text is computed from the released data files)
// ---------------------------------------------------------------------------
const DATA = path.join(__dirname, "..", "data");
function readCsv(file) {
  const txt = fs.readFileSync(path.join(DATA, file), "utf8").replace(/\r/g, "");
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const STUDIES = readCsv("study_charting.csv");
const MASTER = readCsv("master_registry.csv");
const REGPUB = readCsv("registry_linked_publications.csv");
const REGS = readCsv("registry_linkage.csv");
const N = STUDIES.length;
const DB = MASTER.filter((m) => !m.source_db.startsWith("Registry"));
const DB_INC = DB.filter((m) => m.decision === "included");
const DB_EXC = DB.filter((m) => m.decision === "excluded");
const N_REPORTS = MASTER.filter((m) => m.decision === "included").length;
if (N !== 86 || N_REPORTS !== 89 || DB.length !== 147) throw new Error("unexpected corpus size");

function count(arr, key) { const c = {}; arr.forEach((r) => { c[r[key]] = (c[r[key]] || 0) + 1; }); return c; }
function f(n) { return faNum(n.toLocaleString("en-US").replace(/,/g, "٬")); }
function pctv(k, n = N) { return (100 * k / n).toFixed(1); }
function pc(k, n = N) { return faNum(pctv(k, n)).replace(".", "٫") + "٪"; }
function np(k, n = N) { return `${f(k)} (${pc(k, n)})`; }
function npi(k, n = N) { return `${f(k)}؛ ${pc(k, n)}`; }
function npEnI(k, n = N) { return `${k}; ${pctv(k, n)}%`; }
function npEn(k, n = N) { return `${k} (${pctv(k, n)}%)`; }

const OCC = count(STUDIES, "occupation"), MOD = count(STUDIES, "delivery"), APP = count(STUDIES, "approach");
const MECH = count(STUDIES, "mechanism"), CMP = count(STUDIES, "comparator"), GUI = count(STUDIES, "human_support");
const INS = count(STUDIES, "burnout_instrument");
const HEALTH = OCC["Nurses"] + OCC["Physicians and physician trainees"] + OCC["Other or mixed healthcare workers"];
const NONHEALTH = OCC["Employees in other sectors or mixed occupations"] + OCC["Teachers and education staff"];
const INS_NAMED = N - (INS["NR"] || 0);
const period = (y) => (y <= 2019 ? "p1" : y <= 2022 ? "p2" : "p3");
const PER = { p1: 0, p2: 0, p3: 0 };
const PERMOD = { p1: {}, p2: {}, p3: {} };
STUDIES.forEach((s) => { const p = period(+s.first_year); PER[p]++; PERMOD[p][s.delivery] = (PERMOD[p][s.delivery] || 0) + 1; });
const pm = (p, m) => PERMOD[p][m] || 0;
const NS = STUDIES.filter((s) => s.n_randomized !== "").map((s) => +s.n_randomized).sort((a, b) => a - b);
function quant(a, q) { const pos = (a.length + 1) * q - 1; const lo = Math.floor(pos); return a[lo] + (pos - lo) * (a[lo + 1] - a[lo]); }
const MED = quant(NS, 0.5), Q1 = quant(NS, 0.25), Q3 = quant(NS, 0.75);
const N_GE200 = NS.filter((x) => x >= 200).length, N_LT100 = NS.filter((x) => x < 100).length;
const N_TOTAL = NS.reduce((a, b) => a + b, 0);
const DBX = count(DB_EXC, "exclusion_criterion");
const RGX = count(REGPUB.filter((p) => p.decision === "excluded"), "exclusion_criterion");
const SRC_INC = count(DB_INC, "source_db");
const SRC_ASSESSED = count(DB, "source_db");
const REG_RAND = REGS.filter((r) => r.allocation === "RANDOMIZED");
const REG_DUE = REG_RAND.filter((r) => r.completion_date < "2024");
const RS = count(REG_DUE, "status");
const R_INC = RS["Results report included in this review"] || 0;
const R_OUT = RS["Results report published outside review scope"] || 0;
const R_NONE = RS["No results report located"] || 0;
if (REGS.length !== 28 || REG_DUE.length !== 15) throw new Error("unexpected registry counts");

const CODE_BURNOUT_NOTE = "MBI: Maslach Burnout Inventory؛ CBI: Copenhagen Burnout Inventory؛ OLBI: Oldenburg Burnout Inventory؛ ProQOL: Professional Quality of Life (زیرمقیاس فرسودگی)؛ SMBQ: Shirom-Melamed Burnout Questionnaire؛ PFI: Stanford Professional Fulfillment Index (زیرمقیاس فرسودگی)؛ BBI: Bergen Burnout Inventory.";

const OCC_FA = {
  "Other or mixed healthcare workers": "سایر کارکنان یا کارکنان ترکیبی نظام سلامت",
  "Nurses": "پرستاران",
  "Physicians and physician trainees": "پزشکان و دستیاران پزشکی",
  "Mental-health and social-care professionals": "متخصصان سلامت روان و مددکاری اجتماعی",
  "Teachers and education staff": "معلمان و کارکنان آموزشی",
  "Employees in other sectors or mixed occupations": "کارکنان سایر بخش‌ها یا مشاغل ترکیبی",
};
const MOD_FA = {
  "Web-based program": "برنامه مبتنی بر وب", "Smartphone app": "اپلیکیشن تلفن هوشمند",
  "Live online sessions": "جلسات زنده برخط (ویدئوکنفرانس/وبینار)", "Blended (digital and in-person)": "ترکیبی (دیجیتال و حضوری)",
  "Text or instant messaging": "پیامک یا پیام‌رسان", "Chatbot": "چت‌بات", "Wearable or motion-sensing platform": "پوشیدنی یا سکوی حس‌گر حرکت",
};
const APP_FA = {
  "Mindfulness or meditation": "ذهن‌آگاهی یا مراقبه", "Other psychological": "سایر رویکردهای روان‌شناختی",
  "Cognitive-behavioural or stress management": "شناختی-رفتاری یا مدیریت استرس", "Psychoeducation or resilience training": "آموزش روانی یا تاب‌آوری",
  "Positive psychology": "روان‌شناسی مثبت", "Non-psychological mechanism": "سازوکار غیرروان‌شناختی",
  "Acceptance and commitment": "پذیرش و تعهد (ACT)", "Compassion-based": "مبتنی بر شفقت", "Coaching": "کوچینگ",
};
const MECH_FA = { "psychological": "روان‌شناختی", "physical activity": "فعالیت بدنی", "feedback or navigation": "بازخورد یا راهنمایی مسیر خدمات", "professional training": "آموزش حرفه‌ای" };
const CMP_FA = {
  "Waitlist or delayed access": "فهرست انتظار یا دسترسی تأخیری", "Active or attention control": "کنترل فعال یا توجه",
  "Usual practice or no intervention": "روال معمول یا بدون مداخله", "Not reported": "گزارش نشده", "Head-to-head digital variants": "مقایسه مستقیم دو نسخه دیجیتال",
};
const GUI_FA = { "Self-guided or automated": "خودراهبر یا خودکار", "Human-supported or facilitated": "با حمایت یا تسهیلگری انسانی", "Not reported": "گزارش نشده" };
function distRows(obj, labels) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => ["    " + (labels ? labels[k] : k), np(v)]);
}
function secRow(t) { return [t, ""]; }

const TITLE_FA = "مداخلات دیجیتال در کارآزمایی‌های تصادفی‌سازی‌شده با پیامد فرسودگی شغلی: مرور دامنه‌ای و نقشه شواهد";
const TITLE_EN = "Randomized Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map";

// ---------------------------------------------------------------------------
// Appendix tables
// ---------------------------------------------------------------------------
const OCC_S = { "Other or mixed healthcare workers": "Healthcare (other/mixed)", "Nurses": "Nurses", "Physicians and physician trainees": "Physicians/trainees",
  "Mental-health and social-care professionals": "Mental-health/social care", "Teachers and education staff": "Teachers/education", "Employees in other sectors or mixed occupations": "Other sectors/mixed" };
const MOD_S = { "Web-based program": "Web", "Smartphone app": "App", "Live online sessions": "Live online", "Blended (digital and in-person)": "Blended",
  "Text or instant messaging": "Messaging", "Chatbot": "Chatbot", "Wearable or motion-sensing platform": "Wearable/motion" };
const APP_S = { "Mindfulness or meditation": "Mindfulness", "Other psychological": "Other psych.", "Cognitive-behavioural or stress management": "CBT/stress mgmt",
  "Psychoeducation or resilience training": "Psychoed./resilience", "Positive psychology": "Positive psych.", "Non-psychological mechanism": "Non-psych.",
  "Acceptance and commitment": "ACT", "Compassion-based": "Compassion", "Coaching": "Coaching" };
const CMP_S = { "Waitlist or delayed access": "Waitlist", "Active or attention control": "Active", "Usual practice or no intervention": "Usual/none",
  "Not reported": "NR", "Head-to-head digital variants": "Head-to-head" };
function short(t, n = 95) { return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; }
const STUDY_ROWS = STUDIES.map((s) => [
  s.study_id, s.reports.replace(/;/g, ", "), s.first_year, short(s.title),
  OCC_S[s.occupation], MOD_S[s.delivery],
  s.approach === "Non-psychological mechanism" ? `Non-psych. (${s.mechanism})` : APP_S[s.approach],
  CMP_S[s.comparator], s.burnout_instrument === "NR" ? "—" : s.burnout_instrument, s.n_randomized || "NR",
]);
const CRIT_LABEL = { REPORT: "Not a primary results report", DESIGN: "Not randomized", POP: "Not a working population", DIGITAL: "Not digitally delivered", BURNOUT: "Burnout not an outcome" };
const ORDER = ["REPORT", "DESIGN", "POP", "DIGITAL", "BURNOUT"];
const EXCL_ROWS = DB_EXC.slice().sort((a, b) => ORDER.indexOf(a.exclusion_criterion) - ORDER.indexOf(b.exclusion_criterion) || a.record_id.localeCompare(b.record_id))
  .map((m) => [m.record_id, m.source_db, m.pub_year, short(m.title, 80), CRIT_LABEL[m.exclusion_criterion], m.exclusion_note]);
const REGPUB_ROWS = REGPUB.slice().sort((a, b) => (a.decision === "included" ? -1 : 0) - (b.decision === "included" ? -1 : 0) || ORDER.indexOf(a.exclusion_criterion) - ORDER.indexOf(b.exclusion_criterion))
  .map((p) => [p.pmid, p.registration, short(p.title, 70), p.decision === "included" ? "Included" : CRIT_LABEL[p.exclusion_criterion], p.note]);
const REG_ROWS = REGS.map((r) => [r.nct_id, short(r.brief_title, 70), r.allocation.replace("_", "-").toLowerCase(), r.completion_date, r.enrollment, r.status, r.note]);
const SRC_ORDER = ["Europe PMC", "OpenAlex", "ERIC", "Web of Science", "Scopus"];
const SRC_NUM = { "Europe PMC": [227, 213, "2026-09-26"], "OpenAlex": [716, 315, "2026-09-26"], "ERIC": [8, 8, "2026-09-26"],
  "Web of Science": [352, 274, "2026-09-27"], "Scopus": [382, 284, "2026-09-27"] };

// ---------------------------------------------------------------------------
// DOCUMENT
// ---------------------------------------------------------------------------
const doc = new Document({
  styles: { default: { document: { run: { font: FA_RTL, size: 22 } } } },
  numbering: { config: [{ reference: "bullet-fa", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.RIGHT }] }] },
  sections: [{
    properties: { page: { size: { width: 11907, height: 16840 } } },
    children: [

      // ---------------- Title page ----------------
      new Paragraph({ spacing: { before: 600, after: 100 }, alignment: AlignmentType.CENTER, children: [en("Scoping Review", { size: 20, color: "898781" })] }),
      new Paragraph({ heading: HeadingLevel.TITLE, bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [fa(TITLE_FA, { bold: true, size: 34 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [en(TITLE_EN, { italics: true, size: 24, color: "52514e" })] }),
      pFa([fa("نویسنده مسئول: ", { bold: true }), fa("[نام و وابستگی سازمانی نویسنده]؛ رایانامه: m.reza.qeta@gmail.com")], { alignment: AlignmentType.CENTER }),
      pFa([fa("عنوان کوتاه: ", { bold: true }), fa("مداخلات دیجیتال و فرسودگی شغلی: نقشه شواهد کارآزمایی‌های تصادفی")], { alignment: AlignmentType.CENTER }),
      pFa([fa("داده و کد: ", { bold: true }), en("https://github.com/fyodora2/5R")], { alignment: AlignmentType.CENTER }),
      hr(),

      // ---------------- Persian abstract ----------------
      h1("چکیده"),
      pFa([fa("زمینه: ", { bold: true }), fa("مداخلات دیجیتال به‌طور فزاینده برای پیشگیری و کاهش فرسودگی شغلی به کار می‌روند، اما تصویر جامعی از کارآزمایی‌های تصادفی‌سازی‌شده این حوزه در همه گروه‌های شغلی وجود ندارد.")]),
      pFa([fa("هدف: ", { bold: true }), fa("نقشه‌برداری از حجم، ویژگی‌ها، روند زمانی و خلأهای شواهدِ کارآزمایی‌های تصادفی‌سازی‌شده‌ای که یک مداخله دیجیتال را در جمعیت شاغل ارزیابی کرده و فرسودگی شغلی را به‌عنوان پیامد گزارش کرده‌اند.")]),
      pFa([fa("روش: ", { bold: true }), fa(`مرور دامنه‌ای مطابق PRISMA-ScR. پنج پایگاه (Europe PMC، OpenAlex، ERIC، Web of Science، Scopus) در ۲۶ و ۲۷ سپتامبر ۲۰۲۶ جست‌وجو و ClinicalTrials.gov برای یافتن گزارش‌های مرتبط با ثبت کارآزمایی‌ها بررسی شد. همه گزارش‌هایی که از غربالگری عنوان/چکیده عبور کردند با پنج معیار صریح (گزارش اصلی نتایج، تصادفی‌سازی، جمعیت شاغل، تحویل دیجیتال، سنجش فرسودگی) ارزیابی شدند؛ گزارش‌های یک کارآزمایی واحد به یک مطالعه پیوند داده شدند و داده‌ها در سطح مطالعه با دسته‌بندی‌های انحصاری استخراج شد.`)]),
      pFa([fa("یافته‌ها: ", { bold: true }), fa(`از ${f(1685)} رکورد شناسایی‌شده، ${f(1094)} رکورد غربالگری و ${f(DB.length + REGPUB.length)} گزارش از نظر واجد شرایط بودن ارزیابی شد. ${f(N_REPORTS)} گزارش از ${f(N)} کارآزمایی تصادفی‌سازی‌شده وارد مرور شد (${f(N_GE200)} کارآزمایی با ۲۰۰ شرکت‌کننده یا بیشتر؛ میانه حجم نمونه ${f(MED)}). ${np(PER.p3)} کارآزمایی نخستین بار در ۲۰۲۳ تا ۲۰۲۶ گزارش شده‌اند. ${np(HEALTH)} کارآزمایی در کارکنان نظام سلامت و تنها ${np(NONHEALTH)} در معلمان و کارکنان سایر بخش‌ها انجام شده بود. برنامه‌های وب (${npi(MOD["Web-based program"])}) و اپلیکیشن‌ها (${npi(MOD["Smartphone app"])}) غالب بودند و جلسات زنده برخط از ${f(pm("p1", "Live online sessions") + pm("p2", "Live online sessions"))} کارآزمایی پیش از ۲۰۲۳ به ${f(pm("p3", "Live online sessions"))} کارآزمایی پس از آن رسید. ذهن‌آگاهی رایج‌ترین رویکرد بود (${npi(APP["Mindfulness or meditation"])}). فهرست انتظار شایع‌ترین گروه مقایسه بود (${npi(CMP["Waitlist or delayed access"])}) و ابزار سنجش فرسودگی تنها در چکیده ${np(INS_NAMED)} کارآزمایی نام برده شده بود. از ${f(REG_DUE.length)} ثبت تصادفی‌سازی‌شده که تا پایان ۲۰۲۳ تکمیل شده بودند، برای ${f(R_NONE)} مورد (${pc(R_NONE, REG_DUE.length)}) هیچ گزارش نتیجه‌ای یافت نشد.`)]),
      pFa([fa("نتیجه‌گیری: ", { bold: true }), fa("شواهد تصادفی‌سازی‌شده مداخلات دیجیتال برای فرسودگی شغلی از ۲۰۲۰ به بعد به‌سرعت رشد کرده، اما در نظام سلامت متمرکز است، بیشتر به مقایسه با فهرست انتظار متکی است و گزارش‌دهی پیامد فرسودگی در آن ناهمگون است. کارآزمایی‌های بزرگ‌تر با کنترل فعال در بخش‌های غیرسلامت، گزارش صریح ابزار فرسودگی، و انتشار نتایج همه کارآزمایی‌های ثبت‌شده اولویت‌های پژوهشی‌اند.")]),
      pFa([fa("کلیدواژه‌ها: ", { bold: true }), fa("فرسودگی شغلی؛ سلامت دیجیتال؛ کارآزمایی تصادفی‌سازی‌شده؛ مرور دامنه‌ای؛ نقشه شواهد؛ سلامت روان شاغلین")]),
      hr(),

      // ---------------- English abstract ----------------
      h1en("Abstract"),
      pEn([en("Background: ", { bold: true }), en("Digital interventions are increasingly used to prevent and reduce occupational burnout, but the randomized evidence across occupational groups has not been mapped.")]),
      pEn([en("Objective: ", { bold: true }), en("To map the volume, characteristics, temporal development and gaps of randomized controlled trials that evaluated a digital intervention in a working population and reported burnout as an outcome.")]),
      pEn([en("Methods: ", { bold: true }), en("Scoping review reported according to PRISMA-ScR. Europe PMC, OpenAlex, ERIC, Web of Science and Scopus were searched on 26-27 September 2026, and ClinicalTrials.gov registrations were linked to their publications. Every report that passed title/abstract screening was assessed against five explicit criteria (primary results report, randomized allocation, working population, digital delivery, burnout outcome). Reports of the same trial were linked into one study, and data were charted at study level using mutually exclusive categories.")]),
      pEn([en("Results: ", { bold: true }), en(`Of 1,685 records identified, 1,094 were screened and ${DB.length + REGPUB.length} reports were assessed for eligibility. We included ${N_REPORTS} reports of ${N} randomized trials (median sample size ${MED}; ${N_GE200} trials with at least 200 participants). ${npEn(PER.p3)} trials were first reported in 2023-2026. ${npEn(HEALTH)} trials were conducted in healthcare workers and only ${npEn(NONHEALTH)} in teachers or employees of other sectors. Web-based programs (${npEnI(MOD["Web-based program"])}) and smartphone apps (${npEnI(MOD["Smartphone app"])}) predominated; live online group sessions, used in only ${pm("p1", "Live online sessions") + pm("p2", "Live online sessions")} trial before 2023, were used in ${pm("p3", "Live online sessions")} trials from 2023 onward. Mindfulness was the most common approach (${npEnI(APP["Mindfulness or meditation"])}). Waitlist was the most frequent comparator (${npEnI(CMP["Waitlist or delayed access"])}), and only ${npEn(INS_NAMED)} abstracts named the burnout instrument. Of ${REG_DUE.length} randomized registrations completed by the end of 2023, ${R_NONE} (${pctv(R_NONE, REG_DUE.length)}%) had no locatable results report.`)]),
      pEn([en("Conclusions: ", { bold: true }), en("Randomized evidence on digital interventions for burnout has grown rapidly since 2020 but is concentrated in healthcare, relies mostly on waitlist comparisons and reports burnout outcomes inconsistently. Larger actively controlled trials outside healthcare, explicit reporting of burnout instruments, and publication of all registered trials are priorities.")]),
      pEn([en("Keywords: ", { bold: true }), en("occupational burnout; digital health; randomized controlled trial; scoping review; evidence map; workforce mental health")]),
      pageBreak(),

      // ---------------- 1. Introduction ----------------
      h1("۱. مقدمه"),
      pFa("فرسودگی شغلی سندرمی ناشی از استرس مزمن محیط کار است که با خستگی هیجانی، فاصله‌گیری ذهنی یا بدبینی نسبت به شغل، و کاهش کارآمدی حرفه‌ای شناخته می‌شود؛ سازمان جهانی بهداشت آن را در ICD-11 به‌عنوان «پدیده شغلی» طبقه‌بندی کرده است (WHO, 2019؛ Maslach & Leiter, 2016). فرسودگی با غیبت از کار، ترک شغل و کاهش کیفیت خدمات همراه است و به همین دلیل مداخلات پیشگیرانه در سطح فرد و سازمان اهمیت یافته‌اند."),
      pFa("مداخلات دیجیتال—برنامه‌های وب، اپلیکیشن‌های تلفن همراه، جلسات برخط، پیام‌رسان‌ها و چت‌بات‌ها—امکان ارائه همزمان مداخله به تعداد زیادی از شاغلین را با هزینه کمتر و انعطاف زمانی بیشتر فراهم می‌کنند. شمار کارآزمایی‌های این حوزه، به‌ویژه پس از همه‌گیری کووید-۱۹، افزایش یافته است؛ اما مرورهای موجود یا به یک حرفه محدودند (برای نمونه پرستاران؛ Yang et al., 2026)، یا کارکنان سلامت را بدون تمرکز بر تحویل دیجیتال بررسی کرده‌اند (Kunzler et al., 2020)، یا پیامدهای استرس و سلامت روان عمومی را به جای فرسودگی هدف گرفته‌اند (Adam et al., 2023؛ Park et al., 2022). در نتیجه معلوم نیست شواهد تصادفی‌سازی‌شده درباره مداخلات دیجیتال با پیامد فرسودگی در کدام گروه‌های شغلی، با کدام شیوه‌های تحویل و رویکردها، و با چه طراحی‌هایی تولید شده است."),
      pFa("مرور دامنه‌ای روش مناسب برای پاسخ به این پرسش‌های نقشه‌برداری است (Arksey & O'Malley, 2005؛ Levac et al., 2010؛ Peters et al., 2020). هدف این مرور، نقشه‌برداری از کارآزمایی‌های تصادفی‌سازی‌شده‌ای بود که یک مداخله دیجیتال را در جمعیت شاغل ارزیابی کرده و فرسودگی شغلی را به‌عنوان پیامد گزارش کرده‌اند. پرسش‌های مرور عبارت بودند از: (۱) این کارآزمایی‌ها در کدام گروه‌های شغلی و در چه دوره‌ای انجام شده‌اند؟ (۲) مداخلات با چه شیوه تحویل، رویکرد و سطح حمایت انسانی ارائه شده‌اند؟ (۳) کارآزمایی‌ها از نظر گروه مقایسه، حجم نمونه و گزارش ابزار فرسودگی چه ویژگی‌هایی دارند؟ (۴) چه سهمی از کارآزمایی‌های ثبت‌شده و تکمیل‌شده نتایج خود را منتشر کرده‌اند؟"),

      // ---------------- 2. Methods ----------------
      h1("۲. روش"),
      h2("۲.۱ طراحی مطالعه"),
      pFa("این مرور دامنه‌ای بر اساس چارچوب Arksey و O'Malley با اصلاحات Levac و همکاران و راهنمای JBI انجام و مطابق بیانیه PRISMA-ScR گزارش شد (Tricco et al., 2018)؛ نمودار جریان از قالب PRISMA 2020 پیروی می‌کند (Page et al., 2021). پروتکل مرور پیش از اجرا ثبت نشد. چک‌لیست PRISMA-ScR در پیوست ه آمده است."),
      h2("۲.۲ معیارهای ورود"),
      pFa("چارچوب جمعیت-مفهوم-بستر و پنج معیار ورود در جدول ۱ آمده است. معیارها به ترتیب ذکرشده اعمال شدند و نخستین معیارِ برآورده‌نشده به‌عنوان دلیل خروج ثبت شد. محدودیت زبانی یا زمانی اعمال نشد."),
      caption("جدول ۱. چارچوب PCC و معیارهای ورود"),
      tableFa(
        ["معیار", "تعریف عملیاتی"],
        [
          ["۱. نوع گزارش (REPORT)", "گزارش اصلی نتایج یک کارآزمایی؛ پروتکل، ثبت کارآزمایی، مرور، تفسیر، پیش‌چاپِ جایگزین‌شده با نسخه داوری‌شده، و تحلیل ثانویه بدون مقایسه تصادفی فرسودگی خارج شدند"],
          ["۲. طراحی (DESIGN)", "تخصیص تصادفی با مقایسه بین‌گروهی (فردی، خوشه‌ای، عاملی، متقاطع یا stepped-wedge)"],
          ["۳. جمعیت (POP)", "شاغلین، شامل کارکنان، متخصصان شاغل و کارآموزان دارای اشتغال (مانند دستیاران پزشکی)؛ دانشجویان، بیماران و نمونه‌های عمومی خارج شدند"],
          ["۴. مفهوم: تحویل دیجیتال (DIGITAL)", "دست‌کم یک مؤلفه اصلی مداخله از طریق وب، اپلیکیشن، ویدئوکنفرانس، پیامک/پیام‌رسان، چت‌بات، واقعیت مجازی، رایانه یا ابزار پوشیدنی ارائه شود؛ تماس تلفنی صوتی به‌تنهایی یا استفاده دیجیتال فقط برای سنجش کافی نبود"],
          ["۵. پیامد (BURNOUT)", "فرسودگی (ابزار فرسودگی یا زیرمقیاس نام‌دار آن، مانند MBI، CBI، OLBI، SMBQ، زیرمقیاس فرسودگی ProQOL یا PFI) به‌عنوان پیامد اصلی یا ثانویه مقایسه تصادفی گزارش شود"],
          ["بستر", "هر کشور و هر محیط کاری؛ بدون محدودیت تاریخ انتشار"],
        ],
        [28, 72]
      ),
      pFa("سازوکار مداخله محدود به رویکردهای روان‌شناختی نبود: مداخلات دیجیتال مبتنی بر فعالیت بدنی، بازخورد یا آموزش حرفه‌ای نیز در صورت برآوردن پنج معیار وارد شدند و در استخراج داده جداگانه برچسب خوردند تا نقشه شواهد هر دو گروه را نشان دهد."),
      h2("۲.۳ منابع اطلاعاتی و راهبرد جست‌وجو"),
      pFa("راهبرد جست‌وجو چهار مفهوم را با AND ترکیب کرد: فرسودگی، تحویل دیجیتال، مداخله روان‌شناختی/رفتاری، و طراحی تصادفی‌سازی‌شده؛ هر مفهوم با مترادف‌های متعدد پوشش داده شد. Europe PMC، OpenAlex و ERIC از طریق API و Web of Science و Scopus از طریق دسترسی نهادی جست‌وجو شدند (جدول ۲؛ عبارت‌ها در پیوست الف). خروجی Scopus فاقد چکیده بود؛ چکیده هر ۲۸۴ رکورد یکتای Scopus از OpenAlex (۲۰۱)، Crossref (۳۸)، ClinicalTrials.gov (۱) و متن کامل یا صفحه ناشر (۴۴) بازیابی شد تا همه رکوردها بر اساس عنوان و چکیده غربالگری شوند."),
      caption("جدول ۲. منابع اطلاعاتی، تاریخ جست‌وجو و جریان رکوردها به تفکیک پایگاه"),
      tableFa(
        ["منبع", "تاریخ جست‌وجو", "رکورد شناسایی‌شده", "رکورد یکتای غربالگری‌شده", "گزارش ارزیابی‌شده", "گزارش واردشده"],
        [
          ...SRC_ORDER.map((s) => [s, faNum(SRC_NUM[s][2]), f(SRC_NUM[s][0]), f(SRC_NUM[s][1]), f(SRC_ASSESSED[s] || 0), f(SRC_INC[s] || 0)]),
          ["ClinicalTrials.gov (پیوند ثبت-انتشار)", faNum("2026-09-28"), `${f(28)} ثبت`, "—", f(REGPUB.length), f(REGPUB.filter((p) => p.decision === "included").length)],
          ["جمع", "", f(1685), f(1094), f(DB.length + REGPUB.length), f(N_REPORTS)],
        ],
        [26, 15, 14, 17, 14, 14]
      ),
      note("رکورد تکراری در سطح هر پایگاه و بین پایگاه‌ها پیش از غربالگری حذف شد؛ هر رکورد یکتا به پایگاهی نسبت داده شده که نخستین بار از آن وارد شده است."),
      h2("۲.۴ انتخاب منابع شواهد"),
      pFa("غربالگری عنوان و چکیده با یک طبقه‌بند قانون‌محور (نوع انتشار، عبارات طراحی مطالعه و اصطلاحات جمعیت شغلی) و بازبینی دستی رکوردهای نامطمئن انجام شد. سپس همه گزارش‌هایی که از غربالگری عبور کردند، بدون استثنا، در برابر پنج معیار جدول ۱ ارزیابی شدند. مبنای ارزیابی چکیده بود؛ هرگاه چکیده برای تصمیم کافی نبود، متن کامل (چهار گزارش) یا رکورد ثبت کارآزمایی (یک گزارش) بررسی شد. دلیل خروج هر گزارش در پیوست ب و فایل master_registry.csv ثبت شده است."),
      pFa("گزارش‌هایی که شماره ثبت مشترک یا نمونه یکسان داشتند به یک مطالعه پیوند داده شدند؛ واحد تحلیل در این مرور «مطالعه» (کارآزمایی) است و گزارش‌ها فقط در نمودار جریان شمارش می‌شوند."),
      pFa("برای برآورد خطای غربالگری، یک نمونه تصادفی طبقه‌بندی‌شده از ۴۵ رکوردِ خارج‌شده در غربالگری (۱۵ مورد Europe PMC و ۱۰ مورد از هر یک از OpenAlex، Web of Science و Scopus؛ seed ثابت) دوباره با معیارهای کامل ارزیابی شد. پیوند ثبت-انتشار (بخش ۲.۶) به‌عنوان یک بررسی مستقل دوم برای یافتن گزارش‌های واجد شرایطِ از دست‌رفته به کار رفت."),
      h2("۲.۵ استخراج داده"),
      pFa("برای هر مطالعه یک برگه استخراج با دسته‌های انحصاری (یک مقدار برای هر متغیر) تکمیل شد: گروه شغلی، شیوه اصلی تحویل، رویکرد مداخله، سازوکار (روان‌شناختی، فعالیت بدنی، بازخورد/راهنمایی مسیر خدمات، آموزش حرفه‌ای)، نوع گروه مقایسه، حمایت انسانی (خودراهبر در برابر تسهیل‌شده)، ابزار فرسودگی نام‌برده‌شده در چکیده، تعداد شرکت‌کنندگان تصادفی‌سازی‌شده، و سال نخستین گزارش. وقتی یک مداخله چند مؤلفه داشت، مؤلفه غالب در توصیف نویسندگان ملاک قرار گرفت؛ مداخلاتی که دو رویکرد را به‌طور برابر ترکیب می‌کردند در دسته «سایر رویکردهای روان‌شناختی» قرار گرفتند. تعاریف کامل دسته‌ها همراه با داده‌های هر مطالعه در study_charting.csv منتشر شده است."),
      h2("۲.۶ پیوند با ثبت کارآزمایی‌ها"),
      pFa("ClinicalTrials.gov (API نسخه ۲) برای ثبت‌های مداخله‌ای تکمیل‌شده با شرط Burnout و دست‌کم یک واژه دیجیتال در عنوان یا شرح مداخله جست‌وجو شد (ثبت‌هایی با جمعیت دانشجو، بیمار یا مراقب خانوادگی کنار گذاشته شدند). برای هر ثبت، انتشارهای مرتبط از دو مسیر یافت شد: ارجاعات ثبت‌شده در خودِ رکورد ثبت (PMID) و جست‌وجوی شماره NCT در Europe PMC. انتشارهایی که پیش‌تر از طریق پایگاه‌ها ارزیابی نشده بودند با همان پنج معیار ارزیابی شدند. برای ثبت‌های تصادفی‌سازی‌شده‌ای که تا پایان ۲۰۲۳ تکمیل شده بودند (دست‌کم ۳۳ ماه پیش از جست‌وجو)، وضعیت انتشار نتایج در یکی از سه دسته طبقه‌بندی شد: گزارش نتایج در این مرور، گزارش نتایج خارج از دامنه مرور، یا عدم یافتن گزارش نتایج."),
      h2("۲.۷ تلخیص و تحلیل"),
      pFa("ویژگی‌های مطالعات با فراوانی و درصد در سطح مطالعه خلاصه شد. روند زمانی بر اساس سال نخستین گزارش هر کارآزمایی و در سه دوره (۲۰۰۹–۲۰۱۹، ۲۰۲۰–۲۰۲۲، ۲۰۲۳–۲۰۲۶) توصیف شد. نقشه شواهد به‌صورت جدول تقاطعی گروه شغلی × رویکرد مداخله ترسیم شد. مطابق هدف مرور دامنه‌ای، ارزیابی خطر سوگیری و ترکیب اندازه اثر انجام نشد."),
      h2("۲.۸ استفاده از ابزار هوش مصنوعی"),
      pFa("غربالگری، ارزیابی واجد شرایط بودن، استخراج داده، پیوند ثبت-انتشار و پیش‌نویس متن با کمک یک عامل نرم‌افزاری مبتنی بر مدل زبانی بزرگ (Claude، شرکت Anthropic) و تحت هدایت نویسنده مسئول انجام شد. همه تصمیم‌ها با دلیل ثبت شده و به همراه کد اجرایی در مخزن داده منتشر شده‌اند؛ مسئولیت محتوا با نویسنده است."),

      // ---------------- 3. Results ----------------
      h1("۳. یافته‌ها"),
      h2("۳.۱ انتخاب منابع شواهد"),
      pFa(`جست‌وجوی پایگاه‌ها ${f(1685)} رکورد به دست داد که پس از حذف ${f(591)} رکورد تکراری یا غیرمقاله‌ای، ${f(1094)} رکورد غربالگری شد (شکل ۱). ${f(DB.length)} گزارش از نظر واجد شرایط بودن ارزیابی شد و ${f(DB_EXC.length)} گزارش خارج شد: ${f(DBX.REPORT)} گزارش اصلی نتایج نبودند (عمدتاً پروتکل یا ثبت کارآزمایی)، ${f(DBX.DESIGN)} تصادفی‌سازی نداشتند، ${f(DBX.POP)} در جمعیت غیرشاغل انجام شده بودند، ${f(DBX.DIGITAL)} تحویل دیجیتال نداشتند و در ${f(DBX.BURNOUT)} مورد فرسودگی پیامد مقایسه تصادفی نبود. از ${f(28)} ثبت تکمیل‌شده در ClinicalTrials.gov، ${f(30)} انتشار مرتبط یافت شد که ${f(9)} مورد آن پیش‌تر از طریق پایگاه‌ها ارزیابی شده بود؛ از ${f(REGPUB.length)} انتشار باقی‌مانده یک گزارش واجد شرایط بود. در مجموع ${f(N_REPORTS)} گزارش از ${f(N)} کارآزمایی وارد شد؛ کارآزمایی WISER با سه گزارش و یک کارآزمایی ذهن‌آگاهی برخط با دو گزارش نمایندگی شده‌اند.`),
      pFa("در نمونه ۴۵تایی رکوردهای خارج‌شده در غربالگری هیچ گزارش واجد شرایطی یافت نشد (۰ از ۴۵؛ فاصله اطمینان ۹۵٪ دقیق Clopper-Pearson: ۰ تا ۷٫۹٪). با این حال، گزارشی که از طریق پیوند ثبت وارد شد (R146، کارآزمایی عاملی تصادفی‌سازی‌شده یک اپلیکیشن مدیریت استرس در کارکنان سلامت) در Europe PMC و OpenAlex بازیابی شده اما در غربالگری عنوان/چکیده حذف شده بود؛ بنابراین حساسیت غربالگری کامل نیست و این مورد از طریق روش دوم جبران شد."),
      ...figure("fig1_prisma_flow.png", "شکل ۱. نمودار جریان PRISMA 2020 برای شناسایی، غربالگری و ورود مطالعات. واحد شمارش تا مرحله ورود «گزارش» و در مرحله نهایی «مطالعه» است.", 560),
      h2("۳.۲ ویژگی‌های کارآزمایی‌های واردشده"),
      pFa(`جدول ۳ ویژگی‌های ${f(N)} کارآزمایی را خلاصه می‌کند و فهرست کامل آن‌ها در پیوست ج آمده است. تعداد شرکت‌کنندگان تصادفی‌سازی‌شده در ${f(NS.length)} کارآزمایی گزارش شده بود (میانه ${f(MED)}، دامنه میان‌چارکی ${f(Q1)} تا ${f(Q3)}، دامنه ${f(NS[0])} تا ${f(NS[NS.length - 1])}؛ مجموع ${f(N_TOTAL)} نفر). ${f(N_LT100)} کارآزمایی کمتر از ۱۰۰ و ${f(N_GE200)} کارآزمایی ۲۰۰ شرکت‌کننده یا بیشتر داشتند.`),
      caption(`جدول ۳. ویژگی‌های کارآزمایی‌های واردشده (n = ${f(N)})`),
      tableFa(
        ["ویژگی", "تعداد (درصد)"],
        [
          secRow("سال نخستین گزارش"),
          ["    ۲۰۰۹–۲۰۱۹", np(PER.p1)], ["    ۲۰۲۰–۲۰۲۲", np(PER.p2)], ["    ۲۰۲۳–۲۰۲۶", np(PER.p3)],
          secRow("گروه شغلی"), ...distRows(OCC, OCC_FA),
          secRow("شیوه اصلی تحویل"), ...distRows(MOD, MOD_FA),
          secRow("رویکرد مداخله"), ...distRows(APP, APP_FA),
          secRow("سازوکار مداخله"), ...distRows(MECH, MECH_FA),
          secRow("گروه مقایسه"), ...distRows(CMP, CMP_FA),
          secRow("حمایت انسانی"), ...distRows(GUI, GUI_FA),
          secRow("ابزار فرسودگی نام‌برده‌شده در چکیده"),
          ...Object.entries(INS).filter(([k]) => k !== "NR").sort((a, b) => b[1] - a[1]).map(([k, v]) => ["    " + k, np(v)]),
          ["    نام برده نشده", np(INS["NR"])],
        ],
        [70, 30]
      ),
      note(CODE_BURNOUT_NOTE),
      h2("۳.۳ روند زمانی"),
      pFa(`تا ۲۰۱۹ هر سال حداکثر پنج کارآزمایی گزارش شده بود و از ۲۰۲۰ به بعد افزایش یافت؛ ${np(PER.p3)} کارآزمایی نخستین بار در ۲۰۲۳ تا سپتامبر ۲۰۲۶ گزارش شده‌اند (شکل ۲). ترکیب شیوه‌های تحویل نیز تغییر کرد: جلسات زنده برخط که پیش از ۲۰۲۰ هیچ کارآزمایی نداشتند، در ۲۰۲۰–۲۰۲۲ در ${f(pm("p2", "Live online sessions"))} و در ۲۰۲۳–۲۰۲۶ در ${f(pm("p3", "Live online sessions"))} کارآزمایی به کار رفتند؛ کارآزمایی‌های اپلیکیشن از ${f(pm("p1", "Smartphone app"))} به ${f(pm("p2", "Smartphone app"))} و سپس ${f(pm("p3", "Smartphone app"))} رسیدند. برنامه‌های وب در هر سه دوره پرتکرارترین شیوه بودند.`),
      ...figure("fig2_temporal_trend.png", "شکل ۲. تعداد کارآزمایی‌ها بر حسب سال نخستین گزارش و شیوه اصلی تحویل (n = ۸۶). داده سال ۲۰۲۶ تا پایان سپتامبر است.", 600),
      h2("۳.۴ نقشه شواهد: گروه شغلی و رویکرد مداخله"),
      pFa(`${np(HEALTH)} کارآزمایی در کارکنان نظام سلامت انجام شده بود (${f(OCC["Nurses"])} پرستاران، ${f(OCC["Physicians and physician trainees"])} پزشکان و دستیاران، ${f(OCC["Other or mixed healthcare workers"])} سایر یا ترکیبی) و ${f(OCC["Mental-health and social-care professionals"])} کارآزمایی دیگر در متخصصان سلامت روان و مددکاری اجتماعی. کارکنان خارج از نظام سلامت و مددکاری—${f(OCC["Teachers and education staff"])} کارآزمایی در معلمان و ${f(OCC["Employees in other sectors or mixed occupations"])} کارآزمایی در کارکنان سایر بخش‌ها یا مشاغل ترکیبی—${pc(NONHEALTH)} شواهد را تشکیل می‌دادند (شکل ۳).`),
      pFa("ذهن‌آگاهی در همه گروه‌های شغلی حضور داشت و بیشترین تراکم را در کارکنان سلامت داشت. کوچینگ فقط در پزشکان و دستیاران (سه کارآزمایی گروهی برخط) ارزیابی شده بود. در معلمان رویکرد شناختی-رفتاری/مدیریت استرس غالب بود. رویکردهای پذیرش و تعهد، شفقت و روان‌شناسی مثبت هر یک در کمتر از ده کارآزمایی و عمدتاً در کارکنان سلامت آزموده شده بودند. نه کارآزمایی سازوکاری غیرروان‌شناختی داشتند: فعالیت بدنی (چهار، از جمله دو ابزار پوشیدنی یا حس‌گر حرکت)، بازخورد یا راهنمایی مسیر خدمات (سه) و آموزش حرفه‌ای (دو)."),
      ...figure("fig3_evidence_map.png", "شکل ۳. نقشه شواهد: تعداد کارآزمایی‌ها در تقاطع گروه شغلی و رویکرد اصلی مداخله (n = ۸۶). اعداد داخل پرانتز جمع سطر یا ستون‌اند؛ نقطه نشانه خانه خالی است.", 600),
      h2("۳.۵ طراحی کارآزمایی‌ها و گزارش پیامد"),
      pFa(`فهرست انتظار یا دسترسی تأخیری شایع‌ترین گروه مقایسه بود (${npi(CMP["Waitlist or delayed access"])}). ${np(CMP["Active or attention control"])} کارآزمایی کنترل فعال یا توجه داشتند، ${np(CMP["Usual practice or no intervention"])} با روال معمول مقایسه شده بودند و ${np(CMP["Head-to-head digital variants"])} دو نسخه دیجیتال را مستقیم مقایسه کرده بودند؛ در ${np(CMP["Not reported"])} کارآزمایی نوع مقایسه در چکیده روشن نبود. مداخلات خودراهبر (${npi(GUI["Self-guided or automated"])}) و مداخلات با حمایت انسانی (${npi(GUI["Human-supported or facilitated"])}) تقریباً هم‌سهم بودند؛ همه مداخلات جلسات زنده برخط تسهیل‌گر انسانی داشتند و تقریباً همه اپلیکیشن‌ها خودراهبر بودند.`),
      pFa(`هرچند فرسودگی شرط ورود بود، تنها ${np(INS_NAMED)} چکیده ابزار سنجش آن را نام برده بودند؛ MBI پرکاربردترین ابزار بود (${f(INS["MBI"])} کارآزمایی) و پس از آن CBI (${f(INS["CBI"])}) و OLBI (${f(INS["OLBI"])}). در بقیه کارآزمایی‌ها فرسودگی در چکیده به‌عنوان پیامد ذکر شده اما ابزار آن مشخص نشده بود.`),
      h2("۳.۶ انتشار نتایج کارآزمایی‌های ثبت‌شده"),
      pFa(`از ${f(28)} ثبت مداخله‌ای تکمیل‌شده، ${f(REG_RAND.length)} ثبت تصادفی‌سازی‌شده بودند و ${f(REG_DUE.length)} مورد آن‌ها تا پایان ۲۰۲۳ تکمیل شده بودند (جدول ۴؛ فهرست کامل در پیوست د). برای ${f(R_INC)} ثبت گزارش نتایج در این مرور وجود داشت، ${f(R_OUT)} ثبت نتایج خود را در جمعیتی خارج از دامنه مرور (نمونه بالینی یا عمومی) منتشر کرده بودند و برای ${f(R_NONE)} ثبت (${pc(R_NONE, REG_DUE.length)}) هیچ گزارش نتیجه‌ای یافت نشد؛ یکی از این شش ثبت تنها پروتکل منتشرشده داشت.`),
      caption("جدول ۴. وضعیت انتشار نتایج ثبت‌های تصادفی‌سازی‌شده تکمیل‌شده تا پایان ۲۰۲۳"),
      tableFa(
        ["وضعیت", "تعداد (درصد)", "شماره ثبت"],
        [
          ["گزارش نتایج در این مرور", np(R_INC, REG_DUE.length), REG_DUE.filter((r) => r.status.startsWith("Results report included")).map((r) => r.nct_id).join("، ")],
          ["گزارش نتایج خارج از دامنه مرور", np(R_OUT, REG_DUE.length), REG_DUE.filter((r) => r.status.startsWith("Results report published outside")).map((r) => r.nct_id).join("، ")],
          ["گزارش نتایج یافت نشد", np(R_NONE, REG_DUE.length), REG_DUE.filter((r) => r.status.startsWith("No results")).map((r) => r.nct_id).join("، ")],
        ],
        [30, 18, 52]
      ),
      note(`${f(REG_RAND.length - REG_DUE.length)} ثبت تصادفی‌سازی‌شده دیگر در ۲۰۲۴ یا پس از آن تکمیل شده‌اند و ${f(28 - REG_RAND.length)} ثبت طراحی غیرتصادفی داشتند؛ این موارد در محاسبه بالا وارد نشدند.`),

      // ---------------- 4. Discussion ----------------
      h1("۴. بحث"),
      h2("۴.۱ یافته‌های اصلی"),
      pFa(`این مرور ${f(N)} کارآزمایی تصادفی‌سازی‌شده مداخلات دیجیتال با پیامد فرسودگی شغلی را شناسایی کرد. چهار الگو شواهد این حوزه را توصیف می‌کند. نخست، رشد سریع: نزدیک به دو سوم کارآزمایی‌ها از ۲۰۲۳ به بعد گزارش شده‌اند و جلسات زنده برخط—که پیش از همه‌گیری کووید-۱۹ غایب بودند—اکنون یکی از سه شیوه اصلی تحویل‌اند. دوم، تمرکز بخشی: حدود دو سوم کارآزمایی‌ها در نظام سلامت انجام شده‌اند، در حالی که معلمان و کارکنان سایر بخش‌ها روی هم کمتر از یک سوم شواهد را تشکیل می‌دهند. سوم، طراحی‌های مقایسه‌ای ضعیف‌تر: بیش از یک سوم کارآزمایی‌ها با فهرست انتظار مقایسه شده‌اند و میانه حجم نمونه ${f(MED)} است. چهارم، گزارش‌دهی ناقص: کمتر از نیمی از چکیده‌ها ابزار فرسودگی را نام برده‌اند و برای دو پنجم ثبت‌های تصادفی‌سازی‌شده تکمیل‌شده تا ۲۰۲۳ هیچ گزارش نتیجه‌ای یافت نشد.`),
      h2("۴.۲ مقایسه با مرورهای پیشین"),
      pFa("جدول ۵ دامنه این مرور را با مرورهای مرتبط مقایسه می‌کند. مرورهای پیشین یا به یک حرفه محدود بوده‌اند و اثربخشی را ترکیب کرده‌اند (Yang et al., 2026)، یا کارکنان سلامت را بدون محدودیت به تحویل دیجیتال پوشش داده‌اند (Kunzler et al., 2020)، یا پیامدهای استرس و سلامت روان را به‌جای فرسودگی هدف گرفته‌اند (Adam et al., 2023؛ Park et al., 2022)، یا به یک رویکرد درمانی واحد محدود بوده‌اند (Lampinen et al., 2026). این مرور با محدودکردن طراحی به کارآزمایی تصادفی و پیامد به فرسودگی، و گشودن جمعیت به همه مشاغل و سازوکار به هر نوع مداخله دیجیتال، مکمل این مرورهاست و نشان می‌دهد تمرکز آن‌ها بر نظام سلامت بازتاب توزیع واقعی شواهد نیز هست."),
      caption("جدول ۵. مقایسه دامنه این مرور با مرورهای مرتبط"),
      tableFa(
        ["مرور", "جمعیت", "مداخله", "پیامد", "طراحی مطالعات", "نوع ترکیب"],
        [
          ["این مرور", "همه مشاغل", "هر مداخله دیجیتال", "فرسودگی", "فقط کارآزمایی تصادفی", "نقشه شواهد"],
          ["Yang et al., 2026", "پرستاران", "سلامت دیجیتال", "فرسودگی", "تصادفی و شبه‌تجربی", "مرور نظام‌مند و فراتحلیل"],
          ["Adam et al., 2023", "پرستاران و پزشکان", "مبتنی بر ابزار دیجیتال", "استرس و پیشگیری از فرسودگی", "بدون محدودیت", "مرور دامنه‌ای"],
          ["Kunzler et al., 2020", "کارکنان سلامت", "روان‌شناختی (حضوری یا دیجیتال)", "تاب‌آوری و سلامت روان", "فقط کارآزمایی تصادفی", "مرور کاکرین و فراتحلیل"],
          ["Park et al., 2022", "پرستاران", "سلامت الکترونیک", "سلامت روان", "مطالعات مداخله‌ای", "مرور نظام‌مند"],
          ["Lampinen et al., 2026", "شاغلین", "ACT برخط", "افسردگی، فرسودگی، اضطراب، استرس", "مطالعات مداخله‌ای", "مرور روایی نظام‌مند"],
        ],
        [18, 14, 18, 18, 16, 16]
      ),
      h2("۴.۳ پیامدها برای پژوهش و عمل"),
      ...bulletsFa([
        "بخش‌های غیرسلامت: کارآزمایی‌های کافی در معلمان، کارکنان صنعت، خدمات و اداری وجود ندارد؛ نتایج مداخلات آزموده‌شده در کارکنان سلامت را نمی‌توان بدون آزمون به این گروه‌ها تعمیم داد.",
        "طراحی: جایگزینی فهرست انتظار با کنترل فعال یا مقایسه مستقیم، افزایش حجم نمونه و پیگیری طولانی‌تر برای تمایز اثر اختصاصی مداخله از اثر توجه و انتظار ضروری است.",
        "گزارش‌دهی: نام ابزار فرسودگی، زیرمقیاس‌ها و جایگاه آن (پیامد اصلی یا ثانویه) باید در چکیده گزارش شود تا شواهد قابل شناسایی و ترکیب باشند.",
        "شفافیت: ثبت پیش‌از‌اجرا و انتشار نتایج همه کارآزمایی‌های تکمیل‌شده، از جمله نتایج منفی، برای جلوگیری از تصویر خوش‌بینانه اثربخشی لازم است.",
        "رویکردهای نوظهور: مداخلات گروهی برخط، کوچینگ، چت‌بات‌ها و مداخلات سطح سازمانی با تحویل دیجیتال شواهد اندکی دارند و نیازمند کارآزمایی‌های تأییدی‌اند.",
      ]),
      h2("۴.۴ نقاط قوت و محدودیت‌ها"),
      pFa("نقاط قوت این مرور عبارت‌اند از: جست‌وجو در پنج پایگاه شامل دو منبع باز با پوشش گسترده؛ ارزیابی همه گزارش‌های عبورکرده از غربالگری با معیارهای صریح و ثبت دلیل هر تصمیم؛ پیوند گزارش‌ها به مطالعه و تحلیل در سطح مطالعه؛ استفاده از ثبت کارآزمایی‌ها هم برای یافتن گزارش‌های از دست‌رفته و هم برای سنجش انتشار نتایج؛ و انتشار کامل داده و کد برای بازتولید."),
      pFa("محدودیت‌ها به این شرح‌اند. (۱) انتخاب منابع و استخراج داده توسط یک بازبین و با کمک ابزار هوش مصنوعی انجام شد و بازبین دوم مستقل وجود نداشت؛ خطای غربالگری با نمونه‌گیری تصادفی برآورد شد، نه با توافق دو بازبین. (۲) تصمیم‌های ورود و استخراج داده عمدتاً بر اساس چکیده بود؛ برخی ویژگی‌ها (مانند گروه مقایسه و ابزار فرسودگی) ممکن است در متن کامل مشخص‌تر باشند. (۳) PsycINFO، Embase و Cochrane CENTRAL جست‌وجو نشدند و ردیابی ارجاعات انجام نشد؛ یک گزارش واجد شرایط که در غربالگری از دست رفته بود از طریق پیوند ثبت بازیابی شد، که نشان می‌دهد ممکن است چند کارآزمایی دیگر شناسایی نشده باشند. (۴) عبارت دقیق جست‌وجو در رابط وب Web of Science و Scopus ذخیره نشد و فقط ساختار مفهومی آن گزارش شده است. (۵) بررسی انتشار نتایج فقط به ClinicalTrials.gov محدود بود و «یافت‌نشدن» به معنای «منتشرنشدن» نیست. (۶) هر مطالعه در هر متغیر فقط یک دسته دریافت کرد، که مداخلات چندمؤلفه‌ای را ساده می‌کند. (۷) پروتکل مرور از پیش ثبت نشده بود. (۸) داده‌های ۲۰۲۶ ناقص‌اند."),

      // ---------------- 5. Conclusion ----------------
      h1("۵. نتیجه‌گیری"),
      pFa(`${f(N)} کارآزمایی تصادفی‌سازی‌شده اثر مداخلات دیجیتال را بر فرسودگی شغلی بررسی کرده‌اند و این شواهد به‌سرعت در حال رشد است. با این حال، تمرکز بر کارکنان نظام سلامت، اتکا به مقایسه با فهرست انتظار، نمونه‌های کوچک، گزارش‌دهی ناقص ابزار فرسودگی و نتایج منتشرنشده بخشی از کارآزمایی‌های ثبت‌شده، ظرفیت این شواهد را برای راهنمایی سیاست‌گذاری سازمانی محدود می‌کند. نقشه شواهد این مرور نشان می‌دهد کارآزمایی‌های آینده باید به بخش‌های غیرسلامت، کنترل‌های فعال و گزارش‌دهی شفاف پیامد اولویت دهند.`),

      // ---------------- Declarations ----------------
      h2("تأمین مالی"),
      pFa("این پژوهش هیچ حمایت مالی دریافت نکرده است."),
      h2("تعارض منافع"),
      pFa("نویسنده تعارض منافعی اعلام نمی‌کند."),
      h2("ملاحظات اخلاقی"),
      pFa("این مطالعه مرور داده‌های منتشرشده است و به تأیید کمیته اخلاق نیاز نداشت."),
      h2("در دسترس بودن داده و کد"),
      pFa([fa("داده‌های تکمیلی و کد در "), en("https://github.com/fyodora2/5R"), fa(" منتشر شده‌اند: master_registry.csv (همه ۱۴۸ گزارش ارزیابی‌شده با تصمیم و دلیل)، study_charting.csv (برگه استخراج ۸۶ مطالعه)، registry_linkage.csv و registry_linked_publications.csv (پیوند ثبت-انتشار)، included_reports.json، و اسکریپت‌های پوشه scripts. چکیده رکوردهای Web of Science و Scopus به دلیل شرایط استفاده این پایگاه‌ها منتشر نشده است.")]),

      // ---------------- References ----------------
      h1("منابع"),
      ...[
        "Adam D, Berschick J, Schiele JK, Bogdanski M, Schröter M, Steinmetz M, et al. Interventions to reduce stress and prevent burnout in healthcare professionals supported by digital applications: a scoping review. Front Public Health. 2023;11:1231266. doi:10.3389/fpubh.2023.1231266",
        "Arksey H, O'Malley L. Scoping studies: towards a methodological framework. Int J Soc Res Methodol. 2005;8(1):19-32. doi:10.1080/1364557032000119616",
        "Kunzler AM, Helmreich I, Chmitorz A, König J, Binder H, Wessa M, Lieb K. Psychological interventions to foster resilience in healthcare professionals. Cochrane Database Syst Rev. 2020;7:CD012527. doi:10.1002/14651858.CD012527.pub2",
        "Lampinen VS, Kämper E, Balla VR, Katajavuori N, Asikainen H. The effectiveness of online acceptance and commitment therapy-based interventions on depression, burnout, anxiety and stress in occupational contexts: a systematic narrative review. Internet Interv. 2026. doi:10.1016/j.invent.2026.100909",
        "Levac D, Colquhoun H, O'Brien KK. Scoping studies: advancing the methodology. Implement Sci. 2010;5:69. doi:10.1186/1748-5908-5-69",
        "Maslach C, Leiter MP. Understanding the burnout experience: recent research and its implications for psychiatry. World Psychiatry. 2016;15(2):103-111. doi:10.1002/wps.20311",
        "Page MJ, McKenzie JE, Bossuyt PM, Boutron I, Hoffmann TC, Mulrow CD, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71. doi:10.1136/bmj.n71",
        "Park JH, Jung SE, Ha DJ, Lee B, Kim MS, Sim KL, et al. E-healthcare interventions for nurse mental health: a systematic review. Medicine (Baltimore). 2022;101(28):e29125. doi:10.1097/MD.0000000000029125",
        "Peters MDJ, Godfrey C, McInerney P, Munn Z, Tricco AC, Khalil H. Chapter 11: Scoping reviews. In: Aromataris E, Munn Z, editors. JBI Manual for Evidence Synthesis. JBI; 2020. doi:10.46658/JBIMES-20-12",
        "Tricco AC, Lillie E, Zarin W, O'Brien KK, Colquhoun H, Levac D, et al. PRISMA Extension for Scoping Reviews (PRISMA-ScR): checklist and explanation. Ann Intern Med. 2018;169(7):467-473. doi:10.7326/M18-0850",
        "World Health Organization. Burn-out an \"occupational phenomenon\": International Classification of Diseases. Geneva: WHO; 28 May 2019.",
        "Yang Y, Wen J, Wan H, Yang Q, Guan J, Min L, et al. Digital health interventions for reducing occupational burnout in nurses: a systematic review and meta-analysis. Front Public Health. 2026;14:1879258. doi:10.3389/fpubh.2026.1879258",
      ].map((r) => pEn(r, { spacing: { after: 100, line: 260 } })),
      pageBreak(),

      // ---------------- Appendices ----------------
      h1("پیوست الف. عبارت‌های جست‌وجو"),
      tableEn(
        ["Source", "Field", "Search"],
        [
          ["Europe PMC", "TITLE_ABS", "(burnout OR \"burn-out\") AND (digital OR online OR internet OR \"web-based\" OR app OR \"mobile app\" OR smartphone OR ehealth OR mhealth OR telehealth OR \"computer-based\" OR chatbot OR \"conversational agent\" OR \"virtual reality\" OR videoconferenc*) AND (psycholog* OR CBT OR mindfulness OR MBSR OR MBCT OR \"acceptance and commitment\" OR \"self-compassion\" OR \"stress management\" OR \"emotion regulation\" OR \"positive psychology\" OR coaching OR psychoeducation* OR \"behavioral activation\" OR resilience OR relaxation OR biofeedback) AND (randomi* OR RCT OR \"controlled trial\" OR \"clinical trial\")"],
          ["OpenAlex", "title_and_abstract.search", "The same four concept blocks as Europe PMC in OpenAlex boolean syntax (truncated terms replaced by their word forms)"],
          ["ERIC", "all fields", "(burnout) AND (digital OR online OR internet OR \"app-based\" OR \"mobile app\" OR \"web-based\" OR ehealth OR mhealth OR telehealth OR \"computer-based\" OR chatbot OR \"virtual reality\" OR \"delivered virtually\" OR \"smartphone app\") AND (psycholog* OR CBT OR mindfulness OR ACT OR \"self-compassion\" OR \"stress management\" OR coaching OR psychoeducation OR resilience OR \"emotion regulation\") AND (randomi* OR RCT OR \"controlled trial\")"],
          ["Web of Science", "Topic (TS)", "The same four concept blocks (burnout AND digital delivery AND psychological/behavioural intervention AND randomized design); the verbatim interface string was not saved"],
          ["Scopus", "TITLE-ABS-KEY", "As for Web of Science"],
          ["ClinicalTrials.gov", "API v2", "conditions contain \"burnout\"; study type INTERVENTIONAL; status COMPLETED; ≥1 of {app, online, web-based, internet, digital, smartphone, mobile, tele, virtual reality, VR, chatbot, ehealth, mhealth, technology} in title or intervention; titles naming students, patients, caregivers, parents or children excluded"],
        ],
        [15, 17, 68]
      ),
      pageBreak(),
      h1("پیوست ب. گزارش‌های خارج‌شده و دلیل خروج"),
      pFa(`ب-۱. گزارش‌های پایگاه‌ها که در مرحله ارزیابی واجد شرایط بودن خارج شدند (n = ${f(DB_EXC.length)}).`),
      tableEn(["ID", "Source", "Year", "Title", "Criterion", "Reason"], EXCL_ROWS, [7, 11, 6, 36, 14, 26], 14),
      pFa(`ب-۲. انتشارهای مرتبط با ثبت کارآزمایی که از طریق پایگاه‌ها ارزیابی نشده بودند (n = ${f(REGPUB.length)}).`, { spacing: { before: 300, after: 160 } }),
      tableEn(["PMID", "Registration", "Title", "Decision", "Reason"], REGPUB_ROWS, [11, 14, 38, 16, 21], 14),
      pageBreak(),
      h1("پیوست ج. کارآزمایی‌های واردشده"),
      tableEn(["Study", "Reports", "Year", "Title", "Occupation", "Delivery", "Approach", "Comparator", "Burnout measure", "n"], STUDY_ROWS, [6, 8, 5, 33, 10, 8, 10, 8, 6, 6], 13),
      note("Burnout measure = instrument named in the abstract (— not named). n = participants randomized (NR = not reported). Full bibliographic details and DOIs are in study_charting.csv."),
      pageBreak(),
      h1("پیوست د. ثبت‌های تکمیل‌شده در ClinicalTrials.gov"),
      tableEn(["Registration", "Title", "Allocation", "Completion", "Enrolled", "Status", "Note"], REG_ROWS, [11, 27, 10, 9, 7, 16, 20], 13),
      pageBreak(),
      h1("پیوست ه. چک‌لیست PRISMA-ScR"),
      tableFa(
        ["#", "مورد", "محل گزارش"],
        [
          ["۱", "Title", "صفحه عنوان"],
          ["۲", "Structured summary", "چکیده فارسی و انگلیسی"],
          ["۳", "Rationale", "بخش ۱"],
          ["۴", "Objectives", "بخش ۱ (پاراگراف پایانی)"],
          ["۵", "Protocol and registration", "بخش ۲.۱"],
          ["۶", "Eligibility criteria", "بخش ۲.۲، جدول ۱"],
          ["۷", "Information sources", "بخش ۲.۳، جدول ۲"],
          ["۸", "Search", "پیوست الف"],
          ["۹", "Selection of sources of evidence", "بخش ۲.۴"],
          ["۱۰", "Data charting process", "بخش ۲.۵ و ۲.۸"],
          ["۱۱", "Data items", "بخش ۲.۵"],
          ["۱۲", "Critical appraisal of individual sources (optional)", "انجام نشد؛ بخش ۲.۷"],
          ["۱۳", "Synthesis of results", "بخش ۲.۷"],
          ["۱۴", "Selection of sources of evidence (results)", "بخش ۳.۱، شکل ۱، پیوست ب"],
          ["۱۵", "Characteristics of sources of evidence", "بخش ۳.۲، جدول ۳، پیوست ج"],
          ["۱۶", "Critical appraisal within sources (optional)", "انجام نشد"],
          ["۱۷", "Results of individual sources of evidence", "پیوست ج و study_charting.csv"],
          ["۱۸", "Synthesis of results", "بخش‌های ۳.۲ تا ۳.۶، شکل‌های ۲ و ۳، جدول ۴"],
          ["۱۹", "Summary of evidence", "بخش ۴.۱"],
          ["۲۰", "Limitations", "بخش ۴.۴"],
          ["۲۱", "Conclusions", "بخش ۵"],
          ["۲۲", "Funding", "بخش تأمین مالی"],
        ],
        [8, 52, 40]
      ),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "burnout_scoping_review_paper.docx");
  fs.writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes", "| studies", N, "| reports", N_REPORTS);
});
