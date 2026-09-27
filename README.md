# 5R — Randomized Digital Interventions Reporting Occupational Burnout Outcomes

A computational scoping-review pipeline: searches five databases (Europe PMC, OpenAlex, and ERIC — all
free; Web of Science and Scopus — via the user's own institutional access), screens and codes randomized
trials of digital interventions reporting occupational burnout outcomes, clusters abstracts semantically,
maps trends over time, and cross-checks ClinicalTrials.gov for a registry-matching signal.

See [`REPORT.md`](./REPORT.md) for the full methods and results write-up (in Persian). Final corpus: **145**
included reports (84 Europe PMC + 29 OpenAlex + 18 Web of Science + 13 Scopus + 1 ERIC), corresponding to a
current maximum of approximately 143 independent trials (three "WISER" reports describe a single trial —
this is a ceiling on trials identified so far, not a lower bound; reproducible from `data/master_registry.csv`).
141 reports use a classically psychological approach; 4 documented borderline hybrid/non-psychological-mechanism
cases are retained under the broad eligibility criterion (option b — any digital intervention in a working
population reporting burnout as an outcome).

This corpus went through four rounds of correction after documented manual screening-validation passes and
successive pre-submission reviews: round 1 removed a duplicate preprint and a study-protocol record
mistakenly treated as a completed trial (139→137); round 2 added one further eligible study recovered via a
Crossref lookup on previously-unresolved Scopus titles (137→138); round 3 extended that search to full text
(Europe PMC, publisher pages) for the remaining unresolved Scopus titles, finding 6 more eligible studies and
1 duplicate of an already-included record (138→144); round 4 completed a full re-check of every one of the 44
originally-unresolved Scopus titles (not just a partial pass), finding 1 more eligible study that had been
missed in round 3 and reaching a documented exclusion decision for all 36 remaining titles, so that none are
left unresolved (144→145). Round 4 also corrected a real inconsistency (the independent-trial estimate said
"~142" in the Abstract but "~136" in the Limitations/Conclusion, both stale after round 3; the occupation
table said n=66 for "General/mixed working adults" while the prose said n=65) and moved all project work into
this repository, which is the one designated for this task (earlier rounds had been mistakenly committed to a
different, undesignated repository). See §7 of `REPORT.md`, `paper/README.md`, and
`data/scopus_batch_resolution.csv` for the full account.

**Interactive dashboard:** [`docs/dashboard.html`](./docs/dashboard.html) — open it directly in a browser (self-contained, no server needed) to explore the temporal trends, evidence-map heatmaps, semantic cluster scatter plot, and a searchable/filterable table of all 145 studies (filterable by source database too). `docs/dashboard_template.html` is the un-filled template (`__DATA_JSON__` placeholder) that `scripts/15_prep_dashboard_all.py` fills from `data/final_analysis_all.json`.

**Manuscript:** [`paper/burnout_scoping_review_paper.docx`](./paper/burnout_scoping_review_paper.docx) — a PRISMA-ScR-structured scoping review write-up (Persian, with an English abstract) with four figures generated straight from the repo's own data. See [`paper/README.md`](./paper/README.md) for structure and how to rebuild it.

## Data-handling note (Web of Science / Scopus)

Europe PMC, OpenAlex, and ERIC are open metadata services designed for bulk/API reuse. Web of Science and
Scopus are not — their subscription terms generally restrict bulk redistribution of database content. So:

- The raw exports (`savedrecs.xls` from WoS, the Scopus results-page capture) are **not committed** to this
  repository.
- The 31 studies sourced from WoS/Scopus keep only title, year, DOI, journal, and this project's own coded
  tags in `data/coded_all.json` — their original abstract text is replaced with a placeholder. **One
  exception:** a study discovered via the Scopus title capture but whose text was retrieved from a fully
  open-access journal (JMIR, DOI 10.2196/jmir.954) carries its full abstract, flagged in the data with
  `abstract_open_license: true` — its content has no redistribution restriction, unlike WoS/Scopus's own
  aggregated exports.
- Screening and coding for those studies was performed against the full abstract during the session; only
  the stored output is restricted.

## Reproducibility files

- `data/master_registry.csv` — one row per included report (all 145), with its source database, DOI, and
  trial-family group (e.g. "WISER" for the 3 reports of that one trial); every count in the manuscript that
  depends on "reports vs. independent trials" is reproducible directly from this file.
- `data/scopus_batch_resolution.csv` — one row per each of the 44 originally-unresolved Scopus titles, with
  its final decision (included / duplicate / excluded) and, for excluded titles, the specific reason.

## Structure

### Stage 1 — Europe PMC only (original pass, n=85)

- `scripts/01_fetch_europepmc.py` — queries Europe PMC (no API key needed) with a four-concept boolean query (burnout × digital × psychological × randomized).
- `scripts/02_dedupe_screen.py` — deduplicates (exact key + near-duplicate title matching) and applies rule-based PRISMA-ScR-style title/abstract screening.
- `scripts/03_code_categories.py` — multi-label keyword coding across six dimensions (occupation, technology, psychological approach, burnout instrument, comparator, guidance).
- `scripts/04_cluster.py` — TF-IDF + KMeans semantic clustering of abstracts, with silhouette-based k selection.
- `scripts/05_analysis.py` — temporal trend tables and evidence-map crosstabs; exports `data/final_analysis.json` and `data/coded_dataset.csv`.
- `scripts/06_prep_dashboard.py` — single-source dashboard data prep (superseded below).

### Stage 2 — add OpenAlex + ERIC (n=116)

- `scripts/07_fetch_openalex.py` — same four-concept query against OpenAlex's `title_and_abstract.search`. Reads the API key from the `OPENALEX_API_KEY` env var (a personal key avoids the shared-IP free-tier rate limit; the script still runs without one, just slower/limited).
- `scripts/08_fetch_eric.py` — same query against ERIC, specifically to test whether "teachers under-represented" was a Europe-PMC-specific artifact.
- `scripts/09_openalex_crossdb_dedupe.py` — removes OpenAlex records already found via Europe PMC and drops unusable types (reviews, dissertations, editorials, no-abstract records).
- `scripts/10_screen_openalex.py` — automated screening of the new-only OpenAlex candidates.
- `scripts/11_openalex_manual_reconcile.py` — documented manual pass removing conference-abstract companion reports, a protocol, a mis-screened PROSPERO registration, and internal duplicate indexing.

### Stage 3 — add Web of Science + Scopus (final, n=145)

- `scripts/16_process_wos_export.py` — parses a WoS "Full Record" export (`savedrecs.xls`, user-supplied, not included) and cross-dedupes against the corpus so far.
- `scripts/17_screen_wos.py` — automated screening of new-only WoS candidates.
- `scripts/18_wos_manual_reconcile.py` — documented manual pass excluding 14 trial protocols (a systematic screen weakness: a protocol's abstract describes a planned control arm in future tense, which satisfies the same regex a completed trial does) and 2 false positives.
- `scripts/19_scopus_dedupe.py` — dedupes a Scopus results-page title capture (`scopus_visible_pages_382.csv`, user-supplied, not included — the official bulk export was unavailable) against the corpus.
- `scripts/20_scopus_openalex_lookup.py` — since the Scopus capture has no abstract, resolves each new title against OpenAlex by title match.
- `scripts/21_screen_scopus.py` — automated screening of the resolved abstracts.
- `scripts/22_scopus_manual_reconcile.py` — documented manual pass; also adds the one record with no abstract anywhere, resolved instead via its ClinicalTrials.gov registration (public domain); later rounds extended this with a Crossref lookup and a two-pass full-text search that reached a documented decision on every one of the 44 originally-unresolved titles (see `data/scopus_batch_resolution.csv`).
- `scripts/23_merge_wos_scopus.py` — merges everything and applies the same coding dictionaries to every record.
- `scripts/24_sanitize_for_repo.py` — strips WoS/Scopus abstract text before the data is committed (see data-handling note above).
- `scripts/13_cluster_all.py` / `scripts/14_analysis_all.py` — re-run on the full 145-study corpus (after the post-hoc validation corrections in §7 of `REPORT.md`).
- `scripts/15_prep_dashboard_all.py` — exports `data/dashboard_data_all.json`, embedded in `docs/dashboard.html`.

Stages 1–2 run end to end from free APIs. Stage 3 needs your own WoS/Scopus export files (place
`savedrecs.xls` under a `02_Direct_Database_Records/` folder next to script 16, and the Scopus CSV next to
script 19) — this repo ships the pipeline, not the licensed input files.

## Data

Stage 1 (Europe PMC only): `data/raw_europepmc.json`, `screened.json`, `coded.json`, `clustered.json`, `final_analysis.json`, `coded_dataset.csv`, `dashboard_data.json`.

Stage 2 (OpenAlex + ERIC): `data/raw_openalex.json` (716 raw), `openalex_new_candidates.json` (315 new-only), `openalex_screened.json`, `openalex_final_new.json` (30 final), `raw_eric.json` (8 candidates, 1 included).

Stage 3 (final, WoS + Scopus added): `data/coded_all.json`, `clustered_all.json` — the merged 145-study corpus (WoS/Scopus abstracts sanitized except one open-access exception, see note above); `data/final_analysis_all.json` / `coded_dataset_all.csv` — final aggregated output (source for the dashboard); `data/dashboard_data_all.json` — compact data embedded in `docs/dashboard.html`; `data/master_registry.csv` — master report-to-trial table; `data/scopus_batch_resolution.csv` — per-title Scopus decisions; `data/clinicaltrials_gov.json` — supplementary registry check, not part of the included corpus.

## Limitations

PsycINFO and Cochrane CENTRAL are still not covered, and citation chasing (forward/backward snowballing) was
not run — these, not unresolved Scopus titles (all 44 now have a documented decision), are what limit any
claim of a confirmed evidence gap. Screening beyond Europe PMC included one documented manual reconciliation
pass per database, performed by the same researcher/agent who also ran the automated pipeline and the later
validation audit — not an independent second human reviewer blind to the original decision. Several studies
are companion reports of the same underlying trial (e.g. three WISER-trial publications) and are counted as
separate records. See §12 of `REPORT.md` for the full limitations discussion before treating this as a
publication-ready scoping review.
