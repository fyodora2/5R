# -*- coding: utf-8 -*-
"""Write the revision of a Word manuscript as tracked changes.

Usage: make_tracked_changes.py OLD_UNPACKED_DIR NEW_UNPACKED_DIR OUT_DIR AUTHOR

OLD is the manuscript as submitted for review, NEW the revised manuscript (both unpacked .docx). Paragraphs and table rows are
aligned by text; unchanged text is kept, changed paragraphs get word-level insertions and deletions, and paragraphs, rows and
tables that exist only in one version are inserted or deleted as a whole. Every change is wrapped in <w:ins> or <w:del> under AUTHOR.
"""
import copy, datetime, difflib, re, shutil, sys, os
from lxml import etree

OLD, NEW, OUT, AUTHOR = sys.argv[1:5]
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"w": W, "r": R, "a": "http://schemas.openxmlformats.org/drawingml/2006/main", "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"}
q = lambda t: "{%s}%s" % (W, t)
DATE = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_id = [9000]
def nid():
    _id[0] += 1; return str(_id[0])
def mark(tag):
    e = etree.Element(q(tag)); e.set(q("id"), nid()); e.set(q("author"), AUTHOR); e.set(q("date"), DATE); return e

shutil.copytree(OLD, OUT)
parse = lambda p: etree.parse(p)
old_t = parse(os.path.join(OUT, "word/document.xml")); new_t = parse(os.path.join(NEW, "word/document.xml"))
old_body = old_t.getroot().find(q("body")); new_body = new_t.getroot().find(q("body"))

# ---------- text helpers
def runs_of(p):
    return [r for r in p.findall(q("r"))]
def rtext(r):
    s = ""
    for c in r:
        if c.tag == q("t"): s += c.text or ""
        elif c.tag == q("tab"): s += "\t"
        elif c.tag == q("br"): s += "\n" if c.get(q("type")) != "page" else "\f"
        elif c.tag == q("drawing"): s += "￼"
    return s
def ptext(p): return "".join(rtext(r) for r in runs_of(p))
def has_drawing(p): return p.find(".//" + q("drawing")) is not None
def segs(p):
    out = []
    for r in runs_of(p):
        t = rtext(r)
        if t: out.append((t, r.find(q("rPr"))))
    return out
def mk_run(text, rpr, deleted=False):
    r = etree.Element(q("r"))
    if rpr is not None: r.append(copy.deepcopy(rpr))
    parts = re.split(r"(\t)", text)
    for part in parts:
        if part == "": continue
        if part == "\t": r.append(etree.Element(q("tab")))
        else:
            t = etree.SubElement(r, q("delText" if deleted else "t")); t.text = part
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    return r
def wrap(kind, runs):
    m = mark(kind)
    for r in runs: m.append(r)
    return m
def slice_runs(sg, a, b, deleted=False):
    out, pos = [], 0
    for text, rpr in sg:
        s, e = pos, pos + len(text); pos = e
        lo, hi = max(a, s), min(b, e)
        if lo < hi: out.append(mk_run(text[lo - s:hi - s], rpr, deleted))
    return out

def mark_para(p, kind):
    ppr = p.find(q("pPr"))
    if ppr is None:
        ppr = etree.Element(q("pPr")); p.insert(0, ppr)
    rpr = ppr.find(q("rPr"))
    if rpr is None:
        rpr = etree.SubElement(ppr, q("rPr"))
    rpr.insert(0, mark(kind))

def delete_para(p):
    """Return a copy of p with all runs deleted and the paragraph mark deleted."""
    n = etree.Element(q("p"))
    ppr = p.find(q("pPr"))
    if ppr is not None: n.append(copy.deepcopy(ppr))
    for r in runs_of(p):
        c = copy.deepcopy(r)
        for t in c.findall(q("t")):
            t.tag = q("delText")
        n.append(wrap("del", [c]))
    mark_para(n, "del")
    return n
def insert_para(p):
    n = etree.Element(q("p"))
    ppr = p.find(q("pPr"))
    if ppr is not None: n.append(copy.deepcopy(ppr))
    for r in runs_of(p):
        n.append(wrap("ins", [copy.deepcopy(r)]))
    mark_para(n, "ins")
    return n

def merge_small(ops, ot, nt):
    # fold tiny 'equal' blocks that sit between two changes into the surrounding change
    ops = [list(o) for o in ops]
    changed = True
    while changed:
        changed = False
        for k in range(1, len(ops) - 1):
            tag, i1, i2, j1, j2 = ops[k]
            if tag == "equal" and ops[k - 1][0] != "equal" and ops[k + 1][0] != "equal":
                words = [x for x in ot[i1:i2] if x.strip()]
                if len(words) <= 2:
                    a, b = ops[k - 1], ops[k + 1]
                    ops[k - 1:k + 2] = [["replace", a[1], b[2], a[3], b[4]]]
                    changed = True; break
    return ops

def diff_para(op, np_):
    ot, nt_ = ptext(op), ptext(np_)
    if ot == nt_: return op
    otok, ntok = re.findall(r"\s+|[^\s]+", ot), re.findall(r"\s+|[^\s]+", nt_)
    sm = difflib.SequenceMatcher(None, otok, ntok, autojunk=False)
    ops = merge_small(sm.get_opcodes(), otok, ntok)
    osg, nsg = segs(op), segs(np_)
    ooff = [0]; [ooff.append(ooff[-1] + len(x)) for x in otok]
    noff = [0]; [noff.append(noff[-1] + len(x)) for x in ntok]
    n = etree.Element(q("p"))
    ppr = op.find(q("pPr"))
    if ppr is not None: n.append(copy.deepcopy(ppr))
    for tag, i1, i2, j1, j2 in ops:
        if tag == "equal":
            for r in slice_runs(osg, ooff[i1], ooff[i2]): n.append(r)
        else:
            if i2 > i1: n.append(wrap("del", slice_runs(osg, ooff[i1], ooff[i2], True)))
            if j2 > j1: n.append(wrap("ins", slice_runs(nsg, noff[j1], noff[j2])))
    return n

# ---------- tables
def cells(tr): return tr.findall(q("tc"))
def rowtext(tr): return "|".join("".join(ptext(p) for p in tc.findall(q("p"))) for tc in cells(tr))
def tbltext(tb): return "\n".join(rowtext(tr) for tr in tb.findall(q("tr")))
def sim(a, b):
    if a == b: return 1.0
    if not a or not b: return 0.0
    wa, wb = set(re.findall(r"\w+", a.lower())), set(re.findall(r"\w+", b.lower()))
    if wa and wb and len(wa & wb) / len(wa | wb) < 0.25: return 0.0
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()

def align(akeys, bkeys, thr, simf=sim):
    """order-preserving fuzzy alignment; returns list of (i or None, j or None)"""
    n, m = len(akeys), len(bkeys)
    S = [[0.0] * (m + 1) for _ in range(n + 1)]
    P = {}
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            best, mv = S[i - 1][j], "u"
            if S[i][j - 1] > best: best, mv = S[i][j - 1], "l"
            s = simf(akeys[i - 1], bkeys[j - 1])
            if s >= thr and S[i - 1][j - 1] + s > best: best, mv = S[i - 1][j - 1] + s, "d"
            S[i][j], P[i, j] = best, mv
    out, i, j = [], n, m
    while i > 0 or j > 0:
        mv = P.get((i, j)) if i > 0 and j > 0 else ("u" if i > 0 else "l")
        if mv == "d": out.append((i - 1, j - 1)); i -= 1; j -= 1
        elif mv == "u": out.append((i - 1, None)); i -= 1
        else: out.append((None, j - 1)); j -= 1
    return out[::-1]

def del_row(tr):
    n = copy.deepcopy(tr)
    for p in n.iter(q("p")):
        for r in p.findall(q("r")):
            for t in r.findall(q("t")): t.tag = q("delText")
            idx = list(p).index(r); p.remove(r); p.insert(idx, wrap("del", [r]))
        mark_para(p, "del")
    trpr = n.find(q("trPr"))
    if trpr is None:
        trpr = etree.Element(q("trPr")); pos = 0
        for k, c in enumerate(n):
            if c.tag in (q("tblPrEx"),): pos = k + 1
        n.insert(pos, trpr)
    trpr.append(mark("del"))
    return n
def ins_row(tr):
    n = copy.deepcopy(tr)
    for p in n.iter(q("p")):
        for r in p.findall(q("r")):
            idx = list(p).index(r); p.remove(r); p.insert(idx, wrap("ins", [r]))
        mark_para(p, "ins")
    trpr = n.find(q("trPr"))
    if trpr is None:
        trpr = etree.Element(q("trPr")); pos = 0
        for k, c in enumerate(n):
            if c.tag in (q("tblPrEx"),): pos = k + 1
        n.insert(pos, trpr)
    trpr.append(mark("ins"))
    return n
def diff_row(otr, ntr):
    ocs, ncs = cells(otr), cells(ntr)
    if len(ocs) != len(ncs): return None
    n = copy.deepcopy(otr)
    for oc, nc, tc in zip(ocs, ncs, cells(n)):
        ops, nps = oc.findall(q("p")), nc.findall(q("p"))
        if len(ops) != 1 or len(nps) != 1: return None
        newp = diff_para(ops[0], nps[0])
        tp = tc.find(q("p")); tc.replace(tp, copy.deepcopy(newp))
    return n
def diff_table(otb, ntb):
    n = copy.deepcopy(otb)
    orows, nrows = otb.findall(q("tr")), ntb.findall(q("tr"))
    pairs = align([rowtext(r) for r in orows], [rowtext(r) for r in nrows], 0.45)
    for tr in n.findall(q("tr")): n.remove(tr)
    for i, j in pairs:
        if i is not None and j is not None:
            d = diff_row(orows[i], nrows[j])
            if d is None: n.append(del_row(orows[i])); n.append(ins_row(nrows[j]))
            else: n.append(d)
        elif i is not None: n.append(del_row(orows[i]))
        else: n.append(ins_row(nrows[j]))
    return n
def del_table(tb):
    n = copy.deepcopy(tb)
    for tr in n.findall(q("tr")): idx = list(n).index(tr); n.remove(tr); n.insert(idx, del_row(tr))
    return n
def ins_table(tb):
    n = copy.deepcopy(tb)
    for tr in n.findall(q("tr")): idx = list(n).index(tr); n.remove(tr); n.insert(idx, ins_row(tr))
    return n

# ---------- images
rels_new = etree.parse(os.path.join(NEW, "word/_rels/document.xml.rels")).getroot()
rels_old_path = os.path.join(OUT, "word/_rels/document.xml.rels"); rels_old = etree.parse(rels_old_path); rr = rels_old.getroot()
RELNS = "http://schemas.openxmlformats.org/package/2006/relationships"
_img = [0]; _docpr = [5000]
def import_images(p):
    for blip in p.iter("{%s}blip" % NS["a"]):
        rid = blip.get("{%s}embed" % R)
        tgt = [x.get("Target") for x in rels_new if x.get("Id") == rid][0]
        _img[0] += 1
        name = "media/revised_figure_%d%s" % (_img[0], os.path.splitext(tgt)[1])
        shutil.copy(os.path.join(NEW, "word", tgt), os.path.join(OUT, "word", name))
        nr = "rIdRev%d" % _img[0]
        e = etree.SubElement(rr, "{%s}Relationship" % RELNS); e.set("Id", nr); e.set("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"); e.set("Target", name)
        blip.set("{%s}embed" % R, nr)
    for d in p.iter("{%s}docPr" % NS["wp"]):
        _docpr[0] += 1; d.set("id", str(_docpr[0]))

# ---------- block-level alignment
def kids(body): return [c for c in body if c.tag in (q("p"), q("tbl"))]
def key(e):
    if e.tag == q("tbl"): return "TBL:" + tbltext(e)
    if has_drawing(e): return "IMG"
    return ptext(e)
def bsim(a, b):
    if a == b and a != "IMG": return 1.0
    if a.startswith("TBL:") != b.startswith("TBL:"): return 0.0
    if a == "IMG" or b == "IMG": return 0.0
    return sim(a, b)

okids, nkids = kids(old_body), kids(new_body)
okey, nkey = [key(e) for e in okids], [key(e) for e in nkids]
sm = difflib.SequenceMatcher(None, okey, nkey, autojunk=False)
result = []
stats = {"kept": 0, "edited": 0, "deleted": 0, "inserted": 0}
def emit_pair(oe, ne):
    if oe.tag == q("tbl"):
        result.append(diff_table(oe, ne)); stats["edited"] += 1
    else:
        d = diff_para(oe, ne); result.append(d); stats["edited" if d is not oe else "kept"] += 1
def emit_del(e):
    result.append(del_table(e) if e.tag == q("tbl") else delete_para(e)); stats["deleted"] += 1
def emit_ins(e):
    c = copy.deepcopy(e)
    if has_drawing(c) or c.find(".//" + q("drawing")) is not None: import_images(c)
    result.append(ins_table(c) if c.tag == q("tbl") else insert_para(c)); stats["inserted"] += 1
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i1, i2): result.append(okids[k]); stats["kept"] += 1
        continue
    pairs = align(okey[i1:i2], nkey[j1:j2], 0.5, bsim) if (i2 - i1) * (j2 - j1) < 400000 else [(k, None) for k in range(i2 - i1)] + [(None, k) for k in range(j2 - j1)]
    for a, b in pairs:
        if a is not None and b is not None: emit_pair(okids[i1 + a], nkids[j1 + b])
        elif a is not None: emit_del(okids[i1 + a])
        else: emit_ins(nkids[j1 + b])

sect = old_body.find(q("sectPr"))
for c in list(old_body):
    if c.tag != q("sectPr"): old_body.remove(c)
for k, e in enumerate(result): old_body.insert(k, e)
old_t.write(os.path.join(OUT, "word/document.xml"), xml_declaration=True, encoding="UTF-8", standalone=True)
rels_old.write(rels_old_path, xml_declaration=True, encoding="UTF-8", standalone=True)
# settings: keep tracking on
sp = os.path.join(OUT, "word/settings.xml"); st = etree.parse(sp); root = st.getroot()
if root.find(q("trackRevisions")) is None:
    root.insert(0, etree.Element(q("trackRevisions")))
st.write(sp, xml_declaration=True, encoding="UTF-8", standalone=True)
cp = os.path.join(OUT, "docProps/core.xml")
if os.path.exists(cp):
    ct = etree.parse(cp); r0 = ct.getroot()
    for el in r0.iter():
        if isinstance(el.tag, str) and (el.tag.endswith("}lastModifiedBy") or el.tag.endswith("}creator")): el.text = AUTHOR
    ct.write(cp, xml_declaration=True, encoding="UTF-8", standalone=True)
print(stats, "revisions:", _id[0] - 9000)
