# -*- coding: utf-8 -*-
"""Registry-to-publication linkage for completed ClinicalTrials.gov registrations.

Inputs (retrieved 2026-09-28 from the ClinicalTrials.gov API v2 and Europe PMC REST):
  ctgov_28.json        identification/status modules for the 28 completed interventional registrations
  ctgov_28_alloc.json  allocation, completion date and enrolment per registration
  ctgov_links.json     publications linked to each registration (registry reference PMIDs and
                       Europe PMC records citing the NCT number), with PMID->DOI resolution
Outputs:
  data/registry_linkage.csv            one row per registration with its publication status
  data/registry_linked_publications.csv one row per registry-linked publication not already assessed
                                        in the database arm, with its eligibility decision
"""
import csv, json, os, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")

studies = json.load(open(os.path.join(SRC, "ctgov_28.json")))
studies = studies[next(iter(studies))] if isinstance(studies, dict) else studies
title = {s["protocolSection"]["identificationModule"]["nctId"]:
         s["protocolSection"]["identificationModule"]["briefTitle"] for s in studies}
alloc = json.load(open(os.path.join(SRC, "ctgov_28_alloc.json")))
links = json.load(open(os.path.join(SRC, "ctgov_links.json")))

INCLUDED_REPORT = {  # registration -> primary report of the included study
    "NCT02603133": "R076", "NCT03475290": "R045", "NCT04126564": "R038", "NCT04393818": "R023",
    "NCT04719351": "R146", "NCT04816708": "R125", "NCT05280964": "R047",
}
charting = {r["primary_report"]: r for r in csv.DictReader(open(os.path.join(OUT, "study_charting.csv"), encoding="utf-8"))}
INCLUDED = {nct: "%s (%s)" % (charting[rid]["study_id"], charting[rid]["reports"].replace(";", "; "))
            for nct, rid in INCLUDED_REPORT.items()}
OUT_OF_SCOPE = {
    "NCT02540317": "Results published (10.1159/000490742) in a clinical sample recruited on chronic stress, not on occupation",
    "NCT05246800": "Results published (10.2196/32123) in a non-clinical general-population sample",
    "NCT04897165": "Results published (10.1007/s10484-024-09671-0; R007) without randomized allocation",
}
NO_REPORT_NOTE = {"NCT04958941": "Protocol published (10.1186/s12888-022-03800-x); no results report located"}

rows = []
for nct, a in sorted(alloc.items(), key=lambda kv: kv[1]["completion"]):
    randomized = a["allocation"] == "RANDOMIZED"
    completion = a["completion"]
    if not randomized:
        status, note = "Not randomized (not assessed for results)", OUT_OF_SCOPE.get(nct, "")
    elif nct in INCLUDED:
        status, note = "Results report included in this review", INCLUDED[nct]
    elif nct in OUT_OF_SCOPE:
        status, note = "Results report published outside review scope", OUT_OF_SCOPE[nct]
    elif completion >= "2024":
        status, note = "Completed 2024 or later (follow-up window < 2 years)", ""
    else:
        status, note = "No results report located", NO_REPORT_NOTE.get(nct, "")
    rows.append({"nct_id": nct, "brief_title": title.get(nct, ""), "allocation": a["allocation"],
                 "completion_date": completion, "enrollment": a["enrollment"], "status": status, "note": note})

with open(os.path.join(OUT, "registry_linkage.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

# Registry-linked publications not already assessed for eligibility in the database arm
DECISION = {
    "41078177": ("included", "", "Randomized factorial trial in healthcare workers; app; OLBI (full text)"),
    "41618292": ("excluded", "REPORT", "Observational survey cited in the registration"),
    "36100880": ("excluded", "REPORT", "Qualitative secondary analysis"),
    "35248015": ("excluded", "REPORT", "Trial protocol"),
    "34100238": ("excluded", "REPORT", "Secondary analysis of a different coaching study"),
    "33675247": ("excluded", "REPORT", "Trial protocol"),
    "32681398": ("excluded", "REPORT", "Measurement-development study cited in the registration"),
    "32627860": ("excluded", "REPORT", "Systematic review"),
    "31516024": ("excluded", "REPORT", "Measurement-development study cited in the registration"),
    "31586370": ("excluded", "REPORT", "Economic secondary analysis"),
    "31182128": ("excluded", "REPORT", "Trial protocol"),
    "30326495": ("excluded", "REPORT", "Systematic review"),
    "29222080": ("excluded", "REPORT", "Measurement-validation secondary analysis"),
    "27802178": ("excluded", "REPORT", "Cross-sectional survey cited in the registration"),
    "40114469": ("excluded", "DESIGN", "Single-arm implementation pilot"),
    "39854701": ("excluded", "DESIGN", "Single-arm pilot"),
    "35802001": ("excluded", "DESIGN", "Non-randomized controlled trial"),
    "32234708": ("excluded", "DESIGN", "Single-arm prospective pilot"),
    "35302504": ("excluded", "POP", "General-population sample"),
    "30041167": ("excluded", "POP", "Clinical sample recruited on symptom level"),
    "31380892": ("excluded", "DIGITAL", "Coaching delivered by voice telephone"),
}
seen = {}
for nct, ms in links["matches"].items():
    for pmid, doi, link, t in ms:
        seen.setdefault(pmid, (nct, doi, link, t))
pubs = []
for pmid, (nct, doi, link, t) in sorted(seen.items()):
    if link:  # already assessed in the database arm
        continue
    dec, crit, note = DECISION[pmid]
    pubs.append({"pmid": pmid, "doi": doi, "registration": nct, "title": t.strip(), "decision": dec,
                 "exclusion_criterion": crit, "note": note})
with open(os.path.join(OUT, "registry_linked_publications.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(pubs[0])); w.writeheader(); w.writerows(pubs)

from collections import Counter
print(Counter(r["status"] for r in rows))
print(len(pubs), Counter((p["decision"], p["exclusion_criterion"]) for p in pubs))
