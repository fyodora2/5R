# 5R — Randomized Digital Psychological Interventions for Occupational Burnout

A computational scoping-review pipeline: searches three free scientific databases (Europe PMC, OpenAlex,
ERIC), screens and codes randomized trials of digital psychological interventions for occupational
burnout, clusters abstracts semantically, maps trends over time, and cross-checks ClinicalTrials.gov
for a publication-bias signal.

See [`REPORT.md`](./REPORT.md) for the full methods and results write-up (in Persian). Final corpus: **116**
included studies (85 Europe PMC + 30 OpenAlex + 1 ERIC).

**Interactive dashboard:** [`docs/dashboard.html`](./docs/dashboard.html) — open it directly in a browser (self-contained, no server needed) to explore the temporal trends, evidence-map heatmaps, semantic cluster scatter plot, and a searchable/filterable table of all 116 studies (filterable by source database too). `docs/dashboard_template.html` is the un-filled template (`__DATA_JSON__` placeholder) that `scripts/15_prep_dashboard_all.py` fills from `data/final_analysis_all.json`.

## Structure

### Stage 1 — Europe PMC only (original pass, n=85)

- `scripts/01_fetch_europepmc.py` — queries Europe PMC (no API key needed) with a four-concept boolean query (burnout × digital × psychological × randomized).
- `scripts/02_dedupe_screen.py` — deduplicates (exact key + near-duplicate title matching) and applies rule-based PRISMA-ScR-style title/abstract screening.
- `scripts/03_code_categories.py` — multi-label keyword coding across six dimensions (occupation, technology, psychological approach, burnout instrument, comparator, guidance).
- `scripts/04_cluster.py` — TF-IDF + KMeans semantic clustering of abstracts, with silhouette-based k selection.
- `scripts/05_analysis.py` — temporal trend tables and evidence-map crosstabs; exports `data/final_analysis.json` and `data/coded_dataset.csv`.
- `scripts/06_prep_dashboard.py` — single-source dashboard data prep (superseded by stage 2 below).

### Stage 2 — add OpenAlex + ERIC, merge, re-cluster (final, n=116)

- `scripts/07_fetch_openalex.py` — same four-concept query against OpenAlex's `title_and_abstract.search`, using a personal API key (bypasses the shared-IP free-tier rate limit).
- `scripts/08_fetch_eric.py` — same query against ERIC (free education-research database), specifically to test whether the "teachers under-represented" finding was a Europe-PMC-specific artifact.
- `scripts/09_openalex_crossdb_dedupe.py` — removes OpenAlex records already found via Europe PMC (exact DOI + near-duplicate title) and drops unusable types (reviews, dissertations, editorials, no-abstract records).
- `scripts/10_screen_openalex.py` — automated rule-based screening of the new-only OpenAlex candidates.
- `scripts/11_openalex_manual_reconcile.py` — a documented manual pass removing conference-abstract companion reports, a study protocol, a mis-screened PROSPERO registration, and OpenAlex's own internal duplicate indexing.
- `scripts/12_merge_all_sources.py` — merges Europe PMC + OpenAlex + ERIC into one corpus and applies the same coding dictionaries to every record.
- `scripts/13_cluster_all.py` / `scripts/14_analysis_all.py` — re-run clustering and analysis on the full 116-study corpus; exports `data/final_analysis_all.json` and `data/coded_dataset_all.csv`.
- `scripts/15_prep_dashboard_all.py` — exports `data/dashboard_data_all.json`, embedded in `docs/dashboard.html`.

Run the full pipeline:

```bash
pip install -r scripts/requirements.txt
python3 scripts/01_fetch_europepmc.py 5000
python3 scripts/02_dedupe_screen.py
python3 scripts/03_code_categories.py
python3 scripts/04_cluster.py
python3 scripts/05_analysis.py
python3 scripts/07_fetch_openalex.py 3000   # edit in your own OpenAlex API key first
python3 scripts/08_fetch_eric.py
python3 scripts/09_openalex_crossdb_dedupe.py
python3 scripts/10_screen_openalex.py
python3 scripts/11_openalex_manual_reconcile.py
python3 scripts/12_merge_all_sources.py
python3 scripts/13_cluster_all.py
python3 scripts/14_analysis_all.py
python3 scripts/15_prep_dashboard_all.py
```

## Data

Stage 1 (Europe PMC only):
- `data/raw_europepmc.json`, `data/screened.json` — 227 raw → 213 unique, with screening decisions
- `data/coded.json` / `data/coded_dataset.csv` — 85 included studies, fully coded
- `data/clustered.json`, `data/final_analysis.json`, `data/dashboard_data.json`

Stage 2 (OpenAlex + ERIC added):
- `data/raw_openalex.json` (716 raw), `data/openalex_new_candidates.json` (315 new-only), `data/openalex_screened.json`, `data/openalex_final_new.json` (30 final)
- `data/raw_eric.json` (8 candidates, 1 included)
- `data/coded_all.json`, `data/clustered_all.json` — the merged 116-study corpus
- `data/final_analysis_all.json` / `data/coded_dataset_all.csv` — final aggregated output (source for the dashboard)
- `data/dashboard_data_all.json` — compact data embedded in `docs/dashboard.html`
- `data/clinicaltrials_gov.json` — supplementary registry check (publication-bias signal, not part of the included corpus)

## Limitations

PsycINFO, Cochrane CENTRAL, and Scopus/Web of Science are still not covered (no free API from this
environment). OpenAlex screening includes one documented manual reconciliation pass but is not a full
dual-human-reviewer process. Citation chasing (forward/backward snowballing via OpenAlex's citation
graph) was not run in this pass. See §10 of `REPORT.md` for the full limitations discussion before
treating this as a publication-ready scoping review.
