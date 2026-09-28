# -*- coding: utf-8 -*-
"""Build docs/dashboard.html: a self-contained evidence-map page from the final study-level data."""
import base64, csv, html, json, os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
rows = list(csv.DictReader(open(os.path.join(REPO, "data", "study_charting.csv"), encoding="utf-8")))
summ = json.load(open(os.path.join(REPO, "data", "study_summary.json"), encoding="utf-8"))
regs = list(csv.DictReader(open(os.path.join(REPO, "data", "registry_linkage.csv"), encoding="utf-8")))

def img(name):
    with open(os.path.join(REPO, "paper", "figures", name), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

studies = [{k: r[k] for k in ("study_id", "reports", "first_year", "title", "doi", "occupation", "delivery",
                               "approach", "mechanism", "comparator", "human_support", "burnout_instrument",
                               "n_randomized")} for r in rows]
N = len(studies)
health = summ["healthcare_studies"]
due = [r for r in regs if r["allocation"] == "RANDOMIZED" and r["completion_date"] < "2024"]
none = sum(1 for r in due if r["status"] == "No results report located")
tiles = [
    (str(N), "randomized trials (%d reports)" % summ["n_reports"]),
    ("%d%%" % round(100 * summ["period"]["2023-2026"] / N), "first reported 2023–2026"),
    ("%d%%" % round(100 * health / N), "in healthcare workers"),
    (str(summ["n_randomized"]["median"]), "median participants randomized"),
    ("%d of %d" % (none, len(due)), "registered RCTs completed by 2023 with no results found"),
]

page = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Digital Burnout Trials Map</title>
<style>
:root{--surface:#fcfcfb;--surface-2:#f0efec;--text:#0b0b0b;--text-2:#52514e;--muted:#898781;--grid:#e1e0d9;--accent:#1c5cab}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--surface:#1a1a19;--surface-2:#262624;--text:#ffffff;--text-2:#c3c2b7;--muted:#8f8e86;--grid:#383835;--accent:#86b6ef}}
:root[data-theme="dark"]{--surface:#1a1a19;--surface-2:#262624;--text:#ffffff;--text-2:#c3c2b7;--muted:#8f8e86;--grid:#383835;--accent:#86b6ef}
*{box-sizing:border-box}body{margin:0;background:var(--surface);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:1.5rem;margin:0 0 4px}h2{font-size:1.1rem;margin:36px 0 10px}
.sub{color:var(--text-2);margin:0 0 20px}.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.tile{background:var(--surface-2);border-radius:10px;padding:14px}.tile .v{font-size:1.6rem;font-weight:650;font-variant-numeric:tabular-nums}.tile .l{color:var(--text-2);font-size:.85rem}
figure{margin:0 0 8px;background:#fff;border-radius:10px;padding:10px}figure img{width:100%;height:auto;display:block}
figcaption{color:var(--text-2);font-size:.85rem;margin-top:6px}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}.filters select,.filters input{background:var(--surface-2);color:var(--text);border:1px solid var(--grid);border-radius:8px;padding:6px 8px;font:inherit;font-size:.9rem;max-width:100%}
.tablewrap{overflow-x:auto;border:1px solid var(--grid);border-radius:10px}table{border-collapse:collapse;width:100%;font-size:.84rem}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--grid);vertical-align:top}th{position:sticky;top:0;background:var(--surface-2);cursor:pointer;white-space:nowrap}
td.num{text-align:right;font-variant-numeric:tabular-nums}a{color:var(--accent)}.count{color:var(--text-2);font-size:.85rem;margin:6px 0}
</style></head><body><main>
<h1>Randomized trials of digital interventions reporting occupational burnout</h1>
<p class="sub">Scoping review evidence map &middot; searches to 27 September 2026 &middot; unit = trial (study level)</p>
<div class="tiles">__TILES__</div>
<h2>Study selection</h2>
<figure><img src="__F1__" alt="PRISMA 2020 flow diagram"><figcaption>PRISMA 2020 flow: databases and registry-linked publications.</figcaption></figure>
<h2>Trials by year of first report and delivery mode</h2>
<figure><img src="__F2__" alt="Stacked bar chart of trials per year by delivery mode"><figcaption>2026 covers January to September.</figcaption></figure>
<h2>Evidence map: occupation &times; intervention approach</h2>
<figure><img src="__F3__" alt="Heatmap of trials by occupation and approach"><figcaption>Cell = number of trials; row and column totals in parentheses.</figcaption></figure>
<h2>Included trials</h2>
<div class="filters">
<input id="q" type="search" placeholder="Search title" aria-label="Search title">
<select id="f-occupation" aria-label="Occupation"></select><select id="f-delivery" aria-label="Delivery"></select>
<select id="f-approach" aria-label="Approach"></select><select id="f-comparator" aria-label="Comparator"></select>
</div>
<div class="count" id="count"></div>
<div class="tablewrap"><table><thead><tr>
<th data-k="study_id">Study</th><th data-k="first_year">Year</th><th data-k="title">Title</th><th data-k="occupation">Occupation</th>
<th data-k="delivery">Delivery</th><th data-k="approach">Approach</th><th data-k="comparator">Comparator</th>
<th data-k="burnout_instrument">Burnout measure</th><th data-k="n_randomized">n</th></tr></thead><tbody id="tb"></tbody></table></div>
</main>
<script>
const S = __DATA__;
const F = ["occupation","delivery","approach","comparator"];
F.forEach(k => {
  const sel = document.getElementById("f-" + k);
  const vals = [...new Set(S.map(s => s[k]))].sort();
  sel.innerHTML = `<option value="">All ${k}s</option>` + vals.map(v => `<option>${v}</option>`).join("");
  sel.onchange = render;
});
document.getElementById("q").oninput = render;
let sortK = "study_id", dir = 1;
document.querySelectorAll("th").forEach(th => th.onclick = () => { const k = th.dataset.k; dir = sortK === k ? -dir : 1; sortK = k; render(); });
function esc(t){ const d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
function render(){
  const q = document.getElementById("q").value.toLowerCase();
  let r = S.filter(s => F.every(k => { const v = document.getElementById("f-" + k).value; return !v || s[k] === v; }) && (!q || s.title.toLowerCase().includes(q)));
  r.sort((a,b) => { const x = a[sortK], y = b[sortK]; const nx = parseFloat(x), ny = parseFloat(y);
    return (!isNaN(nx) && !isNaN(ny) ? nx - ny : String(x).localeCompare(String(y))) * dir; });
  document.getElementById("count").textContent = `${r.length} of ${S.length} trials`;
  document.getElementById("tb").innerHTML = r.map(s => `<tr><td>${s.study_id}</td><td class="num">${s.first_year}</td>
    <td>${s.doi ? `<a href="https://doi.org/${esc(s.doi)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</td>
    <td>${esc(s.occupation)}</td><td>${esc(s.delivery)}</td><td>${esc(s.approach)}</td><td>${esc(s.comparator)}</td>
    <td>${s.burnout_instrument === "NR" ? "—" : esc(s.burnout_instrument)}</td><td class="num">${s.n_randomized || "NR"}</td></tr>`).join("");
}
render();
</script></body></html>"""

page = (page.replace("__TILES__", "".join('<div class="tile"><div class="v">%s</div><div class="l">%s</div></div>'
                                          % (html.escape(v), html.escape(l)) for v, l in tiles))
        .replace("__F1__", img("fig1_prisma_flow.png")).replace("__F2__", img("fig2_temporal_trend.png"))
        .replace("__F3__", img("fig3_evidence_map.png"))
        .replace("__DATA__", json.dumps(studies, ensure_ascii=False).replace("</", "<\\/")))
out = os.path.join(REPO, "docs", "dashboard.html")
open(out, "w", encoding="utf-8").write(page)
print("wrote", out, os.path.getsize(out), "bytes;", N, "trials")
