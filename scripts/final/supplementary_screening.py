# -*- coding: utf-8 -*-
"""Supplementary search without the intervention-type block: de-duplication, screening and eligibility.

The main search required a psychological/behavioural intervention term. Because the eligibility criteria
accept any digital intervention, Europe PMC and OpenAlex were searched again on 28 September 2026 with
burnout AND digital delivery (extended vocabulary) AND randomized design, excluding records already
returned by the main strategy (supplementary_search_*.py).

Steps
1. De-duplicate against every record identified by the five main searches and against the included set,
   and between the two supplementary sources.
2. Title/abstract screening: records without burnout or randomized-allocation wording, reviews,
   protocols and non-article types were excluded; the remainder were screened by the reviewer.
3. Eligibility assessment of retained reports against the five ordered criteria (DECISIONS below).

Outputs: data/supplementary_screening.csv (every screened record and its decision) and
         data/supplementary_assessed.json (assessed reports with decision and study-level charting).
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DATA = os.path.join(REPO, "data")
WSDIR = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WOS_SCOPUS_CANDIDATES", "")

def nt(t): return re.sub(r"[^a-z0-9]", "", (t or "").lower())[:80]
def nd(d): return (d or "").lower().replace("https://doi.org/", "").strip()
def inv(ix):
    if not ix: return ""
    pos = {p: w for w, ps in ix.items() for p in ps}
    return " ".join(pos[k] for k in sorted(pos))

# ---- identifiers of everything identified by the main search -------------------------------------------
DOIS, TIT, PM = set(), set(), set()
def add(doi, title, pmid=None):
    if doi: DOIS.add(nd(doi))
    if title: TIT.add(nt(title))
    if pmid: PM.add(str(pmid))
for r in json.load(open(os.path.join(DATA, "raw_europepmc.json")))["results"]: add(r.get("doi"), r.get("title"), r.get("pmid"))
for r in json.load(open(os.path.join(DATA, "raw_openalex.json")))["results"]: add(r.get("doi"), r.get("title") or r.get("display_name"))
for r in json.load(open(os.path.join(DATA, "raw_eric.json")))["docs"]: add(None, r.get("title"))
if WSDIR:  # Web of Science + Scopus candidate list (titles/DOIs only; not redistributed)
    for r in csv.DictReader(open(WSDIR, encoding="utf-8-sig")): add(r["doi_or_identifier"], r["title"])
for r in csv.DictReader(open(os.path.join(DATA, "master_registry.csv"), encoding="utf-8")):
    add(r["doi"], r["title"], r["pmid"])

se = json.load(open(os.path.join(DATA, "raw_supplementary_europepmc.json")))["results"]
so = json.load(open(os.path.join(DATA, "raw_supplementary_openalex.json")))["results"]
new, dup_main, dup_within = {}, 0, 0
for r in se:
    if (r.get("doi") and nd(r["doi"]) in DOIS) or nt(r.get("title")) in TIT or (r.get("pmid") and r["pmid"] in PM):
        dup_main += 1; continue
    new[nd(r.get("doi")) or nt(r.get("title"))] = {"source": "Europe PMC", "title": r.get("title"), "abstract": r.get("abstractText", ""),
        "year": r.get("pubYear"), "doi": r.get("doi") or "", "pmid": r.get("pmid") or "",
        "type": ";".join((r.get("pubTypeList") or {}).get("pubType", []))}
for r in so:
    doi, t = nd(r.get("doi")), r.get("title") or ""
    if (doi and doi in DOIS) or nt(t) in TIT:
        dup_main += 1; continue
    if (doi or nt(t)) in new or any(nt(t) == nt(v["title"]) for v in new.values()):
        dup_within += 1; continue
    new[doi or nt(t)] = {"source": "OpenAlex", "title": t, "abstract": inv(r.get("abstract_inverted_index")), "year": r.get("publication_year"),
        "doi": doi, "pmid": ((r.get("ids") or {}).get("pmid") or "").split("/")[-1], "type": r.get("type") or ""}
recs = list(new.values())
for i, r in enumerate(recs, 1):
    r["sid"] = f"X{i:03d}"

# ---- title/abstract screening --------------------------------------------------------------------------
RAND = r"randomi[sz]|randomly (assigned|allocated)|random (assignment|allocation)|crossover|cross-over"
def triage(r):
    t, a, typ = (r["title"] or "").lower(), (r["abstract"] or "").lower(), (r["type"] or "").lower()
    ta = t + " " + a
    if any(k in typ for k in ("review", "dissertation", "editorial", "dataset", "erratum", "letter", "comment", "paratext", "book")):
        return "non-article publication type"
    if re.search(r"systematic review|meta-analys|scoping review|literature review|umbrella review|narrative review|review of", t):
        return "review"
    if re.search(r"\bprotocol\b", t):
        return "protocol"
    if a.strip() and "burnout" not in ta and "burn-out" not in ta:
        return "burnout not mentioned"
    if a.strip() and not re.search(RAND, ta):
        return "no randomized allocation"
    return "reviewer screening"

# Reports retained after reviewer screening (sought for retrieval), keyed by normalized title. Three had no
# abstract and no accessible full text. Records ordered by the first criterion they fail.
DECISIONS = {
 # included: (occupation, delivery, approach, mechanism, instrument, comparator, human support, n, note)
 "pragmaticparentalsupporttomitigateburnoutamongpregnantandpos": ("included", "", "Parental support package incl. virtual perinatal support for pregnant residents; PFI burnout primary"),
 "theeffectofatraumainformedcarevideotrainingprogramformidwive": ("included", "", "Video-based trauma-informed care training for midwives; PFI burnout secondary"),
 "ambientaiscribesinclinicalpracticearandomizedtrial": ("included", "", "Pragmatic RCT of two ambient AI scribes vs usual care; PFI work exhaustion"),
 "thefeasibilityandimpactofanasynchronousinterprofessionalwell": ("included", "", "Asynchronous online well-being course for health professionals vs waitlist; MBI"),
 "theinfluenceofartificialintelligencescribesonclinicianexperi": ("included", "", "Randomized quality-improvement trial of an ambient AI scribe; single-item burnout"),
 "mitigatingthestressoftransitionanexplorationoftheeffectsande": ("included", "", "Cluster-randomized flipped-classroom course (online learning + simulation); MBI primary"),
 "effectofserialanthropometricmeasurementsandmotivationaltextm": ("included", "", "Motivational text messages and self-measurement for weight in workers; burnout secondary"),
 "theuseofonlinephysiciantrainingcanimprovepatientexperiencean": ("included", "", "24-week online communication training for physicians; burnout surveys"),
 "interapyburnoutprventionundbehandlungvonburnoutberdasinterne": ("included", "", "Therapist-guided internet treatment of work-related burnout vs psychoeducation"),
 "preschoolteachersselfefficacyburnoutandstressinonlineprofess": ("included", "", "Online professional-development course for preschool teachers, four arms; emotional exhaustion"),
 "isittoooptimistictoassumelighttouchinterventionscanimproveed": ("included", "", "Weekly well-being text messages for school staff, three-arm RCT; burnout"),
 "burnoutsymptomsamongmillennialteachersinindiatheefficacyofth": ("included", "", "Emotional self-care online programme for teachers; MBI-Educators Survey"),
 "cellphonetextmessagesthatdisclosesecondaryemotionsreduceburn": ("included", "", "Written emotional disclosure by mobile-phone text messages in emotional labourers; burnout"),
 "wearablebiosensormonitoringmachinelearningbasedburnoutriskpr": ("included", "", "Wearable biosensor with just-in-time adaptive intervention, three arms (unpublished preprint)"),
 "onlinetrainingandfinancialincentivesforteachersevidencefromb": ("included", "", "Three-arm RCT of an online teacher-training programme with and without a financial incentive, Bangladesh; OLBI (full text obtained after the initial search)"),
 "arandomizedclinicaltrialoftwoambientartificialintelligencesc": ("excluded", "REPORT", "Preprint superseded by the peer-reviewed report of the same trial (Ambient AI Scribes in Clinical Practice, NEJM AI 2025)"),
 "costeffectivequalityoflifeimprovementwhilereducinghealthcare": ("excluded", "REPORT", "Within-trial economic secondary analysis"),
 "theeffectivenessoftheinternetselfexaminationtherapysetonanxi": ("excluded", "REPORT", "Trial registration record"),
 "arandomizedcontrolledstudytoevaluateadigitalinterventionfort": ("excluded", "REPORT", "Trial registration record"),
 "caringforcarersavirtualpsychosocialsupervisioninterventionto": ("excluded", "REPORT", "Study protocol"),
 "theeffectofanappbasedhealthinterventiononsomaticsymptomsamon": ("excluded", "DESIGN", "Single-group longitudinal pilot"),
 "implementationandevaluationofapainassessmentappandnovelcommu": ("excluded", "DESIGN", "Multiple-baseline design; units randomized to app feature sets; MBI analysed only as an association with website use, not compared by arm (full text)"),
 "feasibilityofatailoredcombinedinterventionwithmindbodyelemen": ("excluded", "DESIGN", "Single-arm feasibility trial"),
 "deliveringbiopsychosocialhealthcarewithinroutinecarespotligh": ("excluded", "POP", "Patients randomized; clinician burnout not a randomized comparison"),
 "internetbasedrehabilitationforindividualswithchronicpainandb": ("excluded", "POP", "People on long-term sick leave"),
 "allyaconversationalaibasedmobileappforstresspreventionandmen": ("excluded", "POP", "General adult population"),
 "howtodesignserendipityforburnoutmitigationaserendipityorient": ("excluded", "POP", "Users of an online dating platform"),
 "classpassmembershipstoimprovewellbeingamongpsychiatryresiden": ("excluded", "DIGITAL", "Commercial fitness platform used through a mobile app to book mostly in-person classes and gym visits; no digitally delivered intervention content reported (full text)"),
 "impactofprescribedandselfselectedmusicinterventionsonstresss": ("excluded", "DIGITAL", "Digital delivery not described; wearables used for assessment only"),
 "burnoutintheemergencydepartmentrandomizedcontrolledtrialofan": ("excluded", "DIGITAL", "In-person training; app and wearable used only to monitor practice"),
 "theeffectivenessofastressreductionandburnoutpreventionprogra": ("excluded", "DIGITAL", "In-person health-resort programme"),
 "effectivenessofastretchingprogramonanxietylevelsofworkersina": ("excluded", "DIGITAL", "In-person stretching programme"),
 "montessoriimpactsonlongtermcarestaffresultsofasteppedwedgecl": ("excluded", "DIGITAL", "In-person Montessori training; online surveys only"),
 "precisiontargetingofteacherburnoutusingnetworkinformedecolog": ("excluded", "BURNOUT", "Burnout dimensions used only as nodes of an EMA network index"),
 "randomizedcontrolledtrialofawebbasedinterventiontodisseminat": ("excluded", "BURNOUT", "Outcome was guideline familiarity"),
 "impactofanambientdigitalscribeontypingandnotequalitytheautos": ("excluded", "BURNOUT", "Outcomes were typing workload and note quality"),
 "theeffectivenessofaseriousgametoenhanceempathyforcareworkers": ("excluded", "BURNOUT", "Outcomes were empathy and personal distress"),
 "impactofwechatbasedthreegoodthingsonturnoverintentionandcopi": ("excluded", "BURNOUT", "Outcomes were turnover intention and coping style"),
 "awechatbasedthreegoodthingspositivepsychotherapyfortheimprov": ("excluded", "BURNOUT", "Outcomes were job performance and self-efficacy"),
 "virtualrealityduringworkbreakstoreducefatigueofintensiveunit": ("excluded", "BURNOUT", "Outcomes were stress, anxiety and fatigue during breaks"),
 "adaptiveneurostimulationmethodsincorrectingposttraumaticstre": ("excluded", "BURNOUT", "Outcomes were stress-state indicators"),
 "justintimeteachingjittscreencastsarandomizedcontrolledtrialo": ("excluded", "BURNOUT", "Outcome was clinical confidence"),
 "physicianwellbeingduringcovid19resultsfromarandomizedtrialte": ("excluded", "BURNOUT", "Outcomes were well-being, happiness and anxiety"),
}
NOT_RETRIEVED = {"theuseoftextmessagingfortheimprovementofoccupationalhealtham", "40chamilychallengetheimpactandefficacyofteambasedgamificatio"}

CHART = {  # study-level charting of included reports: occupation, delivery, approach, instrument, comparator, support, n, mechanism
 "pragmaticparentalsupporttomitigateburnoutamongpregnantandpos": ("P", "BLEND", "NONP", "PFI", "UC", "HUMAN", 156, "workplace or practical support"),
 "theeffectofatraumainformedcarevideotrainingprogramformidwive": ("H", "WEB", "NONP", "PFI", "WL", "SELF", 42, "professional training"),
 "ambientaiscribesinclinicalpracticearandomizedtrial": ("P", "AIS", "NONP", "PFI", "UC", "SELF", 238, "workflow automation"),
 "thefeasibilityandimpactofanasynchronousinterprofessionalwell": ("H", "WEB", "PSYED", "MBI", "WL", "SELF", None, "psychological"),
 "theinfluenceofartificialintelligencescribesonclinicianexperi": ("P", "AIS", "NONP", "Single-item", "UC", "SELF", 23, "workflow automation"),
 "mitigatingthestressoftransitionanexplorationoftheeffectsande": ("P", "BLEND", "NONP", "MBI", "UC", "HUMAN", 11, "professional training"),
 "effectofserialanthropometricmeasurementsandmotivationaltextm": ("E", "MSG", "NONP", "NR", "AC", "SELF", 60, "physical activity or health behaviour"),
 "theuseofonlinephysiciantrainingcanimprovepatientexperiencean": ("P", "WEB", "NONP", "NR", "UC", "NR", 63, "professional training"),
 "interapyburnoutprventionundbehandlungvonburnoutberdasinterne": ("E", "WEB", "CBT", "NR", "AC", "HUMAN", 133, "psychological"),
 "preschoolteachersselfefficacyburnoutandstressinonlineprofess": ("T", "WEB", "NONP", "NR", "UC", "NR", 89, "professional training"),
 "isittoooptimistictoassumelighttouchinterventionscanimproveed": ("T", "MSG", "PSYED", "NR", "UC", "SELF", 1155, "psychological"),
 "burnoutsymptomsamongmillennialteachersinindiatheefficacyofth": ("T", "WEB", "OTHP", "MBI", "UC", "NR", 40, "psychological"),
 "cellphonetextmessagesthatdisclosesecondaryemotionsreduceburn": ("E", "MSG", "OTHP", "NR", "AC", "SELF", 20, "psychological"),
 "wearablebiosensormonitoringmachinelearningbasedburnoutriskpr": ("E", "OTHER", "NONP", "NR", "UC", "SELF", 218, "feedback or navigation"),
 "onlinetrainingandfinancialincentivesforteachersevidencefromb": ("T", "WEB", "NONP", "NR", "UC", "NR", 1598, "professional training"),
}

rows, assessed = [], []
for r in recs:
    stage = triage(r)
    sid = r["sid"]
    key = nt(r["title"])[:60]
    if key in NOT_RETRIEVED:
        dec = ("not retrieved", "", "No abstract and no accessible full text")
    elif key in DECISIONS:
        dec = DECISIONS[key]
    elif stage == "reviewer screening":
        dec = ("excluded at screening", "", "Reviewer: outside scope on title/abstract")
    else:
        dec = ("excluded at screening", "", stage)
    rows.append({"sid": sid, "source_db": r["source"], "title": r["title"], "doi": r["doi"], "pmid": r["pmid"], "year": r["year"],
                 "publication_type": r["type"], "decision": dec[0], "exclusion_criterion": dec[1], "note": dec[2]})
    if key in DECISIONS:
        assessed.append({**r, "decision": dec[0], "exclusion_criterion": dec[1], "exclusion_note": dec[2],
                         "charting": CHART.get(key)})

KEYS = {nt(r["title"])[:60] for r in recs}
assert set(DECISIONS) <= KEYS and set(CHART) <= KEYS and NOT_RETRIEVED <= KEYS, "decision for unknown record"
with open(os.path.join(DATA, "supplementary_screening.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
json.dump({"retrieved": {"Europe PMC": len(se), "OpenAlex": len(so)}, "duplicates_of_main_search": dup_main,
           "duplicates_between_supplementary_sources": dup_within, "screened": len(recs),
           "sought": len(DECISIONS) + len(NOT_RETRIEVED), "not_retrieved": len(NOT_RETRIEVED),
           "assessed": assessed}, open(os.path.join(DATA, "supplementary_assessed.json"), "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("retrieved", len(se), len(so), "| dup main", dup_main, "| dup within", dup_within, "| screened", len(recs))
print(Counter(r["decision"] for r in rows))
print(Counter(a["exclusion_criterion"] for a in assessed if a["decision"] == "excluded"))
