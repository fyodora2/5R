// Builds submission_metadata.docx: title-page metadata, declarations, key points, cover-letter draft and file checklist.
// Values that only the author can supply are shown as [bracketed placeholders]; nothing is invented.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber } = require("docx");
const FONT = "Times New Roman";
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 22, ...o });
function rich(s) { const out = []; const re = /(\*\*[^*]+\*\*)/g; let last = 0, m; while ((m = re.exec(s))) { if (m.index > last) out.push(t(s.slice(last, m.index))); out.push(t(m[0].slice(2, -2), { bold: true })); last = re.lastIndex; } if (last < s.length) out.push(t(s.slice(last))); return out; }
const P = (s, o = {}) => new Paragraph({ children: rich(s), spacing: { after: 140, line: 320 }, ...o });
const H1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, children: [t(s, { bold: true, size: 26 })] });
const B = (items) => items.map((s) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 80, line: 300 }, children: rich(s) }));
const bd = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
function table(head, rows, widths) {
  const W = 9360; const cw = widths.map((w) => Math.round((W * w) / widths.reduce((a, b) => a + b, 0)));
  const cell = (txt, i, hd) => new TableCell({ width: { size: cw[i], type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 60, bottom: 60, left: 90, right: 90 }, shading: hd ? { type: ShadingType.CLEAR, fill: "EDEDED" } : undefined, children: [new Paragraph({ children: rich(String(txt)) .map((r) => r) })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))] });
}

// ---- values read from the final manuscript so that metadata and paper cannot diverge
const paperPath = path.join(__dirname, "burnout_scoping_review_paper.docx");
const txt = execSync(`pandoc "${paperPath}" -t plain --wrap=none`, { maxBuffer: 1e8 }).toString();
const after = (label) => { const i = txt.indexOf(label); return txt.slice(i + label.length, txt.indexOf("\n", i)).trim(); };
const title = txt.split("\n").filter((l) => l.trim())[1].trim();
const running = after("Running title:");
const wc = after("Word count:");
const keywords = after("Keywords:");
const absStart = txt.indexOf("\nAbstract\n") + 10, absEnd = txt.indexOf("\nKeywords:");
const abstractParas = txt.slice(absStart, absEnd).split("\n").map((s) => s.trim()).filter(Boolean);
const grab = (re) => { const m = txt.match(re); if (!m) throw new Error("not found " + re); return m; };
const [, ident, screened, assessed] = grab(/Of ([\d,]+) records, ([\d,]+) were screened and (\d+) reports were assessed/);
const [, nrep, ntr, npart] = grab(/We included (\d+) reports of (\d+) trials \(([\d,]+) participants/);
if (title.indexOf("Scoping Review and Evidence Map") < 0 || ntr !== "113" || nrep !== "116" || assessed !== "288") throw new Error("manuscript changed; review metadata");
const decl = (label) => { const m = txt.match(new RegExp(label + ": ([^\\n]+)")); if (!m) throw new Error("declaration missing " + label); return m[1].trim(); };
const funding = decl("Funding"), coi = decl("Competing interests"), ethics = decl("Ethics approval"), aiuse = txt.match(/2\.8 Use of artificial-intelligence tools\n\n([^\n]+)/)[1].trim();

const body = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [t("Submission metadata", { bold: true, size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [t(title, { bold: true, size: 26 })] }),
  P("Items in [square brackets] can only be supplied by the corresponding author. Everything else is taken from the final manuscript (paper/burnout_scoping_review_paper.docx) and the public repository."),

  H1("1. Manuscript"),
  table(["Field", "Entry"], [
    ["Title", title],
    ["Running title", running],
    ["Article type", "Scoping review (reported according to PRISMA-ScR; PRISMA 2020 flow diagram)"],
    ["Keywords", keywords],
    ["Suggested MeSH terms", "Burnout, Professional; Randomized Controlled Trials as Topic; Telemedicine; Mobile Applications; Internet-Based Intervention; Occupational Health; Review"],
    ["Counts", wc],
    ["Files", "Main manuscript (Word); Figures 1-3 (PNG); Appendices A-E (inside the manuscript); retrospective protocol (Word); dataset (GitHub, see section 4)"],
    ["Language", "English"],
    ["Search dates", "17-26 September 2026 (main search); 28-29 September 2026 (supplementary searches); last search run 29 September 2026"],
    ["Included evidence", `${ntr} randomized trials (${nrep} reports; ${npart} participants); ${ident} records identified, ${screened} screened, ${assessed} reports assessed`],
  ], [24, 76]),

  H1("2. Authors and contact"),
  table(["Field", "Entry"], [
    ["Author (full name)", "[full name as it should appear]"],
    ["ORCID", "[ORCID iD]"],
    ["Affiliation", "[department, institution, city, country]"],
    ["Corresponding author", "[full name]"],
    ["Postal address", "[address]"],
    ["Email", "m.reza.qeta@gmail.com"],
    ["Author contributions (CRediT)", "[if sole author: Conceptualization, Methodology, Investigation, Data curation, Formal analysis, Validation, Writing - original draft, Writing - review and editing]. Second-reviewer functions (blind eligibility sample, verification of abstract coding, decisions on borderline reports) were carried out by the corresponding author."],
  ], [24, 76]),

  H1("3. Abstract (as in the manuscript)"),
  ...abstractParas.map((s) => P(s)),
  P(`**Keywords:** ${keywords}`),

  H1("4. Declarations"),
  table(["Item", "Statement"], [
    ["Funding", funding],
    ["Competing interests", coi],
    ["Ethics approval and consent", ethics],
    ["Registration and protocol", "The review was not registered in advance. A retrospective protocol that lists every step added after the work began is provided (protocol_retrospective.docx). [OSF retrospective registration DOI, if registered.]"],
    ["Reporting guideline", "PRISMA-ScR checklist (manuscript Appendix E); PRISMA 2020 flow diagram (Figure 1)"],
    ["Use of artificial intelligence", aiuse + " (manuscript Section 2.8)"],
    ["Data availability", "All data and code: https://github.com/fyodora2/5R. The ledger of all 288 assessed reports, trial-level charting, screening files, reporting-indicator and effect-direction codes, verification samples and a data dictionary (data/DATA_DICTIONARY.md) are included. Abstracts retrieved from Web of Science and Scopus and full-text articles are not redistributed. [Archived version DOI, e.g. Zenodo, if the journal requires one.]"],
    ["Code availability", "https://github.com/fyodora2/5R (scripts/final, paper/)"],
    ["Acknowledgements", "[optional]"],
  ], [24, 76]),

  H1("5. Key points (for journals that ask for them)"),
  ...B([
    `**Question:** What randomized evidence exists on digitally delivered interventions that report occupational burnout as an outcome?`,
    `**Findings:** In this scoping review of ${ntr} randomized trials, 61.9% studied healthcare workers, 64.6% were first reported from 2023 onwards, 16.8% tested a non-psychological mechanism, and only 49.6% of abstracts named the burnout instrument.`,
    `**Meaning:** The evidence is recent and concentrated in healthcare; actively controlled trials outside healthcare, work-system technologies, explicit instrument reporting and publication of completed trials are priorities.`,
  ]),

  H1("6. Cover letter (draft)"),
  P("[Date]"),
  P("[Editor name], Editor-in-Chief, [journal name]"),
  P(`Dear [Editor name],`),
  P(`Please consider our manuscript, "${title}", for publication as a scoping review in [journal name].`),
  P(`Digital programmes are widely offered to reduce occupational burnout, yet randomized evidence has been reviewed only within single professions, single approaches or broader mental-health outcomes. We searched five databases and ClinicalTrials.gov, and after finding that the first strings missed trials of non-psychological interventions and of virtual delivery, we repeated the search without the intervention block and with additional delivery terms and controlled vocabulary. From ${ident} records we included ${ntr} randomized trials (${nrep} reports). The evidence is recent, concentrated in healthcare and in psychological programmes for individual workers, increasingly waitlist-controlled, and inconsistently reported: fewer than half of the abstracts named the burnout instrument, and results could not be found for 6 of 15 randomized registrations completed by 2023.`),
  P(`We believe the article suits the readers of [journal name] because it maps where trials exist and where they do not, and it gives trialists concrete reporting recommendations. Every eligibility decision is recorded with a reason, a blind second-reviewer sample and a verification sample of the abstract coding are reported with their agreement, and the data and code are public.`),
  P(`The manuscript is not under consideration elsewhere and has not been published. The review was not registered in advance; a retrospective protocol is supplied and the limitations that follow from this, from the single-reviewer design with an AI agent, and from the databases not searched (PsycINFO, Embase, CENTRAL) are stated in the Discussion. [Suggested reviewers and exclusions: to be chosen by the author; suitable expertise areas are systematic and scoping review methodology, occupational health psychology, and digital mental-health trials.]`),
  P(`Sincerely,`),
  P(`[Name], [affiliation], m.reza.qeta@gmail.com`),

  H1("7. Submission checklist"),
  ...B([
    "Replace every [bracketed] item above and the author line on the manuscript title page (the manuscript still contains [Name], [affiliation] and [postal address]).",
    "Choose the journal, then adapt structure and length to its instructions (abstract style, word limit, reference style). The manuscript follows a structured abstract of about 300 words and numbered references in order of citation.",
    "Upload Figures 1-3 as separate files from paper/figures if the journal does not accept figures inside the Word file.",
    "Add a licence file to the repository (for example CC BY 4.0 for data and MIT for code) and, if required, archive a release with a DOI.",
    "Decide whether to register the retrospective protocol on OSF and add the DOI to the protocol and the declarations.",
    "Open questions that could change the numbers: two WeChat 'three good things' trials (R182, R183) excluded because their abstracts report no burnout outcome; one trial (S119) rests on an abstract with no burnout result and needs its full text; one full text (S070) is incomplete.",
  ]),
];
const doc = new Document({
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Page ", PageNumber.CURRENT], font: FONT, size: 18 })] })] }) },
    children: body }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(path.join(__dirname, "submission_metadata.docx"), b); console.log("wrote submission_metadata.docx", b.length, "bytes"); });
