import urllib.parse, urllib.request, json, time, sys, os

# Set your own free OpenAlex API key (openalex.org) as an env var before running.
# A personal key has its own quota, separate from the shared-IP free-tier budget
# that this project hit when first trying OpenAlex without one.
API_KEY = os.environ.get("OPENALEX_API_KEY", "")
BASE = "https://api.openalex.org/works"
HERE = os.path.dirname(os.path.abspath(__file__))

QUERY = (
    '(burnout OR "burn-out") AND '
    '(digital OR online OR internet OR "web-based" OR "web based" OR app OR "mobile app" OR smartphone '
    'OR ehealth OR "e-health" OR mhealth OR "m-health" OR telehealth OR "computer-based" OR computerized '
    'OR computerised OR chatbot OR "conversational agent" OR "virtual reality" OR videoconferencing OR '
    '"internet-based" OR "internet based") AND '
    '(psychological OR psychology OR CBT OR "cognitive behavioral" OR "cognitive behavioural" OR mindfulness '
    'OR MBSR OR MBCT OR "acceptance and commitment" OR "self-compassion" OR "stress management" OR '
    '"emotion regulation" OR "positive psychology" OR coaching OR psychoeducation OR "behavioral activation" '
    'OR "behavioural activation" OR resilience OR relaxation OR biofeedback) AND '
    '(randomized OR randomised OR RCT OR "controlled trial" OR "clinical trial")'
)

def fetch_page(cursor="*", per_page=200):
    params = {
        "filter": f"title_and_abstract.search:{QUERY}",
        "per-page": str(per_page),
        "cursor": cursor,
        "select": "id,doi,title,display_name,abstract_inverted_index,publication_year,type,type_crossref,cited_by_count,primary_location,authorships,concepts,is_retracted",
    }
    if API_KEY:
        params["api_key"] = API_KEY
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "scoping-review-bot/1.0 (mailto:research@example.com)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def reconstruct_abstract(inv_idx):
    if not inv_idx:
        return ""
    positions = {}
    for word, idxs in inv_idx.items():
        for i in idxs:
            positions[i] = word
    return " ".join(positions[i] for i in sorted(positions))

def main():
    all_results = []
    cursor = "*"
    count = None
    max_records = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    while True:
        data = fetch_page(cursor=cursor)
        if count is None:
            count = data["meta"]["count"]
            print("count:", count, file=sys.stderr)
        results = data.get("results", [])
        all_results.extend(results)
        print(f"fetched {len(all_results)} / {count}", file=sys.stderr)
        cursor = data["meta"].get("next_cursor")
        if not results or not cursor or len(all_results) >= max_records or len(all_results) >= count:
            break
        time.sleep(0.15)

    out = []
    for r in all_results:
        out.append({
            "id": r.get("id"),
            "doi": (r.get("doi") or "").replace("https://doi.org/", "") if r.get("doi") else None,
            "title": r.get("title") or r.get("display_name"),
            "abstract": reconstruct_abstract(r.get("abstract_inverted_index")),
            "pubYear": r.get("publication_year"),
            "type": r.get("type"),
            "type_crossref": r.get("type_crossref"),
            "citedByCount": r.get("cited_by_count", 0),
            "venue": (((r.get("primary_location") or {}).get("source") or {}).get("display_name")),
            "is_retracted": r.get("is_retracted"),
        })

    with open(os.path.join(HERE, "raw_openalex.json"), "w") as f:
        json.dump({"count": count, "query": QUERY, "results": out}, f, ensure_ascii=False)
    print("saved", len(out), "records", file=sys.stderr)

if __name__ == "__main__":
    main()
