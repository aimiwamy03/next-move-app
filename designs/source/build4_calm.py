src2=open('build2.py').read()
exec(src2[:src2.index('# 10 Home')])
from art import *
CSS+="""
.lock{width:390px;height:844px;position:relative;overflow:hidden;background:linear-gradient(170deg,#2E4234 0%,#35493B 45%,#4A5F4E 100%);padding:26px 16px;display:flex;flex-direction:column;align-items:center}
.n{width:100%;background:rgba(254,251,245,.94);border-radius:14px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.n .t{font-size:17px;font-weight:500;color:#2B2A26;line-height:1.3}.n .b{font-size:17px;color:#3F3D38;line-height:1.35}
.n .h{display:flex;justify-content:space-between;font-size:17px;color:#5E5B53;font-weight:500;margin-bottom:2px}
.appic{width:40px;height:40px;border-radius:9px;background:#35493B;flex:none;display:flex;align-items:center;justify-content:center}
"""
def appic(): return f'<div class="appic">{cairn(26,3,top="#E8B49A",ground=False).replace("#A99B86","#E3E9DC").replace("#BFB29E","#CBD7C4").replace("#D2C7B5","#E3E9DC")}</div>'
def note(t,b,when="now"):
    return f'<div class="n">{appic()}<div style="flex:1"><div class="h"><span>Next Move</span><span>{when}</span></div><div class="t">{t}</div><div class="b">{b}</div></div></div>'
def stackbehind(): return '<div style="width:92%;height:12px;margin-top:-6px;background:rgba(254,251,245,.6);border-radius:0 0 12px 12px"></div><div style="width:84%;height:10px;margin-top:-4px;background:rgba(254,251,245,.35);border-radius:0 0 12px 12px"></div>'
LOCKI='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E3E9DC" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
def lock(time,date,notes,foot="Swipe up to open"):
    deco=f'<div style="position:absolute;right:-40px;bottom:70px;opacity:.5">{blob(220,180,"#5E7D63",8)}</div><div style="position:absolute;left:-50px;top:300px;opacity:.35">{blob(200,160,"#6E8B74",3)}</div><div style="position:absolute;right:30px;bottom:110px;opacity:.75">{cairn(80,4,top="#D99A78",ground=False)}</div><div style="position:absolute;left:26px;bottom:120px;opacity:.7">{sprig(90,"#9DB5A2")}</div>'
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="lock">{deco}
<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:100%">{LOCKI}
<div style="font-family:Lora,serif;font-size:88px;font-weight:500;color:#FEFBF5;line-height:1;margin-top:14px">{time}</div>
<div style="font-size:20px;color:#E3E9DC;margin-top:8px;font-weight:500">{date}</div>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;margin-top:34px">{notes}</div></div>
<div style="position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:17px;color:#E3E9DC;font-weight:500">{foot}</div></div></body></html>'''
P={}
P['30-lockscreen-1-morning']=lock("8:02","Sunday, October 25",
 note("Good morning, Marcus","Ready for a 2 minute check in?","now")+note("Your form is ready to sign","Tap to check your answers and sign.","7 min ago")+'<div style="width:100%;display:flex;flex-direction:column;align-items:center">'+note("Peer walk today at 10am","Tap for the place and time.","1 hr ago")+stackbehind()+'</div>')
P['30-lockscreen-2-sent']=lock("3:10","Monday, October 26",
 '<div style="width:100%;display:flex;flex-direction:column;align-items:center">'+note("We sent your application","Someone will reach out. Keep your phone on.","now")+stackbehind()+'</div><div style="font-size:17px;color:#E3E9DC;font-weight:500">2 more from Next Move</div>')
hid=lambda w: f'<div class="n">{appic()}<div style="flex:1"><div class="h"><span>Next Move</span><span>{w}</span></div><div class="b">New message. Unlock to see it.</div></div></div>'
P['30-lockscreen-3-private']=lock("8:02","Sunday, October 25",hid("now")+hid("7 min ago")+hid("1 hr ago")+'<div style="font-size:17px;color:#E3E9DC;text-align:center;margin-top:6px;line-height:1.4">Private mode: previews stay hidden<br>until the phone is unlocked.</div>')
P['31-push-banner']=f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body style="position:relative">
<img src="20-home-option-a.png" style="position:absolute;inset:0;width:390px;height:844px;filter:brightness(.8) blur(1px)">
<div style="position:absolute;left:12px;right:12px;top:14px;z-index:5">{note("Your CalFresh form is ready to sign","Tap to check your answers and sign with your finger.","now").replace('class="n"','class="n" style="background:#FEFBF5;box-shadow:0 14px 34px rgba(0,0,0,.3)"')}</div>
</body></html>'''
for k,v in P.items(): open(k+'.html','w').write(v)
