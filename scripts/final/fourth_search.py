# -*- coding: utf-8 -*-
"""Update search of 18 October 2026: one unified search (burnout AND any digital-delivery term AND randomized design, with no
intervention-type block) in Europe PMC, OpenAlex and PubMed, run after the journal review asked for a single strategy
consistent with the eligibility criteria. OpenAlex and PubMed were restricted to records published since 1 September 2026
because their full ranges had already been covered by the earlier searches; the Europe PMC search covers all years.
Records already identified or assessed earlier were removed (as in third_search.py); the remainder was screened with the same
rules and assessed against the same five criteria.

Input : data/raw_fourth_search.json (queries, counts and the records that were not already known)
Output: data/fourth_search_screening.csv, data/fourth_search_assessed.json
"""
import csv, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(os.path.dirname(HERE)), "data")
raw = json.load(open(os.path.join(DATA, "raw_fourth_search.json"), encoding="utf-8"))
BURN = re.compile(r"burn-?out|emotional exhaustion|exhaustion", re.I)
RAND = re.compile(r"randomi[sz]|randomly (assigned|allocated)|random (assignment|allocation)|cluster.random|crossover|cross-over", re.I)
DIG = re.compile(r"\b(digital|online|on-line|internet|web-?based|website|apps?|mobile|smartphone|e-?health|m-?health|telehealth|tele\w*|computer\w*|chatbot|virtual\w*|video\w*|zoom|wearable|sms|text m\w*|whatsapp|wechat|chatgpt|artificial intelligence|\bAI\b|actigraph\w*)\b", re.I)

def triage(r):
    t, a, ty = r["title"].lower(), r["abstract"].lower(), ";".join(r["types"]).lower()
    ta = t + " " + a
    if re.search(r"\breview\b|editorial|comment|letter|erratum|paratext|dataset|congress|abstract supplement", ty) and "randomized controlled trial" not in ty:
        return "non-article publication type or review"
    if re.search(r"systematic review|meta-analys|scoping review|literature review|umbrella review|narrative review|review of|critical review", t): return "review"
    if re.search(r"\bprotocol\b|study protocol|trial protocol", t) or "protocol" in ty: return "protocol"
    if a.strip() and not BURN.search(ta): return "burnout not mentioned"
    if a.strip() and not RAND.search(ta): return "no randomized allocation"
    if a.strip() and not DIG.search(ta): return "no digital delivery wording"
    return "reviewer screening"

SCREEN = {   # excluded at reviewer screening (key: title start)
 "Explainable AI for resource-aware": "Machine-learning model; not a trial",
 "Supporting Emotional Self-Awareness Under Occupational Stress": "Study registration (OSF); no results",
 "Social support effects on SLP stress and burnout": "Supplementary material deposited for the speech-language pathologist trial (companion record, not a separate report)",
 "Temporal Quotas, Interrupted Task": "Observational preprint",
 "Preschool Teachers' Self-Efficacy, Burnout, and Stress in Online Professional Development": "Duplicate of an included report (R195; the ERIC title contains encoded characters)",
 "Att främja gymnasiestuderandes": "Dissertation on school students, not workers",
}
ELIG = {     # (decision, first failed criterion, reason, verification basis)
 "Randomised controlled trial to investigate an online compassionate imagery": ("excluded", "BURNOUT", "Burnout mentioned only as background; the reported outcomes are resilience, self-compassion, rumination and self-criticism", "abstract"),
 "A Randomized Controlled Trial of Social Support Intervention": ("included", "", "Randomized online peer-support groups vs delayed treatment in school-based speech-language pathologists; MBI Educators Survey", "abstract"),
 "Factors influencing implementation of a digital compassion": ("excluded", "REPORT", "Unpublished preprint of a pilot trial with implementation outcomes", "abstract"),
 "Effect of Virtual Reality Relaxation on Alarm Fatigue": ("included", "", "Randomized virtual-reality relaxation vs control in ICU nurses; ProQOL burnout dimension compared between groups", "abstract"),
 "Reducing Teacher Burnout and Promoting Student Prosocial Behavior": ("included", "", "Randomized waitlist-controlled trial of telementoring sessions for middle-school teachers; burnout reduced in the intervention group (ERIC record; the accepted-manuscript copy ED679869 is the same trial)", "abstract"),
 "Integrating Educator Mental Health as a Critical Component": ("excluded", "REPORT", "Conference paper using baseline data of a randomized trial; not the primary results report", "abstract"),
 "Experimental Impacts of the": ("excluded", "DIGITAL", "In-person workshops and coaching; video-based discussion groups were a minor component for parents only", "abstract"),
 "Well-Being Training for Preservice Teachers": ("excluded", "POP", "Preservice teachers (students not yet employed)", "abstract"),
 "Promoting Well-Being among Intercollegiate Student-Athletes": ("excluded", "POP", "University student-athletes, not workers", "abstract"),
 "The Cost of Caring": ("excluded", "DESIGN", "Pre-post experimental study of a self-care group; no randomized allocation", "abstract"),
 "A Personalized Recovery Intervention to Support Sleep Health": ("excluded", "BURNOUT", "Sleep outcomes only; burnout appears only as a hoped-for consequence in the conclusion", "abstract"),
 "A Randomized Controlled Pilot Study Comparing ChatGPT": ("excluded", "BURNOUT", "Burnout mentioned only as background; outcomes are communication skills", "abstract"),
}
CHART = {    # occupation, delivery, approach, instrument, comparator, support, n randomized, mechanism
 "A Randomized Controlled Trial of Social Support Intervention": ["H", "LIVE", "OTHP", "MBI", "WL", "HUMAN", 46, "psychological"],
 "Effect of Virtual Reality Relaxation on Alarm Fatigue": ["N", "OTHER", "OTHP", "ProQOL", "NR", "NR", 60, "psychological"],
 "Reducing Teacher Burnout and Promoting Student Prosocial Behavior": ["T", "LIVE", "NONP", "NR", "WL", "HUMAN", 109, "professional training"],
}
def lookup(d, title):
    for k, v in d.items():
        if title.startswith(k): return v

rows, assessed, n = [], [], 0
for r in raw["records"]:
    n += 1; sid = "U%03d" % n; r["sid"] = sid
    tri = triage(r)
    sc = lookup(SCREEN, r["title"])
    if tri != "reviewer screening" or sc:
        rows.append([sid, r["source"], r["title"], r["doi"], r["pmid"] or "", r["year"], ";".join(r["types"]), "excluded at screening", "", sc or tri])
        continue
    el = lookup(ELIG, r["title"]); assert el, r["title"]
    rows.append([sid, r["source"], r["title"], r["doi"], r["pmid"] or "", r["year"], ";".join(r["types"]), el[0], el[1], el[2]])
    assessed.append({"source": r["source"], "title": r["title"], "abstract": r["abstract"], "year": r["year"], "doi": r["doi"], "pmid": r["pmid"] or "",
                     "journal": "", "sid": sid, "type": ";".join(r["types"]), "decision": el[0], "exclusion_criterion": el[1],
                     "exclusion_note": el[2] if el[0] == "excluded" else "", "verification_basis": el[3], "charting": lookup(CHART, r["title"]) if el[0] == "included" else None})
retrieved = raw["retrieved"]
out = {"retrieved": retrieved, "duplicates_of_earlier_searches_or_between_sources": sum(retrieved.values()) - len(raw["records"]),
       "screened": len(raw["records"]), "sought": len(assessed), "not_retrieved": 0, "assessed": assessed}
json.dump(out, open(os.path.join(DATA, "fourth_search_assessed.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open(os.path.join(DATA, "fourth_search_screening.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["sid", "source_db", "title", "doi", "pmid", "year", "publication_type", "decision", "exclusion_criterion", "note"]); w.writerows(rows)
print("identified", sum(retrieved.values()), "| screened", out["screened"], "| assessed", len(assessed), "| included", sum(a["decision"] == "included" for a in assessed))
