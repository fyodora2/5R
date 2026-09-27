# -*- coding: utf-8 -*-
"""Manual reconciliation of the 24 automated Scopus includes, plus one
record (rank 312) the user separately researched because Scopus/OpenAlex/
PubMed had no retrievable abstract for it -- resolved instead via its
ClinicalTrials.gov registration (public domain, safe to store the synopsis
text)."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, "work", "scopus_screened.json")))
included = [r for r in d if r["_screen_status"] == "include"]

EXCLUDE_DOIS = {
    # duplicates of studies already in the corpus (Europe PMC), caught late
    # because Scopus's truncated titles fell below the fuzzy title-dedup threshold
    "10.1097/jom.0000000000001285": "duplicate of existing corpus record (Europe PMC)",
    "10.1097/jom.0000000000000680": "duplicate of existing corpus record (Europe PMC)",
    # duplicates of WoS candidates already manually excluded as protocols/false-positives
    "10.2196/71867": "protocol (already excluded via WoS)",
    "10.2196/58288": "protocol (already excluded via WoS)",
    "10.1002/jclp.23468": "unrelated false positive (already excluded via WoS)",
    "10.2196/45852": "protocol (already excluded via WoS)",
    "10.1186/s12888-022-03800-x": "protocol (already excluded via WoS)",
    "10.3390/ijerph191912749": "protocol (already excluded via WoS)",
    "10.2196/37015": "protocol (already excluded via WoS)",
    "10.2196/36012": "protocol (already excluded via WoS)",
    "10.2196/32992": "protocol; results paper already in corpus (Europe PMC, DOI 10.2196/42566)",
    "10.1111/jan.14813": "protocol (already excluded via WoS)",
    "10.1186/s12889-020-09691-5": "protocol (already excluded via WoS)",
    "10.1136/bmjopen-2025-106542": "protocol (already excluded via WoS)",
    # duplicates of records already flagged "uncertain" during the OpenAlex pass
    "10.1016/j.sel.2026.100191": "already flagged uncertain via OpenAlex (pilot-study framing)",
    "10.1016/j.mayocp.2022.06.035": "already flagged uncertain via OpenAlex (digital delivery unclear)",
    # wrong publication type: reviews, not primary RCTs
    "10.3389/fpubh.2026.1879258": "systematic review + meta-analysis (Yang et al. 2026), not a primary RCT",
    "10.3389/fpubh.2023.1231266": "scoping review, not a primary RCT",
    # protocols, not yet reporting results
    "10.1186/s13063-023-07537-0": "study protocol (MENTUPP) -- relevant to the corporate/SME gap once results are published",
    "10.1016/j.cct.2022.106928": "study protocol (DESTRESS); population is university students, not employed professionals",
}

final = [r for r in included if r["doi"] not in EXCLUDE_DOIS]

# manually add the one record resolved via ClinicalTrials.gov registry data
# (no publisher abstract exists in any source searched)
final.append({
    "matched_title": "Does a phone-based meditation application improve mental wellness in emergency medicine personnel?",
    "doi": "10.1016/j.ajem.2020.04.058",
    "pubYear": 2020,
    "venue": "American Journal of Emergency Medicine",
    "abstract": (
        "[ClinicalTrials.gov NCT03811990 registry synopsis, not the publisher abstract -- no "
        "publisher abstract was retrievable from any source searched] Emergency-department work is "
        "associated with high burnout and stress; the trial hypothesized that weekly use of a phone-based "
        "meditation app would improve emergency-department employees' mental health. Randomized, open-label "
        "trial. Registered outcomes include depression, anxiety, perceived stress, and burnout at 90 and 180 "
        "days. Registry has no posted results as of this review."
    ),
    "_screen_status": "include",
    "_screen_reason": "eligibility confirmed via ClinicalTrials.gov registry data (no publisher abstract retrievable)",
})

print(f"[scopus reconcile] automated include: {len(included)}", file=sys.stderr)
print(f"[scopus reconcile] manual exclude: {len(EXCLUDE_DOIS)}", file=sys.stderr)
print(f"[scopus reconcile] final new includes from Scopus: {len(final)}", file=sys.stderr)
for r in final:
    print("  -", r["pubYear"], "|", r["matched_title"][:90], file=sys.stderr)

with open(os.path.join(HERE, "work", "scopus_final_new.json"), "w") as f:
    json.dump(final, f, ensure_ascii=False, indent=1)
