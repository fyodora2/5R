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

# corpus so far: 116 existing + 18 new WoS
existing = json.load(open(os.path.join(SCOPING, "coded_all.json")))
wos_new = json.load(open(os.path.join(HERE, "work", "wos_final_new.json")))

all_known_titles = [tokset(r["title"]) for r in existing] + [tokset(r["title"]) for r in wos_new]

def is_dup(title):
    tt = tokset(title)
    for et in all_known_titles:
        if not tt or not et:
            continue
        j = len(tt & et) / len(tt | et)
        if j > 0.85:
            return True
    return False

df = pd.read_csv(os.path.join(HERE, "02_Direct_Database_Records", "scopus_visible_pages_382.csv"))
print(f"[scopus] loaded {len(df)} rows", file=sys.stderr)

new_rows = []
for _, row in df.iterrows():
    title = str(row["Title"]).strip()
    if not title or title.lower() == "nan":
        continue
    if is_dup(title):
        continue
    new_rows.append({
        "rank": row.get("Scopus rank"),
        "title": title,
        "year": row.get("Year"),
        "source": row.get("Source"),
    })

print(f"[scopus] already in corpus: {len(df)-len(new_rows)}", file=sys.stderr)
print(f"[scopus] new titles needing abstract resolution: {len(new_rows)}", file=sys.stderr)

with open(os.path.join(HERE, "work", "scopus_new_titles.json"), "w") as f:
    json.dump(new_rows, f, ensure_ascii=False, indent=1)
