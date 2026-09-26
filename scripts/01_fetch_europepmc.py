import urllib.parse, urllib.request, json, time, sys, os

BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

def g(*terms):
    inner = " OR ".join(terms)
    return f"TITLE_ABS:({inner})"

BURNOUT = g('burnout', '"burn-out"')
DIGITAL = g('digital','online','internet','"web-based"','"web based"','app','"mobile app"',
            'smartphone','ehealth','"e-health"','mhealth','"m-health"','telehealth',
            '"computer-based"','computerized','computerised','chatbot','"conversational agent"',
            '"virtual reality"','videoconferenc*','"internet-based"','"internet based"')
PSYCH = g('psycholog*','CBT','"cognitive behavioral"','"cognitive behavioural"','mindfulness',
          'MBSR','MBCT','"acceptance and commitment"','"self-compassion"','"stress management"',
          '"emotion regulation"','"positive psychology"','coaching','psychoeducation*',
          '"behavioral activation"','"behavioural activation"','resilience','relaxation','biofeedback')
RCT = g('randomi*','RCT','"controlled trial"','"clinical trial"')

QUERY = f"({BURNOUT}) AND ({DIGITAL}) AND ({PSYCH}) AND ({RCT})"

def fetch_page(cursor="*", page_size=100, result_type="core"):
    params = {
        "query": QUERY,
        "format": "json",
        "pageSize": str(page_size),
        "resultType": result_type,
        "cursorMark": cursor,
    }
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "scoping-review-bot/1.0 (mailto:research@example.com)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    all_results = []
    cursor = "*"
    seen_cursors = set()
    hit_count = None
    page_size = 100
    max_records = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    while True:
        data = fetch_page(cursor=cursor, page_size=page_size)
        if hit_count is None:
            hit_count = data.get("hitCount")
            print("hitCount:", hit_count, file=sys.stderr)
        results = data.get("resultList", {}).get("result", [])
        all_results.extend(results)
        print(f"fetched {len(all_results)} / {hit_count}", file=sys.stderr)
        next_cursor = data.get("nextCursorMark")
        if not results or not next_cursor or next_cursor == cursor or next_cursor in seen_cursors:
            break
        seen_cursors.add(next_cursor)
        cursor = next_cursor
        if len(all_results) >= max_records or len(all_results) >= (hit_count or 0):
            break
        time.sleep(0.34)
    out_path = os.path.join(OUT_DIR, "raw_europepmc.json")
    with open(out_path, "w") as f:
        json.dump({"hitCount": hit_count, "query": QUERY, "results": all_results}, f)
    print("Saved", len(all_results), "records to", out_path, file=sys.stderr)

if __name__ == "__main__":
    main()
