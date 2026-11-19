/* ============================================================================================================
   Find the Date! (Claude's part of Check the Date!): turn a package, find its date, then say the date.
   The look is the approved viz dev, find-the-date-vizdev/v3 (approved 11/19/2026): the package takes about 93% of the
   screen height, the words float over the scene UNDER the package, the buttons sit on top, rounded-square turn
   buttons in the bottom-right corner, the Look for chips stacked in a column.
   It reuses the Fun Friday engine by name (js/ff-engine.js through the game: sounds, tactile buttons, confetti, party,
   the game-show win, the narrator) and the game's look (css/ff-engine.css + css/game.css). Nothing is copied.
   It needs: js/ff-engine.js, js/winfx-astra.js, js/dotmatrix.js (DOTFONT) and js/game.js loaded first, and
   find/three.module.min.js (three.js 0.160.0, loaded with import() inside start()).
   It defines one name only: window.FindTheDate = {start(el, {level, round, today, rand, onExit}), stop()}.
   This is a public page: no student names or student data anywhere in it.
   ============================================================================================================ */
(function(){
'use strict';
const HERE=(document.currentScript&&document.currentScript.src)||location.href;
let THREE=null;

/* ---------- the engine, by name (never copies). Each call is guarded so a missing piece never breaks a round. ---------- */
const E={
  snd(n,...a){try{if(typeof SFX!=='undefined'&&SFX[n])SFX[n](...a)}catch(e){}},
  boom(x,y,n){try{if(typeof burst==='function')burst(x,y,n)}catch(e){}},
  fiesta(){try{if(typeof party==='function')party()}catch(e){}},
  showWin(el){try{if(typeof bigWin==='function')bigWin(el)}catch(e){}},
  stopWin(){try{const w=document.getElementById('winstage');if(w&&typeof WINFX!=='undefined')WINFX.stop(w)}catch(e){}},
  still(){try{if(typeof calm!=='undefined')return !!calm}catch(e){}return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)},
  loud(){try{if(typeof sound!=='undefined')return !!sound}catch(e){}return true},
  u(){try{if(typeof gunit==='function')return gunit()}catch(e){}return Math.min(innerHeight/100,innerWidth*.005625,(innerWidth-32)/175)},
  line(id,html,delay){try{if(typeof LINES!=='undefined'&&typeof speak==='function'){LINES[id]=String(html).replace(/<br>/g,' ').replace(/<[^>]+>/g,'');speak(id,delay||0)}}catch(e){}},
  quiet(){try{if(typeof hush==='function')hush()}catch(e){}},
  star(){try{if(typeof P==='function')return P('star','⭐')}catch(e){}return '⭐'},
  font(){if(typeof DOTFONT!=='undefined')return DOTFONT;throw new Error('Find the Date needs js/dotmatrix.js (DOTFONT)')}
};

/* ---------- small helpers ---------- */
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH=['January','February','March','April','May','June','July','August','September','October','November','December'];
const p2=n=>String(n).padStart(2,'0');
const MM=v=>v/100;                                   /* mm -> scene units (1 unit = 100 mm) */
const SLOPE=Math.hypot(95/2,40);                     /* the milk carton's gable panel, in mm */
const clampI=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+n)?Math.round(+n):a));
const V=(a,b,c)=>new THREE.Vector3(a,b,c);
const SVGNS='http://www.w3.org/2000/svg';

/* ---------- icons (the viz dev's) ---------- */
const SV=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FD6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const I={ccw:SV('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>'),cw:SV('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>'),
  up:SV('<path d="M12 19V5M6 11l6-6 6 6"/>'),down:SV('<path d="M12 5v14M6 13l6 6 6-6"/>'),zoom:SV('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>')};
const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="#12305C" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 20 20"/></svg>';
const HAND='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 26V10a3 3 0 0 1 6 0v12V8a3 3 0 0 1 6 0v14V10a3 3 0 0 1 6 0v14-8a3 3 0 0 1 6 0v14c0 9-6 14-13 14h-2c-5 0-8-2-11-6l-7-9a3 3 0 0 1 4.5-4z" fill="#fff" stroke="#12305C" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const SPK='<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FD6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';

/* ---------- drawing helpers: everything on a package is drawn in real millimetres. Claude's placeholder art in the
   colored-pencil style (the viz dev's); the final package art comes from Astra or Canva, through classroom-assets. ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function cv(wmm,hmm,ppmm){const c=document.createElement('canvas');c.width=Math.round(wmm*ppmm);c.height=Math.round(hmm*ppmm);c.k=ppmm;return c}
function paper(c,R,tint){const x=c.getContext('2d'),k=c.k;x.fillStyle=tint||'#FBF8F1';x.fillRect(0,0,c.width,c.height);
  const n=c.width*c.height/(k*k)/14;for(let i=0;i<n;i++){x.strokeStyle='rgba(120,110,100,'+(0.03+R()*0.04)+')';x.lineWidth=k*(.15+R()*.15);const px=R()*c.width,py=R()*c.height,l=k*(1.5+R()*3);x.beginPath();x.moveTo(px,py);x.lineTo(px+l*Math.cos(-1.05),py+l*Math.sin(-1.05));x.stroke()}return x}
function pencil(x,c,R,px,py,w,h,col,dens,shape){const k=c.k;x.save();x.beginPath();if(shape)shape(x);else x.rect(px,py,w,h);x.clip();
  x.globalAlpha=.5;x.fillStyle=col;x.fillRect(px,py,w,h);x.globalAlpha=1;
  const n=w*h/(k*k)/9*(dens||1);
  for(let i=0;i<n;i++){const a=-1.05+(R()-.5)*.25,l=k*(2.5+R()*4.5),sx=px+R()*w,sy=py+R()*h;x.strokeStyle=col;x.globalAlpha=.18+R()*.4;x.lineWidth=k*(.22+R()*.36);x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+l*Math.cos(a),sy+l*Math.sin(a));x.stroke()}
  x.restore()}
function edge(x,c,R,col){const k=c.k,w=c.width,h=c.height;x.save();x.strokeStyle=col||'rgba(70,64,80,.55)';x.lineWidth=k*.5;x.lineCap='round';
  for(let n=0;n<2;n++){const j=()=>(R()-.5)*k*.4;x.beginPath();x.moveTo(1+j(),1+j());x.lineTo(w-1+j(),1+j());x.lineTo(w-1+j(),h-1+j());x.lineTo(1+j(),h-1+j());x.closePath();x.stroke()}x.restore()}
/* text; returns the box it covers, in canvas pixels */
function txt(x,c,s,pxmm,pymm,sizemm,col,o){o=o||{};const k=c.k,S=sizemm*k;x.save();x.fillStyle=col;x.font=(o.w||800)+' '+S+'px '+(o.f||'"Baloo 2"');x.textAlign=o.a||'center';x.textBaseline=o.b||'middle';
  const w=x.measureText(s).width,cx=pxmm*k,cy=pymm*k;let px=cx,py=cy;if(o.rot){x.translate(px,py);x.rotate(o.rot);px=0;py=0}x.globalAlpha=o.al||1;x.fillText(s,px,py);x.restore();
  const a=o.a||'center',x0=a==='left'?0:a==='right'?-w:-w/2;
  return o.rot?[cx-.42*S,cy-w/2,cx+.42*S,cy+w/2]:[cx+x0,cy-.42*S,cx+x0+w,cy+.42*S]}
/* inkjet dot-matrix text (the game's DOTFONT, 5 x 7 dots); the letter height in mm; box(i,n) = the box of characters i..i+n-1 */
function dots(x,c,s,pxmm,pymm,hmm,col,o){o=o||{};const F=E.font(),k=c.k,pitch=hmm/7*k,r=pitch*.44;s=String(s).toUpperCase();const total=s.length*6-1;let px=pxmm*k,py=pymm*k;if(o.a==='center')px-=total*pitch/2;
  x.save();x.fillStyle=col||'#1E2433';let cx=0;
  for(const ch of s){const g=F[ch]||F[' '];for(let row=0;row<7;row++)for(let cc=0;cc<5;cc++)if(g[row*5+cc]==='1'){const j=((row*7+cc*13+cx*3)%5)/5;x.globalAlpha=.8+j*.2;x.beginPath();x.arc(px+(cx+cc)*pitch+pitch/2,py+row*pitch+pitch/2,r*(.92+j*.16),0,7);x.fill()}cx+=6}
  x.restore();return{x:px,y:py,pitch,box:(i,n)=>[px+i*6*pitch,py,px+((i+n)*6-1)*pitch,py+7*pitch]}}
function barcode(x,c,R,pxmm,pymm,wmm,hmm,digits){const k=c.k,px=pxmm*k,py=pymm*k,w=wmm*k,h=hmm*k;x.save();x.fillStyle='#fff';x.fillRect(px-k*2,py-k*2,w+k*4,h+k*7);let cx=px;
  while(cx<px+w){const bw=k*(.33+Math.floor(R()*3)*.33);if(R()>.45){x.fillStyle='#2a2a33';x.fillRect(cx,py,bw,h)}cx+=bw}
  x.restore();txt(x,c,digits,pxmm+wmm/2,pymm+hmm+2.6,2.4,'#2a2a33',{f:'Nunito',w:700});return[px-k*2,py-k*2,px+w+k*2,py+h+k*5]}
function sticker(x,c,R,cxmm,cymm,rmm,col,s){const k=c.k,cx=cxmm*k,cy=cymm*k,r=rmm*k;pencil(x,c,R,cx-r,cy-r,2*r,2*r,col,1.6,y=>{y.arc(cx,cy,r,0,7)});
  x.save();x.strokeStyle='rgba(120,60,10,.5)';x.lineWidth=k*.4;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.restore();txt(x,c,s,cxmm,cymm+.3,rmm*.62,'#4a2604');return[cx-r,cy-r,cx+r,cy+r]}
function nutrition(x,c,pxmm,pymm,wmm,lines){const k=c.k,row=4.2,hmm=9+lines.length*row;x.save();x.fillStyle='#fff';x.fillRect(pxmm*k,pymm*k,wmm*k,hmm*k);x.strokeStyle='#2a2a33';x.lineWidth=k*.4;x.strokeRect(pxmm*k,pymm*k,wmm*k,hmm*k);x.restore();
  txt(x,c,'Nutrition Facts',pxmm+1.5,pymm+3.6,4.2,'#2a2a33',{a:'left',f:'Nunito',w:900});x.fillStyle='#2a2a33';x.fillRect((pxmm+1.2)*k,(pymm+6.4)*k,(wmm-2.4)*k,k*.8);
  lines.forEach((l,i)=>{const y=pymm+9.4+i*row;txt(x,c,l[0],pxmm+1.5,y,2.7,'#2a2a33',{a:'left',f:'Nunito',w:800});txt(x,c,l[1],pxmm+wmm-1.5,y,2.7,'#2a2a33',{a:'right',f:'Nunito',w:800});x.fillRect((pxmm+1.2)*k,(y+1.9)*k,(wmm-2.4)*k,k*.2)});
  return[pxmm*k,pymm*k,(pxmm+wmm)*k,(pymm+hmm)*k]}
function tex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;return t}
function mat(c){return new THREE.MeshLambertMaterial({map:tex(c)})}
function quadGeo(p){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...p[0].toArray(),...p[1].toArray(),...p[2].toArray(),...p[3].toArray()],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return g}
function boxQuads(w,h,d){const X=w/2,Z=d/2,T=h;return{
  front:[V(-X,0,Z),V(X,0,Z),V(X,T,Z),V(-X,T,Z)],back:[V(X,0,-Z),V(-X,0,-Z),V(-X,T,-Z),V(X,T,-Z)],
  right:[V(X,0,Z),V(X,0,-Z),V(X,T,-Z),V(X,T,Z)],left:[V(-X,0,-Z),V(-X,0,Z),V(-X,T,Z),V(-X,T,-Z)],
  top:[V(-X,T,Z),V(X,T,Z),V(X,T,-Z),V(-X,T,-Z)],bottom:[V(-X,0,-Z),V(X,0,-Z),V(X,0,Z),V(-X,0,Z)]}}

/* ---------- a package: its 3D group, its faces (each one a canvas texture) and the places that can be tapped ----------
   faces[name] = {mesh, c, k, W, H, map(px,py) -> group-local point, frame(px,py) -> {r,u,n} group-local unit vectors, curved}
   regs   = things that are not the date (price, bar code, nutrition facts, weight, size, name), with their box in canvas px
   lines  = the printed lines of the date print (step 1: find it); chunks = the pieces of those lines (step 2: say it) */
function newPkg(noun){const P={group:new THREE.Group(),faces:{},regs:[],lines:[],chunks:[],noun,spot:'',letter:4,cy:0,el:.24,where:'package'};
  P.reg=(face,kind,box,coach)=>{const r={face,kind,box,coach};P.regs.push(r);return r};
  /* a piece of print that printOn does not draw (a store label, a pre-printed line); it also grows its step-1 line.
     o.tag replaces its name tag in Say it (for example "dairy's code") */
  P.chunk=(face,k,box,o)=>{o=o||{};const line=o.line||0,C={face,box,kind:k,k,line,t:o.t||'',coach:o.coach,cbox:o.cbox,tag:o.tag};P.chunks.push(C);
    let L=P.lines.find(l=>l.face===face&&l.line===line);if(!L){L={face,box:box.slice(),kinds:[],ok:false,line};P.lines.push(L)}
    else L.box=[Math.min(L.box[0],box[0]),Math.min(L.box[1],box[1]),Math.max(L.box[2],box[2]),Math.max(L.box[3],box[3])];
    L.kinds.push(k);L.ok=L.kinds.includes('date')||L.kinds.includes('words');if(o.lineCoach)L.coach=o.lineCoach;
    if(k==='date'){P.spot=face;P.letter=o.h||(box[3]-box[1])/1.15/(P.faces[face]?P.faces[face].k:1)}
    P.nlines=Math.max(P.nlines||0,line+1);return C};
  return P}
function quadMap(p,c){return(px,py)=>{const u=px/c.width,v=1-py/c.height;const a=p[0].clone().lerp(p[1],u),b=p[3].clone().lerp(p[2],u);return a.lerp(b,v)}}
function quadFrame(p){const r=p[1].clone().sub(p[0]).normalize(),u=p[3].clone().sub(p[0]).normalize(),n=r.clone().cross(u).normalize();return()=>({r,u,n})}
function addFace(P,name,mesh,c,o){mesh.userData.face=name;P.faces[name]={name,mesh,c,k:c.k,W:c.width,H:c.height,map:o.map,frame:o.frame,curved:!!o.curved};P.group.add(mesh);return P.faces[name]}
function addQuad(P,name,p,c){return addFace(P,name,new THREE.Mesh(quadGeo(p),mat(c)),c,{map:quadMap(p,c),frame:quadFrame(p)})}
/* the date print. stamp = a rubber-stamp line in Baloo 2 (Level 1); ink = inkjet dot-matrix lines (Levels 2 and 3) */
function printOn(P,x,c,face,sp){const k=c.k;P.spot=face;
  if(sp.type==='stamp'){const t=sp.lines[0].map(q=>q.t).join(' '),S=sp.size*k;x.save();x.font='800 '+S+'px "Baloo 2"';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#1E2433';x.globalAlpha=.9;
    const w=x.measureText(t).width;x.fillText(t,sp.cx*k,sp.cy*k);x.restore();
    const b=[sp.cx*k-w/2-.06*S,sp.cy*k-.535*S,sp.cx*k+w/2+.06*S,sp.cy*k+.42*S];
    P.lines.push({face,box:b,kinds:['date'],ok:true,line:0});P.chunks.push({face,box:b,kind:'date',k:'date',line:0,t});P.letter=.7*sp.size;P.nlines=1;return}
  sp.lines.forEach((ln,li)=>{const s=ln.map(q=>q.t).join(' '),d=dots(x,c,s,sp.x,sp.y0+li*sp.lead,sp.h,'#1E2433',{a:sp.align});let at=0;
    ln.forEach(q=>{const a0=at;P.chunks.push({face,box:d.box(at,q.t.length),kind:q.k,k:q.k,line:li,t:q.t,coach:q.coach,tag:q.tag,cbox:(i,n)=>d.box(a0+i,n)});at+=q.t.length+1});
    const kinds=ln.map(q=>q.k);P.lines.push({face,box:d.box(0,s.length),kinds,ok:kinds.includes('date')||kinds.includes('words'),line:li})});
  P.letter=sp.h;P.nlines=sp.lines.length}

/* ---------- the three packages, at real size (the viz dev's drawings, same random seeds, same drawing order) ---------- */
/* half-gallon gable-top milk carton: 95 x 95 mm, 195 mm body, 40 mm gable */
function milk(pr,price){const R=rng(11),W=95,D=95,H=195,G=40,P=newPkg('milk'),g=P.group,Q=boxQuads(MM(W),MM(H),MM(D));
  const band=(x,c)=>{pencil(x,c,R,0,c.height*.46,c.width,c.height*.24,'#6FA2DA',1.3);x.save();x.strokeStyle='rgba(30,70,130,.7)';x.lineWidth=c.k*.8;x.beginPath();for(let i=0;i<=40;i++){x.lineTo(c.width*(.22+i*.014),c.height*.62+Math.sin(i*.6)*c.k*1.4)}x.stroke();x.restore()};
  const face=(n,draw)=>{const c=cv(W,H,7),x=paper(c,R);band(x,c);draw(x,c);if(pr[n])printOn(P,x,c,n,pr[n]);edge(x,c,R);addQuad(P,n,Q[n],c)};
  face('front',(x,c)=>{P.reg('front','name',txt(x,c,'MILK',W/2,H*.56,24,'#ffffff'));P.reg('front','size',txt(x,c,'1/2 GALLON (1.89 L)',W/2,H*.8,6,'#2E5A92'));txt(x,c,'Vitamin D',W/2,H*.2,7.5,'#2E5A92',{f:'Nunito',w:900});if(price)P.reg('front','price',sticker(x,c,R,W*.76,H*.33,12.5,'#F5A623',price))});
  face('right',(x,c)=>{P.reg('right','nutrition',nutrition(x,c,10,12,W-20,[['Calories','130'],['Total Fat','5g'],['Sodium','120mg'],['Total Carb','12g'],['Protein','8g'],['Calcium','25%']]));txt(x,c,'KEEP REFRIGERATED',W/2,H*.86,4.2,'#2E5A92',{f:'Nunito',w:900})});
  face('back',(x,c)=>{P.reg('back','upc',barcode(x,c,R,W*.3,H*.12,34,18,'0 70038 31250 9'));P.reg('back','name',txt(x,c,'MILK',W/2,H*.58,18,'#ffffff'));txt(x,c,'Grade A  Pasteurized',W/2,H*.84,4.4,'#2E5A92',{f:'Nunito',w:900})});
  face('left',(x,c)=>{P.reg('left','name',txt(x,c,'MILK',W/2,H*.58,18,'#ffffff'));txt(x,c,'Please recycle',W/2,H*.86,4.2,'#2E5A92',{f:'Nunito',w:900})});
  const X=MM(W)/2,Z=MM(D)/2,Ht=MM(H),Gt=MM(G);
  const roof=(n,p)=>{const c=cv(W,SLOPE,14),x=paper(c,R);pencil(x,c,R,0,0,c.width,c.height,'#BFD7F0',.55);if(pr[n])printOn(P,x,c,n,pr[n]);edge(x,c,R);addQuad(P,n,p,c)};
  roof('roofF',[V(-X,Ht,Z),V(X,Ht,Z),V(X,Ht+Gt,0),V(-X,Ht+Gt,0)]);
  roof('roofB',[V(X,Ht,-Z),V(-X,Ht,-Z),V(-X,Ht+Gt,0),V(X,Ht+Gt,0)]);
  const tri=p=>{const c=cv(D,G,7),x=paper(c,R);pencil(x,c,R,0,0,c.width,c.height,'#BFD7F0',.55);const m=new THREE.Mesh(quadGeo(p),mat(c));m.userData.face='';g.add(m)};
  tri([V(X,Ht,Z),V(X,Ht,-Z),V(X,Ht+Gt,0),V(X,Ht+Gt,0)]);tri([V(-X,Ht,-Z),V(-X,Ht,Z),V(-X,Ht+Gt,0),V(-X,Ht+Gt,0)]);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(MM(W),MM(12),MM(3)),new THREE.MeshLambertMaterial({color:'#EEF3F9'}));fin.position.set(0,Ht+Gt+MM(6),0);fin.userData.face='';g.add(fin);
  /* the bottom, drawn after the viz dev's faces so their pencil strokes stay the same; fine only when the date is printed there */
  {const c=cv(W,D,pr.bottom?14:4),x=paper(c,R);pencil(x,c,R,0,0,c.width,c.height,'#BFD7F0',.4);if(pr.bottom)printOn(P,x,c,'bottom',pr.bottom);edge(x,c,R);addQuad(P,'bottom',Q.bottom,c)}
  P.cy=MM(H+G)/2;P.el=.3;P.noun='milk';P.where={roofB:'top',bottom:'bottom'}[P.spot]||'carton';return P}

/* condensed soup can: 66 mm across, 101 mm tall */
function can(pr,price){const R=rng(5),D=66,H=101,r=MM(D/2),P=newPkg('soup'),L=Math.PI*D;
  const c=cv(L,H,7),x=paper(c,R,'#FBF5EA');
  pencil(x,c,R,0,8*c.k,c.width,52*c.k,'#D9453B',1.4);pencil(x,c,R,0,60*c.k,c.width,6*c.k,'#E9B949',1.2);
  for(let i=0;i<2;i++){const cx=L*(.25+i*.5);P.reg('label','name',txt(x,c,'SOUP',cx,30,22,'#FFF7EA'));txt(x,c,'TOMATO',cx,49,7,'#FFF7EA')}
  P.reg('label','weight',txt(x,c,'NET WT 10.75 OZ (305g)',L*.25,80,3.4,'#7A2A22',{f:'Nunito',w:900}));txt(x,c,'CONDENSED',L*.75,80,4.2,'#7A2A22',{f:'Nunito',w:900});
  P.reg('label','nutrition',nutrition(x,c,L*.52,68,24,[['Calories','90'],['Sodium','480mg'],['Sugars','12g']]));
  P.reg('label','upc',barcode(x,c,R,L*.62,72,22,13,'0 51000 01251 7'));
  if(price)P.reg('label','price',sticker(x,c,R,L*.36,20,9,'#F5A623',price));
  x.strokeStyle='rgba(70,64,80,.5)';x.lineWidth=c.k*.5;x.strokeRect(0,2,c.width,c.height-4);
  if(pr.label)printOn(P,x,c,'label',pr.label);
  /* the label wraps the can: canvas x 0..W goes once around, starting at the back (theta = pi); the front (+Z) is at x = W/2 */
  const side=new THREE.Mesh(new THREE.CylinderGeometry(r,r,MM(H),128,1,true,Math.PI),mat(c));side.position.y=MM(H)/2;
  const th=px=>Math.PI+px/c.width*Math.PI*2;
  addFace(P,'label',side,c,{curved:true,map:(px,py)=>{const t=th(px);return V(r*Math.sin(t),MM(H)*(1-py/c.height),r*Math.cos(t))},
    frame:px=>{const t=th(px);return{r:V(Math.cos(t),0,-Math.sin(t)),u:V(0,1,0),n:V(Math.sin(t),0,Math.cos(t))}}});
  const disc=(name)=>{const cc=cv(D,D,pr[name]?31:8),y=cc.getContext('2d'),s=cc.width;
    const gr=y.createRadialGradient(s/2,s/2,s*.1,s/2,s/2,s/2);gr.addColorStop(0,'#D9DDE3');gr.addColorStop(.8,'#C3C8D0');gr.addColorStop(1,'#9EA4AE');y.fillStyle=gr;y.fillRect(0,0,s,s);
    y.strokeStyle='rgba(80,86,98,.55)';[.47,.43,.36].forEach(f=>{y.lineWidth=cc.k*.5;y.beginPath();y.arc(s/2,s/2,s*f,0,7);y.stroke()});
    if(pr[name])printOn(P,y,cc,name,pr[name]);return cc};
  const tc=disc('top'),top=new THREE.Mesh(new THREE.CircleGeometry(r,128),mat(tc));top.rotation.x=-Math.PI/2;top.position.y=MM(H);
  addFace(P,'top',top,tc,{ring:1,map:(px,py)=>V((px/tc.width-.5)*2*r,MM(H),-(.5-py/tc.height)*2*r),frame:()=>({r:V(1,0,0),u:V(0,0,-1),n:V(0,1,0)})});
  const bc=disc('bottom'),bot=new THREE.Mesh(new THREE.CircleGeometry(r,128),mat(bc));bot.rotation.x=Math.PI/2;
  addFace(P,'bottom',bot,bc,{ring:1,map:(px,py)=>V((px/bc.width-.5)*2*r,0,(.5-py/bc.height)*2*r),frame:()=>({r:V(1,0,0),u:V(0,0,1),n:V(0,-1,0)})});
  P.faces.top.ring=P.faces.bottom.ring=true;
  P.cy=MM(H)/2;P.el=.2;P.where={bottom:'bottom',top:'top',label:'label'}[P.spot]||'can';return P}

/* 12 oz cereal box: 193 x 284 x 66 mm */
function cereal(pr,price){const R=rng(21),W=193,H=284,D=66,P=newPkg('cereal'),Q=boxQuads(MM(W),MM(H),MM(D));
  const face=(n,fw,fh,draw,k)=>{const c=cv(fw,fh,k||6),x=paper(c,R,'#FFF8E6');draw(x,c);if(pr[n])printOn(P,x,c,n,pr[n]);edge(x,c,R);addQuad(P,n,Q[n],c)};
  face('front',W,H,(x,c)=>{const k=c.k;pencil(x,c,R,0,0,c.width,c.height,'#F2C14E',1.2);
    P.reg('front','name',txt(x,c,'OAT',W/2,40,46,'#9C3D12'));P.reg('front','name',txt(x,c,'RINGS',W/2,78,46,'#9C3D12'));
    const cx=W/2*k,cy=H*.6*k,bw=W*.36*k;pencil(x,c,R,cx-bw,cy-H*.02*k,2*bw,H*.24*k,'#5B8FD1',1.4,y=>{y.ellipse(cx,cy,bw,H*.2*k,0,0,Math.PI)});
    for(let i=0;i<26;i++){const a=R()*Math.PI*2,rr=R()*bw*.8;const px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr*.22-k*4;x.strokeStyle='#C57A2A';x.lineWidth=k*2.2;x.beginPath();x.arc(px,py,k*4,0,7);x.stroke()}
    P.reg('front','weight',txt(x,c,'NET WT 12 OZ (340g)',W/2,H*.93,5.5,'#6B3410',{f:'Nunito',w:900}));if(price)P.reg('front','price',sticker(x,c,R,W*.8,H*.42,14,'#F08A3E',price))});
  face('right',D,H,(x,c)=>{pencil(x,c,R,0,0,c.width,c.height,'#F2C14E',.8);P.reg('right','nutrition',nutrition(x,c,4,14,D-8,[['Calories','140'],['Total Fat','2.5g'],['Sodium','190mg'],['Total Carb','29g'],['Fiber','4g'],['Sugars','1g'],['Protein','5g'],['Iron','45%'],['Vitamin D','10%'],['Calcium','10%']]));
    txt(x,c,'Serving 1 cup (28g)',D/2,H*.62,3.4,'#6B3410',{f:'Nunito',w:900});txt(x,c,'Servings about 12',D/2,H*.66,3.4,'#6B3410',{f:'Nunito',w:900})});
  face('left',D,H,(x,c)=>{pencil(x,c,R,0,0,c.width,c.height,'#F2C14E',.8);P.reg('left','name',txt(x,c,'OAT RINGS',D/2,H/2,20,'#9C3D12',{rot:-Math.PI/2}))});
  face('back',W,H,(x,c)=>{const k=c.k;pencil(x,c,R,0,0,c.width,c.height,'#F7D98A',.8);txt(x,c,'MAZE!',W/2,30,26,'#9C3D12');x.strokeStyle='#9C3D12';x.lineWidth=k*1.6;for(let i=0;i<6;i++){x.strokeRect(k*W*(.2+i*.03),k*H*(.2+i*.03),k*W*(.6-i*.06),k*H*(.45-i*.06))}P.reg('back','upc',barcode(x,c,R,W*.34,H*.8,36,20,'0 16000 27547 3'))});
  face('bottom',W,D,(x,c)=>{pencil(x,c,R,0,0,c.width,c.height,'#F2C14E',.6)});
  face('top',W,D,(x,c)=>{const k=c.k;pencil(x,c,R,0,0,c.width,c.height,'#F2C14E',.7);x.strokeStyle='rgba(120,70,20,.55)';x.lineWidth=k*.5;x.beginPath();x.moveTo(0,c.height*.5);x.lineTo(c.width,c.height*.5);x.stroke()},pr.top?20:6);
  P.cy=MM(H)/2;P.el=.24;P.where={top:'top flap',left:'side',bottom:'bottom'}[P.spot]||'box';return P}
const BUILD={milk,can,cereal};

/* ---------- the rounds (teacher plan, find-the-date-vizdev/PLAN.md). The same groups as Check the Date; each level turns one dial:
   L1 spin only, a month word stamped on the package, one price sticker to look past;
   L2 spin and tip, inkjet BEST BY / USE BY / EXP on a bottom or a top, with a factory code under it;
   L3 drag it any way, inkjet lines that mix the date with a time, a line number and a factory code.
   Every round is a different package and a different place for the date (general-case teaching). Round 1 is the one an adult does with the student (the v3 pictures show no pill for it, so there is none).
   errs = the predicted mistakes that become the wrong Say it choices, most likely first. ---------- */
const LEVELS=[
  {name:'Level 1',cross:false,drag:false,rounds:[
    {pk:'milk',spot:'roofB',fmt:'stamp',price:'$3.48',errs:['month','price']},
    {pk:'cereal',spot:'left',fmt:'stamp',price:'$4.97',errs:['month','price']},
    {pk:'can',spot:'label',fmt:'stamp',price:'$1.29',errs:['month','price']}]},
  {name:'Level 2',cross:true,drag:false,rounds:[
    {pk:'can',spot:'bottom',kw:'BEST BY',fmt:'MON DD YYYY',price:'$1.29',errs:['year','codeday']},
    {pk:'cereal',spot:'top',kw:'USE BY',fmt:'MON DD YYYY',price:'$4.97',errs:['year','code']},
    {pk:'milk',spot:'bottom',kw:'EXP',fmt:'MON DD YYYY',price:'$3.48',errs:['year','code']}]},
  {name:'Level 3',cross:true,drag:true,rounds:[
    {pk:'cereal',spot:'top',kw:'BEST IF USED BY',fmt:'DDMONYYYY',price:'$4.97',errs:['code','time'],start:[.32,-.6]},
    {pk:'can',spot:'bottom',kw:'BEST BY',fmt:'MM/DD/YY',price:'$1.29',errs:['time','year'],start:[.17,.35]},
    {pk:'milk',spot:'roofB',kw:'EXP',fmt:'DDMONYY',price:'$3.48',errs:['code','time'],start:[0,.35]}]},
  /* Level 4, messy dates (find-the-date-hard-vizdev, approved 11/19 18:53): six rounds from find/level4.js, loaded only when picked */
  {name:'Level 4',cross:true,drag:true,l4:true,rounds:[]}
];
function dateText(fmt,d){const m=d.getMonth(),dd=d.getDate(),Y=d.getFullYear(),yy=p2(Y%100);
  return {stamp:MON[m]+' '+dd,'MON DD YYYY':MON[m]+' '+p2(dd)+' '+Y,DDMONYYYY:p2(dd)+MON[m]+Y,'MM/DD/YY':p2(m+1)+'/'+p2(dd)+'/'+yy,DDMONYY:p2(dd)+MON[m]+yy}[fmt]}
/* where and how the date is printed (mm on that face; inkjet y0 = top of the first line) */
function printSpec(L,rd,ds,code,tm){
  if(rd.fmt==='stamp'){const at={roofB:{cx:95/2,cy:SLOPE/2,size:8.6},left:{cx:33,cy:250,size:8.6},label:{cx:Math.PI*66*.09,cy:90,size:7.2}}[rd.spot];
    return Object.assign({type:'stamp',lines:[[{t:ds,k:'date'}]]},at)}
  const W={t:rd.kw,k:'words'},Dt={t:ds,k:'date'},hm=tm.replace(':','');
  switch(rd.pk+'/'+rd.spot+'/'+L){
    case 'can/bottom/1':return{type:'ink',h:3,x:33,y0:33-5.2,lead:6.8,align:'center',lines:[[W,Dt],[{t:'L2 '+hm+' B',k:'code'}]]};
    case 'cereal/top/1':return{type:'ink',h:4,x:14,y0:6,lead:9,align:'left',lines:[[W,Dt],[{t:'L2 '+code+' A',k:'code'}]]};
    case 'milk/bottom/1':return{type:'ink',h:3.5,x:95/2,y0:95/2-5.5,lead:7.9,align:'center',lines:[[W,Dt],[{t:'P4 '+code,k:'code'}]]};
    case 'cereal/top/2':return{type:'ink',h:4,x:14,y0:6,lead:9,align:'left',lines:[[W],[Dt],[{t:tm,k:'time'},{t:'L3',k:'line'},{t:code+'B',k:'code'}]]};
    case 'can/bottom/2':return{type:'ink',h:3,x:33,y0:33-5.2,lead:6.8,align:'center',lines:[[W,Dt],[{t:tm,k:'time'},{t:'L1',k:'line'},{t:code+'E',k:'code'}]]};
    case 'milk/roofB/2':return{type:'ink',h:3.5,x:95/2,y0:SLOPE/2-5.5,lead:7.9,align:'center',lines:[[W,Dt,{t:tm,k:'time'}],[{t:'P2',k:'line'},{t:code,k:'code'}]]};
  }
  throw new Error('no print for '+rd.pk+'/'+rd.spot)}
/* the three Say it choices: the date, then two wrong ones made from the mistakes students really make */
function sayChoices(L,rd,d,x,shuffle){const m=d.getMonth(),day=d.getDate(),Y=d.getFullYear();
  const say=(mm,dd)=>L===0?MONTH[mm]+' '+dd:MONTH[mm]+' '+dd+', '+Y,right=say(m,day),c=[];
  const add=(t,coach)=>{if(c.length<2&&t!==right&&!c.some(q=>q.t===t))c.push({t,coach})};
  for(const e of[...rd.errs,'month','year','time','code','next']){
    if(e==='month')add(say((m+11)%12,day),'<b>'+MON[m]+'</b> is short for <b>'+MONTH[m]+'</b>.');
    if(e==='next')add(say((m+1)%12,day),'<b>'+MON[m]+'</b> is short for <b>'+MONTH[m]+'</b>.');
    if(e==='price'&&rd.price){const dg=+rd.price.replace(/\D/g,'')[0];if(dg>0)add(say(m,dg),'<b>'+dg+'</b> is from the price, <b>'+rd.price+'</b>.')}
    if(e==='year'&&L>0){const two=rd.fmt==='MM/DD/YY'||rd.fmt==='DDMONYY',yd=two?Y%100:(day===20?26:20);
      if(yd!==day&&yd>=1&&yd<=31)add(say(m,yd),two?'<b>'+p2(yd)+'</b> is the year, <b>'+Y+'</b>.':'<b>'+yd+'</b> is part of the year, <b>'+Y+'</b>.')}
    if(e==='code'&&L>0)add(say(x.cm-1,x.cd),'<b>'+x.code+'</b> is the factory code.');
    if(e==='codeday'&&L>0)add(say(m,x.hh),'<b>'+x.hh+'</b> is part of the factory code.');
    if(e==='time'&&L>0)add(say(m,x.hh),'<b>'+x.tm+'</b> is the time it was made.');
  }
  if(c.length<2)return null;
  return shuffle([{t:right,ok:true,coach:''},...c])}
function makeRounds(L,today,rnd){if(LEVELS[L].l4)return rounds4(today,rnd);const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
  const shuffle=a=>{a=a.slice();for(let k=a.length-1;k>0;k--){const j=Math.floor(rnd()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
  return LEVELS[L].rounds.map((rd,idx)=>{
    for(let n=0;n<80;n++){
      const off=L===0?ri(3,24):ri(5,45),d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+off);
      if(d.getTime()===today.getTime())continue;                          /* never the same day as today */
      const day=d.getDate();
      /* round 1 keeps the approved viz dev's codes (14:32, 0522) when they fit this date */
      let hh=idx===0&&n===0?14:ri(6,22),mi=idx===0&&n===0?32:ri(0,59),cm=idx===0&&n===0?5:ri(1,12),cd=idx===0&&n===0?22:ri(1,28);
      if(hh===day)continue;
      if(cm-1===d.getMonth()||cm-1===today.getMonth())continue;          /* a factory code never reads as this date or as today */
      const tm=p2(hh)+':'+p2(mi),code=p2(cm)+p2(cd),ds=dateText(rd.fmt,d);
      const choices=sayChoices(L,rd,d,{hh,tm,cm,cd,code},shuffle);if(!choices)continue;
      const pr={};pr[rd.spot]=printSpec(L,rd,ds,code,tm);
      return {L,idx,rd,date:d,ds,pr,choices,price:rd.price,
        clue:L===0?'<b>'+MON[d.getMonth()]+'</b>':'<b>'+rd.kw+'</b>',
        spoken:choices.find(q=>q.ok).t,build:()=>BUILD[rd.pk](pr,rd.price)};
    }
    throw new Error('could not make round '+(idx+1));
  })}
/* ---------- Level 4 comes from find/level4.js (the messy-dates thread), drawn with this kit (README: Level 4 contract) ---------- */
let L4MOD=null;
const KIT=()=>({rng,cv,paper,pencil,edge,txt,dots,barcode,sticker,nutrition,mat,tex,quadGeo,quadMap,quadFrame,boxQuads,MM,V,THREE,newPkg,addQuad,addFace,printOn});
/* level4.js and its look, level4.css (every rule under #find .fd-l4), load the first time someone picks Level 4 */
function loadCSS4(){return new Promise(ok=>{if(document.querySelector('link[data-fd-l4]'))return ok();const l=document.createElement('link');l.rel='stylesheet';
  l.href=new URL('level4.css',HERE).href;l.setAttribute('data-fd-l4','');l.onload=()=>ok();l.onerror=()=>{console.error('Find the Date: level4.css could not load.');ok()};document.head.appendChild(l)})}
async function loadL4(){if(!L4MOD){const r=await Promise.all([import(new URL('level4.js',HERE).href),loadCSS4()]);L4MOD=r[0]}return L4MOD}
function rounds4(today,rnd){const kit=KIT(),rs=L4MOD.rounds(kit,{today,rand:rnd});
  return rs.map((r,idx)=>{const right=r.choices.find(c=>c.ok);if(!right)throw new Error('Level 4 round '+(idx+1)+' has no right answer');
    return{L:3,idx,rd:{start:r.start||null,kw:r.kw||null},date:null,ds:r.dateText,choices:r.choices.map(c=>({t:c.t,ok:!!c.ok,coach:c.coach||'',src:c.ok?'':(c.src||'date')})),
      clue:r.clue||'the <b>date</b>',spoken:right.t,parts:r.parts||null,month:r.month||'',prompt:r.prompt||'Find the date<br><b>to check.</b>',
      close:r.close&&Array.isArray(r.close.pts)&&r.close.pts.length?r.close:null,build:()=>r.build(kit)}})}
const WHAT={price:'the <b>price</b>',upc:'the <b>bar code</b>',nutrition:'the <b>nutrition facts</b>',weight:'the <b>weight</b>',size:'<b>how much is inside</b>',
  name:'the <b>name</b> of the food',code:'the <b>factory code</b>',time:'the <b>time</b> it was made',timecode:'the <b>time</b> and the <b>factory code</b>',line:'the <b>line number</b>'};
const TAG={words:'clue words',date:'the date',time:'time',line:'line',code:'factory code'};
/* where the date is: Levels 1 to 3 name the part ('back'), Level 4 says it whole ('on the back') */
const onWhere=w=>/^(on|in|under|at|near|inside)\s/i.test(w)?w:'on the '+w;
const whereHTML=w=>{const s=onWhere(w),m=/^(\S+\s+the\s+)(.+)$/i.exec(s);return m?m[1]+'<b>'+m[2]+'</b>':'<b>'+s+'</b>'};
const lineKind=l=>{const k=l.kinds;return k.includes('time')&&k.includes('code')?'timecode':k.includes('code')?'code':k.includes('time')?'time':'other'};

/* ---------- geometry on the screen ---------- */
function convexHull(P){const p=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[],up=[];for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}
  for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}
  up.pop();lo.pop();return lo.concat(up)}
function polyArea(P){let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1]}return a/2}
/* the part of a polygon inside a rectangle [x0,y0,x1,y1], as an area (Sutherland-Hodgman) */
function clipArea(P,r){const cut=(P,ins,at)=>{const o=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ia=ins(a),ib=ins(b);if(ia)o.push(a);if(ia!==ib)o.push(at(a,b))}return o};
  const X=(v)=>(a,b)=>{const t=(v-a[0])/(b[0]-a[0]);return[v,a[1]+t*(b[1]-a[1])]},Y=(v)=>(a,b)=>{const t=(v-a[1])/(b[1]-a[1]);return[a[0]+t*(b[0]-a[0]),v]};
  P=cut(P,p=>p[0]>=r[0],X(r[0]));if(!P.length)return 0;P=cut(P,p=>p[0]<=r[2],X(r[2]));if(!P.length)return 0;
  P=cut(P,p=>p[1]>=r[1],Y(r[1]));if(!P.length)return 0;P=cut(P,p=>p[1]<=r[3],Y(r[3]));return P.length?Math.abs(polyArea(P)):0}
/* grow a polygon outward by d pixels (mitred corners), whichever way round it is */
function grow(P,d){const n=P.length;if(n<3)return P;const sg=polyArea(P)>0?1:-1,N=[];
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;N.push([sg*dy/l,-sg*dx/l])}
  return P.map((p,i)=>{const a=N[(i+n-1)%n],b=N[i],k=d/Math.max(.35,1+a[0]*b[0]+a[1]*b[1]);return[p[0]+(a[0]+b[0])*k,p[1]+(a[1]+b[1])*k]})}
const DXS=[0,.02,-.02,.04,-.04,.06,-.06,.08,-.08,.1,-.1,.12,-.12,.14,-.14];
/* close look: slides to the right and down (NDC), nearest first */
const SAYD=(()=>{const o=[];for(let i=0;i<=18;i++)for(let j=0;j<=20;j++)o.push([i*.025,-j*.025]);return o.sort((a,b)=>Math.hypot(...a)-Math.hypot(...b))})();
const STY={go:['rgba(31,163,91,.10)','#1FA35B',.55],amber:['rgba(240,144,30,.12)','#F0901E',.5],dash:['none','#9DB0C9',.28],glow:['rgba(255,198,46,.16)','#FFC62E',.7],part:['none','none',0],veil:['rgba(255,255,255,.78)','none',0]};

/* ================================================ the activity ================================================ */
function Activity(el,o){
  const today=(o.today instanceof Date&&!isNaN(o.today))?new Date(o.today.getFullYear(),o.today.getMonth(),o.today.getDate()):(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())})();
  const rnd=typeof o.rand==='function'?o.rand:Math.random;
  const onExit=typeof o.onExit==='function'?o.onExit:()=>{};
  let alive=true,level=clampI(o.level,0,LEVELS.length-1),round=clampI(o.round,0,LEVELS[clampI(o.level,0,LEVELS.length-1)].l4?5:2),ROUNDS=[],RD=null,P=null,won=new Set(),timers=[],raf=0,tw=null,bigWinOn=false,lastU=0;
  const S={step:'find',q:new THREE.Quaternion(),qSay:null,zoom:false,easy:false,misses:0,found:null,dateTapped:false,dragged:false,ans:null};
  const later=(ms,f)=>{const t=setTimeout(()=>{timers=timers.filter(x=>x!==t);if(alive)f()},ms);timers.push(t);return t};
  const clearTimers=()=>{timers.forEach(clearTimeout);timers=[]};

  /* ---------- the page: words (layer 1) < package (2) < outlines (3) < buttons (4) < level done (5) ---------- */
  el.innerHTML='<div class="fd-root">'+
    '<div class="fd-stripL"><span class="name">Find the Date!</span><span class="lvl"></span><span class="fd-steps"></span></div>'+
    '<div class="fd-hudL"><h1 class="fd-prompt"></h1><div class="fd-look"></div><div class="fd-inset" hidden><canvas></canvas><svg aria-hidden="true"></svg><span class="fd-cap2"></span></div></div>'+
    '<div class="fd-hudR" aria-live="polite"></div>'+
    '<div class="fd-stage" role="img"></div><svg class="fd-ov" aria-hidden="true"></svg>'+
    '<div class="fd-tools"><button class="tool fd-easy" aria-pressed="false">Easier</button><button class="tool fd-skip">Skip</button><button class="tool snd" aria-pressed="'+E.loud()+'">Sound</button></div>'+
    '<button class="nav fd-back">Back</button><div class="fd-ctl"></div>'+
    '<div class="fd-answers wait" hidden><p class="fd-qq">What does the date say?</p><div class="fd-ans"></div></div>'+
    '<button class="nav next fd-next" hidden>Next</button>'+
    '<div class="fd-hand gone" aria-hidden="true">'+HAND+'</div>'+
    '<div class="lvdone fd-done" hidden><h1></h1><div class="stars"></div><p class="rule">Now find the date on a <b>real package</b>.</p>'+
    '<div class="btns"><button class="nav fd-levels">Pick a level</button><button class="nav fd-again">Play again</button><button class="nav next fd-nextlv">Level 2</button></div></div></div>';
  const q=s=>el.querySelector(s);
  const root=q('.fd-root'),stripL=q('.fd-stripL'),lvlEl=q('.lvl'),stepsEl=q('.fd-steps'),hudL=q('.fd-hudL'),prompt=q('.fd-prompt'),look=q('.fd-look'),
    inset=q('.fd-inset'),hudR=q('.fd-hudR'),stage=q('.fd-stage'),ov=q('.fd-ov'),tools=q('.fd-tools'),easyB=q('.fd-easy'),skipB=q('.fd-skip'),sndB=q('.snd'),
    backB=q('.fd-back'),ctl=q('.fd-ctl'),answers=q('.fd-answers'),qqEl=q('.fd-qq'),ansRow=q('.fd-ans'),nextB=q('.fd-next'),hand=q('.fd-hand'),doneV=q('.fd-done');

  /* ---------- the 3D scene (the viz dev's camera, lights and floor shadow) ---------- */
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,Math.max(window.devicePixelRatio||1,1.5)));renderer.setSize(innerWidth,innerHeight,false);renderer.setClearColor(0x000000,0);
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(24,innerWidth/innerHeight,.01,100);
  scene.add(new THREE.AmbientLight(0xffffff,1.55));const sun=new THREE.DirectionalLight(0xffffff,1.25);sun.position.set(-2.5,4,4);scene.add(sun);
  const pivot=new THREE.Group();scene.add(pivot);
  const shC=document.createElement('canvas');shC.width=shC.height=256;{const sx=shC.getContext('2d'),gr=sx.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,'rgba(18,48,92,.26)');gr.addColorStop(1,'rgba(18,48,92,0)');sx.fillStyle=gr;sx.fillRect(0,0,256,256)}
  const shTex=new THREE.CanvasTexture(shC),shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,.62),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const view={tgt:new THREE.Vector3(),d:6,el:.24},tmp=new THREE.Vector3(),bb=new THREE.Box3(),bsz=new THREE.Vector3();
  const dirOf=e=>V(0,Math.sin(e),Math.cos(e));
  function placeAt(t,d,e){cam.position.copy(t).addScaledVector(dirOf(e),d);cam.lookAt(t);cam.updateMatrixWorld()}
  const place=()=>placeAt(view.tgt,view.d,view.el);
  const W=()=>innerWidth,H=()=>innerHeight;
  const scr=p=>{tmp.copy(p).project(cam);return[(tmp.x+1)/2*W(),(1-tmp.y)/2*H()]};
  /* frame world points: half-size tw x th and centre (tcx, tcy), in NDC (-1..1). The viz dev's fit. */
  function fitCam(pts,e,tw0,th0,tcx,tcy){const tgt=new THREE.Vector3();pts.forEach(p=>tgt.add(p));tgt.divideScalar(pts.length);let d=6;const rt=new THREE.Vector3(),up=new THREE.Vector3();
    for(let it=0;it<16;it++){placeAt(tgt,d,e);let x0=9,x1=-9,y0=9,y1=-9;
      for(const p of pts){tmp.copy(p).project(cam);x0=Math.min(x0,tmp.x);x1=Math.max(x1,tmp.x);y0=Math.min(y0,tmp.y);y1=Math.max(y1,tmp.y)}
      const k=Math.max((x1-x0)/2/tw0,(y1-y0)/2/th0),hh=Math.tan(cam.fov*Math.PI/360)*d,hw=hh*cam.aspect;
      rt.set(1,0,0).applyQuaternion(cam.quaternion);up.set(0,1,0).applyQuaternion(cam.quaternion);
      tgt.addScaledVector(rt,((x0+x1)/2-tcx)*hw).addScaledVector(up,((y0+y1)/2-tcy)*hh);d*=k}
    placeAt(tgt,d,e);return{tgt,d,el:e}}
  const hullW=()=>{const m=P.group.matrixWorld;return P.hull.map(p=>p.clone().applyMatrix4(m))};
  const rectOf=(e,p)=>{const r=e.getBoundingClientRect();return[r.left-p,r.top-p,r.right+p,r.bottom+p]};
  /* everything the package keeps clear of: the floating words, the message's place and the buttons */
  function hudRects(){const U=E.u(),p=U*1.4,out=[];
    [stripL,tools,prompt,look,backB,ctl].forEach(e=>{if(e.hidden)return;const r=e.getBoundingClientRect();if(r.width&&r.height){const q=[r.left-p,r.top-p,r.right+p,r.bottom+p];q.nm=e.className.split(' ').pop();out.push(q)}});
    const hr=hudR.getBoundingClientRect(),q=[hr.right-U*36-p,hr.top-p,hr.right+p,hr.top+U*12+p];q.nm='bubble';out.push(q);return out}
  /* the package as big as the screen allows (about 93% of its height); then shrink or slide it only as much as it takes to stay clear */
  function fitAvoid(pts,e){const fillH=.93,base=fitCam(pts,e,.98,fillH,0,0),w=W(),h=H();
    const hr=hudRects(),rects=hr.map(r=>[r[0]/w*2-1,1-r[3]/h*2,r[2]/w*2-1,1-r[1]/h*2]);
    const hull=convexHull(pts.map(p=>{tmp.copy(p).project(cam);return[tmp.x,tmp.y]}));
    let x0=9,x1=-9,y0=9,y1=-9;hull.forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)});
    const cx=(x0+x1)/2,cy=(y0+y1)/2,tol=Math.abs(polyArea(hull))*.002;
    const pen=(s,dx)=>{const Hs=hull.map(([x,y])=>[cx+(x-cx)*s+dx,cy+(y-cy)*s]);let a=0;for(const r of rects)a+=clipArea(Hs,r);return a};
    let best=null;
    outer:for(let s=1;s>=.559;s-=.02)for(const dx of DXS){const n=pen(s,dx);if(!best||n<best.n)best={s,dx,n};if(n<=tol){best={s,dx,n};break outer}}
    S.fitInfo='scale '+best.s.toFixed(2)+' shift '+best.dx.toFixed(2);S.fitDbg=hr.map((r,k)=>r.nm+':'+(clipArea(hull,rects[k])/Math.abs(polyArea(hull))*100).toFixed(1)+'%').join(' ');
    return best.s===1&&best.dx===0?base:fitCam(pts,e,.98*best.s,fillH*best.s,best.dx,0)}
  /* the view for a pose (and Closer: 1.7x nearer, centred on the printed lines that face us) */
  function poseView(qq,zoom){const q0=pivot.quaternion.clone();pivot.quaternion.copy(qq);pivot.updateMatrixWorld(true);
    let v=fitAvoid(hullW(),P.el);S.zoomFocus=null;
    const z4=zoom&&LEVELS[level].l4?closerView(v):null;if(z4){v=z4.v;S.zoomFocus=z4.loc}
    else if(zoom){const cs=[];placeAt(v.tgt,v.d,v.el);
      const pick=list=>list.forEach(r=>{if(faceDot(r.face,r.box)>.15){const f=P.faces[r.face];cs.push(f.map((r.box[0]+r.box[2])/2,(r.box[1]+r.box[3])/2).applyMatrix4(P.group.matrixWorld))}});
      pick(P.lines);if(!cs.length)pick(P.regs);
      const F=new THREE.Vector3();if(cs.length){cs.forEach(c=>F.add(c));F.divideScalar(cs.length);v.tgt.lerp(F,.75)}else F.copy(v.tgt);v.d/=1.7;
      v=zoomAvoid(v,F)}
    pivot.quaternion.copy(q0);pivot.updateMatrixWorld(true);place();return v}
  /* Level 4 Closer (approved tv-2, the viz dev's close look): frame the print big in the space that the words, the message and the
     buttons leave free, in .94 of it. When the date's side faces the class, the points are the round's own close look (level4.js
     close.pts: the print and the edge of the package that faces the words, so the package stays off them); otherwise the printed
     lines that face the class. The message's place is kept free even before a message shows, so a coaching line never covers the
     print. Used only when that is really closer (1.25x to 3x); else the usual 1.7x. */
  function closerView(v){placeAt(v.tgt,v.d,v.el);const C=RD.close,dl=P.lines.find(l=>l.ok),pts=[];let strip=false;
    if(C&&dl&&faceDot(dl.face,dl.box)>.35){C.pts.forEach(p=>pts.push(P.group.localToWorld(V(MM(p[0]),MM(p[1]),MM(p[2])))));strip=C.clear==='strip'}
    else{const its=P.lines.concat(P.regs).filter(r=>faceDot(r.face,r.box)>.35);if(!its.length)return null;
      const by={};its.forEach(r=>{const b=by[r.face];by[r.face]=b?[Math.min(b[0],r.box[0]),Math.min(b[1],r.box[1]),Math.max(b[2],r.box[2]),Math.max(b[3],r.box[3])]:r.box.slice()});
      for(const n in by){const F=P.faces[n],b=by[n],mx=(b[2]-b[0])*.15,my=(b[3]-b[1])*.15;
        boxW({face:n,box:[Math.max(0,b[0]-mx),Math.max(0,b[1]-my),Math.min(F.W,b[2]+mx),Math.min(F.H,b[3]+my)]}).forEach(q=>pts.push(q))}}
    const U=E.u(),w=W(),h=H(),hl=hudL.getBoundingClientRect(),st=stripL.getBoundingClientRect(),ct=ctl.getBoundingClientRect(),hr=hudR.getBoundingClientRect(),
      bu=hudR.querySelector('.fd-bubble'),br=bu?bu.getBoundingClientRect():null;
    const L=-1+2*((strip?Math.max(hl.right,st.right):hl.right)+U*2)/w,R=1-2*(ct.width?w-ct.left+U*1.6:U*2)/w,
      T=1-2*Math.max(st.bottom+U*1.2,Math.max(br?br.bottom:0,hr.top+U*14.5)+U*1.6)/h,B=-1+2*(U*2)/h;
    const z=fitCam(pts,v.el,(R-L)/2*.94,(T-B)/2*.94,(L+R)/2,(B+T)/2);if(!(z.d<=v.d/1.25&&z.d>=v.d/3)){placeAt(v.tgt,v.d,v.el);return null}
    const z2=avoidIn(z,pts,L,R,T,B);placeAt(v.tgt,v.d,v.el);if(!(z2.d<=v.d/1.1))return null;
    return{v:z2,loc:pts.map(q=>P.group.worldToLocal(q.clone()))}}
  /* ...then keep the package off the words at the top and on the left: slide it right or down, or make it smaller, while the
     framed print stays inside its free area (as the Say it close look does), so a package turned by hand still shows its print */
  function avoidIn(v,pts,L,R,T,B){S.zoomInfo='';placeAt(v.tgt,v.d,v.el);const U=E.u(),w=W(),h=H(),p=U*1.6,
      wr=[stripL,hudL].map(e=>{const r=e.getBoundingClientRect();return[(r.left-p)/w*2-1,1-(r.bottom+p)/h*2,(r.right+p)/w*2-1,1-(r.top-p)/h*2]});
    const hull=convexHull(hullW().map(q=>{tmp.copy(q).project(cam);return[tmp.x,tmp.y]}));let x0=9,x1=-9,y0=9,y1=-9;
    pts.forEach(q=>{tmp.copy(q).project(cam);x0=Math.min(x0,tmp.x);x1=Math.max(x1,tmp.x);y0=Math.min(y0,tmp.y);y1=Math.max(y1,tmp.y)});
    const cx=(x0+x1)/2,cy=(y0+y1)/2,tol=.002,
      pen=(s,dx,dy)=>{const Hs=hull.map(([x,y])=>[cx+(x-cx)*s+dx,cy+(y-cy)*s+dy]);let a=0;for(const r of wr)a+=clipArea(Hs,r);return a},
      inside=(s,dx,dy)=>cx+(x0-cx)*s+dx>=L-1e-6&&cx+(x1-cx)*s+dx<=R+1e-6&&cy+(y0-cy)*s+dy>=B-1e-6&&cy+(y1-cy)*s+dy<=T+1e-6;
    if(pen(1,0,0)<=tol)return v;let best=null;
    outer:for(let s=1;s>=.499;s-=.03)for(const [dx,dy] of SAYD){if(!inside(s,dx,dy))continue;const n=pen(s,dx,dy);if(!best||n<best.n-1e-9)best={s,dx,dy,n};if(n<=tol)break outer}
    if(!best)return v;S.zoomInfo='framed, moved '+best.dx.toFixed(2)+','+best.dy.toFixed(2)+' scale '+best.s.toFixed(2);
    return fitCam(pts,v.el,(x1-x0)/2*best.s,(y1-y0)/2*best.s,cx+best.dx,cy+best.dy)}
  /* Closer keeps the package off the words at the top and on the left (as in the approved Level 4 Closer picture): slide it
     right or down, or make it a little smaller, while the part it looks at stays in the open space */
  function zoomAvoid(v,F){S.zoomInfo='';placeAt(v.tgt,v.d,v.el);const U=E.u(),w=W(),h=H(),p=U*1.6;
    const wr=[stripL,hudL].map(e=>{const r=e.getBoundingClientRect();return[(r.left-p)/w*2-1,1-(r.bottom+p)/h*2,(r.right+p)/w*2-1,1-(r.top-p)/h*2]});
    const hull=convexHull(hullW().map(q=>{tmp.copy(q).project(cam);return[tmp.x,tmp.y]}));tmp.copy(F).project(cam);const fx=tmp.x,fy=tmp.y;
    const hl=hudL.getBoundingClientRect(),st=stripL.getBoundingClientRect(),tl=tools.getBoundingClientRect(),
      L=-1+2*(hl.right+U*4)/w,R=1-2*(U*4)/w,T=1-2*(Math.max(st.bottom,tl.bottom)+U*4)/h,B=-1+2*(U*4)/h,
      pen=(s,dx,dy)=>{const Hs=hull.map(([x,y])=>[fx+(x-fx)*s+dx,fy+(y-fy)*s+dy]);let a=0;for(const r of wr)a+=clipArea(Hs,r);return a};
    if(pen(1,0,0)<=.002)return v;let best=null;
    outer:for(let s=1;s>=.699;s-=.03)for(const [dx,dy] of SAYD){const X=fx+dx,Y=fy+dy;if(X<L||X>R||Y<B||Y>T)continue;const n=pen(s,dx,dy);if(!best||n<best.n-1e-9)best={s,dx,dy,n};if(n<=.002)break outer}
    if(!best)return v;S.zoomInfo='moved '+best.dx.toFixed(2)+','+best.dy.toFixed(2)+' scale '+best.s.toFixed(2);
    const d2=v.d/best.s,tg=v.tgt.clone(),rt=new THREE.Vector3(),up=new THREE.Vector3();
    for(let it=0;it<8;it++){placeAt(tg,d2,v.el);tmp.copy(F).project(cam);rt.set(1,0,0).applyQuaternion(cam.quaternion);up.set(0,1,0).applyQuaternion(cam.quaternion);
      const hh=Math.tan(cam.fov*Math.PI/360)*d2,hw=hh*cam.aspect;tg.addScaledVector(rt,(tmp.x-fx-best.dx)*hw).addScaledVector(up,(tmp.y-fy-best.dy)*hh)}
    return{tgt:tg,d:d2,el:v.el}}
  function setView(v){view.tgt.copy(v.tgt);view.d=v.d;view.el=v.el}
  /* how squarely a face looks at the camera (1 = straight at it, 0 or less = turned away) */
  function faceDot(face,box){const f=P.faces[face],cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2,fr=f.frame(cx,cy);
    const n=fr.n.clone().applyQuaternion(pivot.quaternion),c=f.map(cx,cy).applyMatrix4(P.group.matrixWorld);return n.dot(cam.position.clone().sub(c).normalize())}
  function shadowFit(){bb.setFromObject(P.group);bb.getSize(bsz);const s=Math.max(bsz.x,bsz.z)*1.6;shadow.scale.set(s,s,1);shadow.position.set((bb.min.x+bb.max.x)/2,bb.min.y-.002,(bb.min.z+bb.max.z)/2)}
  /* render only when something changes */
  function kick(){if(!raf&&alive)raf=requestAnimationFrame(frame)}
  function frame(now){raf=0;if(!alive||!P)return;
    if(tw){const t=tw.dur>0?Math.min(1,(now-tw.t0)/tw.dur):1,e=1-Math.pow(1-t,3);
      pivot.quaternion.slerpQuaternions(tw.q0,tw.q1,e);view.tgt.lerpVectors(tw.v0.tgt,tw.v1.tgt,e);view.d=tw.v0.d*Math.pow(tw.v1.d/tw.v0.d,e);view.el=tw.v0.el+(tw.v1.el-tw.v0.el)*e;
      if(t>=1){const f=tw.done;tw=null;if(f)f()}}
    draw();if(tw)kick()}
  function draw(){pivot.updateMatrixWorld(true);place();if(shadow.visible)shadowFit();renderer.render(scene,cam);drawOv()}
  function moveTo(q1,v1,dur,done){tw={t0:performance.now(),dur:E.still()?0:dur,q0:pivot.quaternion.clone(),q1:q1.clone(),v0:{tgt:view.tgt.clone(),d:view.d,el:view.el},v1,done};kick()}

  /* ---------- outlines on the package (layer 3), re-drawn with every frame so they stay on the print while it turns ---------- */
  const OV=[];
  function outline(o){const g=document.createElementNS(SVGNS,'g'),poly=document.createElementNS(SVGNS,'polygon');poly.setAttribute('stroke-linejoin','round');g.appendChild(poly);
    g.setAttribute('class',o.style==='glow'?'fd-glow':'fd-in');let chk=null;
    if(o.check){chk=document.createElementNS(SVGNS,'g');chk.setAttribute('class','fd-check');chk.appendChild(document.createElementNS(SVGNS,'g'));g.appendChild(chk)}
    if(o.under)ov.insertBefore(g,ov.firstChild);else ov.appendChild(g);let tagEl=null;if(o.tag){tagEl=document.createElement('span');tagEl.className='fd-tag '+(o.tagCls||'');tagEl.textContent=o.tag;root.appendChild(tagEl)}
    const it=Object.assign({pad:1.4},o,{g,poly,chk,tagEl,u:0});OV.push(it);kick();return it}
  function unOutline(it){if(!it)return;const n=OV.indexOf(it);if(n>=0)OV.splice(n,1);it.g.remove();if(it.tagEl)it.tagEl.remove()}
  function clearOv(test){OV.slice().forEach(it=>{if(!test||test(it))unOutline(it)})}
  /* a box on a face (canvas px) as world points along its edges; curved faces get more points so the outline follows the can */
  function boxW(it){const f=P.faces[it.face],m=P.group.matrixWorld,pts=[];
    if(it.ring){for(let n=0;n<48;n++){const a=n/48*Math.PI*2;pts.push(f.map(f.W/2+Math.cos(a)*f.W*.485,f.H/2+Math.sin(a)*f.H*.485))}}
    else{const b=it.box||[f.W*.015,f.H*.015,f.W*.985,f.H*.985],n=f.curved?Math.max(2,Math.ceil((b[2]-b[0])/f.W*48)):1;
      for(let k=0;k<=n;k++)pts.push(f.map(b[0]+(b[2]-b[0])*k/n,b[1]));for(let k=0;k<=n;k++)pts.push(f.map(b[2]-(b[2]-b[0])*k/n,b[3]))}
    return pts.map(p=>p.applyMatrix4(m))}
  function drawOv(){const U=E.u();
    for(const it of OV){const f=P.faces[it.face],box=it.box||[0,0,f.W,f.H],vis=!it.hide&&faceDot(it.face,box)>.08;
      it.g.style.display=vis?'':'none';if(it.tagEl)it.tagEl.style.display=vis?'':'none';if(!vis)continue;
      const G=grow(boxW(it).map(scr),U*it.pad),st=STY[it.style];
      it.poly.setAttribute('points',G.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '));
      it.poly.setAttribute('fill',st[0]);it.poly.setAttribute('stroke',st[1]);it.poly.setAttribute('stroke-width',(U*st[2]).toFixed(2));
      if(it.style==='dash')it.poly.setAttribute('stroke-dasharray',(U*.8).toFixed(1)+' '+(U*.7).toFixed(1));else it.poly.removeAttribute('stroke-dasharray');
      let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;G.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});it.rect=[x0,y0,x1,y1];
      if(it.chk){let cx=x1,cy=y0;
        /* Level 4 found mark: the check right of the date, level with it, past any printed line that reaches into its band */
        if(it.chkOut){const r=U*1.9;cy=(y0+y1)/2;let xr=x1;
          for(const l of P.lines){if(l.face!==it.face)continue;const q=lineRect(l);if(q[3]>=cy-r&&q[1]<=cy+r)xr=Math.max(xr,q[2])}cx=xr+r*1.15}
        it.chkAt=[cx,cy];it.chk.setAttribute('transform','translate('+cx.toFixed(1)+' '+cy.toFixed(1)+')');
        if(it.u!==U){it.u=U;const r=U*1.9;it.chk.firstChild.innerHTML='<circle r="'+r.toFixed(2)+'" fill="#1FA35B" stroke="#fff" stroke-width="'+(U*.35).toFixed(2)+'"/><path d="M'+(-r*.45).toFixed(2)+' '+(r*.02).toFixed(2)+'l'+(r*.32).toFixed(2)+' '+(r*.32).toFixed(2)+' '+(r*.6).toFixed(2)+' '+(-r*.62).toFixed(2)+'" fill="none" stroke="#fff" stroke-width="'+(U*.55).toFixed(2)+'" stroke-linecap="round" stroke-linejoin="round"/>'}}
      if(it.tagEl){const t=it.tagEl.style;
        if(it.side==='right'){t.left=(x1+U*(it.check?2.8:1.2))+'px';t.top=((y0+y1)/2)+'px';t.transform='translate(0,-50%)'}
        else if(it.side==='left'){t.left=(x0-U*(it.gap||.9))+'px';t.top=((y0+y1)/2)+'px';t.transform='translate(-100%,-50%)'}
        else if(it.side==='above'){t.left=((x0+x1)/2)+'px';t.top=(y0-U*(it.gap||.9))+'px';t.transform='translate(-50%,-100%)'}
        else{t.left=((x0+x1)/2)+'px';t.top=(y1+U*(it.gap||.9))+'px';t.transform='translate(-50%,0)'}}}}
  /* a printed line's box on the screen */
  function lineRect(l){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;boxW({face:l.face,box:l.box}).map(scr).forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});return[x0,y0,x1,y1]}
  function productBox(){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;hullW().forEach(p=>{const [x,y]=scr(p);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)});return[x0,y0,x1,y1]}

  /* ---------- the floating words (layer 1) and the buttons (layer 4), in the viz dev's places ---------- */
  function steps(n){stepsEl.innerHTML='<span class="fd-step '+(n>1?'done':'now')+'">1 Find it</span><span class="fd-sep" aria-hidden="true">›</span><span class="fd-step'+(n===2?' now':'')+'">2 Say it</span>'}
  function bubble(kind,title,html){hudR.innerHTML=title?'<div class="fd-bubble'+(kind==='go'?' go':'')+'"><span class="t">'+title+'</span>'+html+'</div>':''}
  function lookFind(){look.innerHTML='<span class="fd-lab">'+EYE+'Look for</span>'+(level===0?'<span class="fd-chip month">'+MON[RD.date.getMonth()]+'</span>':['BEST BY','USE BY','EXP'].map(s=>'<span class="fd-chip">'+s+'</span>').join('')+(LEVELS[level].l4&&RD.month?'<span class="fd-chip month">'+RD.month+'</span>':''))}
  function ctlBuild(){const L=LEVELS[level],rb=(a,label)=>'<button class="fd-rb'+(a==='zoom'?' zoom':'')+'" data-a="'+a+'" aria-label="'+label+'"'+(a==='zoom'?' aria-pressed="false"':'')+'>'+I[a]+'</button>';
    ctl.className='fd-ctl '+(L.cross?'cross':'row');
    ctl.innerHTML=L.cross?'<span></span>'+rb('up','Tip up')+'<span></span>'+rb('ccw','Turn left')+rb('zoom','Closer')+rb('cw','Turn right')+'<span></span>'+rb('down','Tip down')+'<span></span>'+(L.drag?'<div class="fd-cap">'+HAND+'or drag it</div>':'')
      :rb('ccw','Turn left')+rb('zoom','Closer')+rb('cw','Turn right')}
  /* Level 3: a hand just right of the package shows that it can be dragged, until the first drag */
  function handHint(){const old=ov.querySelector('.fd-swipe');if(old)old.remove();
    if(!LEVELS[level].drag||LEVELS[level].l4||S.dragged||S.step!=='find'){hand.classList.add('gone');return}
    const U=E.u(),b=productBox(),hx=b[2]-U*3,hy=b[1]+(b[3]-b[1])*.6;hand.style.left=hx+'px';hand.style.top=hy+'px';hand.classList.remove('gone');
    const p=document.createElementNS(SVGNS,'path');p.setAttribute('class','fd-swipe');p.setAttribute('d','M '+(hx+U*1.5)+' '+(hy+U*3.2)+' q '+(-U*5)+' '+(U*4)+' '+(-U*11)+' '+(U*1));
    p.setAttribute('fill','none');p.setAttribute('stroke','#1F6FD6');p.setAttribute('stroke-width',(U*.6).toFixed(2));p.setAttribute('stroke-dasharray','2 10');p.setAttribute('stroke-linecap','round');ov.appendChild(p)}

  /* ---------- a round ---------- */
  function disposePkg(){if(!P)return;pivot.remove(P.group);
    P.group.traverse(m=>{if(!m.isMesh)return;m.geometry.dispose();(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{if(x.map){const c=x.map.image;x.map.dispose();if(c&&c.getContext){c.width=c.height=0}}x.dispose()})});P=null}
  function showRound(){clearTimers();tw=null;clearOv();disposePkg();bubble();
    RD=ROUNDS[round];P=RD.build();P.group.position.y=-P.cy;pivot.add(P.group);P.group.updateMatrix();P.hull=[];
    P.group.children.forEach(m=>{if(!m.isMesh)return;m.updateMatrix();const a=m.geometry.attributes.position;for(let n=0;n<a.count;n++)P.hull.push(new THREE.Vector3().fromBufferAttribute(a,n).applyMatrix4(m.matrix))});
    Object.assign(S,{step:'find',zoom:false,easy:false,misses:0,found:null,dateTapped:false,dragged:false,ans:null,qSay:null,amber:null,chunkOv:[],dashOv:[],src:null,zoomInfo:''});
    const st=RD.rd.start;S.q=st?new THREE.Quaternion().setFromEuler(new THREE.Euler(st[0],st[1],0,'YXZ')):new THREE.Quaternion();
    root.classList.remove('say','zoomed','won');root.classList.toggle('drag',!!LEVELS[level].drag);root.classList.toggle('fd-l4',!!LEVELS[level].l4);
    lvlEl.textContent=LEVELS[level].name;steps(1);
    prompt.innerHTML=LEVELS[level].l4?RD.prompt:level<2?'Turn the '+P.noun+'.<br><b>Find the date.</b>':'Find the date<br><b>for shoppers.</b>';
    lookFind();inset.hidden=true;ctlBuild();ctl.hidden=false;answers.hidden=true;answers.classList.add('wait');ansRow.innerHTML='';qqEl.className='fd-qq';qqEl.textContent='What does the date say?';nextB.hidden=true;skipB.hidden=false;
    easyB.setAttribute('aria-pressed','false');stage.setAttribute('aria-label','A '+P.noun+' package. Turn it to find the date.');
    shadow.visible=true;pivot.quaternion.copy(S.q);setView(poseView(S.q,false));draw();handHint();
    E.line('fd-q',prompt.innerHTML,450)}
  function goRound(n){E.quiet();if(n<0){exit();return}if(n>=ROUNDS.length){showDone();return}round=n;showRound();E.snd('whoosh')}
  function startLevel(n,r){if(LEVELS[n].l4&&!L4MOD){loadL4().then(()=>{if(alive)startLevel(n,r)},e=>{console.error('Find the Date: Level 4 could not load.',e);doneV.querySelector('.fd-nextlv').hidden=true});return}
    level=n;ROUNDS=makeRounds(n,today,rnd);won=new Set();round=Math.min(r||0,ROUNDS.length-1);doneV.hidden=true;stopBig();showRound()}

  /* ---------- turning the package: spin around its own up axis, tip toward or away from the class ---------- */
  const AX=V(1,0,0),AY=V(0,1,0);
  const tiltOf=qq=>{const u=V(0,1,0).applyQuaternion(qq);return Math.atan2(u.z,u.y)};
  function turnTo(dur){moveTo(S.q,poseView(S.q,S.zoom),dur,()=>{ctl.querySelectorAll('.fd-rb.on').forEach(b=>b.classList.remove('on'));handHint();snapLook()})}
  function flash(a){const b=ctl.querySelector('[data-a="'+a+'"]');if(b)b.classList.add('on')}
  function spin(dir){if(S.step!=='find')return;S.q.multiply(new THREE.Quaternion().setFromAxisAngle(AY,dir*Math.PI/4));flash(dir>0?'cw':'ccw');E.snd('swoosh');turnTo(420)}
  function tip(dir){if(S.step!=='find'||!LEVELS[level].cross)return;const t=tiltOf(S.q),nt=Math.max(-Math.PI/2,Math.min(Math.PI/2,t+dir*Math.PI/4)),dl=nt-t;
    if(Math.abs(dl)<.02){E.snd('click');return}S.q.premultiply(new THREE.Quaternion().setFromAxisAngle(AX,dl));flash(dir<0?'up':'down');E.snd('swoosh');turnTo(420)}
  function closer(){if(S.step!=='find')return;S.zoom=!S.zoom;root.classList.toggle('zoomed',S.zoom);const z=ctl.querySelector('.zoom');if(z)z.setAttribute('aria-pressed',String(S.zoom));if(LEVELS[level].l4){if(S.zoom){const c2=inset.querySelector('canvas');c2.getContext('2d').clearRect(0,0,c2.width,c2.height);inset.querySelector('svg').innerHTML='';inset.querySelector('.fd-cap2').textContent='looking here';inset.hidden=false}else inset.hidden=true}turnTo(420)}
  /* taps, drags and pinches on the package (made for an iPad mirrored to the TV). One finger turns it on every level, as far as
     that level's buttons can (Level 1 spins only, Level 2 tips up to a quarter turn, Levels 3 and 4 move freely). Two fingers:
     pinch out is Closer, pinch in goes back, one step per pinch. A pinch never taps or turns. */
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),fingers=new Map();let ptr=null,pinch=null;
  root.addEventListener('gesturestart',e=>e.preventDefault());
  function hitAt(x,y){ndc.set(x/W()*2-1,-(y/H())*2+1);ray.setFromCamera(ndc,cam);
    for(const h of ray.intersectObjects(P.group.children,false)){const face=h.object.userData.face;if(face===undefined)continue;if(!face||!h.uv)return{face:''};const f=P.faces[face];return{face,px:h.uv.x*f.W,py:(1-h.uv.y)*f.H}}
    return null}
  function near(list,h,mm){let best=null,bd=1e9;for(const r of list){if(r.face!==h.face)continue;const k=P.faces[r.face].k,b=r.box,dx=Math.max(b[0]-h.px,0,h.px-b[2]),dy=Math.max(b[1]-h.py,0,h.py-b[3]),d=Math.hypot(dx,dy);if(d<=mm*k&&d<bd){bd=d;best=r}}return best}
  stage.addEventListener('pointerdown',e=>{if(!P||!doneV.hidden)return;if(e.isPrimary){fingers.clear();pinch=null;ptr=null;root.classList.remove('dragging')}fingers.set(e.pointerId,[e.clientX,e.clientY]);try{stage.setPointerCapture(e.pointerId)}catch(_){}
    if(fingers.size>1){if(!pinch){if(ptr&&ptr.drag){root.classList.remove('dragging');if(S.step==='find')turnTo(320)}ptr=null;
      const [a,b]=[...fingers.values()];pinch={d0:Math.hypot(a[0]-b[0],a[1]-b[1])||1,done:false}}return}
    if(ptr||pinch)return;ptr={id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,drag:false}});
  stage.addEventListener('pointermove',e=>{if(fingers.has(e.pointerId))fingers.set(e.pointerId,[e.clientX,e.clientY]);
    if(pinch){if(!pinch.done&&fingers.size>1&&S.step==='find'){const [a,b]=[...fingers.values()],r=Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d0;
        if(S.zoom?r<.8:r>1.25){pinch.done=true;closer()}}return}
    if(!ptr||e.pointerId!==ptr.id)return;const dx=e.clientX-ptr.lx,dy=e.clientY-ptr.ly,L=LEVELS[level];
    if(!ptr.drag&&S.step==='find'&&Math.hypot(e.clientX-ptr.x,e.clientY-ptr.y)>10){ptr.drag=true;tw=null;S.q.copy(pivot.quaternion);S.dragged=true;handHint();root.classList.add('dragging')}
    if(ptr.drag){const k=Math.PI/(.6*W()),lim=L.drag?1.75:L.cross?Math.PI/2:0;S.q.multiply(new THREE.Quaternion().setFromAxisAngle(AY,dx*k));
      if(lim){const t=tiltOf(S.q),nt=Math.max(-lim,Math.min(lim,t+dy*k));S.q.premultiply(new THREE.Quaternion().setFromAxisAngle(AX,nt-t))}pivot.quaternion.copy(S.q);kick()}
    ptr.lx=e.clientX;ptr.ly=e.clientY});
  const endPtr=(e,cancel)=>{fingers.delete(e.pointerId);if(pinch){if(!fingers.size)pinch=null;return}
    if(!ptr||e.pointerId!==ptr.id)return;const p=ptr;ptr=null;root.classList.remove('dragging');if(p.drag){if(S.step==='find')turnTo(320);return}if(!cancel)tap(e.clientX,e.clientY)};
  stage.addEventListener('pointerup',e=>endPtr(e,false));stage.addEventListener('pointercancel',e=>endPtr(e,true));
  function tap(x,y){if(!P)return;if(S.step==='find')tapFind(x,y);else if(S.step==='say')tapSay(x,y)}
  function miss(){S.misses++;if(!S.easy&&S.misses>=2)setEasy(true)}
  /* step 1: find it. The right line gets the green outline and check; anything else gets amber and a coaching line */
  function tapFind(x,y){const h=hitAt(x,y);if(!h)return;unOutline(S.amber);S.amber=null;
    const ln=h.face?near(P.lines,h,2.5):null;if(ln&&ln.ok){found(ln);return}
    const r=ln||(h.face?near(P.regs,h,2.5):null);
    if(r){const kind=ln?lineKind(ln):r.kind,l4=!!LEVELS[level].l4;let co=r.coach,box=r.box;
      /* Level 4 (approved tv-1): a tap on a time or a code names that piece and outlines it alone ("11:25 is a time.") */
      if(l4&&ln&&!co){const c=near(P.chunks.filter(q=>q.face===ln.face&&q.line===ln.line&&q.coach),h,2.5);if(c){co=c.coach;box=c.box}}
      const coach=co?co.replace(/\s*$/,l4?'<br>':' '):(WHAT[kind]?'That is '+WHAT[kind]+'.'+(l4?'<br>':' '):'');
      S.amber=outline({face:r.face,box,style:'amber',pad:.75});bubble('amber','Not that one.',coach+'Find '+RD.clue+'.');E.snd('oops');miss();return}
    bubble('amber','Keep looking.','Turn it. Find '+RD.clue+'.');E.snd('click');miss()}
  function found(ln){S.step='found';S.q.copy(pivot.quaternion);tw=null;
    const l4=!!LEVELS[level].l4,uni=ls=>[Math.min(...ls.map(l=>l.box[0])),Math.min(...ls.map(l=>l.box[1])),Math.max(...ls.map(l=>l.box[2])),Math.max(...ls.map(l=>l.box[3]))];
    const b=uni(P.lines.filter(l=>l.ok&&l.face===ln.face));
    /* Level 4 (approved pictures): the green outline goes round the date itself; the small picture in Say it marks the whole print */
    const dc=l4&&P.chunks.find(c=>c.kind==='date'&&c.face===ln.face);
    S.found={face:ln.face,box:dc?uni(P.lines.filter(l=>l.face===ln.face)):b};clearOv();S.amber=null;
    const it=outline({face:ln.face,box:dc?dc.box:b,style:'go',check:true,pad:l4?.6:1.4,chkOut:l4});
    bubble('go','You found it!','The date is '+whereHTML(P.where)+'.');E.snd('ding');handHint();
    later(60,()=>{if(it.chkAt)E.boom(it.chkAt[0],it.chkAt[1],28);else if(it.rect)E.boom(it.rect[2],it.rect[1],28)});later(1900,toSay)}
  function setEasy(on){S.easy=on;easyB.setAttribute('aria-pressed',String(on));clearOv(it=>it.style==='glow');ansRow.querySelectorAll('.soft').forEach(b=>b.classList.remove('soft'));if(!on)return;
    if(S.step==='find'){const f=P.faces[P.spot];
      if(f.ring)outline({face:P.spot,ring:true,style:'glow',pad:.2});
      else if(f.curved){const c=P.chunks.find(q=>q.kind==='date').box,k=f.k;outline({face:P.spot,box:[c[0]-14*k,c[1]-10*k,c[2]+14*k,c[3]+10*k],style:'glow',pad:.2})}
      else outline({face:P.spot,style:'glow',pad:.2})}
    else if(S.step==='say'||S.step==='move'){const c=P.chunks.find(q=>q.kind==='date');if(!S.dateTapped&&S.step==='say')outline({face:c.face,box:c.box,style:'glow',pad:1.6});
      if(S.dateTapped&&S.ans){const wrong=[...ansRow.querySelectorAll('.fd-a:not(.no):not(.yes):not(.amber)')].filter(b=>!S.ans[+b.dataset.i].ok);if(wrong.length)wrong[0].classList.add('soft')}}}

  /* ---------- step 2: say it. The camera glides in on the real print (no enlarged copy), framed in the space the words leave free;
     a small picture of the whole package shows where on it the class is looking. ---------- */
  function snapInset(o){o=o||{};const c2=inset.querySelector('canvas'),sv=inset.querySelector('svg'),U=E.u();inset.hidden=false;
    const iw=inset.clientWidth,ih=inset.clientHeight,pr=Math.min(2,Math.max(window.devicePixelRatio||1,1));if(!iw||!ih)return;
    c2.width=Math.round(iw*pr);c2.height=Math.round(ih*pr);const x=c2.getContext('2d');x.clearRect(0,0,c2.width,c2.height);
    const b=productBox(),w=W(),h=H(),bx0=Math.max(0,b[0]),by0=Math.max(0,b[1]),bw=Math.min(w,b[2])-bx0,bh=Math.min(h,b[3])-by0;if(bw<2||bh<2)return;
    const s=Math.min(iw*.8/bw,ih*.72/bh),dw=bw*s,dh=bh*s,dx=(iw-dw)/2,dy=(ih-dh)/2-ih*.05,src=renderer.domElement,k=src.width/w;
    try{x.drawImage(src,bx0*k,by0*k,bw*k,bh*k,dx*pr,dy*pr,dw*pr,dh*pr)}catch(e){}
    const m=o.poly||(o.mark&&[[o.mark[0],o.mark[1]],[o.mark[2],o.mark[1]],[o.mark[2],o.mark[3]],[o.mark[0],o.mark[3]]]),cl=(v,a)=>Math.max(U*.5,Math.min(a-U*.5,v)),
      G=m?m.map(([X,Y])=>[cl((X-bx0)*s+dx,iw),cl((Y-by0)*s+dy,ih)])
        :grow(boxW({face:S.found.face,box:S.found.box}).map(scr).map(([X,Y])=>[(X-bx0)*s+dx,(Y-by0)*s+dy]),U*.5),
      sty=m?'fill="rgba(31,111,214,.12)" stroke="#1F6FD6" stroke-dasharray="'+(U*.9).toFixed(1)+' '+(U*.6).toFixed(1)+'"':'fill="rgba(31,163,91,.15)" stroke="#1FA35B"';
    sv.setAttribute('viewBox','0 0 '+iw+' '+ih);sv.setAttribute('preserveAspectRatio','none');
    sv.innerHTML='<polygon points="'+G.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'" '+sty+' stroke-width="'+(U*.4).toFixed(2)+'" stroke-linejoin="round"/>';
    inset.querySelector('.fd-cap2').textContent=o.cap||onWhere(P.where)}
  /* Level 4, Closer in Find it: the small whole-package picture shows where the close look is (blue dashed mark, "looking here") */
  function snapLook(){if(!LEVELS[level].l4||S.step!=='find'||!S.zoom||!P)return;
    const vz={tgt:view.tgt.clone(),d:view.d,el:view.el},w=W(),h=H(),sh=shadow.visible,fp=S.zoomFocus,v0=poseView(S.q,false);
    setView(v0);S.zoomFocus=fp;shadow.visible=false;draw();let o;
    /* the mark goes round the place the close look frames (on the deli: its label, as in tv-2); after the usual 1.7x, round the
       part of the package that the close look shows */
    if(fp)o={poly:convexHull(fp.map(q=>scr(P.group.localToWorld(q.clone()))))};
    else{const c=scr(vz.tgt),k=.5*vz.d/v0.d,b=productBox(),m=[Math.max(b[0],c[0]-w*k),Math.max(b[1],c[1]-h*k),Math.min(b[2],c[0]+w*k),Math.min(b[3],c[1]+h*k)];
      o={mark:m[2]-m[0]>4&&m[3]-m[1]>4?m:[c[0]-w*k,c[1]-h*k,c[0]+w*k,c[1]+h*k]}}
    o.cap='looking here';snapInset(o);shadow.visible=sh;setView(vz);draw()}
  /* the pose that shows the printed face to the class, tipped back a little for a 3D look (the viz dev's Say it pose) */
  function closePose(ch){const f=P.faces[ch.face],fr=f.frame((ch.box[0]+ch.box[2])/2,(ch.box[1]+ch.box[3])/2),e=.22+.33,yo=-.08,ay=V(0,1,0);
    const T=V(0,Math.sin(e),Math.cos(e)).applyAxisAngle(ay,yo),Ut=V(0,Math.cos(e),-Math.sin(e)).applyAxisAngle(ay,yo),Rt=V(1,0,0).applyAxisAngle(ay,yo);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Rt,Ut,T).multiply(new THREE.Matrix4().makeBasis(fr.r,fr.u,fr.n).transpose()))}
  function sayView(qq){const q0=pivot.quaternion.clone();pivot.quaternion.copy(qq);pivot.updateMatrixWorld(true);
    const U=E.u(),f=P.faces[P.spot],h=P.letter*f.k,cs=P.chunks.filter(c=>c.face===P.spot),C=LEVELS[level].l4&&RD.close;
    const hl=hudL.getBoundingClientRect(),st=stripL.getBoundingClientRect(),tl=tools.getBoundingClientRect(),an=answers.getBoundingClientRect(),w=W(),h2=H();
    let L,R,T,B,pts,v;
    /* the date's letter height on the screen, in px */
    const dc=cs.find(c=>c.kind==='date')||cs[0],lpx=()=>{const x=(dc.box[0]+dc.box[2])/2,y=(dc.box[1]+dc.box[3])/2,
      pa=f.map(x,y-h/2).applyMatrix4(P.group.matrixWorld).project(cam),pb=f.map(x,y+h/2).applyMatrix4(P.group.matrixWorld).project(cam);return Math.hypot((pa.x-pb.x)*w/2,(pa.y-pb.y)*h2/2)};
    if(C){/* Level 4: the round's own framing (level4.js close: points in mm round the print, seen at its pose), in .92 of the space the
         words leave free, as in the approved Level 4 pictures (the messy-dates README, rule 5) */
      const bu=hudR.querySelector('.fd-bubble'),br=bu?bu.getBoundingClientRect():null;
      L=-1+2*((C.clear==='strip'?Math.max(hl.right,st.right):hl.right)+U*2)/w;R=1-2*(U*2)/w;T=1-2*Math.max(st.bottom+U*1.2,br?br.bottom+U*1.6:0)/h2;B=1-2*(an.top-U*1.6)/h2;
      pts=C.pts.map(p=>P.group.localToWorld(V(MM(p[0]),MM(p[1]),MM(p[2]))));v=fitCam(pts,.22,(R-L)/2*.92,(T-B)/2*.92,(L+R)/2,(B+T)/2);S.sayInfo='level 4 framing, letter '+(lpx()/h2*100).toFixed(1)+'%'}
    else{const b=[Math.min(...cs.map(c=>c.box[0]))-3*h,Math.min(...cs.map(c=>c.box[1]))-1.5*h,Math.max(...cs.map(c=>c.box[2]))+6.25*h,Math.max(...cs.map(c=>c.box[3]))+1.5*h];
      L=-1+2*(hl.right+U*2)/w;R=1-2*(U*2)/w;T=1-2*(Math.max(st.bottom,tl.bottom)+U)/h2;B=-1+2*(h2-an.top+U*1.5)/h2;
      pts=boxW({face:P.spot,box:b});const tw0=(R-L)/2*.9,th0=(T-B)/2*.9;v=fitCam(pts,.22,tw0,th0,(L+R)/2,(B+T)/2);
      /* never closer than the v3 close look: its date letters are 5.4% of the screen height (a big stamp would fill the screen) */
      const lp=lpx(),cap=.054*h2;
      const k0=lp>cap*1.01?cap/lp:1;S.sayInfo='letter '+(lp*k0/h2*100).toFixed(1)+'%'+(k0<1?' capped':'');if(k0<1)v=fitCam(pts,.22,tw0*k0,th0*k0,(L+R)/2,(B+T)/2)}
    /* the close look keeps the package off the words at the top and on the left, as in v3: slide it right or down,
       or make it a little smaller, while the date stays inside its space. The answers card sits on top, so it may cover the package. */
    const p=U*1.6,wr=[stripL,hudL].map(e=>{const r=e.getBoundingClientRect();return[(r.left-p)/w*2-1,1-(r.bottom+p)/h2*2,(r.right+p)/w*2-1,1-(r.top-p)/h2*2]});
    const hull=convexHull(hullW().map(q=>{tmp.copy(q).project(cam);return[tmp.x,tmp.y]}));let fx0=9,fx1=-9,fy0=9,fy1=-9;
    pts.forEach(q=>{tmp.copy(q).project(cam);fx0=Math.min(fx0,tmp.x);fx1=Math.max(fx1,tmp.x);fy0=Math.min(fy0,tmp.y);fy1=Math.max(fy1,tmp.y)});
    const cx=(fx0+fx1)/2,cy=(fy0+fy1)/2,tol=.002,
      pen=(s,dx,dy)=>{const Hs=hull.map(([x,y])=>[cx+(x-cx)*s+dx,cy+(y-cy)*s+dy]);let a=0;for(const r of wr)a+=clipArea(Hs,r);return a},
      inside=(s,dx,dy)=>cx+(fx0-cx)*s+dx>=L-1e-6&&cx+(fx1-cx)*s+dx<=R+1e-6&&cy+(fy0-cy)*s+dy>=B-1e-6&&cy+(fy1-cy)*s+dy<=T+1e-6;
    if(pen(1,0,0)>tol){let best=null;
      outer:for(let s=1;s>=.699;s-=.03)for(const [dx,dy] of SAYD){if(!inside(s,dx,dy))continue;const n=pen(s,dx,dy);if(!best||n<best.n-1e-9)best={s,dx,dy,n};if(n<=tol)break outer}
      if(best){S.sayInfo+=' moved '+best.dx.toFixed(2)+','+best.dy.toFixed(2)+' scale '+best.s.toFixed(2);v=fitCam(pts,.22,(fx1-fx0)/2*best.s,(fy1-fy0)/2*best.s,cx+best.dx,cy+best.dy)}}
    pivot.quaternion.copy(q0);pivot.updateMatrixWorld(true);place();return v}
  function ansHTML(){return S.ans.map((a,n)=>'<button class="choice fd-a" data-i="'+n+'" style="--i:'+n+'"><span class="fd-spk">'+SPK+'</span>'+a.t+'</button>').join('')}
  function bindAns(){ansRow.querySelectorAll('.fd-a').forEach(b=>b.onclick=()=>pick(b))}
  function toSay(){if(!alive||S.step!=='found')return;S.step='move';
    const was={tgt:view.tgt.clone(),d:view.d,el:view.el};
    setView(poseView(S.q,false));shadow.visible=false;draw();snapInset();
    root.classList.add('say');root.classList.remove('zoomed');S.zoom=false;ctl.hidden=true;handHint();steps(2);clearOv();S.amber=null;bubble();
    prompt.innerHTML=level===0?'Say the <b>date</b>.':'Tap the <b>date</b>.<br>Then say it.';
    look.innerHTML='<span class="fd-lab">'+EYE+'Close look</span>';inset.hidden=false;
    S.ans=RD.choices;ansRow.innerHTML=ansHTML();answers.hidden=false;answers.classList.add('wait');qqEl.className='fd-qq';qqEl.textContent='What does the date say?';
    const C=LEVELS[level].l4&&RD.close;S.qSay=C?new THREE.Quaternion().setFromEuler(new THREE.Euler(C.rx||0,C.ry||0,0,'YXZ')):closePose(P.chunks.find(c=>c.kind==='date'));const v=sayView(S.qSay);
    setView(was);draw();E.snd('whoosh');
    moveTo(S.qSay,v,700,()=>{S.step='say';S.chunkOv=P.chunks.filter(c=>c.face===P.spot).map(c=>outline({face:c.face,box:c.box,style:'dash',pad:.9}));
      if(LEVELS[level].l4)srcRegs().forEach(r=>S.chunkOv.push(outline({face:r.face,box:r.box,style:'dash',pad:.9})));
      if(level===0)dateFound(true);else if(S.easy)setEasy(true);E.line('fd-q',prompt.innerHTML,200)})}
  /* the date is found in the close look: every piece of the print gets its name; the answers deal in */
  function dateFound(auto){S.dateTapped=true;clearOv();S.amber=null;S.dashOv=[];const cs=P.chunks.filter(c=>c.face===P.spot),nl=P.nlines||1,l4=!!LEVELS[level].l4;
    cs.forEach(c=>{const isD=c.kind==='date';let side,gap;
      if(l4)[side,gap]=side4(c,cs);
      else{const row=cs.filter(x=>x.line===c.line),last=row[row.length-1]===c;side=nl===1?'right':c.line===nl-1?'below':c.line===0?(last?'right':'above'):'right'}
      const it=outline({face:c.face,box:c.box,style:isD?'go':'dash',check:isD,pad:.9,tag:c.tag||TAG[c.kind]||'',side,gap,tagCls:isD?'go':''});it.ch=c;S.dashOv.push(it)});
    if(l4)srcRegs().forEach(r=>{const it=outline({face:r.face,box:r.box,style:'dash',pad:.9,tag:r.what,side:'left'});it.rg=r;S.dashOv.push(it)});
    if(!auto){if(LEVELS[level].l4)bubble();else bubble('go','That is the date!','Now say it.');E.snd('ding')}
    answers.classList.remove('wait');ansRow.innerHTML=ansHTML();bindAns();if(S.easy)setEasy(true)}
  function tapSay(x,y){if(S.dateTapped)return;const h=hitAt(x,y);if(!h||!h.face)return;unOutline(S.amber);S.amber=null;const l4=!!LEVELS[level].l4,br=l4?'<br>':' ';
    const c=near(P.chunks.filter(q=>q.face===P.spot),h,1.5);
    if(!c){/* Level 4: the labels next to the date (PACKED ON, the price) say what they are */
      const r=l4&&near(P.regs.filter(q=>q.face===P.spot&&(q.coach||WHAT[q.kind])),h,1.5);
      if(r){S.amber=outline({face:r.face,box:r.box,style:'amber',pad:.9});bubble('amber','Not that one.',(r.coach||'That is '+WHAT[r.kind]+'.')+br+'Tap the <b>date</b>.');E.snd('oops');miss();return}
      bubble('amber','Keep looking.','Tap the <b>date</b>.');E.snd('click');return}
    if(c.kind==='date'){dateFound(false);return}
    S.amber=outline({face:c.face,box:c.box,style:'amber',pad:.9});
    bubble('amber',c.kind==='words'?'Close!':'Not that one.',c.coach?c.coach+br+'Tap the <b>date</b>.':(c.kind==='words'?'<b>'+c.t+'</b> comes before the date.'+br+'Tap the date.':'That is '+WHAT[c.kind]+'.'+br+'Tap the <b>date</b>.'));
    E.snd('oops');miss()}
  function pick(b){if(S.step!=='say'||!S.dateTapped||b.classList.contains('no')||b.classList.contains('amber'))return;const a=S.ans[+b.dataset.i];E.line('fd-a',a.t);
    if(LEVELS[level].l4){pick4(b,a);return}
    if(a.ok){S.step='won';won.add(round);b.classList.add('yes');ansRow.querySelectorAll('.fd-a').forEach(x=>{if(x!==b)x.classList.add('rest')});
      clearOv(it=>it.style==='glow'||it.style==='amber');bubble('go','Yes!','The date is <b>'+a.t+'</b>.');E.snd('win');
      const r=b.getBoundingClientRect();E.boom(r.left+r.width/2,r.top+r.height/2,90);nextB.hidden=false;skipB.hidden=true;root.classList.add('won')}
    else{b.classList.add('no');bubble('amber','Not that one.',a.coach+' Read the date again.');E.snd('oops');miss()}}
  /* Level 4 Say it (approved tv-3 and tv-4): the coaching line is inside the answer card; a wrong pick turns amber and the
     parts of the date get small amber tags; the right pick turns green with the Fun Friday check stamp */
  function pick4(b,a){clearSrc();
    if(a.ok){S.step='won';won.add(round);b.classList.add('go','yes');ansRow.querySelectorAll('.fd-a.amber').forEach(x=>x.classList.remove('amber'));
      clearOv(it=>it.style==='glow'||it.style==='amber');bubble();
      qqEl.className='fd-qq go';qqEl.innerHTML='<span class="t">You got it!</span>'+(a.coach||'The date is <b>'+a.t+'</b>.');E.snd('win');
      const r=b.getBoundingClientRect();E.boom(r.left+r.width/2,r.top+r.height/2,90);nextB.hidden=false;skipB.hidden=true;root.classList.add('won')}
    else{b.classList.add('amber');qqEl.className='fd-qq';qqEl.innerHTML='<span class="t">Not that one.</span>'+(a.coach||'Read the date again.');showSrc(a);E.snd('oops');miss()}}
  /* Level 4: the regs on the date's face that a wrong answer can come from (the deli's PACKED ON): their what is some choice's src */
  function srcRegs(){const set=new Set(RD.choices.map(c=>c.src).filter(Boolean));return P.regs.filter(r=>r.face===P.spot&&r.what&&set.has(r.what))}
  /* Level 4 name tags (approved tv-3 and tv-4): the clue words above, or below when they stand apart from the date (the crackers);
     the date to the right, or above when the clue words share its row (the spaghetti); the time, line and codes below */
  function side4(c,cs){const dc=cs.find(x=>x.kind==='date'),row=(a,b)=>Math.min(a.box[3],b.box[3])-Math.max(a.box[1],b.box[1])>.5*Math.min(a.box[3]-a.box[1],b.box[3]-b.box[1]);
    if(c.kind==='date')return cs.some(x=>x!==c&&x.line===c.line&&row(x,c))?['above',1.2]:['right'];
    if(c.kind==='words')return(dc&&c.line===dc.line)||c.line===0?['above']:['below'];
    return['below']}
  /* after a wrong pick, show where the mistake came from (choice.src, level4.css part 2): a misread date gets the year, month and day
     tags; a number from another line (the time, a code, PACKED ON) gets that line in amber, with its tag in amber */
  function showSrc(a){const src=a.src||'date',it=src==='date'?null:S.dashOv.find(o=>o.ch&&o.ch.k===src)||S.dashOv.find(o=>o.rg&&o.rg.what===src);
    if(it){S.src={amber:it};it.style='amber';if(it.tagEl)it.tagEl.classList.add('amber');kick();return}
    S.src={parts:partTags(),veils:[],hid:[]};draw();veil()}
  function clearSrc(){const s=S.src;S.src=null;if(!s)return;
    if(s.amber){s.amber.style='dash';if(s.amber.tagEl)s.amber.tagEl.classList.remove('amber')}
    (s.parts||[]).forEach(unOutline);(s.veils||[]).forEach(unOutline);(s.hid||[]).forEach(o=>{o.hide=false});kick()}
  /* the small amber tags under the parts of the date (round.parts: {t, i, n} = name, first character, how many, in the date's text;
     their boxes come from the date chunk's partBoxes, else from the print) */
  function partTags(){const c=P.chunks.find(q=>q.kind==='date'&&q.face===P.spot)||P.chunks.find(q=>q.kind==='date');if(!RD.parts||!c)return[];const n=Math.max(1,(c.t||RD.ds||'').length),b=c.box;
    return RD.parts.map((pt,j)=>{const [nm,i,m]=Array.isArray(pt)?pt:[pt.t||pt.name,pt.i!=null?pt.i:pt.at,pt.n!=null?pt.n:pt.len];
      const bx=c.partBoxes&&c.partBoxes[j]?c.partBoxes[j]:c.cbox?c.cbox(i,m):[b[0]+(b[2]-b[0])*i/n,b[1],b[0]+(b[2]-b[0])*(i+m)/n,b[3]];
      return outline({face:c.face,box:bx,style:'part',pad:0,tag:nm,side:'below',gap:1.6,tagCls:'amber part'})})}
  /* a printed line that the part tags would cover gets a white veil and loses its dashed outline and tag while the tags show */
  function veil(){const s=S.src;if(!s||!s.parts)return;s.veils.forEach(unOutline);s.hid.forEach(o=>{o.hide=false});s.veils=[];s.hid=[];
    const tr=s.parts.filter(o=>o.tagEl).map(o=>o.tagEl.getBoundingClientRect());if(!tr.length)return;
    for(const l of P.lines){if(l.face!==P.spot||l.kinds.includes('date'))continue;const q=lineRect(l);
      if(!tr.some(r=>r.left<q[2]&&r.right>q[0]&&r.top<q[3]&&r.bottom>q[1]))continue;
      s.veils.push(outline({face:l.face,box:l.box,style:'veil',pad:.9,under:true}));
      S.dashOv.forEach(o=>{if(o.ch&&o.ch.face===l.face&&o.ch.line===l.line){o.hide=true;s.hid.push(o)}})}
    kick()}

  /* ---------- level done: the game's level-done page, the Fun Friday party, the game-show win when every round was won ---------- */
  function stopBig(){if(bigWinOn){E.stopWin();bigWinOn=false}}
  function showDone(){clearTimers();tw=null;E.quiet();const n=level+1;doneV.hidden=false;
    doneV.querySelector('h1').textContent='Level '+n+' done!';
    doneV.querySelector('.stars').innerHTML=ROUNDS.map((_,k)=>won.has(k)?E.star().replace('alt=""','alt="star" style="animation-delay:'+(k*90)+'ms"'):'<span class="nostar" aria-label="skipped"></span>').join('');
    const nl=doneV.querySelector('.fd-nextlv');nl.hidden=level>=LEVELS.length-1;nl.textContent='Level '+(n+1);
    E.fiesta();E.line('fd-end','Level '+n+' done! Now find the date on a real package.',450);
    if(won.size===ROUNDS.length)later(350,()=>{bigWinOn=true;E.showWin(doneV.querySelector('.stars'))})}

  /* ---------- buttons and keys ---------- */
  easyB.onclick=()=>{if(S.step==='won')return;setEasy(!S.easy);E.snd('click')};
  skipB.onclick=()=>goRound(round+1);
  backB.onclick=()=>goRound(round-1);
  nextB.onclick=()=>goRound(round+1);
  /* Sound: the game's one shared switch. If the game did not handle this button itself, pass the tap to its Sound switch. */
  sndB.addEventListener('click',()=>{const before=E.loud();setTimeout(()=>{if(!alive||E.loud()!==before)return;
    const g=[...document.querySelectorAll('.snd')].find(b=>b!==sndB&&typeof b.onclick==='function');if(g)g.onclick();else sndB.setAttribute('aria-pressed',String(E.loud()))},0)});
  ctl.addEventListener('click',e=>{const b=e.target.closest('.fd-rb');if(!b)return;const a=b.dataset.a;if(a==='cw')spin(1);else if(a==='ccw')spin(-1);else if(a==='up')tip(-1);else if(a==='down')tip(1);else if(a==='zoom')closer()});
  doneV.querySelector('.fd-levels').onclick=()=>{E.snd('whoosh');exit()};
  doneV.querySelector('.fd-again').onclick=()=>{startLevel(level);E.snd('whoosh')};
  doneV.querySelector('.fd-nextlv').onclick=()=>{startLevel(Math.min(LEVELS.length-1,level+1));E.snd('whoosh')};
  function onKey(e){if(!alive||!doneV.hidden||e.altKey||e.ctrlKey||e.metaKey)return;const k=e.key,L=LEVELS[level];
    if(S.step==='find'){if(k==='ArrowLeft')spin(-1);else if(k==='ArrowRight')spin(1);else if(k==='ArrowUp'&&L.cross)tip(-1);else if(k==='ArrowDown'&&L.cross)tip(1);else return;e.preventDefault()}
    else if(S.step==='won'&&k==='ArrowRight'){e.preventDefault();goRound(round+1)}}
  addEventListener('keydown',onKey);
  let rzT=0;
  function onResize(){clearTimeout(rzT);rzT=setTimeout(()=>{if(!alive||!P)return;renderer.setSize(W(),H(),false);cam.aspect=W()/H();cam.updateProjectionMatrix();const f=tw&&tw.done;tw=null;
    if(S.qSay){pivot.quaternion.copy(S.qSay);setView(sayView(S.qSay))}else{pivot.quaternion.copy(S.q);setView(poseView(S.q,S.zoom))}
    draw();if(S.src&&S.src.parts)veil();if(f)f();handHint()},120)}
  addEventListener('resize',onResize);
  function exit(){stop();onExit()}
  function destroy(){alive=false;clearTimers();clearTimeout(rzT);if(raf)cancelAnimationFrame(raf);raf=0;tw=null;removeEventListener('keydown',onKey);removeEventListener('resize',onResize);
    stopBig();E.quiet();clearOv();disposePkg();shadow.geometry.dispose();shadow.material.dispose();shTex.dispose();
    try{renderer.dispose();renderer.forceContextLoss()}catch(e){}const c=renderer.domElement;c.width=c.height=1;el.innerHTML=''}

  /* ---------- for tests only: read the state and find where things are on the screen ---------- */
  const test={state:()=>({level,round,step:S.step,misses:S.misses,easy:S.easy,zoom:S.zoom,won:[...won],dateTapped:S.dateTapped,busy:!!tw||S.step==='move',fit:S.fitInfo,fitDbg:S.fitDbg,say:S.sayInfo,zoomInfo:S.zoomInfo,closer:S.zoom?(S.zoomFocus?'framed':'1.7x'):'',
      tilt:tiltOf(S.q),q:S.q.toArray().map(v=>+v.toFixed(4)),date:RD&&RD.ds,right:RD&&RD.spoken,choices:S.ans&&S.ans.map(a=>a.t),bubble:hudR.textContent,card:qqEl.textContent,spot:P&&P.spot,
      src:S.src?(S.src.amber?'amber:'+(S.src.amber.ch?S.src.amber.ch.k:S.src.amber.rg.what):'parts:'+S.src.parts.length+' veils:'+S.src.veils.length):'',
      tags:[...root.querySelectorAll('.fd-tag')].filter(t=>t.style.display!=='none').map(t=>t.textContent+(t.classList.contains('amber')?'*':''))}),
    /* the screen point of a part, with how squarely it faces the camera: 'line:ok', 'line:bad', 'reg:price', 'chunk:date' ... */
    point(what){if(!P)return null;const [kind,name]=what.split(':'),list=kind==='line'?P.lines.filter(l=>name==='ok'?l.ok:!l.ok):kind==='reg'?P.regs.filter(r=>r.kind===name):P.chunks.filter(c=>c.kind===name);
      let best=null;for(const r of list){const d=faceDot(r.face,r.box),f=P.faces[r.face],p=scr(f.map((r.box[0]+r.box[2])/2,(r.box[1]+r.box[3])/2).applyMatrix4(P.group.matrixWorld));if(!best||d>best.dot)best={x:p[0],y:p[1],dot:d}}return best},
    hit(x,y){if(!P)return null;const h=hitAt(x,y);if(!h)return null;if(!h.face)return{face:''};const ln=near(P.lines,h,2.5),r=ln?null:near(P.regs,h,2.5);return{face:h.face,line:ln?(ln.ok?'ok':lineKind(ln)):null,reg:r?r.kind:null}},
    /* the turns that show the date best from here: {k: spins (+ = right), t: tips (+ = down)} */
    aim(){if(!P)return null;const q0=pivot.quaternion.clone(),L=LEVELS[level];let best=null;
      for(let k=-3;k<=4;k++)for(const t of L.cross?[0,1,-1,2,-2]:[0]){const q=S.q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(AY,k*Math.PI/4));
        for(let n=0;n<Math.abs(t);n++){const a=tiltOf(q),na=Math.max(-Math.PI/2,Math.min(Math.PI/2,a+Math.sign(t)*Math.PI/4));q.premultiply(new THREE.Quaternion().setFromAxisAngle(AX,na-a))}
        pivot.quaternion.copy(q);pivot.updateMatrixWorld(true);let d=-2;for(const l of P.lines)if(l.ok)d=Math.max(d,faceDot(l.face,l.box));
        (best=best||[]).push({k,t,d})}
      pivot.quaternion.copy(q0);pivot.updateMatrixWorld(true);
      /* the fewest turns among the poses that show it nearly as well as the best one */
      const top=Math.max(...best.map(o=>o.d));return best.filter(o=>o.d>=top-.04).sort((a,b)=>Math.abs(a.k)+Math.abs(a.t)-Math.abs(b.k)-Math.abs(b.t))[0]},
    spin,tip,closer,rounds:()=>ROUNDS.map(r=>({date:r.ds,pk:r.rd.pk,spot:r.rd.spot,choices:r.choices.map(c=>(c.ok?'*':'')+c.t)}))};
  return{begin(){startLevel(level,round)},destroy,test}
}

/* ---------- the one entry call ---------- */
let RUN=null,token=0;
function fail(el,o){el.innerHTML='<div class="fd-root fd-err"><p>Find the Date! can’t start on this screen.</p><button class="nav">Back</button></div>';
  const b=el.querySelector('button');if(b)b.onclick=()=>{el.innerHTML='';if(o&&typeof o.onExit==='function')o.onExit()}}
async function start(el,o){stop();const my=++token;o=o||{};if(!el)return;el.innerHTML='';
  try{if(!THREE)THREE=await import(new URL('three.module.min.js',HERE).href);
    if(+o.level===3)await loadL4();
    await Promise.all(['800 40px "Baloo 2"','900 20px Nunito','800 20px Nunito','700 20px Nunito'].map(f=>document.fonts.load(f).catch(()=>null)))}
  catch(e){console.error('Find the Date:',e);if(my===token)fail(el,o);return}
  if(my!==token)return;
  try{RUN=Activity(el,o);RUN.begin()}catch(e){console.error('Find the Date:',e);if(RUN){try{RUN.destroy()}catch(_){}}RUN=null;fail(el,o)}}
function stop(){token++;if(RUN){const r=RUN;RUN=null;r.destroy()}}
window.FindTheDate={start,stop,get _t(){return RUN&&RUN.test}};
})();
