#!/usr/bin/env python3
"""Validate a review ledger and print PRISMA flow counts.

Usage: python3 prisma_counts.py LEDGER.csv [criteria order, comma separated]
Default criteria order matches the burnout review: REPORT,DESIGN,POP,DIGITAL,BURNOUT
Exit status 1 if the ledger is inconsistent.
"""
import csv, sys
from collections import Counter

ledger = sys.argv[1] if len(sys.argv) > 1 else "master_registry.csv"
order = (sys.argv[2] if len(sys.argv) > 2 else "REPORT,DESIGN,POP,DIGITAL,BURNOUT").split(",")
rows = list(csv.DictReader(open(ledger, encoding="utf-8")))
errors = []

ids = [r["record_id"] for r in rows]
dup = [k for k, v in Counter(ids).items() if v > 1]
if dup: errors.append(f"duplicate record_id: {dup[:5]}")
for r in rows:
    d = r["decision"]
    if d not in ("included", "excluded"): errors.append(f"{r['record_id']}: decision '{d}'")
    if d == "included":
        if not r.get("study_id"): errors.append(f"{r['record_id']}: included without study_id")
        if r.get("exclusion_criterion"): errors.append(f"{r['record_id']}: included but has exclusion_criterion")
    if d == "excluded":
        if r.get("exclusion_criterion") not in order: errors.append(f"{r['record_id']}: criterion '{r.get('exclusion_criterion')}' not in order")
        if not r.get("exclusion_note"): errors.append(f"{r['record_id']}: excluded without a reason")
    if r.get("study_id") and d == "excluded" and False: pass

inc = [r for r in rows if r["decision"] == "included"]
studies = sorted({r["study_id"] for r in inc})
print(f"assessed reports: {len(rows)}")
for route, n in Counter(r["identification_route"] for r in rows).items():
    e = sum(1 for r in rows if r["identification_route"] == route and r["decision"] == "excluded")
    print(f"  {route}: assessed {n}, excluded {e}, included {n - e}")
exc = Counter(r["exclusion_criterion"] for r in rows if r["decision"] == "excluded")
print("excluded by first failed criterion:", ", ".join(f"{c} {exc.get(c, 0)}" for c in order))
print(f"included reports: {len(inc)}; included studies: {len(studies)}")
if sum(exc.values()) + len(inc) != len(rows): errors.append("excluded + included != assessed")
print("OK" if not errors else "\n".join(["PROBLEMS:"] + errors[:30]))
sys.exit(1 if errors else 0)
