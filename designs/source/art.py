import math, random
def _blobpath(cx,cy,rx,ry,seed,var=.07,n=10):
    r=random.Random(seed);pts=[]
    for i in range(n):
        a=2*math.pi*i/n; k=1+r.uniform(-var,var)
        pts.append((cx+rx*k*math.cos(a),cy+ry*k*math.sin(a)))
    d=f'M{(pts[0][0]+pts[-1][0])/2:.1f},{(pts[0][1]+pts[-1][1])/2:.1f}'
    for i in range(n):
        p=pts[i];q=pts[(i+1)%n]
        d+=f' Q{p[0]:.1f},{p[1]:.1f} {(p[0]+q[0])/2:.1f},{(p[1]+q[1])/2:.1f}'
    return d+'Z'
def stone(cx,cy,rx,ry,fill,seed,ink="#35493B"):
    return (f'<path d="{_blobpath(cx,cy,rx,ry,seed)}" fill="{fill}"/>'
            f'<path d="{_blobpath(cx+1,cy-1,rx*.98,ry*.96,seed+7,.09)}" fill="none" stroke="{ink}" stroke-width="1.4" stroke-opacity=".45" stroke-linecap="round"/>')
def cairn(w=120,stones=4,top="#B66947",sparkle=False,ground=True,seed=3):
    h=w*1.05;cx=w/2;out=[];y=h-10;rx=w*.42;ry=w*.11
    cols=["#A99B86","#BFB29E","#D2C7B5",top]
    if ground: out.append(f'<path d="M{w*.06:.0f},{h-6:.0f} Q{cx:.0f},{h-14:.0f} {w*.94:.0f},{h-6:.0f}" stroke="#8E826F" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>')
    for i in range(stones):
        out.append(stone(cx+(i%2*2-1)*w*.02,y-ry,rx,ry,cols[i] if i<stones-1 else top,seed+i))
        y-=ry*1.85; rx*=.78; ry*=.95
    if sparkle:
        r=random.Random(seed)
        for (sx,sy) in [(w*.1,h*.25),(w*.88,h*.18),(w*.95,h*.55),(w*.05,h*.6),(w*.5,h*.02)]:
            out.append(f'<path d="M{sx:.0f},{sy-6:.0f}V{sy+6:.0f}M{sx-6:.0f},{sy:.0f}H{sx+6:.0f}" stroke="#B66947" stroke-width="2" stroke-linecap="round"/>')
        for (lx,ly,a) in [(w*.2,h*.08,30),(w*.78,h*.4,-40)]:
            out.append(f'<ellipse cx="{lx:.0f}" cy="{ly:.0f}" rx="7" ry="3.5" fill="#7E9A84" transform="rotate({a} {lx:.0f} {ly:.0f})"/>')
    return f'<svg width="{w:.0f}" height="{h:.0f}" viewBox="-10 -10 {w+20:.0f} {h+20:.0f}" style="overflow:visible">{"".join(out)}</svg>'
def sprig(h=70,col="#5E7D63",flip=False,seed=1):
    r=random.Random(seed);w=h*.5
    out=[f'<path d="M{w/2},{h} C{w/2-4},{h*.6} {w/2+6},{h*.35} {w/2+2},4" stroke="{col}" stroke-width="2" fill="none" stroke-linecap="round"/>']
    for i,t in enumerate([.75,.55,.35,.15]):
        y=h*t; s=-1 if i%2 else 1; lx=w/2+s*9
        out.append(f'<ellipse cx="{lx}" cy="{y:.0f}" rx="{9-i}" ry="{4.5-i*.5}" fill="{col}" opacity=".85" transform="rotate({s*-35} {lx} {y:.0f})"/>')
    tf=' transform="scale(-1,1)" transform-origin="center"' if flip else ''
    return f'<svg width="{w:.0f}" height="{h}" viewBox="0 0 {w:.0f} {h}"{tf} style="overflow:visible">{"".join(out)}</svg>'
def sun(r=26,col="#E8B49A"):
    s=r*2+24;c=s/2;rays=''
    for i in range(10):
        a=2*math.pi*i/10;x1=c+(r+5)*math.cos(a);y1=c+(r+5)*math.sin(a);x2=c+(r+10)*math.cos(a);y2=c+(r+10)*math.sin(a)
        rays+=f'<path d="M{x1:.1f},{y1:.1f}L{x2:.1f},{y2:.1f}" stroke="{col}" stroke-width="2.4" stroke-linecap="round"/>'
    return f'<svg width="{s:.0f}" height="{s:.0f}" viewBox="0 0 {s:.0f} {s:.0f}"><path d="{_blobpath(c,c,r,r,5,.04)}" fill="{col}"/>{rays}</svg>'
def blob(w,h,col,seed=2,op=1):
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}"><path d="{_blobpath(w/2,h/2,w*.46,h*.44,seed,.12,9)}" fill="{col}" opacity="{op}"/></svg>'
def stones_row(n=3,w=90):
    cols=["#A99B86","#D2C7B5","#B66947"];out='';x=8
    for i in range(n): rx=[14,10,8][i%3]; out+=stone(x+rx,30-[6,4,3][i%3],rx,[7,5,4][i%3],cols[i%3],11+i); x+=rx*2+6
    return f'<svg width="{w}" height="34" viewBox="0 0 {w} 34">{out}</svg>'
