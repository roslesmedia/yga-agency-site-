"""Build YGA Signal, an original compact display alphabet for this project.
No external typeface is used. Run with fontTools.
"""
from pathlib import Path
from math import sin, cos, pi, hypot
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'fonts'
OUT.mkdir(parents=True,exist_ok=True)

def arc(cx,cy,rx,ry,start,end,n=24):
    return [(cx+rx*cos(start+(end-start)*i/n),cy+ry*sin(start+(end-start)*i/n)) for i in range(n+1)]

def stroke(pen,points,width=148):
    # Same-winding contours form a solid stroke, with bounded round joins.
    points=[p for i,p in enumerate(points) if i==0 or hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>0.001]
    if len(points)<2:return
    def polygon(vertices):
        pen.moveTo((round(vertices[0][0]*.72),round(vertices[0][1])))
        for point in vertices[1:]:pen.lineTo((round(point[0]*.72),round(point[1])))
        pen.closePath()
    for a,b in zip(points,points[1:]):
        dx,dy=b[0]-a[0],b[1]-a[1];length=hypot(dx,dy)
        nx,ny=-dy/length*width/2,dx/length*width/2
        if length<20 and len(points)==2:
            a=(a[0]-dx/length*width*.4,a[1]-dy/length*width*.4)
            b=(b[0]+dx/length*width*.4,b[1]+dy/length*width*.4)
        polygon([(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),(b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)])
    for x,y in points[1:-1]:
        polygon(arc(x,y,width/2,width/2,2*pi,0,12))

def rounded_loop(x0,y0,x1,y1,r):
    return arc(x1-r,y1-r,r,r,0,pi/2)+[(x0+r,y1)]+arc(x0+r,y1-r,r,r,pi/2,pi)+[(x0,y0+r)]+arc(x0+r,y0+r,r,r,pi,3*pi/2)+[(x1-r,y0)]+arc(x1-r,y0+r,r,r,3*pi/2,2*pi)+[(x1,y1-r)]

L,R,B,T,M=90,400,60,840,450
glyphs={
'A':[[(L,B),(245,T),(R,B)],[(137,300),(352,300)]],
'B':[[(L,B),(L,T)],[(L,T),(245,T)]+arc(245,648,155,192,pi/2,-pi/2)+[(L,456)],[(L,456),(245,456)]+arc(245,258,155,198,pi/2,-pi/2)+[(L,B)]],
'C':[arc(245,450,155,390,pi*.22,pi*1.78)],
'D':[[(L,B),(L,T),(210,T)]+arc(210,450,190,390,pi/2,-pi/2)+[(L,B)]],
'E':[[(R,T),(L,T),(L,B),(R,B)],[(L,M),(350,M)]],
'F':[[(R,T),(L,T),(L,B)],[(L,M),(350,M)]],
'G':[arc(245,450,155,390,pi*.22,pi*2)+[(255,450)]],
'H':[[(L,B),(L,T)],[(R,B),(R,T)],[(L,M),(R,M)]],
'I':[[(245,B),(245,T)],[(135,T),(355,T)],[(135,B),(355,B)]],
'J':[[(R,T),(R,225)]+arc(245,225,155,165,0,-pi),[(230,T),(R,T)]],
'K':[[(L,B),(L,T)],[(R,T),(L,390)],[(190,520),(R,B)]],
'L':[[(L,T),(L,B),(R,B)]],
'M':[[(L,B),(L,T),(245,390),(R,T),(R,B)]],
'N':[[(L,B),(L,T),(R,B),(R,T)]],
'O':[rounded_loop(L,B,R,T,150)],
'P':[[(L,B),(L,T),(245,T)]+arc(245,620,155,220,pi/2,-pi/2)+[(L,400)]],
'Q':[rounded_loop(L,B,R,T,150),[(270,225),(440,-20)]],
'R':[[(L,B),(L,T),(245,T)]+arc(245,620,155,220,pi/2,-pi/2)+[(L,400)],[(245,400),(R,B)]],
'S':[arc(245,660,155,210,pi*.16,pi*1.5)+arc(245,240,155,210,pi/2,-pi*.86)],
'T':[[(60,T),(430,T)],[(245,T),(245,B)]],
'U':[[(L,T),(L,215)]+arc(245,215,155,155,pi,2*pi)+[(R,T)]],
'V':[[(L,T),(245,B),(R,T)]],
'W':[[(L,T),(140,B),(245,500),(350,B),(R,T)]],
'X':[[(L,T),(R,B)],[(R,T),(L,B)]],
'Y':[[(L,T),(245,460),(R,T)],[(245,460),(245,B)]],
'Z':[[(L,T),(R,T),(L,B),(R,B)]],
'0':[rounded_loop(L,B,R,T,150)],
'1':[[(130,700),(245,T),(245,B)],[(140,B),(365,B)]],
'2':[arc(245,660,155,180,pi,.05)+[(R,500),(L,B),(R,B)]],
'3':[[(L,T),(R,T),(250,490)]+arc(245,265,155,205,pi/2,-pi*.85)],
'4':[[(355,B),(355,T),(L,300),(440,300)]],
'5':[[(R,T),(L,T),(L,480)]+arc(245,260,155,205,pi*.74,-pi*.85)],
'6':[arc(245,450,155,390,pi*.23,pi*1.8),rounded_loop(L,B,R,475,140)],
'7':[[(L,T),(R,T),(180,B)]],
'8':[rounded_loop(L,440,R,T,145),rounded_loop(L,B,R,440,145)],
'9':[rounded_loop(L,425,R,T,140),arc(245,450,155,390,0,-pi*.78)],
'.':[[(225,50),(225,65)]],
',':[[(245,100),(195,-80)]],
':':[[(245,630),(245,645)],[(245,150),(245,165)]],
'!':[[(245,840),(245,260)],[(245,60),(245,75)]],
'?':[arc(245,670,155,170,pi,0)+[(245,350),(245,260)],[(245,60),(245,75)]],
"'":[[(245,850),(215,675)]],
'-':[[(110,425),(380,425)]],
'/':[[(90,-20),(400,920)]],
'+':[[(L,M),(R,M)],[(245,260),(245,640)]],
'&':[arc(245,665,130,180,pi*1.6,pi*3.55)+[(410,B)],arc(245,220,155,160,pi*.15,pi*1.88),[(420,440),(330,145)]],
'%': [[(80,B),(410,T)],arc(140,720,65,120,0,pi*2),arc(350,180,65,120,0,pi*2)],
}
fb=FontBuilder(1000,isTTF=True)
order=['.notdef','space']+[f'g{ord(c):04x}' for c in glyphs]
fb.setupGlyphOrder(order)
cmap={ord(c):f'g{ord(c):04x}' for c in glyphs};cmap[32]='space';cmap[0x2019]=cmap[ord("'")];cmap[0x2018]=cmap[ord("'")];cmap[0x2013]=cmap[ord('-')];cmap[0x2014]=cmap[ord('-')]
for c in 'abcdefghijklmnopqrstuvwxyz':cmap[ord(c)]=cmap[ord(c.upper())]
fb.setupCharacterMap(cmap)
gs={};metrics={}
for name in ['.notdef','space']:
    pen=TTGlyphPen(None);gs[name]=pen.glyph();metrics[name]=(220,0)
for ch,paths in glyphs.items():
    pen=TTGlyphPen(None)
    for path in paths:stroke(pen,path)
    name=cmap[ord(ch)];gs[name]=pen.glyph();metrics[name]=(405,12)
fb.setupGlyf(gs);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=950,descent=-150)
fb.setupNameTable({'familyName':'YGA Signal','styleName':'Bold','uniqueFontIdentifier':'YGA Signal Bold 1.0','fullName':'YGA Signal Bold','psName':'YGASignal-Bold','version':'Version 1.0','copyright':'Original alphabet created for Young Growth Agency. CC0 1.0.'})
fb.setupOS2(sTypoAscender=950,sTypoDescender=-150,usWinAscent=950,usWinDescent=150,usWeightClass=800,sxHeight=880,sCapHeight=900)
fb.setupPost();fb.setupMaxp();fb.save(OUT/'yga-signal.ttf')
font=TTFont(OUT/'yga-signal.ttf');font.flavor='woff';font.save(OUT/'yga-signal.woff')
print('Built original YGA Signal display font.')
