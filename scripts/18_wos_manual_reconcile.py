# -*- coding: utf-8 -*-
"""Manual reconciliation of the 34 automated WoS includes. The automated
screen let many trial-protocol papers through (they describe a planned
control arm in future tense, which satisfies the same regex a completed
trial does) -- a known limitation from the OpenAlex pass too. Excludes here
mirror that policy: a protocol paper is excluded until a results paper
exists; when the results paper is a companion of one already in the corpus
(different DOI, same trial), the protocol is dropped as a duplicate report,
not a new study."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, "work", "wos_screened.json")))
included = [r for r in d if r["_screen_status"] == "include"]

EXCLUDE = {
    "Effects of a Mindfulness Intervention Comprising an App, Web-Based Workshops, and a Workbook on Perceived Stress Among Nurses and Nursing Trainees: Protocol for a Randomized Controlled Trial":
        "protocol, not yet reporting results",
    "Testing the Effectiveness of a Mobile Smartphone App Designedto Improve the Mental Health of Junior Physicians:Protocol for aRandomized Controlled Trial":
        "protocol",
    "Ecological momentary intervention to enhance emotion regulation in healthcare workers via smartphone: a randomized controlled trial protocol":
        "protocol",
    "Effectiveness of on-demand acceptance and commitment training for burnout and well-being in Japanese medical students: protocol for a nationwide randomised controlled trial (BEACON Study)":
        "protocol",
    "A randomized controlled trial to improve psychological detachment from work and well-being among employees: a study protocol comparing online CBT-based and mindfulness interventions":
        "protocol",
    "Feasibility Testing a Meditation App for Professionals Working With Youth in the Legal System: Protocol for a Hybrid Type 2 Effectiveness-Implementation Pilot Randomized Controlled Trial":
        "protocol (confirmed via ClinicalTrials.gov cross-check: ACTIVE_NOT_RECRUITING)",
    "Assessing the Efficacy of an Individualized Psychological Flexibility Skills Training Intervention App for Medical Student Burnout and Well-being: Protocol for a Randomized Controlled Trial":
        "protocol (DOI 10.2196/32992); the completed results paper for this same trial (DOI 10.2196/42566) is already in the corpus via Europe PMC",
    "Effectiveness and Cost-effectiveness of Online Brief Mindfulness-based Cognitive Therapy for the Improvement of Productivity in the Workplace: Study Protocol for a Randomized Controlled Trial":
        "protocol",
    "Effect of a mobile-based intervention on mental health in frontline healthcare workers against COVID-19: Protocol for a randomized controlled trial":
        "protocol",
    "Effectiveness of mobile mindfulness training on stress, burnout, and work engagement of office workers: protocol for a randomized controlled trial":
        "protocol",
    "A Digital Mental Health App Incorporating Wearable Biosensing for Teachers of Children on the Autism Spectrum to Support Emotion Regulation: Protocol for a Pilot Randomized Controlled Trial":
        "protocol",
    "Digital training for non-specialist health workers to deliver a brief psychological treatment for depression in India: Protocol for a three-arm randomized controlled trial":
        "protocol",
    "E-Health Psychological Intervention for COVID-19 Healthcare Workers: Protocol for its Implementation and Evaluation":
        "protocol",
    "Resilience Enhancement Online Training for Nurses (REsOluTioN): Protocol for a Pilot Randomized Controlled Trial":
        "protocol",
    "Impact of facemasks on psychotherapy: Clinician's confidence and emotion recognition":
        "unrelated false positive; not a digital psychological burnout intervention",
    "Randomized control trial of Tools of the Mind: Marked benefits to kindergarten children and their teachers":
        "wrong intervention type: an in-classroom curriculum for kindergarten children, not a digital psychological intervention; 'online' in the abstract refers only to the teacher outcome survey's administration method, not the intervention",
}

final = [r for r in included if r["title"] not in EXCLUDE]

print(f"[wos reconcile] automated include: {len(included)}", file=sys.stderr)
print(f"[wos reconcile] manual exclude: {len(EXCLUDE)}", file=sys.stderr)
print(f"[wos reconcile] final new includes from WoS: {len(final)}", file=sys.stderr)
for r in final:
    print("  -", r["pubYear"], "|", r["title"][:90], file=sys.stderr)

with open(os.path.join(HERE, "work", "wos_final_new.json"), "w") as f:
    json.dump(final, f, ensure_ascii=False, indent=1)
