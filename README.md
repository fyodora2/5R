# Randomized Trials of Digital Interventions Reporting Occupational Burnout Outcomes: A Scoping Review and Evidence Map

Data, code and manuscript for a PRISMA-ScR scoping review of randomized controlled trials that evaluated a
digital intervention in a working population and reported occupational burnout as an outcome.

- **Manuscript:** [`paper/burnout_scoping_review_paper.docx`](./paper/burnout_scoping_review_paper.docx) (English)
- **Evidence-map dashboard:** [`docs/dashboard.html`](./docs/dashboard.html) (self-contained; open in a browser)
- **Summary:** [`REPORT.md`](./REPORT.md)

## Main results

| | |
|---|---|
| Records identified (main search in five databases + three supplementary searches) | 4,406 |
| Records screened after de-duplication | 2,397 |
| Reports assessed for eligibility (147 main search, 120 supplementary searches, 21 registry-linked) | 288 |
| **Included** | **116 reports of 113 randomized trials** |
| Trials first reported 2023–2026 | 73 (64.6%) |
| Trials in healthcare workers | 70 (61.9%) |
| Trials in teachers or other-sector employees | 36 (31.9%) |
| Trials with a non-psychological mechanism | 19 (16.8%) |
| Median participants randomized (IQR) | 114.5 (69–238) |
| Waitlist comparator | 37 (32.7%); 40% of trials from 2023 |
| Burnout instrument named in the abstract | 56 (49.6%); identified from the full text for 54 of the other 57 |
| Randomized registrations completed by 2023 with no results report located | 6 of 15 |

The main search combines burnout, digital delivery, a psychological/behavioural intervention block and randomized
design. Because the eligibility criteria admit any mechanism, a supplementary search repeats the query without the
intervention block in Europe PMC and OpenAlex (28 Sep 2026) and in Web of Science and Scopus (29 Sep 2026); a third
search (29 Sep 2026) added a PubMed MeSH search and delivery terms that the earlier strings lacked (virtual, remote,
video, audio, coaching programmes). Together the supplementary searches found 27 additional trials, 10 with
non-psychological mechanisms. `data/master_registry.csv` is the single ledger of all 288
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
| `master_registry.csv` | All 288 reports assessed for eligibility (R001–R288): identification route, decision, exclusion criterion, reason, basis, study ID |
| `study_charting.csv` | Study-level data charting for the 113 included trials (one mutually exclusive category per variable) |
| `study_id_map.csv`, `recoding_d8.csv`, `taxonomy_d8.md` | Frozen report-to-study IDs; the written rules and per-trial recoding of the "other psychological" and "other-sector employee" groups |
| `abstract_reporting_indicators.csv` | Five reporting indicators coded from the abstracts (stated / not stated in the abstract; not a quality or risk-of-bias assessment) |
| `effect_direction_abstract.csv` | Direction of the burnout result as reported in the abstract (not an effect estimate) |
| `abstract_coding_verification_sample.csv` | Random 20% sample (23 trials, fixed seed) with the first coder's, the second reviewer's and the final codes |
| `third_search_screening.csv`, `third_search_assessed.json`, `raw_third_search.json` | Third supplementary search (PubMed MeSH check and delivery-term searches in Europe PMC): queries, retrieved records, every screened record and decision, assessed reports with charting |
| `supplementary_screening.csv`, `supplementary_assessed.json` | Every record screened in the Europe PMC/OpenAlex supplementary search (titles and decisions) and the reports assessed, with charting |
| `wos_scopus_supplementary_screening.csv`, `wos_scopus_supplementary_assessed.json` | The same for the Web of Science/Scopus supplementary search (no abstract text) |
| `raw_supplementary_*.json` | Raw retrievals of the supplementary search (Europe PMC, OpenAlex) |
| `study_summary.json` | Frequencies and cross-tabulations used in the manuscript |
| `registry_linkage.csv` | 28 completed ClinicalTrials.gov registrations: allocation, completion, results status, linked study |
| `registry_linked_publications.csv` | 21 registry-linked publications not already assessed via databases, with eligibility decision |
| `instrument_fulltext_verification.csv` | Burnout instrument identified from the full text for the trials whose abstracts did not name it (evidence location and check) |
| `instrument_not_named_fulltext_status.csv` | Full-text availability for those trials |
| `second_review_sample.csv` | Blind second-reviewer decisions on 30 assessed reports compared with the ledger |
| `included_reports.json` | 116 included reports with bibliographic data and abstracts (see note below) |
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
- `scripts/final/third_search.py`: de-duplication, screening and eligibility decisions for the third supplementary search; `record_ids.py` keeps report and study identifiers stable.
- `scripts/final/apply_fulltext_updates.py`: decisions changed after full texts were obtained (X185).
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
