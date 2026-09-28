# -*- coding: utf-8 -*-
"""Eligibility assessment of the reports that passed title/abstract screening
(R001-R145 from the candidate file; R147-R148 in EXTRA_DB) and of the
registry-identified report R146.

Criteria (all required), applied in this order; the first failed criterion is the
recorded exclusion reason:
  1. REPORT  - primary report of trial results (not a protocol/registration,
               commentary, or secondary analysis lacking a randomized comparison on burnout)
  2. DESIGN  - randomized allocation with a between-group comparison reported
  3. POP     - participants are workers (employed staff, practising professionals,
               or trainees in paid employment such as resident physicians);
               students and general-public samples are excluded
  4. DIGITAL - at least one integral intervention component delivered via
               web/app/VR/SMS/messaging/videoconference/computer/wearable
               (voice telephone alone, or digital assessment only, does not qualify)
  5. BURNOUT - burnout (a burnout instrument or a named burnout subscale, e.g.
               MBI, CBI, OLBI, BAT, SMBQ, BBI, PFI burnout, ProQOL burnout,
               COPSOQ burnout) reported as an outcome of the randomized comparison
Basis: 'abstract' unless noted; 'full text' where the abstract did not state
whether burnout was measured and an open-access full text was available;
'registry+bibliographic record' for R137.
"""
import json, csv, os

SP = os.environ.get("REVIEW_WORKDIR", ".") + "/"
recs = json.load(open(SP + "coded_all7.json"))

EXCL = {
 # 1. REPORT
 5:  ("REPORT", "Study protocol; no results reported", "abstract"),
 12: ("REPORT", "Study protocol (stepped-wedge cluster RCT); no results reported", "abstract"),
 35: ("REPORT", "Secondary analysis of predictors of dropout; no randomized comparison of burnout", "abstract"),
 94: ("REPORT", "Secondary pre-post analysis of a pilot cohort; no randomized comparison", "abstract"),
 100:("REPORT", "Commentary; not a trial report", "abstract"),
 102:("REPORT", "Trial in progress (conference abstract, future tense); no results. Completed trial reported separately (included)", "abstract"),
 106:("REPORT", "OSF pre-registration; no results reported", "abstract"),
 110:("REPORT", "OSF pre-registration; no results reported", "abstract"),
 111:("REPORT", "Study protocol; no results reported", "abstract"),
 112:("REPORT", "OSF pre-registration; no results reported", "abstract"),
 113:("REPORT", "OSF pre-registration; no results reported", "abstract"),
 # 2. DESIGN
 7:  ("DESIGN", "Explicitly non-randomized controlled trial", "abstract"),
 19: ("DESIGN", "Reports only one randomized arm (pre-post); no between-group comparison", "abstract"),
 51: ("DESIGN", "Quasi-randomized controlled trial", "abstract"),
 59: ("DESIGN", "Single-group pilot; no control group reported", "abstract"),
 75: ("DESIGN", "Waitlist-controlled pilot; random allocation not reported", "abstract"),
 95: ("DESIGN", "Self-described quasi-experimental study", "abstract"),
 128:("DESIGN", "Explicitly non-randomized controlled trial", "abstract"),
 # 3. POP
 6:  ("POP", "Physician assistant students", "abstract"),
 27: ("POP", "Medical students", "abstract"),
 29: ("POP", "Undergraduate students", "abstract"),
 30: ("POP", "Medical students", "abstract"),
 40: ("POP", "Medical students", "abstract"),
 50: ("POP", "Undergraduate health-sciences students", "abstract"),
 58: ("POP", "Doctoral psychology students", "abstract"),
 64: ("POP", "General-public online panel (vignette experiment)", "abstract"),
 72: ("POP", "Nursing students", "abstract"),
 92: ("POP", "Physical therapy students", "abstract"),
 104:("POP", "Medical students", "abstract"),
 122:("POP", "Medical students", "abstract"),
 123:("POP", "Pharmacy students", "abstract"),
 145:("POP", "General-public sample recruited through mass media; employment not an inclusion criterion", "abstract"),
 # 4. DIGITAL
 26: ("DIGITAL", "Residential workshop plus voice-telephone coaching; no digital component", "abstract"),
 56: ("DIGITAL", "Care-delivery model in nursing homes; only outcome questionnaires were digital", "abstract"),
 70: ("DIGITAL", "No digital delivery reported (keyword match came from publisher boilerplate 'online version')", "abstract"),
 84: ("DIGITAL", "In-person MBSR course; only questionnaires administered online", "abstract"),
 88: ("DIGITAL", "Voice-telephone coaching; only surveys online", "abstract"),
 # 5. BURNOUT
 16: ("BURNOUT", "Outcomes: perceived stress, well-being; burnout not measured", "abstract"),
 22: ("BURNOUT", "Outcomes: anxiety ratings, heart-rate variability; burnout not measured", "abstract"),
 24: ("BURNOUT", "Outcomes: professional commitment, resilience, coping; burnout not measured", "abstract"),
 28: ("BURNOUT", "Outcome: emotional intelligence; burnout not measured", "abstract"),
 31: ("BURNOUT", "Outcomes: stress, anxiety, depression, somatization, process variables; burnout not measured", "abstract"),
 52: ("BURNOUT", "Burnout analysed as a risk factor, not as an intervention outcome", "abstract"),
 60: ("BURNOUT", "Outcomes: resilience, psychological distress; burnout not measured", "abstract"),
 61: ("BURNOUT", "Outcomes: nursing stress and related measures; burnout not measured", "abstract"),
 63: ("BURNOUT", "Outcomes: sleep, insomnia, resilience; burnout not measured", "abstract"),
 65: ("BURNOUT", "Outcomes: resilience, work engagement, intention to leave; burnout not measured", "abstract"),
 73: ("BURNOUT", "Outcomes: resilience, perceived stress; burnout not measured", "abstract"),
 77: ("BURNOUT", "Outcomes: resilience, well-being; burnout not measured", "abstract"),
 78: ("BURNOUT", "Outcomes: mindfulness, stress, self-compassion, occupational stress, engagement; burnout not measured", "abstract"),
 93: ("BURNOUT", "Burnout outcome not reported; full text not openly accessible", "abstract"),
 98: ("BURNOUT", "Burnout outcome not reported (mindfulness, self-compassion only)", "abstract"),
 103:("BURNOUT", "Compassion-fatigue composite only; burnout subscale not reported", "abstract"),
 107:("BURNOUT", "Outcomes: well-being, mindfulness skills; burnout not measured", "abstract"),
 108:("BURNOUT", "ProQOL burnout subscale administered but not analysed or reported", "full text"),
 119:("BURNOUT", "Outcomes: self-compassion, mindfulness, EEG; burnout not measured", "abstract"),
 132:("BURNOUT", "Compassion-fatigue inventory only; burnout not measured", "abstract"),
}

BASIS_INCLUDED = {32: "full text", 121: "full text", 137: "registry+bibliographic record"}

# study-level linkage (verified: same registration or same sample/intervention/period)
STUDY_LINKS = {80: 76, 136: 76, 91: 25}   # R080, R136 share registration NCT02603133 with R076 (WISER); R091 = 2012 conference report of the R025 trial (same 161 participants)

# primary mechanism of the intervention (included records only; default 'psychological')
MECHANISM = {
 97:  "professional training",       # content-focused instructional coaching for teachers
 17:  "physical activity",          # activity trackers + online coach
 39:  "physical activity",          # motion-detecting exercise/yoga platform
 83:  "physical activity",          # personalised yoga vs group fitness
 138: "physical activity",          # app-based exercise
 49:  "professional training",      # web-based CBT skills training for counselors
 127: "feedback or navigation",     # automated eHealth feedback/advice on sickness absence
 135: "feedback or navigation",     # automated personalised psychological feedback
 140: "feedback or navigation",     # pushed digital assessment + links to care
}

EXTRA_DB = [  # database reports that passed screening and were excluded at eligibility before the full audit
 {"record_id": "R147", "source_db": "Europe PMC", "title": "Effectiveness of a Mobile Phone-Based Intervention to Reduce Mental Health Problems in Healthcare Workers During the COVID-19 Pandemic (PsyCovidApp): preprint", "doi": "10.2139/ssrn.3749214", "pub_year": 2021,
  "decision": "excluded", "exclusion_criterion": "REPORT", "exclusion_note": "Preprint superseded by the peer-reviewed report of the same trial (R023)", "verification_basis": "abstract", "study_id": "", "mechanism": ""},
 {"record_id": "R148", "source_db": "OpenAlex", "title": "Greater Resilience Information Toolkit Japanese Version (GRIT-J)", "doi": "10.17605/osf.io/8zav3", "pub_year": 2026,
  "decision": "excluded", "exclusion_criterion": "REPORT", "exclusion_note": "OSF trial registration written in the future tense; no results", "verification_basis": "abstract", "study_id": "", "mechanism": ""},
]
REGISTRY_INCLUDED = {"record_id": "R146", "source_db": "Registry-linked (ClinicalTrials.gov)",
  "title": "Optimizing Intervention Components of a Preventive Stress Management mHealth Intervention for Health Care Workers: Experimental Factorial Study", "doi": "10.2196/71032", "pub_year": 2025,
  "decision": "included", "exclusion_criterion": "", "exclusion_note": "Identified via registry record NCT04719351; blocked randomization to 32 factorial conditions incl. a no-component condition; OLBI and SMBQ reported",
  "verification_basis": "full text", "study_id": "", "mechanism": "psychological"}

rows = []
for i, r in enumerate(recs, start=1):
    rid = f"R{i:03d}"
    if i in EXCL:
        cat, note, basis = EXCL[i]
        dec = "excluded"
    else:
        cat, note, basis = "", "", BASIS_INCLUDED.get(i, "abstract")
        dec = "included"
    rows.append({
        "record_id": rid, "source_db": r["source"], "title": r["title"], "doi": r.get("doi") or "",
        "pub_year": r.get("pubYear") or "", "decision": dec, "exclusion_criterion": cat,
        "exclusion_note": note, "verification_basis": basis,
        "study_id": "", "mechanism": "" if dec == "excluded" else MECHANISM.get(i, "psychological"),
    })

rows.append(REGISTRY_INCLUDED)

# study ids for included records
n = 0
for i, row in enumerate(rows, start=1):
    if row["decision"] != "included":
        continue
    if i in STUDY_LINKS:
        continue
    n += 1
    row["study_id"] = f"S{n:03d}"
for child, parent in STUDY_LINKS.items():
    rows[child-1]["study_id"] = rows[parent-1]["study_id"]

rows_all = rows + EXTRA_DB

with open(SP + "eligibility_verification.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows_all)

from collections import Counter
inc = [r for r in rows if r["decision"] == "included"]
print("verified:", len(rows), "| included:", len(inc), "| excluded:", len(rows) - len(inc))
print("exclusions by criterion:", Counter(r["exclusion_criterion"] for r in rows if r["decision"] == "excluded"))
print("unique studies:", len({r["study_id"] for r in inc}))
print("mechanism:", Counter(r["mechanism"] for r in inc))
print("included by source:", Counter(r["source_db"] for r in inc))
json.dump(rows, open(SP + "eligibility_verification.json", "w"), ensure_ascii=False, indent=1)
