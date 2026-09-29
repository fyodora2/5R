# -*- coding: utf-8 -*-
"""Stable report and study identifiers for the supplementary-search reports.

Reports assessed in the Europe PMC/OpenAlex supplementary search receive R169 onward in screening order and the
Web of Science/Scopus supplementary reports follow. Reports whose full text was obtained after the ledger was
first numbered are appended at the end so that no earlier identifier changes.
"""
LATE_REPORTS = ("X185",)          # Bangladesh online teacher training: full text obtained later, included
# supplementary-search reports whose full text was read for the final decision (all other supplementary reports: abstract)
FULLTEXT_REPORTS = {"X185", "X001", "X173"}
LATE_STUDY_IDS = {"R095": "S106", "X185": "S107"}
THIRD_STUDY_FIRST = 108           # included reports of the third supplementary search: S108 onward


def report_ids(supp, supp2, third=(), first=169):
    ids, n = {}, first
    for a in supp:
        if a["sid"] in LATE_REPORTS:
            continue
        ids[a["sid"]] = "R%03d" % n; n += 1
    for a in supp2:
        ids[a["sid"]] = "R%03d" % n; n += 1
    for a in supp:
        if a["sid"] in LATE_REPORTS:
            ids[a["sid"]] = "R%03d" % n; n += 1
    for a in third:               # third supplementary search (PubMed MeSH and delivery terms): R235 onward
        ids[a["sid"]] = "R%03d" % n; n += 1
    return ids
