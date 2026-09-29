# -*- coding: utf-8 -*-
"""Journal figures for the scoping review.

Fig 1  PRISMA 2020 flow diagram (databases + registry-linked "other methods")
Fig 2  Included trials by year of first report, stacked by delivery mode
Fig 3  Evidence map: occupational group x intervention approach (study level)

Inputs: data/study_charting.csv, data/master_registry.csv, data/registry_linked_publications.csv
"""
import csv, json, os
from collections import Counter, defaultdict
import matplotlib
matplotlib.use("Agg")
import matplotlib.ticker
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.colors import LinearSegmentedColormap
import numpy as np

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO, "data")
OUT = os.path.join(REPO, "paper", "figures")
os.makedirs(OUT, exist_ok=True)

INK, SECONDARY, MUTED, GRID = "#0b0b0b", "#52514e", "#898781", "#e1e0d9"
CAT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
SEQ = ["#fcfcfb", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 10, "text.color": INK,
    "axes.edgecolor": GRID, "axes.labelcolor": SECONDARY, "xtick.color": SECONDARY, "ytick.color": SECONDARY,
    "figure.facecolor": "white", "savefig.facecolor": "white",
})

rows = list(csv.DictReader(open(os.path.join(DATA, "study_charting.csv"), encoding="utf-8")))
master = list(csv.DictReader(open(os.path.join(DATA, "master_registry.csv"), encoding="utf-8")))
supp = json.load(open(os.path.join(DATA, "supplementary_assessed.json"), encoding="utf-8"))
supp2 = json.load(open(os.path.join(DATA, "wos_scopus_supplementary_assessed.json"), encoding="utf-8"))
N = len(rows)
assert N == 107 and len(master) == 234

DB = [m for m in master if m["identification_route"] != "registry linkage"]
REG = [m for m in master if m["identification_route"] == "registry linkage"]
db_excl = Counter(m["exclusion_criterion"] for m in DB if m["decision"] == "excluded")
db_inc = sum(1 for m in DB if m["decision"] == "included")
reg_excl = Counter(m["exclusion_criterion"] for m in REG if m["decision"] == "excluded")
reg_inc = sum(1 for m in REG if m["decision"] == "included")
n_reports = db_inc + reg_inc
MAIN = {"Europe PMC": 227, "OpenAlex": 716, "ERIC": 8, "Web of Science": 352, "Scopus": 382}
MAIN_SCREENED, MAIN_ASSESSED = 1094, 147
S_RET = supp["retrieved"]
S2_RET = supp2["retrieved"]
identified = sum(MAIN.values()) + sum(S_RET.values()) + sum(S2_RET.values())
screened = MAIN_SCREENED + supp["screened"] + supp2["screened"]
removed = identified - screened
sought = MAIN_ASSESSED + supp["sought"] + supp2["sought"]
not_retrieved = supp["not_retrieved"]
assessed = sought - not_retrieved
assert assessed == len(DB), (assessed, len(DB))
f = lambda n: format(n, ",")

# ---------------------------------------------------------------------------
# Figure 1: PRISMA 2020 flow diagram
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11, 12.2))
ax.set_xlim(0, 110); ax.set_ylim(18, 131); ax.axis("off")

def box(x, y, w, h, text, fc="white", bold_first=False, size=8.6, align="left"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.25,rounding_size=0.8",
                                linewidth=1.1, edgecolor=INK, facecolor=fc))
    lines = text.split("\n")
    tx = x + 1.4 if align == "left" else x + w / 2
    ha = "left" if align == "left" else "center"
    if bold_first:
        ax.text(tx, y + h - 1.6, lines[0], ha=ha, va="top", fontsize=size, fontweight="bold", color=INK)
        ax.text(tx, y + h - 4.1, "\n".join(lines[1:]), ha=ha, va="top", fontsize=size, color=INK, linespacing=1.45)
    else:
        ax.text(tx, y + h / 2, text, ha=ha, va="center", fontsize=size, color=INK, linespacing=1.45)

def arrow(x1, y1, x2, y2):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=11, color=INK, linewidth=1.0))

def band(y, h, label):
    ax.add_patch(FancyBboxPatch((0.5, y), 4.5, h, boxstyle="round,pad=0.1,rounding_size=0.6",
                                linewidth=0, facecolor="#cde2fb"))
    ax.text(2.75, y + h / 2, label, rotation=90, ha="center", va="center", fontsize=9, fontweight="bold", color=INK)

ax.add_patch(FancyBboxPatch((7, 124), 66, 5, boxstyle="round,pad=0.2,rounding_size=0.8", linewidth=0, facecolor="#f0efec"))
ax.text(40, 126.5, "Identification of studies via databases", ha="center", va="center", fontsize=9.6, fontweight="bold")
ax.add_patch(FancyBboxPatch((76, 124), 33.5, 5, boxstyle="round,pad=0.2,rounding_size=0.8", linewidth=0, facecolor="#f0efec"))
ax.text(92.75, 126.5, "Identification via other methods", ha="center", va="center", fontsize=9.6, fontweight="bold")

band(95, 27, "Identification"); band(41, 52, "Screening"); band(20, 20, "Included")

L, LW, R, RW, O, OW = 7, 32, 43, 30, 76, 33.5
box(L, 94, LW, 28, ("Records identified (n = %s)\nMain search, 17-26 Sep 2026\n   Europe PMC %d; OpenAlex %d; ERIC %d\n"
                    "   Web of Science %d; Scopus %d\nSupplementary search without the\nintervention block, 28-29 Sep 2026\n"
                    "   Europe PMC %d; OpenAlex %d\n   Web of Science %d; Scopus %d")
    % (f(identified), MAIN["Europe PMC"], MAIN["OpenAlex"], MAIN["ERIC"], MAIN["Web of Science"], MAIN["Scopus"],
       S_RET["Europe PMC"], S_RET["OpenAlex"], S2_RET["Web of Science"], S2_RET["Scopus"]), bold_first=True, size=7.7)
box(R, 102, RW, 14, "Records removed before screening\n(duplicates and non-article\nrecords; n = %s)" % f(removed), align="center")
arrow(L + LW, 109, R, 109)
box(O, 96, OW, 20, "Completed interventional\nregistrations, ClinicalTrials.gov\n(n = 28)\n\nLinked publications (n = 30), of\nwhich already assessed via\ndatabases (n = 9)", size=8.4)

box(L, 80, LW, 9, "Records screened (title/abstract)\n(n = %s)" % f(screened), align="center")
box(R, 80, RW, 9, "Records excluded\n(n = %s)" % f(screened - sought), align="center")
arrow(L + LW / 2, 94, L + LW / 2, 89); arrow(L + LW, 84.5, R, 84.5)

box(L, 66, LW, 9, "Reports sought for retrieval\n(n = %d)" % sought, align="center")
box(R, 66, RW, 9, "Reports not retrieved\n(n = %d)" % not_retrieved, align="center")
arrow(L + LW / 2, 80, L + LW / 2, 75); arrow(L + LW, 70.5, R, 70.5)
box(O, 80, OW, 9, "Reports sought for retrieval\n(n = %d); not retrieved (n = 0)" % len(REG), align="center")
arrow(O + OW / 2, 96, O + OW / 2, 89)

box(L, 52, LW, 9, "Reports assessed for eligibility\n(n = %d)" % len(DB), align="center")
box(R, 44, RW, 17, ("Reports excluded (n = %d)\nNot a primary results report  %d\nNot randomized  %d\nNot a working population  %d\n"
                    "Not digitally delivered  %d\nBurnout not an outcome  %d")
    % (sum(db_excl.values()), db_excl["REPORT"], db_excl["DESIGN"], db_excl["POP"], db_excl["DIGITAL"], db_excl["BURNOUT"]),
    bold_first=True, size=8.2)
arrow(L + LW / 2, 66, L + LW / 2, 61); arrow(L + LW, 56.5, R, 56.5)

box(O, 66, OW, 9, "Reports assessed for eligibility\n(n = %d)" % len(REG), align="center")
arrow(O + OW / 2, 80, O + OW / 2, 75)
box(O, 47, OW, 14, ("Reports excluded (n = %d)\nNot a primary results report  %d\nNot randomized  %d\n"
                    "Not a working population  %d\nNot digitally delivered  %d")
    % (sum(reg_excl.values()), reg_excl["REPORT"], reg_excl["DESIGN"], reg_excl["POP"], reg_excl["DIGITAL"]),
    bold_first=True, size=8.2)
arrow(O + OW / 2, 66, O + OW / 2, 61)
arrow(O + OW / 2, 47, O + OW / 2, 35)
box(O, 25, OW, 10, "Reports included\n(n = %d)" % reg_inc, align="center")

box(L, 22, LW + RW + 4, 16, ("Studies included in review (n = %d randomized trials)\nReports of included studies (n = %d)\n"
                            "   via databases  %d\n   via registry linkage  %d\nOne trial with 3 reports; one trial with 2 reports")
    % (N, n_reports, db_inc, reg_inc), bold_first=True, size=8.8)
arrow(L + LW / 2, 52, L + LW / 2, 38)
arrow(O, 30, L + LW + RW + 4, 30)
fig.savefig(os.path.join(OUT, "fig1_prisma_flow.png"), dpi=300, bbox_inches="tight")
plt.close(fig)
print("flow:", identified, removed, screened, sought, not_retrieved, len(DB), dict(db_excl), db_inc, "| reg", len(REG), dict(reg_excl), reg_inc)

# ---------------------------------------------------------------------------
# Figure 2: trials per year of first report, by delivery mode
# ---------------------------------------------------------------------------
DELIV = [("Web-based program", ["Web-based program"]),
         ("Smartphone app", ["Smartphone app"]),
         ("Live online sessions", ["Live online sessions"]),
         ("Blended digital + in-person", ["Blended (digital and in-person)"]),
         ("Messaging, chatbot, wearable or AI scribe", ["Text or instant messaging", "Chatbot", "Wearable or motion-sensing platform", "Ambient AI scribe"])]
years = list(range(min(int(r["first_year"]) for r in rows), 2027))
counts = {lab: [sum(1 for r in rows if int(r["first_year"]) == y and r["delivery"] in members) for y in years]
          for lab, members in DELIV}

fig, ax = plt.subplots(figsize=(9.5, 4.8))
bottom = np.zeros(len(years))
for (lab, _), col in zip(DELIV, CAT):
    vals = np.array(counts[lab])
    ax.bar(years, vals, bottom=bottom, width=0.72, color=col, edgecolor="white", linewidth=1.2, label=lab, zorder=3)
    bottom += vals
for y, t in zip(years, bottom):
    if t:
        ax.text(y, t + 0.3, str(int(t)), ha="center", va="bottom", fontsize=9, color=INK)
ax.set_xticks(years)
ax.set_xticklabels([str(y) if y != 2026 else "2026*" for y in years], rotation=0, fontsize=8.5)
ax.set_ylabel("Randomized trials (n)")
ax.yaxis.set_major_locator(matplotlib.ticker.MultipleLocator(5))
ax.set_ylim(0, max(bottom) + 3)
ax.yaxis.grid(True, color=GRID, linewidth=0.8, zorder=0); ax.set_axisbelow(True)
for s in ("top", "right"):
    ax.spines[s].set_visible(False)
ax.legend(frameon=False, fontsize=8.6, loc="upper left", ncol=1)
ax.text(1.0, -0.14, "* January to September 2026", transform=ax.transAxes, ha="right", fontsize=8, color=SECONDARY)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig2_temporal_trend.png"), dpi=300)
plt.close(fig)

# ---------------------------------------------------------------------------
# Figure 3: evidence map, occupation x approach (study level)
# ---------------------------------------------------------------------------
OCC = ["Other or mixed healthcare workers", "Nurses", "Physicians and physician trainees",
       "Employees in other sectors or mixed occupations", "Teachers and education staff",
       "Mental-health and social-care professionals"]
OCC_LAB = ["Mixed/other healthcare", "Nurses", "Physicians & trainees", "Other sectors/mixed", "Teachers", "Mental-health & social care"]
APP = ["Mindfulness or meditation", "Other psychological", "Cognitive-behavioural or stress management",
       "Psychoeducation or resilience training", "Positive psychology", "Non-psychological mechanism",
       "Acceptance and commitment", "Compassion-based", "Coaching"]
APP_LAB = ["Mindfulness", "Other\npsychological", "CBT/stress\nmanagement", "Psychoed./\nresilience", "Positive\npsychology",
           "Non-psycho-\nlogical", "ACT", "Compassion", "Coaching"]
M = np.array([[sum(1 for r in rows if r["occupation"] == o and r["approach"] == a) for a in APP] for o in OCC])
assert M.sum() == N

cmap = LinearSegmentedColormap.from_list("seq", SEQ)
fig, ax = plt.subplots(figsize=(10, 4.9))
ax.imshow(M, cmap=cmap, vmin=0, vmax=M.max(), aspect="auto")
for i in range(M.shape[0]):
    for j in range(M.shape[1]):
        v = M[i, j]
        ax.text(j, i, str(v) if v else "·", ha="center", va="center", fontsize=10,
                color="white" if v >= 5 else (INK if v else MUTED))
ax.set_xticks(range(len(APP))); ax.set_xticklabels(["%s\n(%d)" % (l, M[:, j].sum()) for j, l in enumerate(APP_LAB)], fontsize=8.4)
ax.set_yticks(range(len(OCC)))
ax.set_yticklabels(["%s (%d)" % (l, M[i].sum()) for i, l in enumerate(OCC_LAB)], fontsize=9)
ax.tick_params(length=0)
ax.set_xticks(np.arange(-0.5, len(APP)), minor=True); ax.set_yticks(np.arange(-0.5, len(OCC)), minor=True)
ax.grid(which="minor", color="white", linewidth=2); ax.tick_params(which="minor", length=0)
for s in ax.spines.values():
    s.set_visible(False)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig3_evidence_map.png"), dpi=300)
plt.close(fig)

for f in ("fig4_cluster_scatter.png",):
    p = os.path.join(OUT, f)
    if os.path.exists(p):
        os.remove(p)
print("figures written:", sorted(os.listdir(OUT)), "| reports", n_reports, "| studies", N,
      "| db excl", dict(db_excl), "| reg excl", dict(reg_excl))
