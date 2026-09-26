import json, re, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
EPMC = json.load(open(os.path.join(HERE, "screened.json")))["records"]
OA = json.load(open(os.path.join(HERE, "raw_openalex.json")))["results"]

def norm_title(t):
    t = (t or "").replace("\xa0", " ").lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def tokset(t):
    return set(norm_title(t).split())

epmc_dois = set()
epmc_titles = []
for r in EPMC:
    doi = (r.get("doi") or "").lower().strip()
    if doi:
        epmc_dois.add(doi)
    epmc_titles.append(tokset(r.get("title")))

EXCLUDE_TYPES = {"review", "dissertation", "editorial", "conference-abstract", "erratum",
                 "other", "book-chapter", "dataset", "paratext", "software", "supplementary-materials"}

new_candidates = []
skipped_dup = 0
skipped_type = 0
skipped_no_abstract = 0

for r in OA:
    doi = (r.get("doi") or "").lower().strip()
    if doi and doi in epmc_dois:
        skipped_dup += 1
        continue
    tt = tokset(r.get("title"))
    is_dup = False
    for et in epmc_titles:
        if not tt or not et:
            continue
        j = len(tt & et) / len(tt | et)
        if j > 0.85:
            is_dup = True
            break
    if is_dup:
        skipped_dup += 1
        continue
    if r.get("type") in EXCLUDE_TYPES:
        skipped_type += 1
        continue
    if not r.get("abstract"):
        skipped_no_abstract += 1
        continue
    new_candidates.append(r)

print(f"OpenAlex raw: {len(OA)}", file=sys.stderr)
print(f"Already in Europe PMC corpus (dup): {skipped_dup}", file=sys.stderr)
print(f"Excluded by type (review/dissertation/editorial/etc.): {skipped_type}", file=sys.stderr)
print(f"No abstract available (can't screen): {skipped_no_abstract}", file=sys.stderr)
print(f"NEW unique candidates to screen: {len(new_candidates)}", file=sys.stderr)

with open(os.path.join(HERE, "openalex_new_candidates.json"), "w") as f:
    json.dump(new_candidates, f, ensure_ascii=False)
