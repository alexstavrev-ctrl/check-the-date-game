/* Game-show win for the right bill total. Drawn by Astra (11/18), sound unchanged from test A. */
const WINFX=(()=>{
  /* ---------------- sound ---------------- */
  let AC=null,M=null;
  function ac(){
    try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();
        const k=AC.createDynamicsCompressor();k.threshold.value=-16;k.knee.value=12;k.ratio.value=5;k.attack.value=.003;k.release.value=.25;
        M=AC.createGain();M.gain.value=.95;M.connect(k);k.connect(AC.destination)}
      if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}
  }
  function env(g,t,vol,att,len){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+len)}
  function note(f,at,len,o){const c=ac();if(!c)return;o=o||{};
    const t=c.currentTime+at,osc=c.createOscillator(),g=c.createGain();osc.type=o.type||'sine';
    osc.frequency.setValueAtTime(f,t);if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+len);
    env(g,t,o.vol||.2,o.att||.012,len);osc.connect(g);g.connect(M);osc.start(t);osc.stop(t+len+.05)}
  function bell(f,at,vol){note(f,at,1,{vol});note(f*2,at,.5,{vol:vol*.35});note(f*3.01,at,.28,{vol:vol*.14})}
  let NB=null;
  function noise(at,len,o){const c=ac();if(!c)return;o=o||{};
    if(!NB){const n=c.sampleRate*2;NB=c.createBuffer(1,n,c.sampleRate);const d=NB.getChannelData(0);for(let k=0;k<n;k++)d[k]=Math.random()*2-1}
    const t=c.currentTime+at,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=NB;s.loop=true;
    f.type=o.type||'bandpass';f.Q.value=o.q||.8;f.frequency.setValueAtTime(o.f||1000,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+len);
    env(g,t,o.vol||.1,o.att||.005,len);s.connect(f);f.connect(g);g.connect(M);s.start(t,Math.random()*1.5);s.stop(t+len+.05)}
  /* a brassy horn: two detuned saws through a filter that opens on the attack */
  function horn(f,at,len,vol,vib){const c=ac();if(!c)return;
    const t=c.currentTime+at,a=c.createOscillator(),b=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain();
    a.type=b.type='sawtooth';a.frequency.value=b.frequency.value=f;b.detune.value=9;
    if(vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=5.6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.012,t+.35);
      l.connect(lg);lg.connect(a.frequency);lg.connect(b.frequency);l.start(t);l.stop(t+len+.05)}
    fl.type='lowpass';fl.Q.value=1.4;fl.frequency.setValueAtTime(f*1.3,t);fl.frequency.exponentialRampToValueAtTime(f*7,t+.05);fl.frequency.exponentialRampToValueAtTime(f*3.2,t+Math.min(.45,len));
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.025);g.gain.setValueAtTime(vol*.85,t+Math.max(.04,len*.75));g.gain.exponentialRampToValueAtTime(.0001,t+len);
    a.connect(fl);b.connect(fl);fl.connect(g);g.connect(M);[a,b].forEach(x=>{x.start(t);x.stop(t+len+.05)})}
  function whistle(at,len){note(700,at,len,{vol:.035,to:2100,att:.05});noise(at,len,{f:2500,to:5000,q:3,vol:.025,att:.05})}
  function boom(at){note(80,at,.7,{vol:.34,to:34});noise(at,.9,{type:'lowpass',f:1400,to:180,q:.7,vol:.24,att:.004});
    for(let k=0;k<14;k++)noise(at+.15+Math.random()*.8,.025,{f:3000+Math.random()*3000,q:2,vol:.025+Math.random()*.04})}
  function sound(rockets){if(!ac())return;
    bell(1319,0,.24);bell(1568,.12,.24);bell(2093,.24,.3);                                   /* ding-ding-DING: that's right! */
    [.52,.66,.80].forEach(t=>{[392,494,587].forEach(f=>horn(f,t,.12,.05));note(110,t,.2,{vol:.28,to:55})}); /* da-da-da ... */
    [523,659,784,1047].forEach(f=>horn(f,.96,1.6,.055,true));horn(131,.96,1.6,.07,true);note(98,.96,.5,{vol:.3,to:49});       /* ... DAAAA! */
    for(let k=0;k<170;k++)noise(1+Math.random()*3,.025+Math.random()*.035,{f:1100+Math.random()*1800,q:1.3,vol:.04+Math.random()*.09}); /* applause */
    noise(.95,3.4,{f:850,q:.45,vol:.07,att:.7});                                              /* the crowd roars */
    [1.35,2.3].forEach(t=>note(1500,t,.4,{vol:.03,to:2700}));                                 /* a whistle from the crowd */
    for(let k=0;k<30;k++)note(2300+Math.random()*1900,1+Math.random()*1.9,.1,{type:'triangle',vol:.05}); /* coins pour out */
    rockets.forEach(r=>{whistle(r.t,r.d);boom(r.t+r.d)});                                       /* fireworks */
    [1047,1319,1568,2093,2637,3136,4186].forEach((f,k)=>note(f,3.75+k*.05,.22,{vol:.05}));     /* sparkle to finish */
  }
  /* ---------------- pictures ---------------- */
  const TAU=Math.PI*2,DURATION=5.2;
  const LIMIT={paper:520,sparks:680,rockets:12};
  const COLORS=[['#ffd064','#fff0b6'],['#ff719c','#ffd5e2'],['#56d7f1','#d2f9ff'],['#bb97ff','#e8dbff'],['#65e5ba','#d3ffeb'],['#ffc58a','#fff0db']];
  const PAPER=[['#ffd05b','#a96723'],['#ff7096','#b22e61'],['#4ed4ee','#197ca5'],['#ae8aff','#6550b1'],['#59dfaa','#218568'],['#fff0c1','#c6a464'],['#ff986d','#bd5240']];
  // t and d are the original audio cue values. Only position, color and kind differ.
  const ROCKETS=[[.75,.16,.27],[1.0,.84,.24],[1.25,.50,.16],[1.5,.30,.20],[1.8,.07,.42],[2.05,.93,.39],[2.3,.68,.16],[2.6,.43,.12],[2.85,.83,.25],[3.1,.19,.24],[3.15,.51,.14],[3.2,.72,.23]]
    .map(([t,x,y],k)=>({t,x,y,d:.62,kind:k%3,col:COLORS[k%COLORS.length]}));
  const active=new WeakMap();
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const ease=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)};
  const rand=(a,b)=>a+Math.random()*(b-a);
  function el(tag,cls,host){const n=document.createElement(tag);n.className=cls;host.appendChild(n);return n}
  function stop(stage){active.get(stage)?.()}
  function play(o){
    const stage=o.stage;
    stop(stage);
    if(!o.mute)sound(ROCKETS); /* the game passes mute when its Sound button is off */
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    if(o.calm||media.matches)return;
    const W=stage.clientWidth,H=stage.clientHeight;
    if(!W||!H)return;
    const spot=o.spot||[.77,.49],text=o.text||[.5,.47];
    const layer=el('div','wfx wfx-layer',stage);
    layer.setAttribute('aria-hidden','true');
    const dim=el('div','wfx-dim',layer);
    dim.style.setProperty('--sx',spot[0]*100+'%');dim.style.setProperty('--sy',spot[1]*100+'%');
    const aura=el('div','wfx-aura',layer),rays=el('div','wfx-rays',layer);
    [aura,rays].forEach(n=>{n.style.left=text[0]*100+'%';n.style.top=text[1]*100+'%'});
    // At most 2x DPR and 2560x1440 per canvas, even on a 4K TV.
    const dpr=Math.min(devicePixelRatio||1,2,2560/W,1440/H);
    function canvas(cls){const n=el('canvas','wfx-cv '+cls,layer);n.width=Math.floor(W*dpr);n.height=Math.floor(H*dpr);
      const g=n.getContext('2d');g.setTransform(n.width/W,0,0,n.height/H,0,0);return g}
    const glow=canvas('glow'),paper=canvas('paper');
    el('div','wfx-rim',layer);
    const big=el('div','wfx-big',layer);big.style.left=text[0]*100+'%';big.style.top=text[1]*100+'%';big.style.fontSize=W*.109+'px';
    for(const c of ['depth','face','shine'])el('span','wfx-title-'+c,big).textContent='YOU GOT IT!';
    const shine=big.lastElementChild;
    // One low-opacity, 650ms warm bloom. No repeated flashes or random twinkle.
    const flash=el('div','wfx-flash',layer);
    const sprites=new Map();
    for(const color of new Set(COLORS.flat().concat(['#fff6d6','#ffe3a1']))){
      const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');
      const fill=g.createRadialGradient(24,24,0,24,24,24);fill.addColorStop(0,'#ffffff');fill.addColorStop(.07,'#fff8e9');fill.addColorStop(.20,color);fill.addColorStop(.40,color+'72');fill.addColorStop(1,color+'00');
      g.fillStyle=fill;g.fillRect(0,0,48,48);sprites.set(color,c);
    }
    const sparks=[],papers=[],rockets=[],events=[];
    const at=(t,fn)=>events.push({t,fn});
    function push(list,p,cap){if(list.length<cap)list.push(p)}
    function spark(p){push(sparks,p,LIMIT.sparks)}
    function confetti(t,side,count){
      for(let k=0;k<count;k++){
        const top=side===0,dir=side<0?rand(-1.28,-.62):rand(-2.52,-1.86),speed=rand(1.28,2.0)*H;
        push(papers,{t,life:rand(3.2,4.4),x:top?rand(.06,.94)*W:side<0?-.025*W:W*1.025,y:top?rand(-.28,-.06)*H:H*1.04,
          vx:top?rand(-.14,.14)*W:Math.cos(dir)*speed,vy:top?rand(.04,.17)*H:Math.sin(dir)*speed,
          drag:rand(.45,.82),gravity:H*rand(.62,.86),size:W*rand(.0036,.0070),r:rand(0,TAU),spin:rand(-3.4,3.4),flutter:rand(3.4,6.6),phase:rand(0,TAU),
          ribbon:k%5===0,col:PAPER[k%PAPER.length]},LIMIT.paper);
      }
    }
    [.06,.34,.65,.98].forEach(t=>at(t,()=>{confetti(t,-1,55);confetti(t,1,55)}));
    [[1.6,78],[2.4,78],[3.25,64]].forEach(([t,n])=>at(t,()=>confetti(t,0,n)));
    function burst(r){
      const t=r.t+r.d,X=r.x*W,Y=r.y*H,n=r.kind===1?54:66;
      for(let k=0;k<n;k++){
        const a=k/n*TAU+rand(-.025,.025),shell=r.kind===1?rand(.91,1.02):k%3===0?rand(.42,.64):rand(.80,1.07),speed=H*rand(.29,.38)*shell;
        spark({t,life:rand(1.15,1.8),x:X,y:Y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed*.88,drag:r.kind===2?.92:1.45,gravity:H*.10,size:W*rand(.0011,.0019),col:r.col[k%4===0?1:0],tail:true});
      }
      // Small branching embers emerge once along the shell; they never blink.
      const count=24;
      for(let k=0;k<count;k++){
        const delay=rand(.25,.70),a=k/count*TAU,rad=H*rand(.12,.19)*(1-Math.exp(-delay*3));
        spark({t:t+delay,life:rand(.22,.45),x:X+Math.cos(a)*rad,y:Y+Math.sin(a)*rad*.85+H*.015, vx:Math.cos(a)*H*.055+rand(-.035,.035)*H,vy:Math.sin(a)*H*.055,drag:2,gravity:H*.13,size:W*.0010,col:r.col[1],tail:true});
      }
    }
    ROCKETS.forEach(r=>{at(r.t,()=>push(rockets,{...r,x0:clamp(r.x+(r.x<.5?-.055:.055),.02,.98)*W},LIMIT.rockets));at(r.t+r.d,()=>burst(r))});
    events.sort((a,b)=>a.t-b.t);
    let cue=0,raf=0,dead=false;
    const t0=performance.now();
    // Exact drag/gravity trajectories, independent of frame rate.
    function pos(p,a){const f=(1-Math.exp(-p.drag*a))/p.drag;
      return [p.x+p.vx*f,p.y+p.vy*f+p.gravity/p.drag*(a-f)]}
    function dot(g,x,y,size,col,alpha){g.globalAlpha=alpha;g.drawImage(sprites.get(col),x-size/2,y-size/2,size,size)}
    function drawRockets(t){
      for(let i=rockets.length-1;i>=0;i--){const r=rockets[i],a=t-r.t;
        if(a>=r.d){rockets.splice(i,1);continue}
        for(let k=10;k>=0;k--){const age=a-k*.018;if(age<0)continue;const u=clamp(age/r.d),e=1-Math.pow(1-u,1.65),x=r.x0+(r.x*W-r.x0)*e,y=H*1.025+(r.y*H-H*1.025)*e;
          dot(glow,x,y,W*(k===0?.013:.008)*(1-k*.045),'#ffe3a1',(1-k/12)*.7);
        }
      }
    }
    function drawSparks(t){
      for(let i=sparks.length-1;i>=0;i--){const p=sparks[i],a=t-p.t;
        if(a>=p.life){sparks.splice(i,1);continue}if(a<0)continue;
        const [x,y]=pos(p,a);if(x<-W*.12||x>W*1.12||y>H*1.12)continue;
        const alpha=ease(0,.07,a)*(1-ease(p.life*.3,p.life,a));
        const [px,py]=pos(p,Math.max(0,a-.055));
        glow.globalAlpha=alpha*.65;glow.strokeStyle=p.col;glow.lineWidth=p.size*.75;glow.beginPath();glow.moveTo(px,py);glow.lineTo(x,y);glow.stroke();
        dot(glow,x,y,p.size*8,p.col,alpha*.7);
        glow.globalAlpha=alpha*.92;glow.fillStyle='#fff8e6';glow.beginPath();glow.arc(x,y,p.size*.43,0,TAU);glow.fill();
      }
    }
    function drawPaper(t){
      for(let i=papers.length-1;i>=0;i--){const p=papers[i],a=t-p.t;
        if(a>=p.life){papers.splice(i,1);continue}
        const [rawX,y]=pos(p,a),x=rawX+Math.sin(a*p.flutter+p.phase)*p.size*1.5;
        if(y>H*1.1&&a>.5){papers.splice(i,1);continue}
        if(y<-H*.15||x<-W*.05||x>W*1.05)continue;
        const flip=Math.cos(a*p.flutter+p.phase),alpha=ease(0,.12,a)*(1-ease(p.life-.6,p.life,a));
        paper.save();paper.globalAlpha=alpha;paper.translate(x,y);paper.rotate(p.r+p.spin*a);paper.fillStyle=p.col[flip<0?1:0];
        if(p.ribbon){
          // A folded paper ribbon, with a shaded back and a moving curved spine.
          paper.scale(1,.8+Math.abs(flip)*.28);const w=p.size*.40,l=p.size*4.6,bend=Math.sin(a*3+p.phase)*p.size*1.4;
          paper.beginPath();paper.moveTo(-w,-l/2);paper.bezierCurveTo(bend-w,-l/6,-bend-w,l/6,-w,l/2);paper.lineTo(w,l/2);paper.bezierCurveTo(-bend+w,l/6,bend+w,-l/6,w,-l/2);paper.closePath();paper.fill();
          paper.globalAlpha=alpha*.45;paper.strokeStyle='#fff7da';paper.lineWidth=p.size*.12;paper.beginPath();paper.moveTo(w,-l/2);paper.bezierCurveTo(bend+w,-l/6,-bend+w,l/6,w,l/2);paper.stroke();
        }else{
          paper.scale(1,.20+Math.abs(flip)*.8);paper.fillRect(-p.size*.55,-p.size*.35,p.size*1.1,p.size*.7);
          paper.globalAlpha=alpha*.40;paper.fillStyle='#fff9e9';paper.fillRect(-p.size*.55,-p.size*.35,p.size*1.1,p.size*.12);
        }
        paper.restore();
      }
    }
    // Rounded perimeter, 80 inboard bulbs; a continuous 0.625Hz chase per bulb.
    const bulbs=[];
    for(let i=0;i<28;i++)bulbs.push([(.035+i*.93/27)*W,H*.035]);
    for(let i=1;i<13;i++)bulbs.push([W*.965,(.035+i*.93/13)*H]);
    for(let i=27;i>=0;i--)bulbs.push([(.035+i*.93/27)*W,H*.965]);
    for(let i=12;i>0;i--)bulbs.push([W*.035,(.035+i*.93/13)*H]);
    function drawLights(t){
      bulbs.forEach(([x,y],k)=>{const wave=(1+Math.cos(TAU*(k/16-t/1.6)))/2,alpha=.19+.65*Math.pow(wave,3);
        dot(glow,x,y,W*.012,'#ffe3a1',alpha*.70);glow.globalAlpha=.45+alpha*.55;glow.fillStyle='#ffeab3';glow.beginPath();glow.arc(x,y,W*.0015,0,TAU);glow.fill()});
    }
    const onMotion=()=>{if(media.matches)cleanup()},onVisibility=()=>{if(document.hidden)cleanup()};
    function cleanup(){if(dead)return;dead=true;cancelAnimationFrame(raf);clearTimeout(failsafe);media.removeEventListener('change',onMotion);document.removeEventListener('visibilitychange',onVisibility);layer.remove();sparks.length=papers.length=rockets.length=events.length=0;sprites.clear();if(active.get(stage)===cleanup)active.delete(stage)}
    const failsafe=setTimeout(cleanup,5500);
    media.addEventListener('change',onMotion);document.addEventListener('visibilitychange',onVisibility);active.set(stage,cleanup);
    function frame(now){
      if(dead)return;if(!layer.isConnected){cleanup();return}
      const t=(now-t0)/1000;if(t>=DURATION){cleanup();return}
      while(cue<events.length&&events[cue].t<=t)events[cue++].fn();
      const envelope=ease(0,.22,t)*(1-ease(4.45,DURATION,t));
      layer.style.opacity=envelope;
      rays.style.transform=`translate(-50%,-50%) rotate(${-14+t*6}deg) scale(${.82+.18*ease(0,.9,t)})`;
      rays.style.opacity=.85*(1-ease(3.9,5.1,t));
      aura.style.opacity=.8+.12*Math.sin(t*1.3);
      // One entrance overshoot, a steady hold, then a gentle lift and dissolve.
      let scale=t<.50?.76+.28*(1-Math.pow(1-clamp(t/.50),3)):t<.85?1.04-.04*ease(.50,.85,t):1;
      const out=ease(3.95,4.75,t),lift=out*H*.025;
      big.style.transform=`translate(-50%,calc(-50% - ${lift}px)) scale(${scale})`;
      big.style.opacity=ease(.08,.27,t)*(1-out);
      const sweep=ease(.85,1.9,t);shine.style.backgroundPosition=(135-sweep*190)+'% 0';shine.style.opacity=t>=.85&&t<=1.9?Math.sin(sweep*Math.PI)*.85:0;
      flash.style.opacity=t<.65?Math.sin(clamp(t/.65)*Math.PI):0;
      glow.clearRect(0,0,W,H);paper.clearRect(0,0,W,H);glow.globalCompositeOperation='lighter';glow.lineCap='round';
      drawLights(t);drawRockets(t);drawSparks(t);drawPaper(t);
      glow.globalAlpha=1;paper.globalAlpha=1;
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  }
  return {play,stop};
})();
