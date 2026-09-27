# Manuscript

`burnout_scoping_review_paper.docx` — a PRISMA-ScR-structured scoping review manuscript (Persian, with an
English abstract), built from `data/final_analysis_all.json` and `data/clustered_all.json`. Final corpus:
**144 reports** (a current maximum of ≈142 independent trials; see the record-vs-trial discussion below —
this is a ceiling on trials identified so far, not a lower bound).

This is round 3 of a response to a formal pre-submission review. Round 1 responded to a peer-review pass
(major-revision verdict) on the original 139-record draft: two genuine corpus errors were caught and fixed
(a duplicate SSRN preprint of an already-included published trial, PsyCovidApp, and an OpenAlex record,
GRIT-J, that was an unpublished OSF trial protocol, not a completed-trial report), bringing the corpus to
137. Round 2 responded to a second, more detailed pre-submission review that traced the 83
originally-unresolved Scopus titles through a documented Crossref recovery step, which found one further
eligible study (137→138) and narrowed the truly-unresolved count to 44. Round 3 took that recovery one step
further: an extended full-text search (Europe PMC, publisher pages) on those remaining 44 titles found a
usable abstract for nearly all of them; independent verification of each against eligibility criteria found
**6 further eligible studies** and **1 duplicate** of an already-included Europe PMC record (a small
cross-database dedup gap), bringing the corpus to **144** and narrowing the truly-unresolved count to 37.
- The PRISMA flow figure was rebuilt to show the full screening stages (including the 4-step Scopus
  abstract-recovery sub-flow and the 37-title unresolved box) with a consistent "report" unit throughout.
- The two screening-validation checks (a 15+15 random-sample audit vs. an independent full-corpus
  duplicate-title scan) are now reported separately, with an explicit note on which corpus snapshot the
  15-record include sample was drawn from — round 1 had blurred these into one narrative.
- The "≈136 independent trials" figure is now correctly described as a current ceiling (record-to-trial
  reconciliation is incomplete, so the true count can only be lower), not a lower bound as round 1 stated.
- New Results subsection reporting the instrument/comparator/guidance dimensions that Methods promised but
  round 1 never actually reported.
- Figure/table captions now flag multi-label coding explicitly (bar heights and heatmap cells are label
  counts, not unique-study counts) and no longer claim a "dominant approach" the pipeline never computes.
- The semantic-clustering "impostor syndrome / moral injury" claim is now backed by an exact count (5 of 12
  reports in that sub-cluster) instead of an unqualified assertion; full TF-IDF/KMeans parameters are
  documented; the fig4 legend-truncation rendering bug is fixed.
- Explicit statement of which PCC operationalization was chosen (any digital+psychological intervention in
  a working population reporting burnout as an outcome, not only interventions targeting burnout), plus a
  real sensitivity check (n=144 vs. n=140 excluding all 4 borderline cases -- top rankings unaffected).
- "Persistent evidence gap" language softened to "under-represented in the retrieved corpus" pending the
  unresolved Scopus titles and uncovered databases.
- The registry section is renamed from "publication bias" to "registry matching," with a full 28-trial
  appendix table (NCT ID, completion date, match decision, corresponding publication).
- The literature-comparison table now uses verified full-text details for Yang et al. (2026) and Adam et
  al. (2023) (fetched and cross-checked, not inferred from titles), and the references list is complete.

- **Structure:** title, structured Persian + English abstracts, Introduction, Methods (eligibility criteria
  with an explicit PCC-operationalization decision, information sources, search strategy, selection process
  including the Scopus 3-step recovery, data-charting, the deliberate choice to skip formal risk-of-bias
  assessment, synthesis methods with full clustering parameters, a screening-validation protocol, and a
  registry-matching-method section), Results (PRISMA-ScR flow, source characteristics, occupation/tech/
  approach distribution with multi-label caveats, evidence map, instrument/comparator/guidance results,
  semantic clustering, the record-vs-intervention issue, a two-part manual screening-validation section, and
  registry-matching results with a corrected fact about the Inner Engineering Online trial), Discussion
  (methodological significance, borderline-eligibility cases with a sensitivity table, a verified
  related-reviews comparison table, strengths), Limitations, Conclusion, funding/conflict-of-interest/
  data-availability statements, four appendices (per-database exclusion reasons; full search strings;
  the complete 28-trial registry-matching table; the 5 impostor-syndrome/moral-injury cluster titles), and
  references.
- **Figures** (`figures/`, regenerated by `make_figures.py` from the repo's own data files):
  1. `fig1_prisma_flow.png` — full five-database PRISMA-ScR screening flow (n=144), including the Scopus
     4-step abstract-recovery sub-flow and the 37-title unresolved box, consistent "report" units throughout
  2. `fig2_temporal_trend.png` — approach labels per year (n=144, explicitly multi-label, 2026 flagged as
     partial-year)
  3. `fig3_evidence_map.png` — approach × occupation co-occurrence heatmap (n=144, explicitly multi-label)
  4. `fig4_cluster_scatter.png` — TF-IDF/KMeans semantic cluster scatter (n=144, k=9, silhouette=0.013;
     legend-truncation bug fixed)

## Rebuilding

```bash
pip install matplotlib
python3 paper/make_figures.py        # regenerates paper/figures/*.png from data/final_analysis_all.json
npm install docx                     # inside paper/, if node_modules isn't already present
node paper/build_paper.js            # writes paper/burnout_scoping_review_paper.docx
```

## Verification note

The generated `.docx` was validated against the OOXML/WordML XSD schema (passed) and its text content was
round-tripped through `pandoc -t markdown` to confirm every section, table, figure, and numeric value
renders correctly and consistently (Persian digits throughout the prose; `k=`/`n=`-style statistical
notation kept in Latin digits, matching standard convention). LibreOffice itself does not run in the
container this was built in (it fails to load *any* source file, including a one-line test document and a
plain `.txt` file, independent of this project), so a rendered-page visual check could not be performed
here — open the file in Word or a working LibreOffice install to see the final layout.
