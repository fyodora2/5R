import urllib.parse, urllib.request, json, time, sys, os

BASE = "https://api.ies.ed.gov/eric/"
HERE = os.path.dirname(os.path.abspath(__file__))

QUERY = (
    '(burnout) AND '
    '(digital OR online OR internet OR "app-based" OR "mobile app" OR "web-based" OR "web based" OR '
    'ehealth OR mhealth OR telehealth OR "computer-based" OR chatbot OR "virtual reality" OR '
    '"self-taught" OR "delivered virtually" OR "smartphone app") AND '
    '(psycholog* OR CBT OR mindfulness OR ACT OR "self-compassion" OR "stress management" OR '
    'coaching OR psychoeducation OR resilience OR "emotion regulation") AND '
    '(randomi* OR RCT OR "controlled trial")'
)

def fetch_page(start=0, rows=100):
    params = {"search": QUERY, "start": str(start), "rows": str(rows), "format": "json"}
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "scoping-review-bot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    all_docs = []
    start = 0
    rows = 100
    num_found = None
    while True:
        data = fetch_page(start=start, rows=rows)
        if num_found is None:
            num_found = data["response"]["numFound"]
            print("numFound:", num_found, file=sys.stderr)
        docs = data["response"]["docs"]
        all_docs.extend(docs)
        print(f"fetched {len(all_docs)} / {num_found}", file=sys.stderr)
        start += rows
        if not docs or start >= num_found:
            break
        time.sleep(0.2)

    with open(os.path.join(HERE, "raw_eric.json"), "w") as f:
        json.dump({"numFound": num_found, "query": QUERY, "docs": all_docs}, f, ensure_ascii=False)
    print("saved", len(all_docs), "records", file=sys.stderr)

if __name__ == "__main__":
    main()
