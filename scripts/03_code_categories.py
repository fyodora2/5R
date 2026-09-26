# -*- coding: utf-8 -*-
import json, re, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, "screened.json")))
RECS = [r for r in D["records"] if r["_screen_status"] == "include"]

def strip_html(s):
    return re.sub(r"<[^>]+>", " ", s or "")

def txt(r):
    return (r.get("title","") + " . " + strip_html(r.get("abstractText","") or "")).replace("\xa0"," ")

# ---------------------------------------------------------------------------
# Coding dictionaries (regex -> label). First match order matters for
# mutually-exclusive dimensions; multi-label dimensions collect all hits.
# ---------------------------------------------------------------------------

OCCUPATION_PATTERNS = [
    ("Nurses", r"\bnurs(e|es|ing)\b"),
    ("Physicians/Residents", r"\bphysician|\bresident physician|\bmedical resident|\bdoctor(s)?\b|\battending physician"),
    ("Mixed healthcare workers", r"\bhealth ?care worker|\bhealth ?care professional|\bhealth ?care provider|\bhealth ?care staff|\bhospital staff|\bclinician|\bmedical staff"),
    ("Mental health professionals", r"\btherapist|\bpsycholog(ist|ists)\b|\bpsychiatr(ist|ists|y resident)|\bcounsel(or|lor)s?\b|\bsocial worker"),
    ("Teachers/Educators", r"\bteacher|\beducator|\bfaculty member|\bschool staff|\backadem(ic|ician)"),
    ("Veterinary staff", r"\bveterinar"),
    ("First responders/Public safety", r"\bfirst responder|\bpolice|\bfirefighter|\bparamedic|\bemergency medical"),
    ("Corporate/office employees", r"\bcorporate employee|\boffice worker|\bwhite[- ]collar|\bcompany employee|\bmanager(s)?\b|\bemployee(s)? at\b"),
    ("Dentists/Pharmacists", r"\bdentist|\bpharmacist|\bdental (?:hygienist|staff)"),
    ("General/mixed working adults", r"\bworking adult|\bemployee(s)?\b|\bworkforce\b|\bworker(s)?\b|\bstaff\b|\bpersonnel\b"),
]

TECH_PATTERNS = [
    ("Chatbot / conversational AI", r"\bchatbot|\bconversational agent|\blarge language model|\bAI[- ]?(?:powered|driven|based) (?:app|chatbot|coach)"),
    ("Virtual reality", r"\bvirtual reality\b|\bVR\b(?! )|\bimmersive\b"),
    ("Smartphone / mobile app", r"\bmobile app|\bsmartphone app|\bapp[- ]based|\bmobile phone application|\bmobile[- ]based\b|\bmobile phone[- ]based\b|\bself[- ]management app\b|\b(?:headspace|calm app|mindfulness coach)\b"),
    ("mHealth / eHealth (modality unspecified)", r"\bmhealth\b|\bm[- ]health\b|\behealth\b|\be[- ]health\b|\bdigital health (?:program|intervention|platform)\b"),
    ("Web-based / online platform", r"\bweb[- ]based|\bonline (?:program|platform|intervention|course|training)|\binternet[- ]based\b"),
    ("Videoconference / telehealth", r"\bvideoconferenc|\btelehealth|\btele-?health|\bvideo[- ]call|\bzoom[- ]delivered"),
    ("Computer-based / computerized program", r"\bcomputer[- ]based|\bcomputeri[sz]ed"),
    ("Wearable / biofeedback device-based", r"\bwearable\b|\bheart rate variability biofeedback\b|\bHRV biofeedback\b"),
    ("Audio-based digital program", r"\baudio[- ]based\b|\bpodcast\b"),
    ("Blended / hybrid delivery", r"\bhybrid delivery\b|\bblended (?:intervention|delivery|format)\b"),
]

APPROACH_PATTERNS = [
    ("Mindfulness / MBSR / MBCT", r"\bmindfulness|\bMBSR\b|\bMBCT\b|\bmeditation\b"),
    ("CBT / iCBT", r"\bcognitive behav(?:ioral|ioural)|\bCBT\b|\biCBT\b"),
    ("ACT (Acceptance & Commitment)", r"\bacceptance and commitment|\bACT\b(?! )|\bpsychological flexibility"),
    ("Self-compassion / compassion-based", r"\bself[- ]compassion|\bcompassion[- ]based|\bcompassion training"),
    ("Positive psychology / strengths-based", r"\bpositive psycholog|\bstrengths[- ]based|\bcharacter strength"),
    ("Resilience training", r"\bresilience training|\bresilience[- ]building|\bresilience program"),
    ("Stress management (generic)", r"\bstress management\b"),
    ("Emotion regulation", r"\bemotion regulation\b|\bemotional regulation\b"),
    ("Relaxation / breathing / biofeedback", r"\brelaxation\b|\bbreathing exercise|\bbiofeedback\b|\bprogressive muscle relaxation"),
    ("Coaching", r"\bcoaching\b|\bgroup[- ]coaching\b"),
    ("Psychoeducation", r"\bpsychoeducation"),
    ("Behavioral activation", r"\bbehavio(?:ral|ural) activation"),
]

INSTRUMENT_PATTERNS = [
    ("Maslach Burnout Inventory (MBI)", r"\bmaslach\b|\bMBI\b"),
    ("Copenhagen Burnout Inventory (CBI)", r"\bcopenhagen burnout|\bCBI\b"),
    ("Oldenburg Burnout Inventory (OLBI)", r"\boldenburg burnout|\bOLBI\b"),
    ("Burnout Assessment Tool (BAT)", r"\bburnout assessment tool|\bBAT\b"),
    ("Shirom-Melamed (SMBM)", r"\bshirom|\bSMBM\b"),
    ("Professional Quality of Life (ProQOL)", r"\bProQOL\b|\bprofessional quality of life"),
    ("Single-item / study-specific burnout measure", r"\bsingle[- ]item\b.{0,30}burnout"),
]

COMPARATOR_PATTERNS = [
    ("Waitlist control", r"\bwaitlist\b|\bwait[- ]list\b"),
    ("Treatment as usual / usual care", r"\btreatment as usual\b|\busual care\b|\bcare as usual\b"),
    ("Active comparator", r"\bactive control\b|\bactive comparator\b|\battention control\b"),
    ("No-intervention control", r"\bno[- ]intervention control\b|\bno[- ]treatment control\b"),
    ("Alternative digital intervention", r"\bcompared (?:to|with) (?:an?|another) (?:digital|online|app|web)"),
]

GUIDANCE_PATTERNS = [
    ("Therapist/coach-guided", r"\btherapist[- ]guided|\bcoach[- ]guided|\bclinician[- ]guided|\bfacilitated by\b|\bhuman[- ]guided"),
    ("Self-guided / unguided", r"\bself[- ]guided|\bunguided\b|\bself[- ]directed\b|\bself[- ]paced\b|\bself[- ]administered"),
    ("AI-guided / adaptive", r"\bAI[- ]guided|\badaptive (?:algorithm|program|intervention)|\bpersonali[sz]ed by (?:an? )?(?:algorithm|AI)"),
]

def multi_match(t, patterns):
    hits = []
    for label, pat in patterns:
        if re.search(pat, t, re.I):
            hits.append(label)
    return hits

def first_match(t, patterns, default="Unspecified/other"):
    for label, pat in patterns:
        if re.search(pat, t, re.I):
            return label
    return default

coded = []
for r in RECS:
    t = txt(r)
    aff = " ".join(
        a.get("affiliation","") for auth in r.get("authorList",{}).get("author",[])
        for a in auth.get("authorAffiliationDetailsList",{}).get("authorAffiliation",[])
    )
    row = {
        "id": r.get("id"),
        "pmid": r.get("pmid"),
        "doi": r.get("doi"),
        "title": r.get("title"),
        "pubYear": int(r.get("pubYear")) if r.get("pubYear") else None,
        "journal": r.get("journalInfo",{}).get("journal",{}).get("title") if isinstance(r.get("journalInfo",{}).get("journal"),dict) else None,
        "citedByCount": r.get("citedByCount", 0),
        "isOpenAccess": r.get("isOpenAccess"),
        "occupations": multi_match(t, OCCUPATION_PATTERNS) or ["Unspecified/mixed workforce"],
        "technologies": multi_match(t, TECH_PATTERNS) or ["Unspecified digital modality"],
        "approaches": multi_match(t, APPROACH_PATTERNS) or ["Unspecified/other"],
        "instruments": multi_match(t, INSTRUMENT_PATTERNS) or ["Unspecified/not named in abstract"],
        "comparators": multi_match(t, COMPARATOR_PATTERNS) or ["Unspecified in abstract"],
        "guidance": multi_match(t, GUIDANCE_PATTERNS) or ["Unspecified in abstract"],
        "abstract": strip_html(r.get("abstractText","")),
        "affiliation_text": aff,
    }
    coded.append(row)

with open(os.path.join(HERE, "coded.json"), "w") as f:
    json.dump(coded, f, ensure_ascii=False, indent=1)

print(f"[coding] coded {len(coded)} included studies", file=sys.stderr)

# quick sanity summaries
for dim in ["occupations","technologies","approaches","instruments","comparators","guidance"]:
    c = Counter()
    for row in coded:
        for v in row[dim]:
            c[v]+=1
    print(f"--- {dim} ---", file=sys.stderr)
    for k,v in c.most_common():
        print(f"  {v:3d}  {k}", file=sys.stderr)

years = Counter(row["pubYear"] for row in coded if row["pubYear"])
print("--- year ---", file=sys.stderr)
for y in sorted(years):
    print(f"  {y}: {years[y]}", file=sys.stderr)
