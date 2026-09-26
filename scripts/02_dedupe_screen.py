import json, re, os, sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = json.load(open(os.path.join(HERE, "raw_europepmc.json")))["results"]

def txt(r):
    return (r.get("title","") + " . " + strip_html(r.get("abstractText","") or "")).strip()

def strip_html(s):
    return re.sub(r"<[^>]+>", " ", s or "")

# ---------------------------------------------------------------------------
# 1. DEDUPLICATION
# ---------------------------------------------------------------------------
def norm_title(t):
    t = (t or "").replace("\xa0", " ").lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def tokset(t):
    return set(norm_title(t).split())

PREFERRED_PUBTYPE_RANK = ["Randomized Controlled Trial", "Journal Article", "research-article"]

def rank(r):
    pts = r.get("pubTypeList", {}).get("pubType", [])
    for i, p in enumerate(PREFERRED_PUBTYPE_RANK):
        if p in pts:
            return i
    if "Preprint" in pts:
        return 99
    return 50

# pass 1: exact key dedup (doi / pmid)
by_key = {}
rest = []
for r in RAW:
    doi = (r.get("doi") or "").lower().strip()
    pmid = r.get("pmid")
    key = ("doi", doi) if doi else (("pmid", pmid) if pmid else None)
    if key is None:
        rest.append(r)
        continue
    if key not in by_key or rank(r) < rank(by_key[key]):
        by_key[key] = r
    dup_count_holder = None
stage1 = list(by_key.values()) + rest

# pass 2: near-duplicate titles (handles preprint vs published-version pairs,
# and multi-source indexing of the same record with different doi/pmid state)
stage1_sorted = sorted(stage1, key=lambda r: -len(r.get("title") or ""))
kept = []
kept_tokens = []
removed_near_dup = 0
for r in stage1_sorted:
    tt = tokset(r.get("title"))
    is_dup = False
    for i, kt in enumerate(kept_tokens):
        if not tt or not kt:
            continue
        jacc = len(tt & kt) / len(tt | kt)
        if jacc > 0.85:
            # keep the higher-ranked (peer-reviewed over preprint) record
            if rank(r) < rank(kept[i]):
                kept[i] = r
                kept_tokens[i] = tt
            is_dup = True
            removed_near_dup += 1
            break
    if not is_dup:
        kept.append(r)
        kept_tokens.append(tt)

deduped = kept
dup_count = (len(RAW) - len(stage1)) + removed_near_dup
print(f"[dedupe] raw={len(RAW)} after_exact_key={len(stage1)} after_near_dup={len(deduped)} removed_total={dup_count}", file=sys.stderr)

# ---------------------------------------------------------------------------
# 2. SCREENING (automated, title/abstract-level, rule-based PRISMA-ScR style)
# ---------------------------------------------------------------------------
EXCLUDE_PUBTYPES = {
    "Systematic Review", "systematic-review", "Review", "review-article",
    "Meta-Analysis", "Scoping Review", "Clinical Trial Protocol",
    "Published Erratum", "correction", "Abstract", "Comment", "Editorial",
    "Letter", "News",
}
RCT_PUBTYPES = {
    "Randomized Controlled Trial", "Randomized Controlled Trial, Veterinary",
    "Controlled Clinical Trial", "Equivalence Trial", "Pragmatic Clinical Trial",
    "Clinical Trial",
}

DESIGN_POSITIVE = re.compile(
    r"\brandom(?:i[sz]ed|i[sz]ation|ly assigned|ly allocated)\b|"
    r"\bcluster[- ]randomi[sz]ed\b|\bstepped[- ]wedge\b|\bcrossover trial\b|"
    r"\brct\b", re.I)
DESIGN_NEGATIVE = re.compile(
    r"\bsingle[- ]arm\b|\bnon[- ]randomi[sz]ed\b|\bquasi[- ]experimental\b|"
    r"\bpre[- ]post\b|\bpre[- ]and[- ]post\b|\bqualitative stud(y|ies)\b|"
    r"\bcross[- ]sectional\b|\bcase report\b|\bcase series\b|\bfeasibility stud(y|ies)\b.{0,40}\bsingle[- ]arm\b|"
    r"\bprotocol\b.{0,20}\bfor a\b|\bstudy protocol\b|\bwill be randomi[sz]ed\b|"
    r"\bwe (?:will|plan to)\b", re.I)
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

STUDENT_ONLY = re.compile(r"\bcollege student|\bundergraduate student|\bhigh school student", re.I)

NON_HUMAN = re.compile(r"\brat\b|\bmice\b|\bmouse\b|\bin vitro\b|\bin vivo\b|\banimal model\b", re.I)

def screen(r):
    t = txt(r)
    reasons = []
    pts = set(r.get("pubTypeList", {}).get("pubType", []))

    if pts & EXCLUDE_PUBTYPES:
        return "exclude", f"pubtype:{sorted(pts & EXCLUDE_PUBTYPES)}"

    if NON_HUMAN.search(t):
        return "exclude", "non-human/animal-model"

    has_rct_pubtype = bool(pts & RCT_PUBTYPES)
    has_design_positive = bool(DESIGN_POSITIVE.search(t))
    has_design_negative = bool(DESIGN_NEGATIVE.search(t))
    has_control_arm = bool(CONTROL_ARM.search(t))

    if has_design_negative and not (has_rct_pubtype and has_control_arm):
        return "exclude", "non-randomized design language"

    if not (has_rct_pubtype or has_design_positive):
        return "exclude", "no randomization signal"

    if not has_control_arm and not has_rct_pubtype:
        return "uncertain", "randomization mentioned but no clear control-arm language"

    if not OCC_TERMS.search(t):
        return "uncertain", "no clear occupational-population term"

    if STUDENT_ONLY.search(t) and not OCC_TERMS.search(t.replace("student", "")):
        return "exclude", "student-only population, not occupational"

    return "include", "meets digital+psychological+burnout+RCT+occupational criteria"

screened = []
for r in deduped:
    status, reason = screen(r)
    r["_screen_status"] = status
    r["_screen_reason"] = reason
    screened.append(r)

counts = Counter(r["_screen_status"] for r in screened)
print(f"[screen] {dict(counts)}", file=sys.stderr)

included = [r for r in screened if r["_screen_status"] == "include"]

with open(os.path.join(HERE, "screened.json"), "w") as f:
    json.dump({
        "n_raw": len(RAW), "n_deduped": len(deduped),
        "screen_counts": dict(counts),
        "records": screened,
    }, f)

print(f"[screen] included={len(included)}", file=sys.stderr)
