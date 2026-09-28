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
cols = ["record_id", "study_id", "source_db", "title", "doi", "pmid", "journal", "pub_year", "decision",
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
json.dump({"note": "Exploratory TF-IDF/k-means text map of titles and abstracts; not used in the manuscript.",
           "k": cl["k"], "silhouette": round(cl["silhouette"], 4), "cluster_top_terms": cl["cluster_top_terms"],
           "records": inc}, open(os.path.join(DATA, "included_reports.json"), "w"), ensure_ascii=False, indent=1)

# 3. study-level charting and summary
for fn in ("study_charting.csv", "study_summary.json"):
    shutil.copy(WD + fn, os.path.join(DATA, fn))

# leak check
leaks = sum(1 for r in inc if r["source_db"] in RESTRICTED and r["abstract"] != PLACEHOLDER)
print("master", len(master), "| included reports", len(inc), "| restricted-source leaks", leaks)
assert leaks == 0
