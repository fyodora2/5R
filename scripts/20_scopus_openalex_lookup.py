import json, os, re, sys, time, urllib.parse, urllib.request

API_KEY = os.environ.get("OPENALEX_API_KEY", "")
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = "https://api.openalex.org/works"

def norm_title(t):
    t = (t or "").replace("\xa0", " ").lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def tokset(t):
    return set(norm_title(t).split())

def reconstruct_abstract(inv_idx):
    if not inv_idx:
        return ""
    positions = {}
    for word, idxs in inv_idx.items():
        for i in idxs:
            positions[i] = word
    return " ".join(positions[i] for i in sorted(positions))

def lookup(title):
    params = {
        "filter": f"title.search:{title}",
        "per-page": "3",
        "select": "id,doi,title,display_name,abstract_inverted_index,publication_year,type,primary_location",
    }
    if API_KEY:
        params["api_key"] = API_KEY
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "scoping-review-bot/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"results": [], "error": str(e)}

new_titles = json.load(open(os.path.join(HERE, "work", "scopus_new_titles.json")))
resolved = []
no_match = []

for i, row in enumerate(new_titles):
    title = row["title"]
    data = lookup(title)
    results = data.get("results", [])
    best = None
    best_score = 0
    tt = tokset(title)
    for cand in results:
        ct = tokset(cand.get("title") or cand.get("display_name") or "")
        if not tt or not ct:
            continue
        score = len(tt & ct) / len(tt | ct)
        if score > best_score:
            best_score = score
            best = cand
    if best and best_score > 0.7:
        resolved.append({
            "scopus_title": title,
            "scopus_year": row.get("year"),
            "matched_title": best.get("title") or best.get("display_name"),
            "match_score": round(best_score, 3),
            "doi": (best.get("doi") or "").replace("https://doi.org/", "") if best.get("doi") else None,
            "abstract": reconstruct_abstract(best.get("abstract_inverted_index")),
            "pubYear": best.get("publication_year"),
            "type": best.get("type"),
            "venue": (((best.get("primary_location") or {}).get("source") or {}).get("display_name")),
        })
    else:
        no_match.append(row)
    if (i+1) % 25 == 0:
        print(f"  progress {i+1}/{len(new_titles)}  resolved={len(resolved)}  no_match={len(no_match)}", file=sys.stderr)
    time.sleep(0.08)

print(f"[lookup] resolved={len(resolved)}  no_match={len(no_match)}", file=sys.stderr)
with open(os.path.join(HERE, "work", "scopus_resolved.json"), "w") as f:
    json.dump(resolved, f, ensure_ascii=False, indent=1)
with open(os.path.join(HERE, "work", "scopus_no_match.json"), "w") as f:
    json.dump(no_match, f, ensure_ascii=False, indent=1)
