import json, re, os, sys
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
SCOPING = os.path.dirname(HERE)

def norm_title(t):
    t = (t or "").replace("\xa0", " ").lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def tokset(t):
    return set(norm_title(t).split())

# ---------------------------------------------------------------------------
# load existing 116-study corpus for cross-dedup
# ---------------------------------------------------------------------------
existing = json.load(open(os.path.join(SCOPING, "coded_all.json")))
existing_dois = set((r.get("doi") or "").lower().strip() for r in existing if r.get("doi"))
existing_titles = [tokset(r["title"]) for r in existing]

def is_dup_of_existing(title, doi=None):
    if doi and doi.lower().strip() in existing_dois:
        return True
    tt = tokset(title)
    for et in existing_titles:
        if not tt or not et:
            continue
        j = len(tt & et) / len(tt | et)
        if j > 0.85:
            return True
    return False

# ---------------------------------------------------------------------------
# WoS
# ---------------------------------------------------------------------------
df = pd.read_excel(os.path.join(HERE, "02_Direct_Database_Records", "savedrecs.xls"))
print(f"[wos] loaded {len(df)} records", file=sys.stderr)

records = []
for _, row in df.iterrows():
    title = row.get("Article Title")
    abstract = row.get("Abstract")
    doi = row.get("DOI")
    year = row.get("Publication Year")
    doctype = row.get("Document Type")
    if pd.isna(title):
        continue
    records.append({
        "title": str(title),
        "abstract": "" if pd.isna(abstract) else str(abstract),
        "pubYear": int(year) if not pd.isna(year) else None,
        "doi": None if pd.isna(doi) else str(doi),
        "docType": "" if pd.isna(doctype) else str(doctype),
        "source": "Web of Science",
    })

new_candidates = [r for r in records if not is_dup_of_existing(r["title"], r["doi"])]
print(f"[wos] already in corpus: {len(records)-len(new_candidates)}", file=sys.stderr)
print(f"[wos] new candidates to screen: {len(new_candidates)}", file=sys.stderr)

with open(os.path.join(HERE, "work", "wos_new_candidates.json"), "w") as f:
    json.dump(new_candidates, f, ensure_ascii=False, indent=1)
