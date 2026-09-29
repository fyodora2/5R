// Builds the retrospective protocol (protocol_retrospective.docx) for registration on OSF.
// The protocol was written after the searches were run; it states this openly and lists every deviation.
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat, Footer, PageNumber } = require("docx");
const FONT = "Times New Roman";
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 22, ...o });
function rich(s) { const out = []; const re = /(\*\*[^*]+\*\*)/g; let last = 0, m; while ((m = re.exec(s))) { if (m.index > last) out.push(t(s.slice(last, m.index))); out.push(t(m[0].slice(2, -2), { bold: true })); last = m.index + m[0].length; } if (last < s.length) out.push(t(s.slice(last))); return out; }
const P = (s, o = {}) => new Paragraph({ children: rich(s), spacing: { after: 140, line: 320 }, ...o });
const H1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, children: [t(s, { bold: true, size: 26 })] });
const B = (items) => items.map((s) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 80, line: 300 }, children: rich(s) }));
const bd = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
function table(head, rows, widths) {
  const W = 9360; const cw = widths.map((w) => Math.round((W * w) / widths.reduce((a, b) => a + b, 0)));
  const cell = (txt, i, hd) => new TableCell({ width: { size: cw[i], type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 60, bottom: 60, left: 90, right: 90 }, shading: hd ? { type: ShadingType.CLEAR, fill: "E8E8E8" } : undefined, children: [new Paragraph({ spacing: { after: 0, line: 260 }, children: [t(txt, { size: 19, bold: hd })] })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))] });
}
const title = "Randomized Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map";
const body = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [t("Retrospective protocol", { bold: true, size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [t(title, { bold: true, size: 26 })] }),
  P("**Status of this document.** This protocol was written after the searches were run and most decisions were made. It is therefore a retrospective registration, not a pre-registration. Section 10 lists every step that was added or changed after the work began. The registered version is intended to make the plan and its deviations transparent; it cannot show that the plan preceded the data."),
  P("**Registration:** Open Science Framework, retrospective registration. Registration DOI: [to be added by the registering author]. **Authors and affiliations:** [name, affiliation]. **Contact:** m.reza.qeta@gmail.com. **Repository:** https://github.com/fyodora2/5R."),
  H1("1. Rationale"),
  P("Digital programmes are widely used to reduce occupational burnout, but randomized evidence has been reviewed only within single professions, single therapeutic approaches or broader mental-health outcomes. A scoping review is the appropriate design for describing how this evidence is distributed across occupations, delivery modes and mechanisms, and how the trials are designed and reported. The review follows Arksey and O'Malley, the refinements of Levac and colleagues, the JBI guidance and PRISMA-ScR."),
  H1("2. Objective and questions"),
  P("To identify and characterise randomized controlled trials, as far as the searched sources allow, that evaluated a digitally delivered intervention in a working population and reported occupational burnout as an outcome. Questions:"),
  ...B(["In which occupational groups and over what period have these trials been conducted?", "Which delivery modes, intervention approaches and levels of human support have been tested?", "How are the trials designed with respect to comparators, sample size and burnout measurement?", "What proportion of registered and completed trials have published their results?"]),
  H1("3. Eligibility criteria"),
  P("The population-concept-context framework was operationalised as five criteria applied in a fixed order; the first criterion a report fails is recorded as the reason for exclusion."),
  table(["Criterion", "Definition"], [
    ["1. Report type (REPORT)", "Primary report of trial results. Protocols, registrations, reviews, commentaries, preprints superseded by a peer-reviewed report and secondary analyses without a randomized comparison of burnout are excluded."],
    ["2. Design (DESIGN)", "Randomized allocation with a between-group comparison (individual, cluster, factorial, crossover or stepped-wedge)."],
    ["3. Population (POP)", "Workers: employed staff, practising professionals and trainees in paid employment such as resident physicians. Students, patients and general-public samples are excluded."],
    ["4. Digital delivery (DIGITAL)", "At least one core intervention component delivered through the web, an app, videoconference, text or instant messaging, a chatbot, virtual reality, a computer or a wearable device. Voice telephone alone, or digital technology used only for assessment, does not qualify."],
    ["5. Outcome (BURNOUT)", "Burnout measured with a burnout instrument or a named burnout subscale and reported as an outcome of the randomized comparison."],
  ], [26, 74]),
  P("No restriction by intervention mechanism (psychological, professional training, physical activity, feedback, workflow technology and others are eligible), language, country or publication date. Unit of analysis: the trial; reports sharing a registration or sample are one study."),
  H1("4. Information sources and search"),
  P("Databases: Europe PMC, OpenAlex, ERIC, Web of Science Core Collection and Scopus; ClinicalTrials.gov for registrations. The main search combined four blocks: burnout, digital delivery, a psychological or behavioural intervention term and randomized design. Because the eligibility criteria admit any mechanism, supplementary searches were added (see Section 10). All strings, dates and record counts are in the manuscript (Appendix A) and in data/raw_third_search.json and the screening files. Not searched: PsycINFO, Embase and Cochrane CENTRAL (no access); reference lists and citations were not checked."),
  H1("5. Selection process"),
  P("Records were de-duplicated within and across sources. Title and abstract screening used a rule-based classifier (publication type, protocol wording, burnout, randomization and delivery wording) followed by manual review of every record the classifier did not exclude. Every report passing screening was assessed against the five criteria; the reason for each decision is recorded in data/master_registry.csv, the single accounting ledger. Assessment was based on the abstract unless the full text was consulted, which is recorded per report. Selection was carried out by one reviewer working with an LLM-based agent (Claude, Anthropic) under the author's direction. A second reviewer (the corresponding author) independently assessed a sample of 30 reports blind to the first reviewer's decisions; agreement was summarised with Cohen's kappa and discrepancies were resolved with the full text or the abstract."),
  H1("6. Data charting"),
  P("One value per variable for each trial: occupational group; main delivery mode; intervention approach; mechanism; comparator; human support; burnout instrument (from the abstract or, if not named, from the full text); number of participants (randomized, or analysed where only that is reported); year of the first report. Multicomponent interventions were charted by the component presented as central. The charting data are in data/study_charting.csv."),
  H1("7. Registry linkage"),
  P("Completed interventional registrations in ClinicalTrials.gov with burnout as a condition and a digital term were linked to publications through the registration record and a search of Europe PMC for the registration number. For randomized registrations completed by the end of 2023, results were classified as reported in an included trial, reported outside the scope of the review, or not located."),
  H1("8. Synthesis"),
  P("Counts and percentages of trial characteristics, development over time in three periods (up to 2019, 2020-2022, 2023 onwards) and an evidence map of occupational group by intervention approach. Consistent with the purpose of a scoping review, risk of bias was not assessed and effect sizes were not synthesised."),
  H1("9. Data management and reproducibility"),
  P("Data, code and manuscript are public at https://github.com/fyodora2/5R. Abstracts from Web of Science and Scopus are not redistributed because of the databases' terms of use. Full-text articles are not redistributed."),
  H1("10. Deviations and steps added after the work began"),
  table(["Step", "What changed and why"], [
    ["Supplementary searches without the intervention block", "The main search required a psychological or behavioural intervention term, but the eligibility criteria admit any mechanism. The searches were repeated without that block in Europe PMC and OpenAlex (28 Sep 2026) and in Web of Science and Scopus (29 Sep 2026) after the author supplied the exports."],
    ["Registry linkage", "Added to examine publication of registered trials and to find reports missed by the databases."],
    ["Instrument from the full text", "Added because fewer than half of the abstracts named the burnout instrument; full texts were obtained where possible."],
    ["Third supplementary search", "A review of the trials found showed that the delivery vocabulary lacked virtual, remote, video and audio and that no search used MeSH. On 29 Sep 2026 a PubMed MeSH search and two delivery-term searches in Europe PMC were added. They were not repeated in OpenAlex, ERIC, Web of Science or Scopus."],
    ["Reclassification after full texts", "Two reports were changed after full texts were read: a trial that described itself as quasi-experimental but randomized teachers within schools was included, and a report that could not be retrieved initially was obtained, assessed and included. Three exclusions were confirmed."],
    ["Second reviewer sample", "Added to estimate agreement on the eligibility decisions; the sample was balanced by the first reviewer's decision."],
    ["Semantic clustering", "An exploratory text clustering was run and then dropped from the manuscript."],
  ], [30, 70]),
  H1("11. Limitations known at registration"),
  P("Single reviewer with an AI agent and a second-reviewer check on a sample only; assessment mainly on abstracts; PsycINFO, Embase and CENTRAL not searched; no citation chasing; searches added in stages, each of which found trials the previous one had missed, so further eligible trials probably remain; the registry check covers ClinicalTrials.gov only; the protocol was not registered in advance."),
];
const doc = new Document({
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Page ", PageNumber.CURRENT], font: FONT, size: 18 })] })] }) },
    children: body }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(path.join(__dirname, "protocol_retrospective.docx"), b); console.log("wrote protocol_retrospective.docx", b.length, "bytes"); });
