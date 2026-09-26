import json, re, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
CANDS = json.load(open(os.path.join(HERE, "openalex_new_candidates.json")))

DESIGN_POSITIVE = re.compile(
    r"\brandom(?:i[sz]ed|i[sz]ation|ly assigned|ly allocated)\b|"
    r"\bcluster[- ]randomi[sz]ed\b|\bstepped[- ]wedge\b|\bcrossover trial\b|"
    r"\brct\b", re.I)
DESIGN_NEGATIVE = re.compile(
    r"\bsingle[- ]arm\b|\bnon[- ]randomi[sz]ed\b|\bquasi[- ]experimental\b|"
    r"\bpre[- ]post\b|\bpre[- ]and[- ]post\b|\bqualitative stud(y|ies)\b|"
    r"\bcross[- ]sectional\b|\bcase report\b|\bcase series\b|"
    r"\bprotocol\b.{0,20}\bfor a\b|\bstudy protocol\b|\bwill be randomi[sz]ed\b|"
    r"\bwe (?:will|plan to)\b|\bsystematic review\b|\bmeta-analysis\b|\bscoping review\b|"
    r"\bnarrative review\b|\bliterature review\b", re.I)
CONTROL_ARM = re.compile(
    r"\bcontrol (?:group|condition|arm)\b|\bwaitlist\b|\bwait[- ]list\b|"
    r"\btreatment as usual\b|\bactive control\b|\bcomparison group\b|"
    r"\btwo arms\b|\bthree arms\b|\bparallel[- ]group\b|\ballocated to\b|"
    r"\bassigned to\b|\bintervention group\b.{0,80}\bcontrol\b", re.I)
OCC_TERMS = re.compile(
    r"\bemployee|\bworker|\bstaff\b|\bpersonnel\b|\bworkforce\b|\bprofessional|"
    r"\bnurse|\bphysician|\bdoctor|\bclinician|\bteacher|\beducator|\bfaculty|"
    r"\bmanager|\bsupervisor|\bfirst responder|\bpolice|\bfirefighter|\bparamedic|"
    r"\bsocial worker|\bcall[- ]?cent(?:er|re)|\bveterinar|\bdentist|\bpharmacist|"
    r"\bpublic sector\b|\bcorporate\b|\bhealthcare worker|\bhealth[- ]care worker|"
    r"\bresident physician|\bmedical resident|\bworking adult", re.I)
NON_HUMAN = re.compile(r"\brat\b|\bmice\b|\bmouse\b|\bin vitro\b|\bin vivo\b|\banimal model\b", re.I)
STUDENT_ONLY = re.compile(r"\bcollege student|\bundergraduate student|\bhigh school student", re.I)
# require the digital and psychological and burnout concepts to actually be present near
# each other in the abstract text (title_and_abstract.search in OpenAlex can match loosely)
BURNOUT_TERM = re.compile(r"\bburnout|\bburn-out\b", re.I)

def screen(title, abstract):
    t = (title or "") + " . " + (abstract or "")
    if not BURNOUT_TERM.search(t):
        return "exclude", "burnout not actually mentioned (loose OpenAlex match)"
    if NON_HUMAN.search(t):
        return "exclude", "non-human/animal-model"
    has_design_positive = bool(DESIGN_POSITIVE.search(t))
    has_design_negative = bool(DESIGN_NEGATIVE.search(t))
    has_control_arm = bool(CONTROL_ARM.search(t))
    if has_design_negative and not has_control_arm:
        return "exclude", "non-randomized design language"
    if not has_design_positive:
        return "exclude", "no randomization signal"
    if not has_control_arm:
        return "uncertain", "randomization mentioned but no clear control-arm language"
    if not OCC_TERMS.search(t):
        return "uncertain", "no clear occupational-population term"
    if STUDENT_ONLY.search(t) and not OCC_TERMS.search(t.replace("student", "")):
        return "exclude", "student-only population, not occupational"
    return "include", "meets digital+psychological+burnout+RCT+occupational criteria"

results = []
for r in CANDS:
    status, reason = screen(r.get("title"), r.get("abstract"))
    r["_screen_status"] = status
    r["_screen_reason"] = reason
    results.append(r)

counts = Counter(r["_screen_status"] for r in results)
print("[openalex screen]", dict(counts), file=sys.stderr)

included = [r for r in results if r["_screen_status"] == "include"]
print(f"included: {len(included)}", file=sys.stderr)
for r in included:
    print("-", r.get("pubYear"), "|", r.get("venue"), "|", r["title"][:100], file=sys.stderr)

with open(os.path.join(HERE, "openalex_screened.json"), "w") as f:
    json.dump(results, f, ensure_ascii=False)
