import urllib.parse, urllib.request, json, sys
def g(*t): return "TITLE_ABS:(" + " OR ".join(t) + ")"
BURNOUT = g('burnout','"burn-out"')
DIGITAL = g('digital','online','internet','"web-based"','"web based"','app','"mobile app"','smartphone','ehealth','"e-health"','mhealth','"m-health"','telehealth','"computer-based"','computerized','computerised','chatbot','"conversational agent"','"virtual reality"','videoconferenc*','"internet-based"','"internet based"')
DIGITAL_X = g('wearable*','SMS','"text messag*"','"text-messag*"','WhatsApp','WeChat','gamif*','exergam*','"mobile phone"','"cell phone"','telemedicine','tablet','"e-learning"','elearning','webinar*','zoom','"video-based"','"video conferenc*"','"serious game"','platform','applications','"digital health"','fitness tracker*','"activity tracker*"')
PSYCH = g('psycholog*','CBT','"cognitive behavioral"','"cognitive behavioural"','mindfulness','MBSR','MBCT','"acceptance and commitment"','"self-compassion"','"stress management"','"emotion regulation"','"positive psychology"','coaching','psychoeducation*','"behavioral activation"','"behavioural activation"','resilience','relaxation','biofeedback')
RCT = g('randomi*','RCT','"controlled trial"','"clinical trial"')
ORIG = f"({BURNOUT}) AND ({DIGITAL}) AND ({PSYCH}) AND ({RCT})"
SENS = f"({BURNOUT}) AND (({DIGITAL}) OR ({DIGITAL_X})) AND ({RCT}) NOT (({DIGITAL}) AND ({PSYCH}))"
def fetch(q):
    out=[];cur="*"
    while True:
        p={"query":q,"format":"json","resultType":"core","pageSize":1000,"cursorMark":cur}
        d=json.load(urllib.request.urlopen("https://www.ebi.ac.uk/europepmc/webservices/rest/search?"+urllib.parse.urlencode(p),timeout=60))
        out+=d["resultList"]["result"]; nc=d.get("nextCursorMark")
        if not nc or nc==cur or not d["resultList"]["result"]: return d["hitCount"],out
        cur=nc
if __name__=="__main__":
    h,o=fetch(ORIG); print("orig",h)
    h,o=fetch(SENS); print("sens",h,len(o))
    json.dump({"query":SENS,"date":"2026-09-28","results":o},open("epmc_sens.json","w"))
