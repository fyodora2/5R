import json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "paper", "figures")
os.makedirs(OUT, exist_ok=True)

FA = json.load(open(os.path.join(REPO, "data", "final_analysis_all.json")))
CL = json.load(open(os.path.join(REPO, "data", "clustered_all.json")))

CAT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"]
INK = "#0b0b0b"
SECONDARY = "#52514e"
MUTED = "#898781"
GRID = "#e1e0d9"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "text.color": INK,
    "axes.edgecolor": GRID,
    "axes.labelcolor": SECONDARY,
    "xtick.color": SECONDARY,
    "ytick.color": SECONDARY,
    "figure.facecolor": "white",
    "savefig.facecolor": "white",
})

# ---------------------------------------------------------------------------
# Figure 1: PRISMA-ScR flow diagram (full stages, unit = report/publication)
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(15, 16))
ax.set_xlim(0, 100)
ax.set_ylim(0, 138)
ax.axis("off")

def box(x, y, w, h, title, subtitle, color=INK, fc="white", title_size=10.5, sub_size=7.6):
    b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5,rounding_size=2",
                        linewidth=1.6, edgecolor=color, facecolor=fc)
    ax.add_patch(b)
    ax.text(x + w/2, y + h*0.76, title, ha="center", va="center", fontsize=title_size, fontweight="bold", color=INK)
    ax.text(x + w/2, y + h*0.34, subtitle, ha="center", va="center", fontsize=sub_size, color=SECONDARY,
            wrap=True, linespacing=1.4)

def arrow(x1, y1, x2, y2, color=None):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=13,
                                  color=color or MUTED, linewidth=1.3))

# Row 1: five database searches (raw hits)
sources = [
    ("Europe PMC", "227 raw records", CAT[0]),
    ("OpenAlex", "716 raw records", CAT[1]),
    ("ERIC", "8 raw records", CAT[2]),
    ("Web of Science", "352 raw records", CAT[3]),
    ("Scopus\n(titles only, no abstract)", "382 raw records", CAT[4]),
]
bw, bh, gap = 18, 10, 1.5
total_w = 5*bw + 4*gap
x0 = (100-total_w)/2
for i, (name, sub, color) in enumerate(sources):
    x = x0 + i*(bw+gap)
    box(x, 122, bw, bh, name, sub, color=color, title_size=9.5)
    arrow(x+bw/2, 122, 50, 115)

box(28, 106, 44, 9, "1,685 raw records → 1,094 unique reports", "duplicates removed across databases", color=INK, title_size=9.5)
arrow(50, 106, 50, 100)

# Row: title/abstract screening per source (report-level, not full-text)
box(4, 89, 92, 9,
    "Title/abstract screening (rule-based + automated), one manual reconciliation pass per source except Europe PMC",
    "no systematic full-text retrieval; ambiguous cases routed to “uncertain” and resolved manually (see per-source detail below)",
    color=INK, title_size=9, sub_size=7.4)
arrow(50, 89, 50, 83)

detail = [
    ("Europe PMC", "213 unique → 84 incl. / 32 uncert. / 97 excl.", CAT[0]),
    ("OpenAlex (new)", "315 new → 46 auto-incl. → 29 final", CAT[1]),
    ("ERIC (new)", "8 new → 1 final", CAT[2]),
    ("Web of Science (new)", "274 new → 34 auto-incl./uncert. → 18 final", CAT[3]),
    ("Scopus (new, no abstract)", "284 new → 4-step resolution below → 13 final", CAT[4]),
]
dw, dh, dgap = 18, 14, 1.5
dx0 = (100-total_w)/2
scopus_x = None
for i, (name, sub, color) in enumerate(detail):
    x = dx0 + i*(dw+dgap)
    box(x, 68, dw, dh, name, sub, color=color, title_size=8.6, sub_size=7.0)
    arrow(x+dw/2, 83, x+dw/2, 82)
    if i == 4:
        scopus_x = x

# Scopus resolution sub-flow (since it has no abstract, 4-step recovery), placed
# directly beneath the Scopus box only, well clear of the merge box below
box(scopus_x - 24, 40, dw + 24, 22,
    "Scopus abstract recovery (4 steps)",
    "201/284 via OpenAlex title match → 5 incl.\n+1/284 via ClinicalTrials.gov synopsis → 1 incl.\n+38/284 with a Crossref-recovered abstract (of 57 DOI-matched) → 1 incl.\n+44/284 via extended full-text search, two rounds (Europe PMC, publisher pages) → 7 incl.\n(1 of the 44 was a duplicate of an already-included Europe PMC report)\nAll 44 reached a documented decision — 0 remain unresolved (36 excluded with reason)",
    color=CAT[4], fc="#fdf3ef", title_size=8.8, sub_size=6.6)
arrow(scopus_x + dw/2, 68, scopus_x + dw/2, 62)

for i, (name, sub, color) in enumerate(detail[:4]):
    x = dx0 + i*(dw+dgap)
    arrow(x+dw/2, 68, 50, 28)
arrow(scopus_x + dw/2, 40, 50, 28)

box(14, 20, 72, 9, "1,094 unique reports screened across 5 databases", "", color=INK)
arrow(50, 20, 50, 13)

box(14, 1, 72, 12, "145 reports included",
    "Europe PMC 84 · OpenAlex 29 · WoS 18 · Scopus 13 · ERIC 1  —  all 44 originally-unresolved Scopus titles now\nhave a documented decision (0 unresolved). 4 post-hoc corrections on screening validation: 1 duplicate preprint\nand 1 unpublished protocol removed; 8 further eligible studies recovered via Crossref + full-text search (2 rounds) — net 139→145",
    color=CAT[2], fc="#eafaf3", title_size=10.5, sub_size=7.4)

ax.text(50, 135, "PRISMA-ScR Screening Flow — Five Databases (unit: report/publication)", ha="center", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig(os.path.join(OUT, "fig1_prisma_flow.png"), dpi=220, bbox_inches="tight")
plt.close()
print("fig1 done")

# ---------------------------------------------------------------------------
# Figure 2: temporal stacked bar (approach x year) -- multi-label, not exclusive
# ---------------------------------------------------------------------------
years = FA["summary"]["year_counts"]
years_sorted = sorted(years.keys(), key=int)
approach_by_year = FA["approach_by_year"]
app_totals = FA["summary"]["approaches"]
top_approaches = sorted(app_totals.items(), key=lambda kv: -kv[1])[:6]
top_labels = [k for k, v in top_approaches]

def fold(lab):
    return lab if lab in top_labels else "Other"

labels = top_labels + ["Other"]
data = {lab: [] for lab in labels}
for y in years_sorted:
    counts = {}
    for lab, n in approach_by_year.get(y, {}).items():
        fl = fold(lab)
        counts[fl] = counts.get(fl, 0) + n
    for lab in labels:
        data[lab].append(counts.get(lab, 0))

fig, ax = plt.subplots(figsize=(11, 6.4))
bottom = np.zeros(len(years_sorted))
x = np.arange(len(years_sorted))
for i, lab in enumerate(labels):
    vals = np.array(data[lab])
    ax.bar(x, vals, bottom=bottom, color=CAT[i % len(CAT)], label=lab, width=0.68,
           edgecolor="white", linewidth=0.6)
    bottom += vals

ax.set_xticks(x)
ax.set_xticklabels(years_sorted, fontsize=9.5)
ax.set_ylabel("Number of approach labels (multi-label; not unique reports)")
ax.set_title("Approach Labels per Year (n=145 reports, multi-label coding)\n2026 covers only through the search date (27 Sep 2026)",
              fontsize=13, fontweight="bold", pad=14)
ax.spines[["top", "right"]].set_visible(False)
ax.grid(axis="y", color=GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
ax.legend(loc="upper left", fontsize=8.3, frameon=False, ncol=2)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "fig2_temporal_trend.png"), dpi=220, bbox_inches="tight")
plt.close()
print("fig2 done")

# ---------------------------------------------------------------------------
# Figure 3: evidence map heatmap (approach x occupation) -- co-occurrence counts
# ---------------------------------------------------------------------------
axo = FA["approach_x_occupation"]
occ_totals = FA["summary"]["occupations"]
top_occ = [k for k, v in sorted(occ_totals.items(), key=lambda kv: -kv[1])[:6]]
row_labels = top_labels
matrix = np.zeros((len(row_labels), len(top_occ)))
for i, r in enumerate(row_labels):
    for j, c in enumerate(top_occ):
        matrix[i, j] = axo.get(r, {}).get(c, 0)

fig, ax = plt.subplots(figsize=(10, 6.4))
im = ax.imshow(matrix, cmap="Blues", aspect="auto", vmin=0)
ax.set_xticks(range(len(top_occ)))
ax.set_xticklabels(top_occ, rotation=30, ha="right", fontsize=9)
ax.set_yticks(range(len(row_labels)))
ax.set_yticklabels(row_labels, fontsize=9.5)
for i in range(len(row_labels)):
    for j in range(len(top_occ)):
        v = int(matrix[i, j])
        color = "white" if v > matrix.max()*0.55 else INK
        ax.text(j, i, str(v), ha="center", va="center", fontsize=9, color=color)
ax.set_title("Co-occurrence of Approach × Occupation Labels (n=145, multi-label)\ncell = reports carrying BOTH labels; cells are not mutually exclusive",
              fontsize=12.5, fontweight="bold", pad=14)
for spine in ax.spines.values():
    spine.set_visible(False)
ax.set_xticks(np.arange(-.5, len(top_occ), 1), minor=True)
ax.set_yticks(np.arange(-.5, len(row_labels), 1), minor=True)
ax.grid(which="minor", color="white", linewidth=1.5)
ax.tick_params(which="minor", bottom=False, left=False)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "fig3_evidence_map.png"), dpi=220, bbox_inches="tight")
plt.close()
print("fig3 done")

# ---------------------------------------------------------------------------
# Figure 4: semantic cluster scatter
# ---------------------------------------------------------------------------
recs = CL["records"]
cluster_terms = CL["cluster_top_terms"]
clusters = sorted(set(r["cluster"] for r in recs), key=lambda c: -sum(1 for r in recs if r["cluster"]==c))
markers = ["o", "s", "^", "D", "P", "*", "X", "h", "v"]

fig, ax = plt.subplots(figsize=(13, 7.8))
legend_handles = []
for i, c in enumerate(clusters):
    pts = [r for r in recs if r["cluster"] == c]
    xs = [p["x"] for p in pts]
    ys = [p["y"] for p in pts]
    terms = ", ".join(cluster_terms.get(str(c), [])[:3])
    sc = ax.scatter(xs, ys, s=70, marker=markers[i % len(markers)], color=CAT[i % len(CAT)],
                     edgecolor="white", linewidth=0.6, label=f"Cluster {c} (n={len(pts)}): {terms}", alpha=0.9)
    legend_handles.append(sc)

ax.set_xlabel("TF-IDF component 1 (TruncatedSVD) -- not independently interpretable")
ax.set_ylabel("TF-IDF component 2 (TruncatedSVD)")
ax.set_title(f"Semantic Clusters of Abstracts — TF-IDF + KMeans (n=145, k={CL['k']}, silhouette={CL['silhouette']:.3f})\nExploratory grouping only; visual distance is not a validated semantic distance",
             fontsize=12.5, fontweight="bold", pad=14)
ax.spines[["top", "right"]].set_visible(False)
leg = ax.legend(handles=legend_handles, loc="upper left", bbox_to_anchor=(1.02, 1.0), fontsize=8.6,
                 frameon=False, handletextpad=0.6, labelspacing=0.9)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "fig4_cluster_scatter.png"), dpi=220, bbox_inches="tight",
            bbox_extra_artists=(leg,))
plt.close()
print("fig4 done")

print("ALL FIGURES SAVED TO", OUT)
