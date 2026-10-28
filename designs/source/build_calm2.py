src=open('build_calm.py').read(); exec(src[:src.index('for n,b in S.items():')])
S={}
CSS2=f"""
.field{{height:68px;border-radius:12px;background:{CD};border:1.5px solid {G};display:flex;align-items:center;padding:0 20px;font-size:26px;letter-spacing:.5px}}
.codes{{display:flex;gap:10px}}.codes div{{flex:1;height:64px;border-radius:10px;background:{CD};border:1.5px solid #D9CFBF;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:500}}
.codes .cur{{border:2px solid {T}}}.codes.err div{{border-color:#C98F73}}
.note{{background:#F6E6DC;border-radius:12px;padding:16px 18px;color:#7A3F25;font-size:17px;line-height:1.45}}
.tabs{{display:flex;gap:28px;font-size:18px;margin-top:8px}}.tabs span{{padding-bottom:6px;color:{MU}}}.tabs .on{{color:{INK};font-weight:500;border-bottom:2px solid {T}}}
.prom{{display:flex;gap:16px;align-items:flex-start}}.prom .ib{{width:48px;height:48px;border-radius:12px;background:{SG};flex:none;display:flex;align-items:center;justify-content:center}}
"""
def page2(b,bg=None,tab=False): return page(b,bg,tab).replace('</style>',CSS2+'</style>')
NAV=lambda r="": f'<div class="nav"><span>{BACK}</span><span>{r}</span></div>'
LOCK='<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
CLOCK='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
SHIELD='<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'
BELL='<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
FOOD='<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 4c0 2 2 2 2 4M14 4c0 2 2 2 2 4"/>'
HOUSE='<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>'
MOB='<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'
IDC='<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M14 11h4M14 14h3M6 16c1-1.5 5-1.5 6 0"/>'
PIN='<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
CAL='<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'
WIFI='<path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0"/><path d="M3 3l18 18"/>'
callnolink='<div class="link" data-n="noacct">Call without an account</div>'

# 40 sign in
S['40a-welcome']=st("9:00")+f'''<div class="sp"></div>
<div style="align-self:center" data-n="stones">{cairn(170,3,sparkle=True)}</div>
<h1 style="text-align:center;margin-top:26px;font-size:34px">Next Move</h1>
<p class="mu" style="text-align:center;margin-top:8px">Small steps for your first weeks home.<br>From the people at BFP.</p>
<div class="sp"></div>
<div class="cta" data-n="start"><span>Get started</span>{ARROW}</div>
<div class="ghost" style="margin-top:12px" data-n="have">I already have an account</div>
<div style="margin-top:6px">{callnolink}</div>'''
S['40b-phone']=st("9:01")+NAV()+prog(5,1)+f'''<div class="sp" style="max-height:50px"></div>
<div class="eye">Sign in</div><h1 style="margin-top:8px">What's your phone number?</h1>
<div class="field" style="margin-top:28px" data-n="field">(510) 555-0100</div>
<p class="mu" style="margin-top:14px" data-n="why">We text you a code. No password to remember.</p>
<div class="sp"></div>
<div class="cta" data-n="send"><span>Send code</span>{ARROW}</div>
<div style="margin-top:6px">{callnolink}</div>'''
def codes(d,err=False,cur=None): return f'<div class="codes{" err" if err else ""}" data-n="codes">'+''.join(f'<div class="{"cur" if i==cur else ""}">{x}</div>' for i,x in enumerate(d))+'</div>'
S['40c-code']=st("9:02")+NAV()+prog(5,2)+f'''<div class="sp" style="max-height:50px"></div>
<div class="eye">Sign in</div><h1 style="margin-top:8px">Enter the code</h1>
<p class="mu" style="margin-top:10px">We sent 6 numbers to (510) 555-0100.</p>
<div style="margin-top:28px">{codes(["4","1","8","","",""],cur=3)}</div>
<p class="mu" style="margin-top:14px">It fills in by itself if your phone allows.</p>
<div class="sp"></div>
<div class="ghost" data-n="resend">Send a new code</div>
<div class="link" style="margin-top:6px" data-n="wrong">Wrong number?</div>'''
S['40d-code-wrong']=st("9:03")+NAV()+prog(5,2)+f'''<div class="sp" style="max-height:50px"></div>
<div class="eye">Sign in</div><h1 style="margin-top:8px">Enter the code</h1>
<p class="mu" style="margin-top:10px">We sent 6 numbers to (510) 555-0100.</p>
<div style="margin-top:28px">{codes(["4","1","8","2","0","7"],err=True)}</div>
<div class="note" style="margin-top:16px" data-n="err">That code didn't match. It happens. Try it again, or get a new one.</div>
<div class="sp"></div>
<div class="cta" data-n="resend"><span>Send a new code</span>{ARROW}</div>
<div class="link" style="margin-top:6px">Wrong number?</div>'''
S['40e-name']=st("9:04")+NAV()+prog(5,3)+f'''<div class="sp" style="max-height:50px"></div>
<div class="eye">Welcome</div><h1 style="margin-top:8px">What should we call you?</h1>
<p class="mu" style="margin-top:10px">Just a first name. A nickname is fine.</p>
<div class="field" style="margin-top:28px;font-size:24px" data-n="field">Marcus</div>
<div class="sp"></div>
<div class="cta"><span>Continue</span>{ARROW}</div>
<div class="tiny">You can change this anytime.</div>'''
S['40f-privacy-promise']=st("9:05")+NAV()+prog(5,4)+f'''<div class="sp" style="max-height:40px"></div>
<div class="eye">Our promise</div><h1 style="margin-top:8px">Your story stays yours.</h1>
<div style="display:flex;flex-direction:column;gap:22px;margin-top:30px" data-n="prom">
<div class="prom"><div class="ib">{ic(LOCK,G,24)}</div><p style="padding-top:10px">We keep only what your forms need.</p></div>
<div class="prom"><div class="ib">{ic(CLOCK,G,24)}</div><p style="padding-top:10px">Call answers clear after 7 days.</p></div>
<div class="prom"><div class="ib">{ic(SHIELD,G,24)}</div><p style="padding-top:10px">We never ask for your Social Security number.</p></div></div>
<div class="sp"></div>
<div class="cta"><span>Sounds good</span>{ARROW}</div>
<div class="link" style="margin-top:6px">Read the full privacy notes</div>'''
S['40g-reminders']=st("9:06")+NAV()+prog(5,5)+f'''<div class="sp" style="max-height:40px"></div>
<div class="card" data-n="preview" style="padding:16px 18px;display:flex;gap:12px;align-items:flex-start">
<div style="width:36px;height:36px;border-radius:8px;background:{G};flex:none;display:flex;align-items:center;justify-content:center">{ic(BELL,"#fff",20)}</div>
<div><div style="font-weight:500">Good morning, Marcus</div><div class="mu">Ready for a 2 minute check in?</div></div></div>
<h1 style="margin-top:34px">A gentle nudge each morning?</h1>
<p class="mu" style="margin-top:10px">One a day. Nothing about your case shows on your lock screen.</p>
<div class="sp"></div>
<div class="cta" data-n="on"><span>Turn on reminders</span>{ARROW}</div>
<div class="link" style="margin-top:6px" data-n="notnow">Not now</div>'''
S['40h-home-first-day']=f'''<div style="display:flex;justify-content:space-between;align-items:center">{st("9:07")}<div class="av" style="width:40px;height:40px;font-size:18px">M</div></div>
<div style="margin-top:26px"><div class="eye">Day 1 home</div><h1 style="margin-top:6px">Welcome home, Marcus.</h1>
<p class="mu" style="margin-top:8px">Today, just one small thing.</p></div>
<div style="align-self:center;margin-top:30px">{cairn(90,1,top="#D2C7B5")}</div>
<p class="mu" style="text-align:center;margin-top:6px">Your first stone is waiting.</p>
{checkin_card.replace("margin-top:28px","margin-top:22px")}
<div class="row" style="margin-top:8px"><span>Apply for CalFresh</span><span class="mu" style="font-size:17px;display:flex;align-items:center;gap:8px">10 min{CHEV}</span></div>'''

# 41 resources
cats=[(FOOD,"Food","Free meals and groceries"),(HOUSE,"A place to stay","Shelters and housing help"),(MOB,"A phone","Free phones and plans"),(IDC,"Your ID","Get a California ID")]
S['41a-resources']=st("10:20")+f'''<div style="margin-top:30px"><div class="eye">Resources</div><h1 style="margin-top:6px">What do you need today?</h1>
<p class="mu" style="margin-top:8px">Near Oakland.</p></div>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:28px">'''+''.join(f'<div class="opt" style="min-height:80px"><div class="prom"><div class="ib">{ic(a,G,24)}</div></div><div style="flex:1"><div class="tt">{b}</div><div class="ss">{c}</div></div>{CHEV}</div>' for a,b,c in cats)+f'''</div>
<div class="sp"></div><div class="link">Not sure? Talk to a person</div>'''
S['41b-resource-food']=st("10:21")+NAV()+f'''<div class="sp" style="max-height:30px"></div>
<div class="eye">Food</div><h1 style="margin-top:6px">Eastside Community Kitchen</h1>
<p class="mu" style="margin-top:8px">Sample place for the demo.</p>
<div style="display:flex;flex-direction:column;gap:18px;margin-top:28px">
<div class="prom"><div class="ib">{ic(CLOCK,G,24)}</div><p style="padding-top:10px">Hot lunch every day, 11am to 1pm.</p></div>
<div class="prom"><div class="ib">{ic(PIN,G,24)}</div><p style="padding-top:10px">12 min walk. No ID needed.</p></div></div>
<div class="sp"></div>
<div class="cta t c">{ic(PIN,"#fff",22)}<span>Get directions</span></div>
<div class="ghost" style="margin-top:12px">{ic(PHONE,G,20)}<span style="margin-left:10px">Call them</span></div>'''

# 42 reading
S['42-reading-session']=st("7:30")+f'''<div class="nav"><span>Close</span><span class="eye">4 min left</span></div>
<div style="height:4px;border-radius:2px;background:#DCD3C3;margin-top:6px"><div style="width:35%;height:4px;border-radius:2px;background:{G}"></div></div>
<div class="sp" style="max-height:40px"></div>
<div class="eye">Evening read</div><h1 style="margin-top:8px">Stone by stone</h1>
<p style="margin-top:20px;font-size:19px;line-height:1.7">On the trail, people stack small stones to say someone passed this way. No one builds the whole pile at once. You add one, and you keep walking.</p>
<p style="margin-top:16px;font-size:19px;line-height:1.7">Today, one small stone is enough.</p>
<div class="sp"></div>
<div class="cta"><span>I'm done reading</span>{ARROW}</div>
<div class="tiny">Placeholder text for the reading idea.</div>'''

# 43 community
TABS=lambda on: '<div class="tabs" data-n="tabs">'+''.join(f'<span class="{"on" if x==on else ""}">{x}</span>' for x in ["Events","Announcements"])+'</div>'
def ev(day,title,where,btn):
    return f'''<div class="card" style="padding:20px;display:flex;flex-direction:column;gap:6px"><div class="eye" style="color:{MU};font-weight:400">{day}</div><h2>{title}</h2><p class="mu">{where}</p>{btn}</div>'''
S['43a-community-events']=st("11:00")+f'''<div style="margin-top:26px"><h1>Community</h1>{TABS("Events")}</div>
<div style="display:flex;flex-direction:column;gap:14px;margin-top:24px">
{ev("Saturday, 10am","Peer walk","Lake Merritt. Easy pace.",f'<div class="cta t" style="height:52px;margin-top:10px"><span>Save my spot</span>{ARROW}</div>')}
{ev("Tuesday, 6pm","Dinner and talk","BFP office. Food provided.",f'<div class="ghost" style="height:52px;margin-top:10px">Save my spot</div>')}</div>'''
def post(init,name,when,msg,thanks):
    return f'''<div style="padding:20px 0;border-bottom:1px solid #E6DED0"><div style="display:flex;gap:12px;align-items:center"><div class="av" style="width:44px;height:44px;font-size:19px">{init}</div><div><div style="font-weight:500">{name}</div><div class="mu">{when}</div></div></div><p style="margin-top:12px">{msg}</p><div class="mu" style="margin-top:8px">{thanks}</div></div>'''
S['43b-community-announcements']=st("11:01")+f'''<div style="margin-top:26px"><h1>Community</h1>{TABS("Announcements")}</div>
<div style="margin-top:10px">{post("R","Rosa, BFP staff","Today","The food pantry is open late this Friday, until 7pm.","Thanks from 12 people")}
{post("D","Devon, BFP staff","Yesterday","Free phone sign up is next Tuesday at the BFP office.","Thanks from 8 people")}</div>
<div class="sp"></div><div class="link" style="color:{TD}">Ask a question</div>'''
S['43c-event-saved']=st("11:02")+f'''<div class="nav"><span></span><span>Close</span></div>
<div class="sp"></div><div style="align-self:center">{cairn(130,3,sparkle=True)}</div>
<h1 style="text-align:center;margin-top:24px">You're in.<br>See you Saturday.</h1>
<p class="mu" style="text-align:center;margin-top:10px">Peer walk, 10am at Lake Merritt.<br>We'll send a reminder that morning.</p>
<div class="sp"></div>
<div class="cta c">{ic(CAL,"#fff",22)}<span>Add to my calendar</span></div>
<div class="link" style="margin-top:6px">Back to community</div>'''

# 44 helper handoff
S['44-helper-handoff']=st("12:40")+f'''<div class="nav"><span></span><span>Close</span></div>
<div class="sp"></div>
<div class="av" style="width:96px;height:96px;border-radius:48px;font-size:40px;align-self:center">J</div>
<h1 style="text-align:center;margin-top:22px">A BFP helper will call you.</h1>
<p class="mu" style="text-align:center;margin-top:10px">Jordan works Monday to Friday, 9am to 5pm. They'll call during those hours.</p>
<div class="card" style="margin-top:26px;padding:18px;text-align:center"><p>Your answers so far are saved. Jordan can see them.</p></div>
<div class="sp"></div>
<div class="cta c"><span>Okay</span></div>
<div class="link" style="margin-top:6px;color:{TD}">Call the line now instead</div>'''

# 45 offline
S['45-offline']=st("12:50")+f'''<div class="sp"></div>
<div style="width:84px;height:84px;border-radius:20px;background:{SG};display:flex;align-items:center;justify-content:center;align-self:center">{ic(WIFI,G,40)}</div>
<h1 style="text-align:center;margin-top:26px">No internet right now.</h1>
<p class="mu" style="text-align:center;margin-top:10px">Your answers are saved on this phone. We'll send them when you're back online.</p>
<div class="sp"></div>
<div class="cta c"><span>Try again</span></div>
<div class="ghost t" style="margin-top:12px;border-color:{T};color:{TD}">{ic(PHONE,TD,20)}<span style="margin-left:10px">Call the line instead</span></div>
<div class="tiny">A phone call works without internet.</div>'''

# 46 delete
S['46-delete-confirm']=st("2:10")+NAV()+f'''<div class="sp" style="max-height:50px"></div>
<h1>Delete your info?</h1>
<p style="margin-top:16px">Your name, answers and saved forms leave this app.</p>
<p class="mu" style="margin-top:12px">Forms already sent to the county stay with the county.</p>
<div class="sp"></div>
<div class="cta c">Keep my info</div>
<div class="ghost" style="margin-top:12px;color:{TD};border-color:{TD}">Yes, delete my info</div>
<div class="link" style="margin-top:6px">Just sign out instead</div>'''

for n,b in S.items(): open(n+'.html','w').write(page2(b))
print(list(S))
