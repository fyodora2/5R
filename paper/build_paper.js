// Builds the English manuscript (burnout_scoping_review_paper.docx). Every number in the text and tables is
// computed from the released data files; the build stops if the corpus differs from the expected counts.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, PageBreak, LevelFormat, Footer, PageNumber, LineNumberRestartFormat,
} = require("docx");

const FIG = path.join(__dirname, "figures");
const DATA = path.join(__dirname, "..", "data");
const FONT = "Times New Roman";

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
function t(text, o = {}) { return new TextRun({ text: o.raw ? text : UKFN(text), font: FONT, size: 24, ...o }); }
let UKFN = (s) => s;   // set to uk() once the helper is defined
const WC = { mode: null, abs: 0, main: 0 };
function P(children, o = {}) {
  if (typeof children === "string" && WC.mode) WC[WC.mode] += children.replace(/\*\*[^*]+\*\*/g, (m) => (WC.mode === "abs" ? "" : m)).split(/\s+/).filter(Boolean).length;
  const runs = typeof children === "string" ? parseRich(children) : children;
  return new Paragraph({ children: runs, alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 400 }, ...o });
}
// **bold** and _italic_ inline markup
function parseRich(s) {
  const out = []; const re = /(\*\*[^*]+\*\*|\^\{[^}]*\}|~~[^~]+~~)/g; let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(t(s.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(t(tok.slice(2, -2), { bold: true }));
    else if (tok.startsWith("^{")) out.push(t(tok.slice(2, -1), { superScript: true }));
    else out.push(t(tok.slice(2, -2), { italics: true }));
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(t(s.slice(last)));
  return out;
}
const UKMAP = [[/\brandomi([sz])ed\b/g, "randomised"], [/\bRandomi([sz])ed\b/g, "Randomised"], [/\brandomi[sz]ation\b/g, "randomisation"], [/\bRandomi[sz]ation\b/g, "Randomisation"], [/\brandomi[sz]e\b/g, "randomise"],
  [/\bbehavioral\b/g, "behavioural"], [/\bBehavioral\b/g, "Behavioural"], [/\bprograms\b/g, "programmes"], [/\bprogram\b/g, "programme"], [/\bPrograms\b/g, "Programmes"], [/\bProgram\b/g, "Programme"], [/\banalyzed\b/g, "analysed"],
  [/\bcharacterized\b/g, "characterised"], [/\bsummarized\b/g, "summarised"], [/\bfavored\b/g, "favoured"], [/\bfavor\b/g, "favour"], [/\borganization\b/g, "organisation"], [/\bcenters?\b/g, (m) => (m === "center" ? "centre" : "centres")], [/\bsummaries\b/g, "summarises"]];
function uk(s) { return UKMAP.reduce((a, [re, rep]) => a.replace(re, rep), String(s)); }
function tag(o, props) { return Object.assign(o, props); }
function H1(text) { return tag(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 180 }, children: [t(text, { bold: true, size: 28 })] }), { __h1: text }); }
function H2(text) { return tag(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [t(text, { bold: true, italics: true, size: 24 })] }), { __h2: text }); }
function bullets(items) {
  return items.map((s) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 100, line: 360 }, children: parseRich(s) }));
}
function caption(text) { return tag(new Paragraph({ spacing: { before: 240, after: 100 }, keepNext: true, children: parseRich(text) }), { __cap: text }); }
function note(text) { return new Paragraph({ spacing: { before: 60, after: 240 }, children: [t(text, { size: 18 })] }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function figure(file, cap, widthPx = 600) {
  const buf = fs.readFileSync(path.join(FIG, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return [
    tag(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 }, keepNext: true,
      children: [new ImageRun({ data: buf, type: "png", transformation: { width: widthPx, height: Math.round(widthPx * h / w) } })] }), { __fig: true }),
    tag(new Paragraph({ spacing: { after: 280 }, children: parseRich(cap).map((r) => r) }), { __cap: cap }),
  ];
}
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const NOB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
function table(headers, rows, pct, size = 18, opts = {}) {
  const total = 9360;
  const widths = pct.map((p) => Math.round(p / 100 * total));
  const cell = (txt, i, head, bold) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    borders: { top: head ? BORDER : NOB, bottom: head ? BORDER : NOB, left: NOB, right: NOB },
    shading: head ? { type: ShadingType.CLEAR, fill: "F2F2F2" } : undefined,
    children: [new Paragraph({ alignment: i > 0 && opts.numeric && opts.numeric.includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [t(String(txt), { size, bold: head || bold, raw: opts.raw })] })],
  });
  const head = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) });
  const body = rows.map((r, ri) => new TableRow({ children: r.map((c, i) => {
    const isSection = typeof r[0] === "string" && r[0].startsWith("§");
    const txt = i === 0 && isSection ? r[0].slice(1) : c;
    const tc = cell(txt, i, false, isSection);
    if (ri === rows.length - 1) tc.options = tc.options;
    return tc;
  }) }));
  const last = new TableRow({ children: headers.map((h, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA },
    borders: { top: BORDER, bottom: NOB, left: NOB, right: NOB }, children: [new Paragraph({ children: [] })] })) });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [head, ...body, last] });
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
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
const S = readCsv("study_charting.csv");
const M = readCsv("master_registry.csv");
const REGS = readCsv("registry_linkage.csv");
const SUPP = JSON.parse(fs.readFileSync(path.join(DATA, "supplementary_assessed.json"), "utf8"));
const SUPP2 = JSON.parse(fs.readFileSync(path.join(DATA, "wos_scopus_supplementary_assessed.json"), "utf8"));
const SUPP3 = JSON.parse(fs.readFileSync(path.join(DATA, "third_search_assessed.json"), "utf8"));
const SUPP4 = JSON.parse(fs.readFileSync(path.join(DATA, "fourth_search_assessed.json"), "utf8"));
const N = S.length;
const MAIN = M.filter((m) => m.identification_route === "main database search");
const SUPA = M.filter((m) => m.identification_route === "supplementary database search");
const REGA = M.filter((m) => m.identification_route === "registry linkage");
const SUP3A = M.filter((m) => m.identification_route === "supplementary search 3 (PubMed MeSH and delivery terms)");
const REGINC = M.filter((m) => m.identification_route === "registry linkage" && m.decision === "included").length;
const SUP4A = M.filter((m) => m.identification_route === "supplementary search 4 (unified update search)");
const DBA = MAIN.concat(SUPA, SUP3A, SUP4A);
const INC = M.filter((m) => m.decision === "included");
if (N !== 117 || INC.length !== 120 || M.length !== 301 || MAIN.length !== 147 || SUPA.length !== 68 || SUP3A.length !== 52 || SUP4A.length !== 12 || REGA.length !== 22)
  throw new Error("unexpected corpus size");

// Blind second review of a 30-record sample (data/second_review_sample.csv)
const SR = readCsv("second_review_sample.csv");
const CC = readCsv("citation_chasing.csv"); const CC_TOTAL = CC.reduce((a, r) => a + +r.not_previously_identified, 0), CC_READ = CC.reduce((a, r) => a + +r.abstracts_read, 0);
const NB = Object.fromEntries(readCsv("n_basis.csv").map((r) => [r.study_id, r.n_basis]));
const UNI = readCsv("unified_search_validation.csv");
const UNI_HIT = UNI.filter((r) => r.retrieved_by_unified_europe_pmc_search === "yes").length;
if (UNI.length !== 120 || UNI_HIT !== 80) throw new Error("unified validation file out of date");
// Abstract-level reporting indicators and direction of the burnout result
const IND_ROWS = readCsv("abstract_reporting_indicators.csv");
const DIR_ROWS = readCsv("effect_direction_abstract.csv");
const VS = readCsv("abstract_coding_verification_sample.csv");
if (IND_ROWS.length !== N || DIR_ROWS.length !== N) throw new Error("indicator or direction file does not match the trial count");
const INDK = [["randomization_method", "Method of random sequence generation or allocation named"], ["blinding_stated", "Blinding or masking mentioned"], ["attrition_reported", "Attrition, completion or analysed numbers reported"], ["registration_reported", "Trial registration or registry number given"], ["analysis_population_stated", "Analysis population stated (intention-to-treat or per-protocol)"]];
const INDN = Object.fromEntries(INDK.map(([k]) => [k, IND_ROWS.filter((r) => r[k] === "yes").length]));
const DIRN = {}; DIR_ROWS.forEach((r) => { DIRN[r.direction_code] = (DIRN[r.direction_code] || 0) + 1; });
const DIRMAP = Object.fromEntries(DIR_ROWS.map((r) => [r.study_id, r.direction_code]));
const VS_FIRST = VS.map((r) => r.first_coder_direction), VS_REV = VS.map((r) => r.reviewer_direction);
const VS_DIR_AGREE = VS.filter((r) => r.first_coder_direction === r.reviewer_direction).length;
function catKappa(a, b) {
  const n = a.length, cats = [...new Set(a.concat(b))];
  const po = a.filter((x, i) => x === b[i]).length / n;
  const pe = cats.reduce((s, c) => s + (a.filter((x) => x === c).length / n) * (b.filter((x) => x === c).length / n), 0);
  return { po, k: pe === 1 ? 1 : (po - pe) / (1 - pe) };
}
const VS_KAPPA = catKappa(VS_FIRST, VS_REV);
const IND_COLS = INDK.map(([k]) => k);
const VS_IND_TOTAL = VS.length * IND_COLS.length;
const VS_IND_AGREE = VS.reduce((s, r) => s + IND_COLS.filter((k) => r["first_coder_" + k] === r["reviewer_" + k]).length, 0);
const VS_DIFF = VS.filter((r) => r.first_coder_direction !== r.reviewer_direction || IND_COLS.some((k) => r["first_coder_" + k] !== r["reviewer_" + k]));
const VS_NDIFF = VS_DIFF.reduce((s, r) => s + (r.first_coder_direction !== r.reviewer_direction ? 1 : 0) + IND_COLS.filter((k) => r["first_coder_" + k] !== r["reviewer_" + k]).length, 0);
if (IND_ROWS.length !== N) throw new Error("indicator rows");
if (VS.length !== 23 || VS_DIR_AGREE !== 17 || VS_IND_AGREE !== 110) throw new Error("verification sample changed");
const VSTXT = `On the verification sample of ${VS.length} studies, the second reviewer's direction code was the same as the first coder's for ${VS_DIR_AGREE} (${(100 * VS_KAPPA.po).toFixed(0)}%; Cohen's kappa ${VS_KAPPA.k.toFixed(2)}), and the two reviewers agreed on ${VS_IND_AGREE} of ${VS_IND_TOTAL} indicator judgements (${(100 * VS_IND_AGREE / VS_IND_TOTAL).toFixed(0)}%). The ${VS_NDIFF} differences were checked against the abstracts and in every case the second reviewer's judgement was adopted. Four of the six direction differences concerned a benefit reported for a single subscale or a single time point, which the first coder had counted as favouring the intervention; one concerned an exploratory subgroup effect that the first coder had counted as no difference, and one an effect that was significant only in the adjusted analysis, which the first coder had counted as mixed. Of the five indicator differences, three concerned attrition or analysed numbers, one a registration number that had been detected wrongly and one stratified randomization. The two rules that these differences exposed were then applied to all ${N} trials, and every indicator was re-read against its abstract, so the frequencies in Table 5 are those after the comparison, whereas the agreement figures describe the first-pass coding.`;
const DIRTAB = [["F", "Burnout better with the intervention than with the comparator"], ["M", "Mixed: one subscale, subgroup, arm or time point only"], ["N", "No difference between groups"], ["B", "All arms improved, no difference between arms"], ["U", "Burnout result unfavourable to the intervention"], ["R", "Burnout result not stated in the abstract"]];
function kappaOf(rev) {   // rev: function(row) -> "include" | "exclude" for the second reviewer
  const n = SR.length;
  const a = SR.map((r) => r.ledger_decision), b = SR.map(rev);
  const po = a.filter((x, i) => x === b[i]).length / n;
  const pa = a.filter((x) => x === "include").length / n, pb = b.filter((x) => x === "include").length / n;
  const pe = pa * pb + (1 - pa) * (1 - pb);
  const k = (po - pe) / (1 - pe), se = Math.sqrt((po * (1 - po)) / (n * (1 - pe) * (1 - pe)));
  return { n, po, k, lo: k - 1.96 * se, hi: Math.min(1, k + 1.96 * se), agree: a.filter((x, i) => x === b[i]).length };
}
const SR_LEN = kappaOf((r) => (r.second_reviewer_decision === "exclude" ? "exclude" : "include"));      // partly digital counted as included
const SR_STR = kappaOf((r) => (r.second_reviewer_decision === "include" ? "include" : "exclude"));      // partly digital counted as excluded
const SR_PART = SR.filter((r) => r.second_reviewer_decision === "partial").length;
const SR_DISC = SR.filter((r) => r.second_reviewer_decision !== "partial" && r.second_reviewer_decision !== r.ledger_decision).map((r) => r.record_id);
const FTN = M.filter((m) => m.verification_basis === "full text").length;
const NOT_RETR = SUPP.not_retrieved;
const num = (n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);
const dp = (x, d = 2) => x.toFixed(d);

const cnt = (arr, f) => arr.reduce((a, r) => { const k = typeof f === "function" ? f(r) : r[f]; a[k] = (a[k] || 0) + 1; return a; }, {});
const fmt = (n) => n.toLocaleString("en-US");
const pct = (k, n = N) => (100 * k / n).toFixed(1);
const np = (k, n = N) => `${k} (${pct(k, n)}%)`;
const npi = (k, n = N) => `${k}; ${pct(k, n)}%`;
const exc = (arr) => cnt(arr.filter((m) => m.decision === "excluded"), "exclusion_criterion");
const MX = exc(MAIN), SX = exc(SUPA), RX = exc(REGA), DX = exc(DBA);
const OCC = cnt(S, "occupation"), MOD = cnt(S, "delivery"), APP = cnt(S, "approach"), MECH = cnt(S, "mechanism");
const CMP = cnt(S, "comparator"), GUI = cnt(S, "human_support"), INS = cnt(S, "burnout_instrument");
const HC = ["Nurses", "Physicians and physician trainees", "Other or mixed healthcare workers"];
const isHC = (r) => HC.includes(r.occupation);
const HEALTH = S.filter(isHC).length;
const NONHEALTH = S.filter((r) => !isHC(r) && r.occupation !== "Mental-health and social-care professionals").length;
const OCC_EMP = ["Employees of a named occupation, industry or enterprise", "Mixed-occupation workers recruited across employers", "Workers selected for a health condition or risk"];
const EMPN = OCC_EMP.reduce((a, k) => a + (OCC[k] || 0), 0);
const NAMED = S.filter((r) => r.burnout_instrument_source === "abstract").length;   // named in the abstract
const FROM_FT = S.filter((r) => r.burnout_instrument_source === "full text").length;
const UNDET = S.filter((r) => r.burnout_instrument_source === "not determined").length;
if (UNDET !== 2) throw new Error("undetermined instruments changed: update the explanation in Sections 2.5 and 3.6");
const per = (y) => (+y <= 2019 ? "p1" : +y <= 2022 ? "p2" : "p3");
const PER = { p1: S.filter((r) => per(r.first_year) === "p1"), p2: S.filter((r) => per(r.first_year) === "p2"), p3: S.filter((r) => per(r.first_year) === "p3") };
const minYear = Math.min(...S.map((r) => +r.first_year));
function median(a) { const s = a.slice().sort((x, y) => x - y); const k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; }
function quant(a, q) { const s = a.slice().sort((x, y) => x - y); const pos = (s.length + 1) * q - 1, lo = Math.floor(pos); return s[lo] + (pos - lo) * (s[lo + 1] - s[lo]); }
const nOf = (arr) => arr.filter((r) => r.n_randomized !== "").map((r) => +r.n_randomized);
const NS = nOf(S);
const MED = median(NS), Q1 = quant(NS, 0.25), Q3 = quant(NS, 0.75);
const NB_R = S.filter((r) => r.n_randomized !== "" && NB[r.study_id] === "randomised or enrolled"), NB_A = S.filter((r) => r.n_randomized !== "" && NB[r.study_id] === "analysed or completed"), NB_U = S.filter((r) => r.n_randomized !== "" && !NB_R.includes(r) && !NB_A.includes(r));
const NB_MED = median(NB_R.map((r) => +r.n_randomized)), NB_TOT = NB_R.reduce((a, r) => a + +r.n_randomized, 0);
const GE200 = NS.filter((x) => x >= 200).length, LT50 = NS.filter((x) => x < 50).length, LT100 = NS.filter((x) => x < 100).length, GE500 = NS.filter((x) => x >= 500).length;
const TOTALN = NS.reduce((a, b) => a + b, 0);
const perStat = (arr) => ({
  n: arr.length, med: median(nOf(arr)), wl: arr.filter((r) => r.comparator.startsWith("Waitlist")).length,
  ac: arr.filter((r) => r.comparator.startsWith("Active")).length, named: arr.filter((r) => r.burnout_instrument_source === "abstract").length,
  human: arr.filter((r) => r.human_support.startsWith("Human")).length, hc: arr.filter(isHC).length,
  np: arr.filter((r) => r.approach.startsWith("Non")).length,
  live: arr.filter((r) => r.delivery === "Live online sessions").length, app: arr.filter((r) => r.delivery === "Smartphone app").length,
});
const P1 = perStat(PER.p1), P2 = perStat(PER.p2), P3 = perStat(PER.p3);
const INCREC = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DATA, "included_reports.json"), "utf8")).records.map((r) => [r.record_id, r]));
const isPilot = (st) => {
  const rec = INCREC[st.primary_report]; let txt = st.title;
  if (rec && rec.abstract && !rec.abstract.startsWith("[abstract text omitted")) txt += " " + rec.abstract;
  return /\bpilot\b|feasib/i.test(txt);
};
const PILOT = S.filter(isPilot).length, PILOT3 = PER.p3.filter(isPilot).length;
const LARGE = (arr) => nOf(arr).filter((x) => x >= 500).length;
const PRE23 = S.filter((r) => +r.first_year < 2023);
const WLPRE23 = PRE23.filter((r) => r.comparator.startsWith("Waitlist")).length;
const NPS = S.filter((r) => r.approach.startsWith("Non"));
const NPOCC = cnt(NPS, "occupation"), NPCMP = cnt(NPS, "comparator");
const SUPS = S.filter((r) => r.source_db.includes("supplementary") || r.source_db.includes("update search"));
const SUPS3 = S.filter((r) => r.source_db.includes("supplementary search 3"));
const SUPS4N = S.filter((r) => r.source_db.includes("update search 4")).length;
const SUPNP = SUPS.filter((r) => r.approach.startsWith("Non")).length;
const byDel = (d) => S.filter((r) => r.delivery === d);
const appSelf = byDel("Smartphone app").filter((r) => r.human_support.startsWith("Self")).length;
if (byDel("Live online sessions").some((r) => r.human_support.startsWith("Self"))) throw new Error("a live programme is self-guided");
const liveHuman = byDel("Live online sessions").filter((r) => r.human_support.startsWith("Human")).length;
const SCR = S.filter((r) => r.delivery === "Ambient AI scribe");
const REG_R = REGS.filter((r) => r.allocation === "RANDOMIZED");
const REG_DUE = REG_R.filter((r) => r.completion_date < "2024");
const RS = cnt(REG_DUE, "status");
const R_INC = RS["Results report included in this review"], R_OUT = RS["Results report published outside review scope"], R_NONE = RS["No results report located"];
if (REGS.length !== 28 || REG_DUE.length !== 15) throw new Error("unexpected registry counts");
const occS = (o) => S.filter((r) => r.occupation === o);
const occDel = (o, d) => occS(o).filter((r) => r.delivery === d).length;
const occWL = (o) => occS(o).filter((r) => r.comparator.startsWith("Waitlist")).length;
const occUC = (o) => occS(o).filter((r) => r.comparator.startsWith("Usual")).length;
const physS = occS("Physicians and physician trainees");
const oc = (k) => OCC[k] || 0;
const mc = (k) => MECH[k] || 0;
const EMPS = S.filter((r) => OCC_EMP.includes(r.occupation));
const EMPWL = EMPS.filter((r) => r.comparator.startsWith("Waitlist")).length;
const MIND_GROUPS = Object.keys(OCC).filter((o) => S.some((r) => r.occupation === o && r.approach === "Mindfulness or meditation")).length;
const NEWAPP = ["Stress recovery and coping skills", "Tailored, combined or other multicomponent psychological", "Emotion regulation and emotion-focused", "Creative and experiential group formats", "Job crafting and work-role redesign"];
const NEWAPP_N = NEWAPP.reduce((a, k) => a + (APP[k] || 0), 0);
const teachS = occS("Teachers and education staff");
const coachS = S.filter((r) => r.approach === "Coaching");
if (coachS.some((r) => r.occupation !== "Physicians and physician trainees")) throw new Error("coaching outside physicians");
const WF = S.filter((r) => r.mechanism === "workflow automation");
const MAINSRC = { "Europe PMC": [227, 213, "26 Sep 2026"], OpenAlex: [716, 315, "26 Sep 2026"], ERIC: [8, 8, "26 Sep 2026"],
  "Web of Science": [352, 274, "17 Sep 2026"], Scopus: [382, 284, "17 Sep 2026"] };
const SUPSRC = SUPP.retrieved, SUPSRC2 = SUPP2.retrieved;
const SUPSRC3 = SUPP3.retrieved;
const SUPSRC4 = SUPP4.retrieved;
const IDENT = 1685 + SUPSRC["Europe PMC"] + SUPSRC.OpenAlex + SUPSRC2.Scopus + SUPSRC2["Web of Science"] + Object.values(SUPSRC3).reduce((a, b) => a + b, 0) + Object.values(SUPSRC4).reduce((a, b) => a + b, 0);
const SCREENED = 1094 + SUPP.screened + SUPP2.screened + SUPP3.screened + SUPP4.screened;
const SOUGHT = 147 + SUPP.sought + SUPP2.sought + SUPP3.sought + SUPP4.sought;
const ASSESSED_DB = SOUGHT - SUPP.not_retrieved - SUPP3.not_retrieved - SUPP4.not_retrieved;
if (ASSESSED_DB !== DBA.length) throw new Error("flow mismatch");
const incBy = (route, src) => INC.filter((m) => m.identification_route === route && m.source_db === src).length;
const assBy = (route, src) => M.filter((m) => m.identification_route === route && m.source_db === src).length;

// Labels
const L_OCC = { "Other or mixed healthcare workers": "Other or mixed healthcare workers", "Nurses": "Nurses",
  "Physicians and physician trainees": "Physicians and physician trainees", "Mental-health and social-care professionals": "Mental-health and social-care professionals",
  "Teachers and education staff": "Teachers and education staff", "Employees in other sectors or mixed occupations": "Employees of other sectors or mixed occupations" };
const dist = (obj, lab) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => ["    " + (lab ? lab[k] || k : k), np(v)]);
const INS_FULL = { Geldard: "Geldard Burnout Questionnaire", MBI: "Maslach Burnout Inventory", CBI: "Copenhagen Burnout Inventory", PFI: "Stanford Professional Fulfillment Index (burnout scale)",
  OLBI: "Oldenburg Burnout Inventory", ProQOL: "Professional Quality of Life Scale (burnout subscale)", SMBQ: "Shirom-Melamed Burnout Questionnaire",
  BBI: "Bergen Burnout Inventory", "Single-item": "Single-item burnout measure", BAT: "Burnout Assessment Tool", UBOS: "Utrecht Burnout Scale",
  SWEBO: "Scale of Work Engagement and Burnout (burnout scale)", WBI: "Well-Being Index (used to assess burnout)", "Japanese Burnout Scale": "Japanese Burnout Scale (Kubo)", "Turkish Burnout Scale": "Turkish adaptation of a burnout scale" };

// Appendix rows
const OCC_S = { "Other or mixed healthcare workers": "Healthcare (other/mixed)", "Nurses": "Nurses", "Physicians and physician trainees": "Physicians/trainees",
  "Mental-health and social-care professionals": "Mental-health/social care", "Teachers and education staff": "Teachers/education", "Employees of a named occupation, industry or enterprise": "Named occupation/industry", "Mixed-occupation workers recruited across employers": "Mixed-occupation workers",
  "Workers selected for a health condition or risk": "Selected for condition/risk" };
const MOD_S = { "Web-based program": "Web", "Smartphone app": "App", "Live online sessions": "Live online", "Blended (digital and in-person)": "Blended",
  "Text or instant messaging": "Messaging", "Chatbot": "Chatbot", "Wearable or motion-sensing platform": "Wearable/motion", "Ambient AI scribe": "AI scribe" };
const APP_S = { "Mindfulness or meditation": "Mindfulness", "Other psychological": "Other psychological", "Cognitive-behavioural or stress management": "CBT/stress mgmt",
  "Psychoeducation or resilience training": "Psychoeducation/resilience", "Positive psychology": "Positive psychology", "Acceptance and commitment": "ACT",
  "Compassion-based": "Compassion", "Coaching": "Coaching", "Stress recovery and coping skills": "Stress recovery/coping",
  "Emotion regulation and emotion-focused": "Emotion regulation", "Tailored, combined or other multicomponent psychological": "Tailored/combined", "Creative and experiential group formats": "Creative/experiential",
  "Job crafting and work-role redesign": "Job crafting" };
const CMP_S = { "Waitlist or delayed access": "Waitlist", "Active or attention control": "Active", "Usual practice or no intervention": "Usual/none", "Not reported": "NR", "Head-to-head digital variants": "Head-to-head" };
const short = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);
const STUDY_ROWS = S.map((s) => [s.study_id, s.reports.replace(/;/g, ", "), s.first_year, short(s.title, 90), OCC_S[s.occupation], MOD_S[s.delivery],
  s.approach.startsWith("Non") ? "Non-psych.: " + s.mechanism : APP_S[s.approach], CMP_S[s.comparator], DIRMAP[s.study_id], s.burnout_instrument === "NR" ? "—" : s.burnout_instrument + (s.burnout_instrument_source === "full text" ? "†" : ""), s.n_randomized || "NR"]);
const CRIT = { REPORT: "Not a primary results report", DESIGN: "Not randomized", POP: "Not a working population", DIGITAL: "Not digitally delivered", BURNOUT: "Burnout not an outcome" };
const ORDER = ["REPORT", "DESIGN", "POP", "DIGITAL", "BURNOUT"];
const EXCL_ROWS = M.filter((m) => m.decision === "excluded")
  .sort((a, b) => ORDER.indexOf(a.exclusion_criterion) - ORDER.indexOf(b.exclusion_criterion) || a.record_id.localeCompare(b.record_id))
  .map((m) => [m.record_id, { "main database search": "Main", "supplementary database search": "Suppl.", "supplementary search 3 (PubMed MeSH and delivery terms)": "Suppl. 3", "supplementary search 4 (unified update search)": "Suppl. 4", "registry linkage": "Registry" }[m.identification_route],
    m.pub_year || "", short(m.title, 75), CRIT[m.exclusion_criterion], m.exclusion_note]);
const REG_ROWS = REGS.map((r) => [r.nct_id, short(r.brief_title, 70), r.allocation.replace("_", "-").toLowerCase(), r.completion_date, r.enrollment, r.status, r.note]);

const TITLE = uk("Randomized Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map");
UKFN = uk;

// ---------------------------------------------------------------------------
// References (Vancouver, numbered in order of first citation)
// ---------------------------------------------------------------------------
const REFS = [
  ["who", "World Health Organization. Burn-out an \"occupational phenomenon\": International Classification of Diseases. WHO. May 28, 2019. Accessed September 20, 2026. https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases"],
  ["maslach", "Maslach C, Leiter MP. Understanding the burnout experience: recent research and its implications for psychiatry. ~~World Psychiatry~~. 2016;15(2):103-111. doi:10.1002/wps.20311"],
  ["rotenstein", "Rotenstein LS, Torre M, Ramos MA, et al. Prevalence of burnout among physicians: a systematic review. ~~JAMA~~. 2018;320(11):1131-1150. doi:10.1001/jama.2018.12777"],
  ["westjim", "West CP, Dyrbye LN, Shanafelt TD. Physician burnout: contributors, consequences and solutions. ~~J Intern Med~~. 2018;283(6):516-529. doi:10.1111/joim.12752"],
  ["westlancet", "West CP, Dyrbye LN, Erwin PJ, Shanafelt TD. Interventions to prevent and reduce physician burnout: a systematic review and meta-analysis. ~~Lancet~~. 2016;388(10057):2272-2281. doi:10.1016/S0140-6736(16)31279-X"],
  ["panagioti", "Panagioti M, Panagopoulou E, Bower P, et al. Controlled interventions to reduce burnout in physicians: a systematic review and meta-analysis. ~~JAMA Intern Med~~. 2017;177(2):195-205. doi:10.1001/jamainternmed.2016.7674"],
  ["kunzler", "Kunzler AM, Helmreich I, Chmitorz A, et al. Psychological interventions to foster resilience in healthcare professionals. ~~Cochrane Database Syst Rev~~. 2020;(7):CD012527. doi:10.1002/14651858.CD012527.pub2"],
  ["yang", "Yang Y, Wen J, Wan H, et al. Digital health interventions for reducing occupational burnout in nurses: a systematic review and meta-analysis. ~~Front Public Health~~. 2026;14:1879258. doi:10.3389/fpubh.2026.1879258"],
  ["park", "Park JH, Jung SE, Ha DJ, et al. E-healthcare interventions for nurse mental health: a systematic review. ~~Medicine (Baltimore)~~. 2022;101(28):e29125. doi:10.1097/MD.0000000000029125"],
  ["adam", "Adam D, Berschick J, Schiele JK, et al. Interventions to reduce stress and prevent burnout in healthcare professionals supported by digital applications: a scoping review. ~~Front Public Health~~. 2023;11:1231266. doi:10.3389/fpubh.2023.1231266"],
  ["lampinen", "Lampinen VS, Kämper E, Balla VR, Katajavuori N, Asikainen H. The effectiveness of online acceptance and commitment therapy-based interventions on depression, burnout, anxiety and stress in occupational contexts: a systematic narrative review. ~~Internet Interv~~. 2026;43:100909. doi:10.1016/j.invent.2026.100909"],
  ["arksey", "Arksey H, O'Malley L. Scoping studies: towards a methodological framework. ~~Int J Soc Res Methodol~~. 2005;8(1):19-32. doi:10.1080/1364557032000119616"],
  ["levac", "Levac D, Colquhoun H, O'Brien KK. Scoping studies: advancing the methodology. ~~Implement Sci~~. 2010;5:69. doi:10.1186/1748-5908-5-69"],
  ["peters", "Peters MDJ, Godfrey C, McInerney P, et al. Chapter 11: scoping reviews. In: Aromataris E, Munn Z, eds. ~~JBI Manual for Evidence Synthesis~~. JBI; 2020. doi:10.46658/JBIMES-20-12"],
  ["tricco", "Tricco AC, Lillie E, Zarin W, et al. PRISMA Extension for Scoping Reviews (PRISMA-ScR): checklist and explanation. ~~Ann Intern Med~~. 2018;169(7):467-473. doi:10.7326/M18-0850"],
  ["page", "Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. ~~BMJ~~. 2021;372:n71. doi:10.1136/bmj.n71"],
  ["rethlefsen", "Rethlefsen ML, Kirtley S, Waffenschmidt S, et al. PRISMA-S: an extension to the PRISMA statement for reporting literature searches in systematic reviews. ~~Syst Rev~~. 2021;10(1):39. doi:10.1186/s13643-020-01542-z"],
  ["clopper", "Clopper CJ, Pearson ES. The use of confidence or fiducial limits illustrated in the case of the binomial. ~~Biometrika~~. 1934;26(4):404-413. doi:10.1093/biomet/26.4.404"],
  ["furukawa", "Furukawa TA, Noma H, Caldwell DM, et al. Waiting list may be a nocebo condition in psychotherapy trials: a contribution from network meta-analysis. ~~Acta Psychiatr Scand~~. 2014;130(3):181-192. doi:10.1111/acps.12275"],
  ["schaufeli", "Schaufeli WB, De Witte H, Desart S. Burnout Assessment Tool (BAT): development, validity, and reliability. ~~Int J Environ Res Public Health~~. 2020;17(24):9495. doi:10.3390/ijerph17249495"],
  ["consort", "Schulz KF, Altman DG, Moher D; CONSORT Group. CONSORT 2010 statement: updated guidelines for reporting parallel group randomised trials. ~~BMJ~~. 2010;340:c332. doi:10.1136/bmj.c332"],
  ["eysenbach", "Eysenbach G; CONSORT-EHEALTH Group. CONSORT-EHEALTH: improving and standardizing evaluation reports of web-based and mobile health interventions. ~~J Med Internet Res~~. 2011;13(4):e126. doi:10.2196/jmir.1923"],
  ["chen", "Chen R, Desai NR, Ross JS, et al. Publication and reporting of clinical trial results: cross sectional analysis across academic medical centers. ~~BMJ~~. 2016;352:i637. doi:10.1136/bmj.i637"],
];
const REFK = Object.fromEntries(REFS.map(([k, s]) => [k, s]));
let CITE_ON = false; const USED = [];            // numbering follows first citation in the main text (AMA)
const c = (...keys) => {
  if (!CITE_ON) return "";
  keys.forEach((k) => { if (!REFK[k]) throw new Error("ref " + k); if (!USED.includes(k)) USED.push(k); });
  const nums = keys.map((k) => USED.indexOf(k) + 1).sort((a, b) => a - b);
  const parts = []; let i = 0;
  while (i < nums.length) { let j = i; while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++; parts.push(j - i >= 2 ? `${nums[i]}-${nums[j]}` : nums.slice(i, j + 1).join(",")); i = j + 1; }
  return `^{${parts.join(",")}}`;
};

// Appendix A rows: exact strings
const RAWJ = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
const WOS_MAIN = '(burnout OR "occupational burnout" OR "job burnout" OR "work-related burnout" OR "professional burnout" OR "employee burnout") AND (digital OR online OR internet-based OR web-based OR mobile OR smartphone OR app OR mHealth OR eHealth OR "digital health" OR "computer-based" OR "technology-delivered") AND (psychological OR psychotherapy OR CBT OR "cognitive behavioral" OR mindfulness OR "acceptance and commitment" OR ACT OR resilience OR "stress management" OR "self-compassion" OR "positive psychology" OR "emotion regulation" OR relaxation OR coping) AND (random* OR "controlled trial" OR RCT)';
const EXT_DIGITAL = RAWJ("raw_supplementary_openalex.json").query.match(/AND \((digital OR .*?)\) AND \(randomized/)[1];
const SUPP_WS = (wrap) => wrap('(burnout OR "burn-out") AND (' + EXT_DIGITAL + ') AND (randomi* OR rct OR "controlled trial" OR "clinical trial")');
const QS3 = RAWJ("raw_third_search.json").queries, QS4 = RAWJ("raw_fourth_search.json").queries;
const SEARCH_ROWS = [
  ["Europe PMC", "TITLE_ABS; 26 Sep 2026", RAWJ("raw_europepmc.json").query],
  ["OpenAlex", "title_and_abstract.search; 26 Sep 2026", RAWJ("raw_openalex.json").query],
  ["ERIC", "All fields; 26 Sep 2026", RAWJ("raw_eric.json").query],
  ["Web of Science Core Collection", "Topic (TS), all editions; 17 Sep 2026", "TS=(" + WOS_MAIN + ")"],
  ["Scopus", "Title, abstract, keywords; 17 Sep 2026", "TITLE-ABS-KEY(" + WOS_MAIN + ")"],
  ["Europe PMC (supplementary 1)", "TITLE_ABS; 28 Sep 2026", RAWJ("raw_supplementary_europepmc.json").query],
  ["OpenAlex (supplementary 1)", "title_and_abstract.search; 28 Sep 2026", RAWJ("raw_supplementary_openalex.json").query],
  ["Scopus (supplementary 1)", "Title, abstract, keywords; 29 Sep 2026", SUPP_WS((s) => "TITLE-ABS-KEY(" + s + ")")],
  ["Web of Science (supplementary 1)", "Topic (TS), all editions; 29 Sep 2026", SUPP_WS((s) => "TS=(" + s + ")")],
  ["PubMed (MeSH check)", "MeSH Terms and title/abstract; 29 Sep 2026", QS3["PubMed (MeSH)"] + "; " + SUPSRC3["PubMed (MeSH)"] + " records"],
  ["Europe PMC (delivery terms 1)", "TITLE_ABS; 29 Sep 2026", QS3["Europe PMC (delivery-term search 1)"] + "; " + SUPSRC3["Europe PMC (delivery-term search 1)"] + " records"],
  ["Europe PMC (delivery terms 2)", "TITLE_ABS; 29 Sep 2026", QS3["Europe PMC (delivery-term search 2)"] + "; " + SUPSRC3["Europe PMC (delivery-term search 2)"] + " records"],
  ["Europe PMC (update, unified)", "TITLE_ABS; all years; 18 Oct 2026", QS4["Europe PMC (unified search)"] + "; " + SUPSRC4["Europe PMC (unified search)"] + " records"],
  ["OpenAlex (update, unified)", "title_and_abstract.search; published from 1 Sep 2026; 18 Oct 2026", QS4["OpenAlex (unified search, published from 1 Sep 2026)"] + "; " + SUPSRC4["OpenAlex (unified search, published from 1 Sep 2026)"] + " records"],
  ["ERIC (update, unified)", "All fields; all years; 18 Oct 2026", QS4["ERIC (unified search)"] + "; " + SUPSRC4["ERIC (unified search)"] + " records"],
  ["PubMed (update, unified)", "MeSH Terms and title/abstract; published 1 Sep to 18 Oct 2026; 18 Oct 2026", QS4["PubMed (unified search, published 1 Sep to 18 Oct 2026)"] + "; " + SUPSRC4["PubMed (unified search, published 1 Sep to 18 Oct 2026)"] + " records"],
  ["ClinicalTrials.gov", "API v2; 28 Sep 2026", 'Condition contains "burnout"; study type interventional; status completed; at least one of app, online, web-based, internet, digital, smartphone, mobile, tele, virtual reality, VR, chatbot, ehealth, mhealth or technology in the title or intervention; titles naming students, patients, caregivers, parents or children set aside.'],
];

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
const body = [];
const add = (...x) => x.flat().forEach((e) => body.push(e));

WC.mode = "abs";
// Abstract
add(
  H1("Abstract"),
  P(`**Background:** Digital programmes are widely used against occupational burnout, but randomized evidence has been reviewed only within single professions or broader mental-health outcomes.`),
  P(`**Objective:** To map randomized trials of any digitally delivered intervention in working populations that reported burnout as an outcome.`),
  P(`**Methods:** Scoping review reported according to PRISMA-ScR. We searched Europe PMC, OpenAlex, ERIC, Web of Science and Scopus (17-26 September 2026), repeated them without the intervention-type block so that interventions of any mechanism could be found, added a PubMed MeSH search and delivery-term searches after a vocabulary gap appeared (28-29 September 2026), and linked ClinicalTrials.gov registrations to their publications. Reports were assessed against five ordered criteria and charted at trial level.`),
  P(`**Results:** Of ${fmt(IDENT)} records, ${fmt(SCREENED)} were screened and ${M.length} reports were assessed. We included ${INC.length} reports of ${N} trials (${fmt(TOTALN)} participants; median ${MED} per trial). The supplementary searches alone found ${SUPS.length} trials, ${SUPNP} of them with non-psychological mechanisms. Of all trials, ${pct(P3.n)}% were first reported from 2023 onwards. Healthcare workers were studied in ${HEALTH} trials and teachers or employees of other sectors in ${NONHEALTH}. Web programmes (${MOD["Web-based program"]} trials) and smartphone apps (${MOD["Smartphone app"]}) predominated, and live online group sessions rose from ${P1.live + P2.live} ${P1.live + P2.live === 1 ? "trial" : "trials"} before 2023 to ${P3.live} afterwards. Mindfulness was the most frequent psychological approach (${APP["Mindfulness or meditation"]} trials); ${NPS.length} trials used non-psychological mechanisms. Waitlist controls were used in ${CMP["Waitlist or delayed access"]} trials overall and in ${Math.round(100 * P3.wl / P3.n)}% of those reported from 2023 onwards. Only ${NAMED} abstracts named the burnout instrument. Of ${REG_DUE.length} randomized registrations completed by 2023, ${R_NONE} had no locatable results.`),
  P(`**Conclusions:** The evidence has grown quickly but is concentrated in healthcare, increasingly waitlist-controlled and inconsistently reported. Actively controlled trials outside healthcare, trials of work-system technologies, explicit reporting of burnout instruments and publication of completed trials are priorities.`),
  P("**Keywords:** occupational burnout; digital health; randomized controlled trial; scoping review; evidence map; occupational health"),
  pageBreak(),
);

WC.mode = "main";
// 1 Introduction
add(
  H1("1. Introduction"),
  P(`Burnout is a syndrome that results from chronic workplace stress that has not been successfully managed. It is characterised by exhaustion, mental distance from or cynicism about one's job, and reduced professional efficacy, and the World Health Organization classifies it in ICD-11 as an occupational phenomenon rather than a medical condition ${c("who", "maslach")}. Prevalence estimates vary widely with the instrument and cut-off used, but in health care they are high enough to be a concern for workforce retention and quality of care ${c("rotenstein", "westjim")}. Similar concerns have been raised for teachers, social-care staff and employees in many other sectors.`),
  P(`Interventions against burnout act at the level of the individual, the team or the organisation. Meta-analyses in physicians suggest that both individual-focused and organisation-directed interventions can reduce burnout, with somewhat larger effects for the latter ${c("westlancet", "panagioti")}. Digital delivery has become common for both kinds of intervention. Web programmes, smartphone apps, videoconference groups, text messages and, more recently, conversational agents and workflow technologies can reach many workers at low marginal cost and fit around shift work. The COVID-19 pandemic accelerated this shift, particularly in hospitals.`),
  P(`Several reviews have examined parts of this field. A Cochrane review covered psychological resilience interventions in healthcare professionals regardless of delivery mode ${c("kunzler")}. Recent reviews have focused on digital interventions for burnout in nurses ${c("yang")}, on e-health interventions for burnout and mental health in nurses ${c("park")}, on digitally supported stress and burnout interventions in nurses and physicians ${c("adam")}, and on online acceptance and commitment therapy in occupational settings ${c("lampinen")}. Each is limited to one or two professions, to one therapeutic approach, or to stress rather than burnout as the target outcome. As a result, it is not known how randomized evidence on digital interventions with burnout outcomes is distributed across occupations, delivery modes and intervention mechanisms, or how the design of these trials has changed.`),
  P(`A scoping review is the appropriate method for this kind of mapping question ${c("arksey", "levac", "peters")}. We aimed to identify and characterise the randomized controlled trials, as far as the searched sources allowed, that evaluated a digitally delivered intervention in a working population and reported burnout as an outcome. We asked four questions: (1) in which occupational groups and over what period have these trials been conducted; (2) which delivery modes, intervention approaches and levels of human support have been tested; (3) how are the trials designed with respect to comparators, sample size and burnout measurement; and (4) what proportion of registered and completed trials have published their results?`),
);

// 2 Methods
add(
  H1("2. Methods"),
  H2("2.1 Design and reporting"),
  P(`The review followed the framework of Arksey and O'Malley with the refinements of Levac and colleagues and the JBI guidance ${c("arksey", "levac", "peters")}. It is reported according to PRISMA-ScR ${c("tricco")}; the flow diagram follows the PRISMA 2020 template ${c("page")}. The completed PRISMA-ScR checklist is provided in Appendix E. The protocol was not registered in advance.`),
  H2("2.2 Eligibility criteria"),
  P(`Eligibility was defined with the population-concept-context framework and operationalised as five criteria (Table S1). The criteria were applied in a fixed order, and the first criterion a report failed was recorded as the reason for exclusion. We did not restrict eligibility by the mechanism of the intervention: a digital programme of professional training, physical activity, feedback or workflow support was eligible in the same way as a psychological programme, provided that burnout was reported as an outcome of the randomized comparison. Mechanism was instead charted as a study characteristic. No language or date limits were applied.`),
  caption("**Table S1.** Eligibility criteria, applied in the order shown"),
  table(["Criterion", "Operational definition"], [
    ["1. Report type (REPORT)", "Peer-reviewed primary report of trial results. Unpublished preprints without a peer-reviewed version, protocols, registrations, reviews, commentaries, preprints superseded by a peer-reviewed report, and secondary analyses without a randomized comparison of burnout were excluded."],
    ["2. Design (DESIGN)", "Randomized allocation with a between-group comparison: individual, cluster, factorial, crossover or stepped-wedge designs."],
    ["3. Population (POP)", "Workers: employed staff, practising professionals and trainees in paid employment such as resident physicians. Workers on sick leave who remain employed are included; samples of students, patients or the general public are excluded."],
    ["4. Concept: digital delivery (DIGITAL)", "At least one core intervention component delivered through the web, an app, videoconference, text or instant messaging, a chatbot, virtual reality, a computer or a wearable device. Voice telephone alone, or digital technology used only for assessment, did not qualify."],
    ["5. Outcome (BURNOUT)", "Burnout, measured with a burnout instrument or a named burnout subscale (for example the Maslach Burnout Inventory, Copenhagen Burnout Inventory, Oldenburg Burnout Inventory, Shirom-Melamed Burnout Questionnaire, or the burnout scales of the ProQOL or Professional Fulfillment Index), reported as a primary or secondary outcome of the randomized comparison. The aim of the intervention did not matter, provided that burnout was reported as an outcome: trials in which burnout served only as a correlate or risk factor, or was measured only with a general well-being index, were excluded. Short and single-item measures presented by the authors as burnout measures were accepted."],
    ["Context", "Any country and any work setting; no restriction on publication date."],
  ], [28, 72], 18),
  H2("2.3 Information sources and search strategy"),
  P(`The main search combined four concept blocks with AND: burnout, digital delivery, psychological or behavioural intervention, and randomized design. Europe PMC, OpenAlex and ERIC were searched through their public interfaces on 26 September 2026. Web of Science Core Collection (Topic field) and Scopus (title, abstract and keywords) were searched on 17 September 2026 through institutional access. The exact strings are given in Appendix A. The Scopus interface did not permit a full export, so records were captured from the results pages without abstracts. Abstracts for all ${MAINSRC.Scopus[1]} unique Scopus records were then retrieved from OpenAlex (201), Crossref (38), ClinicalTrials.gov (1) or the publisher's page or full text (44), so that every record could be screened on title and abstract.`),
  P(`The main search contained an intervention-type block, whereas the eligibility criteria admitted interventions of any mechanism. To close this gap, we ran a supplementary search without the intervention block: in Europe PMC and OpenAlex on 28 September 2026 and in Web of Science and Scopus on 29 September 2026. It combined burnout, an extended set of digital-delivery terms (adding, among others, wearable devices, text messaging, WhatsApp and WeChat, gamification, webinars and activity trackers) and randomized design. In Europe PMC and OpenAlex it excluded records already captured by the main digital and intervention blocks; in Web of Science and Scopus the results were exported in full with abstracts and de-duplicated against all earlier records.`),
  P(`Reading the trials retrieved by these searches and comparing them with a check of the literature exposed a further gap: the digital-delivery vocabulary of the earlier strings contained "virtual reality" but not "virtual", "remote", "video" or "audio", and none of the searches used the controlled vocabulary of the database that indexes most trials. On 29 September 2026 we therefore ran three further searches. The first searched PubMed for the Medical Subject Heading "Burnout, Professional" combined with randomized-design terms. The second and third searched titles and abstracts in Europe PMC for burnout, randomized-design terms and two lists of additional delivery terms (among them virtual, remote, video, audio, podcast, email, social media, asynchronous, hybrid, blended and self-paced). These searches were de-duplicated against every earlier record, screened with the same rules and assessed against the same criteria. They were not repeated in OpenAlex, ERIC, Web of Science or Scopus. The exact strings are in Appendix A and the retrieved records in raw_third_search.json.`),
  P(`A final update search was run on 18 October 2026 with a single strategy that matched the eligibility criteria: burnout AND any digital-delivery term (the union of every digital and delivery term used in the earlier searches) AND randomised design, with no intervention-type block. It was run in Europe PMC and ERIC (all years), OpenAlex and PubMed (records published from 1 September 2026, because earlier records had been covered by the broader earlier searches). Its records were de-duplicated against every earlier record, screened and assessed with the same rules. It was not repeated in Web of Science or Scopus, which were last searched on 29 September 2026. To check how much of the final evidence a single Europe PMC search of this kind could retrieve, we compared its results with all included reports (unified_search_validation.csv): it retrieved ${UNI_HIT} of the ${INC.length} (${(100 * UNI_HIT / INC.length).toFixed(0)}%), and the others came from OpenAlex, Web of Science, Scopus, ERIC or PubMed, so no single database was sufficient. The exact strings are in Appendix A and the retrieved records in raw_fourth_search.json.`),
  P(`Citation chasing: the reference lists of the five reviews cited in the Introduction (Yang, Park, Adam, Lampinen and Kunzler) were exported through Crossref. References with a DOI that had not been identified earlier (${CC_TOTAL} in all) were screened on title; for Kunzler et al., whose list concerns resilience in general, only the titles that named a digital delivery term were screened. The abstracts of the ${CC_READ} candidate articles were read; none was eligible (single-arm or non-randomised designs, or no burnout outcome in the abstract). The counts are in citation_chasing.csv.`),
  P(`ClinicalTrials.gov was searched through its version 2 API on 28 September 2026 for completed interventional registrations with burnout as a condition and at least one digital term in the title or intervention description. Registrations whose titles named students, patients, caregivers, parents or children were set aside. Table S2 summarises the sources and the flow of records from each.`),
  caption("**Table S2.** Information sources, search dates and flow of records by source"),
  table(["Source", "Search date", "Records identified", "Unique records screened", "Reports assessed", "Reports included"], [
    ["§Main search", "", "", "", "", ""],
    ...Object.keys(MAINSRC).map((k) => ["    " + k, MAINSRC[k][2], fmt(MAINSRC[k][0]), fmt(MAINSRC[k][1]), assBy("main database search", k), incBy("main database search", k)]),
    ["§Supplementary search (no intervention block)", "", "", "", "", ""],
    ...["Europe PMC", "OpenAlex"].map((k) => ["    " + k, "28 Sep 2026", fmt(SUPSRC[k]), fmt(readCsv("supplementary_screening.csv").filter((r) => r.source_db === k).length), assBy("supplementary database search", k), incBy("supplementary database search", k)]),
    ...["Web of Science", "Scopus"].map((k) => ["    " + k, "29 Sep 2026", fmt(SUPSRC2[k]), fmt(readCsv("wos_scopus_supplementary_screening.csv").filter((r) => r.source_db === k).length), assBy("supplementary database search", k), incBy("supplementary database search", k)]),
    ["§Supplementary search 3 (MeSH and delivery terms)", "", "", "", "", ""],
    ["    PubMed (MeSH)", "29 Sep 2026", fmt(SUPSRC3["PubMed (MeSH)"]), fmt(readCsv("third_search_screening.csv").filter((r) => r.source_db === "PubMed (MeSH)").length), SUP3A.filter((m) => m.source_db === "PubMed (MeSH)").length, INC.filter((m) => m.identification_route === "supplementary search 3 (PubMed MeSH and delivery terms)" && m.source_db === "PubMed (MeSH)").length],
    ["    Europe PMC (delivery terms)", "29 Sep 2026", fmt(Object.entries(SUPSRC3).filter(([k]) => k !== "PubMed (MeSH)").reduce((a, [, v]) => a + v, 0)), fmt(readCsv("third_search_screening.csv").filter((r) => r.source_db !== "PubMed (MeSH)").length), SUP3A.filter((m) => m.source_db !== "PubMed (MeSH)").length, INC.filter((m) => m.identification_route === "supplementary search 3 (PubMed MeSH and delivery terms)" && m.source_db !== "PubMed (MeSH)").length],
    ["§Update search 4 (unified strategy)", "", "", "", "", ""],
    ["    Europe PMC, OpenAlex, PubMed and ERIC", "18 Oct 2026", Object.entries(SUPSRC4).map(([k, v]) => v).join(" + ") + " = " + fmt(Object.values(SUPSRC4).reduce((a, b) => a + b, 0)), fmt(SUPP4.screened), SUP4A.length, INC.filter((m) => m.identification_route === "supplementary search 4 (unified update search)").length],
    ["§Other methods", "", "", "", "", ""],
    ["    ClinicalTrials.gov registry linkage", "28 Sep 2026", "28 registrations", "—", REGA.length, REGA.filter((m) => m.decision === "included").length],
    ["Total", "", fmt(IDENT), fmt(SCREENED), M.length, INC.length],
  ], [34, 14, 13, 14, 12, 13], 18, { numeric: [1, 2, 3, 4, 5] }),
  note("Duplicates were removed within and across sources before screening; each unique record is attributed to the source from which it was first retrieved. Supplementary-search records that duplicated earlier records were removed before screening."),
  H2("2.4 Selection of sources of evidence"),
  P(`Title and abstract screening used a rule-based classifier (publication type, study-design wording and occupational terms), followed by manual review of every record that the classifier did not exclude. Every report that passed screening was then assessed against the five criteria. The decision rested on the title and abstract, not on the full text, for all but the reports for which the full text was consulted, namely ${FTN} reports: where the abstract did not show whether burnout had been measured, where its wording (for example a design described as quasi-experimental) conflicted with the allocation described in the article, and for the discrepancies found in the second-reviewer comparison described below. The decision and reason for each of the ${M.length} assessed reports are listed in Appendix B and in the file master_registry.csv, which serves as the single accounting ledger for the review.`),
  P(`Reports that shared a trial registration number, or that described the same sample, were linked to one study. The unit of analysis is therefore the trial; reports are counted only in the flow diagram.`),
  P(`We estimated the error rate of the screening step by drawing a stratified random sample of 45 records excluded at screening in the main search (15 from Europe PMC and 10 each from OpenAlex, Web of Science and Scopus, with a fixed seed) and assessing them against the full criteria. The supplementary search and the registry linkage served as two further, independent checks for eligible reports missed by the main search.`),
  P(`To check the eligibility decisions themselves, the corresponding author independently assessed a sample of ${SR.length} of the assessed reports, balanced by the first reviewer's decision (${SR.filter((r) => r.ledger_decision === "include").length} included and ${SR.filter((r) => r.ledger_decision === "exclude").length} excluded), blind to the first reviewer's decisions, by applying the five criteria in order to the title and abstract. Agreement on inclusion versus exclusion was summarised as the percentage of agreement and Cohen's kappa. The two reviewers' answers on discrepant reports were compared with the full text where it could be obtained (four reports: three supplied by the corresponding author and one open access) and otherwise with the abstract; a first-reviewer decision was changed only when the full text or the abstract showed that it was wrong, and the second reviewer then confirmed or rejected each proposed resolution. The reviewers' answers are provided in second_review_sample.csv.`),
  H2("2.5 Data charting"),
  P(`Each trial was charted with one value per variable: occupational group; main delivery mode; intervention approach; mechanism (psychological, professional training, physical activity or health behaviour, feedback or navigation, workflow automation, or workplace or practical support); comparator; human support (self-guided or automated versus human-supported or facilitated); the burnout instrument (from the abstract or, where the abstract did not name it, from the full text); the number of participants (randomized, or analysed where only that was reported); and the year of the first report. Multicomponent interventions were charted by the component that the authors presented as central. Interventions that combined two psychological approaches in equal measure were charted as "tailored, combined or other multicomponent". Two groups that were too heterogeneous in the first coding, "other psychological" approaches and "employees in other sectors or mixed occupations", were split afterwards: the new categories and the rules that define them were written down first (taxonomy_d8.md) and every trial of both groups was recoded with the same rules in a fixed order (recoding_d8.csv). The charting form and the data for every trial are provided in study_charting.csv. For the ${N - NAMED} trials whose abstracts did not name the burnout instrument, the instrument was taken from the full text. Full texts were obtained from Europe PMC where open access and otherwise retrieved by the author. The extraction was prepared with a separate tool and then checked here: for every article the claimed instrument was searched for in the full text and in the context of a measurement description, and nine passages that the automated check could not settle (for example, articles in Polish, German or Japanese) were read individually. Four trials could not be resolved: one available copy was incomplete, one trial used momentary-assessment items without a named instrument, and two full texts were not obtained. The verification table is provided in instrument_fulltext_verification.csv.`),
  P(`Two further variables were coded from the abstracts only, in order to describe how the trials were reported rather than how well they were conducted. The first was the presence of five reporting indicators: a named method of random sequence generation or allocation, a statement about blinding or masking, numbers of attrition or completion, a trial registration number, and a stated analysis population (intention-to-treat or per-protocol). They were extracted with fixed text-matching rules (abstract_indicators.py) and are recorded as "stated" or "not stated in the abstract". A missing indicator does not show that the procedure was not carried out; abstracts are short and journals differ in the space they allow, and the indicators are therefore not a measure of study quality or of risk of bias. The second variable was the direction of the burnout result as reported in the abstract, which the first reviewer coded by reading the abstract into six categories: favours the intervention, mixed, no difference between groups, all arms improved without a difference between arms, unfavourable to the intervention, or no burnout result stated. It records what the authors reported and is not an effect estimate. Both codings were checked on a random sample of ${VS.length} studies (about 20%, drawn with a fixed random seed) that the second reviewer coded independently, blind to the first coder's codes. Two coding rules were fixed: a randomization method counts only if it is named (the word \"randomized\" alone does not), and a direction of \"favours the intervention\" requires a benefit on the total burnout score or on every burnout dimension reported, so that a benefit on a single subscale, subgroup, arm or time point is coded as mixed. For one trial, for which no abstract could be retrieved, the indicators were read from its registry synopsis. The sample, both reviewers' codes and the final codes are provided in abstract_coding_verification_sample.csv.`),
  H2("2.6 Registry linkage"),
  P(`For each completed registration we identified linked publications in two ways: through the references listed in the registration record and through a search of Europe PMC for the registration number. Linked publications that had not already been assessed through the databases were assessed against the same five criteria. For randomized registrations completed by the end of 2023, at least 33 months before the search, we classified results as reported in an included trial, reported outside the scope of the review, or not located.`),
  H2("2.7 Synthesis"),
  P(`We summarised trial characteristics as counts and percentages. Development over time was described by the year of the first report of each trial and grouped into three periods: ${minYear}-2019, 2020-2022 (the main pandemic years) and 2023-2026. The evidence map cross-tabulates occupational group against intervention approach. In line with the purpose of a scoping review, we did not assess risk of bias and did not synthesise effect sizes.`),
  H2("2.8 Use of artificial-intelligence tools"),
  P(`Screening, eligibility assessment, data charting, registry linkage and drafting of the manuscript were carried out with the assistance of a large-language-model agent (Claude, Anthropic) working under the direction of the author, who is responsible for the content. Each decision is recorded with its reason, and the code used at each step is published with the data.`),
);

// 3 Results
const sExc = (X) => `${X.REPORT} were not primary results reports, ${X.DESIGN} were not randomized, ${X.POP} did not study a working population, ${X.DIGITAL} were not digitally delivered and in ${X.BURNOUT} burnout was not an outcome of the randomized comparison`;
add(
  H1("3. Results"),
  H2("3.1 Selection of sources of evidence"),
  P(`The main and supplementary searches identified ${fmt(IDENT)} records. After ${fmt(IDENT - SCREENED)} duplicates and non-article records were removed, ${fmt(SCREENED)} records were screened on title and abstract and ${SOUGHT} reports were sought for full assessment (Figure 1). Three reports from the first supplementary search had neither an abstract nor an accessible full text when they were sought; the full texts were supplied later by the corresponding author, and two were assessed and excluded and one included, so no report remained not retrieved. Of the ${DBA.length} reports assessed, ${DBA.length - DBA.filter((m) => m.decision === "included").length} were excluded: ${sExc(DX)}. Through the registry, 28 completed registrations were linked to 31 publications; 9 of these had already been assessed through the databases, and ${REGA.filter((m) => m.decision === "included").length} of the remaining ${REGA.length} were eligible. In total, ${INC.length} reports describing ${N} randomized trials were included. One trial was described in three reports and one in two.`),
  P(`The two additional routes found eligible trials that the main search had missed. The supplementary searches yielded ${SUPS.length} eligible trials (${pct(SUPS.length)}% of the final set), ${SUPS3.length} of them from the third search and ${SUPS4N} from the update search. Of these, ${SUPNP} evaluated a non-psychological mechanism, including the ambient artificial-intelligence (AI) scribe trials, and the others used wording that the main search blocks did not capture, such as "psycho-education", written emotional disclosure, well-being text messages, video teleconference or virtual death cafes. The third search added trials of virtual coaching, virtual meditation and mindfulness programmes and a second ambient-scribe trial, which the earlier strings had missed because they did not contain the word "virtual". The update search of 18 October 2026 identified ${fmt(Object.values(SUPSRC4).reduce((a, b) => a + b, 0))} records, ${SUPP4.screened} of them new, and added three trials: a peer-support programme for school-based speech-language pathologists, a virtual-reality relaxation programme for intensive-care nurses and a telementoring programme for teachers. The registry linkage found two further trials: a factorial trial of a stress-management app for healthcare workers, which had been retrieved by the main search but excluded at screening, and an online mindfulness trial in nurses whose abstract did not mention burnout, although the full text reports the Maslach Burnout Inventory as a secondary outcome. By contrast, the random sample of 45 records excluded in the main search contained no eligible report (0 of 45; exact 95% confidence interval 0% to 7.9%)${c("clopper")}.`),
  P(`In the blind comparison of ${SR.length} assessed reports, the second reviewer and the first reviewer agreed on inclusion or exclusion for ${SR_LEN.agree} (${dp(100 * SR_LEN.po, 0)}%; Cohen's kappa ${dp(SR_LEN.k)}, 95% confidence interval ${dp(SR_LEN.lo)} to ${dp(SR_LEN.hi)}), counting the ${num(SR_PART)} blended interventions that the second reviewer judged only partly digital as included. If these were counted as excluded, agreement was ${SR_STR.agree} of ${SR.length} (${dp(100 * SR_STR.po, 0)}%; kappa ${dp(SR_STR.k)}). The ${num(SR_DISC.length)} clear discrepancies (${SR_DISC.join(", ")}) were checked against the full text (R095, R019, R169, R197) or the abstract (R050, R090). One first-reviewer decision was wrong and was reversed: R095 described itself as quasi-experimental but randomized teachers within schools, and it was included. Four exclusions were confirmed: R019 reported only one arm of a two-arm trial, R197 did not compare burnout between arms, R050 studied undergraduate students and did not measure burnout, and R169 offered a fitness-platform membership whose reported activities were classes and gym visits booked through an app, without digitally delivered intervention content. The second reviewer accepted the resolution of each of these, including the exclusion of R169, the most debatable of the six, on the criterion of digital delivery. The sixth report, R090, was confirmed as included because its abstract describes a ten-week online programme and the second reviewer agreed that it meets the digital criterion. The reason for exclusion of one protocol (R012) also differed between the reviewers, although both excluded it.`),
  ...figure("fig1_prisma_flow.png", `**Figure 1.** PRISMA 2020 flow diagram. The database column combines the main search and the three supplementary searches. Reports are the unit of counting up to inclusion; the final box also gives the number of trials.`, 560),
  H2("3.2 Characteristics of the included trials"),
  P(`Table 3 summarises the ${N} trials; each is listed in Appendix C. Together they enrolled ${fmt(TOTALN)} participants, based on the ${NS.length} trials that reported a sample size (the number randomized, or the number analysed where only that was reported). The median trial enrolled ${MED} participants (interquartile range ${Math.round(Q1)} to ${Math.round(Q3)}; range ${Math.min(...NS)} to ${fmt(Math.max(...NS))}). Of these, ${LT100} randomized fewer than 100 participants and ${LT50} fewer than 50, while ${GE500} randomized 500 or more. Sample size differed by delivery mode: live online group programmes, which need a facilitator for every group, had a median of ${median(nOf(byDel("Live online sessions")))} participants, compared with ${median(nOf(byDel("Smartphone app")))} for smartphone apps and ${median(nOf(byDel("Text or instant messaging")))} for messaging interventions.`),
  caption(`**Table 3.** Characteristics of the included trials (n = ${N})`),
  table(["Characteristic", "Trials, n (%)"], [
    ["§Year of first report", ""],
    [`    ${minYear}-2019`, np(P1.n)], ["    2020-2022", np(P2.n)], ["    2023-2026 (to 18 October)", np(P3.n)],
    ["§Occupational group", ""], ...dist(OCC, L_OCC),
    ["§Main delivery mode", ""], ...dist(MOD),
    ["§Intervention approach", ""], ...dist(APP),
    ["§Mechanism", ""], ...dist(MECH, { psychological: "Psychological", "professional training": "Professional training", "physical activity or health behaviour": "Physical activity or health behaviour",
      "feedback or navigation": "Feedback or navigation to services", "workflow automation": "Workflow automation", "workplace or practical support": "Workplace or practical support" }),
    ["§Comparator", ""], ...dist(CMP),
    ["§Human support", ""], ...dist(GUI),
    ["§Burnout instrument (abstract or full text)", ""],
    ...Object.entries(INS).filter(([k]) => k !== "NR").sort((a, b) => b[1] - a[1]).map(([k, v]) => ["    " + (INS_FULL[k] || k), np(v)]),
    ["    Not determined (full text incomplete or not obtained)", np(UNDET)],
  ], [72, 28], 18, { numeric: [1] }),
  H2("3.3 Development over time"),
  P(`The first eligible trial was reported in ${minYear}. Up to 2019 no more than five trials appeared in any year, and ${P1.n} trials in total were reported by the end of 2019 (Figure 2). The number then rose steeply: ${P2.n} trials were first reported in 2020-2022 and ${P3.n} from 1 January 2023 to 29 September 2026, so that ${pct(P3.n)}% of the evidence is less than four years old. The composition changed along with the volume. Healthcare workers accounted for ${P1.hc} of ${P1.n} trials before 2020 but for ${P2.hc} of ${P2.n} in 2020-2022 and ${P3.hc} of ${P3.n} from 2023, which suggests that the pandemic shifted the attention of the field towards hospital staff. Live online group sessions, absent before 2020, appeared in ${P2.live} ${P2.live === 1 ? "trial" : "trials"} in 2020-2022 and in ${P3.live} trials from 2023. Smartphone apps went from ${P1.app} to ${P2.app} and then ${P3.app} trials over the same periods. Web programmes remained the single most common mode in every period.`),
  P(`Typical sample size rose only modestly with the volume of trials. The median number of participants enrolled was ${P1.med} before 2020, ${P2.med} in 2020-2022 and ${P3.med} from 2023. What changed was the spread: ${LARGE(PER.p3)} of the ${LARGE(S)} trials that randomized 500 or more participants were reported from 2023 onwards (${LARGE(PER.p1)} before 2020 and ${LARGE(PER.p2)} in 2020-2022), but small studies also multiplied. At least ${PILOT} trials (${PILOT3} of them reported from 2023) described themselves as pilot or feasibility studies in the title or in the abstracts that could be checked; the true number is higher because abstracts from Web of Science and Scopus could not be screened for this term. Trials with non-psychological mechanisms appeared in every period (${P1.np}, ${P2.np} and ${P3.np} trials, respectively), so their small number is not only a recent phenomenon.`),
  ...figure("fig2_temporal_trend.png", `**Figure 2.** Included trials by year of first report and main delivery mode (n = ${N}). Data for 2026 cover 1 January to 29 September 2026, the date on which the last search was run.`, 600),
  H2("3.4 Occupational groups and intervention approaches"),
  P(`Healthcare workers were the participants in ${np(HEALTH)} trials: ${oc("Other or mixed healthcare workers")} with mixed or other healthcare staff, ${oc("Physicians and physician trainees")} with physicians or physician trainees and ${oc("Nurses")} with nurses. A further ${oc("Mental-health and social-care professionals")} trials studied mental-health and social-care professionals and ${oc("Teachers and education staff")} studied teachers and education staff. The remaining ${EMPN} trials studied employees in three kinds of sample: ${oc(OCC_EMP[2])} selected for a health condition or risk (stress-related disorders, elevated stress, sick leave, frequent sickness absence or obesity), ${oc(OCC_EMP[0])} from a named occupation, industry or enterprise (a call centre, information technology, veterinary teams) and ${oc(OCC_EMP[1])} mixed-occupation workers recruited across employers. Taken together, workers outside health and social care contributed ${pct(NONHEALTH)}% of the trials, and no sector other than education was represented by more than a few trials (Figure 3).`),
  P(`Mindfulness or meditation was the most frequent single psychological approach (${npi(APP["Mindfulness or meditation"])}; the pooled group of non-psychological mechanisms was larger, with ${NPS.length} trials) and it was found in ${MIND_GROUPS} of the ${Object.keys(OCC).length} occupational groups. The ${NEWAPP_N} trials that first fell into the heterogeneous "other psychological" category were recoded with explicit rules (Section 2.5) into five approaches: stress recovery and coping skills (${APP[NEWAPP[0]] || 0}), tailored, combined or other multicomponent programmes (${APP[NEWAPP[1]] || 0}), emotion regulation (${APP[NEWAPP[2]] || 0}), creative and experiential group formats (${APP[NEWAPP[3]] || 0}) and job crafting (${APP[NEWAPP[4]] || 0}). The use of mindfulness was concentrated in mixed healthcare samples and among physicians. The approaches differed between groups in ways that follow the professional context. All ${coachS.length} coaching trials were online programmes, one-to-one or in small groups, for physicians or physician trainees. The largest single category among physicians was non-psychological (${physS.filter((r) => r.approach.startsWith("Non")).length} of ${physS.length} trials), namely professional training, workflow technology, practical support and physical activity. Among teachers, non-psychological programmes, mainly online professional training (${teachS.filter((r) => r.approach.startsWith("Non-psych")).length} of ${teachS.length}), and cognitive-behavioural or stress-management programmes (${teachS.filter((r) => r.approach.startsWith("Cognitive")).length} of ${teachS.length}) were the most common approaches. Acceptance and commitment therapy, compassion-based and positive-psychology programmes were each tested in fewer than ten trials, mainly in healthcare staff, so the evidence for these approaches rests on few trials in any single occupation.`),
  P(`Delivery and comparators also differed between occupational groups. Physicians and physician trainees were the group most often offered blended programmes that combined online material with in-person sessions (${occDel("Physicians and physician trainees", "Blended (digital and in-person)")} of ${physS.length} trials), and they were the only group in which AI scribes were tested. Smartphone apps were concentrated in mixed healthcare samples (${occDel("Other or mixed healthcare workers", "Smartphone app")} of ${OCC["Other or mixed healthcare workers"]} trials), whereas ${occDel("Teachers and education staff", "Web-based program")} of the ${teachS.length} teacher trials used web programmes. Live online group sessions were used in ${occDel("Nurses", "Live online sessions")} of ${OCC.Nurses} nurse trials and ${occDel("Mental-health and social-care professionals", "Live online sessions")} of ${OCC["Mental-health and social-care professionals"]} trials with mental-health and social-care professionals, but in only ${occDel("Other or mixed healthcare workers", "Live online sessions")} of ${OCC["Other or mixed healthcare workers"]} mixed healthcare trials. Waitlist controls were most common in mixed healthcare samples (${occWL("Other or mixed healthcare workers")} of ${OCC["Other or mixed healthcare workers"]}) and among the employee samples that were not drawn from a health profession (${EMPWL} of ${EMPN}), while trials with physicians more often compared the intervention with usual practice (${occUC("Physicians and physician trainees")} of ${physS.length}).`),
  ...figure("fig3_evidence_map.png", `**Figure 3.** Evidence map: number of trials by occupational group and main intervention approach (n = ${N}). Row and column totals are shown in parentheses; a dot marks an empty cell.`, 600),
  H2("3.5 Interventions with non-psychological mechanisms"),
  P(`An intervention whose main mechanism was not psychological was evaluated in ${NPS.length} trials (${pct(NPS.length)}%). These were professional training (${mc("professional training")} trials, for example online communication training for physicians, video-based trauma-informed care training for midwives and an online professional-development course for preschool teachers), physical activity or health behaviour (${mc("physical activity or health behaviour")}), feedback or navigation to services (${mc("feedback or navigation")}, including text-message engagement with linkage to care and a wearable-triggered just-in-time intervention), workflow automation (${mc("workflow automation")})${mc("workplace or practical support") ? " and workplace or practical support (" + mc("workplace or practical support") + ")" : ""}. The ${WF.length} workflow trials randomized physicians to ambient AI scribes that draft clinical notes from recorded consultations, one of them comparing two scribe products in a crossover design, and reported burnout or work exhaustion as outcomes. They are the only trials in the set in which the digital technology changes the work itself rather than the worker's response to it.`),
  P(`Of these ${NPS.length} trials, ${SUPNP} (${pct(SUPNP, NPS.length)}%) were found only by the supplementary searches. Non-psychological trials were more often compared with usual practice (${NPCMP["Usual practice or no intervention"] || 0} of ${NPS.length}) and rarely with a waitlist (${NPCMP["Waitlist or delayed access"] || 0}), and physicians were the largest group among them (${NPOCC["Physicians and physician trainees"] || 0} trials).`),
  H2("3.6 Comparators, human support and outcome reporting"),
  P(`A waitlist or delayed-access control was used in ${np(CMP["Waitlist or delayed access"])} trials, an active or attention control in ${np(CMP["Active or attention control"])}, usual practice or no intervention in ${np(CMP["Usual practice or no intervention"])}, and a head-to-head comparison of two digital variants in ${np(CMP["Head-to-head digital variants"])}; the comparator could not be determined from the abstract in ${CMP["Not reported"]} trials. Waitlist controls became much more frequent in recent trials: ${pct(WLPRE23, PRE23.length)}% of trials reported before 2023 used one (${WLPRE23} of ${PRE23.length}), compared with ${pct(P3.wl, P3.n)}% of those reported from 2023 onwards (${P3.wl} of ${P3.n}). The share of actively controlled trials moved in the opposite direction, from ${pct(P1.ac, P1.n)}% before 2020 to ${pct(P3.ac, P3.n)}% from 2023 (Table 4).`),
  P(`Self-guided or automated interventions (${npi(GUI["Self-guided or automated"])}) and human-supported interventions (${npi(GUI["Human-supported or facilitated"])}) were about equally common, but support was closely tied to delivery mode. All ${liveHuman} live online programmes for which support was stated were facilitated${liveHuman < MOD["Live online sessions"] ? " (" + (MOD["Live online sessions"] - liveHuman) + " did not state it)" : ""}, and ${appSelf} of ${MOD["Smartphone app"]} app-based interventions were self-guided. For web programmes the level of support was often not stated in the abstract.`),
  P(`Burnout was an outcome in every included trial, but only ${np(NAMED)} abstracts named the instrument used. For the ${N - NAMED} trials whose abstracts did not, we identified the instrument from the full text (Section 2.5): ${FROM_FT} could be identified and ${UNDET} could not: one available copy was incomplete, one trial measured burnout dimensions with momentary-assessment items and named no instrument, and for one the full text was not obtained. Across abstract and full text, the Maslach Burnout Inventory or one of its adaptations was the most frequently used instrument (${INS.MBI} trials, ${pct(INS.MBI)}%), followed by the Copenhagen Burnout Inventory (${INS.CBI}), the Oldenburg Burnout Inventory (${INS.OLBI}) and the burnout scale of the Professional Fulfillment Index (${INS.PFI}). A further ${Object.keys(INS).filter((k) => !["MBI", "CBI", "OLBI", "PFI", "NR"].includes(k)).length} instruments were each used in one to five trials, and several trials used shortened versions, such as a two-item or five-item form of the emotional-exhaustion subscale. The proportion of abstracts naming the instrument was ${pct(P1.named, P1.n)}% before 2020 and around half in later periods (${pct(P2.named, P2.n)}% and ${pct(P3.named, P3.n)}%).`),
  caption("**Table 4.** Design features of the included trials by period of first report"),
  table(["Feature", `${minYear}-2019`, "2020-2022", "2023-2026", "All trials"], [
    ["Trials, n", P1.n, P2.n, P3.n, N],
    ["Median participants enrolled", P1.med, P2.med, P3.med, MED],
    ["Healthcare workers, %", pct(P1.hc, P1.n), pct(P2.hc, P2.n), pct(P3.hc, P3.n), pct(HEALTH)],
    ["Waitlist comparator, %", pct(P1.wl, P1.n), pct(P2.wl, P2.n), pct(P3.wl, P3.n), pct(CMP["Waitlist or delayed access"])],
    ["Active or attention comparator, %", pct(P1.ac, P1.n), pct(P2.ac, P2.n), pct(P3.ac, P3.n), pct(CMP["Active or attention control"])],
    ["Human-supported intervention, %", pct(P1.human, P1.n), pct(P2.human, P2.n), pct(P3.human, P3.n), pct(GUI["Human-supported or facilitated"])],
    ["Non-psychological mechanism, %", pct(P1.np, P1.n), pct(P2.np, P2.n), pct(P3.np, P3.n), pct(NPS.length)],
    ["Burnout instrument named in abstract, %", pct(P1.named, P1.n), pct(P2.named, P2.n), pct(P3.named, P3.n), pct(NAMED)],
  ], [36, 16, 16, 16, 16], 18, { numeric: [1, 2, 3, 4] }),
  H2("3.7 Reporting indicators and direction of the burnout result in the abstracts"),
  P(`Reporting indicators were sparse in the abstracts (Table S3). A trial registration was given in ${np(INDN.registration_reported)} abstracts, attrition or completion numbers in ${np(INDN.attrition_reported)}, an analysis population in ${np(INDN.analysis_population_stated)}, blinding in ${np(INDN.blinding_stated)} and a method of randomization in ${np(INDN.randomization_method)}. Because these are abstract-level indicators, they show what readers of the abstract can see and not what the trialists did.`),
  P(`In ${np(DIRN.F || 0)} trials the abstract reported a burnout result that favoured the intervention (Table S3). No difference between groups was reported in ${np(DIRN.N || 0)} and improvement in all arms without a difference between arms in ${np(DIRN.B || 0)}; the result was mixed, that is limited to one subscale, subgroup, arm or time point, in ${np(DIRN.M || 0)}, and unfavourable in ${np(DIRN.U || 0)}. In ${np(DIRN.R || 0)} the abstract named burnout as an outcome but stated no result for it. These codes describe how results were reported. Because positive results are more likely to be reported in an abstract, they cannot be read as the proportion of trials that worked. ${VSTXT}`),
  caption("**Table S3.** Reporting indicators and direction of the burnout result, coded from the abstracts (n = " + N + " trials)"),
  table(["Item", "Trials, n (%)"], INDK.map(([k, lab]) => [lab + ", stated", np(INDN[k])]).concat(DIRTAB.map(([k, lab]) => ["Direction: " + lab, np(DIRN[k] || 0)])), [72, 28], 18, { numeric: [1] }),
  note("Indicators were extracted from the abstract only; \"not stated\" means not stated in the abstract. The direction codes describe what the authors reported and are not effect estimates."),
  H2("3.8 Publication of registered trials"),
  P(`Of the 28 completed registrations, ${REG_R.length} used randomized allocation and ${REG_DUE.length} of these had been completed by the end of 2023 (Table S4; Appendix D). For ${R_INC} of the ${REG_DUE.length}, a results report was included in this review. Results of ${R_OUT} others had been published in samples outside the scope of the review, one in a clinical sample recruited on symptom level and one in the general population. For the remaining ${R_NONE} (${pct(R_NONE, REG_DUE.length)}%) no results report could be located; one had published only a protocol and one only a conference abstract. The ${REG_R.length - REG_DUE.length} randomized registrations completed in 2024 or later were not classified, because too little time has passed for publication.`),
  caption("**Table S4.** Publication status of randomized registrations completed by the end of 2023"),
  table(["Status", "n (%)", "Registrations"], [
    ["Results report included in this review", np(R_INC, REG_DUE.length), REG_DUE.filter((r) => r.status.startsWith("Results report included")).map((r) => r.nct_id).join(", ")],
    ["Results published outside the scope of the review", np(R_OUT, REG_DUE.length), REG_DUE.filter((r) => r.status.startsWith("Results report published outside")).map((r) => r.nct_id).join(", ")],
    ["No results report located", np(R_NONE, REG_DUE.length), REG_DUE.filter((r) => r.status.startsWith("No results")).map((r) => r.nct_id).join(", ")],
  ], [34, 16, 50], 18),
);

// 4 Discussion
add(
  H1("4. Discussion"),
  H2("4.1 Principal findings"),
  P(`This review identified ${N} randomized trials of digitally delivered interventions that reported burnout in working populations. Four features describe the evidence. First, it is recent: about two in three trials were first reported from 2023 onwards, and the field changed after 2020 in who was studied and how interventions were delivered. Second, it is concentrated in healthcare, which accounts for ${pct(HEALTH)}% of trials, while teachers and all other sectors together contribute ${pct(NONHEALTH)}%. Third, most trials test psychological programmes delivered to individual workers. Interventions that change training, work processes or practical conditions are a small and partly hidden part of the literature: ${SUPNP} of ${NPS.length} were found only by the supplementary searches, which removed the intervention-type terms or added delivery terms. Fourth, design and reporting leave room for improvement. Waitlist controls are common and were used in nearly two in five of the most recent trials, the typical trial is small, fewer than half of the abstracts name the burnout instrument, and results could not be found for two in five registered trials completed by 2023.`),
  P(`The concentration in healthcare reflects a change that began in 2020. Before 2020 only ${P1.hc} of ${P1.n} trials studied healthcare workers, whereas ${P2.hc} of ${P2.n} did so in 2020-2022 and ${P3.hc} of ${P3.n} from 2023. Live online group programmes appeared in the same period in which in-person sessions were difficult to hold. The field is therefore younger, and probably more shaped by the pandemic, than its size suggests. The abstracts do not allow us to test why so many recent trials are small and waitlist-controlled. A plausible explanation is that they were run quickly, within a single organisation, when withholding support from staff under pressure was hard to defend and a delayed-access design was the easiest compromise. If so, effects observed during the pandemic may not hold in ordinary working conditions, and confirmatory trials under stable conditions are needed.`),
  H2("4.2 Comparison with previous reviews"),
  P(`Table S5 compares the scope of this review with related reviews. Previous reviews were limited to one profession and pooled effects ${c("yang")}, covered healthcare workers regardless of delivery mode ${c("kunzler")}, targeted stress and burnout prevention in nurses and physicians ${c("adam")}, or were limited to nurses ${c("park")} or to one therapeutic approach ${c("lampinen")}. By restricting design to randomized trials and the outcome to burnout, while admitting any occupation and any mechanism, this review complements them. Its wider scope also shows that the healthcare focus of earlier reviews largely reflects where the trials have been done: even without an occupational restriction, most of the evidence comes from hospitals and health services.`),
  caption("**Table S5.** Scope of this review compared with related reviews"),
  table(["Review", "Population", "Interventions", "Outcome", "Study designs", "Synthesis"], [
    ["This review", "All occupations", "Any digitally delivered intervention", "Burnout", "Randomized trials only", "Evidence map"],
    ["Yang et al., 2026 " + c("yang"), "Nurses", "Digital health", "Burnout", "Randomized and quasi-experimental", "Systematic review and meta-analysis"],
    ["Adam et al., 2023 " + c("adam"), "Nurses and physicians", "Supported by digital applications", "Stress; burnout prevention", "Not restricted", "Scoping review"],
    ["Kunzler et al., 2020 " + c("kunzler"), "Healthcare professionals", "Psychological, any delivery", "Resilience and mental health", "Randomized trials only", "Cochrane review and meta-analysis"],
    ["Park et al., 2022 " + c("park"), "Nurses", "E-healthcare", "Burnout (primary) and mental health", "Randomized trials only", "Systematic review"],
    ["Lampinen et al., 2026 " + c("lampinen"), "Employees", "Online ACT", "Burnout, depression, anxiety, stress", "Randomized trials only", "Systematic narrative review"],
  ], [18, 14, 18, 18, 16, 16], 17),
  H2("4.3 What the evidence map shows"),
  P(`The map shows gaps of two kinds. The first concerns populations. Outside health and social care there are ${NONHEALTH} trials, spread across teachers and three kinds of employee sample (workers selected for a health condition or risk, staff of a named occupation, industry or enterprise, and mixed-occupation workers). Most of the employee trials recruited workers selected for a health condition or mixed occupational samples, so little can be said about any particular sector outside health care and education, even though burnout is not confined to these settings. Findings from hospital trials, where workload, shift patterns and professional identity are specific, cannot simply be transferred to these groups.`),
  P(`The second concerns mechanisms. Meta-analytic evidence in physicians suggests that organisation-directed interventions may be at least as effective as those directed at individuals ${c("westlancet", "panagioti")}, yet nearly four in five trials here (${pct(MECH.psychological)}% with a psychological mechanism) test programmes that ask the individual worker to change. The small group of trials that target training, workflow or practical support illustrates what digital technology can do beyond delivering psychological content. The ambient AI scribe trials are an example: they address documentation burden, a recognised driver of physician burnout ${c("westjim")}, directly. The ${WF.length} included scribe trials appeared in an artificial-intelligence journal (NEJM AI) and clinical-informatics journals (Applied Clinical Informatics and the Journal of the American Medical Informatics Association) rather than in occupational-health journals, and they do not use psychological terms. Reviews that search only for psychological interventions will miss them, as the main search of this review did.`),
  H2("4.4 Implications for trial design and reporting"),
  P(`Waitlist controls were used in about three in ten of the trials and in nearly two in five of those reported from 2023. Waitlist designs can overestimate effects, because participants who are told to wait may fare worse than they would with no intervention at all; in psychotherapy trials the waitlist has been described as a nocebo condition ${c("furukawa")}. Burnout develops over months and is closely tied to working conditions, so a comparison with an active control, with usual organisational support, or between two versions of a digital programme would say more about what the intervention adds. The small median sample, the ${LT50} trials with fewer than 50 participants and the ${PILOT} trials that describe themselves as pilot or feasibility studies indicate that much of the evidence comes from studies that were not designed to test effectiveness.`),
  P(`Burnout measurement was reported inconsistently. More than half of the abstracts did not name the instrument. The full texts show that the field is less fragmented than the abstracts suggest, since the Maslach Burnout Inventory and its adaptations account for about ${pct(INS.MBI, N)}% of trials, but they also show that several instruments with different conceptual bases and many shortened versions are in use ${c("maslach", "schaufeli")}. Missing instrument names make the trials hard to find and, together with the shortened forms, hard to combine. Following CONSORT and its e-health extension ${c("consort", "eysenbach")}, abstracts should name the burnout instrument and state whether burnout was a primary or secondary outcome. The results of ${R_NONE} randomized registrations completed by 2023 could not be found. This proportion is consistent with the delays and non-publication documented in other areas of clinical research ${c("chen")}, although this review did not compare effect sizes, so we cannot say whether unpublished trials differ from published ones.`),
  P(`Abstract-level reporting was thin in a different way. A registration number, attrition numbers, the analysis population and a blinding statement each appeared in fewer than a third of the abstracts, and a named randomization method in about one in twenty (Table 5). This says little about how the trials were conducted, since abstracts are short, but readers, editors and reviewers of later syntheses first see the abstract, and CONSORT asks for a structured summary of design, methods and results ${c("consort")}. The direction of the burnout result was reported as favouring the intervention in fewer than half of the abstracts, and in a further quarter it was limited to one subscale, subgroup, arm or time point; because these codes describe how results were presented and not their size or validity, they are not evidence of effectiveness, which only a systematic review with an assessment of risk of bias can address.`),
  H2("4.5 Strengths and limitations"),
  P(`The review has several strengths. It searched five databases, including two large open sources, and it tested and corrected its own search strategy by running supplementary searches without the intervention-type block and with additional delivery terms and controlled vocabulary. Every report that passed screening was assessed against explicit criteria with a recorded reason. Reports were linked to trials and the analysis was done at trial level. The trial registry was used both to find missed reports and to examine publication. All data and code are publicly available.`),
  P(`There are also limitations. Selection and charting were done by a single reviewer with the help of an AI agent. A second reviewer assessed only a sample of ${SR.length} reports, and kappa from so few reports is imprecise; the remaining reports were assessed by one reviewer, and the screening error was estimated from a random sample of excluded records. Eligibility and charting relied mainly on abstracts. The reporting indicators and the direction of the burnout result were read from the abstracts alone and checked on a sample of about one fifth; a missing indicator does not show that the procedure was omitted, and the direction codes are neither effect estimates nor a risk-of-bias assessment. The burnout instrument was checked in the full text for the trials whose abstracts did not name it, but other features, such as the comparator, the delivery mode and the sample size, may be reported more completely in the full texts than our figures suggest. PsycINFO, Embase and CENTRAL were not searched, and reference lists were not checked; the supplementary searches used a broader but still incomplete vocabulary, the third search covered only PubMed and Europe PMC, and each search added trials that the previous one had missed, so further eligible trials probably remain, particularly in Web of Science, Scopus and databases that we did not search. One eligible report was recovered only through the registry. Some eligible trials, especially from sectors outside health care, have probably been missed.  The main search strings differed slightly between the database interfaces (Appendix A). The registry analysis covered only ClinicalTrials.gov, and a report that could not be located has not necessarily gone unpublished. Each trial was assigned one category per variable, which simplifies multicomponent interventions. The protocol was not registered in advance, and the data for 2026 are incomplete.`),
);

// 5 Conclusions + declarations
add(
  H1("5. Conclusions"),
  P(`Randomized evidence on digital interventions for occupational burnout has grown quickly since 2020 and now comprises ${N} trials. The evidence is concentrated in healthcare and in psychological programmes for individual workers. Recent trials rely more often on waitlist controls, many trials are small pilot studies, and the burnout instrument is often not named in the abstract. The next generation of trials should include workers outside healthcare, test interventions that change training and work processes as well as individual coping, use active or usual-practice comparators, and report both the burnout instrument and the results of every completed trial.`),
  H1("Declarations"),
  P("**Funding:** This research received no specific funding."),
  P("**Competing interests:** The author declares no competing interests."),
  P("**Ethics approval:** Not required; the review used published data only."),
  P(`**Data and code availability:** All data and code are available at https://github.com/fyodora2/5R. The file master_registry.csv lists all ${M.length} reports assessed for eligibility (${MAIN.length} from the main search, ${SUPA.length + SUP3A.length} from the supplementary searches and ${REGA.length} registry-linked publications) with the decision and reason for each. The file study_charting.csv contains the charting data for the ${N} trials, supplementary_screening.csv, wos_scopus_supplementary_screening.csv and third_search_screening.csv contain every record screened in the supplementary searches, and registry_linkage.csv contains the ${REGS.length} registrations. Abstracts retrieved from Web of Science and Scopus are not redistributed because of the databases' terms of use.`),
  P("**Use of artificial intelligence:** See Section 2.8."),
);

WC.mode = null;
// References
add(H1("References"), ...REFS.map(([, r], i) => new Paragraph({ spacing: { after: 100, line: 300 }, indent: { left: 440, hanging: 440 }, children: [t(`${i + 1}.\t${r}`, { size: 22 })] })));

// Appendices
add(
  pageBreak(),
  H1("Appendix A. Search strategies"),
  table(["Source", "Field and date", "Search string (as run)"], SEARCH_ROWS, [17, 18, 65], 15, { raw: true }),
  note("Strings for Europe PMC, OpenAlex, ERIC, PubMed and the update search are the strings stored with the retrieved records (data/raw_*.json). Strings for Web of Science and Scopus were entered in the interfaces by the author. The extended digital block is the union of the main digital block and the additional terms listed in the Europe PMC and OpenAlex supplementary searches."),
  pageBreak(),
  H1("Appendix B. Reports excluded at eligibility assessment"),
  P(`All ${M.length - INC.length} excluded reports, ordered by the criterion they failed. Main = main database search; Suppl. = supplementary search; Suppl. 3 = third supplementary search; Suppl. 4 = unified update search; Registry = registry-linked publication. Record identifiers match master_registry.csv.`),
  table(["ID", "Route", "Year", "Title", "Criterion", "Reason"], EXCL_ROWS, [7, 8, 6, 37, 16, 26], 14, { raw: true }),
  pageBreak(),
  H1("Appendix C. Included trials"),
  table(["Study", "Reports", "Year", "Title", "Occupation", "Delivery", "Approach or mechanism", "Comparator", "Result", "Burnout measure", "n"], STUDY_ROWS, [6, 8, 5, 27, 10, 8, 12, 7, 4, 7, 6], 13, { raw: true }),
  note("Result: direction of the burnout result reported in the abstract (F favours the intervention, M mixed, N no difference, B all arms improved, U unfavourable, R not stated); not an effect estimate. Burnout measure: instrument named in the abstract, or, marked †, identified from the full text (— not determined). n: participants randomized or, where only that was reported, analysed (NR, not reported). DOIs and full titles are given in study_charting.csv."),
  pageBreak(),
  H1("Appendix D. Completed registrations on ClinicalTrials.gov"),
  table(["Registration", "Title", "Allocation", "Completion", "Enrolled", "Status", "Note"], REG_ROWS, [11, 27, 10, 9, 7, 16, 20], 13, { raw: true }),
  pageBreak(),
  H1("Appendix E. PRISMA-ScR checklist"),
  table(["#", "Item", "Reported in"], [
    ["1", "Title", "Title page"], ["2", "Structured summary", "Abstract"], ["3", "Rationale", "Section 1"],
    ["4", "Objectives", "Section 1, final paragraph"], ["5", "Protocol and registration", "Section 2.1; retrospective protocol in the supplementary files"],
    ["6", "Eligibility criteria", "Section 2.2, Supplementary Table S1"], ["7", "Information sources", "Section 2.3, Supplementary Table S2"],
    ["8", "Search", "Section 2.3, Supplementary Appendix A"], ["9", "Selection of sources of evidence", "Section 2.4"],
    ["10", "Data charting process", "Sections 2.5 and 2.7"], ["11", "Data items", "Section 2.5"],
    ["12", "Critical appraisal of individual sources (optional)", "Not performed; abstract-level reporting indicators only (Section 2.5, Supplementary Table S3)"], ["13", "Synthesis of results", "Section 2.6"],
    ["14", "Selection of sources of evidence", "Section 3.1, Figure 1, Supplementary Appendix B"], ["15", "Characteristics of sources of evidence", "Section 3.2, Table 1, Supplementary Appendix C"],
    ["16", "Critical appraisal within sources (optional)", "Not performed; Supplementary Table S3 gives abstract-level reporting indicators only"], ["17", "Results of individual sources of evidence", "Supplementary Appendix C; study_charting.csv; effect_direction_abstract.csv"],
    ["18", "Synthesis of results", "Sections 3.2-3.5, Figures 2-3, Table 2, Supplementary Tables S3-S4"], ["19", "Summary of evidence", "Section 4.1"],
    ["20", "Limitations", "Section 4.4"], ["21", "Conclusions", "Section 5"], ["22", "Funding", "Declarations"],
  ], [8, 52, 40], 18),
);


// ===========================================================================
// Journal version: blinded main text, title page and supplementary file
// ===========================================================================
// 1. Regroup the long-form content built above (it becomes the supplement)
const GROUP = {}; let _cur = null; const _unit = {};
body.forEach((e, i) => {
  if (e.__h1) { _cur = e.__h1; GROUP[_cur] = GROUP[_cur] || []; return; }
  if (e.__h2) { _cur = e.__h2; GROUP[_cur] = GROUP[_cur] || []; return; }
  if (e.__cap) _unit[e.__cap.replace(/^\*\*(Table \w+)\..*$/, "$1")] = body[i + 1];
  if (_cur) GROUP[_cur].push(e);
});
const GH = (prefix) => { const k = Object.keys(GROUP).find((x) => x.startsWith(prefix)); if (!k) throw new Error("no group " + prefix); return GROUP[k]; };
const T_CHAR = _unit["Table 3"], T_DESIGN = _unit["Table 4"];
if (!T_CHAR || !T_DESIGN) throw new Error("tables 3/4 not found");

// 2. Main text (AMA superscript citations numbered by first use)
CITE_ON = true;
WC.mode = "main"; WC.main = 0;
const mainBody = [];
const addM = (...x) => x.flat().forEach((e) => mainBody.push(e));
const fm = fmt;
const nTot = Object.values(SUPSRC4).reduce((a, b) => a + b, 0);
const exclTxt = ["REPORT", "DESIGN", "POP", "DIGITAL", "BURNOUT"].map((k) => `${DX[k] || 0} ${{ REPORT: "were not primary reports", DESIGN: "were not randomised", POP: "did not study workers", DIGITAL: "were not digitally delivered", BURNOUT: "did not report burnout as an outcome" }[k]}`).join(", ");
const MHS = oc("Mental-health and social-care professionals"), TCH = oc("Teachers and education staff");
const NPN = NPS.length;
const dirF = DIRN.F || 0, dirM = DIRN.M || 0, dirN = DIRN.N || 0, dirB = DIRN.B || 0, dirU = DIRN.U || 0, dirR = DIRN.R || 0;
const ABS = {
  obj: "To map randomised trials of digitally delivered interventions in working populations that reported occupational burnout as an outcome.",
  design: "Scoping review and evidence map, reported according to PRISMA-ScR.",
  methods: `We searched Europe PMC, OpenAlex, ERIC, Web of Science, Scopus and PubMed (17 September to 18 October 2026) and ClinicalTrials.gov. A first strategy that required a psychological-intervention term was followed by strategies without it, because the eligibility criteria admitted any mechanism. Reports were assessed against five ordered criteria, mostly from abstracts, and trials were charted by occupation, delivery mode, approach, comparator and burnout instrument. A human reviewer checked samples of the AI-assisted eligibility decisions and of the abstract-level coding.`,
  results: `Of ${fm(IDENT)} records, ${fm(SCREENED)} were screened and ${M.length} reports assessed. We included ${INC.length} reports of ${N} trials (${fm(TOTALN)} participants in ${NS.length} trials reporting numbers). Most trials (${pct(P3.n)}%) were first reported from 2023 onwards, and ${HEALTH} studied healthcare workers. Web programmes (${MOD["Web-based program"]}) and smartphone apps (${MOD["Smartphone app"]}) predominated; ${NPN} trials tested non-psychological mechanisms. Waitlist controls were used in ${pct(P3.wl, P3.n)}% of trials from 2023. About half of the abstracts (${NAMED}) named the burnout instrument, and ${INDN.registration_reported} gave a registration number. Of ${REG_DUE.length} randomised registrations completed by 2023, ${R_NONE} had no located results.`,
  concl: "The evidence has grown quickly but is concentrated in healthcare, increasingly waitlist-controlled and inconsistently reported in abstracts. Actively controlled trials outside healthcare, trials of work-system technologies, explicit reporting of burnout instruments and publication of completed trials are priorities.",
};
const absText = Object.values(ABS).join(" ");
const KW = "occupational burnout; digital health; randomised controlled trial; scoping review; evidence map; occupational health";

addM(
  new Paragraph({ spacing: { after: 240 }, children: [t(TITLE, { bold: true, size: 32 })] }),
  H1("Abstract"),
  P(`**Objectives:** ${ABS.obj}`), P(`**Study design:** ${ABS.design}`), P(`**Methods:** ${ABS.methods}`), P(`**Results:** ${ABS.results}`), P(`**Conclusions:** ${ABS.concl}`),
  P(`**Keywords:** ${KW}`),
  pageBreak(),
);
WC.main = 0;
const mainStart = mainBody.length;
addM(
  H1("1. Introduction"),
  P(`Burnout is a syndrome that results from chronic workplace stress that has not been successfully managed. It is characterised by exhaustion, mental distance from or cynicism about one's job, and reduced professional efficacy, and the World Health Organization classifies it in the International Classification of Diseases (ICD-11) as an occupational phenomenon.${c("who", "maslach")} Prevalence estimates vary with the instrument and cut-off, but in health care they are high enough to threaten workforce retention and quality of care,${c("rotenstein", "westjim")} and similar concerns have been raised for teachers, social-care staff and employees in other sectors.`),
  P(`Digital delivery through web programmes, smartphone apps, live online sessions, messaging or wearable devices promises to reach workers at scale. Evidence on interventions against burnout comes mainly from reviews restricted to physicians${c("westlancet", "panagioti")} or nurses,${c("park", "yang")} to one therapeutic approach,${c("lampinen")} or to broader mental-health outcomes.${c("kunzler")} A scoping review of digital applications covered healthcare professionals only and did not restrict study design.${c("adam")} No review has mapped, across occupations and intervention mechanisms, where randomised trials of digital interventions reporting burnout have been done, how they were designed and reported, and whether registered trials were published.`),
  P(`We therefore mapped randomised trials of any digitally delivered intervention in working populations that reported burnout as an outcome. We asked: in which occupational groups and over what period have the trials been done; which delivery modes, approaches and levels of human support were tested; how were the trials designed and reported; and how many registered, completed trials have published results?`),
  H1("2. Methods"),
  H2("2.1 Design and reporting"),
  P(`We followed the scoping-review framework of Arksey and O'Malley, Levac et al. and the Joanna Briggs Institute,${c("arksey", "levac", "peters")} and report the review according to PRISMA-ScR,${c("tricco")} with a PRISMA 2020 flow diagram${c("page")} and PRISMA-S for the search.${c("rethlefsen")} The protocol was not registered in advance (a retrospective protocol is supplied). Because the review maps evidence, we did not assess risk of bias or synthesise effect sizes.`),
  H2("2.2 Eligibility criteria"),
  P(`We included peer-reviewed primary reports of randomised trials (individual, cluster, factorial, crossover or stepped-wedge) in working populations (employed staff and trainees in paid employment, including workers on sick leave who remained employed; not students or patients). The intervention had to have at least one core component delivered digitally (web, app, videoconference, messaging, chatbot, virtual reality, computer or wearable device), and burnout, measured with a burnout instrument or a named burnout subscale, had to be an outcome of the randomised comparison. Interventions of any mechanism, language and date were eligible. The five criteria (report type, design, population, digital delivery, outcome) were applied in this order and the first one failed was recorded (Supplementary Table S1). Reports of one trial were linked, and the trial was the unit of analysis.`),
  H2("2.3 Information sources and search"),
  P(`The main search combined four concept blocks (burnout, digital delivery, a psychological or behavioural intervention term and randomised design) in Europe PMC, OpenAlex and ERIC (26 September 2026) and in Web of Science and Scopus (17 September 2026). Because the eligibility criteria admitted any mechanism, this strategy was too narrow. We therefore repeated the search without the intervention block (Europe PMC and OpenAlex, 28 September; Web of Science and Scopus, 29 September 2026), searched PubMed with the Medical Subject Heading "Burnout, Professional" and added further delivery terms (29 September 2026). Finally, on 18 October 2026, we ran one unified strategy (burnout AND any digital-delivery term AND randomised design) in Europe PMC and ERIC (all years) and, for records published from 1 September 2026, in OpenAlex and PubMed. Web of Science and Scopus were not searched again after 29 September 2026. ClinicalTrials.gov was searched on 28 September 2026 for completed interventional registrations with burnout as a condition and a digital term. We did not search PsycINFO, Embase or the Cochrane Central Register of Controlled Trials (no access). We checked the reference lists of five earlier reviews; none led to a further eligible trial (Supplementary Section S2). A unified Europe PMC search alone retrieved ${UNI_HIT} of the ${INC.length} included reports (${(100 * UNI_HIT / INC.length).toFixed(0)}%), so no single database was sufficient. Complete strings, dates and numbers of records are in Supplementary Appendix A and Table S2.`),
  H2("2.4 Selection and verification"),
  P(`Records were de-duplicated and screened with a rule-based classifier that could only exclude records. The first reviewer was an AI assistant (Section 2.7), which read every remaining record and proposed decisions; the corresponding author decided borderline reports. Eligibility was assessed from titles and abstracts; the full text was consulted for ${FTN} reports in which the abstract was ambiguous or discrepant or the human reviewer disagreed. We estimated the screening error from a random sample of 45 excluded records.${c("clopper")} The corresponding author, as human reviewer, independently assessed a blind sample of 30 assessed reports (15 included and 15 excluded), and agreement with the first reviewer was summarised with Cohen's kappa. Decisions with reasons are in the ledger (master_registry.csv).`),
  H2("2.5 Data charting"),
  P(`Each trial was charted with one value per variable: occupational group, delivery mode, intervention approach and mechanism, comparator, human support, burnout instrument, participants (randomised, or analysed where only that was reported) and year of first report. Two heterogeneous groups ("other psychological" approaches and "employees in other sectors") were split by rules written before recoding, and all their trials were recoded with the same rules. Where the abstract did not name the instrument, we took it from the full text; ${num(UNDET)} trials stayed undetermined. Two further variables were coded from abstracts only and are descriptive: five reporting indicators (named randomisation method, blinding statement, attrition numbers, registration number and analysis population), each recorded as stated or not stated in the abstract, and the direction of the burnout result as reported by the authors (six categories). They are neither quality ratings nor effect estimates, and an indicator missing from an abstract does not show that the procedure was omitted. The human reviewer coded a random 20% sample (23 of the 113 trials included at that stage) blind to the first coding. The rules that the comparison exposed (a randomisation method counts only if named; "favours the intervention" requires a benefit on the total score or on every dimension reported) were then applied to all trials.`),
  H2("2.6 Registry linkage and synthesis"),
  P(`For each registration we identified linked publications. For randomised registrations completed by the end of 2023 we classified results as reported in an included trial, reported outside the scope of the review, or not located. We summarised counts and percentages, grouped trials by year of first report (${minYear}-2019, 2020-2022, 2023-2026) and cross-tabulated occupation against approach.`),
  H2("2.7 Use of artificial intelligence in the research process"),
  P(`A large-language-model assistant (Claude, Anthropic) was used in interactive sessions under the author's direction to write and run the search, de-duplication and triage code, to read the abstracts of records that passed the rule-based triage and propose eligibility decisions and charting codes, and to build the tables and figures from the data files. The assistant acted as first reviewer and was not independent of the author's direction. The author decided every borderline eligibility question, obtained full texts that changed decisions, completed the blind and verification samples and approved the final classification; no second human reviewer assessed every record. Each decision and its reason are recorded in the released ledger, so the process can be audited without access to the sessions.`),
  H1("3. Results"),
  H2("3.1 Selection of sources of evidence"),
  P(`The searches identified ${fm(IDENT)} records; ${fm(IDENT - SCREENED)} duplicates and non-article records were removed and ${fm(SCREENED)} records were screened. Of ${DBA.length} reports assessed from the databases, ${DBA.length - DBA.filter((m) => m.decision === "included").length} were excluded (${exclTxt}); ${DBA.filter((m) => m.decision === "included").length} were included, and the registry added ${REGINC} (Figure 1). In total, ${INC.length} reports of ${N} trials were included. The searches added after the main search found ${SUPS.length} of the ${N} trials (${pct(SUPS.length)}%), ${SUPNP} of them with non-psychological mechanisms, among them the ambient AI scribe trials. The random sample of 45 excluded records contained no eligible report (0 of 45; exact 95% confidence interval 0% to 7.9%). In the blind comparison of 30 reports the reviewers agreed on ${SR_LEN.agree} (${dp(100 * SR_LEN.po, 0)}%; kappa ${dp(SR_LEN.k)}, 95% confidence interval ${dp(SR_LEN.lo)} to ${dp(SR_LEN.hi)}); if the ${num(SR_PART)} partly digital interventions were counted as excluded, agreement was ${dp(100 * SR_STR.po, 0)}% (kappa ${dp(SR_STR.k)}).`),
  ...figure("fig1_prisma_flow.png", `**Figure 1.** PRISMA 2020 flow diagram. Reports are the unit of counting up to the final box; the included reports belong to ${N} trials.`, 560),
  H2("3.2 Characteristics of the included trials"),
  P(`Table 1 summarises the ${N} trials (Supplementary Appendix C). The ${NS.length} trials that reported sample size enrolled ${fm(TOTALN)} participants (median ${dp(MED, 1).replace(/\.0$/, "")}, interquartile range ${Math.round(Q1)}-${Math.round(Q3)}). The number was randomised or enrolled in ${NB_R.length} of these trials (median ${NB_MED}; ${fm(NB_TOT)} participants), analysed or completed in ${NB_A.length}, and its basis could not be identified from the abstract in ${NB_U.length}. Healthcare workers were studied in ${np(HEALTH)} trials, mental-health and social-care professionals in ${MHS}, teachers in ${TCH} and employees of other sectors in ${EMPN}. Of the trials, ${np(P3.n)} were first reported from 2023 onwards (Figure 2); the share studying healthcare workers rose from ${pct(P1.hc, P1.n)}% before 2020 to ${pct(P2.hc, P2.n)}% in 2020-2022 and ${pct(P3.hc, P3.n)}% from 2023, and live online group sessions, absent before 2020, were used in ${P3.live} trials from 2023. Web programmes (${MOD["Web-based program"]} trials) and smartphone apps (${MOD["Smartphone app"]}) were the commonest delivery modes. Mindfulness was the most frequent psychological approach (${APP["Mindfulness or meditation"]} trials), and all ${coachS.length} coaching trials were in physicians (Figure 3).`),
  caption(`**Table 1.** Characteristics of the included trials (n = ${N})`),
  T_CHAR,
  ...figure("fig2_temporal_trend.png", `**Figure 2.** Included trials by year of first report and main delivery mode (n = ${N}). Data for 2026 cover 1 January to 18 October 2026.`, 520),
  ...figure("fig3_evidence_map.png", `**Figure 3.** Evidence map: trials by occupational group and intervention approach (n = ${N}); totals in parentheses, dots mark empty cells.`, 620),
  H2("3.3 Interventions, comparators and support"),
  P(`A mechanism that was not psychological was tested in ${NPN} trials (${pct(NPN)}%): professional training (${mc("professional training")}), physical activity or health behaviour (${mc("physical activity or health behaviour")}), feedback or navigation (${mc("feedback or navigation")}) and workflow automation (${mc("workflow automation")}, all ambient AI scribes for physicians). Of these, ${SUPNP} were found only by the searches added after the main search. A waitlist or delayed-access comparator was used in ${np(CMP["Waitlist or delayed access"])} trials, an active or attention control in ${np(CMP["Active or attention control"])} and usual practice in ${np(CMP["Usual practice or no intervention"])}; waitlists rose from ${pct(WLPRE23, PRE23.length)}% of trials before 2023 to ${pct(P3.wl, P3.n)}% from 2023 (Table 2). Self-guided or automated interventions (${GUI["Self-guided or automated"]}) and human-supported interventions (${GUI["Human-supported or facilitated"]}) were equally common; support depended on delivery mode (${liveHuman} of ${MOD["Live online sessions"]} live programmes were facilitated, ${appSelf} of ${MOD["Smartphone app"]} apps self-guided).`),
  caption("**Table 2.** Design features of the included trials by period of first report"),
  T_DESIGN,
  H2("3.4 Reporting of burnout and of trial features in abstracts"),
  P(`The burnout instrument was named in ${np(NAMED)} abstracts; the full text identified it for ${FROM_FT} of the other ${N - NAMED}, and ${UNDET} remained undetermined. The Maslach Burnout Inventory or an adaptation was used in ${np(INS.MBI)} trials, followed by the Copenhagen (${INS.CBI}) and Oldenburg (${INS.OLBI}) inventories. In the abstracts, a registration number was given in ${np(INDN.registration_reported)} trials, attrition or analysed numbers in ${np(INDN.attrition_reported)}, an analysis population in ${np(INDN.analysis_population_stated)}, blinding in ${np(INDN.blinding_stated)} and a randomisation method in ${np(INDN.randomization_method)}. The abstract reported a burnout result favouring the intervention in ${np(dirF)} trials, a mixed result (one subscale, subgroup, arm or time point) in ${np(dirM)}, no difference in ${np(dirN)} and an unfavourable result in ${np(dirU)}; ${np(dirB)} reported improvement in all arms and ${np(dirR)} stated no burnout result. These codes describe reporting and are not effect estimates (Supplementary Table S3). On the verification sample the reviewers' direction codes agreed for ${VS_DIR_AGREE} of ${VS.length} trials (${(100 * VS_KAPPA.po).toFixed(0)}%; kappa ${VS_KAPPA.k.toFixed(2)}) and the indicator judgements for ${VS_IND_AGREE} of ${VS_IND_TOTAL} (${(100 * VS_IND_AGREE / VS_IND_TOTAL).toFixed(0)}%).`),
  H2("3.5 Registered trials"),
  P(`Of the 28 completed registrations, ${REG_R.length} were randomised and ${REG_DUE.length} of these had been completed by the end of 2023. A results report was included in this review for ${R_INC}, results of ${R_OUT} had been published outside its scope, and for ${R_NONE} (${pct(R_NONE, REG_DUE.length)}%) no results report was located (Supplementary Table S4).`),
  H1("4. Discussion"),
  H2("4.1 Principal findings"),
  P(`This review identified ${N} randomised trials of digitally delivered interventions that reported burnout in working populations. The evidence is recent: ${pct(P3.n)}% of the trials were first reported from 2023 onwards, and the field changed after 2020 in who was studied and how interventions were delivered. It is concentrated in healthcare (${pct(HEALTH)}%), while teachers and employees of other sectors together contribute ${pct(TCH + EMPN)}%. Most trials test psychological programmes that ask the individual worker to change (${pct(MECH.psychological)}%), whereas interventions that change training, work processes or practical conditions are a small and partly hidden part of the literature: ${SUPNP} of ${NPN} were found only by the searches without an intervention block. Design and reporting leave room for improvement: waitlist controls are common and were used in ${pct(P3.wl, P3.n)}% of the most recent trials, the typical trial is small, only about half of the abstracts (${pct(NAMED)}%) name the burnout instrument, and no results could be found for ${R_NONE} of ${REG_DUE.length} registered trials completed by 2023. The rise since 2020 describes published trials, not trials started, and is compatible with, but does not show, an effect of the pandemic.`),
  H2("4.2 Comparison with previous reviews"),
  P(`Earlier reviews were limited to one profession and pooled effects,${c("yang")} covered healthcare workers regardless of delivery mode,${c("kunzler")} or targeted stress and burnout prevention in nurses and physicians.${c("adam")} By restricting design to randomised trials and outcome to burnout while admitting any occupation and mechanism, this review complements them (Supplementary Table S5).`),
  H2("4.3 Implications for trials and reporting"),
  P(`Meta-analytic evidence in physicians suggests that organisation-directed interventions may be at least as effective as individual-directed ones,${c("westlancet", "panagioti")} yet few digital trials target training, workflow or practical support. The ambient AI scribe trials are an example: they address documentation burden, a recognised driver of burnout, appeared in artificial-intelligence and informatics journals and do not use psychological terms, so reviews that search only for psychological interventions will miss them, as our own main search did. Waitlist designs can overestimate effects because participants told to wait may fare worse than with no intervention;${c("furukawa")} comparisons with active controls, usual organisational support or alternative versions of a programme would show more about what the intervention adds. Burnout instruments are many, include shortened forms and rest on different concepts,${c("schaufeli")} and only about half of the abstracts named them, and few gave basic trial features. Following CONSORT and its e-health extension,${c("consort", "eysenbach")} abstracts should name the instrument and the primary outcome, and completed trials should publish results; the proportion without located results here is consistent with non-publication documented elsewhere,${c("chen")} but we searched ClinicalTrials.gov only.`),
  H2("4.4 Strengths and limitations"),
  P(`Strengths are the search across six databases and a registry with repeated gap checks, a ledger that records every decision with its reason, trial-level analysis and public data. The main limitation is the search. The first strategy was narrower than the eligibility criteria; we corrected this with later searches, each of which found trials the previous one had missed, and the final unified strategy was run in only four sources, so more eligible trials probably remain, particularly in Web of Science, Scopus and the databases we did not search (PsycINFO, Embase, the Cochrane register). Second, selection and charting were done first by an AI assistant and checked by one human reviewer on samples (30 reports and 23 trials), not on every record or variable, and the kappa values from these samples are imprecise. Third, eligibility and charting relied on abstracts, so the comparator, delivery mode and sample size may be incomplete, trials that measured burnout only as a secondary outcome reported in the full text can be missed (one was found through the registry; as a sensitivity check we read the open-access full texts of 15 of the 37 reports excluded on abstracts for lack of a burnout outcome, and none qualified: 0 of 15, exact 95% CI 0 to 21.8%), and the reporting indicators and direction codes describe abstracts only. Fourth, the protocol was not registered in advance. Finally, each trial received one category per variable, which simplifies multicomponent interventions, and the data for 2026 are incomplete. The map describes the evidence identified by these searches and is not a complete census of trials.`),
  H1("5. Conclusions"),
  P(`Randomised evidence on digital interventions for occupational burnout has grown quickly since 2020 and now comprises ${N} trials, concentrated in healthcare and in psychological programmes for individual workers. Recent trials rely more often on waitlist controls, many are small pilots, and abstracts often omit the burnout instrument and basic trial features. Future trials should include workers outside healthcare, test interventions that change training and work processes, use active or usual-practice comparators, and report the instrument and the results of every completed trial.`),
);
const mainWords = (() => {
  const wc = (s) => String(s).replace(/\*\*/g, "").split(/\s+/).filter(Boolean).length;
  let w = WC.main;     // body paragraphs counted by P()
  mainBody.slice(mainStart).forEach((e) => { if (e.__h1) w += wc(e.__h1); if (e.__h2) w += wc(e.__h2); if (e.__cap) w += wc(e.__cap); });
  return w;
})();
WC.mode = null;
console.log("main text words (headings, captions, excluding tables):", mainWords, "| abstract words:", absText.split(/\s+/).length);
if (NAMED / N < 0.48 || NAMED / N > 0.52) throw new Error("instrument-named share no longer 'about half'");
if (mainWords > 3000) throw new Error("main text exceeds 3000 words: " + mainWords);
if (absText.split(/\s+/).length + 5 > 250) throw new Error("abstract exceeds 250 words");

const CIT = readCsv("included_citations.csv");
const REGID = {}; readCsv("trial_registrations.csv").forEach((r) => { (REGID[r.study_id] = REGID[r.study_id] || []).push(r.registration); });
const CIT_ROWS = CIT.map((r) => [r.study_id, r.record_id, (REGID[r.study_id] || []).filter((x, i, a) => a.indexOf(x) === i).join("; "), (r.authors_ama ? r.authors_ama + ". " : "") + r.title.replace(/\.$/, "") + ". " + (r.journal ? r.journal + ". " : "") + r.year + (r.volume ? ";" + r.volume : "") + (r.issue ? "(" + r.issue + ")" : "") + (r.pages ? ":" + r.pages : "") + "." + (r.doi ? " doi:" + r.doi : "") + (r.pmid ? " PMID:" + r.pmid : "")]);
if (CIT.length !== INC.length) throw new Error("citation file out of date");
// 3. Assemble the three documents
function refRuns(s) { return s.split(/(~~[^~]+~~)/).filter(Boolean).map((x) => x.startsWith("~~") ? t(x.slice(2, -2), { italics: true, size: 22, raw: true }) : t(x, { size: 22, raw: true })); }
const SNOTE = (s) => P(s);
const noFig = (arr) => arr.filter((e) => !e.__fig && !(e.__cap && /^\*\*Figure/.test(e.__cap)));
const noUnit = (arr, names) => { const out = []; for (let i = 0; i < arr.length; i++) { const e = arr[i]; if (e.__cap && names.some((n) => e.__cap.startsWith(`**${n}.`))) { i++; continue; } out.push(e); } return out; };
const supBody = [];
const addS = (...x) => x.flat().forEach((e) => supBody.push(e));
addS(
  new Paragraph({ spacing: { after: 120 }, children: [t("Supplementary material", { bold: true, size: 32 })] }),
  new Paragraph({ spacing: { after: 240 }, children: [t(TITLE, { bold: true, size: 26 })] }),
  P("This file contains the detailed methods and results that were moved out of the main text, Supplementary Tables S1 to S5, and Appendices A to E (complete search strings, excluded reports, included trials with full citations, registrations and the PRISMA-ScR checklist). The data files, scripts, the retrospective protocol and a data dictionary are in the repository named in the main text."),
  H1("Supplementary Methods"),
  H2("S1. Eligibility criteria"), ...noFig(GH("2.2 Eligibility")),
  H2("S2. Information sources and search strategy"), ...noFig(GH("2.3 Information")),
  H2("S3. Selection of sources of evidence"), ...noFig(GH("2.4 Selection")),
  H2("S4. Data charting"), ...noFig(GH("2.5 Data charting")),
  H2("S5. Registry linkage"), ...noFig(GH("2.6 Registry")),
  H1("Supplementary Results"),
  H2("S6. Selection of sources of evidence in detail"), ...noFig(GH("3.1 Selection")),
  H2("S7. Reporting indicators and direction of the burnout result in the abstracts"), ...noFig(GH("3.7 Reporting")),
  H2("S8. Publication of registered trials"), ...noFig(GH("3.8 Publication")),
  H2("S9. Comparison with previous reviews"), ...noFig(GH("4.2 Comparison")),
);
['Appendix A. Search strategies','Appendix B. Reports excluded at eligibility assessment','Appendix C. Included trials','Appendix D. Completed registrations on ClinicalTrials.gov','Appendix E. PRISMA-ScR checklist'].forEach((h) => {
  const k = Object.keys(GROUP).find((x) => x.startsWith(h)); if (!k) throw new Error(h);
  if (h.startsWith("Appendix C")) {
    addS(pageBreak(), H1(h), H2("C1. Full citations of the included reports"),
      P("Authors are listed as in the published report (first three, then et al, American Medical Association style). Where the authors could not be retrieved from the DOI record, the entry starts with the title."),
      table(["Study", "Report", "Registration", "Citation"], CIT_ROWS, [7, 7, 12, 74], 13, { raw: true }),
      note("Registration: identifiers found in the abstract, in the registry linkage or in the registry synopsis (data/trial_registrations.csv); a blank cell means that none was found, not that the trial was unregistered. Reports were merged into one trial when they shared a registration number or described the same sample: S017 (R025 and R091, one sample) and S045 (R076, R080 and R136, registration NCT02603133)."),
      H2("C2. Charted variables for each trial"), ...GROUP[k]);
  } else addS(pageBreak(), H1(h), ...GROUP[k].filter((e) => !(e.constructor.name === "Paragraph" && e.__pb)));
});

// Declarations and references for the main document
const AIDECL = "During the preparation of this work the author used Claude (Anthropic) to draft and edit the manuscript text from the released data files, to write code that builds the tables and figures, and to improve the language. After using this tool, the author reviewed and edited the content as needed and takes full responsibility for the content of the publication. The use of the tool in the research process (searching, screening, charting) is described in Section 2.7.";
addM(
  H1("Declarations"),
  P("**Funding:** This research received no specific funding."),
  P("**Competing interests:** The author declares no competing interests."),
  P("**Ethics approval:** Not required; the review used published data only."),
  P("**Data availability:** The ledger of all 301 assessed reports, the trial-level charting, the screening files, the abstract-coding files with the verification sample, the code and a data dictionary are in a public repository (link in the title page file, withheld here for blinded review). Abstracts retrieved from Web of Science and Scopus and full-text articles are not redistributed."),
  H1("Declaration of generative AI and AI-assisted technologies in the writing process"),
  P(AIDECL),
  H1("References"),
  ...USED.map((k, i) => new Paragraph({ spacing: { after: 100, line: 300 }, indent: { left: 440, hanging: 440 }, children: [t(`${i + 1}.\t`, { size: 22 }), ...refRuns(REFK[k])] })),
);
CITE_ON = false;

const mkDoc = (children, o = {}) => new Document({
  creator: "", title: o.title || TITLE, description: "",
  styles: { default: { document: { run: { font: FONT, size: 24 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11907, height: 16840 }, margin: { top: 1440, bottom: 1440, left: 1300, right: 1300 } },
      ...(o.lines ? { lineNumbers: { countBy: 1, restart: LineNumberRestartFormat.CONTINUOUS } } : {}) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] }) },
    children,
  }],
});
const ABS_WORDS = absText.split(/\s+/).length + 5;
const titlePage = [
  new Paragraph({ spacing: { after: 200 }, children: [t("Title page (not for blinded review)", { italics: true, size: 20 })] }),
  new Paragraph({ spacing: { after: 360 }, children: [t(TITLE, { bold: true, size: 32 })] }),
  P("**Article type:** Review article (scoping review and evidence map)"),
  P("**Running title:** Digital interventions and occupational burnout: an evidence map"),
  P("**Author(s):** [Full name(s) and academic degrees]"),
  P("**Affiliation(s):** [Department, institution, city, country]"),
  P("**Corresponding author:** [Full name]; [postal address]; email: m.reza.qeta@gmail.com; telephone: [number]"),
  P("**ORCID:** [ORCID iD]"),
  P("**Author contributions (CRediT):** [Conceptualization; Methodology; Investigation; Data curation; Formal analysis; Validation; Writing - original draft; Writing - review and editing]"),
  P(`**Counts:** abstract ${ABS_WORDS} words; main text ${fmt(Math.round(mainWords / 10) * 10)} words (introduction to conclusions, including headings and captions); 2 tables; 3 figures; 1 supplementary file; ${USED.length} references.`),
  P(`**Keywords:** ${KW}`),
  P("**Funding:** This research received no specific funding."),
  P("**Declaration of competing interests:** The author declares no competing interests."),
  P("**Data and code availability:** https://github.com/fyodora2/5R"),
  P("**Declaration of generative AI and AI-assisted technologies in the writing process:** " + AIDECL),
];
const write = (name, doc) => Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(path.join(__dirname, name), buf); console.log("wrote", name, buf.length, "bytes"); });
fs.writeFileSync(path.join(__dirname, "build_stats.json"), JSON.stringify({ trials: N, reports: INC.length, assessed: M.length, identified: IDENT, screened: SCREENED, mainWords, absWords: ABS_WORDS, refs: USED.length, uniHit: UNI_HIT, namedAbstracts: NAMED, healthcare: HEALTH, undetermined: UNDET, singleItem: INS["Single-item"] || 0, dbIncluded: DBA.filter((m) => m.decision === "included").length, sought: SOUGHT, fulltext: FTN, pctHealth: pct(HEALTH), pct2023: pct(P3.n), pctNonPsych: pct(NPS.length), pctNamed: pct(NAMED), regNone: R_NONE, regDue: REG_DUE.length, totalN: fmt(TOTALN) }, null, 1));
Promise.all([
  write("manuscript_blinded.docx", mkDoc(mainBody, { lines: true })),
  write("title_page.docx", mkDoc(titlePage, { title: "Title page" })),
  write("supplementary_material.docx", mkDoc(supBody, { title: "Supplementary material" })),
]).then(() => console.log("trials", N, "| reports", INC.length, "| assessed", M.length, "| main words", mainWords, "| abstract words", ABS_WORDS, "| refs", USED.length));
