import json, os, re, sys
from collections import Counter

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import TruncatedSVD

HERE = os.path.dirname(os.path.abspath(__file__))
coded = json.load(open(os.path.join(HERE, "coded_all.json")))

EXTRA_STOP = {
    "study","studies","trial","trials","randomized","randomised","randomised controlled",
    "randomized controlled","rct","participants","intervention","interventions","effect",
    "effects","effectiveness","efficacy","group","groups","results","aim","aims","background",
    "objective","objectives","method","methods","conclusion","conclusions","among","using",
    "based","use","used","compared","control","controlled","outcome","outcomes","significant",
    "significantly","p","95","ci","vs","versus","pilot","feasibility","burnout","digital",
}

docs = [(r["title"] + " . " + (r["abstract"] or "")) for r in coded]

vectorizer = TfidfVectorizer(
    lowercase=True, stop_words="english", ngram_range=(1,2),
    min_df=3, max_df=0.6, sublinear_tf=True,
)
X = vectorizer.fit_transform(docs)
vocab = np.array(vectorizer.get_feature_names_out())
keep_mask = np.array([not any(w in EXTRA_STOP for w in t.split()) for t in vocab])

best_k, best_score, best_labels, best_model = None, -1, None, None
for k in range(3, 10):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X)
    if len(set(labels)) < 2:
        continue
    score = silhouette_score(X, labels)
    print(f"k={k} silhouette={score:.4f}", file=sys.stderr)
    if score > best_score:
        best_k, best_score, best_labels, best_model = k, score, labels, km

print(f"[cluster] chosen k={best_k} silhouette={best_score:.4f}", file=sys.stderr)

order_centroids = best_model.cluster_centers_.argsort()[:, ::-1]
cluster_top_terms = {}
for c in range(best_k):
    terms = []
    for idx in order_centroids[c]:
        if not keep_mask[idx]:
            continue
        terms.append(vocab[idx])
        if len(terms) == 10:
            break
    cluster_top_terms[c] = terms

svd = TruncatedSVD(n_components=2, random_state=42)
coords = svd.fit_transform(X)

for i, r in enumerate(coded):
    r["cluster"] = int(best_labels[i])
    r["x"] = float(coords[i,0])
    r["y"] = float(coords[i,1])

crosstab = {}
for r in coded:
    c = r["cluster"]
    crosstab.setdefault(c, Counter())
    for a in r["approaches"]:
        crosstab[c][a] += 1

print("\n=== CLUSTER SUMMARY ===", file=sys.stderr)
for c in range(best_k):
    n = sum(1 for r in coded if r["cluster"]==c)
    print(f"\nCluster {c} (n={n}) top terms: {', '.join(cluster_top_terms[c])}", file=sys.stderr)
    print("  sample titles:", file=sys.stderr)
    for r in [r for r in coded if r["cluster"]==c][:4]:
        print("   -", r["title"][:100], file=sys.stderr)

out = {
    "k": best_k,
    "silhouette": best_score,
    "cluster_top_terms": {str(k): v for k, v in cluster_top_terms.items()},
    "records": coded,
}
with open(os.path.join(HERE, "clustered_all.json"), "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("\n[cluster] saved clustered_all.json", file=sys.stderr)
