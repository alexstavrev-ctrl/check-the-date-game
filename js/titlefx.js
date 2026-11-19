/* The floating title, borrowed from the Fun Friday title (V18 physics, Alex 11/19: "borrow any code as well as the game engine parts").
   The foods drift, bump each other and bounce off the two heavy pieces (the words and today's calendar page), which float on soft springs.
   A tap pushes a piece away with a little pop. Calm mode (reduced motion) shows the still picture. Layout: Claude. Pictures: Canva (classroom-assets). */
const TFX=(()=>{
  const TD='assets/foods/';
  const FW=1920,FH=1080,R=Math.PI/180;
  /* each picture: box width, height (title-stage px) and the circles that cover its shape [x, y, r] from its centre (fitcircles.py) */
  const SHAPE={"bread":[307.7,307.7,[[-66.8,0.5,70.6],[71.9,0.5,70.6]]],"cheese":[366.8,366.8,[[0.3,2.1,126.0]]],"eggs":[314.0,314.0,[[-62.6,-0.5,77.1],[63.1,-0.5,77.1]]],"juice":[310.0,310.0,[[1.0,-91.6,48.4],[1.0,0.0,48.4],[1.0,91.6,48.4]]],"milk":[314.6,314.6,[[-1.3,-75.6,65.9],[-1.3,72.5,65.9]]],"yogurt":[364.4,364.4,[[-0.6,5.5,126.0]]],
    "tortillas":[347.8,347.8,[[-0.3,-0.6,126.0]]],"cereal":[331.4,331.4,[[-0.6,-54.2,88.3],[-0.6,49.2,88.3]]],"soup":[357.4,357.4,[[-0.3,-56.5,84.6],[-0.3,54.2,84.6]]]};
  /* picture, centre x, y, tilt (deg), layer (0 back, 1 middle, 2 front), size (1 = 280 px) */
  const ITEMS=[['milk',230,360,-8,1,1],['cheese',520,420,6,0,.9],['bread',250,760,-5,2,1],['eggs',520,885,4,1,.95],
    ['yogurt',1420,400,7,0,.9],['juice',1700,380,-6,2,1],['soup',1690,800,6,0,.9],['cereal',1430,870,-4,1,.95],
    ['eggs',1790,135,-8,1,.8],['tortillas',125,140,10,1,.8],['cheese',1180,995,-6,2,.75]];
  const CAL={x:960,y:578,w:540,h:460};                  /* today's calendar page, the heavy piece in the middle */
  const TITLE={x:960,y:150,w:1320,h:190};               /* "Check the Date!" */
  const M=170;                                          /* edge margin: about one picture width */
  let field,stage,shadow,bodies=[],items=[],heavy=[],raf=0,last=0,tt=0,running=false,s=1,ox=0,oy=0,bx=[0,FW,0,FH],vis=[0,FW,0,FH];
  const rnd=(a,b)=>a+Math.random()*(b-a),cruise=FW/20;

  function el(tag,cls,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(parent)parent.appendChild(e);return e}
  function pic(name){const im=new Image();im.alt='';im.draggable=false;im.decoding='async';im.onerror=flat;im.src=TD+name+'.webp';return im}
  /* safety net: if a picture fails to load, show the plain title words instead (never a broken picture) */
  function flat(){if(!field||field.classList.contains('off'))return;field.classList.add('off');running=false;cancelAnimationFrame(raf);$('open').classList.add('plain')}
  function mk(o){o.vx=0;o.vy=0;o.w=0;o.sq=0;o.ph=rnd(0,6.28);o.im=1/o.m;
    o.wrap.style.width=o.wd+'px';o.wrap.style.height=o.ht+'px';bodies.push(o);return o}
  function calPage(){
    const d=typeof realToday==='function'?realToday():new Date();
    return '<span class="tc-head">'+MONTH[d.getMonth()].toUpperCase()+'</span><span class="tc-day"><b>'+d.getDate()+'</b><small>TODAY</small></span><span class="tc-wd">'+WEEKDAY[d.getDay()]+'</span>';
  }
  function build(){
    const o=$('open');
    field=el('div','tfx');field.setAttribute('aria-hidden','true');
    stage=el('div','tfx-stage',field);
    shadow=el('div','tfx-shadow',stage);
    const layers=[0,1,2].map(L=>{const d=el('div','tfx-layer',stage);d.style.zIndex=L+1;return d});
    ITEMS.forEach(([n,x,y,a,L,z])=>{
      const [w0,h0,cs0]=SHAPE[n],wd=w0*z,ht=h0*z,wrap=el('div','tfx-b tfx-item',layers[L]);wrap.dataset.n=n;wrap.appendChild(pic(n));
      const cs=cs0.map(([x,y,r])=>({x:x*z,y:y*z,r:r*z}));
      const br=Math.max(...cs.map(c=>Math.hypot(c.x,c.y)+c.r));
      const b=mk({kind:'item',name:n,wrap,layer:L,hx:x,hy:y,ha:a*R,x,y,a:a*R,wd,ht,m:z,cs,br});
      b.iI=1/(b.m*br*br*.5);items.push(b);
    });
    /* today's calendar page: built in code, in the game's calendar look */
    const cw=el('div','tfx-b tfx-cal',layers[1]);cw.innerHTML=calPage();
    const hw=CAL.w/2,hh=CAL.h/2;
    const cal=mk({kind:'cal',wrap:cw,layer:1,hx:CAL.x,hy:CAL.y,ha:0,x:CAL.x,y:CAL.y,a:0,wd:CAL.w,ht:CAL.h,m:8,
      box:{hw,poly:[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]],rc:0},br:Math.hypot(hw,hh),k:1.0,c:1.7,ka:1.6,ca:1.9});
    cal.iI=1/(cal.m*(CAL.w*CAL.w+CAL.h*CAL.h)/12);heavy.push(cal);
    /* the title words, typeset like the Fun Friday title (Baloo 2 ExtraBold, ink and blue) */
    const tw=el('div','tfx-b tfx-title',layers[1]);
    tw.innerHTML='<span class="t1">Check the </span><span class="t2">Date!</span>';
    const th=TITLE.w/2-30;
    const title=mk({kind:'title',wrap:tw,layer:1,hx:TITLE.x,hy:TITLE.y,ha:0,x:TITLE.x,y:TITLE.y,a:0,wd:TITLE.w,ht:TITLE.h,m:12,
      box:{hw:th,poly:[[-th,-48],[th,-48],[th,48],[-th,48]],rc:30},br:th+40,k:2.4,c:2.5,ka:3,ca:2.6});
    title.iI=1/(title.m*(TITLE.w*TITLE.w+96*96)/12);heavy.push(title);
    title.cs=[];for(let k=0;k<13;k++)title.cs.push({x:-th+48+k*(2*th-96)/12,y:0,r:56});   /* the words as a row of circles, for bumps with the calendar */
    o.insertBefore(field,o.firstChild);
    addEventListener('resize',size);
    field.addEventListener('pointerdown',tap);
  }
  /* the stage is a 1920 x 1080 canvas, scaled to fit the screen */
  function size(){
    const W=innerWidth,H=innerHeight;s=Math.min(W/FW,H/FH);ox=(W-FW*s)/2;oy=(H-FH*s)/2;
    stage.style.transform='translate('+ox+'px,'+oy+'px) scale('+s+')';
    vis=[-ox/s,(W-ox)/s,-oy/s,(H-oy)/s];bx=[vis[0]-M,vis[1]+M,vis[2]-M,vis[3]+M];
  }
  function home(){
    bodies.forEach(b=>{b.x=b.hx;b.y=b.hy;b.a=b.ha;b.vx=b.vy=b.w=0;b.sq=0});
    items.forEach(b=>{const d=rnd(0,6.28);b.vx=Math.cos(d);b.vy=Math.sin(d);b.dir=d});   /* each picture gets its own slow direction */
    tt=0;draw();
  }
  /* ---------- contacts (the Fun Friday title's code) ---------- */
  const rot=(x,y,a)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
  function circles(b){return b.cs.map(c=>{const [x,y]=rot(c.x,c.y,b.a);return{x:b.x+x,y:b.y+y,r:c.r}})}
  function cc(A,B,out){
    const ca=circles(A),cb=circles(B);
    for(const p of ca)for(const q of cb){let dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);const pen=p.r+q.r-d;if(pen<=0)continue;
      if(d<.01){dx=1;dy=0;d=1}const nx=dx/d,ny=dy/d;out.push({nx,ny,pen,px:p.x+nx*(p.r-pen/2),py:p.y+ny*(p.r-pen/2)})}
  }
  function cbox(A,B,out){                               /* circles of A against the outline of B (a convex polygon, corners rounded by rc) */
    const bb=B.box,P=bb.poly,ang=B.a;
    if(!bb.n){bb.n=P.map((v,i)=>{const w=P[(i+1)%P.length],ex=w[0]-v[0],ey=w[1]-v[1],L=Math.hypot(ex,ey);let nx=ey/L,ny=-ex/L;
      const cx=P.reduce((s,q)=>s+q[0],0)/P.length,cy=P.reduce((s,q)=>s+q[1],0)/P.length;if((v[0]-cx)*nx+(v[1]-cy)*ny<0){nx=-nx;ny=-ny}return[nx,ny]})}
    for(const p of circles(A)){
      const [lx,ly]=rot(p.x-B.x,p.y-B.y,-ang);
      let inside=true,deep=1e9,din=null,best=1e9,qx=0,qy=0;
      for(let i=0;i<P.length;i++){const v=P[i],w=P[(i+1)%P.length],n=bb.n[i];
        const sd=(lx-v[0])*n[0]+(ly-v[1])*n[1];if(sd>0)inside=false;if(-sd<deep){deep=-sd;din=n}
        const ex=w[0]-v[0],ey=w[1]-v[1],t=Math.max(0,Math.min(1,((lx-v[0])*ex+(ly-v[1])*ey)/(ex*ex+ey*ey))),cx=v[0]+t*ex,cy=v[1]+t*ey,d=Math.hypot(lx-cx,ly-cy);
        if(d<best){best=d;qx=cx;qy=cy}}
      let pen,nlx,nly;
      if(inside){pen=p.r+bb.rc+deep;nlx=din[0];nly=din[1]}
      else{pen=p.r+bb.rc-best;if(pen<=0)continue;nlx=(lx-qx)/best;nly=(ly-qy)/best}
      const [nx,ny]=rot(-nlx,-nly,ang);
      out.push({nx,ny,pen,px:p.x+nx*(p.r-pen/2),py:p.y+ny*(p.r-pen/2)});
    }
  }
  function push(b,jx,jy,rx,ry){b.vx+=jx*b.im;b.vy+=jy*b.im;b.w+=(rx*jy-ry*jx)*b.iI}
  function resolve(A,B,c,e){
    const ia=A.im,ib=B.im,rax=c.px-A.x,ray=c.py-A.y,rbx=c.px-B.x,rby=c.py-B.y;
    const corr=Math.max(0,c.pen-.6)*.35/(ia+ib);
    A.x-=c.nx*corr*ia;A.y-=c.ny*corr*ia;B.x+=c.nx*corr*ib;B.y+=c.ny*corr*ib;
    const rvx=(B.vx-B.w*rby)-(A.vx-A.w*ray),rvy=(B.vy+B.w*rbx)-(A.vy+A.w*rax),vn=rvx*c.nx+rvy*c.ny;
    if(vn>=0)return 0;
    const rna=rax*c.ny-ray*c.nx,rnb=rbx*c.ny-rby*c.nx;
    const j=-(1+e)*vn/(ia+ib+rna*rna*A.iI+rnb*rnb*B.iI);
    push(A,-j*c.nx,-j*c.ny,rax,ray);push(B,j*c.nx,j*c.ny,rbx,rby);
    const tx=-c.ny,ty=c.nx,vt=rvx*tx+rvy*ty,rta=rax*ty-ray*tx,rtb=rbx*ty-rby*tx;
    let jt=-vt/(ia+ib+rta*rta*A.iI+rtb*rtb*B.iI);jt=Math.max(-.25*j,Math.min(.25*j,jt));
    push(A,-jt*tx,-jt*ty,rax,ray);push(B,jt*tx,jt*ty,rbx,rby);
    return j;
  }
  /* ---------- one physics step ---------- */
  function step(dt){
    tt+=dt;const ramp=Math.min(1,tt/3),c=cruise*ramp;   /* it starts still and comes alive over 3 seconds */
    for(const b of items){
      const v=Math.hypot(b.vx,b.vy);
      if(v>c&&v>1){const k=Math.max(c/v,Math.exp(-dt*.8));b.vx*=k;b.vy*=k}
      else if(v<c*.6){const d=v>.5?Math.atan2(b.vy,b.vx):b.dir;b.vx+=Math.cos(d)*c*dt*.5;b.vy+=Math.sin(d)*c*dt*.5}
      if(b.x<vis[0])b.vx+=c*dt*.7;else if(b.x>vis[1])b.vx-=c*dt*.7;
      if(b.y<vis[2])b.vy+=c*dt*.7;else if(b.y>vis[3])b.vy-=c*dt*.7;
      const r=b.br*.8;
      if(b.x<bx[0]+r&&b.vx<0){b.x=bx[0]+r;b.vx*=-1}if(b.x>bx[1]-r&&b.vx>0){b.x=bx[1]-r;b.vx*=-1}
      if(b.y<bx[2]+r&&b.vy<0){b.y=bx[2]+r;b.vy*=-1}if(b.y>bx[3]-r&&b.vy>0){b.y=bx[3]-r;b.vy*=-1}
      const rock=Math.sin(tt*.45+b.ph)*4*R*ramp;
      b.w+=((b.ha+rock-b.a)*1.1-b.w*1.3)*dt;
      b.a=Math.max(b.ha-35*R,Math.min(b.ha+35*R,b.a));
    }
    for(const b of heavy){
      const hy=b.hy+(b.kind==='cal'?Math.sin(tt*.55+b.ph)*7:Math.sin(tt*.4+b.ph)*3)*ramp;
      b.vx+=(-(b.x-b.hx)*b.k-b.vx*b.c)*dt;b.vy+=(-(b.y-hy)*b.k-b.vy*b.c)*dt;
      const rock=Math.sin(tt*.33+b.ph)*(b.kind==='cal'?1.2:.6)*R*ramp;
      b.w+=((rock-b.a)*b.ka-b.w*b.ca)*dt;
    }
    for(const b of bodies){b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.w*dt;b.sq=Math.max(0,b.sq-dt*3)}
    const out=[];
    for(let p=0;p<items.length;p++){const A=items[p];
      for(let q=p+1;q<items.length;q++){const B=items[q];if(A.layer!==B.layer)continue;
        if(Math.abs(A.x-B.x)>A.br+B.br||Math.abs(A.y-B.y)>A.br+B.br)continue;
        out.length=0;cc(A,B,out);for(const c of out)resolve(A,B,c,.85)}
      for(const B of heavy){if(Math.abs(A.x-B.x)>A.br+B.br||Math.abs(A.y-B.y)>A.br+B.br)continue;
        out.length=0;cbox(A,B,out);for(const c of out){if(resolve(A,B,c,.7)>A.m*cruise*.4)A.sq=Math.max(A.sq,.35)}}
    }
    out.length=0;cbox(heavy[1],heavy[0],out);for(const c of out)resolve(heavy[1],heavy[0],c,.4);   /* title and calendar */
  }
  function draw(){
    for(const b of bodies){const k=1+b.sq*.09;
      b.wrap.style.transform='translate3d('+(b.x-b.wd/2).toFixed(1)+'px,'+(b.y-b.ht/2).toFixed(1)+'px,0) rotate('+b.a.toFixed(4)+'rad) scale('+k.toFixed(3)+')'}
    const cal=heavy[0];
    shadow.style.transform='translate3d('+(cal.x-300).toFixed(1)+'px,'+(CAL.y+CAL.h/2+4).toFixed(1)+'px,0) scaleX('+(1+(cal.y-CAL.y)/900).toFixed(3)+')';
  }
  function loop(now){if(!running)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;
    step(dt/2);step(dt/2);draw();raf=requestAnimationFrame(loop)}
  function tap(e){
    if(calm)return;
    const x=(e.clientX-ox)/s,y=(e.clientY-oy)/s,probe={x,y,a:0,cs:[{x:0,y:0,r:12}]};
    const order=[...items.filter(b=>b.layer===2),...heavy,...items.filter(b=>b.layer===1),...items.filter(b=>b.layer===0)];
    for(const b of order){
      const out=[];if(b.box)cbox(probe,b,out);else cc(probe,b,out);if(!out.length)continue;
      let dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy);if(d<4){const a=rnd(0,6.28);dx=Math.cos(a);dy=Math.sin(a);d=1}
      const dv=b.kind==='item'?cruise*3:cruise*1.1;
      push(b,dx/d*dv*b.m,dy/d*dv*b.m,x-b.x,y-b.y);
      if(b.kind==='item'){b.dir=Math.atan2(dy,dx);b.w+=rnd(-1.2,1.2)}
      else b.w+=Math.max(-1,Math.min(1,(x-b.x)/b.box.hw))*(Math.sign(b.y-y)||1)*.16;
      b.sq=1;pop(b.kind);field.dataset.hit=b.name||b.kind;return;
    }
  }
  function pop(kind){try{const f=kind==='item'?rnd(560,760):kind==='cal'?300:380;note(f,0,.09,{vol:.12,to:f*1.6});note(f*2,.02,.05,{vol:.04})}catch(e){}}
  return{
    show(){if(!field)build();if(field.classList.contains('off'))return;size();home();
      if(calm)return;
      if(!running){running=true;last=performance.now();raf=requestAnimationFrame(loop)}},
    hide(){running=false;cancelAnimationFrame(raf)},
    _bodies:()=>bodies
  };
})();
