# -*- coding: utf-8 -*-
import json, re, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCOPING = os.path.dirname(HERE)

def strip_html(s):
    return re.sub(r"<[^>]+>", " ", s or "")

existing = json.load(open(os.path.join(SCOPING, "coded_all.json")))
# strip prior coding fields; merge_all-style script re-codes everyone below
unified = []
for r in existing:
    unified.append({
        "source": r["source"], "title": r["title"], "abstract": r["abstract"],
        "pubYear": r["pubYear"], "journal": r["journal"], "doi": r["doi"], "pmid": r.get("pmid"),
        "citedByCount": r.get("citedByCount", 0), "isOpenAccess": r.get("isOpenAccess"),
    })

wos = json.load(open(os.path.join(HERE, "work", "wos_final_new.json")))
for r in wos:
    unified.append({
        "source": "Web of Science", "title": r["title"], "abstract": r["abstract"],
        "pubYear": r["pubYear"], "journal": None, "doi": r["doi"], "pmid": None,
        "citedByCount": 0, "isOpenAccess": None,
    })

scopus = json.load(open(os.path.join(HERE, "work", "scopus_final_new.json")))
for r in scopus:
    unified.append({
        "source": "Scopus", "title": r["matched_title"], "abstract": r["abstract"],
        "pubYear": r["pubYear"], "journal": r.get("venue"), "doi": r["doi"], "pmid": None,
        "citedByCount": 0, "isOpenAccess": None,
    })

print(f"[merge] existing={len(existing)} + wos_new={len(wos)} + scopus_new={len(scopus)} = {len(unified)}", file=sys.stderr)

# ---- same coding dictionaries as scripts/12_merge_all_sources.py ----
OCCUPATION_PATTERNS = [
    ("Nurses", r"\bnurs(e|es|ing)\b"),
    ("Physicians/Residents", r"\bphysician|\bresident physician|\bmedical resident|\bdoctor(s)?\b|\battending physician"),
    ("Mixed healthcare workers", r"\bhealth ?care worker|\bhealth ?care professional|\bhealth ?care provider|\bhealth ?care staff|\bhospital staff|\bclinician|\bmedical staff"),
    ("Mental health professionals", r"\btherapist|\bpsycholog(ist|ists)\b|\bpsychiatr(ist|ists|y resident)|\bcounsel(or|lor)s?\b|\bsocial worker"),
    ("Teachers/Educators", r"\bteacher|\beducator|\bfaculty member|\bschool staff|\backadem(ic|ician)"),
    ("Veterinary staff", r"\bveterinar"),
    ("First responders/Public safety", r"\bfirst responder|\bpolice|\bfirefighter|\bparamedic|\bemergency medical"),
    ("Corporate/office employees", r"\bcorporate employee|\boffice worker|\bwhite[- ]collar|\bcompany employee|\bmanager(s)?\b|\bemployee(s)? at\b|\bsmall business\b|\bbusiness leader"),
    ("Dentists/Pharmacists", r"\bdentist|\bpharmacist|\bdental (?:hygienist|staff)"),
    ("General/mixed working adults", r"\bworking adult|\bemployee(s)?\b|\bworkforce\b|\bworker(s)?\b|\bstaff\b|\bpersonnel\b"),
]
TECH_PATTERNS = [
    ("Chatbot / conversational AI", r"\bchatbot|\bconversational agent|\blarge language model|\bAI[- ]?(?:powered|driven|based) (?:app|chatbot|coach)"),
    ("Virtual reality", r"\bvirtual reality\b|\bVR\b(?! )|\bimmersive\b"),
    ("Smartphone / mobile app", r"\bmobile app|\bsmartphone app|\bapp[- ]based|\bmobile phone application|\bmobile[- ]based\b|\bmobile phone[- ]based\b|\bself[- ]management app\b|\b(?:headspace|calm app|mindfulness coach)\b|\ban app\b|\ban APP\b|\bphone[- ]based\b|\bsmartphone[- ]delivered\b"),
    ("mHealth / eHealth (modality unspecified)", r"\bmhealth\b|\bm[- ]health\b|\behealth\b|\be[- ]health\b|\bdigital health (?:program|intervention|platform)\b"),
    ("Web-based / online platform", r"\bweb[- ]based|\bonline (?:program|platform|intervention|course|training|self|counseling|counselling|coaching|consultation|survey|seminar|support program)|\binternet[- ]based\b|\binternet[- ]delivered\b"),
    ("Videoconference / telehealth", r"\bvideoconferenc|\btelehealth|\btele-?health|\bvideo[- ]call|\bzoom[- ]delivered"),
    ("Computer-based / computerized program", r"\bcomputer[- ]based|\bcomputeri[sz]ed"),
    ("Wearable / biofeedback device-based", r"\bwearable\b|\bheart rate variability biofeedback\b|\bHRV biofeedback\b"),
    ("Audio-based digital program", r"\baudio[- ]based\b|\bpodcast\b"),
    ("Blended / hybrid delivery", r"\bhybrid delivery\b|\bblended (?:intervention|delivery|format)\b"),
]
APPROACH_PATTERNS = [
    ("Mindfulness / MBSR / MBCT", r"\bmindfulness|\bMBSR\b|\bMBCT\b|\bmeditation\b"),
    ("CBT / iCBT", r"\bcognitive behav(?:ioral|ioural)|\bCBT\b|\biCBT\b|\bREBT\b|\brational emotive\b"),
    ("ACT (Acceptance & Commitment)", r"\bacceptance and commitment|\bACT\b(?! )|\bpsychological flexibility"),
    ("Self-compassion / compassion-based", r"\bself[- ]compassion|\bcompassion[- ]based|\bcompassion training|\bloving[- ]kindness"),
    ("Positive psychology / strengths-based", r"\bpositive psycholog|\bstrengths[- ]based|\bcharacter strength|\bgratitude program|\bexpressive writing"),
    ("Resilience training", r"\bresilience training|\bresilience[- ]building|\bresilience program"),
    ("Stress management (generic)", r"\bstress management\b"),
    ("Emotion regulation", r"\bemotion regulation\b|\bemotional regulation\b"),
    ("Relaxation / breathing / biofeedback", r"\brelaxation\b|\bbreathing exercise|\bbiofeedback\b|\bprogressive muscle relaxation|\blaughter yoga\b"),
    ("Coaching", r"\bcoaching\b|\bgroup[- ]coaching\b"),
    ("Psychoeducation", r"\bpsychoeducation"),
    ("Behavioral activation", r"\bbehavio(?:ral|ural) activation"),
    ("Problem-solving training", r"\bproblem[- ]solving training\b|\bproblem[- ]solving intervention\b"),
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
    ("Waitlist control", r"\bwaitlist\b|\bwait[- ]list\b|\bwait-control\b"),
    ("Treatment as usual / usual care", r"\btreatment as usual\b|\busual care\b|\bcare as usual\b"),
    ("Active comparator", r"\bactive control\b|\bactive comparator\b|\battention control\b"),
    ("No-intervention control", r"\bno[- ]intervention control\b|\bno[- ]treatment control\b|\bno-feedback condition\b"),
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

coded = []
for r in unified:
    t = (r["title"] or "") + " . " + (r["abstract"] or "")
    row = dict(r)
    row["occupations"] = multi_match(t, OCCUPATION_PATTERNS) or ["Unspecified/mixed workforce"]
    row["technologies"] = multi_match(t, TECH_PATTERNS) or ["Unspecified digital modality"]
    row["approaches"] = multi_match(t, APPROACH_PATTERNS) or ["Unspecified/other"]
    row["instruments"] = multi_match(t, INSTRUMENT_PATTERNS) or ["Unspecified/not named in abstract"]
    row["comparators"] = multi_match(t, COMPARATOR_PATTERNS) or ["Unspecified in abstract"]
    row["guidance"] = multi_match(t, GUIDANCE_PATTERNS) or ["Unspecified in abstract"]
    coded.append(row)

with open(os.path.join(HERE, "work", "coded_final.json"), "w") as f:
    json.dump(coded, f, ensure_ascii=False, indent=1)

print(f"[merge] coded {len(coded)} total studies -> work/coded_final.json", file=sys.stderr)
from collections import Counter
print("by source:", dict(Counter(r["source"] for r in coded)), file=sys.stderr)
