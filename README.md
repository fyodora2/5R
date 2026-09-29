# Randomized Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map

Data, code and manuscript for a PRISMA-ScR scoping review of randomized controlled trials that evaluated a
digital intervention in a working population and reported occupational burnout as an outcome.

- **Manuscript:** [`paper/burnout_scoping_review_paper.docx`](./paper/burnout_scoping_review_paper.docx) (Persian, with English abstract)
- **Evidence-map dashboard:** [`docs/dashboard.html`](./docs/dashboard.html) (self-contained; open in a browser)
- **Summary in Persian:** [`REPORT.md`](./REPORT.md)

## Main results

| | |
|---|---|
| Records identified (main search in five databases + supplementary search in two) | 2,393 |
| Records screened after de-duplication | 1,622 |
| Reports assessed for eligibility (147 main search, 42 supplementary search, 21 registry-linked) | 210 |
| **Included** | **103 reports of 100 randomized trials** |
| Trials first reported 2023–2026 | 62 (62.0%) |
| Trials in healthcare workers | 62 (62.0%) |
| Trials in teachers or other-sector employees | 31 (31.0%) |
| Trials with a non-psychological mechanism | 18 (18.0%) |
| Median participants randomized (IQR) | 118 (69–253) |
| Waitlist comparator | 35 (35.0%); 45.2% of trials from 2023 |
| Burnout instrument named in the abstract | 48 (48.0%) |
| Randomized registrations completed by 2023 with no results report located | 6 of 15 |

The search has two stages. The main search combines burnout, digital delivery, a psychological/behavioural
intervention block and randomized design. Because the eligibility criteria admit any mechanism, a supplementary
search in Europe PMC and OpenAlex repeats the query without the intervention block (14 additional trials, 9 with
non-psychological mechanisms). `data/master_registry.csv` is the single ledger of all 210 reports assessed.

## Eligibility criteria (applied in order; first failure recorded)

1. **REPORT**: primary report of trial results (not a protocol, registration, review, commentary, superseded preprint or secondary analysis)
2. **DESIGN**: randomized allocation with a between-group comparison
3. **POP**: workers (students, patients and general-public samples excluded)
4. **DIGITAL**: at least one core intervention component delivered digitally (voice telephone alone or digital assessment only does not qualify)
5. **BURNOUT**: burnout instrument or named burnout subscale reported as an outcome of the randomized comparison

## Data files (`data/`)

| File | Content |
|---|---|
| `master_registry.csv` | All 210 reports assessed for eligibility (R001–R210): identification route, decision, exclusion criterion, reason, basis, study ID |
| `study_charting.csv` | Study-level data charting for the 100 included trials (one mutually exclusive category per variable) |
| `supplementary_screening.csv`, `supplementary_assessed.json` | Every record screened in the supplementary search (titles and decisions) and the 45 reports assessed, with charting for the included ones |
| `raw_supplementary_*.json` | Raw retrievals of the supplementary search (Europe PMC, OpenAlex) |
| `study_summary.json` | Frequencies and cross-tabulations used in the manuscript |
| `registry_linkage.csv` | 28 completed ClinicalTrials.gov registrations: allocation, completion, results status, linked study |
| `registry_linked_publications.csv` | 21 registry-linked publications not already assessed via databases, with eligibility decision |
| `included_reports.json` | 103 included reports with bibliographic data and abstracts (see note below) |
| `scopus_batch_resolution.csv` | Abstract retrieval and decisions for Scopus records exported without abstracts |
| `raw_*.json`, `screened.json`, `openalex_*.json` | Raw API retrievals and screening output for the open sources |

**Web of Science / Scopus content:** these databases restrict bulk redistribution, so their raw exports are not
committed and their abstracts are replaced by a placeholder in `included_reports.json`. Screening and charting
used the full abstracts.

## Code

- `scripts/01_*`–`23_*`: retrieval, de-duplication and title/abstract screening per source.
- `scripts/final/eligibility_decisions.py`: eligibility assessment with the recorded reason for each report.
- `scripts/final/charting.py`, `study_level.py`: study-level charting and summary.
- `scripts/final/supplementary_search_*.py`, `supplementary_screening.py`: supplementary search without the intervention block, de-duplication, screening and eligibility decisions.
- `scripts/final/registry_linkage.py`: registry-to-publication linkage (ClinicalTrials.gov API v2, Europe PMC).
- `scripts/final/export_repo.py`: writes the `data/` files and checks that no restricted abstract is exported.
- `scripts/final/build_dashboard.py`: builds `docs/dashboard.html`.
- `paper/make_figures.py`, `paper/build_paper.js`: figures and manuscript (`cd paper && npm install && node build_paper.js`).

The `scripts/final` steps read an unsanitized working directory (`REVIEW_WORKDIR`) because they need the
Web of Science and Scopus abstracts; all outputs they write to `data/` are sanitized.

## AI use

Screening, eligibility assessment, data charting, registry linkage and manuscript drafting were done with an
LLM-based agent (Claude, Anthropic) under the corresponding author's direction. Every decision is recorded
with its reason in the data files above. There was no independent second human reviewer.
