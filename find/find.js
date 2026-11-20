/* ============================================================================================================
   Find the Date! (Claude's part of Check the Date!): turn a package, find its date, then check it: is it still good?
   (Level 4 still says the date until its rounds give the day each date is good through: README, Level 4 and Check it.)
   The look is the approved viz dev, find-the-date-vizdev/v3 (approved 11/19/2026): the package takes about 93% of the
   screen height, the words float over the scene UNDER the package, the buttons sit on top, rounded-square turn
   buttons in the bottom-right corner, the Look for chips stacked in a column.
   It reuses the Fun Friday engine by name (js/ff-engine.js through the game: sounds, tactile buttons, confetti, party,
   the game-show win, the narrator) and the game's look (css/ff-engine.css + css/game.css: also its wall calendar and phone
   classes for Check it). Nothing is copied.
   It needs: js/ff-engine.js, js/winfx-astra.js, js/dotmatrix.js (DOTFONT) and js/game.js loaded first, and
   find/three.module.min.js (three.js 0.160.0, loaded with import() inside start()) and the package pictures in find/art/
   (classroom-assets group find-packages, loaded in start() with the fonts).
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
  starArt(){try{if(typeof HAVE!=='undefined')return HAVE.has('star')}catch(e){}return false},
  clock(){try{if(typeof clockNow==='function')return clockNow()}catch(e){}const n=new Date();return (n.getHours()%12||12)+':'+String(n.getMinutes()).padStart(2,'0')},
  font(){if(typeof DOTFONT!=='undefined')return DOTFONT;throw new Error('Find the Date needs js/dotmatrix.js (DOTFONT)')}
};

/* ---------- small helpers ---------- */
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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
/* Check it: the marks on the two answers (the approved still-good pictures) and the icons on the phone (the game's phone) */
const OKI='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const XI='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
const PICONS='<div class="picons"><span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M8 2h8v5l-2 3v12h-4V10L8 7z"/></svg></span>'+
  '<span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg></span></div>';

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

/* ---------- the three packages (redesigned 11/19/2026 from real products, with invented brands). Flat printed colour and
   crisp type in Baloo 2 and Nunito, all at real size (mm); the food pictures are Canva colored-pencil art from
   classroom-assets (find/art/). Nothing printed on them reads like a date, a month or a clue word. ---------- */
const ART={},ART_FILES={soup:'soup-bowl.webp',cereal:'cereal-bowl.webp',cow:'milk-cow.webp'};
/* each picture's solid box in its 600 px file (from the cut-out), so a width in mm is the drawing's own width */
const ART_TRIM={soup:[30,92,570,515],cereal:[59,40,575,553],cow:[37,55,562,564]};
function loadArt(){return Promise.all(Object.keys(ART_FILES).map(n=>ART[n]?null:new Promise(ok=>{const im=new Image();
  im.onload=()=>{ART[n]=im;ok()};im.onerror=()=>{console.error('Find the Date: a package picture did not load: art/'+ART_FILES[n]);ok()};
  im.src=new URL('art/'+ART_FILES[n],HERE).href})))}
function art(x,c,n,xm,ym,wm){const im=ART[n];if(!im)return null;const T=ART_TRIM[n],k=c.k,s=wm*k/(T[2]-T[0]),hh=(T[3]-T[1])*s;
  x.drawImage(im,xm*k-(T[0]+(T[2]-T[0])/2)*s,ym*k-(T[1]+(T[3]-T[1])/2)*s,im.width*s,im.height*s);return[xm*k-wm*k/2,ym*k-hh/2,xm*k+wm*k/2,ym*k+hh/2]}
/* printed text. size = font size in mm; o = {w weight, n (Nunito, else Baloo 2), a align, ls letter spacing (em), max width (mm, shrinks to fit),
   st [colour, mm] an outline under the fill, rot (radians)}. Returns the box it covers, in canvas px */
function pt(x,c,s,xm,ym,size,col,o){o=o||{};s=String(s);const k=c.k;let S=size*k;
  const set=()=>{x.font=(o.w||800)+' '+S+'px '+(o.n?'Nunito':'"Baloo 2"')},wid=()=>x.measureText(s).width+(o.ls||0)*S*(s.length-1);
  x.save();set();let w=wid();if(o.max&&w>o.max*k){S*=o.max*k/w;set();w=wid()}
  const x0=o.a==='left'?0:o.a==='right'?-w:-w/2,top=-.42*S,bot=.42*S;
  x.translate(xm*k,ym*k);if(o.rot)x.rotate(o.rot);x.textAlign='left';x.textBaseline='middle';
  const run=f=>{if(!o.ls){f(s,x0);return}let cx=x0;for(const ch of s){f(ch,cx);cx+=x.measureText(ch).width+o.ls*S}};
  if(o.st){x.strokeStyle=o.st[0];x.lineWidth=o.st[1]*2*k;x.lineJoin='round';run((t,a)=>x.strokeText(t,a,0))}
  x.fillStyle=col;run((t,a)=>x.fillText(t,a,0));x.restore();
  const cs=Math.cos(o.rot||0),sn=Math.sin(o.rot||0),P4=[[x0,top],[x0+w,top],[x0+w,bot],[x0,bot]].map(([u,v])=>[xm*k+u*cs-v*sn,ym*k+u*sn+v*cs]);
  return[Math.min(...P4.map(p=>p[0])),Math.min(...P4.map(p=>p[1])),Math.max(...P4.map(p=>p[0])),Math.max(...P4.map(p=>p[1]))]}
/* a block of small print that wraps at w mm. parts = [[text, bold], ...]; o = {lh line height, center} */
function para(x,c,parts,xm,ym,wm,size,col,o){o=o||{};const k=c.k,S=size*k,lh=(o.lh||1.22)*S,W=wm*k;x.save();x.fillStyle=col;x.textBaseline='top';x.textAlign='left';
  const F=b=>(b?900:700)+' '+S+'px Nunito',toks=[];parts.forEach(([t,b])=>String(t).split(/(\s+)/).forEach(w=>{if(w)toks.push([w,b])}));
  const lines=[[]];let lw=0;for(const [t,b] of toks){x.font=F(b);const tw=x.measureText(t).width;if(/^\s+$/.test(t)){if(lw)lines[lines.length-1].push([' ',b,tw]),lw+=tw;continue}
    if(lw+tw>W&&lw){const L=lines[lines.length-1];while(L.length&&L[L.length-1][0]===' ')L.pop();lines.push([]);lw=0}lines[lines.length-1].push([t,b,tw]);lw+=tw}
  if(!o.dry)lines.forEach((L,i)=>{const tot=L.reduce((a,q)=>a+q[2],0);let cx=xm*k+(o.center?(W-tot)/2:0);for(const [t,b,tw] of L){x.font=F(b);x.fillText(t,cx,ym*k+i*lh);cx+=tw}});
  x.restore();return[xm*k,ym*k,(xm+wm)*k,ym*k+lines.length*lh]}
function rr(x,c,xm,ym,wm,hm,rm,fill,stroke,swm){const k=c.k,X=xm*k,Y=ym*k,w=wm*k,h=hm*k,r=Math.min(rm*k,w/2,h/2);x.beginPath();x.moveTo(X+r,Y);
  x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();
  if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=(swm||.4)*k;x.stroke()}return[X,Y,X+w,Y+h]}
/* a real UPC-A bar code from 11 digits (the check digit is worked out), with its numbers under it */
const UPC_L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
function upc(x,c,xm,ym,wm,hm,d11){const k=c.k,d=String(d11).replace(/\D/g,'').slice(0,11).split('').map(Number);let s=0;d.forEach((v,i)=>{s+=v*(i%2?1:3)});d.push((10-s%10)%10);
  let bits='101';for(let i=0;i<6;i++)bits+=UPC_L[d[i]];bits+='01010';for(let i=6;i<12;i++)bits+=UPC_L[d[i]].replace(/./g,b=>b==='0'?'1':'0');bits+='101';
  const m=wm/113,X=xm+9*m,hd=hm*.86,long=i=>i<10||(i>=45&&i<50)||i>=85;
  x.save();x.fillStyle='#fff';x.fillRect((xm-1)*k,(ym-1.2)*k,(wm+2)*k,(hm+3.6)*k);x.fillStyle='#16181D';
  for(let i=0;i<95;i++)if(bits[i]==='1')x.fillRect((X+i*m)*k,ym*k,m*k+.6,(long(i)?hm:hd)*k);
  x.font='700 '+(hm*.15*k)+'px Nunito';x.textBaseline='top';x.textAlign='center';const ty=(ym+hd+.3)*k;
  x.fillText(d.slice(1,6).join(''),(X+27*m)*k,ty);x.fillText(d.slice(6,11).join(''),(X+68*m)*k,ty);
  x.font='700 '+(hm*.11*k)+'px Nunito';x.fillText(String(d[0]),(xm+4.5*m)*k,ty);x.fillText(String(d[11]),(xm+108.5*m)*k,ty);x.restore();
  return[(xm-1)*k,(ym-1.2)*k,(xm+wm+1)*k,(ym+hm+2.4)*k]}
/* the US Nutrition Facts panel, black on white. N = {serv, size, cal, rows:[[name, amount, %, indent, bold]], vit:[[name, amount, %]]} */
function nfacts(x,c,xm,ym,wm,N,sc){sc=sc||1;const k=c.k,I='#16181D',X=xm*k,W=wm*k,pad=1.3*sc*k,
    foot='* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is the basis for general nutrition advice.';
  const run=dry=>{let y=ym*k+pad;
    const T=(s,px,py,sz,w,al)=>{if(dry)return;x.font=(w||700)+' '+sz*sc*k+'px Nunito';x.textAlign=al||'left';x.textBaseline='top';x.fillStyle=I;x.fillText(s,px,py)};
    const bar=h=>{if(!dry){x.fillStyle=I;x.fillRect(X+pad,y,W-2*pad,h*sc*k)}y+=(h+.6)*sc*k};
    T('Nutrition Facts',X+pad,y,6.2,900);y+=7*sc*k;bar(.25);T(N.serv,X+pad,y,2.5,700);y+=3.2*sc*k;
    T('Serving size',X+pad,y,2.9,900);T(N.size,X+W-pad,y,2.9,900,'right');y+=3.6*sc*k;bar(1.8);
    T('Amount per serving',X+pad,y,2.3,900);y+=2.7*sc*k;T('Calories',X+pad,y,5.2,900);T(N.cal,X+W-pad,y-.6*sc*k,6,900,'right');y+=6.2*sc*k;bar(1);
    T('% Daily Value*',X+W-pad,y,2.3,900,'right');y+=2.9*sc*k;
    N.rows.forEach(([n,a,p,ind,b])=>{bar(.15);const px=X+pad+(ind||0)*2.6*sc*k,bw=b===false?700:900;x.font=bw+' '+2.5*sc*k+'px Nunito';const nw=x.measureText(n+' ').width;
      T(n,px,y,2.5,bw);T(a,px+nw,y,2.5,700);if(p)T(p,X+W-pad,y,2.5,900,'right');y+=3.1*sc*k});
    bar(1.8);N.vit.forEach(([n,a,p],i)=>{if(i)bar(.15);T(n+' '+a,X+pad,y,2.5,700);T(p,X+W-pad,y,2.5,700,'right');y+=3.1*sc*k});bar(1);
    return para(x,c,[[foot,false]],xm+1.3*sc,y/k,wm-2.6*sc,1.75*sc,I,{lh:1.18,dry})[3]+pad};
  x.save();const h=run(true)-ym*k;x.fillStyle='#fff';x.fillRect(X,ym*k,W,h);x.strokeStyle=I;x.lineWidth=.3*k;x.strokeRect(X,ym*k,W,h);run(false);x.restore();
  return[X,ym*k,X+W,ym*k+h]}
/* a store's round price sticker */
function priceDot(x,c,xm,ym,rm,price){const k=c.k,X=xm*k,Y=ym*k,r=rm*k;x.save();
  x.shadowColor='rgba(40,20,0,.28)';x.shadowBlur=r*.14;x.shadowOffsetY=r*.05;x.fillStyle='#FF8B1E';x.beginPath();x.arc(X,Y,r,0,7);x.fill();x.shadowColor='transparent';
  const g=x.createRadialGradient(X-r*.35,Y-r*.45,r*.05,X,Y,r);g.addColorStop(0,'rgba(255,255,255,.38)');g.addColorStop(.55,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(X,Y,r,0,7);x.fill();
  x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=r*.045;x.beginPath();x.arc(X,Y,r*.87,0,7);x.stroke();x.restore();
  pt(x,c,price,xm,ym+rm*.04,rm*.56,'#2B1300',{w:800,max:rm*1.55});return[X-r,Y-r,X+r,Y+r]}
function snowflake(x,c,xm,ym,rm,col){const k=c.k;x.save();x.strokeStyle=col;x.lineWidth=rm*.16*k;x.lineCap='round';x.translate(xm*k,ym*k);
  for(let i=0;i<6;i++){x.rotate(Math.PI/3);x.beginPath();x.moveTo(0,0);x.lineTo(0,-rm*k);x.moveTo(0,-rm*.55*k);x.lineTo(rm*.28*k,-rm*.8*k);x.moveTo(0,-rm*.55*k);x.lineTo(-rm*.28*k,-rm*.8*k);x.stroke()}x.restore()}
function recycle(x,c,xm,ym,rm,col){const k=c.k;x.save();x.translate(xm*k,ym*k);x.strokeStyle=col;x.fillStyle=col;x.lineWidth=rm*.2*k;x.lineCap='round';x.lineJoin='round';
  for(let i=0;i<3;i++){x.rotate(Math.PI*2/3);x.beginPath();x.arc(0,0,rm*.72*k,-Math.PI*.42,-Math.PI*.02);x.stroke();
    const a=-Math.PI*.02,ax=Math.cos(a)*rm*.72*k,ay=Math.sin(a)*rm*.72*k;x.beginPath();x.moveTo(ax+rm*.26*k,ay-rm*.05*k);x.lineTo(ax-rm*.2*k,ay-rm*.12*k);x.lineTo(ax+.02*k,ay+rm*.3*k);x.closePath();x.fill()}x.restore()}
/* a wavy band across a face: top edge at y0, bottom edge at y1 (mm), amplitude a */
function waveBand(x,c,y0,y1,a,col,ph){const k=c.k,w=c.width;x.save();x.fillStyle=col;x.beginPath();x.moveTo(0,(y0+a*Math.sin(ph||0))*k);
  for(let i=1;i<=60;i++){const u=i/60;x.lineTo(u*w,(y0+a*Math.sin((ph||0)+u*Math.PI*2.2))*k)}
  for(let i=60;i>=0;i--){const u=i/60;x.lineTo(u*w,(y1+a*.6*Math.sin((ph||0)+1.3+u*Math.PI*1.8))*k)}x.closePath();x.fill();x.restore()}

/* ---- half-gallon gable-top milk carton: 95 x 95 mm, 195 mm body, 40 mm gable. Brand: Sunny Fields (invented) ---- */
const MILK_NF={serv:'8 servings per container',size:'1 cup (240mL)',cal:'120',
  rows:[['Total Fat','5g','6%'],['Saturated Fat','3g','15%',1,false],['Trans Fat','0g','',1,false],['Cholesterol','20mg','7%'],['Sodium','120mg','5%'],
    ['Total Carbohydrate','12g','4%'],['Total Sugars','12g','',1,false],['Protein','8g','']],
  vit:[['Vitamin D','2.5mcg','15%'],['Calcium','310mg','25%'],['Potassium','400mg','8%']]};
function milk(pr,price){const W=95,D=95,H=195,G=40,P=newPkg('milk'),g=P.group,Q=boxQuads(MM(W),MM(H),MM(D));
  const BL='#1F5FAE',INK='#123A6B',LB='#DCEAF8',GRN='#5AA149',SUN='#F6B93B',PAPER='#FFFFFF';
  /* the brand: a sun over a green hill, then the name */
  const logo=(x,c,cx,cy,s)=>{const k=c.k;x.save();x.translate(cx*k,(cy-6.5*s)*k);
    x.strokeStyle=SUN;x.lineWidth=1.1*s*k;x.lineCap='round';for(let i=0;i<9;i++){const a=Math.PI*(1.05+i*.1125);x.beginPath();x.moveTo(Math.cos(a)*6.2*s*k,Math.sin(a)*6.2*s*k);x.lineTo(Math.cos(a)*8.6*s*k,Math.sin(a)*8.6*s*k);x.stroke()}
    x.fillStyle=SUN;x.beginPath();x.arc(0,0,4.8*s*k,Math.PI,0);x.fill();
    x.fillStyle=GRN;x.beginPath();x.moveTo(-11*s*k,1.2*s*k);x.quadraticCurveTo(-3*s*k,-3.4*s*k,11*s*k,.4*s*k);x.lineTo(11*s*k,1.6*s*k);x.lineTo(-11*s*k,1.6*s*k);x.closePath();x.fill();x.restore();
    const a=pt(x,c,'Sunny Fields',cx,cy+3.6*s,9.4*s,BL,{w:800}),b=pt(x,c,'FARM FRESH',cx,cy+10.6*s,2.9*s,GRN,{n:1,w:900,ls:.2});
    return[Math.min(a[0],(cx-11*s)*k),(cy-15.5*s)*k,Math.max(a[2],(cx+11*s)*k),b[3]]};
  const face=(n,draw)=>{const c=cv(W,H,7),x=c.getContext('2d'),k=c.k;x.fillStyle=PAPER;x.fillRect(0,0,c.width,c.height);
    x.fillStyle=BL;x.fillRect(0,0,c.width,3.2*k);x.fillRect(0,c.height-2.2*k,c.width,2.2*k);draw(x,c,k);if(pr[n])printOn(P,x,c,n,pr[n]);addQuad(P,n,Q[n],c)};
  face('front',(x,c,k)=>{P.reg('front','name',logo(x,c,W/2,24,1));
    art(x,c,'cow',W/2,66.5,50);
    x.fillStyle=LB;waveBand(x,c,99,160,2.4,LB,.4);waveBand(x,c,104,163,2.2,BL,1.1);
    pt(x,c,'2%',W/2,124,25,'#fff',{w:800});P.reg('front','name',pt(x,c,'REDUCED FAT MILK',W/2,145.5,6.4,'#fff',{w:800,max:84,ls:.03}));
    pt(x,c,'VITAMINS A & D',W/2,170,4.4,INK,{n:1,w:900,ls:.08});
    P.reg('front','size',pt(x,c,'HALF GALLON (1.89 L)',W/2,182,5.4,BL,{w:800,max:84}));
    if(price)P.reg('front','price',priceDot(x,c,80,47,10,price))});
  face('right',(x,c,k)=>{const nb=P.reg('right','nutrition',nfacts(x,c,9,10,77,MILK_NF,1.12)).box;
    para(x,c,[['INGREDIENTS: ',true],['REDUCED FAT MILK, VITAMIN A PALMITATE, VITAMIN D3.',false]],9,nb[3]/k+6,77,2.6,INK);
    snowflake(x,c,15,163,3.2,BL);pt(x,c,'KEEP REFRIGERATED',21,163.3,4.6,BL,{a:'left',n:1,w:900});
    pt(x,c,'GRADE A  ·  PASTEURIZED  ·  HOMOGENIZED',W/2,177,2.9,INK,{n:1,w:800,max:80})});
  face('back',(x,c,k)=>{P.reg('back','name',logo(x,c,W/2,22,.8));
    const fact=[['Milk has calcium and vitamin D. They help build strong bones and teeth.',false]],fh=para(x,c,fact,14,0,67,5,INK,{center:1,lh:1.22,dry:1})[3]/k;
    rr(x,c,9,44,77,fh+28,5,LB);pt(x,c,'Did you know?',W/2,55,6.8,BL,{w:800});para(x,c,fact,14,64,67,5,INK,{center:1,lh:1.22});
    art(x,c,'cow',W/2,(44+fh+28+122.8)/2,22);
    P.reg('back','upc',upc(x,c,27,124,41,24,'07134231250'));
    pt(x,c,'Sunny Fields Farms, Springfield',W/2,170,3,INK,{n:1,w:700})});
  face('left',(x,c,k)=>{P.reg('left','name',logo(x,c,W/2,24,.8));
    P.reg('left','name',pt(x,c,'2% MILK',W/2,74,15,BL,{w:800,max:80}));pt(x,c,'REDUCED FAT',W/2,90,4.6,INK,{n:1,w:900,ls:.12});
    recycle(x,c,W/2,128,8.5,GRN);pt(x,c,'Please recycle this carton.',W/2,145,3.6,INK,{n:1,w:800})});
  const X=MM(W)/2,Z=MM(D)/2,Ht=MM(H),Gt=MM(G);
  const roof=(n,p,draw)=>{const c=cv(W,SLOPE,14),x=c.getContext('2d'),k=c.k;x.fillStyle=PAPER;x.fillRect(0,0,c.width,c.height);x.fillStyle=BL;x.fillRect(0,c.height-2.6*k,c.width,2.6*k);
    if(draw)draw(x,c,k);if(pr[n])printOn(P,x,c,n,pr[n]);addQuad(P,n,p,c)};
  roof('roofF',[V(-X,Ht,Z),V(X,Ht,Z),V(X,Ht+Gt,0),V(-X,Ht+Gt,0)],(x,c)=>{P.reg('roofF','name',logo(x,c,W/2,SLOPE*.5,.62))});
  roof('roofB',[V(X,Ht,-Z),V(-X,Ht,-Z),V(-X,Ht+Gt,0),V(X,Ht+Gt,0)]);
  const tri=p=>{const c=cv(D,G,5),x=c.getContext('2d');x.fillStyle='#F7FAFD';x.fillRect(0,0,c.width,c.height);const m=new THREE.Mesh(quadGeo(p),mat(c));m.userData.face='';g.add(m)};
  tri([V(X,Ht,Z),V(X,Ht,-Z),V(X,Ht+Gt,0),V(X,Ht+Gt,0)]);tri([V(-X,Ht,-Z),V(-X,Ht,Z),V(-X,Ht+Gt,0),V(-X,Ht+Gt,0)]);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(MM(W),MM(12),MM(3)),new THREE.MeshLambertMaterial({color:'#F2F6FB'}));fin.position.set(0,Ht+Gt+MM(6),0);fin.userData.face='';g.add(fin);
  {const c=cv(W,D,pr.bottom?14:4),x=c.getContext('2d');x.fillStyle='#EEF2F7';x.fillRect(0,0,c.width,c.height);if(pr.bottom)printOn(P,x,c,'bottom',pr.bottom);addQuad(P,'bottom',Q.bottom,c)}
  P.cy=MM(H+G)/2;P.el=.3;P.noun='milk';P.where={roofB:'top',bottom:'bottom'}[P.spot]||'carton';return P}

/* ---- condensed soup can: 66 mm across, 101 mm tall; the label goes once round (207 mm). Brand: Simmer & Spoon (invented) ---- */
const SOUP_NF={serv:'About 2.5 servings per container',size:'½ cup (120mL)',cal:'90',
  rows:[['Total Fat','0g','0%'],['Sodium','480mg','21%'],['Total Carbohydrate','20g','7%'],['Total Sugars','12g','',1,false],['Protein','2g','']],
  vit:[['Vitamin D','0mcg','0%'],['Calcium','20mg','2%'],['Iron','0.8mg','4%'],['Potassium','310mg','6%']]};
function can(pr,price){const D=66,H=101,r=MM(D/2),P=newPkg('soup'),L=Math.PI*D,F=L/2;
  const RED='#C2302A',RED2='#9E231F',CREAM='#FFF6E6',GOLD='#E2A93A',INK='#5A1A14',PALE='#FFE6B5';
  const c=cv(L,H,9),x=c.getContext('2d'),k=c.k;x.fillStyle=CREAM;x.fillRect(0,0,c.width,c.height);
  {const gr=x.createLinearGradient(0,0,0,50*k);gr.addColorStop(0,RED);gr.addColorStop(1,RED2);x.fillStyle=gr;x.fillRect(0,0,c.width,50*k)}
  x.fillStyle=GOLD;x.fillRect(0,50*k,c.width,2.2*k);x.fillRect(0,3.4*k,c.width,.8*k);x.fillRect(0,c.height-3*k,c.width,.8*k);
  /* the front (centre F) */
  P.reg('label','name',pt(x,c,'Simmer & Spoon',F,10.5,6,PALE,{w:700}));
  P.reg('label','name',pt(x,c,'TOMATO',F,26,15.5,'#fff',{w:800,ls:.02}));
  P.reg('label','name',pt(x,c,'SOUP',F,41.5,8.6,PALE,{w:800,ls:.42}));
  art(x,c,'soup',F+2,76.5,47);
  rr(x,c,F-41,56,20,6.4,3.2,RED);pt(x,c,'CONDENSED',F-31,59.3,2.5,'#fff',{n:1,w:900,ls:.06});
  P.reg('label','weight',pt(x,c,'NET WT 10.75 OZ (305g)',F-24,96.6,2.6,INK,{n:1,w:900}));
  /* the right side: how to heat it */
  pt(x,c,'Simmer & Spoon',L*.745,22,4.4,PALE,{w:700});
  pt(x,c,'TO HEAT',L*.74,60,3.4,RED,{n:1,w:900,ls:.1});
  para(x,c,[['Stir 1 can of soup and 1 can of water in a pot. Heat, stirring often.',false]],L*.74-14,64.5,28,2.5,INK,{center:1});
  /* the back: nutrition facts and the bar code on the right of the seam, the ingredients on the left (the date stamp goes under them) */
  P.reg('label','nutrition',nfacts(x,c,L-38,6,35,SOUP_NF,.6));
  P.reg('label','upc',upc(x,c,L-36,64,27,18,'05143900251'));
  pt(x,c,'Simmer & Spoon',L*.13,16,4.4,PALE,{w:700});
  para(x,c,[['INGREDIENTS: ',true],['TOMATO PUREE (WATER, TOMATO PASTE), WATER, SUGAR, SALT, BASIL, ONION POWDER, GARLIC POWDER, CITRIC ACID.',false]],4,57,32,2.2,INK);
  para(x,c,[['Simmer & Spoon Kitchens, Springfield',false]],L-37,87.5,29,2.2,INK,{center:1});
  if(price)P.reg('label','price',priceDot(x,c,70,76,9,price));
  if(pr.label)printOn(P,x,c,'label',pr.label);
  /* the label wraps the can: canvas x 0..W goes once around, starting at the back (theta = pi); the front (+Z) is at x = W/2 */
  const side=new THREE.Mesh(new THREE.CylinderGeometry(r,r,MM(H),128,1,true,Math.PI),mat(c));side.position.y=MM(H)/2;
  const th=px=>Math.PI+px/c.width*Math.PI*2;
  addFace(P,'label',side,c,{curved:true,map:(px,py)=>{const t=th(px);return V(r*Math.sin(t),MM(H)*(1-py/c.height),r*Math.cos(t))},
    frame:px=>{const t=th(px);return{r:V(Math.cos(t),0,-Math.sin(t)),u:V(0,1,0),n:V(Math.sin(t),0,Math.cos(t))}}});
  /* the steel ends: brushed metal with the rings a real lid has */
  const disc=(name)=>{const cc=cv(D,D,pr[name]?31:8),y=cc.getContext('2d'),s=cc.width;
    const gr=y.createRadialGradient(s*.42,s*.4,s*.05,s/2,s/2,s/2);gr.addColorStop(0,'#EEF1F4');gr.addColorStop(.62,'#D3D8DE');gr.addColorStop(.9,'#BAC0C8');gr.addColorStop(1,'#9AA1AB');y.fillStyle=gr;y.fillRect(0,0,s,s);
    y.strokeStyle='rgba(84,90,102,.5)';[.475,.45,.4,.33].forEach((f,i)=>{y.lineWidth=cc.k*(i?.35:.6);y.beginPath();y.arc(s/2,s/2,s*f,0,7);y.stroke()});
    y.strokeStyle='rgba(255,255,255,.55)';[.462,.392].forEach(f=>{y.lineWidth=cc.k*.35;y.beginPath();y.arc(s/2,s/2,s*f,Math.PI*1.05,Math.PI*1.7);y.stroke()});
    if(pr[name])printOn(P,y,cc,name,pr[name]);return cc};
  const tc=disc('top'),top=new THREE.Mesh(new THREE.CircleGeometry(r,128),mat(tc));top.rotation.x=-Math.PI/2;top.position.y=MM(H);
  addFace(P,'top',top,tc,{ring:1,map:(px,py)=>V((px/tc.width-.5)*2*r,MM(H),-(.5-py/tc.height)*2*r),frame:()=>({r:V(1,0,0),u:V(0,0,-1),n:V(0,1,0)})});
  const bc=disc('bottom'),bot=new THREE.Mesh(new THREE.CircleGeometry(r,128),mat(bc));bot.rotation.x=Math.PI/2;
  addFace(P,'bottom',bot,bc,{ring:1,map:(px,py)=>V((px/bc.width-.5)*2*r,0,(.5-py/bc.height)*2*r),frame:()=>({r:V(1,0,0),u:V(0,0,1),n:V(0,-1,0)})});
  P.faces.top.ring=P.faces.bottom.ring=true;
  /* the rolled steel rims at both ends (not tappable) */
  const rimM=new THREE.MeshLambertMaterial({color:'#C9CED6'});[0,MM(H)].forEach(yy=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r-MM(.4),MM(1.1),10,96),rimM);t.rotation.x=Math.PI/2;t.position.y=yy;t.userData.face='';P.group.add(t)});
  P.cy=MM(H)/2;P.el=.2;P.where={bottom:'bottom',top:'top',label:'label'}[P.spot]||'can';return P}

/* ---- 12 oz cereal box: 193 x 284 x 66 mm. Brand: Bright Morning (invented) ---- */
const CEREAL_NF={serv:'About 12 servings per container',size:'1 cup (28g)',cal:'110',
  rows:[['Total Fat','2g','3%'],['Saturated Fat','0g','0%',1,false],['Trans Fat','0g','',1,false],['Cholesterol','0mg','0%'],['Sodium','140mg','6%'],
    ['Total Carbohydrate','22g','8%'],['Dietary Fiber','3g','11%',1,false],['Total Sugars','6g','',1,false],['Protein','3g','']],
  vit:[['Vitamin D','2mcg','10%'],['Calcium','100mg','8%'],['Iron','8mg','45%'],['Potassium','110mg','2%']]};
function cereal(pr,price){const R=rng(21),W=193,H=284,D=66,P=newPkg('cereal'),Q=boxQuads(MM(W),MM(H),MM(D));
  const Y1='#FFD34D',Y2='#FFC531',BLU='#2C62B4',BRN='#6B3210',RED='#D7372C',CRM='#FFF5D9',GRN='#3E9A4F';
  const face=(n,fw,fh,draw,ppm)=>{const c=cv(fw,fh,ppm||6),x=c.getContext('2d'),k=c.k;x.fillStyle=Y1;x.fillRect(0,0,c.width,c.height);draw(x,c,k);if(pr[n])printOn(P,x,c,n,pr[n]);addQuad(P,n,Q[n],c)};
  /* the brand: a red rounded badge with a small sun */
  const brand=(x,c,cx,cy,s)=>{const b=rr(x,c,cx-30*s,cy-8.5*s,60*s,17*s,8.5*s,RED);const k=c.k;
    x.save();x.fillStyle=Y1;x.beginPath();x.arc((cx-21.5*s)*k,(cy+.2*s)*k,3.6*s*k,0,7);x.fill();x.strokeStyle=Y1;x.lineWidth=.9*s*k;x.lineCap='round';
    for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo((cx-21.5*s)*k+Math.cos(a)*4.9*s*k,(cy+.2*s)*k+Math.sin(a)*4.9*s*k);x.lineTo((cx-21.5*s)*k+Math.cos(a)*6.4*s*k,(cy+.2*s)*k+Math.sin(a)*6.4*s*k);x.stroke()}x.restore();
    pt(x,c,'Bright Morning',cx+6.5*s,cy+.8*s,7.6*s,'#fff',{w:800,max:40*s});return b};
  face('front',W,H,(x,c,k)=>{
    /* sun rays from behind the bowl */
    const ox=W/2*k,oy=176*k;for(let i=0;i<28;i++){const a0=i/28*Math.PI*2,a1=(i+.5)/28*Math.PI*2;x.fillStyle=Y2;x.beginPath();x.moveTo(ox,oy);x.lineTo(ox+Math.cos(a0)*400*k,oy+Math.sin(a0)*400*k);x.lineTo(ox+Math.cos(a1)*400*k,oy+Math.sin(a1)*400*k);x.closePath();x.fill()}
    {const g2=x.createRadialGradient(ox,oy,10*k,ox,oy,120*k);g2.addColorStop(0,'rgba(255,250,225,.95)');g2.addColorStop(1,'rgba(255,250,225,0)');x.fillStyle=g2;x.fillRect(0,0,c.width,c.height)}
    P.reg('front','name',brand(x,c,W/2,20,1));
    P.reg('front','name',pt(x,c,'HONEY',W/2,47,15,RED,{w:800,ls:.3,st:['#fff',1.6]}));
    P.reg('front','name',pt(x,c,'OAT RINGS',W/2,77,38,BRN,{w:800,max:180,st:['#fff',2.4]}));
    art(x,c,'cereal',W/2,182,150);
    pt(x,c,'Serving suggestion',W/2+52,242,2.6,BRN,{n:1,w:700});
    /* badges */
    x.save();x.fillStyle=GRN;x.beginPath();x.arc(34*k,118*k,17*k,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=.8*k;x.beginPath();x.arc(34*k,118*k,15*k,0,7);x.stroke();x.restore();
    pt(x,c,'WHOLE',34,111.5,5,'#fff',{w:800});pt(x,c,'GRAIN',34,118,5,'#fff',{w:800});pt(x,c,'OATS',34,124.6,5,'#fff',{w:800});
    x.fillStyle=BLU;x.fillRect(0,258*k,c.width,26*k);x.fillStyle='#fff';x.fillRect(0,257*k,c.width,1.2*k);
    P.reg('front','weight',pt(x,c,'NET WT 12 OZ (340g)',10,271,5.4,'#fff',{a:'left',n:1,w:900}));
    pt(x,c,'Good source of fiber',W-10,271,5.4,'#FFE38A',{a:'right',n:1,w:900});
    if(price)P.reg('front','price',priceDot(x,c,W*.82,H*.42,14,price))});
  face('right',D,H,(x,c,k)=>{x.fillStyle=BLU;x.fillRect(0,258*k,c.width,26*k);
    const nb=P.reg('right','nutrition',nfacts(x,c,4,8,D-8,CEREAL_NF,1)).box,iy=nb[3]/k+5;
    const ib=para(x,c,[['INGREDIENTS: ',true],['WHOLE GRAIN OATS, SUGAR, HONEY, CORN STARCH, SALT. VITAMIN E ADDED TO KEEP IT FRESH.',false]],4.5,iy,D-9,2.6,BRN);
    /* the note box fits its words and sits in the middle of the space left above the blue band */
    const msg=[['Start your day with a bowl of Honey Oat Rings, cold milk and fruit.',false]],th=para(x,c,msg,10,0,D-20,3.6,BRN,{center:1,lh:1.25,dry:1})[3]/k,
      bh=th+23,by=Math.max(ib[3]/k+8,(ib[3]/k+258-bh)/2);
    rr(x,c,5,by,D-10,bh,5,'#fff');pt(x,c,'Good morning!',D/2,by+9,6.4,RED,{w:800});
    para(x,c,msg,10,by+16,D-20,3.6,BRN,{center:1,lh:1.25})});
  face('left',D,H,(x,c,k)=>{x.fillStyle=BLU;x.fillRect(0,258*k,c.width,26*k);
    P.reg('left','name',brand(x,c,D/2,22,.92));
    P.reg('left','name',pt(x,c,'OAT RINGS',D/2,108,24,BRN,{w:800,rot:-Math.PI/2,st:['#fff',1.4]}));
    pt(x,c,'HONEY',D/2+19.5,108,6.4,RED,{w:800,rot:-Math.PI/2,ls:.25});
    para(x,c,[['Bright Morning Foods',true],[' Springfield',false]],6,186,D-12,2.6,BRN,{center:1})});
  face('back',W,H,(x,c,k)=>{x.fillStyle=CRM;x.fillRect(0,0,c.width,c.height);x.fillStyle=BLU;x.fillRect(0,258*k,c.width,26*k);
    P.reg('back','name',brand(x,c,W/2,18,.9));
    pt(x,c,'MAZE TIME!',W/2,41,15,BRN,{w:800,st:['#fff',1.2]});pt(x,c,'Help the oat ring find the bowl.',W/2,55,5.2,BLU,{n:1,w:800});
    /* a real maze (a random walk that carves every cell), drawn in brown */
    const cols=8,rows=9,cw=16,mx=W/2-cols*cw/2,my=66,wall=[];for(let i=0;i<cols*rows;i++)wall.push([1,1,1,1]);const seen=new Set([0]),st=[0];
    while(st.length){const cur=st[st.length-1],cx=cur%cols,cy=Math.floor(cur/cols),nb=[[0,-1,0,2],[1,0,1,3],[0,1,2,0],[-1,0,3,1]].filter(([dx,dy])=>{const nx=cx+dx,ny=cy+dy;return nx>=0&&ny>=0&&nx<cols&&ny<rows&&!seen.has(ny*cols+nx)});
      if(!nb.length){st.pop();continue}const [dx,dy,a,b]=nb[Math.floor(R()*nb.length)],nx=(cy+dy)*cols+cx+dx;wall[cur][a]=0;wall[nx][b]=0;seen.add(nx);st.push(nx)}
    wall[0][3]=0;wall[cols*rows-1][1]=0;
    rr(x,c,mx-4,my-4,cols*cw+8,rows*cw+8,4,'#fff');x.save();x.strokeStyle=BRN;x.lineWidth=1.6*k;x.lineCap='round';x.beginPath();
    for(let i=0;i<cols*rows;i++){const X0=(mx+(i%cols)*cw)*k,Y0=(my+Math.floor(i/cols)*cw)*k,s=cw*k,w4=wall[i];
      if(w4[0]){x.moveTo(X0,Y0);x.lineTo(X0+s,Y0)}if(w4[1]){x.moveTo(X0+s,Y0);x.lineTo(X0+s,Y0+s)}if(w4[2]){x.moveTo(X0,Y0+s);x.lineTo(X0+s,Y0+s)}if(w4[3]){x.moveTo(X0,Y0);x.lineTo(X0,Y0+s)}}x.stroke();
    x.strokeStyle='#D9962B';x.lineWidth=2.6*k;x.beginPath();x.arc((mx-8)*k,(my+cw/2)*k,4*k,0,7);x.stroke();x.restore();
    art(x,c,'cereal',mx+cols*cw+15.5,my+rows*cw-cw/2,22);
    P.reg('back','upc',upc(x,c,W-58,224,44,20,'08423657003'))},6);
  face('bottom',W,D,(x,c,k)=>{brand(x,c,W/2,D/2,.9)},4);
  face('top',W,D,(x,c,k)=>{x.fillStyle=Y2;x.fillRect(0,0,c.width,1.2*k);x.fillRect(0,c.height-1.2*k,c.width,1.2*k);
    P.reg('top','name',brand(x,c,W-38,D/2,.75))},pr.top?20:6);
  P.cy=MM(H)/2;P.el=.24;P.where={top:'top flap',left:'side',bottom:'bottom'}[P.spot]||'box';return P}
const BUILD={milk,can,cereal};

/* ---------- the rounds (teacher plan, find-the-date-vizdev/PLAN.md). The same groups as Check the Date; each level turns one dial:
   L1 spin only, a month word stamped on the package, one price sticker to look past;
   L2 spin and tip, inkjet BEST BY / USE BY / EXP on a bottom or a top, with a factory code under it;
   L3 drag it any way, inkjet lines that mix the date with a time, a line number and a factory code.
   Every round is a different package and a different place for the date (general-case teaching). Round 1 is the one an adult does with the student (the v3 pictures show no pill for it, so there is none). ---------- */
const LEVELS=[
  {name:'Level 1',cross:false,drag:false,rounds:[
    {pk:'milk',spot:'roofB',fmt:'stamp',price:'$3.48'},
    {pk:'cereal',spot:'left',fmt:'stamp',price:'$4.97'},
    {pk:'can',spot:'label',fmt:'stamp',price:'$1.29'}]},
  {name:'Level 2',cross:true,drag:false,rounds:[
    {pk:'can',spot:'bottom',kw:'BEST BY',fmt:'MON DD YYYY',price:'$1.29'},
    {pk:'cereal',spot:'top',kw:'USE BY',fmt:'MON DD YYYY',price:'$4.97'},
    {pk:'milk',spot:'bottom',kw:'EXP',fmt:'MON DD YYYY',price:'$3.48'}]},
  {name:'Level 3',cross:true,drag:true,rounds:[
    {pk:'cereal',spot:'top',kw:'BEST IF USED BY',fmt:'DDMONYYYY',price:'$4.97',start:[.32,-.6]},
    {pk:'can',spot:'bottom',kw:'BEST BY',fmt:'MM/DD/YY',price:'$1.29',start:[.17,.35]},
    {pk:'milk',spot:'roofB',kw:'EXP',fmt:'DDMONYY',price:'$3.48',start:[0,.35]}]},
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
/* Check it (approved 11/19): every level mixes dates that are still good with dates that are past, at least one of each, never
   today. Levels 1 and 2 keep the date in this year, because their calendar shows this year (and Level 1 prints no year); Level 1
   takes another month than today's when it can, so the month pages answer it. Level 3 (the phone) reaches into the last or the
   next year only when this year has no day left for its answer. On the first or last days of a year a round that cannot have
   its answer takes the other one. */
function makeRounds(L,today,rnd){if(LEVELS[L].l4)return rounds4(today,rnd);const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
  const shuffle=a=>{a=a.slice();for(let k=a.length-1;k>0;k--){const j=Math.floor(rnd()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
  const RS=LEVELS[L].rounds,want=shuffle([true,false].concat(RS.slice(2).map(()=>rnd()<.5)));   /* true = still good */
  const Y=today.getFullYear(),M=today.getMonth(),span=[[3,45],[2,45],[1,75]][L];
  const pool=good=>{const all=[];for(let k=span[0];k<=span[1];k++)all.push(new Date(Y,M,today.getDate()+(good?k:-k)));
    return [all.filter(d=>d.getFullYear()===Y&&(L>0||d.getMonth()!==M)),all.filter(d=>d.getFullYear()===Y)].concat(L===2?[all]:[]).find(t=>t.length)||[]};
  return RS.map((rd,idx)=>{let good=want[idx],days=pool(good);if(!days.length){good=!good;days=pool(good)}
    for(let n=0;n<80;n++){
      const d=days[Math.floor(rnd()*days.length)],day=d.getDate();
      /* round 1 keeps the approved viz dev's codes (14:32, 0522) when they fit this date */
      let hh=idx===0&&n===0?14:ri(6,22),mi=idx===0&&n===0?32:ri(0,59),cm=idx===0&&n===0?5:ri(1,12),cd=idx===0&&n===0?22:ri(1,28);
      if(hh===day)continue;
      if(cm-1===d.getMonth()||cm-1===today.getMonth())continue;          /* a factory code never reads as this date or as today */
      const tm=p2(hh)+':'+p2(mi),code=p2(cm)+p2(cd),ds=dateText(rd.fmt,d),pr={};pr[rd.spot]=printSpec(L,rd,ds,code,tm);
      return {L,idx,rd,date:d,ds,pr,good,price:rd.price,choices:[{t:'Still good',ok:good,k:'good'},{t:'Expired',ok:!good,k:'bad'}],
        say:MONTH[d.getMonth()]+' '+day+(L===0?'':', '+d.getFullYear()),            /* the date in words, for the coaching line */
        clue:L===0?'<b>'+MON[d.getMonth()]+'</b>':'<b>'+rd.kw+'</b>',
        spoken:good?'Still good':'Expired',build:()=>BUILD[rd.pk](pr,rd.price)};
    }
    throw new Error('could not make round '+(idx+1));
  })}
/* ---------- Level 4 comes from find/level4.js (the messy-dates thread), drawn with this kit (README: Level 4 contract) ---------- */
let L4MOD=null;
const KIT=()=>({rng,cv,paper,pencil,edge,txt,dots,barcode,sticker,nutrition,mat,tex,quadGeo,quadMap,quadFrame,boxQuads,MM,V,THREE,newPkg,addQuad,addFace,printOn,
  /* the print look of the redesigned packages (11/19): crisp type, a real UPC-A, the US Nutrition Facts panel, a round price sticker */
  pt,para,rr,upc,nfacts,priceDot,waveBand,snowflake,recycle,
  /* art(x,c,name,xm,ym,wm): a package picture from find/art/, its solid part wm mm wide, centred at (xm,ym); null if it did not load */
  art});
/* level4.js and its look, level4.css (every rule under #find .fd-l4), load the first time someone picks Level 4 */
function loadCSS4(){return new Promise(ok=>{if(document.querySelector('link[data-fd-l4]'))return ok();const l=document.createElement('link');l.rel='stylesheet';
  l.href=new URL('level4.css',HERE).href;l.setAttribute('data-fd-l4','');l.onload=()=>ok();l.onerror=()=>{console.error('Find the Date: level4.css could not load.');ok()};document.head.appendChild(l)})}
async function loadL4(){if(!L4MOD){const r=await Promise.all([import(new URL('level4.js',HERE).href),loadCSS4()]);
    /* Level 4's own package pictures: level4.js may export art = {name: {file: 'name.webp', trim: [x0,y0,x1,y1]}} (files in find/art/,
       trim = the solid box in the 600 px file). They load here, before any build(), so kit.art() can draw them */
    const A=r[0].art;if(A&&typeof A==='object'){for(const n of Object.keys(A))if(!ART_FILES[n]&&A[n]&&A[n].file){ART_FILES[n]=A[n].file;ART_TRIM[n]=A[n].trim||[0,0,600,600]}await loadArt()}
    L4MOD=r[0]}return L4MOD}
/* Level 4 checks its dates too (Check it, with the phone) once level4.js gives every round until: the last day the food is good
   ('YYYY-MM-DD'; for a month and a year only, the last day of that month), never today. say (optional) is the date in words for
   the coaching line, else the round's right Say it choice. Until then Level 4 says the date (Say it). */
const dayOf=v=>{if(v instanceof Date&&!isNaN(v))return new Date(v.getFullYear(),v.getMonth(),v.getDate());const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof v==='string'?v:'');return m?new Date(+m[1],+m[2]-1,+m[3]):null};
function rounds4(today,rnd){const kit=KIT(),rs=L4MOD.rounds(kit,{today,rand:rnd});
  const chk=rs.length>0&&rs.every(r=>{const d=dayOf(r.until);return d&&d.getTime()!==today.getTime()});
  return rs.map((r,idx)=>{const right=r.choices.find(c=>c.ok);if(!right)throw new Error('Level 4 round '+(idx+1)+' has no right answer');
    const d=chk?dayOf(r.until):null,good=chk?d>today:null;
    return{L:3,idx,rd:{start:r.start||null,kw:r.kw||null},date:d,good,say:chk?String(r.say||right.t):'',ds:r.dateText,
      choices:chk?[{t:'Still good',ok:good,k:'good'},{t:'Expired',ok:!good,k:'bad'}]:r.choices.map(c=>({t:c.t,ok:!!c.ok,coach:c.coach||'',src:c.ok?'':(c.src||'date')})),
      clue:r.clue||'the <b>date</b>',spoken:chk?(good?'Still good':'Expired'):right.t,parts:r.parts||null,month:r.month||'',prompt:r.prompt||'Find the date<br><b>to check.</b>',
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
  let CHK=false,alive=true,level=clampI(o.level,0,LEVELS.length-1),round=clampI(o.round,0,LEVELS[clampI(o.level,0,LEVELS.length-1)].l4?5:2),ROUNDS=[],RD=null,P=null,won=new Set(),timers=[],raf=0,tw=null,bigWinOn=false,lastU=0;
  const S={step:'find',q:new THREE.Quaternion(),qSay:null,zoom:false,easy:false,misses:0,found:null,dateTapped:false,dragged:false,ans:null,full:false,missed:false,sup:false,mark:'',vready:0,tick:0};
  const later=(ms,f)=>{const t=setTimeout(()=>{timers=timers.filter(x=>x!==t);if(alive)f()},ms);timers.push(t);return t};
  const clearTimers=()=>{timers.forEach(clearTimeout);timers=[]};

  /* ---------- the page: words (layer 1) < package (2) < outlines (3) < buttons (4) < level done (5). Check it adds today's date under
     the prompt (words), and on the right the calendar strip over a plain panel that hides the package under it, or the phone ---------- */
  el.innerHTML='<div class="fd-root">'+
    '<div class="fd-stripL"><span class="name">Find the Date!</span><span class="lvl"></span><span class="fd-steps"></span></div>'+
    '<div class="fd-hudL"><div class="stamps fd-stamps" aria-label="Rounds"></div><h1 class="fd-prompt"></h1><div class="fd-today" hidden></div><div class="fd-look"></div><div class="fd-inset" hidden><canvas></canvas><svg aria-hidden="true"></svg><span class="fd-cap2"></span></div></div>'+
    '<div class="fd-hudR" aria-live="polite"></div>'+
    '<div class="fd-stage" role="img"></div><div class="fd-calbg" aria-hidden="true"></div><svg class="fd-ov" aria-hidden="true"></svg>'+
    '<div class="fd-cal" role="img" hidden></div><div class="fd-phone" hidden></div>'+
    '<div class="fd-tools"><button class="tool fd-easy" aria-pressed="false">Easier</button><button class="tool fd-skip">Skip</button><button class="tool snd" aria-pressed="'+E.loud()+'">Sound</button></div>'+
    '<button class="nav fd-back">Back</button><div class="fd-ctl"></div>'+
    '<div class="fd-answers wait" hidden><p class="fd-qq">What does the date say?</p><div class="fd-ans"></div></div>'+
    '<button class="nav next fd-next" hidden>Next</button>'+
    '<div class="fd-hand gone" aria-hidden="true">'+HAND+'</div>'+
    '<div class="lvdone fd-done" hidden><h1></h1><div class="stars"></div><p class="rule">Now find the date on a <b>real package</b>.</p>'+
    '<div class="btns"><button class="nav fd-levels">Pick a level</button><button class="nav fd-again">Play again</button><button class="nav next fd-nextlv">Level 2</button></div></div></div>';
  const q=s=>el.querySelector(s);
  const root=q('.fd-root'),stripL=q('.fd-stripL'),lvlEl=q('.lvl'),stampsEl=q('.fd-stamps'),stepsEl=q('.fd-steps'),hudL=q('.fd-hudL'),prompt=q('.fd-prompt'),look=q('.fd-look'),
    inset=q('.fd-inset'),hudR=q('.fd-hudR'),stage=q('.fd-stage'),ov=q('.fd-ov'),tools=q('.fd-tools'),easyB=q('.fd-easy'),skipB=q('.fd-skip'),sndB=q('.snd'),
    backB=q('.fd-back'),ctl=q('.fd-ctl'),answers=q('.fd-answers'),qqEl=q('.fd-qq'),ansRow=q('.fd-ans'),nextB=q('.fd-next'),hand=q('.fd-hand'),doneV=q('.fd-done'),
    todayEl=q('.fd-today'),calEl=q('.fd-cal'),phoneEl=q('.fd-phone');

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
  /* ---------- the package hangs in space (the feel of the Fun Friday title: heavy, springy, a slow bob). A finger or the mouse on
     the package pushes it back a little and it springs home when let go; a turn by hand keeps going and slows to a stop.
     Less motion (calm): none of it. Only place() adds these, so every fit and measure sees the package at home. ---------- */
  const PH={dip:0,dv:0,held:false,spin:null,t:0,last:0,drawn:0,off:false},phT=new THREE.Vector3();
  const floatOn=()=>alive&&!!P&&doneV.hidden&&!document.hidden&&!PH.noFloat&&!E.still();
  const place=()=>{if(PH.off||!(PH.dip||floatOn())){placeAt(view.tgt,view.d,view.el);return}
    phT.copy(view.tgt);phT.y+=view.d*.0017*Math.sin(PH.t*.95);phT.x+=view.d*.0007*Math.sin(PH.t*.61+1.3);placeAt(phT,view.d*(1+PH.dip),view.el)};
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
    [stripL,stampsEl,tools,prompt,look,backB,ctl].forEach(e=>{if(e.hidden)return;const r=e.getBoundingClientRect();if(r.width&&r.height){const q=[r.left-p,r.top-p,r.right+p,r.bottom+p];q.nm=e.className.split(' ').pop();out.push(q)}});
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
  function frame(now){raf=0;if(!alive||!P)return;const dt=Math.min(.2,Math.max(0,(now-(PH.last||now))/1000));PH.last=now;
    if(tw){const t=tw.dur>0?Math.min(1,(now-tw.t0)/tw.dur):1,e=1-Math.pow(1-t,3);
      pivot.quaternion.slerpQuaternions(tw.q0,tw.q1,e);view.tgt.lerpVectors(tw.v0.tgt,tw.v1.tgt,e);view.d=tw.v0.d*Math.pow(tw.v1.d/tw.v0.d,e);view.el=tw.v0.el+(tw.v1.el-tw.v0.el)*e;
      if(t>=1){const f=tw.done;tw=null;if(f)f()}}
    const mv=phStep(dt),fl=floatOn();if(fl)PH.t+=dt;
    if(tw||mv||!fl||now-PH.drawn>=30){draw();PH.drawn=now}if(tw||mv||fl)kick()}
  /* one step of the physics: the spin that keeps going after a turn by hand (it slows down, as if the air held it), and the
     spring that pushes the package back while pressed and brings it home with a small bounce */
  function phStep(dt){let mv=false;const s=PH.spin;
    if(s){if(S.step!=='find'||ptr)PH.spin=null;else{const L=LEVELS[level],lim=L.drag?1.75:L.cross?Math.PI/2:0;
      S.q.multiply(new THREE.Quaternion().setFromAxisAngle(AY,s.vs*dt));
      if(lim&&s.vt){const t=tiltOf(S.q),nt=Math.max(-lim,Math.min(lim,t+s.vt*dt));if(nt===lim||nt===-lim)s.vt=0;S.q.premultiply(new THREE.Quaternion().setFromAxisAngle(AX,nt-t))}
      pivot.quaternion.copy(S.q);const f=Math.exp(-dt/.36);s.vs*=f;s.vt*=f;
      if(Math.hypot(s.vs,s.vt)<.1){PH.spin=null;turnTo(360)}else mv=true}}
    const tg=PH.held&&!E.still()?.05:0;
    if(PH.held||Math.abs(PH.dip-tg)>2e-4||Math.abs(PH.dv)>2e-3){const n=Math.max(1,Math.ceil(dt/.004)),h=dt/n,w=15,z=.42;
      for(let i=0;i<n;i++){PH.dv+=(-w*w*(PH.dip-tg)-2*z*w*PH.dv)*h;PH.dip+=PH.dv*h}mv=true}
    else{PH.dip=tg;PH.dv=0}
    return mv}
  function draw(){pivot.updateMatrixWorld(true);place();if(shadow.visible)shadowFit();renderer.render(scene,cam);drawOv()}
  function moveTo(q1,v1,dur,done){PH.spin=null;tw={t0:performance.now(),dur:E.still()?0:dur,q0:pivot.quaternion.clone(),q1:q1.clone(),v0:{tgt:view.tgt.clone(),d:view.d,el:view.el},v1,done};kick()}

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
  function steps(n){stepsEl.innerHTML='<span class="fd-step '+(n>1?'done':'now')+'">1 Find it</span><span class="fd-sep" aria-hidden="true">›</span><span class="fd-step'+(n===2?' now':'')+'">2 '+(CHK?'Check it':'Say it')+'</span>'}
  /* the round stamps (the game's .stamp look): a number per round, the round on now in blue, a star for each round won;
     a right answer sends the engine's star flying from the answer to its stamp (the engine's flyStar, drawn here because
     the engine's own one is tied to the game's strip) */
  let flyEl=null;
  function stampRow(land){const art=E.starArt();stampsEl.innerHTML=ROUNDS.map((_,k)=>'<span class="stamp'+(won.has(k)?' done'+(art?' art':''):'')+(k===round?' now':'')+(k===land?' land':'')+'">'+(won.has(k)?E.star():(k+1))+'</span>').join('')}
  function flyStar(from,k){if(flyEl){flyEl.remove();flyEl=null}const tgt=stampsEl.children[k];
    if(E.still()||!tgt||!from||!from.animate){stampRow();return}
    const mid=e=>{const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]},[sx,sy]=mid(from),[ex,ey]=mid(tgt),U=E.u(),s=document.createElement('span');
    s.className='fly';s.innerHTML=E.star();s.style.left=sx+'px';s.style.top=sy+'px';document.body.appendChild(s);flyEl=s;
    const an=s.animate([{transform:'translate(-50%,-50%) scale(.3) rotate(0deg)'},{transform:'translate(-50%,calc(-50% - '+U*9+'px)) scale(1.6) rotate(30deg)',offset:.35},
      {transform:'translate(calc(-50% + '+(ex-sx)+'px),calc(-50% + '+(ey-sy)+'px)) scale(.55) rotate(360deg)'}],{duration:900,easing:'ease-in-out'});
    an.onfinish=()=>{s.remove();if(flyEl===s)flyEl=null;if(alive&&won.has(k))stampRow(k)}}
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
  function showRound(){clearTimers();tw=null;PH.spin=null;PH.held=false;PH.dip=PH.dv=0;clearOv();disposePkg();bubble();
    RD=ROUNDS[round];P=RD.build();P.group.position.y=-P.cy;pivot.add(P.group);P.group.updateMatrix();P.hull=[];
    P.group.children.forEach(m=>{if(!m.isMesh)return;m.updateMatrix();const a=m.geometry.attributes.position;for(let n=0;n<a.count;n++)P.hull.push(new THREE.Vector3().fromBufferAttribute(a,n).applyMatrix4(m.matrix))});
    Object.assign(S,{step:'find',zoom:false,easy:false,misses:0,found:null,dateTapped:false,dragged:false,ans:null,qSay:null,amber:null,chunkOv:[],dashOv:[],src:null,zoomInfo:'',
      full:false,missed:false,sup:false,mark:'',vready:0});S.tick++;
    const st=RD.rd.start;S.q=st?new THREE.Quaternion().setFromEuler(new THREE.Euler(st[0],st[1],0,'YXZ')):new THREE.Quaternion();
    root.classList.remove('say','zoomed','won','chk','cal','ph','go-in');root.classList.toggle('drag',!!LEVELS[level].drag);
    [todayEl,calEl,phoneEl].forEach(e=>{e.hidden=true;e.innerHTML=''});answers.classList.remove('fd-pop');ansRow.className='fd-ans';root.classList.toggle('fd-l4',!!LEVELS[level].l4);
    lvlEl.textContent=LEVELS[level].name;steps(1);stampRow();
    prompt.innerHTML=LEVELS[level].l4?RD.prompt:level<2?'Turn the '+P.noun+'.<br><b>Find the date.</b>':'Find the date<br><b>for shoppers.</b>';
    lookFind();inset.hidden=true;ctlBuild();ctl.hidden=false;answers.hidden=true;answers.classList.add('wait');ansRow.innerHTML='';qqEl.className='fd-qq';qqEl.textContent='What does the date say?';nextB.hidden=true;skipB.hidden=false;
    easyB.setAttribute('aria-pressed','false');stage.setAttribute('aria-label','A '+P.noun+' package. Turn it to find the date.');
    shadow.visible=true;pivot.quaternion.copy(S.q);setView(poseView(S.q,false));draw();kick();handHint();
    E.line('fd-q',prompt.innerHTML,450)}
  function goRound(n){E.quiet();if(n<0){exit();return}if(n>=ROUNDS.length){showDone();return}round=n;showRound();E.snd('whoosh')}
  function startLevel(n,r){if(LEVELS[n].l4&&!L4MOD){loadL4().then(()=>{if(alive)startLevel(n,r)},e=>{console.error('Find the Date: Level 4 could not load.',e);doneV.querySelector('.fd-nextlv').hidden=true});return}
    level=n;ROUNDS=makeRounds(n,today,rnd);CHK=ROUNDS.length>0&&ROUNDS.every(r=>typeof r.good==='boolean');won=new Set();round=Math.min(r||0,ROUNDS.length-1);doneV.hidden=true;stopBig();showRound()}

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
  function hitAt(x,y){PH.off=true;place();ndc.set(x/W()*2-1,-(y/H())*2+1);ray.setFromCamera(ndc,cam);let r=null;
    for(const h of ray.intersectObjects(P.group.children,false)){const face=h.object.userData.face;if(face===undefined)continue;if(!face||!h.uv){r={face:''};break}const f=P.faces[face];r={face,px:h.uv.x*f.W,py:(1-h.uv.y)*f.H};break}
    PH.off=false;place();return r}
  function near(list,h,mm){let best=null,bd=1e9;for(const r of list){if(r.face!==h.face)continue;const k=P.faces[r.face].k,b=r.box,dx=Math.max(b[0]-h.px,0,h.px-b[2]),dy=Math.max(b[1]-h.py,0,h.py-b[3]),d=Math.hypot(dx,dy);if(d<=mm*k&&d<bd){bd=d;best=r}}return best}
  stage.addEventListener('pointerdown',e=>{if(!P||!doneV.hidden)return;let caught=false;if(e.isPrimary){fingers.clear();pinch=null;ptr=null;root.classList.remove('dragging');caught=!!PH.spin;PH.spin=null;PH.held=false}
    fingers.set(e.pointerId,[e.clientX,e.clientY]);try{stage.setPointerCapture(e.pointerId)}catch(_){}
    if(!E.still()&&!PH.held&&hitAt(e.clientX,e.clientY)){PH.held=true;kick()}
    if(fingers.size>1){if(!pinch){if(ptr&&ptr.drag){root.classList.remove('dragging');if(S.step==='find')turnTo(320)}ptr=null;
      const [a,b]=[...fingers.values()];pinch={d0:Math.hypot(a[0]-b[0],a[1]-b[1])||1,done:false}}return}
    if(ptr||pinch)return;ptr={id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,drag:false,caught,samp:[[e.timeStamp||performance.now(),e.clientX,e.clientY]]}});
  stage.addEventListener('pointermove',e=>{if(fingers.has(e.pointerId))fingers.set(e.pointerId,[e.clientX,e.clientY]);
    if(pinch){if(!pinch.done&&fingers.size>1&&S.step==='find'){const [a,b]=[...fingers.values()],r=Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d0;
        if(S.zoom?r<.8:r>1.25){pinch.done=true;closer()}}return}
    if(!ptr||e.pointerId!==ptr.id)return;const dx=e.clientX-ptr.lx,dy=e.clientY-ptr.ly,L=LEVELS[level],sm=ptr.samp;
    {let ce=null;try{ce=e.getCoalescedEvents&&e.getCoalescedEvents()}catch(_){}for(const c of ce&&ce.length?ce:[e])sm.push([c.timeStamp||e.timeStamp||performance.now(),c.clientX,c.clientY]);
      const tn=sm[sm.length-1][0];while(sm.length>2&&tn-sm[0][0]>150)sm.shift()}
    if(!ptr.drag&&S.step==='find'&&Math.hypot(e.clientX-ptr.x,e.clientY-ptr.y)>10){ptr.drag=true;tw=null;S.q.copy(pivot.quaternion);S.dragged=true;handHint();root.classList.add('dragging')}
    if(ptr.drag){const k=Math.PI/(.6*W()),lim=L.drag?1.75:L.cross?Math.PI/2:0;S.q.multiply(new THREE.Quaternion().setFromAxisAngle(AY,dx*k));
      if(lim){const t=tiltOf(S.q),nt=Math.max(-lim,Math.min(lim,t+dy*k));S.q.premultiply(new THREE.Quaternion().setFromAxisAngle(AX,nt-t))}pivot.quaternion.copy(S.q);kick()}
    ptr.lx=e.clientX;ptr.ly=e.clientY});
  const endPtr=(e,cancel)=>{fingers.delete(e.pointerId);if(!fingers.size&&PH.held){PH.held=false;kick()}if(pinch){if(!fingers.size)pinch=null;return}
    if(!ptr||e.pointerId!==ptr.id)return;const p=ptr;ptr=null;root.classList.remove('dragging');
    if(p.drag){if(S.step!=='find')return;const v=cancel?null:fling(p,e.timeStamp||performance.now());PH.dbg=v?'spin':'still:'+PH.why;if(v){PH.spin=v;kick()}else turnTo(320);return}
    if(p.caught){if(S.step==='find')turnTo(320);return}if(!cancel)tap(e.clientX,e.clientY)};
  /* how fast the finger was moving when it let go (the last tenth of a second). A finger that stopped first leaves it still. */
  function fling(p,now){PH.why='';if(E.still()){PH.why='calm';return null}const sm=p.samp,b=sm[sm.length-1];if(!b||now-b[0]>70){PH.why='stopped '+(b?Math.round(now-b[0]):'-');return null}
    let i=sm.length-1;while(i>0&&b[0]-sm[i-1][0]<=100)i--;if(i===sm.length-1)i=Math.max(0,i-1);const a=sm[i],dt=(b[0]-a[0])/1000;if(dt<.008){PH.why='dt '+dt+' n '+sm.length;return null}
    const L=LEVELS[level],k=Math.PI/(.6*W());let vs=(b[1]-a[1])/dt*k,vt=L.drag||L.cross?(b[2]-a[2])/dt*k:0;const m=Math.hypot(vs,vt);
    if(m<.35){PH.why='slow '+m.toFixed(2);return null}if(m>6){vs*=6/m;vt*=6/m}return{vs,vt}}
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
  function found(ln){S.step='found';PH.spin=null;S.q.copy(pivot.quaternion);tw=null;
    const l4=!!LEVELS[level].l4,uni=ls=>[Math.min(...ls.map(l=>l.box[0])),Math.min(...ls.map(l=>l.box[1])),Math.max(...ls.map(l=>l.box[2])),Math.max(...ls.map(l=>l.box[3]))];
    const b=uni(P.lines.filter(l=>l.ok&&l.face===ln.face));
    /* Level 4 (approved pictures): the green outline goes round the date itself; the small picture in Say it marks the whole print */
    const dc=l4&&P.chunks.find(c=>c.kind==='date'&&c.face===ln.face);
    S.found={face:ln.face,box:dc?uni(P.lines.filter(l=>l.face===ln.face)):b};clearOv();S.amber=null;
    const it=outline({face:ln.face,box:dc?dc.box:b,style:'go',check:true,pad:l4?.6:1.4,chkOut:l4});
    bubble('go','You found it!','The date is '+whereHTML(P.where)+'.');E.snd('ding');handHint();
    later(60,()=>{if(it.chkAt)E.boom(it.chkAt[0],it.chkAt[1],28);else if(it.rect)E.boom(it.rect[2],it.rect[1],28)});later(1900,toSay)}
  function setEasy(on){S.easy=on;easyB.setAttribute('aria-pressed',String(on));clearOv(it=>it.style==='glow');ansRow.querySelectorAll('.soft').forEach(b=>b.classList.remove('soft'));
    /* Check it: Easier points at the date on the calendar (on Levels 3 and 4 it first brings the calendar in for the phone; off, the
       phone comes back). Once an answer was wrong, the calendar and its mark stay. Before the supports are in, toSay reads S.easy */
    if(CHK&&S.step!=='find'){if(S.sup&&!S.missed){if(level>=2&&on!==S.full){if(on)supFull();else supBack()}markDate(on?'hint':'')}return}
    if(!on)return;
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
    const hl=hudL.getBoundingClientRect(),st=stripL.getBoundingClientRect(),tl=tools.getBoundingClientRect(),w=W(),h2=H();
    /* the answer card's top (its layout box, so a card still dealing in counts where it lands); Check it keeps room for the
       two-line coaching line that grows the card upward, and keeps the print clear of the calendar strip or the phone */
    const an={top:answers.hidden?h2:answers.offsetTop-(CHK?U*6.6:0)},sr=chkR();
    let L,R,T,B,pts,v;
    /* the date's letter height on the screen, in px */
    const dc=cs.find(c=>c.kind==='date')||cs[0],lpx=()=>{const x=(dc.box[0]+dc.box[2])/2,y=(dc.box[1]+dc.box[3])/2,
      pa=f.map(x,y-h/2).applyMatrix4(P.group.matrixWorld).project(cam),pb=f.map(x,y+h/2).applyMatrix4(P.group.matrixWorld).project(cam);return Math.hypot((pa.x-pb.x)*w/2,(pa.y-pb.y)*h2/2)};
    if(C){/* Level 4: the round's own framing (level4.js close: points in mm round the print, seen at its pose), in .92 of the space the
         words leave free, as in the approved Level 4 pictures (the messy-dates README, rule 5) */
      const bu=hudR.querySelector('.fd-bubble'),br=bu?bu.getBoundingClientRect():null;
      L=-1+2*((C.clear==='strip'?Math.max(hl.right,st.right):hl.right)+U*2)/w;R=1-2*(U*2+sr)/w;T=1-2*Math.max(st.bottom+U*1.2,br?br.bottom+U*1.6:0)/h2;B=1-2*(an.top-U*1.6)/h2;
      pts=C.pts.map(p=>P.group.localToWorld(V(MM(p[0]),MM(p[1]),MM(p[2]))));v=fitCam(pts,.22,(R-L)/2*.92,(T-B)/2*.92,(L+R)/2,(B+T)/2);S.sayInfo='level 4 framing, letter '+(lpx()/h2*100).toFixed(1)+'%'}
    else{const b=[Math.min(...cs.map(c=>c.box[0]))-3*h,Math.min(...cs.map(c=>c.box[1]))-1.5*h,Math.max(...cs.map(c=>c.box[2]))+6.25*h,Math.max(...cs.map(c=>c.box[3]))+1.5*h];
      L=-1+2*(hl.right+U*2)/w;R=1-2*(U*2+sr)/w;T=1-2*(Math.max(st.bottom,tl.bottom)+U)/h2;B=-1+2*(h2-an.top+U*1.5)/h2;
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
    look.innerHTML='<span class="fd-lab">'+EYE+'Close look</span>';inset.hidden=false;S.ans=RD.choices;
    if(CHK){S.full=level>=2&&S.easy;prompt.innerHTML=chkPrompt();supLay();ansRow.className='fd-ans fd-yn';ansRow.innerHTML=vHTML();qqEl.className='fd-qq fd-why';qqEl.innerHTML=''}
    else{prompt.innerHTML=level===0?'Say the <b>date</b>.':'Tap the <b>date</b>.<br>Then say it.';ansRow.innerHTML=ansHTML();qqEl.className='fd-qq';qqEl.textContent='What does the date say?'}
    answers.hidden=false;answers.classList.add('wait');
    const C=LEVELS[level].l4&&RD.close;S.qSay=C?new THREE.Quaternion().setFromEuler(new THREE.Euler(C.rx||0,C.ry||0,0,'YXZ')):closePose(P.chunks.find(c=>c.kind==='date'));const v=sayView(S.qSay);
    setView(was);draw();E.snd('whoosh');
    moveTo(S.qSay,v,700,()=>{S.step='say';S.chunkOv=P.chunks.filter(c=>c.face===P.spot).map(c=>outline({face:c.face,box:c.box,style:'dash',pad:.9}));
      if(LEVELS[level].l4&&!CHK)srcRegs().forEach(r=>S.chunkOv.push(outline({face:r.face,box:r.box,style:'dash',pad:.9})));
      /* Check it: the date found in step 1 is marked here by itself, then the supports and the answers pop in */
      if(CHK){dateFound(true);supPop()}else if(level===0)dateFound(true);else if(S.easy)setEasy(true);E.line('fd-q',prompt.innerHTML,200)})}
  /* the date is found in the close look: every piece of the print gets its name; the answers deal in */
  function dateFound(auto){S.dateTapped=true;clearOv();S.amber=null;S.dashOv=[];const cs=P.chunks.filter(c=>c.face===P.spot),nl=P.nlines||1,l4=!!LEVELS[level].l4;
    cs.forEach(c=>{const isD=c.kind==='date';let side,gap;
      if(l4)[side,gap]=side4(c,cs);
      else{const row=cs.filter(x=>x.line===c.line),last=row[row.length-1]===c;side=nl===1?'right':c.line===nl-1?'below':c.line===0?(last?'right':'above'):'right'}
      const it=outline({face:c.face,box:c.box,style:isD?'go':'dash',check:isD,pad:.9,tag:c.tag||TAG[c.kind]||'',side,gap,tagCls:isD?'go':''});it.ch=c;S.dashOv.push(it)});
    if(l4)srcRegs().forEach(r=>{const it=outline({face:r.face,box:r.box,style:'dash',pad:.9,tag:r.what,side:'left'});it.rg=r;S.dashOv.push(it)});
    if(CHK)return;
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
  function pick(b){if(S.step!=='say'||!S.dateTapped||b.classList.contains('no')||b.classList.contains('amber')||(CHK&&performance.now()<S.vready))return;const a=S.ans[+b.dataset.i];E.line('fd-a',a.t);
    if(CHK)pickV(b,a);else pick4(b,a)}
  /* Level 4 Say it (approved tv-3 and tv-4): the coaching line is inside the answer card; a wrong pick turns amber and the
     parts of the date get small amber tags; the right pick turns green with the Fun Friday check stamp */
  function pick4(b,a){clearSrc();
    if(a.ok){S.step='won';const first=!won.has(round);won.add(round);b.classList.add('go','yes');ansRow.querySelectorAll('.fd-a.amber').forEach(x=>x.classList.remove('amber'));
      clearOv(it=>it.style==='glow'||it.style==='amber');bubble();
      qqEl.className='fd-qq go';qqEl.innerHTML='<span class="t">You got it!</span>'+(a.coach||'The date is <b>'+a.t+'</b>.');E.snd('win');
      const r=b.getBoundingClientRect();E.boom(r.left+r.width/2,r.top+r.height/2,first?90:40);nextB.hidden=false;skipB.hidden=true;root.classList.add('won');if(first)flyStar(b,round);else stampRow()}
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

  /* ---------- step 2, Check it (approved 11/19, layout A): is the date still good? The supports come in only once the date is
     found, with the game's deal-in, from the most help to the least: on Levels 1 and 2 today's date under the prompt and, on the
     right, the calendar strip (at most a quarter of the screen wide, the full height: this year's months as little calendar pages
     with the red bar of the big calendar, then this month); on Levels 3 and 4 the phone with today on it, and Easier or a wrong
     answer brings the calendar instead. Two big answers, Still good and Expired. A wrong one turns amber, the coaching line in the
     card says why, and the date is marked on the calendar; the right one gets the star. ---------- */
  const supCal=()=>CHK&&(level<2||S.full);
  /* how much of the screen's right side the close look keeps free for the strip or the phone (px) */
  function chkR(){if(!CHK)return 0;const U=E.u();return supCal()?W()*.25+U*2:U*33}
  function chkPrompt(){return (supCal()?'Look at today.':'Look at the phone.')+'<br><b>Is it still good?</b>'}
  function todayHTML(){const T=today;return '<div class="fd-trow"><span class="fd-tlab">TODAY</span><span class="fd-tnum">'+p2(T.getMonth()+1)+'/'+p2(T.getDate())+'/'+p2(T.getFullYear()%100)+'</span></div>'+
    '<div class="fd-tday">'+WD[T.getDay()]+',<br>'+MONTH[T.getMonth()]+' '+T.getDate()+', '+T.getFullYear()+'</div>'}
  /* the strip: this year's months (the past ones grey and crossed out, this one outlined in blue), then this month in the game's
     wall-calendar look (past days crossed out, today boxed). --d = when each piece deals in */
  function calHTML(){const y=today.getFullYear(),m=today.getMonth(),t=today.getDate(),n=new Date(y,m+1,0).getDate(),first=new Date(y,m,1).getDay(),rows=Math.ceil((first+n)/7);
    let h='<div class="fd-mblock"><div class="fd-year fd-pop" style="--d:80ms">'+y+'</div><div class="fd-months">';
    for(let k=0;k<12;k++)h+='<span class="fd-m fd-pop '+(k<m?'past':k===m?'now':'next')+'" data-m="'+k+'" style="--d:'+(148+k*38)+'ms"><span class="fd-bar"><i>'+MON[k]+'</i></span><b>'+(k+1)+'</b></span>';
    h+='</div></div><div class="fd-big fd-pop" style="--d:640ms"><div class="l1"><div class="cal l1c'+(rows>5?' six':'')+'"><div class="calhead">'+MONTH[m].toUpperCase()+'</div><div class="wk">'+
      ['SUN','MON','TUE','WED','THU','FRI','SAT'].map(s=>'<span>'+s+'</span>').join('')+'</div><div class="days">';
    for(let k=0;k<rows*7;k++){const dn=k-first+1;if(dn<1||dn>n){h+='<span class="d blank"></span>';continue}
      h+='<span class="d'+(dn<t?' past':dn===t?' today':'')+'" data-d="'+dn+'"><i>'+dn+'</i>'+(dn===t?'<small>TODAY</small>':'')+'</span>'}
    return h+'</div></div></div></div>'}
  /* the game's phone (its classes), with today and the clock */
  function phoneHTML(){const T=today;return '<div class="phonewrap"><div class="phone" role="img" aria-label="Phone: today is '+WD[T.getDay()]+', '+MONTH[T.getMonth()]+' '+T.getDate()+', '+T.getFullYear()+'.">'+
    '<div class="scr"><div class="pdate">'+WD[T.getDay()]+',<br>'+MONTH[T.getMonth()]+' '+T.getDate()+'<br>'+T.getFullYear()+'</div><div class="ptime">'+E.clock()+'</div>'+PICONS+'</div></div></div>'}
  function tickPhone(){const k=++S.tick;later(15000,()=>{const t=phoneEl.querySelector('.ptime');if(k!==S.tick||!t||phoneEl.hidden)return;t.textContent=E.clock();tickPhone()})}
  /* a past month is crossed out corner to corner, whatever the shape of its page */
  function crossFit(){const m0=calEl.querySelector('.fd-m');if(!m0||!m0.offsetWidth)return;const w=m0.offsetWidth,h=m0.offsetHeight;
    calEl.style.setProperty('--xa',Math.atan2(h,w)+'rad');calEl.style.setProperty('--xw',(Math.hypot(w,h)*.78)+'px')}
  function vHTML(){const d0=supCal()?920:380;return S.ans.map((a,n)=>'<button class="choice fd-v '+a.k+'" data-i="'+n+'" style="--d:'+(d0+n*70)+'ms"><span class="ic">'+(a.k==='good'?OKI:XI)+'</span>'+a.t+'</button>').join('')}
  /* lay the supports out unseen while the camera glides in, so the close look can keep clear of them */
  function supLay(){const cal=supCal();root.classList.add('chk');root.classList.toggle('cal',cal);root.classList.toggle('ph',!cal);root.classList.remove('go-in');
    todayEl.hidden=calEl.hidden=!cal;phoneEl.hidden=cal;todayEl.innerHTML=cal?todayHTML():'';calEl.innerHTML=cal?calHTML():'';phoneEl.innerHTML=cal?'':phoneHTML();
    calEl.setAttribute('aria-label','Calendar: today is '+WD[today.getDay()]+', '+MONTH[today.getMonth()]+' '+today.getDate()+', '+today.getFullYear()+'. Past days and months are crossed out.');
    [todayEl,calEl,phoneEl].forEach(e=>e.classList.add('pre'));todayEl.classList.add('fd-pop');phoneEl.classList.add('fd-pop');if(cal)crossFit();
    answers.classList.remove('fd-pop');answers.style.setProperty('--d',cal?'840ms':'300ms')}
  /* ...and pop them in once the date is found: today, the months, this month, the answer card, the answers */
  function supPop(){const still=E.still(),cal=supCal();S.sup=true;root.classList.toggle('fd-still',still);[todayEl,calEl,phoneEl].forEach(e=>e.classList.remove('pre'));
    answers.classList.remove('wait');answers.classList.add('fd-pop');root.classList.add('go-in');S.vready=performance.now()+(still?0:cal?1040:500);
    const bs=[...ansRow.querySelectorAll('.fd-v')];bs.forEach(b=>{b.onclick=()=>pick(b);if(still)b.classList.add('dealt')});
    later(still?0:(cal?990:450)+460,()=>bs.forEach(b=>b.classList.add('dealt')));later(still?0:160,()=>E.snd('plop'));if(!cal)tickPhone();
    if(level>=2&&S.easy!==S.full){if(S.easy)supFull();else supBack()}if(S.easy)markDate('hint')}
  /* Levels 3 and 4: the calendar comes in for the phone (Easier, or a wrong answer), or the phone comes back (Easier off) */
  function supFull(){S.full=true;supSwap()}
  function supBack(){S.full=false;supSwap()}
  function supSwap(){const cal=supCal();root.classList.toggle('cal',cal);root.classList.toggle('ph',!cal);prompt.innerHTML=chkPrompt();
    todayEl.hidden=calEl.hidden=!cal;phoneEl.hidden=cal;[todayEl,calEl,phoneEl].forEach(e=>e.classList.remove('pre'));
    if(cal){todayEl.innerHTML=todayHTML();calEl.innerHTML=calHTML();crossFit();markDate(S.mark)}else{phoneEl.innerHTML=phoneHTML();tickPhone()}
    E.snd('plop');moveTo(S.qSay,sayView(S.qSay),450)}
  /* the date on the calendar: Easier points at it in the game's sun yellow (the hint look of its calendar); after an answer it takes
     the answer's colour (red: before today, expired; green: after today, still good). Another month: its page; this month: its day */
  function markDate(kind){calEl.querySelectorAll('.mark').forEach(e=>{e.classList.remove('mark','hint','bad','good');const f=e.querySelector('.fd-flag');if(f)f.remove()});
    S.mark=kind||'';if(!kind||!RD.date||calEl.hidden||RD.date.getFullYear()!==today.getFullYear())return;const d=RD.date;
    const e=d.getMonth()===today.getMonth()?calEl.querySelector('.fd-big .d[data-d="'+d.getDate()+'"]'):calEl.querySelector('.fd-m[data-m="'+d.getMonth()+'"]');
    if(e){e.classList.add('mark',kind);e.insertAdjacentHTML('beforeend','<span class="fd-flag">the date</span>')}}
  function pickV(b,a){const g=RD.good,why='<b class="'+(g?'go':'stop')+'">'+RD.say+'</b> is '+(g?'after':'before')+' today.<br>It is '+(g?'still good':'expired')+'.';
    ansRow.querySelectorAll('.fd-v').forEach(x=>x.classList.add('dealt'));
    if(a.ok){S.step='won';const first=!won.has(round);won.add(round);b.classList.add('yes');ansRow.querySelectorAll('.fd-v').forEach(x=>{if(x!==b){x.classList.remove('amber');x.classList.add('rest')}});
      clearOv(it=>it.style==='glow'||it.style==='amber');qqEl.className='fd-qq fd-why go';qqEl.innerHTML='<span class="t">You got it!</span> '+why;markDate(g?'good':'bad');E.snd('win');
      const r=b.getBoundingClientRect();E.boom(r.left+r.width/2,r.top+r.height/2,first?90:40);nextB.hidden=false;skipB.hidden=true;root.classList.add('won');if(first)flyStar(b,round);else stampRow()}
    else{b.classList.add('amber');S.missed=true;qqEl.className='fd-qq fd-why';qqEl.innerHTML='Look again. '+why;if(!supCal())supFull();markDate(g?'good':'bad');E.snd('oops');miss()}}

  /* ---------- level done: the game's level-done page, the Fun Friday party, the game-show win when every round was won ---------- */
  function stopBig(){if(bigWinOn){E.stopWin();bigWinOn=false}}
  function showDone(){clearTimers();tw=null;PH.spin=null;PH.held=false;E.quiet();const n=level+1;doneV.hidden=false;
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
    draw();if(S.src&&S.src.parts)veil();if(!calEl.hidden)crossFit();if(f)f();handHint()},120)}
  addEventListener('resize',onResize);const onVis=()=>kick();document.addEventListener('visibilitychange',onVis);
  function exit(){stop();onExit()}
  function destroy(){alive=false;clearTimers();clearTimeout(rzT);if(raf)cancelAnimationFrame(raf);raf=0;tw=null;removeEventListener('keydown',onKey);removeEventListener('resize',onResize);document.removeEventListener('visibilitychange',onVis);PH.spin=null;PH.held=false;
    stopBig();E.quiet();clearOv();disposePkg();if(flyEl){flyEl.remove();flyEl=null}shadow.geometry.dispose();shadow.material.dispose();shTex.dispose();
    try{renderer.dispose();renderer.forceContextLoss()}catch(e){}const c=renderer.domElement;c.width=c.height=1;el.innerHTML=''}

  /* ---------- for tests only: read the state and find where things are on the screen ---------- */
  const test={state:()=>({level,round,step:S.step,misses:S.misses,easy:S.easy,zoom:S.zoom,won:[...won],dateTapped:S.dateTapped,busy:!!tw||S.step==='move'||(S.step==='say'&&CHK&&performance.now()<S.vready)||!!PH.spin||PH.held||Math.abs(PH.dip)>.002||Math.abs(PH.dv)>.01,ph:{dbg:PH.dbg||'',dip:+PH.dip.toFixed(4),spin:PH.spin?+Math.hypot(PH.spin.vs,PH.spin.vt).toFixed(3):0,held:PH.held,float:floatOn()},fit:S.fitInfo,fitDbg:S.fitDbg,say:S.sayInfo,zoomInfo:S.zoomInfo,closer:S.zoom?(S.zoomFocus?'framed':'1.7x'):'',
      tilt:tiltOf(S.q),q:S.q.toArray().map(v=>+v.toFixed(4)),date:RD&&RD.ds,right:RD&&RD.spoken,choices:S.ans&&S.ans.map(a=>a.t),bubble:hudR.textContent,card:qqEl.textContent,spot:P&&P.spot,
      src:S.src?(S.src.amber?'amber:'+(S.src.amber.ch?S.src.amber.ch.k:S.src.amber.rg.what):'parts:'+S.src.parts.length+' veils:'+S.src.veils.length):'',
      tags:[...root.querySelectorAll('.fd-tag')].filter(t=>t.style.display!=='none').map(t=>t.textContent+(t.classList.contains('amber')?'*':'')),
      check:CHK,good:RD?RD.good:null,sup:CHK&&S.step!=='find'?(supCal()?'calendar':'phone'):'',mark:[...calEl.querySelectorAll('.mark')].map(e=>(e.dataset.m?'month '+(+e.dataset.m+1):'day '+e.dataset.d)+' '+S.mark).join(',')}),
    /* the gentle bob on or off (long test runs on a slow test machine turn it off; it never changes what a tap hits) */
    float(on){PH.noFloat=!on;kick();return floatOn()},
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
    spin,tip,closer,rounds:()=>ROUNDS.map(r=>({date:r.ds,pk:r.rd.pk,spot:r.rd.spot,good:r.good,day:r.date?r.date.getFullYear()+'-'+p2(r.date.getMonth()+1)+'-'+p2(r.date.getDate()):null,choices:r.choices.map(c=>(c.ok?'*':'')+c.t)})),
    faces:()=>P?Object.fromEntries(Object.entries(P.faces).map(([n,f])=>[n,f.c.toDataURL('image/png')])):null};
  return{begin(){startLevel(level,round)},destroy,test}
}

/* ---------- the one entry call ---------- */
let RUN=null,token=0;
function fail(el,o){el.innerHTML='<div class="fd-root fd-err"><p>Find the Date! can’t start on this screen.</p><button class="nav">Back</button></div>';
  const b=el.querySelector('button');if(b)b.onclick=()=>{el.innerHTML='';if(o&&typeof o.onExit==='function')o.onExit()}}
async function start(el,o){stop();const my=++token;o=o||{};if(!el)return;el.innerHTML='';
  try{if(!THREE)THREE=await import(new URL('three.module.min.js',HERE).href);
    if(+o.level===3)await loadL4();
    await Promise.all(['800 40px "Baloo 2"','700 40px "Baloo 2"','900 20px Nunito','800 20px Nunito','700 20px Nunito'].map(f=>document.fonts.load(f).catch(()=>null)).concat(loadArt()))}
  catch(e){console.error('Find the Date:',e);if(my===token)fail(el,o);return}
  if(my!==token)return;
  try{RUN=Activity(el,o);RUN.begin()}catch(e){console.error('Find the Date:',e);if(RUN){try{RUN.destroy()}catch(_){}}RUN=null;fail(el,o)}}
function stop(){token++;if(RUN){const r=RUN;RUN=null;r.destroy()}}
window.FindTheDate={start,stop,get _t(){return RUN&&RUN.test}};
})();
