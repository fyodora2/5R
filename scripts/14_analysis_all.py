import json, os, sys, csv
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, "clustered_all.json")))
recs = D["records"]
cluster_terms = D["cluster_top_terms"]

year_counts = Counter(r["pubYear"] for r in recs if r["pubYear"])
years_sorted = sorted(year_counts)

def by_year_multi(field):
    out = defaultdict(lambda: Counter())
    for r in recs:
        y = r["pubYear"]
        if not y:
            continue
        for v in r[field]:
            out[y][v] += 1
    return out

approach_by_year = by_year_multi("approaches")

def crosstab(field_a, field_b):
    ct = defaultdict(lambda: Counter())
    for r in recs:
        for a in r[field_a]:
            for b in r[field_b]:
                ct[a][b] += 1
    return ct

approach_x_occupation = crosstab("approaches", "occupations")
approach_x_technology = crosstab("approaches", "technologies")
approach_x_instrument = crosstab("approaches", "instruments")

def counter_dim(field):
    c = Counter()
    for r in recs:
        for v in r[field]:
            c[v] += 1
    return dict(c.most_common())

source_counts = Counter(r["source"] for r in recs)

summary = {
    "n_included": len(recs),
    "source_counts": dict(source_counts),
    "year_range": [min(years_sorted), max(years_sorted)] if years_sorted else None,
    "year_counts": {str(y): year_counts[y] for y in years_sorted},
    "occupations": counter_dim("occupations"),
    "technologies": counter_dim("technologies"),
    "approaches": counter_dim("approaches"),
    "instruments": counter_dim("instruments"),
    "comparators": counter_dim("comparators"),
    "guidance": counter_dim("guidance"),
    "cluster_top_terms": cluster_terms,
    "cluster_sizes": dict(Counter(r["cluster"] for r in recs)),
    "silhouette": D["silhouette"],
    "k": D["k"],
}

final = {
    "summary": summary,
    "approach_by_year": {str(y): dict(approach_by_year[y]) for y in years_sorted},
    "approach_x_occupation": {a: dict(b) for a, b in approach_x_occupation.items()},
    "approach_x_technology": {a: dict(b) for a, b in approach_x_technology.items()},
    "approach_x_instrument": {a: dict(b) for a, b in approach_x_instrument.items()},
    "records": [
        {
            "title": r["title"], "pubYear": r["pubYear"], "journal": r["journal"],
            "doi": r["doi"], "pmid": r["pmid"], "citedByCount": r.get("citedByCount",0),
            "isOpenAccess": r.get("isOpenAccess"), "source": r["source"],
            "occupations": r["occupations"], "technologies": r["technologies"],
            "approaches": r["approaches"], "instruments": r["instruments"],
            "comparators": r["comparators"], "guidance": r["guidance"],
            "cluster": r["cluster"], "x": r["x"], "y": r["y"],
        } for r in recs
    ],
}

with open(os.path.join(HERE, "final_analysis_all.json"), "w") as f:
    json.dump(final, f, ensure_ascii=False, indent=1)

csv_path = os.path.join(HERE, "coded_dataset_all.csv")
with open(csv_path, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["title","pubYear","journal","doi","pmid","source","cited_by","open_access",
                "occupations","technologies","approaches","instruments","comparators",
                "guidance","cluster","cluster_top_terms"])
    for r in recs:
        w.writerow([
            r["title"], r["pubYear"], r["journal"], r["doi"], r["pmid"], r["source"],
            r.get("citedByCount",0), r.get("isOpenAccess"),
            "; ".join(r["occupations"]), "; ".join(r["technologies"]),
            "; ".join(r["approaches"]), "; ".join(r["instruments"]),
            "; ".join(r["comparators"]), "; ".join(r["guidance"]),
            r["cluster"], "; ".join(cluster_terms.get(str(r["cluster"]), [])[:6]),
        ])

print("[analysis] wrote final_analysis_all.json and coded_dataset_all.csv", file=sys.stderr)
print(json.dumps(summary["source_counts"], indent=2), file=sys.stderr)
print(json.dumps(summary["year_counts"], indent=2), file=sys.stderr)
