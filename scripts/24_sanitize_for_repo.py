import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
RESTRICTED_SOURCES = {"Web of Science", "Scopus"}
PLACEHOLDER = (
    "[abstract text omitted from this repository -- source database terms of "
    "service restrict bulk redistribution of subscription content; screening/"
    "coding for this record was performed against the full abstract during "
    "analysis, not stored here]"
)

def sanitize(records):
    out = []
    for r in records:
        r2 = dict(r)
        if r2.get("source") in RESTRICTED_SOURCES:
            r2["abstract"] = PLACEHOLDER
        out.append(r2)
    return out

coded = json.load(open(os.path.join(HERE, "coded_all2.json")))
json.dump(sanitize(coded), open(os.path.join(HERE, "coded_all2_sanitized.json"), "w"), ensure_ascii=False, indent=1)

clustered = json.load(open(os.path.join(HERE, "clustered_all2.json")))
clustered["records"] = sanitize(clustered["records"])
json.dump(clustered, open(os.path.join(HERE, "clustered_all2_sanitized.json"), "w"), ensure_ascii=False, indent=1)

print("sanitized", sum(1 for r in coded if r.get("source") in RESTRICTED_SOURCES), "records in coded_all2.json")
print("sanitized", sum(1 for r in clustered["records"] if r.get("source") in RESTRICTED_SOURCES), "records in clustered_all2.json")
