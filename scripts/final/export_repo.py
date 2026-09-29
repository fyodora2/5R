# -*- coding: utf-8 -*-
"""Export the final review datasets to data/ with restricted abstracts removed.

Web of Science and Scopus abstracts are replaced by a placeholder: their terms of service
restrict bulk redistribution. Europe PMC, OpenAlex, ERIC and registry-linked abstracts are kept.
"""
import csv, json, os, shutil

WD = os.environ.get("REVIEW_WORKDIR", ".") + "/"
DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
RESTRICTED = {"Web of Science", "Scopus"}
PLACEHOLDER = ("[abstract text omitted from this repository -- source database terms of service restrict "
               "bulk redistribution of subscription content; screening/coding for this record was performed "
               "against the full abstract during analysis, not stored here]")

recs = json.load(open(WD + "coded_all8.json"))
ver = json.load(open(WD + "eligibility_verification.json"))
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from record_ids import report_ids, LATE_REPORTS, FULLTEXT_REPORTS
os.environ.setdefault("REVIEW_WORKDIR", WD)

# 1. master registry: every report assessed for eligibility
extra = [
    {"record_id": "R147", "source_db": "Europe PMC", "title": "Effectiveness of a Mobile Phone-Based Intervention to Reduce Mental Health Problems in Healthcare Workers During the COVID-19 Pandemic (PsyCovidApp): preprint",
     "doi": "10.2139/ssrn.3749214", "pmid": "", "journal": "SSRN", "pub_year": 2021, "decision": "excluded", "exclusion_criterion": "REPORT",
     "exclusion_note": "Preprint superseded by the peer-reviewed report of the same trial (R023)", "verification_basis": "abstract", "study_id": "", "mechanism": ""},
    {"record_id": "R148", "source_db": "OpenAlex", "title": "Greater Resilience Information Toolkit Japanese Version (GRIT-J)",
     "doi": "10.17605/osf.io/8zav3", "pmid": "", "journal": "OSF Registries", "pub_year": 2026, "decision": "excluded", "exclusion_criterion": "REPORT",
     "exclusion_note": "Trial registration; no results reported", "verification_basis": "abstract", "study_id": "", "mechanism": ""},
]
master = []
for r, v in zip(recs, ver):
    row = dict(v)
    row["pmid"] = r.get("pmid") or ""
    row["journal"] = r.get("journal") or ""
    master.append(row)
master += extra
for m in master:
    m["identification_route"] = "registry linkage" if m["source_db"].startswith("Registry") else "main database search"

# Registry-linked publications not already assessed via the databases (R146 is the included one): R149-R168
reg = list(csv.DictReader(open(os.path.join(DATA, "registry_linked_publications.csv"), encoding="utf-8")))
for i, p in enumerate([p for p in reg if p["decision"] == "excluded"]):
    master.append({"record_id": "R%03d" % (149 + i), "study_id": "", "source_db": "Registry-linked (ClinicalTrials.gov)",
                   "title": p["title"], "doi": p["doi"], "pmid": p["pmid"], "journal": "", "pub_year": "",
                   "decision": "excluded", "exclusion_criterion": p["exclusion_criterion"],
                   "exclusion_note": p["note"] + " (" + p["registration"] + ")", "verification_basis": "abstract",
                   "mechanism": "", "identification_route": "registry linkage"})

# Supplementary search without the intervention-type block: R169 onward
supp = json.load(open(os.path.join(DATA, "supplementary_assessed.json"), encoding="utf-8"))["assessed"]
charting = {r["primary_report"]: r for r in csv.DictReader(open(WD + "study_charting.csv", encoding="utf-8"))}
supp2 = json.load(open(os.path.join(DATA, "wos_scopus_supplementary_assessed.json"), encoding="utf-8"))["assessed"]
RID = report_ids(supp, supp2)
for a in supp:
    rid = RID[a["sid"]]
    st = charting.get(rid)
    master.append({"record_id": rid, "study_id": st["study_id"] if st else "", "source_db": a["source"], "title": a["title"],
                   "doi": a["doi"], "pmid": a["pmid"], "journal": "", "pub_year": a["year"], "decision": a["decision"],
                   "exclusion_criterion": a["exclusion_criterion"], "exclusion_note": a["exclusion_note"],
                   "verification_basis": "full text" if a["sid"] in FULLTEXT_REPORTS else "abstract", "mechanism": st["mechanism"] if st else "",
                   "identification_route": "supplementary database search"})
for a in supp2:
    rid = RID[a["sid"]]
    st = charting.get(rid)
    master.append({"record_id": rid, "study_id": st["study_id"] if st else "", "source_db": a["source"], "title": a["title"],
                   "doi": a["doi"], "pmid": "", "journal": a["journal"], "pub_year": a["year"], "decision": a["decision"],
                   "exclusion_criterion": a["exclusion_criterion"], "exclusion_note": a["exclusion_note"],
                   "verification_basis": "abstract", "mechanism": st["mechanism"] if st else "",
                   "identification_route": "supplementary database search"})
cols = ["record_id", "study_id", "identification_route", "source_db", "title", "doi", "pmid", "journal", "pub_year", "decision",
        "exclusion_criterion", "exclusion_note", "verification_basis", "mechanism"]
with open(os.path.join(DATA, "master_registry.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore"); w.writeheader(); w.writerows(master)

# 2. included reports (sanitized abstracts, exploratory text-map coordinates for the dashboard)
cl = json.load(open(WD + "clustered_final.json"))
inc = []
for r in cl["records"]:
    inc.append({
        "record_id": r["record_id"], "study_id": r["study_id"], "source_db": r["source"], "title": r["title"],
        "abstract": PLACEHOLDER if r["source"] in RESTRICTED else r["abstract"], "pub_year": r["pubYear"],
        "journal": r["journal"], "doi": r["doi"], "pmid": r["pmid"], "verification_basis": r["verification_basis"],
        "text_cluster": r["cluster"], "x": round(r["x"], 5), "y": round(r["y"], 5),
    })
for a in supp:
    if a["decision"] == "included":
        rid = RID[a["sid"]]
        inc.append({"record_id": rid, "study_id": charting[rid]["study_id"], "source_db": a["source"] + " (supplementary search)",
                    "title": a["title"], "abstract": a["abstract"], "pub_year": a["year"], "journal": "", "doi": a["doi"],
                    "pmid": a["pmid"], "verification_basis": "full text" if a["sid"] in FULLTEXT_REPORTS else "abstract", "text_cluster": None, "x": None, "y": None})
for a in supp2:
    if a["decision"] == "included":
        rid = RID[a["sid"]]
        inc.append({"record_id": rid, "study_id": charting[rid]["study_id"], "source_db": a["source"] + " (supplementary search)",
                    "title": a["title"], "abstract": PLACEHOLDER, "pub_year": a["year"], "journal": a["journal"], "doi": a["doi"],
                    "pmid": "", "verification_basis": "abstract", "text_cluster": None, "x": None, "y": None})
json.dump({"note": "Exploratory TF-IDF/k-means text map of titles and abstracts; not used in the manuscript.",
           "k": cl["k"], "silhouette": round(cl["silhouette"], 4), "cluster_top_terms": cl["cluster_top_terms"],
           "records": inc}, open(os.path.join(DATA, "included_reports.json"), "w"), ensure_ascii=False, indent=1)

# 3. study-level charting and summary
for fn in ("study_charting.csv", "study_summary.json"):
    shutil.copy(WD + fn, os.path.join(DATA, fn))

# leak check
leaks = sum(1 for r in inc if r["source_db"] in RESTRICTED and r["abstract"] != PLACEHOLDER)
from collections import Counter
print(Counter((m["identification_route"], m["decision"]) for m in master))
print("master", len(master), "| included reports", len(inc), "| restricted-source leaks", leaks)
assert leaks == 0
