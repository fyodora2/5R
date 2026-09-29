"""Rule-based extraction of five reporting indicators from abstracts (not risk of bias; absence in an abstract does not mean the item was not done)."""
import json,re,csv
import os
# abstract text is not distributed with the repository (licensed sources); point ABSTRACT_JSON to a local {study_id: abstract} file
A=json.load(open(os.environ.get('ABSTRACT_JSON','abstracts_all.json')))
PAT={
 'randomization_method': r"computer[- ]?(generated|algorithm|program|based random)|random(ly)? (number|sequence|permut)|random allocation (list|sequence|schedule)|randomi[sz]ation (list|schedule|software|tool|program|sequence)|(block|stratified|permuted|covariate[- ]constrained|minimi[sz]ation|central(ly)?) (block )?randomi|randomi[sz]ed,? (stratified|in blocks)|stratified (by|randomi|wait)|minimi[sz]ation|lottery|coin (toss|flip)|sealed|opaque|redcap|randomizer|randomi[sz]ation (was|were) (done|performed|conducted|carried out|based|generated|achieved)|(using|via|through|with) (a )?(web[- ]based|online|computer|software|random)[^.]{0,40}(random|allocat)|randomi[sz]ed (using|via|through) (a )?(web|online|computer|software|random|redcap)|covariate[- ]constrained",
 'blinding_stated': r"blind|masked|masking|open[- ]label|unblinded|assessor",
 'attrition_reported': r"drop[- ]?out|attrition|retention (rate)?|lost to follow|withdr[ae]w|completion rate|response rate|non[- ]?completers|completers|\b\d[\d,]*\s*(\(\d+(\.\d+)?%\)|%)?\s*(of\s+\d+\s+)?(\w+\s+){0,3}(completed|responded|remained|finished|analy[sz]ed|dropped)|\b(of|among)\s+\d[\d,]*[^.;]{0,60}(completed|responded|analy[sz]ed|dropped|lost|withdr)|(completed|responded|analy[sz]ed) (by|from) \d|(surveys?|data|questionnaires?) (from|of) \d[\d,]*",
 'registration_reported': r"\bNCT\d{6,}|\bISRCTN\d*|\bDRKS\d+|\bChiCTR|\bACTRN|\bANZCTR|\bIRCT\d*|\bUMIN\d+|\bNTR\d+|\bCRIS\b|(?i:trial registration|registered (at|with|in|on|under|prospectively|retrospectively)|prospectively registered|retrospectively registered|clinicaltrials\.gov|osf\.io|registration number|preregist|pre-regist|\bregistered\b)",
 'analysis_population_stated': r"intention[- ]to[- ]treat|intent[- ]to[- ]treat|\bITT\b|per[- ]protocol|complete[- ]case|modified intention|\\bas[- ]randomi[sz]ed",
}
def run():
    rows=[]
    for sid in sorted(A):
        t=A[sid]; row={'study_id':sid}
        for k,p in PAT.items(): row[k]='yes' if re.search(p,t,(0 if k=='registration_reported' else re.I)) else 'not stated'
        rows.append(row)
    return rows
if __name__=='__main__':
    from collections import Counter
    rows=run()
    for k in PAT: print(k,Counter(r[k] for r in rows))
