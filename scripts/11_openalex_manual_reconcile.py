# -*- coding: utf-8 -*-
"""Manual reconciliation pass over the 46 OpenAlex-only 'include' candidates.

The automated regex screen is necessarily loose on a 300+ candidate pool pulled
from OpenAlex's more permissive title_and_abstract search. A human-equivalent
pass is required to catch: (a) false positives where 'randomized' appears but
the study isn't an intervention RCT, (b) conference-abstract/preprint
companion reports of a trial already counted once, and (c) OpenAlex indexing
the same deposit twice (e.g. Zenodo version DOIs, OSF entries with/without a
resolved DOI). This mirrors what a second human reviewer would do at
full-text screening in a real scoping review.
"""
import json, re, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, "openalex_screened.json")))
included = [r for r in d if r["_screen_status"] == "include"]

EXCLUDE_TITLES = {
    "Resident physician extended work hours and burnout":
        "not a digital psychological intervention trial (work-hour policy study)",
    "Mental Health Response to the COVID-19 Outbreak in China":
        "general-population survey/commentary, not an occupational RCT",
    "Healthier together, happier forever: a leadership reflection on cultural healing in the emergency department":
        "reflective commentary piece, not primary research",
    "Crisis Leadership, Personal Resources, and Coping Strategies as Predictors of Stress, Well-being, and Burnout":
        "predictive/correlational study, not an intervention trial",
    "A Protocol for a Phase-II Trial to Evaluate the Effect of a Mindfulness Intervention via a Mobile Application":
        "study protocol, trial not yet completed/reported",
    "MP10-06 A NOVEL ONLINE PHYSICIAN GROUP-COACHING PROGRAM TO REDUCE BURNOUT IN FEMALE TRAINEES: A RANDOMIZED CONTROLLED TRIAL":
        "conference-abstract companion report; full trial counted via 'Better Together' (Academic Medicine)",
    "MP72-02 BURNOUT REDUCTION AND ENGAGEMENT APP-BASED TRIAL OF HEADSPACE (BREATHE): A RANDOMIZED CLINICAL TRIAL":
        "conference-abstract companion report; full trial already included from Europe PMC (Headspace multisite RCT)",
    "Psilocybin Therapy for Clinicians With Symptoms of Depression From Frontline Care During the COVID-19 Pandemic":
        "core intervention is a psychedelic drug (psilocybin), not a digital psychological intervention; 'digital' matched incidentally",
    "Nurse-led supportive interventions in adult ICUs and their dual impact on workforce sustainability and ICU survivorship: a systematic review and meta-analysis":
        "this is a PROSPERO systematic-review PROTOCOL registration, not a primary RCT (design screen false negative)",
}

UNCERTAIN_TITLES = {
    "IMPACT: Evaluation of a Controlled Organizational Intervention Using Influential Peers to Promote Professionalism and Personal Accountability":
        "organizational/peer-support intervention; digital delivery component unclear from title/abstract alone",
    "Fostering presence in education: A pilot study of a social-emotional learning intervention for public school teachers":
        "'pilot study' framing; randomized-controlled design not clearly confirmed",
    "Mindfulness-, hyväksyntä- ja arvopohjaisen (MIHA) ohjelman vaikuttavuus työuupumusoireiden lievittäjänä":
        "Finnish-language dissertation monograph; design and digital-delivery details need full-text/translation check",
}

# de-duplicate OpenAlex's own double-indexing of the same deposit (Zenodo version
# DOIs, OSF entries with/without a resolved DOI) -- keep the first occurrence
DUPLICATE_KEEP_FIRST = [
    "Positive expressive writing as a tool for alleviating burnout and enhancing wellbeing in teachers",
    "Edu:Social School Study: Promoting well-being and socio-emotional competencies for school teachers",
    "Greater Resilience Information Toolkit Japanese Version (GRIT-J)",
]

def norm(t):
    return re.sub(r"\s+", " ", (t or "")).strip()

seen_dup_keys = set()
final = []
excluded_manual = []
uncertain_manual = []

for r in included:
    title = norm(r["title"])
    matched_exclude = next((v for k, v in EXCLUDE_TITLES.items() if k[:60] in title), None)
    if matched_exclude:
        excluded_manual.append((title, matched_exclude))
        continue
    matched_uncertain = next((v for k, v in UNCERTAIN_TITLES.items() if k[:50] in title), None)
    if matched_uncertain:
        uncertain_manual.append((title, matched_uncertain))
        # prefer the article-type version over preprint when a dup pair exists later; keep for now
        r["_manual_note"] = matched_uncertain
        continue
    dup_key = next((k for k in DUPLICATE_KEEP_FIRST if k[:50] in title), None)
    if dup_key:
        # prefer the non-preprint / DOI-bearing record among the pair
        if dup_key in seen_dup_keys:
            continue
        seen_dup_keys.add(dup_key)
    final.append(r)

print(f"[reconcile] automated include: {len(included)}", file=sys.stderr)
print(f"[reconcile] manual exclude:    {len(excluded_manual)}", file=sys.stderr)
for t, why in excluded_manual:
    print(f"    - {t[:80]} :: {why}", file=sys.stderr)
print(f"[reconcile] manual uncertain:  {len(uncertain_manual)}", file=sys.stderr)
for t, why in uncertain_manual:
    print(f"    - {t[:80]} :: {why}", file=sys.stderr)
print(f"[reconcile] final new includes from OpenAlex: {len(final)}", file=sys.stderr)

with open(os.path.join(HERE, "openalex_final_new.json"), "w") as f:
    json.dump(final, f, ensure_ascii=False, indent=1)
