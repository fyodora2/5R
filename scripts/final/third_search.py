# -*- coding: utf-8 -*-
"""Third supplementary search (29 September 2026): PubMed MeSH check and delivery-term gap search in Europe PMC.

Why: a review of the first two supplementary searches showed that the digital-delivery vocabulary lacked "virtual",
"remote", "video", "audio" and similar words (for example, virtual coaching programmes were not retrieved), and that
the searches did not use the controlled vocabulary of the database that indexes most trials. Two searches were added:
  1. PubMed: "Burnout, Professional"[MeSH Terms] AND randomized-design terms;
  2. Europe PMC (title/abstract): burnout AND additional delivery terms AND randomized-design terms (two queries).
The queries are stored in data/raw_third_search.json with the retrieved records.

Steps: (1) de-duplicate against every record identified or assessed earlier and between the three retrievals;
(2) rule-based triage (publication type, protocol, burnout, randomization and delivery wording), then reviewer screening
of the remainder; (3) eligibility assessment of retained reports against the five ordered criteria.

Outputs: data/third_search_screening.csv (every unique record screened and its decision) and
         data/third_search_assessed.json (assessed reports with decision and, for included reports, study-level charting).
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(os.path.dirname(HERE)), "data")
WSDIR = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WOS_SCOPUS_CANDIDATES", "")
ROUTE = "supplementary search 3 (PubMed MeSH and delivery terms)"

def nt(t): return re.sub(r"[^a-z0-9]", "", (t or "").lower())[:60]
def nd(d): return (d or "").lower().replace("https://doi.org/", "").strip()

raw = json.load(open(os.path.join(DATA, "raw_third_search.json"), encoding="utf-8"))

# ---- identifiers of everything identified or assessed earlier -------------------------------------------
KD, KT, KP = set(), set(), set()
def add(doi=None, title=None, pmid=None):
    if doi: KD.add(nd(doi))
    if title: KT.add(nt(title))
    if pmid: KP.add(str(pmid))
for f in ("raw_europepmc.json", "raw_supplementary_europepmc.json"):
    for r in json.load(open(os.path.join(DATA, f), encoding="utf-8"))["results"]: add(r.get("doi"), r.get("title"), r.get("pmid"))
for f in ("raw_openalex.json", "raw_supplementary_openalex.json"):
    for r in json.load(open(os.path.join(DATA, f), encoding="utf-8"))["results"]:
        add(r.get("doi"), r.get("title") or r.get("display_name"), ((r.get("ids") or {}).get("pmid") or "").split("/")[-1])
for r in json.load(open(os.path.join(DATA, "raw_eric.json"), encoding="utf-8"))["docs"]: add(None, r.get("title"))
for f in ("master_registry.csv", "supplementary_screening.csv", "wos_scopus_supplementary_screening.csv"):
    for r in csv.DictReader(open(os.path.join(DATA, f), encoding="utf-8")):
        if r.get("identification_route") == ROUTE: continue     # this search's own records (idempotent re-runs)
        add(r.get("doi"), r.get("title"), r.get("pmid"))
if WSDIR:   # Web of Science + Scopus main-search candidate list (titles/DOIs only; not redistributed)
    for r in csv.DictReader(open(WSDIR, encoding="utf-8-sig")): add(r["doi_or_identifier"], r["title"])
known_pmids_pubmed = [p for p in raw["pubmed_pmids_retrieved"] if p in KP]

def isknown(r):
    return (bool(r["doi"]) and nd(r["doi"]) in KD) or nt(r["title"]) in KT or (bool(r["pmid"]) and r["pmid"] in KP)

recs, seen, dup_prior, dup_within = [], set(), 0, 0
dup_prior += len(raw["pubmed_pmids_retrieved"]) - sum(1 for r in raw["records"] if r["source"] == "PubMed (MeSH)")
for r in raw["records"]:
    if isknown(r): dup_prior += 1; continue
    keys = {"t" + nt(r["title"])} | ({"p" + r["pmid"]} if r["pmid"] else set()) | ({"d" + nd(r["doi"])} if r["doi"] else set())
    if keys & seen: dup_within += 1; continue
    seen |= keys; recs.append(r)
for i, r in enumerate(recs, 1): r["sid"] = f"P{i:03d}"

# ---- rule-based triage ------------------------------------------------------------------------------------
DIG = re.compile(r"\b(digital|online|on-line|internet|web-?based|website|apps?|mobile|smartphone|e-?health|m-?health|telehealth|tele\w*|computer\w*|chatbot|virtual\w*|video\w*|zoom|wearable|sms|text messag\w*|whatsapp|wechat|telegram|gamif\w*|tablet|e-learning|webinar\w*|serious game|electronic|software|platform|artificial intelligence|AI|scribe\w*|remote\w*|audio|podcast\w*|email|e-mail|social media|facebook|livestream\w*|asynchronous|synchronous|hybrid|blended|self-guided|self-paced|modules?|technology)\b", re.I)
BURN = re.compile(r"burn-?out|emotional exhaustion|exhaustion", re.I)
RAND = re.compile(r"randomi[sz]|randomly (assigned|allocated)|random (assignment|allocation)|cluster.random|crossover|cross-over", re.I)
def triage(r):
    t, a, ty = r["title"].lower(), r["abstract"].lower(), ";".join(r["types"]).lower()
    ta = t + " " + a
    if re.search(r"review|editorial|comment|letter|erratum|paratext|dataset|video-audio|congress|abstract supplement", ty) and "randomized controlled trial" not in ty:
        return "non-article publication type or review"
    if re.search(r"systematic review|meta-analys|scoping review|literature review|umbrella review|narrative review|review of", t): return "review"
    if re.search(r"\bprotocol\b|study protocol|trial protocol", t) or "protocol" in ty: return "protocol"
    if a.strip() and not BURN.search(ta): return "burnout not mentioned"
    if a.strip() and not RAND.search(ta): return "no randomized allocation"
    if a.strip() and not DIG.search(ta): return "no digital delivery wording"
    return "reviewer screening"

# ---- reviewer screening and eligibility (key: PMID, or normalized title when there is no PMID) -------------
SCREEN = {   # excluded at reviewer screening: not a trial report or clearly outside the question
 "41533375": "Cross-sectional analysis of a trial's baseline survey",
 "40471927": "Cross-sectional survey", "37458824": "Observational study", "35556141": "Population survey",
 "35395954": "Cross-sectional study", "29016982": "Cross-sectional study", "10144841": "Psychometric analysis; not a trial",
 "42304440": "Survey study", "42437698": "Vignette experiment; not an intervention trial", "34683047": "Survey study",
 "22984372": "Health-technology-assessment report", "41942825": "Qualitative study",
 "38698315": "Methods paper on participant engagement", "40167940": "Observational study of students",
 "31626127": "Cross-sectional study of students",
 nt("Prevalence of Anxiety, Depression, and Stress Among University Students: An Analysis of Management and Services"): "Survey of university students",
}
ELIG = {     # assessed for eligibility: (decision, first failed criterion, reason)
 # included
 "41729180": ("included", "", "Randomized crossover trial of two ambient AI scribes; Copenhagen Burnout Inventory"),
 "35766397": ("included", "", "Virtual coaching programme for women surgery residents vs emailed resources; burnout measured"),
 "38924722": ("included", "", "Loving-kindness audio programme delivered virtually to NICU nurses vs educational files; MBI"),
 "38848338": ("included", "", "Trainer-guided virtual Heartfulness meditation vs podcast-based gratitude practice; ProQOL burnout"),
 "40643743": ("included", "", "Virtual one-on-one or group professional coaching vs waitlist in attending physicians; MBI primary"),
 "38451826": ("included", "", "Virtual coaching vs wellness reading for pediatric surgery trainees; burnout measured"),
 "40890847": ("included", "", "ACT vs virtual body mapping, both delivered by videoconference, in physician learners; MBI (full text checked)"),
 "39925706": ("included", "", "Virtual mindfulness-based CBT vs usual activities in secondary-school teachers, Nepal; MBI-Educators Survey"),
 nt("Leadership Coaching as an Implementation Strategy to Enhance Adoption of a Relational Playbook and Team Well-Being: A Pilot Randomized Clinical Trial In Cardiology"):
     ("included", "", "Site-randomized pilot of virtual leadership coaching in cardiac catheterization laboratories; burnout among team members (unpublished preprint)"),
 # REPORT
 "39600201": ("excluded", "REPORT", "Pre-post analysis of staff within a cluster randomized trial of patient group visits; no randomized comparison of burnout"),
 "33866489": ("excluded", "REPORT", "Secondary sequential analysis of coaching sessions; no randomized comparison of burnout"),
 # DESIGN
 "42275191": ("excluded", "DESIGN", "Single-arm pilot"),
 "41946216": ("excluded", "DESIGN", "Participants randomized to teams; no control arm or between-group comparison"),
 "33469958": ("excluded", "DESIGN", "Single-case experimental design with four participants; no between-group comparison"),
 "36375356": ("excluded", "DESIGN", "Pre-post non-randomized controlled evaluation"),
 "41992234": ("excluded", "DESIGN", "Pilot with a convenience sample; no randomized comparison reported"),
 # POP
 "40271908": ("excluded", "POP", "Participants aged 18-24 years with perceived stress; not a working population"),
 "34517431": ("excluded", "POP", "Doctoral students"),
 "23427838": ("excluded", "POP", "Volunteers from mixed groups; not a working population"),
 "42348423": ("excluded", "POP", "Dental students"),
 "34246265": ("excluded", "POP", "Medical students"),
 "40014577": ("excluded", "POP", "Undergraduate medical students"),
 "42090028": ("excluded", "POP", "University students"),
 "40056886": ("excluded", "POP", "Parents of hospitalised children"),
 "41964379": ("excluded", "POP", "Trauma-exposed children and their parents"),
 "42176729": ("excluded", "POP", "Adolescents with type 1 diabetes"),
 "42755121": ("excluded", "POP", "Adults with type 1 diabetes"),
 nt("Evaluation of a Pre-clinic Diabetes Assessment and Mapped Care Planning Intervention: a Multi-Centre Randomised Trial"): ("excluded", "POP", "Patients with diabetes"),
 nt("A Pilot Study Examining Biofeedback and Structured Napping to Promote Medical Student Wellbeing"): ("excluded", "POP", "Medical students"),
 "35651860": ("excluded", "POP", "Health professionals and students in an uncontrolled gratitude pilot; burnout not an outcome"),
 "21284838": ("excluded", "POP", "Cancer patients"),
 "31718737": ("excluded", "POP", "Mothers at risk of stress in a community programme"),
 # DIGITAL
 "42289115": ("excluded", "DIGITAL", "Hypnotherapy and coaching modules; digital delivery not reported"),
 "41826028": ("excluded", "DIGITAL", "Eight-session mindfulness training; no digital delivery reported"),
 "41641043": ("excluded", "DIGITAL", "Empowerment education and narrative nursing sessions; no digital delivery reported"),
 "41165789": ("excluded", "DIGITAL", "Posters, greetings and message boxes; email nudges were a minor component"),
 "36316873": ("excluded", "DIGITAL", "Mandala colouring; a three-minute instructional video was the only digital element"),
 "34766930": ("excluded", "DIGITAL", "Acupuncture and acupressure"),
 "29122258": ("excluded", "DIGITAL", "Massage"),
 "32729211": ("excluded", "DIGITAL", "In-person curriculum in fellowship programmes"),
 "33786209": ("excluded", "DIGITAL", "In-person yoga-based programme; virtual delivery only proposed"),
 "15477286": ("excluded", "DIGITAL", "Occupational-physician programme; no digital delivery"),
 "16789671": ("excluded", "DIGITAL", "Ergonomic and back-care interventions"),
 "19586218": ("excluded", "DIGITAL", "In-person resource workshop; new information technology was the stressor, not the intervention"),
 "30078991": ("excluded", "DIGITAL", "Workplace work-family intervention; no digital delivery"),
 "26065196": ("excluded", "DIGITAL", "Organisational workplace intervention; no digital delivery reported"),
 "33233750": ("excluded", "DIGITAL", "Teacher-training programme; digital delivery not described"),
 # BURNOUT
 "35941763": ("excluded", "BURNOUT", "Burnout used only as a correlate of antipathy scores, not as an outcome of the randomized comparison"),
 "33682592": ("excluded", "BURNOUT", "Outcomes were loneliness and sleep"),
 "40901855": ("excluded", "BURNOUT", "Outcomes were heart-rate variability and anxiety"),
 "31765759": ("excluded", "BURNOUT", "Outcomes were motivational-interviewing behaviours"),
 "28384315": ("excluded", "BURNOUT", "Outcomes were accuracy of identifying parents' feelings and clinician distress"),
}
CHART = {    # occupation, delivery, approach, instrument in abstract, comparator, support, n, mechanism
 "41729180": ("P", "AIS", "NONP", "CBI", "H2H", "SELF", 160, "workflow automation"),
 "35766397": ("P", "LIVE", "COACH", "NR", "AC", "HUMAN", 237, "psychological"),
 "38924722": ("N", "WEB", "MIND", "MBI", "AC", "SELF", 66, "psychological"),
 "38848338": ("H", "LIVE", "MIND", "ProQOL", "AC", "HUMAN", 83, "psychological"),
 "40643743": ("P", "LIVE", "COACH", "MBI", "WL", "HUMAN", 79, "psychological"),
 "38451826": ("P", "LIVE", "COACH", "NR", "AC", "HUMAN", 43, "psychological"),
 "40890847": ("P", "LIVE", "OTHP", "MBI", "H2H", "HUMAN", 58, "psychological"),
 "39925706": ("T", "LIVE", "OTHP", "MBI", "UC", "NR", 218, "psychological"),
 nt("Leadership Coaching as an Implementation Strategy to Enhance Adoption of a Relational Playbook and Team Well-Being: A Pilot Randomized Clinical Trial In Cardiology"):
     ("H", "LIVE", "NONP", "NR", "UC", "HUMAN", None, "professional training"),
}
FULLTEXT_KEYS = {"40890847"}   # open-access full text read for the final decision
def key(r): return r["pmid"] or nt(r["title"])

rows, assessed, tri = [], [], {}
for r in recs:
    s = triage(r); tri[s] = tri.get(s, 0) + 1
    k = key(r)
    if s != "reviewer screening":
        dec = ("excluded at screening", "", s)
    elif k in SCREEN:
        dec = ("excluded at screening", "", "Reviewer: " + SCREEN[k])
    elif k in ELIG:
        dec = ELIG[k]
    else:
        raise SystemExit("no decision for %s %s" % (k, r["title"][:80]))
    rows.append({"sid": r["sid"], "source_db": r["source"], "title": r["title"], "doi": r["doi"], "pmid": r["pmid"], "year": r["year"],
                 "publication_type": ";".join(r["types"]), "decision": dec[0], "exclusion_criterion": dec[1], "note": dec[2]})
    if k in ELIG and s == "reviewer screening":
        assessed.append({**{x: r[x] for x in ("source", "title", "abstract", "year", "doi", "pmid", "journal", "sid")},
                         "type": ";".join(r["types"]), "decision": dec[0], "exclusion_criterion": dec[1], "exclusion_note": dec[2],
                         "verification_basis": "full text" if k in FULLTEXT_KEYS else "abstract", "charting": CHART.get(k)})
assert {key(r) for r in recs} >= set(ELIG) | set(SCREEN) - {k for k in SCREEN if k not in {key(r) for r in recs}}, "decision for unknown record"
missing = [k for k in ELIG if k not in {key(r) for r in recs}]
assert not missing, ("decision for unknown record", missing)
for a in assessed:
    assert (a["decision"] == "included") == (a["charting"] is not None), a["title"]

with open(os.path.join(DATA, "third_search_screening.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
json.dump({"retrieved": raw["retrieved"], "duplicates_of_earlier_searches": dup_prior, "duplicates_between_these_searches": dup_within,
           "screened": len(recs), "sought": len(assessed), "not_retrieved": 0, "assessed": assessed},
          open(os.path.join(DATA, "third_search_assessed.json"), "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("retrieved", sum(raw["retrieved"].values()), "| dup earlier", dup_prior, "| dup within", dup_within, "| screened", len(recs), "| triage", tri)
print("assessed", len(assessed), Counter(a["decision"] for a in assessed), Counter(a["exclusion_criterion"] for a in assessed if a["decision"] == "excluded"))
