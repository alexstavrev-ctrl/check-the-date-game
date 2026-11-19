/* Check the Date! A TV game about expiration dates: 3 levels x 6 rounds.
   Screens follow the sample pages Alex approved on 11/19 (Level 1, 2 and 3). The engine is the Fun Friday engine itself
   (js/ff-engine.js, an exact copy: sounds, tactile buttons, confetti, flying star, cheer line, round stamps, game-show win,
   narrator, opening page; Alex 11/19: "copy the entire game engine and framework of the fun friday game"). This file holds
   only what is new: the dates, the rounds, the calendar, the phone and the feedback. Pictures: Canva colored pencil,
   from the classroom-assets library. Level 1 (Alex 11/19, 20:24 UTC): one food at a time, "Is it expired or not?".
   Find the Date! (find/, built by its own thread, see find/README.md) starts from the level pick.
   This is a public page: no student names or student data anywhere in it. */
'use strict';
/* From the engine: $, i (the round, 0-5), done (rounds won), easy (hint on), sound, calm, unit, SFX, say, stamps, burst,
   flyStar, party, bigWin, speak, hush, showOpen, opened. */
const Q=new URLSearchParams(location.search);
const gunit=()=>Math.min(innerHeight/100,innerWidth*.005625,(innerWidth-32)/175);   /* = this game's --u in the CSS */

/* ---------- random numbers (?seed=N repeats the same rounds, for testing) ---------- */
let seed=(Number(Q.get('seed'))>>>0)||0;
function rand(){if(!seed)return Math.random();seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const ri=(a,b)=>a+Math.floor(rand()*(b-a+1));
function shuffle(a){a=a.slice();for(let k=a.length-1;k>0;k--){const j=Math.floor(rand()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a}

/* ---------- dates ---------- */
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAY=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WK=['SUN','MON','TUE','WED','THU','FRI','SAT'];
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const p2=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
const ym=d=>d.getFullYear()*100+d.getMonth();
/* the real date of the classroom (?today=2026-11-19 sets it for testing) */
function realToday(){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(Q.get('today')||'');
  if(m){const d=new Date(+m[1],+m[2]-1,+m[3]);if(!isNaN(d))return d}
  const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());
}

/* ---------- the foods ----------
   box = where the blank label sits on the 600 px Canva picture (% of the picture, measured from its pixels: labelbox.py);
   kw = the key word printed before the date; drink / many change the words we say. */
const ART='assets/foods/';
const FOODS={
  milk:     {alt:'Milk carton',        noun:'milk',      kw:'USE BY',  drink:1,box:[31.2,33.7,24,17.6],rot:1.7},
  bread:    {alt:'Bag of bread',       noun:'bread',     kw:'BEST BY', box:[29.3,45,26.5,13.7]},
  eggs:     {alt:'Egg carton',         noun:'eggs',      kw:'EXP',     many:1,box:[35.7,47,41.3,9.7],sk:-5.8},
  yogurt:   {alt:'Yogurt cup',         noun:'yogurt',    kw:'USE BY',  box:[32.6,52.8,33.6,16.2]},
  juice:    {alt:'Orange juice bottle',noun:'juice',     kw:'BEST BY', drink:1,box:[38.8,48.7,22.2,15.7]},
  cheese:   {alt:'Swiss cheese',       noun:'cheese',    kw:'EXP',     box:[35.7,45.2,30.7,16.1],rot:4},
  tortillas:{alt:'Bag of tortillas',   noun:'tortillas', kw:'BEST BY', many:1,box:[33,41.7,33.8,15.5]},
  cereal:   {alt:'Cereal box',         noun:'cereal',    kw:'BEST IF USED BY',box:[32.3,19.2,41.2,15.5],sk:-3.4},
  soup:     {alt:'Can of soup',        noun:'soup',      kw:'BEST BY', box:[31.3,33.5,37,10.2]}
};

/* ---------- the rounds (teacher plan: each level fades one support; see README) ----------
   kinds: pastM = earlier this month, yest = yesterday, futM = later this month, soon = tomorrow,
          prevM = last month (day number bigger than today's), nextM = next month (day number smaller),
          nextY = next year (month number smaller), prevY = last year (month number bigger).
   Round 1 of each level is the "Do it together" round and keeps the order of the approved sample page.
   Level 1 shows one food a round (Alex 11/19): round 1 is expired (the class does it together), then 2 more expired and
   3 still good in a new order each time, never 3 the same in a row (l1Kinds). */
const LEVELS=[
  {name:'Level 1',hintAfter:1,rounds:['milk','bread','eggs','yogurt','juice','cheese'].map((f,k)=>({foods:[f],fixed:k===0}))},
  {name:'Level 2',hintAfter:1,rounds:[
    {foods:['yogurt','milk','eggs'],kinds:['pastM','futM','pastM'],kw:{yogurt:'BEST BY'},fixed:true},
    {foods:['bread','cheese','juice'],kinds:['pastM','pastM','futM']},
    {foods:['tortillas','yogurt','milk'],kinds:['yest','futM','pastM']},
    {foods:['eggs','juice','cheese'],kinds:['prevM','nextM','pastM']},
    {foods:['milk','tortillas','bread'],kinds:['prevM','futM','yest']},
    {foods:['cheese','eggs','yogurt'],kinds:['nextM','pastM','prevM']}]},
  {name:'Level 3',hintAfter:2,rounds:[
    {foods:['bread','yogurt','eggs'],kinds:['pastM','futM','nextM'],fixed:true},
    {foods:['milk','cheese','juice'],kinds:['futM','pastM','yest']},
    {foods:['tortillas','milk','yogurt'],kinds:['nextM','prevM','futM'],fmt:['md/yyyy']},
    {foods:['cereal','bread','eggs'],kinds:['nextY','pastM','soon'],fmt:['mon'],lot:true,year:true},
    {foods:['soup','juice','cheese'],kinds:['prevY','futM','nextM'],fmt:['md/yyyy'],lot:true,year:true},
    {foods:['cereal','tortillas','soup'],kinds:['nextY','futM','soon'],fmt:['mon','md/yyyy','md/yyyy'],lot:true,year:true}]}
];

/* ---------- state ---------- */
const TOTAL=6;                                         /* rounds in a level: the engine draws this many stamps */
let T=null,pretend=false,LV=0,ROUNDS=[],tries=0,solved=false,timer=0;

function makeDate(kind){
  const y=T.getFullYear(),m=T.getMonth(),t=T.getDate(),n=dim(y,m);
  switch(kind){
    case 'pastM':return t>=3?new Date(y,m,ri(1,t-2)):new Date(y,m,t-ri(3,9));
    case 'futM': return t<=n-2?new Date(y,m,ri(t+2,n)):new Date(y,m,t+ri(3,9));
    case 'yest': return new Date(y,m,t-1);
    case 'soon': return new Date(y,m,t+1);
    case 'prevM':{const L=dim(y,m-1),lo=Math.min(Math.max(t+1,15),L);return new Date(y,m-1,ri(lo,L))}
    case 'nextM':{const hi=t>1?Math.min(t-1,12):12;return new Date(y,m+1,ri(1,hi))}
    case 'nextY':return new Date(y+1,m>0?ri(0,m-1):0,ri(1,28));
    case 'prevY':return new Date(y-1,m<11?ri(m+1,11):11,ri(1,28));
  }
}
function l1Kinds(){
  for(;;){const k=['pastM',...shuffle(['pastM','pastM','futM','futM','futM'])];
    if(!k.some((x,j)=>j>1&&x===k[j-1]&&x===k[j-2]))return k}
}
function lotCode(){return 'L'+ri(1,9)+ri(100,999)+' '+p2(ri(5,22))+':'+p2(ri(0,59))}
function makeRound(plan){
  for(let n=0;n<80;n++){
    const cards=plan.foods.map((f,i)=>{const d=makeDate(plan.kinds[i]);
      return {food:f,kind:plan.kinds[i],date:d,good:d>T,kw:(plan.kw&&plan.kw[f])||FOODS[f].kw,fmt:(plan.fmt&&plan.fmt[i])||'md/yy',lot:plan.lot?lotCode():''}});
    const ks=cards.map(c=>key(c.date));
    if(new Set(ks).size<ks.length||ks.includes(key(T)))continue;
    return {plan,cards:plan.fixed?cards:shuffle(cards)};
  }
}
function newLevel(n){
  LV=n;i=0;done=new Set();
  const real=realToday();T=real;pretend=false;
  /* Levels 1 and 2 use this month's calendar. Too close to the start or end of the month there are no days on one side,
     so we pretend today is the 15th (and say so on the calendar). */
  if(n<2){const t=real.getDate(),len=dim(real.getFullYear(),real.getMonth());
    if(t<4||t>len-3){T=new Date(real.getFullYear(),real.getMonth(),15);pretend=true}}
  if(n===0){const k=l1Kinds();ROUNDS=LEVELS[0].rounds.map((p,j)=>makeRound({...p,kinds:[k[j]]}))}
  else ROUNDS=LEVELS[n].rounds.map(makeRound);
}

/* ---------- words ---------- */
function printed(c){                                  /* the date as it is printed on the package */
  const d=c.date,M=MON[d.getMonth()],dd=d.getDate(),mm=p2(d.getMonth()+1);
  if(LV<2)return M+' '+dd;
  if(c.fmt==='md/yyyy')return mm+'/'+p2(dd)+'/'+d.getFullYear();
  if(c.fmt==='mon')return M+' '+p2(dd)+' '+d.getFullYear();
  return mm+'/'+p2(dd)+'/'+p2(d.getFullYear()%100);
}
const WHY={pastM:'is before today',yest:'was yesterday',futM:'is after today',soon:'is tomorrow',prevM:'was last month',nextM:'is next month',nextY:'is next year',prevY:'was last year'};
function why(c){
  const sameM=ym(c.date)===ym(T);
  if((c.kind==='pastM'||c.kind==='futM')&&!sameM)return c.good?'is after today':'is before today';
  return WHY[c.kind];
}
const it=c=>FOODS[c.food].many?'them':'it';
const eat=c=>FOODS[c.food].drink?'drink':'eat';
function goodLine(c){return 'Still good! '+printed(c)+' '+why(c)+'.'}
function badLine(c){return 'Expired! '+printed(c)+' '+why(c)+'. Don’t '+eat(c)+' '+it(c)+'.'}
function spoken(c){const d=c.date;return MONTH[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()}

/* ---------- the pieces of a round ---------- */
function dotLine(s,cls){return dotText(s).replace('class="dots"','class="dots '+cls+'"')}
function kwLines(kw){return kw==='BEST IF USED BY'?['BEST IF','USED BY']:[kw]}
const cols=s=>s.length*6-1;                          /* dot columns of a dot-matrix line */
function labelParts(c,dpw){
  const f=FOODS[c.food],t=printed(c);
  if(LV===0){const [M,dd]=t.split(' ');
    return {small:'<span class="mo">'+M+'</span><span class="dd">'+dd+'</span>',big:'<div class="row"><span class="mo">'+M+'</span><span class="dd">'+dd+'</span></div>'}}
  if(LV===1)return {small:'<span class="kw">'+c.kw+'</span><span class="dt">'+t+'</span>',big:'<span class="kw'+(c.kw.length>8?' long':'')+'">'+c.kw+'</span><span class="dt">'+t+'</span>'};
  /* Level 3: dot-matrix print, like a real inkjet date. The small copy on the package gets a dot size that fits its label. */
  const lines=[...kwLines(c.kw).map(s=>[s,'kline']),[t,'dline']];if(c.lot)lines.push([c.lot,'lot']);
  const h=lines.map(([s,k])=>dotLine(s,k)).join('');
  const [,,lw,lh]=f.box,mc=Math.max(...lines.map(([s])=>cols(s))),n=lines.length;
  const dp=Math.min(.3,.86*lw/mc,.86*lh/(8.6*n-1.6));
  return {small:h,big:h,st:'--dp:'+dp.toFixed(3)+'cqw'};
}
/* a food card. Levels 2 and 3: the card is the answer (tap it). Level 1: the card only shows the food; the answer buttons are beside it. */
function cardHTML(c,i){
  const f=FOODS[c.food],[lx,ly,lw,lh]=f.box,lab=labelParts(c);
  const wide=LV===0&&lw/lh>2.6?' wide':'',tag=LV===0?'div':'button',role=LV===0?' role="img"':'';
  return '<'+tag+' class="choice food" style="--i:'+i+'" data-i="'+i+'"'+role+' aria-label="'+tileWords(c)+'">'+
    '<div class="pic" style="--lx:'+lx+'%;--ly:'+ly+'%;--lw:'+lw+'%;--lh:'+lh+'%;--rot:'+(f.rot||0)+'deg;--sk:'+(f.sk||0)+'deg">'+
    '<img src="'+ART+c.food+'.webp" alt="" draggable="false"><div class="plabel'+wide+'"'+(lab.st?' style="'+lab.st+'"':'')+'>'+lab.small+'</div></div>'+
    '<svg class="cone" aria-hidden="true"></svg><div class="win">'+lab.big+'</div></'+tag+'>';
}
/* Level 1: the two answers, always in the same place (Expired on top), in the words of the question */
const ICON={bad:'<path d="M7 7l10 10M17 7L7 17"/>',good:'<path d="M5.5 12.5l4.2 4.2L18.5 7.5"/>'};
function answersHTML(){
  const b=(k,w,n)=>'<button class="choice ans '+k+'" data-a="'+k+'" style="--i:'+n+'"><span class="aico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">'+ICON[k]+'</svg></span><span class="word">'+w+'</span></button>';
  return '<div class="answers">'+b('bad','Expired',1)+b('good','Not expired',2)+'</div>';
}
function calHTML(rd){
  const y=T.getFullYear(),m=T.getMonth(),t=T.getDate(),n=dim(y,m),first=new Date(y,m,1).getDay(),rows=Math.ceil((first+n)/7);
  let h='<div class="cal '+(LV===0?'l1c':'l2c')+(rows>5?' six':'')+'" id="cal" role="img" aria-label="Calendar for '+MONTH[m]+'. Today is '+MONTH[m]+' '+t+'.">'+
    (pretend?'<span class="pretend">Pretend today is '+MON[m]+' '+t+'</span>':'')+
    '<div class="calhead">'+MONTH[m].toUpperCase()+'</div><div class="wk">'+WK.map(s=>'<span>'+s+'</span>').join('')+'</div><div class="days">';
  for(let k=0;k<rows*7;k++){const d=k-first+1;
    if(d<1||d>n){h+='<span class="d blank"></span>';continue}
    h+='<span class="d'+(d<t?' past':d===t?' today':'')+'" data-d="'+d+'"><i>'+d+'</i>'+(d===t?'<small>TODAY</small>':'')+'</span>'}
  h+='</div></div>';
  /* Level 2, later rounds: a date in last or next month. A strip shows which month comes before and after. */
  if(LV===1&&rd.cards.some(c=>ym(c.date)!==ym(T))){
    const a=new Date(y,m-1,1),b=new Date(y,m+1,1);
    h+='<div class="months" id="months"><span class="before" data-m="'+ym(a)+'">'+MON[a.getMonth()]+'<b>last month</b></span><span class="now" data-m="'+ym(T)+'">'+MON[m]+
      '<b>this month</b></span><span class="after" data-m="'+ym(b)+'">'+MON[b.getMonth()]+'<b>next month</b></span></div>'}
  return '<div class="calwrap">'+h+'</div>';
}
function clockNow(){const n=new Date();return (n.getHours()%12||12)+':'+p2(n.getMinutes())}
function phoneHTML(rd){
  const d=T,yr=rd.plan.year?'<br>'+d.getFullYear():'';
  return '<div class="phonewrap"><div class="phone" role="img" aria-label="Phone: today is '+WEEKDAY[d.getDay()]+', '+MONTH[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()+'.">'+
    '<div class="scr"><div class="pdate">'+WEEKDAY[d.getDay()]+',<br>'+MONTH[d.getMonth()]+' '+d.getDate()+yr+'</div><div class="ptime" id="ptime">'+clockNow()+'</div>'+
    '<div class="pnum"><small>TODAY</small>'+p2(d.getMonth()+1)+'/'+p2(d.getDate())+'/'+p2(d.getFullYear()%100)+'</div>'+
    '<div class="picons"><span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"><path d="M8 2h8v5l-2 3v12h-4V10L8 7z"/></svg></span>'+
    '<span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg></span></div></div></div></div>';
}

/* ---------- a round is won: the Fun Friday finish (green bells, confetti, the star flies to its stamp) ---------- */
function finish(el){
  const k=i,first=!done.has(k);done.add(k);solved=true;$('game').classList.add('solved');
  $('next').hidden=false;$('donebtn').hidden=true;SFX.win();
  if(el){const [x,y]=centre(el);burst(x,y,first?90:40)}
  if(first)flyStar(el,k);else stamps();
}

/* ---------- one round ---------- */
function cardsOf(){return [...document.querySelectorAll('#main .food')].map(el=>{const c=ROUNDS[i].cards[+el.dataset.i];c.el=el;return c})}
function verdict(c){
  const w=c.el.querySelector('.win');if(w.querySelector('.verdict'))return;
  const v=document.createElement('span');v.className='verdict '+(c.good?'good':'bad');v.textContent=c.good?(LV===0?'NOT EXPIRED':'STILL GOOD'):'EXPIRED';w.appendChild(v);
}
/* Levels 1 and 2: a little picture of the food is pinned on its date, on the calendar (or on the month strip) */
function pin(c,fromHint){
  if(LV===2)return;
  const d=c.date;let host=null;
  if(ym(d)===ym(T))host=document.querySelector('#cal .d[data-d="'+d.getDate()+'"]');
  else host=document.querySelector('#months span[data-m="'+ym(d)+'"]');
  if(!host)return;
  const old=host.querySelector('.pin[data-c="'+c.el.dataset.i+'"]');if(old){if(!fromHint)delete old.dataset.h;return}
  const p=document.createElement('span');p.className='pin '+(c.good?'good':'bad');p.dataset.c=c.el.dataset.i;if(fromHint)p.dataset.h='1';
  p.innerHTML='<img src="'+ART+c.food+'.webp" alt="">';host.appendChild(p);host.classList.add('lit');
}
const HINT=[
  ()=>'A crossed-out day is before today.',
  ()=>'Find each date on the calendar. Is it before today?',
  ()=>'Today is '+p2(T.getMonth()+1)+'/'+p2(T.getDate())+'/'+p2(T.getFullYear()%100)+'. Is each date before today?'];
const TOGETHER=['Find the date. Find today on the calendar. Is the date before today?','Find the date. Find today on the calendar. Is the date before today?','Find the date. Find today on the phone. Is the date before today?'];
function setHint(on,auto){
  easy=on;$('game').classList.toggle('hinted',on);$('easy').setAttribute('aria-pressed',String(on));
  const h=$('hint');
  if(on){h.textContent=HINT[LV]();h.hidden=false;cardsOf().forEach(c=>pin(c,true))}
  else{document.querySelectorAll('#main .pin[data-h]').forEach(p=>{const host=p.parentNode;p.remove();if(host&&!host.querySelector('.pin'))host.classList.remove('lit')});
    if(i===0){h.textContent=TOGETHER[LV];h.hidden=false}else h.hidden=true}
  cones();
}
function miss(){tries++;if(!easy&&tries>=LEVELS[LV].hintAfter)setHint(true,true)}

function notLine(c){return 'Not expired! '+printed(c)+' '+why(c)+'. It is still good.'}
function answer(b){                                   /* Level 1: is the one food expired or not? */
  if(solved||b.classList.contains('no'))return;
  const c=cardsOf()[0],right=(b.dataset.a==='good')===c.good;
  if(right){b.classList.add('yes');
    document.querySelectorAll('#main .ans').forEach(o=>{if(o!==b)o.classList.add('rest')});
    sayTile(c);pin(c,false);verdict(c);say(c.good?notLine(c):badLine(c));finish(b);
  }else{b.classList.add('no');SFX.oops();say('Look again. Find '+printed(c)+' on the calendar.',true);miss()}
}
function tapOne(c){                                   /* Level 2: one food is still good */
  if(solved||c.el.classList.contains('no'))return;
  sayTile(c);pin(c,false);verdict(c);
  if(c.good){c.el.classList.add('yes');
    cardsOf().forEach(o=>{if(o!==c){verdict(o);pin(o,false);o.el.classList.add('rest')}});
    say(goodLine(c));finish(c.el);
  }else{c.el.classList.add('no');SFX.oops();say(badLine(c),true);miss()}
}
function tapMany(c){                                  /* Level 3: pick every food that is still good, then Done */
  if(solved||c.el.classList.contains('no'))return;
  const on=c.el.classList.toggle('sel');
  try{on?SFX.click():SFX.key()}catch(e){}
  say('');doneState();
}
function doneState(){}
function checkDone(){
  if(solved)return;
  const cs=cardsOf(),sel=cs.filter(c=>c.el.classList.contains('sel'));
  if(!sel.length){say('Tap the foods that are still good.',true);return}
  const bad=sel.filter(c=>!c.good);
  if(bad.length){
    bad.forEach(c=>{c.el.classList.remove('sel');c.el.classList.add('no');verdict(c)});
    SFX.oops();say(bad.length===1?badLine(bad[0]):'Those are expired. Their dates are before today.',true);miss();doneState();return}
  const left=cs.filter(c=>c.good&&!c.el.classList.contains('sel'));
  if(left.length){SFX.oops();say(left.length===1?'There is 1 more food that is still good.':'There are '+left.length+' more foods that are still good.',true);miss();return}
  cs.forEach(c=>{verdict(c);if(c.good){c.el.classList.remove('sel');c.el.classList.add('yes')}else c.el.classList.add('rest')});
  say(sel.length===cs.length?'All still good! Every date is after today.':'You found them all!');
  finish(sel[sel.length-1].el);
}

function renderRound(){
  stopWin();clearInterval(timer);
  const lv=LEVELS[LV],rd=ROUNDS[i],g=$('game'),m=$('main');
  tries=0;solved=false;easy=false;
  g.className='game l'+(LV+1)+(i===0?' together-on':'');
  $('lvl').textContent=lv.name;$('together').hidden=i!==0;$('easy').setAttribute('aria-pressed','false');
  stamps();say('');
  const q=LV===0?'Is it <b>expired</b> or not?':LV===1?'Which food is <b>still good</b>?':'Tap <b>every</b> food that is still good.';
  const side=LV===2?phoneHTML(rd):calHTML(rd),cards=rd.cards.map(cardHTML);
  /* Level 3 prints every label in a round with the same dot size, sized to the longest line */
  let dpw='';
  if(LV===2){const mc=Math.max(...rd.cards.flatMap(c=>[...kwLines(c.kw),printed(c),c.lot].filter(Boolean).map(cols)));dpw=' style="--dpw:calc(var(--u)*'+Math.min(.6,34.6/mc).toFixed(3)+')"'}
  m.className='';void m.offsetWidth;
  const dense=LV===2&&rd.cards.some(c=>kwLines(c.kw).length+1+(c.lot?1:0)>3)?' dense':'';
  m.innerHTML='<div class="qrow"><h1 id="q">'+q+'</h1><p class="hint" id="hint"'+(i===0?'':' hidden')+'>'+(i===0?TOGETHER[LV]:'')+'</p></div>'+
    '<div class="stage'+dense+'"'+dpw+'>'+(LV===0?cards[0]+side+answersHTML():side+cards.join(''))+'</div>';
  m.classList.add('enter');
  m.querySelectorAll('.food').forEach(el=>{const c=rd.cards[+el.dataset.i];c.el=el;if(LV>0)el.onclick=()=>LV===2?tapMany(c):tapOne(c)});
  m.querySelectorAll('.ans').forEach(b=>b.onclick=()=>answer(b));
  $('next').hidden=!done.has(i);$('donebtn').hidden=LV!==2||done.has(i);$('skip').hidden=false;
  if(LV===2)timer=setInterval(()=>{const p=$('ptime');if(p)p.textContent=clockNow()},15000);
  fitLabels();requestAnimationFrame(cones);setTimeout(cones,520);
}
/* Levels 1 and 2: shrink the small printed label if a word is too long for that package's label */
function fitLabels(){
  if(LV===2)return;
  document.querySelectorAll('#main .plabel').forEach(el=>{
    let s=1;el.style.setProperty('--ls',1);
    const kids=[...el.children],row=el.classList.contains('wide');
    const fits=()=>{const W=el.clientWidth,H=el.clientHeight;
      const w=row?kids.reduce((a,k)=>a+k.offsetWidth,0)*1.08:Math.max(...kids.map(k=>k.offsetWidth));
      const h=row?Math.max(...kids.map(k=>k.offsetHeight)):kids.reduce((a,k)=>a+k.offsetHeight,0);
      return w<=W*.94&&h<=H*.96};
    while(!fits()&&s>.45){s-=.05;el.style.setProperty('--ls',s.toFixed(2))}
  });
}
/* the "zoom" cone from the small label on the package to its big copy below */
function cones(){
  document.querySelectorAll('#main .food').forEach(c=>{
    const cr=c.getBoundingClientRect(),l=c.querySelector('.plabel').getBoundingClientRect(),w=c.querySelector('.win').getBoundingClientRect(),svg=c.querySelector('.cone');
    if(!cr.width)return;
    svg.setAttribute('viewBox','0 0 '+cr.width.toFixed(1)+' '+cr.height.toFixed(1));
    const pt=(x,y)=>(x-cr.left).toFixed(1)+','+(y-cr.top).toFixed(1),k=gunit()*.6;
    svg.innerHTML='<polygon points="'+pt(l.left,l.top)+' '+pt(l.right,l.top)+' '+pt(w.right-k,w.top+k)+' '+pt(w.left+k,w.top+k)+'"/>';
  });
}
addEventListener('resize',()=>{if(!$('game').hidden){fitLabels();cones()}});

/* ---------- screens: the Fun Friday flow (Next and Skip go on, Back goes back, a whoosh between rounds, a party at the end) ---------- */
function stopWin(){const ws=$('winstage');if(ws)WINFX.stop(ws)}
function screen(id){
  if(id!=='find'&&!$('find').hidden&&window.FindTheDate)FindTheDate.stop();   /* leaving Find the Date any other way stops it (HOOK.md) */
  ['pick','game','done','find'].forEach(s=>{$(s).hidden=s!==id});scrollTo(0,0)}
function showPick(){stopWin();hush();clearInterval(timer);screen('pick')}
/* Find the Date! (find/find.js): level 0 to 3 = Level 1 to 4. Back on its round 1, or Pick a level on its done page, comes back here. */
function startFind(n,r){
  if(!window.FindTheDate)return;stopWin();hush();clearInterval(timer);screen('find');
  FindTheDate.start($('find'),{level:n,round:r||0,today:realToday(),rand,onExit:()=>{FindTheDate.stop();showPick()}});
}
/* the level pick shows Check the Date's 3 levels or Find the Date's 4 */
function pickMode(m){
  document.querySelectorAll('.mode').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m)));
  $('levels-check').hidden=m!=='check';$('levels-find').hidden=m!=='find';
}
function startLevel(n){newLevel(n);screen('game');renderRound();SFX.whoosh();sayRound()}
function go(n){
  if(n<0){showPick();SFX.whoosh();return}               /* Back on round 1: the level pick (in Fun Friday: the opening page) */
  if(n>=TOTAL){showDone();return}
  i=n;renderRound();SFX.whoosh();sayRound();
}
function showDone(){
  stopWin();clearInterval(timer);screen('done');
  const n=LV+1;$('dtitle').textContent='Level '+n+' done!';
  $('dstars').innerHTML=[0,1,2,3,4,5].map(k=>done.has(k)?P('star','⭐').replace('alt=""','alt="star" style="animation-delay:'+(k*90)+'ms"'):'<span class="nostar" aria-label="skipped"></span>').join('');
  $('nextlv').hidden=LV>=2;$('nextlv').textContent='Level '+(n+1);
  party();LINES.end='Level '+n+' done! If the date is before today, it is expired. Do not eat it. Ask an adult.';speak('end',450);
  if(done.size===TOTAL)setTimeout(()=>bigWin($('dstars')),350);   /* every round won: the Fun Friday game-show win, spotlight on the stars */
}

/* ---------- the narrator (the engine's speak and hush). It is off for now, as in Fun Friday, until the recorded voices are ready.
   It reads the question when a round opens and the date on a package when it is tapped. Level 3 practises reading the printed
   date, so there it reads only the question. ---------- */
const LINES={};
const KWSAY={'USE BY':'Use by','BEST BY':'Best by','EXP':'Expires','BEST IF USED BY':'Best if used by'};
function tileWords(c){return FOODS[c.food].alt+'. '+(LV===0?'':KWSAY[c.kw]+' ')+spoken(c)+'.'}
function sayRound(){const q=$('q');if(q){LINES.q=q.textContent;speak('q',450)}}
function sayTile(c){if(LV===2)return;LINES.t=tileWords(c);speak('t')}

/* ---------- opening page: the engine's showOpen(); the Start button opens the level pick ---------- */
$('startbtn').onclick=()=>{
  if(opened)return;opened=true;$('startbtn').disabled=true;const o=$('open');
  try{SFX.chime()}catch(e){}                            /* Fun Friday plays its chime and a bus honk; this game has no bus */
  showPick();o.classList.add('leave');
  setTimeout(()=>{o.hidden=true;o.classList.remove('leave');TFX.hide()},calm?0:220);
};

/* ---------- buttons and keys (the Fun Friday ones, plus the level pick and Done) ---------- */
document.querySelectorAll('#levels-check .lvcard').forEach(b=>b.onclick=()=>startLevel(+b.dataset.l));
document.querySelectorAll('#levels-find .lvcard').forEach(b=>b.onclick=()=>{startFind(+b.dataset.f);SFX.whoosh()});
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{pickMode(b.dataset.m);SFX.click()});
$('pickback').onclick=()=>{hush();showOpen()};
$('next').onclick=()=>go(i+1);
$('skip').onclick=()=>go(i+1);
$('back').onclick=()=>go(i-1);
$('donebtn').onclick=checkDone;
$('easy').onclick=()=>{setHint(!easy,false);SFX.click()};
$('again').onclick=()=>startLevel(LV);
$('levels').onclick=()=>{showPick();SFX.whoosh()};
$('nextlv').onclick=()=>startLevel(Math.min(2,LV+1));
document.querySelectorAll('.snd').forEach(b=>b.onclick=()=>{sound=!sound;document.querySelectorAll('.snd').forEach(x=>x.setAttribute('aria-pressed',String(sound)));if(!sound){hush();stopWin()}SFX.click()});
document.addEventListener('keydown',e=>{
  if(!$('open').hidden){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('startbtn').click()}return}
  if($('game').hidden)return;
  if(e.key==='ArrowRight'&&!$('next').hidden)go(i+1);
  if(e.key==='ArrowLeft')go(i-1);
});

/* ---------- start: the opening page, or straight to a level and round (?level=2&round=4) ---------- */
(function start(){
  const l=Number(Q.get('level')),r=Number(Q.get('round'));
  if(Q.get('screen')==='find'){opened=true;$('open').hidden=true;pickMode('find');startFind(Math.max(0,(l||1)-1),Math.max(0,(r||1)-1));return}
  if(l>=1&&l<=3){opened=true;$('open').hidden=true;newLevel(l-1);screen('game');i=r>=1&&r<=6?r-1:0;renderRound();
    if(Q.get('hint')==='1')setHint(true,false);return}
  if(Q.get('screen')==='pick'){opened=true;$('open').hidden=true;showPick();return}
  screen('pick');showOpen();
})();
/* the level cards show this month and this weekday */
(()=>{const d=realToday(),mh=document.querySelector('.mini-cal .mh'),mp=document.querySelector('.mini-phone>span');
  if(mh)mh.textContent=MON[d.getMonth()];if(mp)mp.innerHTML=WEEKDAY[d.getDay()]+'<b>10:24</b>'})();
