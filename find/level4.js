/* Find the Date! Level 4: messy dates. Content for the Find the Date engine (find.js imports this module only when
   Level 4 is picked, then calls rounds(kit, {today, rand})). No globals.

   Six rounds. Each round adds ONE new thing: a new way to write the date, or a new number that looks like a date, never both.
     1 peanut butter jar  BEST IF USED BY / NOV 30 2026 / 11:25 L4 2201   a time that looks like a date
     2 deli turkey tray   PACKED ON 11/17/26 and USE BY 11/24/26           two dates on one label
     3 orange juice       EXP 112826 / 14:32 L2                            no slashes
     4 crackers (Canada)  BEST BEFORE / MEILLEUR AVANT / 26 NO 25         the year comes first; NO = November
     5 spaghetti          BEST BY NOV 2026 / L6302A 21:05                  month and year only
     6 gallon of milk     NOV 29 / 06-4321                                 no clue words (06-4321 is the dairy's code)
   The prints above are the approved pictures (made for 11/19/2026). In the game every date and number comes from
   `today` and `rand`: never new Date() with no arguments, never Math.random().
   Date rules: no date equal to today. PACKED ON is in the past, as on a real label.
   Check it ("Is it still good?"): every round carries until (the last day it is good) and say (the date in words). Each game
   makes 2 or 3 of the rounds expired, picked with rand from the peanut butter, juice, crackers, spaghetti and milk; the turkey
   is always still good, because its lesson is that PACKED ON (in the past) is not the date to check. A month-and-year print
   is good until the last day of that month. The milk prints no year: the student takes the date nearest today (a gallon
   of milk is good for days, not months), which is the date's own year here, since the milk's date is 2 to 14 days away.
   Say it: the wrong choices come from real mistakes (the time read as a date, the year read as the day, the year and
   the day swapped, the PACKED ON date, the dairy code read as June). Each wrong choice has src: 'date' when it misreads
   the date itself (the engine shows the year / month / day tags), or the line it came from ('time' or 'code': a chunk k
   on the date's face; 'packed on': the reg with that what), which the engine outlines in amber instead of the tags.
   Every choice in a round has the same form, so no choice stands out without reading: rounds 1 to 4 always say the year
   (as in Levels 2 and 3), the milk never does (its print has no year). The spaghetti's right answer has no day on
   purpose (that is its lesson); its wrong ones are days read out of the year. No wrong choice names today.
   A chunk may carry tag: its name tag in Say it, when the engine's default for its k does not fit (the milk's dairy's code).

   Packages are drawn in code like real store packages (made-up brands, no real logos): flat printed colours, the brand
   and product name in Baloo 2, small print in Nunito, a real UPC-A bar code, US Nutrition Facts, the maker's address and a
   store price sticker, with one Canva picture per package (art below; find.js loads them from find/art/ before any build).
   No printed word other than the round's own clue words and distractors holds a month (MAR in MARKET, MAY in MAY CONTAIN),
   BEST, USE or EXP, or anything that reads like a date. Sizes are real millimetres: 1 unit = 100 mm, origin at the bottom
   centre, +Z front, +Y up. Every mesh carries userData.face. Prints use real letter heights (2.5 to 4.6 mm). */

const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
/* Canadian bilingual month symbols (CFIA), only the ones that are the first two letters of the English month.
   MR (March), AL (April), JN (June) and JL (July) are left out for now. */
const CA = {0:'JA',1:'FE',4:'MA',7:'AU',8:'SE',9:'OC',10:'NO',11:'DE'};
const p2 = n => String(n).padStart(2,'0');
const FIND = 'Find the date<br><b>to check.</b>';
/* the package pictures (Canva, colored-pencil picture-book style, cut out to transparent webp; classroom-assets group
   find-packages, ids find-pkg.<name>). trim = the solid part of the picture in its 600 px file. kit.art draws it. */
export const art = {
  peanuts: {file: 'peanuts.webp', trim: [27, 49, 574, 252]},
  turkey: {file: 'turkey.webp', trim: [28, 62, 574, 389]},
  oranges: {file: 'oranges.webp', trim: [37, 50, 560, 248]},
  crackers: {file: 'crackers.webp', trim: [13, 72, 588, 224]},
  pasta: {file: 'pasta.webp', trim: [6, 75, 594, 218]},
  'cow-jug': {file: 'cow-jug.webp', trim: [68, 14, 502, 291]}};   /* a picture that fails to load is skipped: the package draws a
   plain flat stand-in in its place */
/* Nutrition Facts for kit.nfacts: {serv, size, cal, rows: [[name, amount, %, indent, bold]], vit: [[name, amount, %]]} */
const PB_NF = {serv: 'about 15 servings per container', size: '2 Tbsp (32g)', cal: '190',
  rows: [['Total Fat', '16g', '21%'], ['Saturated Fat', '3g', '15%', 1, false], ['Trans Fat', '0g', '', 1, false], ['Cholesterol', '0mg', '0%'], ['Sodium', '140mg', '6%'],
    ['Total Carbohydrate', '8g', '3%'], ['Dietary Fiber', '2g', '7%', 1, false], ['Total Sugars', '3g', '', 1, false], ['Protein', '7g', '']],
  vit: [['Vitamin D', '0mcg', '0%'], ['Calcium', '10mg', '0%'], ['Iron', '0.6mg', '4%'], ['Potassium', '210mg', '4%']]};
const OJ_NF = {serv: 'about 6 servings per container', size: '8 fl oz (240mL)', cal: '110',
  rows: [['Total Fat', '0g', '0%'], ['Sodium', '0mg', '0%'], ['Total Carbohydrate', '26g', '9%'], ['Total Sugars', '22g', '', 1, false], ['Protein', '2g', '']],
  vit: [['Vitamin C', '72mg', '80%'], ['Potassium', '450mg', '10%'], ['Folate', '60mcg DFE', '15%']]};
const CR_NF = {serv: '9 servings / portions', size: '6 crackers (28g)', cal: '120',
  rows: [['Fat / Lipides', '4.5g', '6%'], ['Sodium', '160mg', '7%'], ['Carbohydrate / Glucides', '20g', '7%'], ['Fibre / Fibres', '3g', '11%', 1, false],
    ['Sugars / Sucres', '0g', '', 1, false], ['Protein / Protéines', '3g', '']],
  vit: [['Iron / Fer', '1.1mg', '6%'], ['Potassium', '120mg', '3%']]};
const PASTA_NF = {serv: '8 servings per container', size: '2 oz (56g) dry', cal: '200',
  rows: [['Total Fat', '1g', '1%'], ['Sodium', '0mg', '0%'], ['Total Carbohydrate', '42g', '15%'], ['Dietary Fiber', '2g', '7%', 1, false], ['Total Sugars', '2g', '', 1, false], ['Protein', '7g', '']],
  vit: [['Iron', '2mg', '10%'], ['Thiamin', '0.4mg', '35%'], ['Folate', '100mcg DFE', '25%']]};
const MILK_NF = {serv: '16 servings per container', size: '1 cup (240mL)', cal: '150',
  rows: [['Total Fat', '8g', '10%'], ['Saturated Fat', '5g', '25%', 1, false], ['Trans Fat', '0g', '', 1, false], ['Cholesterol', '35mg', '12%'], ['Sodium', '125mg', '5%'],
    ['Total Carbohydrate', '12g', '4%'], ['Total Sugars', '12g', '', 1, false], ['Protein', '8g', '']],
  vit: [['Vitamin D', '2.5mcg', '10%'], ['Calcium', '300mg', '25%'], ['Potassium', '380mg', '8%']]};
/* round.close: the close look's framing, tested with the v3 layout. pts are points in mm, group-local (origin at the bottom
   centre); frame them all in the free area, with the package at rx, ry (YXZ). Most are the 8 corners of a box round the
   print; a few more mark the edge of the package that faces the words, so the package never covers them. The framing may
   stop short on the far side (the package then runs off that way, away from the words). The deli, crackers and spaghetti
   boxes are the approved pictures' framings. clear: 'strip' means the package also runs off the top of the screen there,
   so the free area's left edge is the right edge of the top strip too (peanut butter). */

export function rounds(kit, {today, rand}) {
  const {THREE, cv, dots, MM, V, pt, para, rr, upc, nfacts, priceDot, snowflake, recycle, waveBand} = kit;

  /* ---------- dates and numbers from today and rand ---------- */
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const add = n => new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + n);
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const yy = d => p2(d.getFullYear() % 100);
  const full = d => `${MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const md = (m, day) => `${MONTH[m]} ${day}`;
  const mdYear = (m, day, y) => `${MONTH[m]} ${day}, ${y}`;
  const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  /* which rounds are expired today (Check it): 2 or 3 of peanut butter (0), juice (2), crackers (3), spaghetti (4), milk (5) */
  const gone = new Set(); { const pool = [0, 2, 3, 4, 5], k = ri(2, 3);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    pool.slice(0, k).forEach(i => gone.add(i)); }
  const time24 = () => `${ri(13, 23)}:${p2(ri(0, 59))}`;               /* 13:00 to 23:59, can't be read as a month */
  /* three choices: the right one first, then the wrong ones in order of preference; duplicates and look-alikes of the
     right answer are skipped; the order is shuffled with rand */
  /* a choice must name a real day (no February 30); a choice with no year may be February 29 */
  /* a choice names today: the full date, or today's month and day when the choice has no year (the milk, the spaghetti) */
  const isToday = t => { const x = t.match(/^([A-Z][a-z]+) (\d{1,2})(?:, (\d{4}))?$/); return !!x && MONTH.indexOf(x[1]) === t0.getMonth() && +x[2] === t0.getDate() && (!x[3] || +x[3] === t0.getFullYear()); };
  const real = t => { const x = t.match(/^([A-Z][a-z]+) (\d{1,2})(?:, (\d{4}))?$/); if (!x) return true; const mi = MONTH.indexOf(x[1]), d = +x[2], y = x[3] ? +x[3] : 2028, dt = new Date(y, mi, d); return mi >= 0 && d >= 1 && dt.getMonth() === mi && dt.getDate() === d; };
  function choices(right, wrong) {
    const key = t => t.toLowerCase().replace(/,? \d{4}$/, ''), seen = new Set([right.t.toLowerCase()]), near = key(right.t);
    const out = [{t: right.t, ok: true, coach: right.coach}];
    /* spare: the month next to it, the same day (a month misread), only if the predicted mistakes run out */
    const x = right.t.match(/^([A-Z][a-z]+)( .*)$/), mi = x ? MONTH.indexOf(x[1]) : -1;
    const spare = mi < 0 ? [] : [1, 11].map(k => ({t: MONTH[(mi + k) % 12] + x[2], coach: `Look at the <b>month</b> again.`, src: 'date'}));
    for (const w of wrong.concat(spare)) {
      if (out.length >= 3) break;
      if (!w || !w.t || !real(w.t) || isToday(w.t)) continue;
      const lo = w.t.toLowerCase();
      if (seen.has(lo) || key(w.t) === near) continue;
      seen.add(lo); out.push({t: w.t, ok: false, coach: w.coach, src: w.src || 'date'});
    }
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  /* ---------- drawing helpers (local, so this module only needs the kit) ---------- */
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; };
  const lam = (c, o) => new THREE.MeshLambertMaterial(Object.assign({map: tex(c)}, o || {}));
  const decalMat = c => new THREE.MeshLambertMaterial({map: tex(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4});
  const quadMesh = (p, m) => { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p.flatMap(v => v.toArray()), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0,0, 1,0, 1,1, 0,1], 2)); g.setIndex([0,1,2, 0,2,3]); g.computeVertexNormals();
    const me = new THREE.Mesh(g, m); me.userData.p = p; return me; };
  const onQ = (p, c, px, py) => { const u = px / c.width, v = 1 - py / c.height; const a = p[0].clone().lerp(p[1], u), b = p[3].clone().lerp(p[2], u); return a.lerp(b, v); };
  const qFrame = p => { const r = p[1].clone().sub(p[0]).normalize(), u = p[3].clone().sub(p[0]).normalize(), n = r.clone().cross(u).normalize(); return () => ({r: r.clone(), u: u.clone(), n: n.clone()}); };
  const subQuad = (p, c, x0, y0, x1, y1, lift) => [onQ(p, c, x0, y1), onQ(p, c, x1, y1), onQ(p, c, x1, y0), onQ(p, c, x0, y0)].map(v => v.add(V(0, lift || 0, 0)));
  /* a canvas wrapped round a cylinder: canvas px -> group-local point, and the frame there */
  const cylMap = (c, rmm, hmm, ycmm, th0, thL) => (px, py) => { const th = th0 + (px / c.width) * thL, y = MM(ycmm) + MM(hmm) / 2 - (py / c.height) * MM(hmm); return V(MM(rmm) * Math.sin(th), y, MM(rmm) * Math.cos(th)); };
  const cylFrame = (c, th0, thL) => (px) => { const th = th0 + (px / c.width) * thL; return {r: V(Math.cos(th), 0, -Math.sin(th)), u: V(0, 1, 0), n: V(Math.sin(th), 0, Math.cos(th))}; };
  /* a lathe body: the texture's v follows the profile points */
  const latheMap = (prof, c) => (px, py) => { const th = (px / c.width) * 2 * Math.PI, j = (1 - py / c.height) * (prof.length - 1), i = Math.min(prof.length - 2, Math.floor(j)), f = j - i;
    const r = prof[i][0] + (prof[i + 1][0] - prof[i][0]) * f, y = prof[i][1] + (prof[i + 1][1] - prof[i][1]) * f; return V(MM(r) * Math.sin(th), MM(y), MM(r) * Math.cos(th)); };
  const latheFrame = c => cylFrame(c, 0, 2 * Math.PI);
  /* flat print: a face filled with one colour, a band across it, a soft shine on clear plastic, ridges round a cap */
  const flat = (c, col) => { const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return x; };
  const band = (x, c, y0, y1, col) => { x.fillStyle = col; x.fillRect(0, y0 * c.k, c.width, (y1 - y0) * c.k); };
  const shine = (x, c, u, w, a) => { x.save(); x.globalAlpha = a; x.fillStyle = '#fff'; x.fillRect(c.width * u, 0, c.width * w, c.height); x.restore(); };
  const ridges = (x, c, col, step, inset) => { x.save(); x.strokeStyle = col; x.lineWidth = c.k * .35; for (let i = 0; i < c.width; i += c.k * step) { x.beginPath(); x.moveTo(i, c.k * inset); x.lineTo(i, c.height - c.k * inset); x.stroke(); } x.restore(); };
  /* a package picture centred at (xm, ym) mm, as big as fits mw x mh mm; if the picture did not load, draw the plain stand-in */
  const fit = (x, c, name, xm, ym, mw, mh, stand) => { const t = art[name] && art[name].trim, w = t ? Math.min(mw, mh * (t[2] - t[0]) / (t[3] - t[1])) : mw;
    const b = kit.art ? kit.art(x, c, name, xm, ym, w) : null; if (!b && stand) stand(); return b; };
  const peanut = (x, c, cx, cy, s) => { const k = c.k; x.save(); x.fillStyle = '#D9A15E'; x.strokeStyle = '#8A5427'; x.lineWidth = k * .45;
    for (const [ex, ey, rx, ry, a] of [[-5, 0, 6.4, 5.6, .15], [5.4, .2, 6.2, 5.4, -.1]]) { x.beginPath(); x.ellipse((cx + ex * s) * k, (cy + ey) * k, rx * s * k, ry * s * k, a, 0, 7); x.fill(); x.stroke(); } x.restore(); };
  const uni = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
  const dummy = () => { const c = cv(4, 4, 1); c.getContext('2d').fillRect(0, 0, 4, 4); return c; };

  /* ---------- the package API (find.js): the only place this module talks to the engine ---------- */
  function face(pkg, name, mesh, c, o) { mesh.userData.face = name; pkg.group.add(mesh); kit.addFace(pkg, name, mesh, c || dummy(), o || {}); return mesh; }
  function plain(pkg, name, mesh) { /* a part with no print of its own (ribs, rings, the handle) */
    const c = dummy(); return face(pkg, name, mesh, c, {map: () => mesh.position.clone(), frame: () => ({r: V(1, 0, 0), u: V(0, 1, 0), n: V(0, 0, 1)}), curved: true}); }
  function box(pkg, Q, n, c) { kit.addQuad(pkg, n, Q[n], c); }
  function reg(pkg, f, kind, b, coach, what) { const r = pkg.reg(f, kind, b), o = r || pkg.regs[pkg.regs.length - 1]; if (o) { if (coach) o.coach = coach; if (what) o.what = what; } return o; }
  function chunk(pkg, f, k, b, o) { return pkg.chunk(f, k, b, o); }
  const ink = (lines, x, y0, h, lead) => ({type: 'ink', h, x, y0, lead, align: 'left', lines});
  /* boxes (canvas px) of the date's parts (year, month, day) for the amber tags, set on the date chunk as partBoxes.
     Inkjet letters are 6 dot pitches wide (5 dots and a gap). */
  function inkParts(pkg, parts) { const c = pkg.chunks.find(c => c.k === 'date'); if (!c || !c.box) return; const b = c.box, L = (c.t || '').length || 1, p = (b[2] - b[0]) / (6 * L - 1);
    c.partBoxes = parts.map(({i, n}) => [b[0] + 6 * i * p, b[1], b[0] + (6 * (i + n) - 1) * p, b[3]]); }
  const finish = (pkg, o) => Object.assign(pkg, o);
  /* a close look (see round.close): the 8 corners of the box min..max, plus edge points, all in mm */
  const framing = (min, max, edge, rx, ry, clear) => { const pts = [];
    for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) pts.push([x, y, z]);
    return Object.assign({pts: pts.concat(edge || []), rx, ry}, clear ? {clear} : {}); };

  /* coaching lines: the middle sentence only. The engine puts "Not that one." before it and "Find {clue}." after it,
     as in the approved pictures ("Not that one. 11:25 is a time. Find BEST IF USED BY.") */
  const isTime = t => `<b>${t}</b> is a <b>time</b>.`;
  const isLine = t => `<b>${t}</b> is the <b>line</b> number.`;
  const isCode = t => `<b>${t}</b> is the <b>factory code</b>.`;
  const R4 = [];

  /* ======================================================================================================
     1. Peanut butter jar, 16 oz: body 85 mm across, 105 mm tall, red lid 21 mm. Made like a store jar: a wrap label with
        the brand in a red band, CREAMY on a gold ribbon, PEANUT BUTTER, a peanuts picture, the weight in a blue band;
        on the back Nutrition Facts, ingredients, the maker's address and the recycling mark.
        The date is black inkjet on the back label, right under the bar code, in 2.5 mm letters. New: a time that looks like a date.
     ====================================================================================================== */
  {
    const d = add(gone.has(0) ? -ri(20, 300) : ri(150, 420)), m = d.getMonth(), day = d.getDate(), Y = d.getFullYear();
    let tm = ri(10, 28); while (tm === day || p2(tm) === yy(d)) tm = ri(10, 28);
    const time = `${p2(m + 1)}:${p2(tm)}`, line = 'L' + ri(1, 9), code = String(ri(1000, 9899));
    const dateText = `${MON[m]} ${p2(day)} ${Y}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'day', i: 4, n: 2}, {t: 'year', i: 7, n: 4}];
    const build = () => {
      const pkg = kit.newPkg('peanut butter'), RED = '#D3312B', BLUE = '#1D4E9E', GOLD = '#F2B630', BROWN = '#6B2E0E', CREAM = '#FFF8EA';
      const prof = [[0,0],[37,0],[41,1.2],[42.5,4.5],[42.5,93],[41.6,97.5],[39.2,100.8],[37,102.6],[36.6,105]];
      /* the clear jar shows the peanut butter */
      const bc = cv(268, 105, 5), bx = flat(bc, '#C68A4E'); shine(bx, bc, .06, .035, .26);
      face(pkg, 'body', new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(MM(r), MM(y))), 112), lam(bc, {side: THREE.DoubleSide})), bc, {map: latheMap(prof, bc), frame: latheFrame(bc), curved: true});
      /* the paper label all the way round: u = .25 faces the front (+Z), u = .75 the back */
      const Rl = 42.85, LH = 76, LY = 12, circ = 2 * Math.PI * Rl, th0 = -Math.PI / 2;
      const lc = cv(circ, LH, 14), lx = flat(lc, CREAM), k = lc.k, FX = circ * .25, BX = circ * .75;
      band(lx, lc, 0, 11.5, RED); band(lx, lc, 11.5, 12.4, GOLD); band(lx, lc, LH - 8.9, LH - 8, GOLD); band(lx, lc, LH - 8, LH, BLUE);
      /* front */
      pt(lx, lc, 'Sunny Acres', FX, 6.2, 8.4, '#FFFFFF', {w: 800});
      rr(lx, lc, FX - 16, 14.8, 32, 7.2, 3.6, GOLD); pt(lx, lc, 'CREAMY', FX, 18.5, 4.6, '#5A2408', {w: 800, ls: .1});
      const n1 = pt(lx, lc, 'PEANUT', FX, 30, 13.4, BROWN, {w: 800}), n2 = pt(lx, lc, 'BUTTER', FX, 42.2, 13.4, BROWN, {w: 800});
      fit(lx, lc, 'peanuts', FX - 5, 56.6, 46, 17, () => { for (const [cx, cy, s] of [[FX - 14, 56.5, 1], [FX + 4, 57.5, .9]]) peanut(lx, lc, cx, cy, s); });
      const prc = priceDot(lx, lc, FX + 29, 55.5, 6.4, '$3.29');
      const wt = pt(lx, lc, 'NET WT 16 OZ (1 LB) 454g', FX, LH - 4, 3.4, '#FFFFFF', {w: 900, n: true});
      /* the two sides */
      lx.fillStyle = GOLD; lx.beginPath(); lx.arc((FX + 56) * k, 40 * k, 10.5 * k, 0, 7); lx.fill();
      pt(lx, lc, '7g', FX + 56, 37.2, 7, BROWN, {w: 800}); pt(lx, lc, 'PROTEIN', FX + 56, 43.2, 2.5, BROWN, {w: 900, n: true}); pt(lx, lc, 'per serving', FX + 56, 46.4, 1.9, BROWN, {w: 800, n: true});
      pt(lx, lc, 'Sunny Acres', 13, 40, 5.6, RED, {w: 800, max: 22});
      pt(lx, lc, 'CREAMY PEANUT BUTTER', BX, 6, 5.4, '#FFFFFF', {w: 800}); pt(lx, lc, 'Sunny Acres Foods', BX, LH - 4, 3.2, '#FFFFFF', {w: 900, n: true});
      /* back: Nutrition Facts on the left, the print in the middle (its own decal), ingredients and the maker on the right */
      const nf = nfacts(lx, lc, BX - 61.5, 13.6, 36, PB_NF, .56);
      const ing = para(lx, lc, [['INGREDIENTS: ', true], ['Roasted peanuts, sugar, palm oil, salt.', false]], BX + 21, 14.6, 34, 2.15, '#2a2a33');
      const ctn = para(lx, lc, [['CONTAINS: PEANUTS.', true]], BX + 21, ing[3] / k + 1.2, 34, 2.15, '#2a2a33');
      para(lx, lc, [['Packed for Sunny Acres Foods', false], [' Dayton, OH 45402', false]], BX + 21, ctn[3] / k + 2.4, 34, 1.9, '#2a2a33');
      recycle(lx, lc, BX + 38, 56.4, 4.2, BLUE); pt(lx, lc, 'PLEASE RECYCLE', BX + 38, 63.6, 1.9, BLUE, {w: 900, n: true});
      const label = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rl), MM(Rl), MM(LH), 160, 1, true, th0, 2 * Math.PI), lam(lc)); label.position.y = MM(LY + LH / 2);
      face(pkg, 'label', label, lc, {map: cylMap(lc, Rl, LH, LY + LH / 2, th0, 2 * Math.PI), frame: cylFrame(lc, th0, 2 * Math.PI), curved: true});
      reg(pkg, 'label', 'nutrition', nf);
      reg(pkg, 'label', 'other', uni(ing, ctn), 'Those are the <b>ingredients</b>.', 'ingredients');
      reg(pkg, 'label', 'name', uni(n1, n2));
      reg(pkg, 'label', 'weight', wt);
      reg(pkg, 'label', 'price', prc);
      /* hi-res ink print over the back middle: the bar code, the inkjet lines (a little gap under the bar code, room for a tag) and the phone line */
      const DX = BX - 18, DW = 36, DY = 14, DH = 46, Rd = Rl + .08, dc = cv(DW, DH, 46), dx = dc.getContext('2d');
      reg(pkg, 'print', 'upc', upc(dx, dc, 4.6, 2.6, 26.8, 13, '07123400516'));
      kit.printOn(pkg, dx, dc, 'print', ink([
        [{t: 'BEST IF USED BY', k: 'words'}],
        [{t: dateText, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}, {t: code, k: 'code', coach: isCode(code)}]], 1.2, 23, 2.5, 3.5));
      reg(pkg, 'print', 'other', pt(dx, dc, 'Questions? 1-800-555-0142', DW / 2, 38.9, 2.05, '#2a2a33', {w: 800, n: true}), 'That is the <b>phone number</b>.', 'phone');
      pt(dx, dc, 'Made in USA', DW / 2, 42.1, 2.05, '#2a2a33', {w: 800, n: true});
      const dth0 = th0 + 2 * Math.PI * (DX / circ), dthL = 2 * Math.PI * (DW / circ), dyc = LY + LH - (DY + DH / 2);
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 48, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      /* red ridged lid, the brand on top */
      const lidR = 43.7, lidH = 21, lidY = 102.5, sc = cv(2 * Math.PI * lidR, lidH, 7), sx = flat(sc, RED); ridges(sx, sc, 'rgba(110,15,10,.28)', 1.6, 1.2);
      const tc = cv(2 * lidR, 2 * lidR, 6), tx = flat(tc, RED);
      tx.strokeStyle = 'rgba(255,255,255,.35)'; tx.lineWidth = tc.k * .6; tx.beginPath(); tx.arc(tc.width / 2, tc.height / 2, tc.width * .42, 0, 7); tx.stroke();
      pt(tx, tc, 'Sunny Acres', lidR, lidR, 10, '#FFFFFF', {w: 800});
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(MM(lidR), MM(lidR), MM(lidH), 112, 1, false), [lam(sc), lam(tc), lam(tc)]); lid.position.y = MM(lidY + lidH / 2);
      face(pkg, 'lid', lid, sc, {map: cylMap(sc, lidR, lidH, lidY + lidH / 2, 0, 2 * Math.PI), frame: cylFrame(sc, 0, 2 * Math.PI), curved: true});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM((lidY + lidH) / 2), el: .22, noun: 'peanut butter', spot: 'print', where: 'on the back'});
    };
    R4.push({name: 'Peanut butter', newThing: 'a time that looks like a date', build, kw: 'BEST IF USED BY', clue: '<b>BEST IF USED BY</b>', dateText, date: iso(d), until: iso(d), say: full(d),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-26, 30, -44], [26, 62, -30], null, .05, Math.PI, 'strip'),
      choices: choices({t: full(d), coach: `<b>${time}</b> is only the time.`}, [
        {t: mdYear(m, tm, Y), coach: `<b>${time}</b> is a <b>time</b>.`, src: 'time'},
        {t: mdYear(m, Number(yy(d)), Y), coach: `<b>${Y}</b> is the <b>year</b>.`, src: 'date'},
        {t: mdYear(m, Number(code.slice(0, 2)) <= 28 ? Number(code.slice(0, 2)) : 12, Y), coach: `<b>${code}</b> is the <b>factory code</b>.`, src: 'code'}])});
  }

  /* ======================================================================================================
     2. Store-packed deli turkey: white foam tray 230 x 165 x 26 mm under clear film, the slices showing, and the store's
        scale label (74 x 56 mm) in the back-left corner. New: two dates on one label (PACKED ON and USE BY).
     ====================================================================================================== */
  {
    let ago = ri(1, 2), pack = add(-ago), use = add(7 - ago);
    if (use.getDate() === Number(yy(use))) { ago = 3 - ago; pack = add(-ago); use = add(7 - ago); }
    const mdy = d => `${p2(d.getMonth() + 1)}/${p2(d.getDate())}/${yy(d)}`, packText = mdy(pack), dateText = mdy(use), parts = [{t: 'month', i: 0, n: 2}, {t: 'day', i: 3, n: 2}, {t: 'year', i: 6, n: 2}];
    const lb = [6.99, 7.49, 7.99, 8.49, 8.99][ri(0, 4)], wt = ri(55, 125) / 100, tot = (Math.round(lb * wt * 100) / 100).toFixed(2);
    const build = () => {
      const W = 230, H = 26, D = 165, pkg = kit.newPkg('turkey'), Q = kit.boxQuads(MM(W), MM(H), MM(D)), GREEN = '#2E7D4F', INK = '#18181E', GREY = '#4a4a55';
      const side = (n, fw, fh) => { const c = cv(fw, fh, 5), x = flat(c, '#F5F7FA'); band(x, c, 0, 1.4, '#E3E8EE'); band(x, c, fh - 1, fh, '#E3E8EE'); box(pkg, Q, n, c); return c; };
      side('front', W, H); side('back', W, H); side('left', D, H); side('right', D, H); side('bottom', W, D);
      /* top: the foam rim, the well, the turkey slices under the film, the film's shine */
      const tc = cv(W, D, 8), tx = flat(tc, '#F7F9FB'), k = tc.k;
      rr(tx, tc, 9, 9, W - 18, D - 18, 12, '#E9EEF3', 'rgba(150,165,185,.55)', .6);
      fit(tx, tc, 'turkey', W / 2 + 22, D / 2 + 6, 168, 132, () => {
        [[96,62,34,26,.3],[124,72,36,27,-.2],[152,58,35,26,.15],[180,74,36,27,-.25],[200,100,26,22,.4],[108,112,36,27,-.1],[142,118,35,26,.25],[176,124,34,26,.1]].forEach(([cx, cy, rx, ry, a]) => {
          tx.fillStyle = '#EDC5AC'; tx.strokeStyle = '#D29D80'; tx.lineWidth = k * .7; tx.beginPath(); tx.ellipse(cx * k, cy * k, rx * k, ry * k, a, 0, 7); tx.fill(); tx.stroke(); }); });
      tx.save(); tx.globalAlpha = .4; tx.strokeStyle = '#ffffff'; tx.lineCap = 'round'; [[22,150,92,22,3],[64,160,152,26,2],[150,152,212,62,3.4]].forEach(([a, b, c2, d2, w]) => { tx.lineWidth = k * w; tx.beginPath(); tx.moveTo(a * k, b * k); tx.lineTo(c2 * k, d2 * k); tx.stroke(); }); tx.restore();
      box(pkg, Q, 'top', tc);
      /* the scale label: white, the store's green band, then the thermal print */
      const LX = 8, LY = 8, LW = 74, LH = 56, lc = cv(LW, LH, 36), lx = lc.getContext('2d'), lk = lc.k;
      lx.save(); lx.beginPath(); lx.roundRect(0, 0, lc.width, lc.height, 2.2 * lk); lx.clip(); lx.fillStyle = '#FFFFFF'; lx.fillRect(0, 0, lc.width, lc.height);
      lx.fillStyle = GREEN; lx.fillRect(0, 0, lc.width, 9.4 * lk); lx.restore();
      lx.save(); lx.strokeStyle = 'rgba(60,70,90,.3)'; lx.lineWidth = lk * .3; lx.beginPath(); lx.roundRect(lk * .15, lk * .15, lc.width - lk * .3, lc.height - lk * .3, 2.1 * lk); lx.stroke(); lx.restore();
      pt(lx, lc, 'Hilltop Grocer', LW / 2 - 6, 4.9, 5.6, '#FFFFFF', {w: 800}); pt(lx, lc, 'DELI', LW - 9, 5, 3.4, '#CDEBD6', {w: 900, n: true, ls: .12});
      const bName = pt(lx, lc, 'OVEN ROASTED TURKEY BREAST', 4, 14.2, 3.3, INK, {w: 900, n: true, a: 'left', max: 66});
      const L = (s, xm, ym, h, col, w) => pt(lx, lc, s, xm, ym, h, col || INK, {w: w || 900, n: true, a: 'left'});
      const tPack = L('PACKED ON', 4, 20.5, 2.05, GREY, 800), tUse = L('USE BY', 41, 20.5, 2.05, GREY, 800);
      const bPack = L(packText, 4, 25.5, 4.6), bUse = L(dateText, 41, 25.5, 4.6);
      lx.fillStyle = INK; lx.fillRect(4 * lk, 29.4 * lk, (LW - 8) * lk, lk * .28);
      const tLb = L('$/LB', 4, 32.8, 2.05, GREY, 800), tWt = L('NET WT LB', 19, 32.8, 2.05, GREY, 800), tTot = L('TOTAL PRICE', 44, 32.8, 2.05, GREY, 800);
      const bLb = L(lb.toFixed(2), 4, 37.6, 4.2), bWt = L(wt.toFixed(2), 19, 37.6, 4.2), bTot = L('$' + tot, 44, 38.2, 6.4);
      const ub = upc(lx, lc, 4, 42.4, 30, 8, '281234' + '00' + tot.replace('.', '').padStart(3, '0').slice(-3));
      snowflake(lx, lc, 45.6, 45.8, 1.5, GREEN); L('KEEP REFRIGERATED', 47.8, 45.8, 2.1); L('Sliced in our store', 44, 49.6, 1.9, GREY, 800);
      const lp = subQuad(Q.top, tc, LX * k, LY * k, (LX + LW) * k, (LY + LH) * k, MM(.15)), lq = quadMesh(lp, decalMat(lc));
      face(pkg, 'label', lq, lc, {map: (px, py) => onQ(lp, lc, px, py), frame: qFrame(lp), curved: false});
      /* the date and its clue words: one line in Find it, two chunks in Say it */
      chunk(pkg, 'label', 'words', tUse, {t: 'USE BY', line: 0, h: 2.05});
      const dch = chunk(pkg, 'label', 'date', bUse, {t: dateText, line: 0, h: 4.6}) || pkg.chunks.find(c => c.k === 'date');
      if (dch) { lx.save(); lx.font = '900 ' + (4.6 * lk) + 'px Nunito'; const w = t => lx.measureText(t).width; dch.partBoxes = parts.map(({i, n}) => [bUse[0] + w(dateText.slice(0, i)), bUse[1], bUse[0] + w(dateText.slice(0, i + n)), bUse[3]]); lx.restore(); }
      reg(pkg, 'label', 'other', uni(tPack, bPack), 'That is the day it was <b>packed</b>.', 'packed on');
      reg(pkg, 'label', 'price', uni(tLb, bLb), 'That is the <b>price</b> for one pound.');
      reg(pkg, 'label', 'weight', uni(tWt, bWt), 'That is the <b>weight</b>.');
      reg(pkg, 'label', 'price', uni(tTot, bTot), 'That is the <b>price</b>.');
      reg(pkg, 'label', 'upc', ub);
      reg(pkg, 'label', 'name', bName);
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'turkey', spot: 'label', where: 'on the label'});
    };
    R4.push({name: 'Deli turkey', newThing: 'two dates on one label', build, kw: 'USE BY', clue: '<b>USE BY</b>', dateText, date: iso(use), packed: iso(pack), until: iso(use), say: full(use),
      parts, month: MON[use.getMonth()], prompt: FIND, start: [.35, 0], close: framing([-115, 26, -82.5], [-27, 26, -13.5], null, Math.PI / 2 - .52, 0),
      choices: choices({t: full(use), coach: '<b>USE BY</b> is the date to check.'}, [
        {t: full(pack), coach: 'That is the day it was <b>packed</b>.', src: 'packed on'},
        {t: mdYear(use.getMonth(), Number(yy(use)), use.getFullYear()), coach: `<b>${yy(use)}</b> is the <b>year</b>.`},
        {t: full(add(7 - ago + 7)), coach: 'Read the date under <b>USE BY</b>.'}])});
  }

  /* ======================================================================================================
     3. Orange juice, 52 fl oz bottle: body 100 mm across, neck 62 mm, green cap. A wrap label like a store bottle: the brand
        in a green leaf band, 100% PURE SQUEEZED, ORANGE JUICE, NO PULP, an oranges picture, the size in an orange band;
        on the back Nutrition Facts, the bar code, KEEP REFRIGERATED, ingredients and the maker.
        The date is inkjet on the back of the neck, above the label, 3.2 mm letters. New: no slashes (EXP 112826 means 11 / 28 / 26).
     ====================================================================================================== */
  {
    const ojDay = () => add(gone.has(2) ? -ri(3, 40) : ri(9, 40));
    let d = ojDay(); for (let n = 0; n < 40 && p2(d.getDate()) === yy(d); n++) d = ojDay();
    const m = d.getMonth(), day = d.getDate(), digits = `${p2(m + 1)}${p2(day)}${yy(d)}`, time = time24(), line = 'L' + ri(1, 6), parts = [{t: 'month', i: 0, n: 2}, {t: 'day', i: 2, n: 2}, {t: 'year', i: 4, n: 2}];
    const build = () => {
      const pkg = kit.newPkg('juice'), GREEN = '#2E8B3E', ORANGE = '#EE7410';
      const prof = [[0,0],[42,0],[48,2.5],[50,9],[50,150],[48.6,163],[44,175],[37.5,185],[32.5,192],[31,197],[31,228]];
      const bc = cv(320, 60, 4), bx = flat(bc, '#F6A12E'); shine(bx, bc, .07, .025, .3);
      face(pkg, 'body', new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(MM(r), MM(y))), 112), lam(bc, {side: THREE.DoubleSide})), bc, {map: latheMap(prof, bc), frame: latheFrame(bc), curved: true});
      const Rl = 50.25, LH = 120, LY = 22, circ = 2 * Math.PI * Rl, th0 = -Math.PI / 2, lc = cv(circ, LH, 10), lx = flat(lc, '#FFFBF2'), k = lc.k, FX = circ * .25, BX = circ * .75;
      waveBand(lx, lc, -6, 13.5, 1.6, GREEN, .4); waveBand(lx, lc, 103, 126, 1.6, ORANGE, 1.1);
      /* front */
      pt(lx, lc, 'Sun Grove', FX, 6.4, 8.6, '#FFFFFF', {w: 800});
      pt(lx, lc, '100% PURE SQUEEZED', FX, 22.5, 4.4, GREEN, {w: 900, n: true, ls: .04});
      const n1 = pt(lx, lc, 'ORANGE', FX, 36.5, 18, ORANGE, {w: 800}), n2 = pt(lx, lc, 'JUICE', FX, 52, 14.5, GREEN, {w: 800});
      rr(lx, lc, FX - 14, 58.6, 28, 6.4, 3.2, GREEN); pt(lx, lc, 'NO PULP', FX, 61.9, 3.8, '#FFFFFF', {w: 900, n: true, ls: .06});
      fit(lx, lc, 'oranges', FX - 3, 82.5, 72, 31, () => { for (const [cx, cy, r] of [[FX - 10, 83, 13.5], [FX + 12, 85, 12]]) { lx.fillStyle = '#F39A1E'; lx.strokeStyle = '#C96A0C'; lx.lineWidth = k * .6; lx.beginPath(); lx.arc(cx * k, cy * k, r * k, 0, 7); lx.fill(); lx.stroke(); lx.fillStyle = 'rgba(255,255,255,.35)'; lx.beginPath(); lx.ellipse((cx - r * .35) * k, (cy - r * .4) * k, r * .3 * k, r * .18 * k, -.6, 0, 7); lx.fill(); }
        lx.fillStyle = '#3E9F52'; lx.beginPath(); lx.ellipse((FX - 3) * k, 70 * k, 7 * k, 3 * k, -.5, 0, 7); lx.fill(); });
      const prc = priceDot(lx, lc, FX + 36, 62.5, 7.2, '$4.79');
      const sz = pt(lx, lc, '52 FL OZ (1.62 QT) 1.53 L', FX, 113.4, 4.5, '#FFFFFF', {w: 900, n: true});
      /* the two sides */
      pt(lx, lc, 'Not from concentrate', FX + 79, 60, 3.6, GREEN, {w: 900, n: true, max: 36});
      pt(lx, lc, 'Sun Grove', 0, 60, 6, GREEN, {w: 800}); pt(lx, lc, 'Sun Grove', circ, 60, 6, GREEN, {w: 800});
      /* back */
      const nf = nfacts(lx, lc, BX - 50, 17, 40, OJ_NF, .7);
      const ub = upc(lx, lc, BX + 6, 19, 36, 20, '04850020262');
      snowflake(lx, lc, BX + 9, 49, 2.6, GREEN); pt(lx, lc, 'KEEP REFRIGERATED', BX + 13, 49, 3.2, GREEN, {w: 900, n: true, a: 'left', max: 29});
      const ing = para(lx, lc, [['INGREDIENTS: ', true], ['100% pure squeezed pasteurized orange juice.', false]], BX + 6, 55, 37, 2.5, '#2a2a33');
      para(lx, lc, [['Sun Grove Juice Co.', true], [' Vero Beach, FL 32960', false]], BX + 6, ing[3] / k + 2.4, 37, 2.3, '#2a2a33');
      const label = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rl), MM(Rl), MM(LH), 160, 1, true, th0, 2 * Math.PI), lam(lc)); label.position.y = MM(LY + LH / 2);
      face(pkg, 'label', label, lc, {map: cylMap(lc, Rl, LH, LY + LH / 2, th0, 2 * Math.PI), frame: cylFrame(lc, th0, 2 * Math.PI), curved: true});
      reg(pkg, 'label', 'nutrition', nf);
      reg(pkg, 'label', 'upc', ub);
      reg(pkg, 'label', 'name', uni(n1, n2));
      reg(pkg, 'label', 'size', sz);
      reg(pkg, 'label', 'price', prc);
      /* ribs on the neck */
      [214, 218.5, 223].forEach((y, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(MM(31.2), MM(.9), 8, 96), new THREE.MeshLambertMaterial({color: '#F8B24C'})); t.rotation.x = Math.PI / 2; t.position.y = MM(y); plain(pkg, 'rib' + (i + 1), t); });
      /* hi-res inkjet print on the back of the neck */
      const Rd = 31.12, DW = 34, DH = 12.6, dc = cv(DW, DH, 46), dx = dc.getContext('2d'), dyc = 199 + DH / 2, dthL = DW / Rd, dth0 = Math.PI - dthL / 2;
      kit.printOn(pkg, dx, dc, 'print', ink([
        [{t: 'EXP', k: 'words'}, {t: digits, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}]], 1.5, 1.4, 3.2, 6));
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 48, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      /* green ridged cap */
      const capR = 33, capH = 22, capY = 226, sc = cv(2 * Math.PI * capR, capH, 7), sx = flat(sc, '#3E9F52'); ridges(sx, sc, 'rgba(15,60,25,.28)', 1.6, 1.2);
      const tc = cv(2 * capR, 2 * capR, 6), tx = flat(tc, '#3E9F52'); tx.strokeStyle = 'rgba(255,255,255,.3)'; tx.lineWidth = tc.k * .6; tx.beginPath(); tx.arc(tc.width / 2, tc.height / 2, tc.width * .42, 0, 7); tx.stroke();
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(MM(capR), MM(capR), MM(capH), 112, 1, false), [lam(sc), lam(tc), lam(tc)]); cap.position.y = MM(capY + capH / 2);
      face(pkg, 'cap', cap, sc, {map: cylMap(sc, capR, capH, capY + capH / 2, 0, 2 * Math.PI), frame: cylFrame(sc, 0, 2 * Math.PI), curved: true});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM((capY + capH) / 2), el: .26, noun: 'juice', spot: 'print', where: 'on the neck'});
    };
    const sw = `${p2(day)}${p2(m + 1)}${yy(d)}`;
    R4.push({name: 'Orange juice', newThing: 'no slashes', build, kw: 'EXP', clue: '<b>EXP</b>', dateText: digits, date: iso(d), until: iso(d), say: full(d),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-40, 185, -33], [40, 249, 0], null, 0, Math.PI),
      choices: choices({t: full(d), coach: `<b>${digits}</b> means ${p2(m + 1)} / ${p2(day)} / ${yy(d)}.`}, [
        {t: mdYear(m, Number(yy(d)), d.getFullYear()), coach: `<b>${yy(d)}</b> is the <b>year</b>. Read it in twos: <b>${p2(m + 1)} / ${p2(day)} / ${yy(d)}</b>.`},
        {t: `${MONTH[m]} ${Number(yy(d))}, 20${p2(day)}`, coach: `Read it in twos: <b>month</b>, <b>day</b>, <b>year</b>.`},
        {t: mdYear(m, Number(sw.slice(2, 4)) || 1, d.getFullYear()), coach: `Read it in twos: <b>${p2(m + 1)} / ${p2(day)} / ${yy(d)}</b>.`}])});
  }

  /* ======================================================================================================
     4. Crackers made in Canada (bilingual box), 160 x 225 x 58 mm, like a store box: the brand badge, Whole Wheat,
        CRACKERS / CRAQUELINS, a crackers picture on a cream wave, the weight in grams; Nutrition Facts, ingredients in
        English and French and the bar code on the back. The date is on the bottom: printed BEST BEFORE / MEILLEUR AVANT,
        then inkjet YY MO DD (year first) and a time, line and code. New: the year comes first.
     ====================================================================================================== */
  {
    let d = null;
    const cg = gone.has(3) ? -1 : 1, fitsCA = c => CA[c.getMonth()] && c.getDate() >= 10 && c.getDate() <= 28 && p2(c.getDate()) !== yy(c);
    for (let n = 0; n < 200 && !d; n++) { const c = add(cg * ri(cg > 0 ? 60 : 30, 300)); if (fitsCA(c)) d = c; }
    if (!d) { let c = add(cg * (cg > 0 ? 60 : 30)); while (!fitsCA(c)) c = new Date(c.getFullYear(), c.getMonth(), c.getDate() + cg); d = c; }
    const m = d.getMonth(), day = d.getDate(), dateText = `${yy(d)} ${CA[m]} ${p2(day)}`, parts = [{t: 'year', i: 0, n: 2}, {t: 'month', i: 3, n: 2}, {t: 'day', i: 6, n: 2}];
    let hh = ri(1, 12); while (hh === m + 1) hh = ri(1, 12);
    const mm = ri(10, 28), time = `${p2(hh)}:${p2(mm)}`, line = 'L' + ri(1, 6), code = String(ri(1000, 9899));
    const build = () => {
      const W = 160, H = 225, D = 58, pkg = kit.newPkg('crackers'), Q = kit.boxQuads(MM(W), MM(H), MM(D)), C = {}, RED = '#C2352B', CREAM = '#FFF4DC', DARK = '#3A2A22';
      const fc = (n, fw, fh, draw, k) => { const c = cv(fw, fh, k || 6), x = flat(c, RED); draw(x, c); C[n] = c; box(pkg, Q, n, c); return c; };
      let fN, fW, fP;
      fc('front', W, H, (x, c) => {
        rr(x, c, 12, 11, 76, 21, 10.5, CREAM); pt(x, c, 'Prairie Mill', 50, 21.8, 9.6, RED, {w: 800, max: 68});
        pt(x, c, 'Whole Wheat · Blé entier', W / 2, 45, 7, '#FFE3B0', {w: 900, n: true, max: 140});
        const a = pt(x, c, 'CRACKERS', W / 2, 66, 28, CREAM, {w: 800, max: 146}), b = pt(x, c, 'CRAQUELINS', W / 2, 89, 15.5, '#FFD27A', {w: 800});
        fN = uni(a, b);
        waveBand(x, c, 112, 240, 3.2, CREAM, .5);
        fit(x, c, 'crackers', W / 2, 162, 140, 74, () => { const k = c.k; for (const [cx, cy, a] of [[52,150,-.08],[88,146,.06],[120,154,-.04],[66,180,.1],[104,178,-.06]]) { x.save(); x.translate(cx * k, cy * k); x.rotate(a); x.fillStyle = '#E2B060'; x.strokeStyle = '#B97A32'; x.lineWidth = k * .8; x.beginPath(); x.roundRect(-15 * k, -15 * k, 30 * k, 30 * k, 3 * k); x.fill(); x.stroke();
          x.fillStyle = '#B97A32'; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { x.beginPath(); x.arc(i * 8 * k, j * 8 * k, k * 1.1, 0, 7); x.fill(); } x.restore(); } });
        fP = priceDot(x, c, 137, 124, 9, '$4.29');
        fW = pt(x, c, 'NET WT 225 g · POIDS NET', W / 2, 214, 5.4, RED, {w: 900, n: true, max: 140}); });
      reg(pkg, 'front', 'name', fN);
      reg(pkg, 'front', 'weight', fW);
      reg(pkg, 'front', 'price', fP);
      let bN, bU;
      fc('back', W, H, (x, c) => { const k = c.k; rr(x, c, 10, 12, W - 20, 201, 6, CREAM);
        bN = nfacts(x, c, 16, 18, 66, CR_NF, .86);
        pt(x, c, 'Made in Canada', 117.5, 24, 4.8, '#7A2A1A', {w: 900, n: true, max: 56}); pt(x, c, 'Fabriqué au Canada', 117.5, 30.6, 4.2, '#7A2A1A', {w: 900, n: true, max: 56});
        const ing = para(x, c, [['INGREDIENTS: ', true], ['Whole wheat flour, canola oil, salt.', false]], 89, 40, 57, 3, DARK);
        const fr = para(x, c, [['INGRÉDIENTS : ', true], ['Farine de blé entier, huile de canola, sel.', false]], 89, ing[3] / k + 3, 57, 3, DARK);
        para(x, c, [['Prairie Mill Foods', true], [' Regina, Saskatchewan', false]], 89, fr[3] / k + 6, 57, 2.8, DARK);
        bU = upc(x, c, 94, 174, 46, 24, '06234598761'); });
      reg(pkg, 'back', 'nutrition', bN);
      reg(pkg, 'back', 'upc', bU);
      fc('right', D, H, (x, c) => { pt(x, c, 'CRACKERS · CRAQUELINS', D / 2, H / 2, 10, CREAM, {w: 800, rot: -Math.PI / 2, max: 200}); });
      fc('left', D, H, (x, c) => { pt(x, c, 'Prairie Mill', D / 2, H / 2, 13, CREAM, {w: 800, rot: Math.PI / 2, max: 200}); });
      fc('top', W, D, (x, c) => { rr(x, c, 30, 12, W - 60, D - 24, 6, null, 'rgba(255,244,220,.75)', .6); pt(x, c, 'OPEN HERE · OUVRIR ICI', W / 2, D / 2, 6, CREAM, {w: 900, n: true}); });
      /* the bottom (where the date is): the print is upright when the box is tipped toward the viewer */
      let w1, w2;
      const bc = fc('bottom', W, D, (x, c) => { rr(x, c, 10, 10, W - 20, D - 20, 3, CREAM);
        const L = (s, ym) => pt(x, c, s, 16, ym, 3.6, '#2a2a33', {w: 900, n: true, a: 'left'});
        w1 = L('BEST BEFORE', 21.3); w2 = L('MEILLEUR AVANT', 27.1);
        recycle(x, c, 18.6, 41.2, 2.4, '#6b5a4a'); pt(x, c, 'Recycle · Recyclez', 22.4, 41.2, 2.6, '#6b5a4a', {w: 800, n: true, a: 'left'}); }, 40);
      kit.printOn(pkg, bc.getContext('2d'), bc, 'bottom', ink([
        [{t: dateText, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}, {t: code, k: 'code', coach: isCode(code)}]], 62, 19.2, 3.6, 8.4));
      chunk(pkg, 'bottom', 'words', uni(w1, w2), {t: 'BEST BEFORE / MEILLEUR AVANT', line: 2, h: 3.6});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'crackers', spot: 'bottom', where: 'on the bottom'});
    };
    R4.push({name: 'Crackers from Canada', newThing: `the year comes first, and ${CA[m]} = ${MONTH[m]}`, build, kw: 'BEST BEFORE', clue: '<b>BEST BEFORE</b>', dateText, date: iso(d), until: iso(d), say: full(d),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-66, 0, -9], [24, 0, 17], null, -(Math.PI / 2 + .48), 0),
      choices: choices({t: full(d), coach: 'Here the <b>year</b> comes first.'}, [
        {t: `${MONTH[m]} ${Number(yy(d))}, 20${p2(day)}`, coach: 'Here the <b>year</b> comes first.'},
        {t: mdYear(hh - 1, mm, d.getFullYear()), coach: `<b>${time}</b> is a <b>time</b>.`, src: 'time'},
        {t: mdYear(m, Number(yy(d)), d.getFullYear()), coach: `<b>${yy(d)}</b> is the <b>year</b>.`}])});
  }

  /* ======================================================================================================
     5. Spaghetti, 1 lb: 68 x 262 x 38 mm, like a store box: blue, the brand in a red oval, Spaghetti and a window that
        shows the pasta, all reading up the long side; Nutrition Facts, cooking steps, ingredients and the bar code on the back.
        The date is on the top end flap in a white code box: BEST BY MON YYYY (good until the end of that month) and a lot
        code and time. New: month and year only, no day.
     ====================================================================================================== */
  {
    const k0 = t0.getMonth() + (gone.has(4) ? -ri(1, 8) : ri(10, 24)), Y = t0.getFullYear() + Math.floor(k0 / 12), m = ((k0 % 12) + 12) % 12, dateText = `${MON[m]} ${Y}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'year', i: 4, n: 4}];
    const code = 'L' + ri(1000, 9899) + 'ABCDEFGH'[ri(0, 7)], time = time24();
    const build = () => {
      const W = 68, H = 262, D = 38, pkg = kit.newPkg('spaghetti'), Q = kit.boxQuads(MM(W), MM(H), MM(D)), C = {}, BLUE = '#1F4FA8', RED = '#D3312B', CREAM = '#FFF4DE';
      const fc = (n, fw, fh, draw, k) => { const c = cv(fw, fh, k || 7), x = flat(c, BLUE); draw(x, c); C[n] = c; box(pkg, Q, n, c); return c; };
      /* a tall face whose print reads up the long side: drawn on its side, then turned. draw returns [kind, box, coach] to register */
      const up = (n, fw, fh, draw) => { const L = cv(fh, fw, 7), lx = flat(L, BLUE), regs = draw(lx, L) || [];
        const c = fc(n, fw, fh, x => { x.save(); x.translate(0, fh * x.canvas.k); x.rotate(-Math.PI / 2); x.drawImage(L, 0, 0); x.restore(); });
        for (const [kind, b, coach] of regs) reg(pkg, n, kind, [b[1], c.height - b[2], b[3], c.height - b[0]], coach); };
      up('front', W, H, (x, c) => {
        rr(x, c, 8, 7, 64, 24, 12, RED); pt(x, c, 'Casa Bella', 40, 19.2, 10, '#FFFFFF', {w: 800, max: 56});
        pt(x, c, 'ENRICHED MACARONI PRODUCT', 40, 36.4, 2.6, '#FFFFFF', {w: 900, n: true, max: 60});
        const wt = pt(x, c, 'NET WT 16 OZ (1 LB) 454g', 40, 41.6, 2.9, '#FFFFFF', {w: 900, n: true, max: 60});
        const nm = pt(x, c, 'Spaghetti', 80, 18.6, 21, '#FFFFFF', {w: 800, a: 'left', max: 170});
        rr(x, c, 80, 33, 174, 28, 8, CREAM);
        x.save(); x.beginPath(); x.roundRect(80 * c.k, 33 * c.k, 174 * c.k, 28 * c.k, 8 * c.k); x.clip();
        fit(x, c, 'pasta', 167, 47, 170, 34, () => { x.strokeStyle = '#E3B85B'; x.lineWidth = c.k * .9; for (let i = 0; i < 24; i++) { const y = (38 + i * .8) * c.k; x.beginPath(); x.moveTo(90 * c.k, y); x.lineTo(244 * c.k, y + c.k * (i % 3 - 1)); x.stroke(); } });
        x.restore();
        const pr = priceDot(x, c, 40, 55, 7.2, '$1.79');
        return [['name', nm], ['weight', wt], ['price', pr]]; });
      let nf, ub;
      fc('back', W, H, (x, c) => { const k = c.k; rr(x, c, 4, 8, W - 8, H - 16, 4, CREAM);
        nf = nfacts(x, c, 7, 12, 54, PASTA_NF, .8);
        pt(x, c, 'How to cook', 8, nf[3] / k + 6, 4.6, BLUE, {w: 800, a: 'left'});
        const st = para(x, c, [['1. ', true], ['Boil 4 quarts of water. ', false], ['2. ', true], ['Add the pasta. ', false], ['3. ', true], ['Cook 10 minutes, stirring now and then. ', false], ['4. ', true], ['Drain and serve.', false]], 8, nf[3] / k + 10, 52, 2.7, '#2a2a33');
        const ing = para(x, c, [['INGREDIENTS: ', true], ['Semolina (wheat), durum wheat flour, niacin, iron, thiamine, riboflavin, folic acid. ', false], ['CONTAINS: WHEAT.', true]], 8, st[3] / k + 4, 52, 2.4, '#2a2a33');
        para(x, c, [['Casa Bella Pasta Co.', true], [' Saint Louis, MO 63101', false]], 8, ing[3] / k + 3, 52, 2.3, '#2a2a33');
        ub = upc(x, c, 14, 222, 40, 20, '07654321098'); });
      reg(pkg, 'back', 'nutrition', nf);
      reg(pkg, 'back', 'upc', ub);
      up('right', D, H, (x, c) => { pt(x, c, 'Spaghetti', H / 2, D / 2, 14, '#FFFFFF', {w: 800}); });
      up('left', D, H, (x, c) => { rr(x, c, 70, 9, 122, 20, 10, RED); pt(x, c, 'Casa Bella', H / 2, D / 2, 10, '#FFFFFF', {w: 800}); });
      fc('bottom', W, D, () => {});
      const tc = fc('top', W, D, (x, c) => { rr(x, c, 5, 6, W - 10, D - 12, 1.6, '#FFFFFF'); }, 48);
      kit.printOn(pkg, tc.getContext('2d'), tc, 'top', ink([
        [{t: 'BEST BY', k: 'words'}, {t: dateText, k: 'date'}],
        [{t: code, k: 'code', coach: isCode(code)}, {t: time, k: 'time', coach: isTime(time)}]], 8, 10.6, 3.1, 8.4));
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'spaghetti', spot: 'top', where: 'on the top end'});
    };
    R4.push({name: 'Spaghetti', newThing: 'month and year only', build, kw: 'BEST BY', clue: '<b>BEST BY</b>', dateText, date: `${Y}-${p2(m + 1)}`, until: iso(new Date(Y, m + 1, 0)), say: `${MONTH[m]} ${Y}`,
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-34, 262, -19], [34, 262, 19], null, Math.PI / 2 - .5, 0),
      choices: choices({t: `${MONTH[m]} ${Y}`, coach: 'No day here. Say the <b>month</b> and the <b>year</b>.'}, [
        {t: md(m, Number(String(Y).slice(0, 2))), coach: `<b>${Y}</b> is the <b>year</b>. There is no day.`},
        {t: md(m, Number(String(Y).slice(2))), coach: `<b>${Y}</b> is the <b>year</b>. There is no day.`},
        {t: `${MONTH[(m + 11) % 12]} ${Y}`, coach: `<b>${MON[m]}</b> is <b>${MONTH[m]}</b>.`}])});
  }

  /* ======================================================================================================
     6. Gallon of whole milk from a California dairy: rounded-square jug 150 x 150 mm, red cap, handle at the back-right
        corner. Like a store gallon: the brand, a red VITAMIN D / WHOLE MILK band, a cow picture, 1 GALLON on the front;
        Nutrition Facts and the bar code on the left side; ingredients, the dairy and the recycling mark on the right.
        The date is inkjet on the neck under the cap, with no clue words, over the dairy's code (06 = California).
        New: no clue words at all.
     ====================================================================================================== */
  {
    const d = add(gone.has(5) ? -ri(2, 6) : ri(5, 14)), m = d.getMonth(), day = d.getDate(), dateText = `${MON[m]} ${p2(day)}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'day', i: 4, n: 2}];
    /* the dairy's code: 06 (California), then the plant number; its first two digits must not make the right date */
    let d1 = ri(1, 9); while (d1 === day || d1 === 6) d1 = ri(1, 9);
    let d2 = ri(1, 9); while ((d1 - 1 === m && d2 === day) || d1 - 1 === 5 && d2 === d1) d2 = ri(1, 9);
    const code = `06-${d1}${d2}${ri(10, 99)}`;
    const build = () => {
      const pkg = kit.newPkg('milk'), RED = '#D3312B', NAVY = '#1D3F7A';
      const A = 75, PW = 5, HB = 166, HS = 212, RN = 21, SEG = 192;
      const rSq = t => A / Math.pow(Math.pow(Math.abs(Math.cos(t)), PW) + Math.pow(Math.abs(Math.sin(t)), PW), 1 / PW);
      const ths = [...Array(SEG + 1)].map((_, i) => -Math.PI + i / SEG * 2 * Math.PI), P = ths.map(t => [rSq(t) * Math.sin(t), rSq(t) * Math.cos(t)]);
      const acc = [0]; for (let i = 1; i <= SEG; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const per = acc[SEG], uu = acc.map(a => a / per);
      /* body and shoulder as one surface, from the rounded square to the round neck; u follows the length round the jug */
      const ctrl = [[0,0],[HB,0],[HB + 9,.1],[HB + 19,.3],[HB + 29,.56],[HB + 38,.8],[HS - 2,.95],[HS,1]];
      const bAt = y => { for (let i = 1; i < ctrl.length; i++) if (y <= ctrl[i][0]) { const [a, p] = ctrl[i - 1], [c, q] = ctrl[i]; return p + (q - p) * (y - a) / (c - a); } return 1; };
      /* the hand hole: the corner behind the handle is pressed in, as on a real jug */
      const cr = Math.PI * .75, sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
      const dent = (t, y) => { const a = Math.abs(Math.atan2(Math.sin(t - cr), Math.cos(t - cr))); return a >= .46 ? 0 : 24 * Math.pow(Math.cos(a / .46 * Math.PI / 2), 2) * sm((y - 112) / 14) * sm((198 - y) / 12); };
      const rAt = (t, y) => { const b = bAt(y); return (1 - b) * rSq(t) + b * RN - dent(t, y); };
      const rings = [0, 40, 80]; for (let y = 100; y < HS; y += 4) rings.push(y); rings.push(HS - 2, HS); const RY = [...new Set(rings)].sort((a, b) => a - b), pos = [], uv = [], idx = [];
      RY.forEach(y => ths.forEach((t, i) => { const r = rAt(t, y); pos.push(MM(r * Math.sin(t)), MM(y), MM(r * Math.cos(t))); uv.push(uu[i], y / HS); }));
      for (let j = 0; j < RY.length - 1; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, e = c + 1; idx.push(a, b, e, a, e, c); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const wc = cv(per, HS, 5), wx = flat(wc, '#F2F5F8'), k = wc.k, FX = per * .5, LX = per * .25, RX = per * .75;
      /* the front label */
      rr(wx, wc, FX - 62, 62, 124, 118, 4, '#FFFFFF', 'rgba(60,70,90,.25)', .4);
      const brand = (cx, y, s) => pt(wx, wc, 'Valley Fresh', cx, y, s, NAVY, {w: 800});
      brand(FX, 74.5, 11);
      wx.fillStyle = RED; wx.fillRect((FX - 62) * k, 84 * k, 124 * k, 28 * k);
      pt(wx, wc, 'VITAMIN D', FX, 89.6, 4.8, '#FFE3DF', {w: 900, n: true, ls: .12});
      const nm = pt(wx, wc, 'WHOLE MILK', FX, 102.2, 15, '#FFFFFF', {w: 800, max: 116});
      fit(wx, wc, 'cow-jug', FX - 6, 136, 92, 42, () => { wx.fillStyle = '#7FB65A'; wx.beginPath(); wx.ellipse((FX - 6) * k, 150 * k, 46 * k, 7 * k, 0, 0, 7); wx.fill();
        wx.fillStyle = '#C8392E'; wx.fillRect((FX - 22) * k, 128 * k, 26 * k, 20 * k); wx.beginPath(); wx.moveTo((FX - 25) * k, 129 * k); wx.lineTo((FX - 9) * k, 118 * k); wx.lineTo((FX + 7) * k, 129 * k); wx.closePath(); wx.fill();
        wx.strokeStyle = '#FFFFFF'; wx.lineWidth = k * 1; wx.strokeRect((FX - 14) * k, 136 * k, 10 * k, 12 * k); wx.beginPath(); wx.moveTo((FX - 14) * k, 136 * k); wx.lineTo((FX - 4) * k, 148 * k); wx.moveTo((FX - 4) * k, 136 * k); wx.lineTo((FX - 14) * k, 148 * k); wx.stroke(); });
      const prc = priceDot(wx, wc, FX + 47, 128, 8, '$4.29');
      const sz = pt(wx, wc, '1 GALLON (3.78 L)', FX, 163.8, 6.6, NAVY, {w: 900, n: true});
      pt(wx, wc, 'GRADE A · PASTEURIZED · HOMOGENIZED', FX, 173.2, 3.2, NAVY, {w: 900, n: true, max: 116});
      /* the left side: Nutrition Facts, the bar code */
      const nf = nfacts(wx, wc, LX - 31, 64, 62, MILK_NF, .78);
      const ub = upc(wx, wc, LX - 18, nf[3] / k + 4, 36, 18, '04138309012');
      snowflake(wx, wc, LX - 21, ub[3] / k + 4.6, 2.6, NAVY); pt(wx, wc, 'KEEP REFRIGERATED', LX - 17, ub[3] / k + 4.6, 3.6, NAVY, {w: 900, n: true, a: 'left'});
      /* the right side: ingredients, the dairy, the recycling mark */
      const ing = para(wx, wc, [['INGREDIENTS: ', true], ['Whole milk, vitamin D3.', false]], RX - 28, 80, 56, 3.2, '#2a2a33');
      para(wx, wc, [['Valley Fresh Dairy', true], [' Tulare, CA 93274', false]], RX - 28, ing[3] / k + 3, 56, 3, '#2a2a33');
      recycle(wx, wc, RX, 122, 7, NAVY); pt(wx, wc, 'PLEASE RECYCLE', RX, 133.5, 3.4, NAVY, {w: 900, n: true});
      /* the back (the jug starts turned this way): the brand again, over the seam of the canvas */
      for (const cx of [0, per]) { brand(cx, 104, 10); pt(wx, wc, 'From local family farms', cx, 115, 4, NAVY, {w: 900, n: true}); fit(wx, wc, 'cow-jug', cx, 140, 64, 32); }
      /* canvas px -> point on the jug: invert the length round the jug */
      const bodyMap = (px, py) => { const u = px / wc.width, y = HS * (1 - py / wc.height); let lo = 0, hi = SEG; while (hi - lo > 1) { const mi = (lo + hi) >> 1; if (uu[mi] <= u) lo = mi; else hi = mi; }
        const f = (u - uu[lo]) / ((uu[hi] - uu[lo]) || 1), t = ths[lo] + (ths[hi] - ths[lo]) * f, r = rAt(t, y); return V(MM(r * Math.sin(t)), MM(y), MM(r * Math.cos(t))); };
      const bodyFrame = (px, py) => { const a = bodyMap(Math.max(0, px - 2), py), b = bodyMap(Math.min(wc.width, px + 2), py), r = b.sub(a).normalize(), u = V(0, 1, 0), n = r.clone().cross(u).normalize(); return {r, u, n}; };
      face(pkg, 'body', new THREE.Mesh(geo, lam(wc, {side: THREE.DoubleSide})), wc, {map: bodyMap, frame: bodyFrame, curved: true});
      reg(pkg, 'body', 'name', nm);
      reg(pkg, 'body', 'size', sz);
      reg(pkg, 'body', 'nutrition', nf);
      reg(pkg, 'body', 'upc', ub);
      reg(pkg, 'body', 'price', prc);
      /* bottom */
      const bp = [0, MM(.2), 0]; ths.forEach(t => bp.push(MM(rSq(t) * Math.sin(t)), MM(.2), MM(rSq(t) * Math.cos(t)))); const bi = []; for (let i = 1; i <= SEG; i++) bi.push(0, i + 1 > SEG + 1 ? 1 : i + 1, i);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setIndex(bi); bg.computeVertexNormals();
      plain(pkg, 'bottom', new THREE.Mesh(bg, new THREE.MeshLambertMaterial({color: '#E3E9EF', side: THREE.DoubleSide})));
      /* the handle along the back-right corner, in front of the hand hole */
      const dir = [Math.sin(cr), Math.cos(cr)], at = (y, out) => { const b = bAt(y), r = (1 - b) * rSq(cr) + b * RN + out; return V(MM(r * dir[0]), MM(y), MM(r * dir[1])); };
      const curve = new THREE.CatmullRomCurve3([at(203, -6), at(197, 3), at(187, 6), at(165, 6), at(142, 6), at(126, 4), at(119, -6)]);
      plain(pkg, 'handle', new THREE.Mesh(new THREE.TubeGeometry(curve, 64, MM(9), 16, false), new THREE.MeshLambertMaterial({color: '#EEF2F6'})));
      /* neck, neck ring, red cap */
      const nc = cv(2 * Math.PI * RN, 24, 4); flat(nc, '#EEF2F6');
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(MM(RN), MM(RN), MM(24), 96, 1, true), lam(nc, {side: THREE.DoubleSide})); neck.position.y = MM(HS + 12);
      face(pkg, 'neck', neck, nc, {map: cylMap(nc, RN, 24, HS + 12, 0, 2 * Math.PI), frame: cylFrame(nc, 0, 2 * Math.PI), curved: true});
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(MM(25), MM(25), MM(2.6), 96), new THREE.MeshLambertMaterial({color: '#C9D1DB'})); ring.position.y = MM(HS + 20.3); plain(pkg, 'ring', ring);
      const capR = 23.5, capH = 18, capY = HS + 24, sc = cv(2 * Math.PI * capR, capH, 8), sx = flat(sc, RED); ridges(sx, sc, 'rgba(110,15,10,.3)', 1.4, 1);
      const tc = cv(2 * capR, 2 * capR, 6), tx = flat(tc, RED); tx.strokeStyle = 'rgba(255,255,255,.3)'; tx.lineWidth = tc.k * .6; tx.beginPath(); tx.arc(tc.width / 2, tc.height / 2, tc.width * .4, 0, 7); tx.stroke();
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(MM(capR), MM(capR), MM(capH), 96, 1, false), [lam(sc), lam(tc), lam(tc)]); cap.position.y = MM(capY + capH / 2);
      face(pkg, 'cap', cap, sc, {map: cylMap(sc, capR, capH, capY + capH / 2, 0, 2 * Math.PI), frame: cylFrame(sc, 0, 2 * Math.PI), curved: true});
      /* the date: hi-res inkjet on the front of the neck, right under the ring: the date 4.2 mm, the dairy's code 3 mm */
      const Rd = RN + .1, DW = 24, DH = 13.6, dc = cv(DW, DH, 50), dx = dc.getContext('2d'), dyc = HS + 1.2 + DH / 2, dthL = DW / Rd, dth0 = -dthL / 2;
      kit.printOn(pkg, dx, dc, 'print', ink([[{t: dateText, k: 'date'}]], 1.2, .9, 4.2, 4.2));
      const cb = dots(dx, dc, code, 1.2, 8.2, 3, '#1E2433').box(0, code.length);
      chunk(pkg, 'print', 'code', cb, {t: code, line: 1, h: 3, tag: "dairy's code", coach: `<b>${code}</b> is the <b>dairy's code</b>, not June.`});
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 40, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM((capY + capH) / 2), el: .3, noun: 'milk', spot: 'print', where: 'on the neck'});
    };
    R4.push({name: 'Milk', newThing: 'no clue words at all', build, kw: null, clue: 'the <b>month</b>', dateText, date: iso(d), until: iso(d), say: md(m, day),
      parts, month: MON[m], prompt: FIND, start: [0, Math.PI], close: framing([-41, 190, 0], [41, 244, 26], null, .1, 0),
      choices: choices({t: md(m, day), coach: `<b>${code}</b> is the dairy's code.`}, [
        {t: md(5, d1), coach: `<b>${code}</b> is the <b>dairy's code</b>, not June.`, src: 'code'},
        {t: md(m, 6), coach: `<b>06</b> is part of the <b>dairy's code</b>.`, src: 'code'},
        {t: md(d1 - 1, d2), coach: `<b>${code}</b> is the <b>dairy's code</b>.`, src: 'code'},
        {t: md(m, d1), coach: `Read the line with the <b>month</b>.`, src: 'code'}])});
  }

  return R4;
}

/* the line for the Level 4 card on the level pick */
export const card = 'Messy dates: new ways to write them, and numbers that look like dates.';
