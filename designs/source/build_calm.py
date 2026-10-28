from art import cairn, sprig, sun, stone
G="#35493B";SG="#E3E9DC";T="#B66947";TD="#8E4A2C";CR="#F4EFE6";CD="#FEFBF5";INK="#2B2A26";MU="#5E5B53"
CSS=f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-size:17px;width:390px;height:844px;background:{CR};font-family:'DM Sans',sans-serif;font-weight:400;color:{INK};overflow:hidden}}
.s{{width:390px;height:844px;padding:16px 28px 26px;display:flex;flex-direction:column;position:relative}}
.st{{font-size:17px;font-weight:500;color:{INK};height:22px}}
.nav{{display:flex;justify-content:space-between;align-items:center;min-height:44px;margin-top:10px;font-size:17px;color:{MU}}}
.prog{{display:flex;gap:6px;margin-top:6px}}.prog i{{flex:1;height:4px;border-radius:2px;background:#DCD3C3}}.prog i.d{{background:{G}}}.prog i.c{{background:{T}}}
.eye{{font-size:17px;font-weight:500;color:{TD}}}
h1{{font-family:'Lora',serif;font-weight:500;font-size:30px;line-height:1.25;color:#2E3A31}}
h2{{font-family:'Lora',serif;font-weight:500;font-size:22px;line-height:1.3;color:#2E3A31}}
p,.p{{font-size:17px;line-height:1.5}}.mu{{color:{MU}}}
.opt{{min-height:72px;border-radius:12px;background:{CD};border:1.5px solid #E6DED0;display:flex;align-items:center;gap:14px;padding:12px 18px}}
.opt.on{{background:{SG};border-color:{G}}}
.opt .tt{{font-size:20px;font-weight:500}}.opt .ss{{font-size:17px;color:{MU}}}
.box{{width:24px;height:24px;border-radius:6px;border:1.5px solid #B9B0A0;flex:none;display:flex;align-items:center;justify-content:center}}
.opt.on .box{{background:{G};border-color:{G}}}
.cta{{height:60px;border-radius:12px;background:{G};color:#fff;font-size:18px;font-weight:500;display:flex;align-items:center;justify-content:space-between;padding:0 22px;width:100%}}
.cta.t{{background:#A65B3B}}.cta.c{{justify-content:center;gap:10px}}
.ghost{{height:56px;border-radius:12px;border:1.5px solid {G};color:{G};font-size:18px;font-weight:500;display:flex;align-items:center;justify-content:center;width:100%}}
.tiny{{font-size:17px;color:#6B675E;text-align:center;margin-top:12px}}
.link{{font-size:17px;font-weight:500;color:{G};text-decoration:underline;text-underline-offset:4px;min-height:44px;display:flex;align-items:center;justify-content:center}}
.card{{background:{CD};border-radius:16px;border:1px solid #ECE4D6}}
.sp{{flex:1}}
.row{{display:flex;align-items:center;justify-content:space-between;min-height:64px;border-bottom:1px solid #E6DED0;font-size:18px}}
.av{{width:56px;height:56px;border-radius:28px;background:{SG};color:{G};font-family:Lora,serif;font-size:24px;font-weight:500;display:flex;align-items:center;justify-content:center}}
.ovr{{height:76px;border-radius:12px;background:#A65B3B;color:#fff;display:flex;align-items:center;gap:14px;width:100%;padding:0 20px}}
.ovr b{{font-size:20px;font-weight:500;display:block}}.ovr span{{font-size:17px;display:block}}
.tabbar{{position:absolute;left:0;right:0;bottom:0;height:80px;background:{CD};border-top:1px solid #E6DED0;display:flex;justify-content:space-around;padding-top:12px}}
.tabbar div{{font-size:17px;color:{MU};padding-bottom:4px;height:28px}}.tabbar .on{{color:{G};font-weight:500;border-bottom:2px solid {T}}}
"""
def ic(path,c=G,w=24,sw=1.8): return f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{path}</svg>'
ARROW=ic('<path d="M5 12h14m-6-6 6 6-6 6"/>',"#fff",22)
BACK=ic('<path d="M19 12H5m6-6-6 6 6 6"/>',INK,22)
CHK='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
PHONE='<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>'
WAVE='<path d="M3 10c2.5-3 4.5-3 7 0s4.5 3 7 0 2.5-2 4-2"/><path d="M3 15c2.5-3 4.5-3 7 0s4.5 3 7 0 2.5-2 4-2" opacity=".7"/>'
def page(body,bg=None,tab=False): 
    b=f'body{{background:{bg}}}' if bg else ''
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}{b}</style></head><body><div class="s" style="{"padding-bottom:100px" if tab else ""}">{body}</div></body></html>'
st=lambda t: f'<div class="st">{t}</div>'
def prog(n,cur,tot=5,done_all=False):
    return '<div class="prog" data-n="prog">'+''.join(f'<i class="{"d" if i<cur-1 or done_all else ("c" if i==cur-1 else "")}"></i>' for i in range(tot))+'</div>'
def opt(t,s="",on=False):
    return f'<div class="opt{" on" if on else ""}"><div class="box">{CHK if on else ""}</div><div><div class="tt">{t}</div>{f"<div class=ss>{s}</div>" if s else ""}</div></div>'
def tabbar(on): return '<div class="tabbar">'+''.join(f'<div class="{"on" if x==on else ""}">{x}</div>' for x in ["Home","Apply","Help","Me"])+'</div>'
OVR=f'<div class="ovr" data-n="ovr">{ic(WAVE,"#fff",30)}<div><b>I\'m overwhelmed</b><span>Pause and breathe. One tap.</span></div></div>'
S={}
CHEV=ic("<path d='m9 18 6-6-6-6'/>",MU,20)

# ---- 12a-e calm check-in
Q=[("How are you feeling right now?","There is no wrong answer.",[("Calm",""),("Okay",""),("Heavy",""),("On edge","")],1,"You can also swipe to skip."),
   ("How did you sleep?","Rest matters on hard weeks.",[("Well","I feel rested"),("Okay","Some sleep"),("Not much","It was a rough night")],2,"You can change this later."),
   ("How much energy do you have today?","Your day adjusts to you.",[("A little","Keep it small today"),("Some","One move is enough"),("A lot","Ready for more")],1,"Low days count too."),
   ("Is anything weighing on you?","Pick any. Or skip.",[("Housing",""),("Money",""),("Parole or probation",""),("Family","")],None,"Only you see this unless you share it."),
   ("Do you want to talk to a person today?","A BFP helper can call you.",[("Yes, call me","Today, when they can"),("Not today","That is okay too")],1,"You can ask anytime.")]
for i,(q,sub,opts,sel,tiny) in enumerate(Q):
    sels={sel} if sel is not None else {0,1}
    last=i==4
    S[f'12{"abcde"[i]}-checkin-q{i+1}']=st("9:43")+f'''
<div class="nav"><span data-n="back">{BACK}</span><span data-n="skip">Skip</span></div>{prog(5,i+1)}
<div class="sp" style="max-height:{70 if len(opts)<4 else 40}px"></div>
<div class="eye" data-n="eye">{i+1} of 5. Check in</div>
<h1 style="margin-top:10px" data-n="q">{q}</h1>
<p class="mu" style="margin-top:10px">{sub}</p>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:{36 if len(opts)<4 else 28}px" data-n="ans">{''.join(opt(t,s,k in sels) for k,(t,s) in enumerate(opts))}</div>
<div class="sp"></div>
<div class="cta" data-n="cta"><span>{"Finish check in" if last else "Continue"}</span>{ARROW}</div>
<div class="tiny" data-n="tiny">{tiny}</div>'''

# ---- 11 breathe calm
def rings(label,sub,size,dark):
    c1,c2,c3=("#3F5747","#4C6654","#7E9A84") if dark else ("#EAEFE4",SG,G)
    return f'''<div style="width:{size}px;height:{size}px;border-radius:50%;background:{c1};display:flex;align-items:center;justify-content:center;align-self:center"><div style="width:{int(size*.76)}px;height:{int(size*.76)}px;border-radius:50%;background:{c2};display:flex;align-items:center;justify-content:center"><div style="width:{int(size*.52)}px;height:{int(size*.52)}px;border-radius:50%;background:{c3};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px"><span style="font-family:Lora,serif;font-size:26px;font-weight:500;color:#fff">{label}</span><span style="font-size:17px;color:#fff">{sub}</span></div></div></div>'''
S['11-checkin-breathe']=st("9:42")+f'''<div class="nav"><span>{BACK}</span><span>Skip</span></div>
<div class="sp" style="max-height:40px"></div>
<h1 style="text-align:center">First, one breath.</h1>
<p class="mu" style="text-align:center;margin-top:8px">Hold the circle and breathe in.<br>Let go to breathe out.</p>
<div class="sp"></div>{rings("Hold","to breathe in",260,False)}<div class="sp"></div>
<div class="tiny">Breath 1 of 3. No rush.</div>'''

# ---- 13 done
S['13-checkin-done']=st("9:45")+f'''<div class="nav"><span></span><span>Close</span></div>{prog(5,5,done_all=True)}
<div class="sp"></div><div style="align-self:center" data-n="cairn">{cairn(150,4,sparkle=True)}</div>
<h1 style="text-align:center;margin-top:24px">A new stone for today.</h1>
<p class="mu" style="text-align:center;margin-top:8px">Thanks for checking in, Marcus.</p>
<div class="sp"></div>
<div class="cta t" data-n="next"><span>Next: sign your form</span>{ARROW}</div>
<div class="tiny">About 3 minutes.</div>'''

# ---- Home options
GREET='<div class="eye">Day 5 home</div><h1 style="margin-top:6px">Good morning, Marcus.</h1>'
def toprow(t="9:41"): return f'<div style="display:flex;justify-content:space-between;align-items:center">{st(t)}<div class="av" style="width:40px;height:40px;font-size:18px" data-n="me">M</div></div>'
checkin_card=f'''<div class="card" data-n="checkin" style="background:{SG};border:none;padding:22px;display:flex;flex-direction:column;gap:14px;margin-top:28px">
<h2>Check in</h2><p class="mu" style="margin-top:-8px">One breath, then 5 short questions.</p>
<div class="cta" style="height:56px"><span>Start</span>{ARROW}</div></div>'''
quiet=lambda rows: '<div style="margin-top:22px">'+''.join(f'<div class="row" data-n="r{i}"><span>{a}</span><span class="mu" style="font-size:17px;display:flex;align-items:center;gap:8px">{b}{CHEV}</span></div>' for i,(a,b) in enumerate(rows))+'</div>'
S['20-home-option-a']=toprow()+f'<div style="margin-top:26px">{GREET}</div>'+checkin_card+quiet([("Read for 6 minutes",""),("Applications","2 of 5 done"),("Resources","")])
S['20-home-option-b']=toprow()+f'''<div style="margin-top:26px">{GREET}</div>
<div class="sp"></div>
<div style="align-self:center">{sun(30,"#E8B49A")}</div>
<div class="eye" style="text-align:center;margin-top:18px">Your next thing</div>
<h1 style="text-align:center;margin-top:8px;font-size:34px">Sign your CalFresh form.</h1>
<p class="mu" style="text-align:center;margin-top:8px">About 3 minutes. Then we send it in.</p>
<div class="sp"></div>
<div class="cta t"><span>Start</span>{ARROW}</div>
<div class="link" style="margin-top:6px">See everything else</div>'''
mom=[("Morning","Check in","done"),("Midday","Sign your form","now"),("Evening","Read for 6 minutes","later")]
ml=''.join(f'''<div style="display:flex;align-items:center;gap:16px;padding:16px 0;{"border-bottom:1px solid #E6DED0;" if k<2 else ""}"><div style="width:14px;height:14px;border-radius:7px;flex:none;background:{G if s=="done" else (T if s=="now" else "#DCD3C3")}"></div><div style="flex:1"><div class="mu" style="font-size:17px">{a}</div><div style="font-size:20px;font-weight:500;{"text-decoration:line-through;color:#8B867B;" if s=="done" else ""}{f"border-bottom:2px solid {T};display:inline-block" if s=="now" else ""}">{b}</div></div></div>''' for k,(a,b,s) in enumerate(mom))
S['20-home-option-c']=toprow("12:05")+f'''<div style="margin-top:26px"><div class="eye">Day 5 home</div><h1 style="margin-top:6px">Midday, Marcus.</h1></div>
<div style="align-self:center;margin-top:26px">{cairn(110,1,top="#B66947")}</div>
<p class="mu" style="text-align:center;margin-top:8px">One stone so far today.</p>
<div style="margin-top:18px">{ml}</div><div class="sp"></div><div class="cta"><span>Start midday</span>{ARROW}</div>'''
S['20-home-option-d']=f'''<div style="display:flex;justify-content:space-between">{st("9:41")}</div><div style="margin-top:26px">{GREET}</div>
{checkin_card}
<div class="sp"></div><div style="align-self:center;margin-bottom:20px">{sprig(80,"#7E9A84")}</div>'''+tabbar("Home")

# ---- 14 applications call-first
S['14-applications-call']=st("12:10")+f'''<div style="margin-top:30px"><div class="eye">Applications</div><h1 style="margin-top:6px">Let's fill out your CalFresh form together.</h1></div>
<div class="card" data-n="call" style="margin-top:28px;background:{SG};border:none;padding:22px;display:flex;flex-direction:column;gap:14px">
<div style="display:flex;align-items:center;gap:12px">{ic(PHONE,G,26)}<h2>Call the Next Move line</h2></div>
<p class="mu" style="margin-top:-6px">About 10 minutes. A friendly voice asks one question at a time.</p>
<div class="cta t"><span>See what to expect</span>{ARROW}</div></div>
<div class="sp"></div>
<div class="row" data-n="cf" style="border-top:1px solid #E6DED0"><span>CalFresh</span><span class="mu" style="font-size:17px">2 of 5 done</span></div>
<div class="link" style="margin-top:6px">All applications</div>'''

# ---- 14b-f what to expect, one step per screen
DOC='<path d="M6 3h8l4 4v14H6z"/><path d="M9 13h6M9 17h4"/>';CLK='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
HAND='<path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L7 14"/>'
MSG='<path d="M4 5h16v11H9l-5 4z"/>';SEND='<path d="M3 11l18-8-8 18-2-8z"/>'
steps=[("Have these nearby","Your ID, release papers and any pay stubs. It's okay if you don't have them.",DOC),
("About 10 minutes","A friendly voice asks one question at a time. Take your time.",CLK),
("You're in charge",'Say "skip" or "say that again." Or press I\'m overwhelmed anytime.',HAND),
("Then you get a text","Open the link to check your form and sign with your finger.",MSG),
("We send it in","We fax it to your county. You get a text that someone will reach out.",SEND)]
for i,(t,b,icon) in enumerate(steps):
    last=i==4
    S[f'14{"bcdef"[i]}-expect-{i+1}']=st("12:11")+f'''<div class="nav"><span>{BACK}</span><span>Skip</span></div>{prog(5,i+1)}
<div class="sp"></div>
<div data-n="icon" style="width:84px;height:84px;border-radius:20px;background:{SG};display:flex;align-items:center;justify-content:center;align-self:center">{ic(icon,G,40)}</div>
<div class="eye" style="text-align:center;margin-top:28px">Step {i+1} of 5</div>
<h1 style="text-align:center;margin-top:8px" data-n="h">{t}</h1>
<p class="mu" style="text-align:center;margin-top:10px">{b}</p>
<div class="sp"></div>
{f'<div class="cta t c" data-n="cta">{ic(PHONE,"#fff",22)}<span>Call now</span></div><div class="tiny">(510) 555-0199. Free to call.</div>' if last else f'<div class="cta" data-n="cta"><span>Continue</span>{ARROW}</div><div class="tiny">What to expect on the call.</div>'}'''

# ---- 15 on call, 15b form
S['15-on-call-overwhelmed']=st("12:16")+f'''<div class="nav"><span class="eye" data-n="who">On the call</span><span data-n="timer" style="color:{INK};font-weight:500">4:12</span></div>
<div class="sp" style="max-height:60px"></div>
<div style="width:64px;height:64px;border-radius:32px;background:{SG};display:flex;align-items:center;justify-content:center">{ic(WAVE,G,32)}</div>
<p class="mu" style="margin-top:22px">It is asking</p>
<h1 style="margin-top:6px" data-n="ask">Who lives with you? Do you buy and cook food together?</h1>
<p class="mu" style="margin-top:12px">You can say "just me" or "skip."</p>
<div class="sp"></div>
{OVR}
<div class="link" style="margin-top:8px" data-n="end">End call</div>'''
S['15b-form-overwhelmed']=st("12:30")+f'''<div class="nav"><span>{BACK}</span><span class="mu">9 of 22</span></div>
<div class="sp" style="max-height:60px"></div>
<h1>How much money do you have right now?</h1>
<p class="mu" style="margin-top:10px">Cash plus any bank card. A guess is fine.</p>
<div style="margin-top:28px;height:64px;border-radius:12px;background:{CD};border:1.5px solid {G};display:flex;align-items:center;padding:0 18px;font-size:22px">$ 40</div>
<div class="sp"></div>
<div class="cta" style="margin-bottom:14px"><span>Next</span>{ARROW}</div>
{OVR}
<div class="tiny" style="margin-top:8px;min-height:44px;display:flex;align-items:center;justify-content:center">Your answers save as you go.</div>'''

# ---- 16 overwhelmed breathe
S['16-overwhelmed-breathe']=f'''<div class="st" style="color:#E3E9DC">12:17</div>
<div class="sp" style="max-height:60px"></div>
<h1 style="color:#fff;text-align:center">That's okay.<br>Let's breathe.</h1>
<div class="sp"></div>{rings("Breathe in","4 seconds",270,True)}<div class="sp"></div>
<p style="color:#E3E9DC;text-align:center;margin-bottom:22px">Your call is paused. Nothing is lost.</p>
<div class="cta c" style="background:{CD};color:{G}">I'm ready to go back</div>
<div class="link" style="color:#fff;margin-top:8px">Talk to a person</div>'''

# ---- 17 profile (no tables)
S['17-profile']=st("2:05")+f'''<div style="margin-top:34px;display:flex;flex-direction:column;align-items:center">
<div class="av" style="width:84px;height:84px;border-radius:42px;font-size:36px">M</div>
<h1 style="margin-top:16px">Hi, Marcus.</h1>
<p class="mu" style="margin-top:4px">Born Jan 9, 1988. Alameda County.</p></div>
<div style="margin-top:34px">'''+''.join(f'<div class="row"><span>{a}</span>{ic("<path d=\'m9 18 6-6-6-6\'/>",MU,20)}</div>' for a in ["Your name and phone","Your BFP helper","Privacy"])+f'''</div>
<div class="sp"></div>
<div class="cta t c" data-n="pdf">{ic(DOC,"#fff",22)}<span>See your form (PDF)</span></div>
<div class="tiny">Everything you told us is in your form.</div>'''
S['17b-profile-privacy']=st("2:06")+f'''<div class="nav"><span>{BACK}</span><span></span></div>
<div class="sp" style="max-height:50px"></div>
<h1>Your privacy</h1>
<p style="margin-top:16px">We never ask for your Social Security number on a call.</p>
<p style="margin-top:14px">Your answers clear after 7 days, or when a helper takes over.</p>
<div class="sp"></div>
<div class="ghost" style="color:{TD};border-color:{TD}">Delete my info</div>
<div class="tiny">This can't be undone.</div>'''

# ---- 03 sign, 04 pdf viewer, 05 filed
S['03-sign-your-form']=st("12:14")+f'''<div class="nav"><span>{BACK}</span><span class="mu">CalFresh</span></div>
<div class="sp" style="max-height:60px"></div>
<div class="eye">Step 2 of 5</div><h1 style="margin-top:8px">Sign your form.</h1>
<p class="mu" style="margin-top:10px">Check it, then sign with your finger. We fax it to your county.</p>
<div class="card" style="margin-top:30px;height:170px;display:flex;align-items:flex-end;padding:20px;position:relative"><svg style="position:absolute;left:30px;top:40px" width="250" height="80" viewBox="0 0 250 80" fill="none"><path d="M6 56c18-40 30-44 34-20s4 28 16 4 18-30 24-6 10 22 26 0 22-16 30 2 20 10 40-6 30-6 62 2" stroke="{G}" stroke-width="3" stroke-linecap="round"/></svg><div style="flex:1;border-top:1.5px solid #CFC5B3;padding-top:8px" class="mu">Sign here</div></div>
<div class="link" style="margin-top:10px">See your form (PDF) first</div>
<div class="sp"></div>
<div class="cta t"><span>Sign and send</span>{ARROW}</div>
<div class="tiny">Your signature locks your start date.</div>'''
lines=''.join(f'<div style="height:8px;border-radius:2px;background:#E6E1D8;width:{w}%;margin-top:10px"></div>' for w in [90,70,80,60,85,50,75,65])
S['04-pdf-viewer']=f'''<div style="display:flex;justify-content:space-between;align-items:center">{st("12:20")}</div>
<div class="nav"><span style="color:{G};font-weight:500">Done</span><span style="color:{INK};font-weight:500">CF 285.pdf</span><span style="color:{G};font-weight:500">Share</span></div>
<div style="flex:1;margin-top:12px;background:#E9E3D8;border-radius:12px;padding:18px;display:flex;justify-content:center">
<div style="background:#fff;width:300px;box-shadow:0 4px 14px rgba(0,0,0,.12);padding:20px 22px">
<div style="font-size:17px;font-weight:500">Application for CalFresh Benefits</div><div class="mu" style="font-size:17px">CF 285. Sample, not real data.</div>
<div style="margin-top:14px;border:1px solid #DDD;padding:10px"><div style="font-size:17px">Name: Marcus Anthony Reyes</div><div style="font-size:17px;margin-top:4px">County: Alameda</div></div>{lines}
<div style="margin-top:22px;border-top:1px solid #999;padding-top:6px;font-size:17px" class="mu">Signature</div></div></div>
<div class="tiny">Page 1 of 9</div>'''
S['05-filed-done']=st("3:05")+f'''<div class="nav"><span></span><span>Close</span></div>
<div class="sp"></div><div style="align-self:center">{cairn(150,4,sparkle=True)}</div>
<h1 style="text-align:center;margin-top:24px">Sent. Your date is locked.</h1>
<p class="mu" style="text-align:center;margin-top:8px">We faxed it to Alameda County.<br>Someone will reach out.</p>
<div class="sp"></div>
<div class="cta c" data-n="pdf">{ic(DOC,"#fff",22)}<span>See your form (PDF)</span></div>
<div class="link" style="margin-top:6px">Back to home</div>'''

for n,b in S.items():
    open(n+'.html','w').write(page(b,"#35493B" if n.startswith('16') else None,'tabbar' in b))
print(list(S))
