# -*- coding: utf-8 -*-
"""Apply eligibility decisions reversed after full texts were obtained (idempotent).

X185 (Biswas et al., J Econ Behav Organ 2024): no abstract or accessible full text at the time of the supplementary
search, so it was recorded as "not retrieved". The full text was later supplied: a three-arm randomized evaluation of an
online training programme for teachers with the Oldenburg Burnout Inventory compared between arms. It meets all five
criteria and is included. The record keeps its screening-order position in supplementary_assessed.json; its report
identifier (R234) and study identifier (S107) come after all existing ones (record_ids.py) so no earlier ID changes.

R095 (Conesa et al., Teach Teach Educ 2023): handled in eligibility_decisions.py (self-described quasi-experimental,
but the full text reports clustered randomization of teachers within schools).
"""
import csv, json, os

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
NOTE = ("Three-arm RCT of an online teacher-training programme with and without a financial incentive, Bangladesh; "
        "OLBI (full text obtained after the initial search)")

# Notes revised after reading the full text of two excluded reports (decisions unchanged)
REVISED = {
 "X001": "Commercial fitness platform used through a mobile app to book mostly in-person classes and gym visits; no digitally delivered intervention content reported (full text)",
 "X173": "Multiple-baseline design; units randomized to app feature sets; MBI analysed only as an association with website use, not compared by arm (full text)",
}
p = os.path.join(DATA, "supplementary_screening.csv")
rows = list(csv.DictReader(open(p, encoding="utf-8")))
for r in rows:
    if r["sid"] == "X185":
        r["decision"], r["exclusion_criterion"], r["note"] = "included", "", NOTE
    if r["sid"] in REVISED:
        r["note"] = REVISED[r["sid"]]
w = csv.DictWriter(open(p, "w", newline="", encoding="utf-8"), fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

p = os.path.join(DATA, "supplementary_assessed.json")
d = json.load(open(p, encoding="utf-8"))
if not any(a["sid"] == "X185" for a in d["assessed"]):
    src = next(r for r in rows if r["sid"] == "X185")
    d["assessed"].append({"source": src["source_db"], "title": src["title"], "abstract": "", "year": src["year"], "doi": src["doi"],
                          "pmid": "", "type": src["publication_type"], "sid": "X185", "decision": "included",
                          "exclusion_criterion": "", "exclusion_note": NOTE,
                          "charting": ["T", "WEB", "NONP", "NR", "UC", "NR", 1598, "professional training"]})
    d["assessed"].sort(key=lambda a: a["sid"])
    d["not_retrieved"] = 2
for a in d["assessed"]:
    if a["sid"] in REVISED:
        a["exclusion_note"] = REVISED[a["sid"]]
json.dump(d, open(p, "w"), ensure_ascii=False, indent=1)
print("assessed", len(d["assessed"]), "not retrieved", d["not_retrieved"], "sought", d["sought"])
