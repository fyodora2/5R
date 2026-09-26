import json, os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
FA = json.load(open(os.path.join(HERE, "final_analysis_all.json")))
S = FA["summary"]
recs = FA["records"]

def topn_plus_other(counter_dict, n):
    items = sorted(counter_dict.items(), key=lambda kv: -kv[1])
    top = items[:n]
    other = sum(v for k, v in items[n:])
    labels = [k for k, v in top]
    if other > 0:
        labels.append("Other")
    return labels

approach_labels = topn_plus_other(S["approaches"], 6)
occupation_labels = topn_plus_other(S["occupations"], 5)
technology_labels = topn_plus_other(S["technologies"], 6)

def fold(label, allowed):
    return label if label in allowed else "Other"

years = sorted(int(y) for y in S["year_counts"].keys())

approach_by_year_raw = FA["approach_by_year"]
temporal_approach = {str(y): Counter() for y in years}
for y in years:
    for lab, n in approach_by_year_raw.get(str(y), {}).items():
        temporal_approach[str(y)][fold(lab, approach_labels)] += n

def build_matrix(ct_raw, row_labels, col_labels):
    mat = {r: {c: 0 for c in col_labels} for r in row_labels}
    for a, bdict in ct_raw.items():
        ra = fold(a, row_labels)
        if ra not in mat:
            continue
        for b, n in bdict.items():
            cb = fold(b, col_labels)
            mat[ra][cb] = mat[ra].get(cb, 0) + n
    return mat

approach_x_occupation = build_matrix(FA["approach_x_occupation"], approach_labels, occupation_labels)
approach_x_technology = build_matrix(FA["approach_x_technology"], approach_labels, technology_labels)

cluster_terms = S["cluster_top_terms"]
cluster_sizes = S["cluster_sizes"]
clusters_meta = [
    {"id": int(cid), "n": cluster_sizes.get(cid, 0), "terms": cluster_terms.get(cid, [])[:5]}
    for cid in sorted(cluster_sizes.keys(), key=lambda x: -cluster_sizes[x])
]

records_out = []
for r in recs:
    records_out.append({
        "t": r["title"], "y": r["pubYear"], "j": r["journal"], "doi": r["doi"], "pmid": r["pmid"],
        "cited": r.get("citedByCount", 0), "src": r["source"],
        "occ": r["occupations"], "tech": r["technologies"], "app": r["approaches"],
        "inst": r["instruments"], "comp": r["comparators"], "guide": r["guidance"],
        "cl": r["cluster"], "x": round(r["x"], 4), "yy": round(r["y"], 4),
    })

# Multi-database PRISMA-ScR flow numbers (hand-computed from the three fetch/screen passes)
flow = {
    "sources": [
        {"name": "Europe PMC", "raw": 227, "unique": 213, "include": 85, "uncertain": 32, "exclude": 96},
        {"name": "OpenAlex (new only, after cross-db dedup)", "raw": 716, "unique_new": 315, "include": 30,
         "note": "259 already found via Europe PMC; 116 excluded by type (review/dissertation/editorial/etc.); 26 had no abstract"},
        {"name": "ERIC (education database)", "raw": 8, "include": 1,
         "note": "7 excluded: in-person delivery, student-only population, or non-intervention study"},
    ],
    "total_unique_screened": 213 + 315 + 8,
    "total_included": 116,
}

dashboard = {
    "n_included": S["n_included"],
    "source_counts": S["source_counts"],
    "flow": flow,
    "year_range": S["year_range"],
    "years": years,
    "year_counts": {y: S["year_counts"][str(y)] for y in years},
    "approach_labels": approach_labels,
    "occupation_labels": occupation_labels,
    "technology_labels": technology_labels,
    "temporal_approach": {y: dict(temporal_approach[str(y)]) for y in years},
    "totals": {
        "occupations": S["occupations"], "technologies": S["technologies"], "approaches": S["approaches"],
        "instruments": S["instruments"], "comparators": S["comparators"], "guidance": S["guidance"],
    },
    "approach_x_occupation": approach_x_occupation,
    "approach_x_technology": approach_x_technology,
    "clusters": clusters_meta,
    "k": S["k"],
    "silhouette": S["silhouette"],
    "records": records_out,
}

out_path = os.path.join(HERE, "dashboard_data_all.json")
with open(out_path, "w") as f:
    json.dump(dashboard, f, ensure_ascii=False, separators=(",", ":"))
print("wrote", out_path, os.path.getsize(out_path), "bytes")
