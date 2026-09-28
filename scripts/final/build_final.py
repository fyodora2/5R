# -*- coding: utf-8 -*-
"""Build the final analysed corpus from the eligibility verification.

Outputs (working directory, unsanitized): coded_final.json, clustered_final.json,
final_analysis_final.json, coded_dataset_final.csv
"""
import json, csv, os, sys
from collections import Counter, defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import TruncatedSVD

SP = os.environ.get("REVIEW_WORKDIR", ".") + "/"
recs = json.load(open(SP + "coded_all8.json"))
ver = json.load(open(SP + "eligibility_verification.json"))

final = []
for r, v in zip(recs, ver):
    if v["decision"] != "included":
        continue
    r2 = {k: r[k] for k in ("source", "title", "abstract", "pubYear", "journal", "doi", "pmid",
                            "citedByCount", "isOpenAccess", "occupations", "technologies",
                            "approaches", "instruments", "comparators", "guidance")}
    r2["record_id"] = v["record_id"]
    r2["study_id"] = v["study_id"]
    r2["mechanism"] = v["mechanism"]
    r2["verification_basis"] = v["verification_basis"]
    final.append(r2)
json.dump(final, open(SP + "coded_final.json", "w"), ensure_ascii=False, indent=1)

# --- exploratory text clustering (dashboard only) ---
EXTRA_STOP = {"study","studies","trial","trials","randomized","randomised","participants","intervention",
    "interventions","effect","effects","effectiveness","efficacy","group","groups","results","aim","aims",
    "background","objective","objectives","method","methods","conclusion","conclusions","among","using",
    "based","use","used","compared","control","controlled","outcome","outcomes","significant",
    "significantly","p","95","ci","vs","versus","pilot","feasibility","burnout","digital"}
docs = [(r["title"] + " . " + (r["abstract"] or "")) for r in final]
vec = TfidfVectorizer(lowercase=True, stop_words="english", ngram_range=(1, 2), min_df=3, max_df=0.6, sublinear_tf=True)
X = vec.fit_transform(docs)
vocab = np.array(vec.get_feature_names_out())
keep = np.array([not any(w in EXTRA_STOP for w in t.split()) for t in vocab])
best = (None, -1, None, None)
for k in range(3, 10):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    lab = km.fit_predict(X)
    sc = silhouette_score(X, lab)
    if sc > best[1]:
        best = (k, sc, lab, km)
k, sil, labels, model = best
order = model.cluster_centers_.argsort()[:, ::-1]
terms = {}
for c in range(k):
    t = [vocab[i] for i in order[c] if keep[i]][:10]
    terms[str(c)] = t
coords = TruncatedSVD(n_components=2, random_state=42).fit_transform(X)
for i, r in enumerate(final):
    r["cluster"] = int(labels[i]); r["x"] = float(coords[i, 0]); r["y"] = float(coords[i, 1])
json.dump({"k": k, "silhouette": sil, "cluster_top_terms": terms, "records": final},
          open(SP + "clustered_final.json", "w"), ensure_ascii=False, indent=1)

# --- descriptive analysis ---
def cnt(field):
    c = Counter()
    for r in final:
        for v in r[field]:
            c[v] += 1
    return dict(c.most_common())

def by_year(field):
    out = defaultdict(Counter)
    for r in final:
        for v in r[field]:
            out[r["pubYear"]][v] += 1
    return out

def xtab(a, b):
    ct = defaultdict(Counter)
    for r in final:
        for x in r[a]:
            for y in r[b]:
                ct[x][y] += 1
    return ct

years = sorted({r["pubYear"] for r in final if r["pubYear"]})
yc = Counter(r["pubYear"] for r in final)
HEALTH = {"Nurses", "Physicians/Residents", "Mixed healthcare workers", "Mental health professionals",
          "Dentists/Pharmacists", "Veterinary staff"}
studies = {}
for r in final:
    studies.setdefault(r["study_id"], r)

summary = {
    "n_included": len(final),
    "n_studies": len(studies),
    "n_healthcare_reports": sum(1 for r in final if set(r["occupations"]) & HEALTH),
    "n_post2021": sum(1 for r in final if r["pubYear"] and r["pubYear"] >= 2022),
    "source_counts": dict(Counter(r["source"] for r in final)),
    "year_range": [min(years), max(years)],
    "year_counts": {str(y): yc[y] for y in years},
    "occupations": cnt("occupations"), "technologies": cnt("technologies"),
    "approaches": cnt("approaches"), "instruments": cnt("instruments"),
    "comparators": cnt("comparators"), "guidance": cnt("guidance"),
    "mechanism": dict(Counter(r["mechanism"] for r in final).most_common()),
    "cluster_top_terms": terms, "cluster_sizes": dict(Counter(str(r["cluster"]) for r in final)),
    "silhouette": sil, "k": k,
}
aby = by_year("approaches")
out = {
    "summary": summary,
    "approach_by_year": {str(y): dict(aby[y]) for y in years},
    "approach_x_occupation": {a: dict(b) for a, b in xtab("approaches", "occupations").items()},
    "approach_x_technology": {a: dict(b) for a, b in xtab("approaches", "technologies").items()},
    "approach_x_instrument": {a: dict(b) for a, b in xtab("approaches", "instruments").items()},
    "records": [{
        "record_id": r["record_id"], "study_id": r["study_id"], "title": r["title"], "pubYear": r["pubYear"],
        "journal": r["journal"], "doi": r["doi"], "pmid": r["pmid"], "citedByCount": r.get("citedByCount", 0),
        "isOpenAccess": r.get("isOpenAccess"), "source": r["source"], "mechanism": r["mechanism"],
        "occupations": r["occupations"], "technologies": r["technologies"], "approaches": r["approaches"],
        "instruments": r["instruments"], "comparators": r["comparators"], "guidance": r["guidance"],
        "cluster": r["cluster"], "x": r["x"], "y": r["y"],
    } for r in final],
}
json.dump(out, open(SP + "final_analysis_final.json", "w"), ensure_ascii=False, indent=1)

with open(SP + "coded_dataset_final.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["record_id", "study_id", "title", "pubYear", "journal", "doi", "pmid", "source", "mechanism",
                "occupations", "technologies", "approaches", "instruments", "comparators", "guidance"])
    for r in final:
        w.writerow([r["record_id"], r["study_id"], r["title"], r["pubYear"], r["journal"], r["doi"], r["pmid"],
                    r["source"], r["mechanism"], "; ".join(r["occupations"]), "; ".join(r["technologies"]),
                    "; ".join(r["approaches"]), "; ".join(r["instruments"]), "; ".join(r["comparators"]),
                    "; ".join(r["guidance"])])

print(json.dumps({k: summary[k] for k in ("n_included", "n_studies", "n_healthcare_reports", "n_post2021",
      "source_counts", "year_range", "k", "silhouette", "mechanism")}, indent=1))
for key in ("occupations", "technologies", "approaches", "instruments", "comparators", "guidance"):
    print(key, summary[key])
print("years", summary["year_counts"])
