# -*- coding: utf-8 -*-
"""Apply decisions taken after the first complete draft (idempotent): border-case cards c1-c17 and full texts received.

Rule kept for every exclusion: the FIRST failed criterion (REPORT, DESIGN, POP, DIGITAL, BURNOUT) is the single recorded reason.
Included by decision: c6, c9 (see notes). Excluded by decision: c1 and the second unpublished preprint (same rule), c2, c4, c13, c17.
Full texts received: X112 (included), X165 (excluded); the burnout instrument of S112 and S113 was read in the full text.
Main-search records (c17 = R140, c15 = R053) are handled in eligibility_decisions.py and charting.py.
"""
import csv, json, os

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
def jl(f): return json.load(open(os.path.join(DATA, f), encoding="utf-8"))
def js(f, d): json.dump(d, open(os.path.join(DATA, f), "w"), ensure_ascii=False, indent=1)

# (file, title fragment) -> (decision, criterion, note, charting or None)
PATCH = [
 ("supplementary_assessed.json", "Pragmatic Parental Support", "excluded", "DIGITAL",
  "Parental support package (smart bassinet, wearable breast pump, faculty mentorship, virtual perinatal support); only the virtual support was digital and it was not the core component", None),
 ("supplementary_assessed.json", "Serial Anthropometric Measurements", "excluded", "BURNOUT",
  "Weight-reduction intervention; burnout was a secondary measure unrelated to the aim of the intervention", None),
 ("supplementary_assessed.json", "Wearable Biosensor Monitoring", "excluded", "REPORT",
  "Unpublished preprint without peer review (only peer-reviewed reports are eligible)", None),
 ("supplementary_assessed.json", "Precision targeting of teacher burnout", "included", "",
  "Included by decision: cluster-randomised trial of network-informed micro-interventions in teachers; burnout dimensions (exhaustion, detachment, efficacy) measured by EMA and analysed as a composite", ["T", "APP", "OTHP", "NR", "AC", "SELF", None, "psychological"]),
 ("supplementary_assessed.json", "Internet-based rehabilitation for individuals with chronic pain and burnout", "included", "",
  "Included by decision: internet rehabilitation course vs waiting list for people on sick leave with chronic pain or burnout; employment status per protocol definition; burnout outcome not visible in the abstract (full text requested)", ["E", "WEB", "OTHP", "NR", "WL", "HUMAN", 55, "psychological"]),
 ("wos_scopus_supplementary_assessed.json", "Increasing oncologists' skills", "excluded", "DIGITAL",
  "Communication-skills training that was mainly in person; four monthly videoconferences were a minor component", None),
 ("third_search_assessed.json", "Leadership Coaching as an Implementation Strategy", "excluded", "REPORT",
  "Unpublished preprint without peer review (only peer-reviewed reports are eligible)", None),
]
for f, frag, dec, crit, note, chart in PATCH:
    d = jl(f)
    hit = [a for a in d["assessed"] if frag.lower() in a["title"].lower()]
    assert len(hit) == 1, (frag, len(hit))
    a = hit[0]
    a["decision"], a["exclusion_criterion"], a["exclusion_note"], a["charting"] = dec, crit, note, chart
    js(f, d)
    stem = {"supplementary_assessed.json": "supplementary_screening.csv", "wos_scopus_supplementary_assessed.json": "wos_scopus_supplementary_screening.csv",
            "third_search_assessed.json": "third_search_screening.csv"}[f]
    rows = list(csv.DictReader(open(os.path.join(DATA, stem), encoding="utf-8")))
    for r in rows:
        if r["sid"] == a["sid"]:
            r["decision"], r["exclusion_criterion"], r["note"] = dec, crit, note
    with open(os.path.join(DATA, stem), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

# c15: veterinary staff are charted under "other sectors" (E)
d = jl("wos_scopus_supplementary_assessed.json")
for a in d["assessed"]:
    if "acceptance and commitment training program reduces burden transfer" in a["title"].lower() and a["charting"]:
        a["charting"][0] = "E"
js("wos_scopus_supplementary_assessed.json", d)

# full texts received: X112 included, X165 excluded (both were "not retrieved")
S = jl("supplementary_assessed.json")
rows = list(csv.DictReader(open(os.path.join(DATA, "supplementary_screening.csv"), encoding="utf-8")))
NEW = {
 "X112": ("included", "", "Text-message programme on occupational health for ICU nurses vs no intervention, Iran; Geldard Burnout Questionnaire (full text received)", ["N", "MSG", "PSYED", "Geldard", "UC", "SELF", 80, "psychological"]),
 "X165": ("excluded", "DESIGN", "Conference abstract: residents randomized to four teams in a gamified programme and compared with the previous year; wellness, not burnout, measured; no between-group comparison (full text received)", None),
}
for sid, (dec, crit, note, chart) in NEW.items():
    src = next(r for r in rows if r["sid"] == sid)
    src["decision"], src["exclusion_criterion"], src["note"] = dec, crit, note
    if not any(a["sid"] == sid for a in S["assessed"]):
        S["assessed"].append({"source": src["source_db"], "title": src["title"], "abstract": "", "year": src["year"], "doi": src["doi"], "pmid": "",
                              "type": src["publication_type"], "sid": sid, "decision": dec, "exclusion_criterion": crit, "exclusion_note": note, "charting": chart})
S["assessed"].sort(key=lambda a: a["sid"])
S["not_retrieved"] = 0
js("supplementary_assessed.json", S)
with open(os.path.join(DATA, "supplementary_screening.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
print("applied; supplementary assessed", len(S["assessed"]), "not retrieved", S["not_retrieved"])
