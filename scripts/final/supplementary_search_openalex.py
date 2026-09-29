import urllib.parse, urllib.request, json, os
DIG = ('digital OR online OR internet OR "web-based" OR "web based" OR app OR "mobile app" OR smartphone OR ehealth OR "e-health" OR mhealth OR "m-health" OR telehealth OR "computer-based" OR computerized OR computerised OR chatbot OR "conversational agent" OR "virtual reality" OR videoconferencing OR "internet-based" OR "internet based"')
DIGX = ('wearable OR SMS OR "text message" OR "text messaging" OR WhatsApp OR WeChat OR gamification OR exergame OR "mobile phone" OR telemedicine OR tablet OR "e-learning" OR webinar OR "video-based" OR "serious game" OR "digital health" OR "fitness tracker" OR "activity tracker"')
PSY = ('psychological OR psychology OR CBT OR "cognitive behavioral" OR "cognitive behavioural" OR mindfulness OR MBSR OR MBCT OR "acceptance and commitment" OR "self-compassion" OR "stress management" OR "emotion regulation" OR "positive psychology" OR coaching OR psychoeducation OR "behavioral activation" OR "behavioural activation" OR resilience OR relaxation OR biofeedback')
RCT = '(randomized OR randomised OR RCT OR "controlled trial" OR "clinical trial")'
Q = f'(burnout OR "burn-out") AND ({DIG} OR {DIGX}) AND {RCT} AND NOT ({PSY})'
def run(q):
    out=[];cur="*"
    while cur:
        p={"filter":"title_and_abstract.search:"+q,"per-page":"200","cursor":cur,
           "select":"id,doi,title,abstract_inverted_index,publication_year,type,primary_location,ids"}
        k=os.environ.get("OPENALEX_API_KEY")
        if k: p["api_key"]=k
        d=json.load(urllib.request.urlopen(urllib.request.Request("https://api.openalex.org/works?"+urllib.parse.urlencode(p),headers={"User-Agent":"scoping-review/1.0"}),timeout=60))
        out+=d["results"]; cur=d["meta"].get("next_cursor") if d["results"] else None
    return d["meta"]["count"],out
c,o=run(Q); print("openalex sens",c,len(o))
json.dump({"query":Q,"date":"2026-09-28","results":o},open("oa_sens.json","w"))
