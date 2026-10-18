// Builds response_to_reviewer_comments.docx: point-by-point response to the pre-submission review of the manuscript.
// Numbers come from build_stats.json (written by build_paper.js) so that the response cannot drift from the manuscript.
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, Footer, PageNumber } = require("docx");
const S = JSON.parse(fs.readFileSync(path.join(__dirname, "build_stats.json"), "utf8"));
const FONT = "Times New Roman";
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 21, ...o });
const P = (s, o = {}) => new Paragraph({ children: [t(s)], spacing: { after: 120, line: 290 }, ...o });
const H = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 }, children: [t(s, { bold: true, size: 26 })] });
const bd = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
function cellParas(txt, bold) { return String(txt).split("\n").map((l) => new Paragraph({ spacing: { after: 60 }, children: [t(l, { bold, size: 19 })] })); }
function table(head, rows, widths) {
  const W = 9900; const cw = widths.map((w) => Math.round((W * w) / widths.reduce((a, b) => a + b, 0)));
  const cell = (txt, i, hd) => new TableCell({ width: { size: cw[i], type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, shading: hd ? { type: ShadingType.CLEAR, fill: "EDEDED" } : undefined, children: cellParas(txt, hd) });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, true)) }), ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) }))] });
}
const DONE = "Done", PART = "Partly done", NOT = "Not done";
const rows = [
  // ---- methodological
  ["1", "Search strategy narrower than the eligibility criteria (intervention-type block).",
   `Agreed. The eligibility criteria admit any mechanism, so the four-block main strategy was too narrow. The earlier supplementary searches (no intervention block; MeSH; extra delivery terms) had already reduced the gap. We added one unified strategy (burnout AND any digital-delivery term AND randomised design) on 18 October 2026 in Europe PMC (all years), OpenAlex and PubMed (published from 1 September 2026): 554 records, 64 new, 6 assessed, 2 trials included. All counts, figures and tables were updated. Known-item check: a unified Europe PMC search alone retrieved ${S.uniHit} of the ${S.reports} included reports (unified_search_validation.csv), so no single database suffices.\nStill missing, and stated as limitations: the unified strategy was not repeated in Web of Science, Scopus or ERIC; PsycINFO, Embase and CENTRAL were not searched (no access); reference lists were not checked; no information specialist reviewed the strings.`, "Sections 2.3, 3.1, 4.4; Supplementary Appendix A, Table S2", PART],
  ["2", "Appendix A gives abbreviated strings (\"as for Web of Science\", \"the same four blocks\").",
   "Every database now has its full string, field and date. Strings for Europe PMC, OpenAlex, ERIC, PubMed and the update search are the strings stored with the retrieved records. The Web of Science and Scopus strings were entered in the interfaces by the author and were not archived verbatim by the tool; the author should compare them with the saved search histories of both platforms before submission.", "Supplementary Appendix A", DONE],
  ["3", "Selection and charting by a single reviewer with AI; independent checks on small samples; AI must not be presented as an independent second reviewer.",
   "The AI assistant is now described as the first reviewer, not as independent of the author's direction, and the roles are separated: rule-based classifier (could only exclude), assistant (read the remaining records and proposed decisions and codes), author (decided borderline reports, obtained full texts, completed the blind and verification samples). The two quality controls are reported separately (blind sample of 30 reports: 80% agreement, kappa 0.60; abstract-level coding: 23 trials, 74% agreement on direction, 96% on indicators). Files: second_review_sample.csv, abstract_coding_verification_sample.csv. The limitation is stated plainly.\nNot done: independent human reassessment of all 294 assessed reports and of the charted variables of all trials. This needs a second human reviewer, which was not available.", "Sections 2.4, 2.5, 2.7, 4.4", PART],
  ["4", "The repository named in the data statement is empty.",
   "Correct for the default branch: the work was on a development branch. The branch is now the default branch (data, code, protocol, dictionary and framework are visible without logging in). For double-blind review the repository link is withheld from the blinded manuscript and given on the title page. An archived release with a DOI (for example Zenodo) is recommended; it must be created by the author. Open the public link in a logged-out browser before submitting.", "Declarations; title page; data/DATA_DICTIONARY.md", PART],
  ["5", "Eligibility was assessed on abstracts, not full texts; \"assessed in full\" is ambiguous.",
   `The ambiguous wording was removed. The manuscript says that decisions rested on titles and abstracts except for ${S.fulltext} reports in which the full text was consulted, and that the abstract-based assessment is a limitation. Not done: full-text retrieval and assessment of all reports that passed screening.`, "Sections 2.4, 4.4", PART],
  ["6", "Burnout criterion: three trials without a determined instrument; single-item measures; trials with burnout unrelated to the aim (title and criteria must agree).",
   `The criterion now says that the intervention's aim does not matter if burnout is reported as an outcome of the randomised comparison; correlates, risk factors and general well-being indices are excluded; short and single-item measures presented as burnout measures are accepted. Applying this exposed an inconsistency: one weight-reduction trial with burnout as a secondary outcome had been excluded as "unrelated to the aim", while another trial of the same kind had been included. It was read in full text (single-item scale and MBI emotional exhaustion) and included. The ${S.undetermined} trials with an undetermined instrument and ${S.singleItem} with a single-item measure are listed in the data files; they stay included because burnout was reported as an outcome by the authors.`, "Supplementary Table S1; Sections 2.2, 2.5", DONE],
  ["7", "PRISMA flow: split the 2,009 records removed before screening; say how many were removed by the classifier.",
   "The box now separates duplicates in the four later searches (exactly counted) from duplicates and non-article records in the main search, for which the two counts were not recorded separately at the time and cannot be reconstructed reliably. The split of records excluded at screening between classifier and manual review was not recorded.", "Figure 1; Supplementary Table S2", PART],
  ["8", "Participant total mixes randomised and analysed numbers.",
   `The denominator is now stated (trials with sample size reported) and the definition (randomised, or analysed where only that was reported) is in the Methods. The total is descriptive. Not done: separate columns for randomised and analysed numbers in the data file.`, "Sections 2.5, 3.2", PART],
  ["9", "Registry analysis: do not read 'no results' as unpublished; state where results were sought.",
   "The wording is \"no results report located\" throughout, and the limitation (ClinicalTrials.gov only; reports without registration numbers could be missed) is stated. Not done: contact with investigators or search of other registries.", "Sections 3.5, 4.3, 4.4; Supplementary Table S4", PART],
  ["10", "Appendix C must allow independent identification of each included trial.",
   "Appendix C1 lists a full citation (authors, title, journal, year, volume, pages, DOI, PMID) for all 119 included reports with study and report identifiers (data/included_citations.csv). Registration numbers per trial and a separate column explaining why reports were merged are not added; the two multi-report trials are identified by shared study identifier and the merging rule is in Section S3.", "Supplementary Appendix C", PART],
  ["11", "Interpret cautiously (growth in trials, waitlists, favourable abstracts, missing indicators, pilots).",
   "Rewritten: growth describes identified and published trials; waitlist change is descriptive; the 'favours the intervention' codes are reporting codes, not effectiveness; a missing indicator is not proof of omission; abstract and conclusions were aligned.", "Sections 3.4, 4.1, 4.3; Abstract; Conclusions", DONE],
  ["12", "Absence of a registered protocol and of risk-of-bias assessment are not fatal if reported.",
   "No change needed. The retrospective protocol is supplied and described as retrospective. Registration on OSF is still to be done by the author; if done, add the date and DOI.", "Section 2.1", DONE],
  // ---- journal format
  ["13", "Confirm that the journal accepts a scoping review and evidence map under 'Review Article'.",
   "Cannot be settled by editing. A question for the editorial office is included in the cover-letter draft.", "submission_metadata.docx", NOT],
  ["14", "Main text above 3000 words.",
   `Introduction to Conclusions, including headings and figure and table captions but excluding the abstract, tables, declarations and references, is ${S.mainWords} words. Long methods and results moved to a supplementary file.`, "Main text; Supplementary material", DONE],
  ["15", "Seven tables and three figures against a limit of five.", "Two tables and three figures remain in the main text; five tables (eligibility, sources and flow, abstract-level reporting, registry, comparison with earlier reviews) are in the supplement and referred to in the text.", "Tables 1-2; Figures 1-3; Supplementary Tables S1-S5", DONE],
  ["16", "Abstract above 250 words and not in the required structure.", `Abstract rewritten with Objectives, Study design, Methods, Results and Conclusions: ${S.absWords} words including the headings; six keywords.`, "Abstract", DONE],
  ["17", "References: AMA, numbered superscript citations in order of first appearance.", `Citations are superscript numbers in order of first use; ${S.refs} references are in AMA 11th edition style with journal abbreviations in italics. Not done: a check with a reference manager and journal-abbreviation database.`, "Text; References", PART],
  ["18", "Double-blind review: separate title page; no identifying information.", "A separate title page was made. The blinded manuscript has no names, affiliations or repository link, and an empty author property. Use manuscript_blinded.docx for the blinded upload, not the tracked-changes file, whose properties come from the uploaded file and may contain a user name.", "title_page.docx; manuscript_blinded.docx", DONE],
  ["19", "Generative-AI statement in the journal's format; describe AI use in the Methods.", "A statement titled \"Declaration of generative AI and AI-assisted technologies in the writing process\" precedes the references, and Section 2.7 describes AI use in the research process. The model version and the prompts are not reported: the assistant was used interactively, and reproducibility rests on the recorded decisions and published code.", "Section 2.7; Declarations", PART],
  ["20", "Other items: cover letter, author contributions, funding, ethics, PRISMA-ScR checklist with page numbers, figure files, final proofing.", "Cover-letter draft, funding, competing-interests and ethics statements exist. Author names, affiliations, ORCID, contributions, telephone and journal name are placeholders that only the author can supply. The PRISMA-ScR checklist points to sections and supplementary items, not page numbers. Figures are PNG files in the repository. Automated proofing was done (citations, table and figure order, counts); a human read-through is still advisable.", "title_page.docx; submission_metadata.docx; Supplementary Appendix E", PART],
  ["21", "British English; consistent use of trial, study, report, record and registration.", "Prose, headings, table labels and figures were converted to British spelling; official names, titles of cited papers and search strings were left as published. The terms are used in one sense each (a report is one article, a trial may have several reports, a record is a database entry).", "All files", DONE],
  ["22", "Results: avoid repeating tables in prose.", "The Results were shortened to the main findings; detail is in the supplement.", "Section 3", DONE],
];
const body = [
  new Paragraph({ spacing: { after: 120 }, children: [t("Response to the pre-submission review", { bold: true, size: 30 })] }),
  new Paragraph({ spacing: { after: 240 }, children: [t("Randomised Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map", { bold: true, size: 24 })] }),
  P(`The review's comments were addressed in the revised manuscript. The update search added two trials and the re-check of the burnout criterion added one, so the evidence base is now ${S.trials} trials in ${S.reports} reports (${S.assessed} reports assessed; ${S.identified.toLocaleString("en-US")} records identified, ${S.screened.toLocaleString("en-US")} screened). Each row below states what was done, what was not, and where to find it. "Not done" and "partly done" mean that the manuscript says so openly.`),
  H("Point-by-point response"),
  table(["#", "Comment (summary)", "Response and action", "Where", "Status"], rows, [4, 20, 52, 14, 8]),
  H("What only the author can do"),
  ...[
    "Supply author names, affiliations, ORCID, contributions, telephone and the journal; ask the editorial office whether a scoping review and evidence map fits the Review Article category.",
    "Check the Web of Science and Scopus strings in Appendix A against the saved search histories; archive a release of the repository with a DOI and check that the public links open without logging in.",
    "Decide whether to commission a second human reviewer for all 294 reports (and the variables of all trials), to search PsycINFO, Embase and CENTRAL, to repeat the unified search in Web of Science and Scopus, and to register the retrospective protocol on OSF. Each would strengthen the paper; none is needed for the text to be honest.",
    "Two borderline exclusions remain open (two WeChat text-message trials without a burnout outcome in their abstracts; one trial whose abstract shows no burnout result and whose full text is not at hand).",
  ].map((s) => P("• " + s)),
];
const doc = new Document({
  creator: "", title: "Response to the pre-submission review",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  sections: [{ properties: { page: { size: { width: 11907, height: 16840, orientation: "portrait" }, margin: { top: 1000, right: 900, bottom: 1000, left: 900 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 })] })] }) }, children: body }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(path.join(__dirname, "response_to_reviewer_comments.docx"), b); console.log("wrote response_to_reviewer_comments.docx", b.length); });
