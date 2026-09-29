# -*- coding: utf-8 -*-
"""Stable report and study identifiers for the supplementary-search reports.

Reports assessed in the Europe PMC/OpenAlex supplementary search receive R169 onward in screening order and the
Web of Science/Scopus supplementary reports follow. Reports whose full text was obtained after the ledger was
first numbered are appended at the end so that no earlier identifier changes.
"""
LATE_REPORTS = ("X185",)          # (kept for study-id logic below)
LATE2_REPORTS = ("X112", "X165")   # full texts received after the third search: R287, R288          # Bangladesh online teacher training: full text obtained later, included
# supplementary-search reports whose full text was read for the final decision (all other supplementary reports: abstract)
FULLTEXT_REPORTS = {"X185", "X001", "X173", "X112", "X165"}
LATE_STUDY_IDS = {"R095": "S106", "X185": "S107"}
THIRD_STUDY_FIRST = 108           # included reports of the third supplementary search: S108 onward


def report_ids(supp, supp2, third=(), first=169):
    ids, n = {}, first
    for a in supp:
        if a["sid"] in LATE_REPORTS or a["sid"] in LATE2_REPORTS:
            continue
        ids[a["sid"]] = "R%03d" % n; n += 1
    for a in supp2:
        ids[a["sid"]] = "R%03d" % n; n += 1
    for a in supp:
        if a["sid"] in LATE_REPORTS:
            ids[a["sid"]] = "R%03d" % n; n += 1
    for a in third:               # third supplementary search (PubMed MeSH and delivery terms): R235 onward
        ids[a["sid"]] = "R%03d" % n; n += 1
    for sid in LATE2_REPORTS:
        ids[sid] = "R%03d" % n; n += 1
    return ids


def study_id_map(data_dir):
    """Frozen study identifiers (record_id -> study_id); identifiers are never reused or renumbered."""
    import csv, os
    return {r["record_id"]: r["study_id"] for r in csv.DictReader(open(os.path.join(data_dir, "study_id_map.csv"), encoding="utf-8"))}
