import json,sys
from pypdf import PdfReader
r=PdfReader(sys.argv[1])
print("encrypted",r.is_encrypted, r.decrypt("") if r.is_encrypted else "")
root=r.trailer["/Root"]; af=root.get("/AcroForm")
af=af.get_object() if af else None
print("XFA" , "/XFA" in af if af else None, "NeedAppearances", af.get("/NeedAppearances") if af else None)
out=[]
for pi,p in enumerate(r.pages):
  for a in (p.get("/Annots") or []):
    a=a.get_object()
    if a.get("/Subtype")!="/Widget": continue
    # build full name
    names=[];node=a;ft=None;tu=None;flags=None;opt=None
    while node is not None:
      if "/T" in node: names.append(str(node["/T"]))
      ft=ft or node.get("/FT"); tu=tu or node.get("/TU"); 
      if flags is None and "/Ff" in node: flags=node["/Ff"]
      if opt is None and "/Opt" in node: opt=[str(o if not isinstance(o,list) else o[0]) for o in node["/Opt"]]
      node=node.get("/Parent"); node=node.get_object() if node is not None else None
    name=".".join(reversed(names))
    on=None
    ap=a.get("/AP")
    if ap and "/N" in ap:
      try: on=[k for k in ap["/N"].get_object().keys() if k!="/Off"]
      except: pass
    rect=[round(float(x)) for x in a["/Rect"]]
    t={"/Tx":"text","/Btn":"button","/Ch":"choice","/Sig":"signature"}.get(ft,str(ft))
    if t=="button" and flags is not None and int(flags)&(1<<15): t="radio"
    elif t=="button" and flags is not None and int(flags)&(1<<16): t="pushbutton"
    elif t=="button": t="checkbox"
    out.append({"name":name,"type":t,"page":pi+1,"rect":rect,"tooltip":str(tu) if tu else "","on":on,"opt":opt,"maxlen":a.get("/MaxLen")})
json.dump(out,open(sys.argv[2],"w"),indent=1,default=str)
from collections import Counter
print(len(out), Counter(o["type"] for o in out), Counter(o["page"] for o in out))
print("unique names", len(set(o["name"] for o in out)))
