# -*- coding: utf-8 -*-
"""Merge Europe PMC + OpenAlex + ERIC included records into one unified corpus,
apply the same coding dictionaries to every record, and write coded_all.json."""
import json, re, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))

def strip_html(s):
    return re.sub(r"<[^>]+>", " ", s or "")

# ---------------------------------------------------------------------------
# 1. Load and normalize each source into a common schema
# ---------------------------------------------------------------------------
unified = []

epmc = json.load(open(os.path.join(HERE, "screened.json")))
epmc_included = [r for r in epmc["records"] if r["_screen_status"] == "include"]
for r in epmc_included:
    unified.append({
        "source": "Europe PMC",
        "title": r.get("title"),
        "abstract": strip_html(r.get("abstractText", "")),
        "pubYear": int(r["pubYear"]) if r.get("pubYear") else None,
        "journal": (r.get("journalInfo", {}).get("journal", {}) or {}).get("title"),
        "doi": r.get("doi"),
        "pmid": r.get("pmid"),
        "citedByCount": r.get("citedByCount", 0),
        "isOpenAccess": r.get("isOpenAccess"),
    })

oa_new = json.load(open(os.path.join(HERE, "openalex_final_new.json")))
for r in oa_new:
    unified.append({
        "source": "OpenAlex",
        "title": r.get("title"),
        "abstract": r.get("abstract") or "",
        "pubYear": int(r["pubYear"]) if r.get("pubYear") else None,
        "journal": r.get("venue"),
        "doi": r.get("doi"),
        "pmid": None,
        "citedByCount": r.get("citedByCount", 0),
        "isOpenAccess": None,
    })

eric_new = [
    {
        "source": "ERIC",
        "title": "Improving Teacher Wellbeing: A Randomized Pilot Study of an Online Self-Guided Single Session Consultation Intervention",
        "abstract": (
            "Teaching is a stressful job, that often presents with limited time and high job demands. "
            "However, the vast majority of the interventions tailored to help mitigate this stress and increase "
            "wellbeing are very time consuming and not tailored to meet the specific needs of teachers. To address "
            "this gap, this paper utilizes a randomized study design and pilots an online-self guided single session "
            "consultation (OSG-SSC) intervention aimed at improving wellbeing. Specifically, in a sample of 122 "
            "teachers (intervention group, n = 61; wait-list control group, n = 61) the fidelity, acceptability, and "
            "effectiveness of the OSG-SSC across a variety of indicators (i.e., teacher self-efficacy, school "
            "connectedness, positive emotions, hope, and burnout) was examined. The results suggests that the "
            "OSG-SSC was implemented with a high level of fidelity and found to be a useful and acceptable "
            "intervention by teachers. In addition, the OSG-SSC was also found to significantly reduce one aspect "
            "of burnout, emotional exhaustion with a large effect."
        ),
        "pubYear": 2024,
        "journal": "ERIC document (ProQuest dissertation, ED658593)",
        "doi": None,
        "pmid": None,
        "citedByCount": 0,
        "isOpenAccess": None,
    }
]
unified.extend(eric_new)

print(f"[merge] Europe PMC={len(epmc_included)}  OpenAlex(new)={len(oa_new)}  ERIC(new)={len(eric_new)}  total={len(unified)}", file=sys.stderr)

# ---------------------------------------------------------------------------
# 2. Coding dictionaries (identical to scripts/03_code_categories.py)
# ---------------------------------------------------------------------------
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
    ("Smartphone / mobile app", r"\bmobile app|\bsmartphone app|\bapp[- ]based|\bmobile phone application|\bmobile[- ]based\b|\bmobile phone[- ]based\b|\bself[- ]management app\b|\b(?:headspace|calm app|mindfulness coach)\b|\ban app\b|\ban APP\b"),
    ("mHealth / eHealth (modality unspecified)", r"\bmhealth\b|\bm[- ]health\b|\behealth\b|\be[- ]health\b|\bdigital health (?:program|intervention|platform)\b"),
    ("Web-based / online platform", r"\bweb[- ]based|\bonline (?:program|platform|intervention|course|training|self|counseling|counselling|coaching|consultation)|\binternet[- ]based\b|\binternet[- ]delivered\b"),
    ("Videoconference / telehealth", r"\bvideoconferenc|\btelehealth|\btele-?health|\bvideo[- ]call|\bzoom[- ]delivered|\bphone[- ]based\b"),
    ("Computer-based / computerized program", r"\bcomputer[- ]based|\bcomputeri[sz]ed"),
    ("Wearable / biofeedback device-based", r"\bwearable\b|\bheart rate variability biofeedback\b|\bHRV biofeedback\b"),
    ("Audio-based digital program", r"\baudio[- ]based\b|\bpodcast\b"),
    ("Blended / hybrid delivery", r"\bhybrid delivery\b|\bblended (?:intervention|delivery|format)\b"),
]

APPROACH_PATTERNS = [
    ("Mindfulness / MBSR / MBCT", r"\bmindfulness|\bMBSR\b|\bMBCT\b|\bmeditation\b"),
    ("CBT / iCBT", r"\bcognitive behav(?:ioral|ioural)|\bCBT\b|\biCBT\b"),
    ("ACT (Acceptance & Commitment)", r"\bacceptance and commitment|\bACT\b(?! )|\bpsychological flexibility"),
    ("Self-compassion / compassion-based", r"\bself[- ]compassion|\bcompassion[- ]based|\bcompassion training|\bloving[- ]kindness"),
    ("Positive psychology / strengths-based", r"\bpositive psycholog|\bstrengths[- ]based|\bcharacter strength|\bgratitude program|\bexpressive writing"),
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

with open(os.path.join(HERE, "coded_all.json"), "w") as f:
    json.dump(coded, f, ensure_ascii=False, indent=1)

print(f"[merge] coded {len(coded)} total studies -> coded_all.json", file=sys.stderr)
by_source = {}
for r in coded:
    by_source[r["source"]] = by_source.get(r["source"], 0) + 1
print("[merge] by source:", by_source, file=sys.stderr)
