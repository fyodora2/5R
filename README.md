# 5R — Randomized Digital Psychological Interventions for Occupational Burnout

A computational scoping-review pipeline: searches free scientific infrastructure (Europe PMC REST API),
screens and codes randomized trials of digital psychological interventions for occupational burnout,
clusters abstracts semantically, and maps trends over time.

See [`REPORT.md`](./REPORT.md) for the full methods and results write-up (in Persian).

**Interactive dashboard:** [`docs/dashboard.html`](./docs/dashboard.html) — open it directly in a browser (self-contained, no server needed) to explore the temporal trends, evidence-map heatmaps, semantic cluster scatter plot, and a searchable/filterable table of all 85 studies. `docs/dashboard_template.html` is the un-filled template (`__DATA_JSON__` placeholder) that `scripts/06_prep_dashboard.py` fills from `data/final_analysis.json`.

## Structure

- `scripts/01_fetch_europepmc.py` — queries Europe PMC (no API key needed) with a four-concept boolean query (burnout × digital × psychological × randomized).
- `scripts/02_dedupe_screen.py` — deduplicates (exact key + near-duplicate title matching) and applies rule-based PRISMA-ScR-style title/abstract screening.
- `scripts/03_code_categories.py` — multi-label keyword coding across six dimensions (occupation, technology, psychological approach, burnout instrument, comparator, guidance).
- `scripts/04_cluster.py` — TF-IDF + KMeans semantic clustering of abstracts, with silhouette-based k selection.
- `scripts/05_analysis.py` — temporal trend tables and evidence-map crosstabs; exports `data/final_analysis.json` and `data/coded_dataset.csv`.
- `scripts/06_prep_dashboard.py` — folds long-tail categories into "Other" (fixed 8-slot categorical budget) and exports the compact `data/dashboard_data.json` embedded in the dashboard.

Run the full pipeline:

```bash
pip install -r scripts/requirements.txt
python3 scripts/01_fetch_europepmc.py 5000
python3 scripts/02_dedupe_screen.py
python3 scripts/03_code_categories.py
python3 scripts/04_cluster.py
python3 scripts/05_analysis.py
```

## Data

- `data/raw_europepmc.json` — 227 raw records
- `data/screened.json` — 213 deduplicated records with include/exclude/uncertain screening decisions
- `data/coded.json` / `data/coded_dataset.csv` — 85 included studies, fully coded
- `data/clustered.json` — coded studies + semantic cluster assignment + 2D projection
- `data/final_analysis.json` — aggregated summary, temporal breakdowns, evidence-map crosstabs (source for the dashboard)

## Limitations

Single-database search, single-pass automated screening (no dual human review of full text), and
abstract-level coding. See §9 of `REPORT.md` for the full limitations discussion before treating
this as a publication-ready scoping review.
