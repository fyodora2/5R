# Randomized Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map

Data, code and manuscript for a PRISMA-ScR scoping review of randomized controlled trials that evaluated a
digital intervention in a working population and reported occupational burnout as an outcome.

- **Manuscript:** [`paper/burnout_scoping_review_paper.docx`](./paper/burnout_scoping_review_paper.docx) (English)
- **Evidence-map dashboard:** [`docs/dashboard.html`](./docs/dashboard.html) (self-contained; open in a browser)
- **Summary:** [`REPORT.md`](./REPORT.md)

## Main results

| | |
|---|---|
| Records identified (main search in five databases + supplementary search in four) | 3,488 |
| Records screened after de-duplication | 1,891 |
| Reports assessed for eligibility (147 main search, 66 supplementary searches, 21 registry-linked) | 234 |
| **Included** | **110 reports of 107 randomized trials** |
| Trials first reported 2023–2026 | 67 (62.6%) |
| Trials in healthcare workers | 67 (62.6%) |
| Trials in teachers or other-sector employees | 33 (30.8%) |
| Trials with a non-psychological mechanism | 23 (21.5%) |
| Median participants randomized (IQR) | 119 (69–252) |
| Waitlist comparator | 35 (32.7%); 41.8% of trials from 2023 |
| Burnout instrument named in the abstract | 50 (46.7%); identified from the full text for 56 of the other 57 |
| Randomized registrations completed by 2023 with no results report located | 6 of 15 |

The main search combines burnout, digital delivery, a psychological/behavioural intervention block and randomized
design. Because the eligibility criteria admit any mechanism, a supplementary search repeats the query without the
intervention block in Europe PMC and OpenAlex (28 Sep 2026) and in Web of Science and Scopus (29 Sep 2026): 20
additional trials, 13 with non-psychological mechanisms. `data/master_registry.csv` is the single ledger of all 234
reports assessed.

## Eligibility criteria (applied in order; first failure recorded)

1. **REPORT**: primary report of trial results (not a protocol, registration, review, commentary, superseded preprint or secondary analysis)
2. **DESIGN**: randomized allocation with a between-group comparison
3. **POP**: workers (students, patients and general-public samples excluded)
4. **DIGITAL**: at least one core intervention component delivered digitally (voice telephone alone or digital assessment only does not qualify)
5. **BURNOUT**: burnout instrument or named burnout subscale reported as an outcome of the randomized comparison

## Data files (`data/`)

| File | Content |
|---|---|
| `master_registry.csv` | All 234 reports assessed for eligibility (R001–R234): identification route, decision, exclusion criterion, reason, basis, study ID |
| `study_charting.csv` | Study-level data charting for the 107 included trials (one mutually exclusive category per variable) |
| `supplementary_screening.csv`, `supplementary_assessed.json` | Every record screened in the Europe PMC/OpenAlex supplementary search (titles and decisions) and the reports assessed, with charting |
| `wos_scopus_supplementary_screening.csv`, `wos_scopus_supplementary_assessed.json` | The same for the Web of Science/Scopus supplementary search (no abstract text) |
| `raw_supplementary_*.json` | Raw retrievals of the supplementary search (Europe PMC, OpenAlex) |
| `study_summary.json` | Frequencies and cross-tabulations used in the manuscript |
| `registry_linkage.csv` | 28 completed ClinicalTrials.gov registrations: allocation, completion, results status, linked study |
| `registry_linked_publications.csv` | 21 registry-linked publications not already assessed via databases, with eligibility decision |
| `instrument_fulltext_verification.csv` | Burnout instrument identified from the full text for the trials whose abstracts did not name it (evidence location and check) |
| `instrument_not_named_fulltext_status.csv` | Full-text availability for those trials |
| `second_review_sample.csv` | Blind second-reviewer decisions on 30 assessed reports compared with the ledger |
| `included_reports.json` | 110 included reports with bibliographic data and abstracts (see note below) |
| `scopus_batch_resolution.csv` | Abstract retrieval and decisions for Scopus records exported without abstracts |
| `raw_*.json`, `screened.json`, `openalex_*.json` | Raw API retrievals and screening output for the open sources |

**Web of Science / Scopus content:** these databases restrict bulk redistribution, so their raw exports are not
committed and their abstracts are replaced by a placeholder in `included_reports.json`. Screening and charting
used the full abstracts.

## Code

- `scripts/01_*`–`23_*`: retrieval, de-duplication and title/abstract screening per source.
- `scripts/final/eligibility_decisions.py`: eligibility assessment with the recorded reason for each report.
- `scripts/final/charting.py`, `study_level.py`: study-level charting and summary.
- `scripts/final/wos_scopus_supplementary.py`: de-duplication, screening and eligibility for the Web of Science/Scopus supplementary exports.
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
with its reason in the data files above. A second human reviewer (the corresponding author) independently assessed a blind sample of 30 reports (agreement 80%, kappa 0.60; `data/second_review_sample.csv`); the remaining reports were assessed by one reviewer.
