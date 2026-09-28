# -*- coding: utf-8 -*-
"""Study-level data charting (reviewer-charted from title/abstract; full text for R032, R121).

One primary category per study for each dimension (mutually exclusive).
Codes:
 occ : N Nurses | P Physicians & physician trainees | H Other/mixed healthcare workers |
       M Mental-health & social-care professionals | T Teachers & education staff |
       E Employees in other sectors or mixed occupations
 mod : WEB web-based program | APP smartphone app | LIVE live online sessions (videoconference/webinar) |
       MSG text or instant messaging | CHAT chatbot | BLEND digital + in-person | OTHER wearable/motion platform
 app : MIND mindfulness/meditation | COMP compassion-based | CBT cognitive-behavioural/stress management/problem solving |
       ACT acceptance & commitment | POS positive psychology | COACH coaching | PSYED psychoeducation/resilience/PFA |
       OTHP other psychological | NONP non-psychological (physical activity, feedback/navigation, professional training)
 ins : burnout instrument named in the abstract (NR = not named)
 cmp : WL waitlist/delayed | UC usual practice/no intervention | AC active/attention control |
       H2H head-to-head comparison of digital variants only | NR not reported
 gui : SELF self-guided/automated | HUMAN human-supported or facilitated | NR not reported
 n   : participants randomized (or analysed, where only that is reported); None = not reported
"""
C = {
 # rec: (occ, mod, app, ins, cmp, gui, n)
 1:  ("H","BLEND","PSYED","NR","AC","HUMAN",96),
 2:  ("N","WEB","CBT","NR","UC","NR",501),
 3:  ("H","LIVE","MIND","MBI","WL","HUMAN",98),
 4:  ("H","APP","MIND","MBI","AC","SELF",2182),
 8:  ("H","WEB","POS","NR","WL","SELF",554),
 9:  ("N","WEB","MIND","ProQOL","NR","NR",74),
 10: ("E","WEB","ACT","BBI","H2H","HUMAN",111),
 11: ("H","APP","PSYED","CBI","WL","SELF",34),
 13: ("H","WEB","ACT","NR","WL","HUMAN",108),
 14: ("P","BLEND","MIND","MBI","WL","HUMAN",66),
 15: ("P","WEB","MIND","MBI","WL","NR",474),
 17: ("E","OTHER","NONP","NR","NR","HUMAN",116),
 18: ("H","APP","PSYED","NR","AC","SELF",60),
 20: ("N","APP","CBT","CBI","AC","SELF",125),
 21: ("E","WEB","POS","NR","WL","NR",167),
 23: ("H","APP","PSYED","MBI","AC","SELF",482),
 25: ("E","WEB","MIND","MBI","WL","HUMAN",161),   # MBI named in companion report R091
 32: ("T","WEB","CBT","MBI","WL","HUMAN",200),
 33: ("H","CHAT","PSYED","OLBI","AC","SELF",1584),
 34: ("N","LIVE","OTHP","NR","UC","HUMAN",72),
 36: ("H","LIVE","CBT","NR","UC","HUMAN",160),
 37: ("P","BLEND","POS","CBI","WL","HUMAN",102),
 38: ("E","WEB","MIND","NR","AC","NR",71),
 39: ("E","OTHER","NONP","NR","AC","SELF",75),
 41: ("M","LIVE","OTHP","NR","WL","HUMAN",135),
 42: ("E","WEB","CBT","SMBQ","WL","NR",182),
 43: ("H","WEB","COMP","CBI","WL","SELF",190),
 44: ("H","LIVE","CBT","OLBI","H2H","HUMAN",465),
 45: ("H","WEB","OTHP","NR","AC","SELF",1240),
 46: ("E","BLEND","PSYED","MBI","WL","NR",456),
 47: ("P","WEB","COACH","MBI","UC","HUMAN",101),
 48: ("N","LIVE","OTHP","NR","WL","HUMAN",24),
 49: ("M","WEB","NONP","NR","H2H","HUMAN",147),
 53: ("H","WEB","ACT","NR","H2H","HUMAN",252),
 54: ("H","APP","MIND","PFI","AC","SELF",397),
 55: ("P","MSG","POS","CBI","UC","SELF",279),
 57: ("P","LIVE","MIND","PFI","AC","HUMAN",None),
 62: ("P","WEB","COACH","MBI","UC","HUMAN",160),
 66: ("E","WEB","CBT","NR","AC","HUMAN",117),
 67: ("H","APP","PSYED","MBI","WL","SELF",None),
 68: ("P","WEB","COACH","MBI","UC","HUMAN",1017),
 69: ("E","APP","CBT","NR","AC","SELF",2084),
 71: ("H","APP","MIND","MBI","WL","SELF",148),
 74: ("N","WEB","OTHP","CBI","AC","SELF",120),
 76: ("H","WEB","POS","NR","WL","SELF",481),   # WISER (reports R076, R080, R136)
 79: ("M","WEB","OTHP","NR","UC","NR",253),
 81: ("T","LIVE","CBT","OLBI","NR","HUMAN",80),
 82: ("H","APP","MIND","NR","WL","SELF",1458),
 83: ("P","BLEND","NONP","MBI","AC","HUMAN",21),
 85: ("H","WEB","ACT","NR","H2H","SELF",42),
 86: ("N","BLEND","MIND","MBI","AC","HUMAN",101),
 87: ("H","WEB","POS","MBI","AC","SELF",38),
 89: ("M","LIVE","MIND","NR","AC","HUMAN",60),
 90: ("P","WEB","OTHP","NR","NR","SELF",290),
 96: ("E","WEB","POS","NR","AC","SELF",66),
 97: ("T","WEB","NONP","MBI","UC","HUMAN",200),
 99: ("H","LIVE","COMP","NR","WL","HUMAN",82),
 101:("H","BLEND","POS","MBI","NR","HUMAN",80),
 105:("P","BLEND","MIND","MBI","NR","HUMAN",69),
 109:("H","WEB","MIND","CBI","WL","HUMAN",57),
 114:("T","WEB","OTHP","NR","WL","SELF",122),
 115:("N","WEB","COMP","MBI","AC","NR",70),
 116:("T","WEB","CBT","NR","WL","NR",150),
 117:("E","APP","CBT","NR","WL","SELF",113),
 118:("N","APP","ACT","NR","WL","SELF",145),
 120:("M","LIVE","MIND","NR","AC","HUMAN",62),
 121:("E","APP","OTHP","MBI","WL","SELF",190),
 124:("E","WEB","OTHP","NR","WL","HUMAN",69),
 125:("N","APP","MIND","MBI","WL","SELF",102),
 126:("T","WEB","PSYED","NR","NR","NR",51),
 127:("E","WEB","NONP","NR","UC","HUMAN",82),
 129:("N","LIVE","PSYED","ProQOL","NR","HUMAN",48),
 130:("N","LIVE","OTHP","MBI","UC","HUMAN",47),
 131:("T","LIVE","MIND","NR","WL","HUMAN",None),
 133:("T","WEB","COMP","NR","AC","SELF",119),
 134:("H","APP","OTHP","NR","WL","NR",86),
 135:("H","WEB","NONP","NR","UC","SELF",538),
 137:("H","APP","MIND","NR","NR","SELF",None),
 138:("H","APP","NONP","NR","WL","SELF",288),
 139:("M","WEB","COMP","SMBQ","WL","SELF",101),
 140:("H","MSG","NONP","NR","UC","SELF",1275),
 141:("P","APP","MIND","NR","NR","SELF",None),
 142:("M","WEB","OTHP","NR","AC","SELF",None),
 143:("H","WEB","POS","NR","NR","SELF",None),
 144:("E","APP","MIND","NR","WL","SELF",306),
 146:("H","APP","CBT","OLBI","H2H","SELF",297),   # registry-identified factorial RCT (NCT04719351)
}
LINKED = {80: 76, 136: 76, 91: 25}
MECH_OVERRIDE = {97: "professional training"}   # content-focused instructional coaching
