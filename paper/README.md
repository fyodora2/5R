# Manuscript

`burnout_scoping_review_paper.docx` — a PRISMA-ScR-structured scoping review manuscript (Persian, with an
English abstract), built from `data/final_analysis_all.json` and `data/clustered_all.json`. Final corpus:
**145 reports** (a current maximum of ≈143 independent trials; see the record-vs-trial discussion below —
this is a ceiling on trials identified so far, not a lower bound, reproducible from `data/master_registry.csv`).

This is round 4 of a response to a formal pre-submission review process. Round 1 responded to a peer-review
pass (major-revision verdict) on the original 139-record draft: two genuine corpus errors were caught and
fixed (a duplicate SSRN preprint of an already-included published trial, PsyCovidApp, and an OpenAlex record,
GRIT-J, that was an unpublished OSF trial protocol, not a completed-trial report), bringing the corpus to
137. Round 2 responded to a second, more detailed pre-submission review that traced the 83
originally-unresolved Scopus titles through a documented Crossref recovery step, which found one further
eligible study (137→138) and narrowed the truly-unresolved count to 44. Round 3 took that recovery one step
further: an extended full-text search (Europe PMC, publisher pages) on those remaining 44 titles found a
usable abstract for nearly all of them; independent verification of each against eligibility criteria found
6 further eligible studies and 1 duplicate of an already-included Europe PMC record (a small cross-database
dedup gap), bringing the corpus to 144 and narrowing the truly-unresolved count to 37.

**Round 4** responded to a third pre-submission review with six major concerns. The most consequential:

- **A genuine count inconsistency** was found and fixed: the Abstract said "~142 independent trials" while
  the Limitations/Conclusion sections still said "~136" (stale from before round 3 grew the corpus), and the
  occupation table showed n=66 for "General/mixed working adults" while the prose said n=65. Both are now
  single, dynamically-computed values that cannot drift apart again.
- **The 37 unresolved Scopus titles were fully resolved.** Rather than partially re-checking a subset, this
  round re-examined all 44 originally-unresolved titles without exception: 1 further eligible study was
  found (overlooked in round 3 because Crossref/Semantic Scholar metadata alone didn't surface an abstract
  for it), and every one of the remaining 36 titles now has a documented exclusion reason (wrong population,
  non-randomized design, protocol/correction notice, systematic review, non-digital delivery, off-topic, or
  -- for 2 titles -- inability to access full text, resolved conservatively as excluded). Corpus: 144→145.
  Full per-title table: `data/scopus_batch_resolution.csv`.
- **The project's work had been committed to the wrong repository.** Rounds 1-3 were mistakenly pushed to a
  separate, undesignated repository instead of this one (`fyodora2/5R`), which is exactly what the review's
  "the stated repository link doesn't hold the claimed content" concern was catching. All prior work was
  consolidated into this repository and its designated branch; all internal repo-path references were fixed
  to be relative rather than pointing at the wrong machine path.
- **A master registry file was added** (`data/master_registry.csv`): one row per included report, with its
  source database, DOI, and trial-family group (e.g. "WISER" for its 3 reports). The "~143 independent
  trials" figure, and any report-vs-trial count in this manuscript, is now reproducible directly from this
  file rather than a hand-typed number.
- **The title and framing were broadened to match the actual eligibility criteria.** The eligibility criteria
  (Methods §2.2, "option b") always accepted any digital intervention reporting burnout as an outcome, not
  only interventions with a classically psychological mechanism -- but the title said "Digital Psychological
  Interventions." Rather than narrowing the corpus to match the title (which would have meant re-deriving the
  whole analysis under stricter criteria), the title, Abstract objective, and Conclusion were reworded to
  "Digital Interventions Reporting Occupational Burnout Outcomes," and Results/Abstract now explicitly report
  the split: 141 reports use a classically psychological approach; 4 documented borderline hybrid/
  non-psychological-mechanism cases (already discussed in §4.3) are retained under the broad criterion.
- **The screening-validation methodology's use of "independent" was clarified.** It means independent
  *sampling* (fixed seeds, drawn separately from the original decision) and independent *timing*, not
  independent *human reviewers* -- the same researcher/agent who wrote the automated pipeline and did the
  manual reconciliation passes also ran the validation audit. There was accordingly no second-rater
  disagreement to resolve. This is now stated explicitly rather than left for the reader to infer.
- **Three more adjacent reviews were identified** (Lampinen et al. 2026; Park et al. 2022; an unnamed 2026
  review in *Int Arch Occup Environ Health*) during the full re-check of the Scopus titles, and added to the
  novelty discussion alongside Yang et al. (2026) and Adam et al. (2023); the "no comprehensive review found"
  claim is now explicitly scoped to the searches actually performed, not the literature at large, and the
  PsycINFO/CENTRAL/citation-chasing gaps are mentioned in that same discussion, not only in Limitations.
- The ClinicalTrials.gov appendix table (28 matched trials) now has every registered title in full, rather
  than truncated to ~55 characters.
- The title page's placeholder author line was replaced with the actual corresponding-author contact.
- "Registry matching" terminology (vs. the earlier, dropped "publication bias" phrasing) is now used
  consistently in both the Methods heading and body text, and a wrong internal cross-reference was fixed.

Round 3's changes (still in effect): the PRISMA flow figure shows the full screening stages with a consistent
"report" unit throughout; the two screening-validation checks (a 15+15 random-sample audit vs. an independent
full-corpus duplicate-title scan) are reported separately; the "~143 independent trials" figure is described
as a current ceiling, not a lower bound; instrument/comparator/guidance results are reported; figure/table
captions flag multi-label coding explicitly; the semantic-clustering "impostor syndrome/moral injury" claim is
backed by an exact count (now 5 of 19, after this round's cluster re-fit changed k from 9 to 8); a real
sensitivity check (n=145 vs. n=141 excluding all 4 borderline cases -- top rankings unaffected, verified by
direct recomputation) backs the PCC-operationalization decision.

- **Structure:** title, structured Persian + English abstracts, Introduction, Methods (eligibility criteria
  with an explicit PCC-operationalization decision, information sources, search strategy, selection process
  including the Scopus 4-step recovery across two full-text search rounds, data-charting, the deliberate
  choice to skip formal risk-of-bias assessment, synthesis methods with full clustering parameters, a
  screening-validation protocol with explicit independence scoping, and a registry-matching-method section),
  Results (PRISMA-ScR flow, source characteristics, occupation/tech/approach distribution with multi-label
  caveats, evidence map, instrument/comparator/guidance results, semantic clustering, the record-vs-intervention
  issue, a two-part manual screening-validation section, and registry-matching results with a corrected fact
  about the Inner Engineering Online trial), Discussion (methodological significance, borderline-eligibility
  cases with a sensitivity table, a verified related-reviews comparison table now including 3 more reviews),
  Limitations, Conclusion, funding/conflict-of-interest/data-availability statements, four appendices
  (per-database exclusion reasons; full search strings; the complete 28-trial registry-matching table with
  untruncated titles; the 5 impostor-syndrome/moral-injury cluster titles), and references.
- **Figures** (`figures/`, regenerated by `make_figures.py` from the repo's own data files):
  1. `fig1_prisma_flow.png` — full five-database PRISMA-ScR screening flow (n=145), including the Scopus
     4-step abstract-recovery sub-flow, consistent "report" units throughout
  2. `fig2_temporal_trend.png` — approach labels per year (n=145, explicitly multi-label, 2026 flagged as
     partial-year)
  3. `fig3_evidence_map.png` — approach × occupation co-occurrence heatmap (n=145, explicitly multi-label)
  4. `fig4_cluster_scatter.png` — TF-IDF/KMeans semantic cluster scatter (n=145, k=8, silhouette=0.009;
     legend-truncation bug fixed)

## Rebuilding

```bash
pip install matplotlib
python3 paper/make_figures.py        # regenerates paper/figures/*.png from data/final_analysis_all.json
npm install docx                     # inside paper/, if node_modules isn't already present
node paper/build_paper.js            # writes paper/burnout_scoping_review_paper.docx
```

Both scripts resolve their input/output paths relative to their own location (`__dirname`/`__file__`), so
they work from any checkout of this repository without editing a hardcoded path first.

## Verification note

The generated `.docx` was validated against the OOXML/WordML XSD schema (passed) and its text content was
round-tripped through `pandoc -t markdown` to confirm every section, table, figure, and numeric value
renders correctly and consistently (Persian digits throughout the prose; `k=`/`n=`-style statistical
notation kept in Latin digits, matching standard convention). LibreOffice itself does not run in the
container this was built in (it fails to load *any* source file, including a one-line test document and a
plain `.txt` file, independent of this project), so a rendered-page visual check could not be performed
here — open the file in Word or a working LibreOffice install to see the final layout.
