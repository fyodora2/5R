# -*- coding: utf-8 -*-
import json, csv, os, sys, statistics
from collections import Counter, defaultdict
SP = os.environ.get("REVIEW_WORKDIR", ".") + "/"
sys.path.insert(0, SP)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from charting import C, LINKED, MECH_OVERRIDE

recs = json.load(open(SP + "coded_all8.json"))
ver = json.load(open(SP + "eligibility_verification.json"))
inc_ids = [i + 1 for i, v in enumerate(ver) if v["decision"] == "included"]
primary = [i for i in inc_ids if i not in LINKED]
assert set(primary) == set(C), (sorted(set(primary) - set(C)), sorted(set(C) - set(primary)))
assert len(primary) == 86

# Supplementary search (no intervention-type block): assessed reports receive IDs R169 onward in screening
# order; included ones become studies S087 onward.
REPO_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
SUPP = json.load(open(os.path.join(REPO_DATA, "supplementary_assessed.json"), encoding="utf-8"))["assessed"]
SUPP_ID = {a["sid"]: "R%03d" % (169 + i) for i, a in enumerate(SUPP)}
SUPP2 = json.load(open(os.path.join(REPO_DATA, "wos_scopus_supplementary_assessed.json"), encoding="utf-8"))["assessed"]
SUPP2_ID = {a["sid"]: "R%03d" % (169 + len(SUPP) + i) for i, a in enumerate(SUPP2)}

LAB = {
 "occ": {"N": "Nurses", "P": "Physicians and physician trainees", "H": "Other or mixed healthcare workers",
         "M": "Mental-health and social-care professionals", "T": "Teachers and education staff",
         "E": "Employees in other sectors or mixed occupations"},
 "mod": {"WEB": "Web-based program", "APP": "Smartphone app", "LIVE": "Live online sessions",
         "MSG": "Text or instant messaging", "CHAT": "Chatbot", "BLEND": "Blended (digital and in-person)",
         "OTHER": "Wearable or motion-sensing platform", "AIS": "Ambient AI scribe"},
 "app": {"MIND": "Mindfulness or meditation", "COMP": "Compassion-based", "CBT": "Cognitive-behavioural or stress management",
         "ACT": "Acceptance and commitment", "POS": "Positive psychology", "COACH": "Coaching",
         "PSYED": "Psychoeducation or resilience training", "OTHP": "Other psychological",
         "NONP": "Non-psychological mechanism"},
 "cmp": {"WL": "Waitlist or delayed access", "UC": "Usual practice or no intervention", "AC": "Active or attention control",
         "H2H": "Head-to-head digital variants", "NR": "Not reported"},
 "gui": {"SELF": "Self-guided or automated", "HUMAN": "Human-supported or facilitated", "NR": "Not reported"},
}

# year of the earliest report of each study
years = {}
for i in inc_ids:
    root = LINKED.get(i, i)
    y = recs[i - 1]["pubYear"]
    years[root] = min(years.get(root, 9999), y)

rows = []
for i in sorted(primary):
    occ, mod, app, ins, cmp_, gui, n = C[i]
    r = recs[i - 1]
    reports = [f"R{j:03d}" for j in inc_ids if LINKED.get(j, j) == i]
    mech = MECH_OVERRIDE.get(i, ver[i - 1]["mechanism"])
    rows.append({
        "study_id": ver[i - 1]["study_id"], "primary_report": f"R{i:03d}", "reports": ";".join(reports),
        "n_reports": len(reports), "first_year": years[i], "title": r["title"], "doi": r.get("doi") or "",
        "source_db": r["source"], "occupation": LAB["occ"][occ], "delivery": LAB["mod"][mod],
        "approach": LAB["app"][app], "mechanism": mech, "burnout_instrument": ins,
        "comparator": LAB["cmp"][cmp_], "human_support": LAB["gui"][gui], "n_randomized": n if n else "",
    })

for a in SUPP + SUPP2:
    if a["decision"] != "included":
        continue
    occ, mod, app, ins, cmp_, gui, n, mech = a["charting"]
    rid = SUPP_ID.get(a["sid"]) or SUPP2_ID[a["sid"]]
    rows.append({
        "study_id": "S%03d" % (len(rows) + 1), "primary_report": rid, "reports": rid, "n_reports": 1,
        "first_year": int(a["year"]), "title": a["title"], "doi": a["doi"] or "", "source_db": a["source"] + " (supplementary search)",
        "occupation": LAB["occ"][occ], "delivery": LAB["mod"][mod], "approach": LAB["app"][app], "mechanism": mech,
        "burnout_instrument": ins, "comparator": LAB["cmp"][cmp_], "human_support": LAB["gui"][gui], "n_randomized": n if n else "",
    })

# Burnout instrument: named in the abstract, or identified from the full text (data/instrument_fulltext_verification.csv)
VER = {}
_vp = os.path.join(REPO_DATA, "instrument_fulltext_verification.csv")
if os.path.exists(_vp):
    VER = {r["study_id"]: r for r in csv.DictReader(open(_vp, encoding="utf-8"))}
for r in rows:
    r["burnout_instrument_source"] = "abstract" if r["burnout_instrument"] != "NR" else "not determined"
    v = VER.get(r["study_id"])
    if v and r["burnout_instrument"] == "NR" and v["instrument_code"] != "NR":
        r["burnout_instrument"] = v["instrument_code"]; r["burnout_instrument_source"] = "full text"
        r["burnout_instrument_detail"] = v["instrument_detail"]
    else:
        r["burnout_instrument_detail"] = ""

for r in rows:  # one label for exercise- and lifestyle-based mechanisms
    if r["mechanism"] == "physical activity":
        r["mechanism"] = "physical activity or health behaviour"

with open(SP + "study_charting.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

def dist(key, order=None):
    c = Counter(r[key] for r in rows)
    keys = order or [k for k, _ in c.most_common()]
    return {k: c.get(k, 0) for k in keys}

ns = sorted(r["n_randomized"] for r in rows if r["n_randomized"] != "")
q = statistics.quantiles(ns, n=4)
by_period = Counter("2004-2019" if r["first_year"] <= 2019 else ("2020-2022" if r["first_year"] <= 2022 else "2023-2026") for r in rows)
yc = Counter(r["first_year"] for r in rows)
occ_x_app = defaultdict(Counter); occ_x_mod = defaultdict(Counter); period_x_mod = defaultdict(Counter)
for r in rows:
    occ_x_app[r["occupation"]][r["approach"]] += 1
    occ_x_mod[r["occupation"]][r["delivery"]] += 1
    p = "2004-2019" if r["first_year"] <= 2019 else ("2020-2022" if r["first_year"] <= 2022 else "2023-2026")
    period_x_mod[p][r["delivery"]] += 1

ins = Counter(r["burnout_instrument"] for r in rows)
summary = {
    "n_studies": len(rows), "n_reports": sum(r["n_reports"] for r in rows),
    "multi_report_studies": [r["study_id"] + ":" + r["reports"] for r in rows if r["n_reports"] > 1],
    "occupation": dist("occupation"), "delivery": dist("delivery"), "approach": dist("approach"),
    "mechanism": dist("mechanism"), "comparator": dist("comparator"), "human_support": dist("human_support"),
    "burnout_instrument": dict(ins.most_common()),
    "burnout_instrument_source": dict(Counter(r["burnout_instrument_source"] for r in rows)),
    "n_randomized": {"reported": len(ns), "median": statistics.median(ns), "q1": q[0], "q3": q[2],
                      "min": ns[0], "max": ns[-1], "total": sum(ns), "n_ge_200": sum(1 for x in ns if x >= 200)},
    "first_year_counts": {str(y): yc[y] for y in sorted(yc)},
    "period": dict(sorted(by_period.items())),
    "occ_x_app": {k: dict(v) for k, v in occ_x_app.items()},
    "occ_x_mod": {k: dict(v) for k, v in occ_x_mod.items()},
    "period_x_mod": {k: dict(v) for k, v in period_x_mod.items()},
    "healthcare_studies": sum(1 for r in rows if r["occupation"] in (LAB["occ"]["N"], LAB["occ"]["P"], LAB["occ"]["H"])),
}
json.dump(summary, open(SP + "study_summary.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(summary, ensure_ascii=False, indent=1))
