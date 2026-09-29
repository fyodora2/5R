# -*- coding: utf-8 -*-
"""Supplementary search without the intervention-type block in Scopus and Web of Science.

Searches were run by the author on 29 September 2026 (strings in paper Appendix A) and exported with abstracts:
Scopus as CSV, Web of Science as Excel (Full Record). This script de-duplicates the exports against every record already
identified, applies title/abstract screening, and records the eligibility decision for every report that passed screening.

Usage: python3 wos_scopus_supplementary.py <scopus.csv> <wos.xls> [old_wos_scopus_candidates.csv]

Outputs (no Web of Science or Scopus abstract text is written):
  data/wos_scopus_supplementary_screening.csv   every new unique record with its screening decision
  data/wos_scopus_supplementary_assessed.json   reports assessed for eligibility, with decision and charting
"""
import csv, json, os, re, sys
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(os.path.dirname(HERE)), "data")
scopus_csv, wos_xls = sys.argv[1], sys.argv[2]
old_candidates = sys.argv[3] if len(sys.argv) > 3 else None

def nt(t): return re.sub(r"[^a-z0-9]", "", str(t or "").lower())[:80]
def nd(d):
    d = str(d or "").lower().replace("https://doi.org/", "").strip()
    return "" if d == "nan" else d

sc = pd.read_csv(scopus_csv, encoding="utf-8-sig")
wos = pd.read_excel(wos_xls)
recs = []
for _, r in sc.iterrows():
    recs.append({"db": "Scopus", "title": r["Title"], "abstract": r["Abstract"], "year": r["Year"], "doi": nd(r["DOI"]),
                 "type": r["Document Type"], "journal": r["Source title"], "pmid": str(r.get("PubMed ID") or "")})
for _, r in wos.iterrows():
    recs.append({"db": "Web of Science", "title": r["Article Title"], "abstract": r["Abstract"], "year": r.get("Publication Year"),
                 "doi": nd(r.get("DOI")), "type": r["Document Type"], "journal": r["Source Title"], "pmid": str(r.get("Pubmed Id") or "")})

# ---- everything already identified --------------------------------------------------------------------------
known = {}
def add(src, doi, title, pmid=None):
    if nd(doi): known.setdefault("d:" + nd(doi), src)
    if title: known.setdefault("t:" + nt(title), src)
    if pmid and str(pmid) != "nan": known.setdefault("p:" + str(pmid), src)
for r in json.load(open(os.path.join(DATA, "raw_europepmc.json")))["results"]: add("main", r.get("doi"), r.get("title"), r.get("pmid"))
for r in json.load(open(os.path.join(DATA, "raw_openalex.json")))["results"]: add("main", r.get("doi"), r.get("title") or r.get("display_name"))
for r in json.load(open(os.path.join(DATA, "raw_eric.json")))["docs"]: add("main", None, r.get("title"))
for r in json.load(open(os.path.join(DATA, "raw_supplementary_europepmc.json")))["results"]: add("suppl-1", r.get("doi"), r.get("title"), r.get("pmid"))
for r in json.load(open(os.path.join(DATA, "raw_supplementary_openalex.json")))["results"]: add("suppl-1", r.get("doi"), r.get("title"))
if old_candidates:  # candidate list of the first Web of Science / Scopus searches (titles and DOIs only)
    for r in csv.DictReader(open(old_candidates, encoding="utf-8-sig")): add("main", r["doi_or_identifier"], r["title"])
for r in csv.DictReader(open(os.path.join(DATA, "master_registry.csv"), encoding="utf-8")):
    if not (r["identification_route"] == "supplementary database search" and r["source_db"] in ("Scopus", "Web of Science")):
        add("ledger", r["doi"], r["title"], r["pmid"])

new, dup, seen = [], 0, set()
for r in recs:
    keys = ([("d:" + r["doi"])] if r["doi"] else []) + ([("t:" + nt(r["title"]))] if nt(r["title"]) else []) + \
           ([("p:" + r["pmid"])] if r["pmid"] not in ("nan", "None", "") else [])
    if any(k in known for k in keys) or any(k in seen for k in keys):
        dup += 1; continue
    seen.update(keys); new.append(r)

# ---- title/abstract screening ------------------------------------------------------------------------------
RAND = r"randomi[sz]|randomly (assigned|allocated)|random (assignment|allocation)|crossover|cross-over|allocated to|assigned to (the |an |a )?(intervention|experimental|control)"
def triage(r):
    t, a, typ = str(r["title"]).lower(), str(r["abstract"] or "").lower(), str(r["type"]).lower()
    ta = t + " " + a
    if any(k in typ for k in ("review", "editorial", "erratum", "letter", "note", "book", "retracted")): return "non-article publication type"
    if re.search(r"systematic review|meta-analys|scoping review|literature review|umbrella review|narrative review", t): return "review"
    if re.search(r"\bprotocol\b", t): return "protocol"
    if a.strip() in ("", "nan"): return "no abstract"
    if "burnout" not in ta and "burn-out" not in ta: return "burnout not mentioned"
    if not re.search(RAND, ta): return "no randomized allocation"
    return "reviewer screening"

# ---- eligibility decisions for reports that passed screening (keyed by DOI, else normalized title) -------------
D = {  # key: (decision, first failed criterion, reason)
 "10.2460/javma.22.05.0196": ("included", "", "ACT training by videoconference for veterinary hospital teams; work- and client-related burnout"),
 "10.1016/j.ctim.2024.103109": ("included", "", "Tele-yoga for healthcare workers on COVID-19 duty; Stanford Professional Fulfillment Index"),
 "10.1513/annalsats.202312-1024oc": ("included", "", "Virtual death cafes for ICU clinicians; Maslach Burnout Inventory primary outcome"),
 "10.1001/jamanetworkopen.2025.27275": ("included", "", "Smartwatch with access to physiological data for physicians; burnout among outcomes"),
 "10.1002/pon.1217": ("included", "", "Communication-skills training with monthly videoconferences for oncologists; stress and burnout questionnaires"),
 "10.1186/s12906-024-04452-y": ("excluded", "DIGITAL", "In-person mindfulness training; burnout only in the background"),
 "10.1177/1357633x221106027": ("excluded", "DIGITAL", "Voice telephone coaching"),
 "10.3390/ijerph17249227": ("excluded", "DIGITAL", "In-person 12-day programme with telephone coaching"),
 "10.1111/wvn.12420": ("excluded", "DIGITAL", "Group sessions; digital delivery not stated"),
 "10.2196/45834": ("excluded", "DESIGN", "Single-arm trial"),
 "t:" + nt("A multiple-baseline design evaluation of the feasibility of a brief RNT-focused ACT intervention in health professionals experiencing burnout"):
     ("excluded", "DESIGN", "Single-case design with three participants; no between-group comparison"),
 "10.1177/02692163221143817": ("excluded", "DESIGN", "Single-arm feasibility trial"),
 "10.1016/j.accpm.2025.101697": ("excluded", "DESIGN", "Controlled before-and-after study, not randomized"),
 "10.2196/16651": ("excluded", "BURNOUT", "A/B testing of clinical decision-support alerts; outcomes are alert metrics"),
 "10.1177/10711813251371646": ("excluded", "REPORT", "Evidence synthesis and measurement strategy, not a trial"),
 "10.1177/26334895231205890": ("excluded", "REPORT", "Lessons-learned report, not a trial"),
 "10.1371/journal.pone.0288246": ("excluded", "POP", "Mothers, not a working population"),
 "10.3390/healthcare13192510": ("excluded", "POP", "Nursing students"),
 "10.1097/jte.0000000000000238": ("excluded", "DESIGN", "Cross-sectional study of physical therapy students"),
 "10.1016/s2155-8256(25)00047-x": ("excluded", "DESIGN", "National workforce survey"),
 "10.2147/ceor.s478089": ("excluded", "POP", "Patients with cardiac devices; economic evaluation"),
 "10.1016/j.contraception.2019.08.001": ("excluded", "POP", "Patients and providers evaluating a decision tool; not a burnout trial"),
 "10.1145/3359299": ("excluded", "POP", "General-public experiment on news reactions"),
}
CHART = {  # occupation, delivery, approach, instrument, comparator, human support, n, mechanism
 "10.2460/javma.22.05.0196": ("H", "LIVE", "ACT", "NR", "UC", "HUMAN", 143, "psychological"),
 "10.1016/j.ctim.2024.103109": ("H", "LIVE", "NONP", "PFI", "UC", "HUMAN", 90, "physical activity or health behaviour"),
 "10.1513/annalsats.202312-1024oc": ("H", "LIVE", "OTHP", "MBI", "UC", "HUMAN", 251, "psychological"),
 "10.1001/jamanetworkopen.2025.27275": ("P", "OTHER", "NONP", "NR", "UC", "SELF", 184, "feedback or navigation"),
 "10.1002/pon.1217": ("P", "BLEND", "NONP", "NR", "UC", "HUMAN", 30, "professional training"),
}
def key(r): return r["doi"] if r["doi"] in D else "t:" + nt(r["title"])

rows, assessed = [], []
for i, r in enumerate(new, 1):
    stage = triage(r); k = key(r)
    if k in D:
        dec, crit, note = D[k]
    else:
        dec, crit, note = "excluded at screening", "", stage if stage != "reviewer screening" else "Reviewer: outside scope on title/abstract"
    rows.append({"sid": "W%03d" % i, "source_db": r["db"], "title": r["title"], "doi": r["doi"], "year": r["year"], "publication_type": r["type"],
                 "decision": dec, "exclusion_criterion": crit, "note": note})
    if k in D:
        assessed.append({"sid": "W%03d" % i, "source": r["db"], "title": r["title"], "doi": r["doi"], "pmid": "", "year": int(r["year"]),
                         "journal": r["journal"], "decision": dec, "exclusion_criterion": crit, "exclusion_note": note,
                         "charting": CHART.get(k)})
assert set(D) <= {key(r) for r in new}, "decision for unknown record: %s" % (set(D) - {key(r) for r in new})
with open(os.path.join(DATA, "wos_scopus_supplementary_screening.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
json.dump({"retrieved": {"Scopus": len(sc), "Web of Science": len(wos)}, "duplicates_of_earlier_searches": dup, "screened": len(new),
           "sought": len(assessed), "not_retrieved": 0, "assessed": assessed},
          open(os.path.join(DATA, "wos_scopus_supplementary_assessed.json"), "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("exports", len(recs), "| duplicates", dup, "| new unique", len(new), "| assessed", len(assessed))
print(Counter(r["decision"] for r in rows)); print(Counter(a["exclusion_criterion"] for a in assessed if a["decision"] == "excluded"))
