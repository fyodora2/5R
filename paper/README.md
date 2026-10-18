# Manuscript and submission files

Built by `node build_paper.js` (blinded manuscript, title page, supplementary material), `node build_protocol.js`,
`node build_metadata.js` and `node build_response.js`; figures by `python3 make_figures.py`.

| File | Content |
|---|---|
| `manuscript_blinded.docx` | Main text for double-blind review: abstract (Objectives, Study design, Methods, Results, Conclusions), Introduction to Conclusions (under 3,000 words), 2 tables, 3 figures, declarations, AI declaration, AMA references with superscript citations |
| `title_page.docx` | Title page with author details, declarations and the repository link (not for blinded review) |
| `supplementary_material.docx` | Detailed methods and results, Tables S1-S5, Appendices A (complete search strings), B (excluded reports), C (full citations and charted variables of the included trials), D (registrations), E (PRISMA-ScR checklist) |
| `protocol_retrospective.docx` | Retrospective protocol |
| `submission_metadata.docx` | Submission metadata, key points, cover-letter draft, checklist |
| `response_to_reviewer_comments.docx` | Point-by-point response to the pre-submission review |
| `figures/` | Figure files |

`submission/` at the repository root holds the same files plus the tracked-changes version of the manuscript
(`manuscript_tracked_changes.docx`, made by `scripts/final/make_tracked_changes.py` from the file submitted for review).

Every number in the text and tables is computed at build time from the data files; the build stops if the corpus
differs from 301 assessed reports, 121 included reports and 118 trials, or if the main text exceeds 3,000 words.
Items that only the author can supply are shown in [square brackets].
