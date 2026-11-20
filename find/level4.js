/* Find the Date! Level 4: messy dates. Content for the Find the Date engine (find.js imports this module only when
   Level 4 is picked, then calls rounds(kit, {today, rand})). No globals.

   Six rounds. Each round adds ONE new thing: a new way to write the date, or a new number that looks like a date, never both.
     1 peanut butter jar  BEST IF USED BY / NOV 30 2026 / 11:25 L4 2201   a time that looks like a date
     2 deli cheese block  PACKED ON 11/17/26 and USE BY 11/24/26           two dates on one label
     3 orange juice       EXP 112826 / 14:32 L2                            no slashes
     4 crackers (Canada)  BEST BEFORE / MEILLEUR AVANT / 26 NO 25         the year comes first; NO = November
     5 spaghetti          BEST BY NOV 2026 / L6302A 21:05                  month and year only
     6 half gallon of milk NOV 29 / 06-4321                                no clue words (06-4321 is the dairy's code)
   The prints above are the approved pictures (made for 11/19/2026). In the game every date and number comes from
   `today` and `rand`: never new Date() with no arguments, never Math.random().
   Date rules: no date equal to today. PACKED ON is in the past, as on a real label.
   Check it ("Is it still good?"): every round carries until (the last day it is good) and say (the date in words). Each game
   makes 2 or 3 of the rounds expired, picked with rand from the peanut butter, juice, crackers, spaghetti and milk; the cheese
   is always still good, because its lesson is that PACKED ON (in the past) is not the date to check. A month-and-year print
   is good until the last day of that month. The milk prints no year: the student takes the date nearest today (a carton
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
   store price sticker, with Canva pictures (art below; find.js loads them from find/art/ before any build).
   No printed word other than the round's own clue words and distractors holds a month (MAR in MARKET, MAY in MAY CONTAIN),
   BEST, USE or EXP, or anything that reads like a date (so no "No. 5" either: round 4 teaches that NO is November). Sizes are real millimetres: 1 unit = 100 mm, origin at the bottom
   centre, +Z front, +Y up. Every mesh carries userData.face. Prints use real letter heights (2.5 to 4.6 mm). */

import * as K3 from './kit3d.js?v=1';   /* the same address find.js imports, so both share one kit */

const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
/* Canadian bilingual month symbols (CFIA), only the ones that are the first two letters of the English month.
   MR (March), AL (April), JN (June) and JL (July) are left out for now. */
const CA = {0:'JA',1:'FE',4:'MA',7:'AU',8:'SE',9:'OC',10:'NO',11:'DE'};
const p2 = n => String(n).padStart(2,'0');
const FIND = 'Find the date<br><b>to check.</b>';
/* the package pictures (Canva, colored-pencil picture-book style, cut out to transparent webp; classroom-assets group
   find-packages, ids find-pkg.<name>). trim = the solid part of the picture, in its own file's pixels. kit.art draws it.
   The spaghetti box has three more than the others: strands (the pasta behind its window), plate (the serving picture)
   and wheat. The milk carton has three: meadow (a wide picture with no cut-out, two of the carton's walls long),
   cow-bell and glass. A picture's name must not be one that find.js already uses (soup, cereal, cow): find.js keeps its own
   picture under that name and this one would never load. */
export const art = {
  peanuts: {file: 'peanuts.webp', trim: [27, 49, 574, 252]},
  oranges: {file: 'oranges.webp', trim: [37, 50, 560, 248]},
  crackers: {file: 'crackers.webp', trim: [13, 72, 588, 224]},
  pasta: {file: 'pasta.webp', trim: [6, 75, 594, 218]},
  strands: {file: 'strands.webp', trim: [0, 0, 900, 420]}, plate: {file: 'plate.webp', trim: [42, 34, 676, 676]}, wheat: {file: 'wheat.webp', trim: [38, 11, 563, 583]},
  meadow: {file: 'meadow.webp', trim: [0, 0, 1600, 800]}, 'cow-bell': {file: 'cow-bell.webp', trim: [57, 20, 730, 593]}, glass: {file: 'glass.webp', trim: [66, 88, 574, 607]}};   /* a picture that fails to load is skipped: the package draws a
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
const MILK_NF = {serv: '8 servings per container', size: '1 cup (240mL)', cal: '150',
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
  K3.init(THREE);                                                       /* the 3D kit: light, materials, shapes (find/kit3d.js) */
  const tex = c => K3.tex(c);
  /* a printed surface of one kind (kit3d.js: board, paper, litho, sleeve...); its grain takes the drawing's real size */
  const sf = (kind, c, o) => K3.surf(kind, Object.assign(c ? {map: c, mm: [c.width / c.k, c.height / c.k]} : {}, o || {}));
  const decalMat = c => K3.surf('ink', {map: c, decal: true});
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  /* parts of one name: the first is the face that can be tapped, the others belong to it */
  function part(pkg, name, meshes) { meshes.forEach((m, i) => { if (i) { m.userData.face = name; pkg.group.add(m); } else plain(pkg, name, m); }); }
  /* a folding box with softly rounded edges (r mm; o.bulge: how far its big sides bow out): put(n, c) hangs the drawing c on side n */
  const boxOf = (pkg, W, H, D, r, o) => { const Q = kit.boxQuads(MM(W), MM(H), MM(D)), G = K3.rbox(W, H, D, r, o || {});
    return (n, c, kind) => { const me = face(pkg, n, K3.mesh(G[n], sf(kind || 'board', c)), c, {map: kit.quadMap(Q[n], c), frame: kit.quadFrame(Q[n])});
      if (o && o.hole && o.hole[n]) me.material.shadowSide = THREE.DoubleSide;        /* the window's edge throws its shadow into the box */
      return me; }; };
  /* a window in a box front (cut with boxOf's o.hole = {front: [a0, b0, a1, b1, r]}): what shows through it lies `dep` mm inside
     the box, so it is in the box and not on it. The floor of the pocket carries the front's own drawing (the part that the
     cut took away) and answers a tap as the front does; a wall joins it to the cut; clear film closes the window */
  function pocket(pkg, W, H, D, [a0, b0, a1, b1, r], dep, front) {
    const z0 = D / 2, z1 = z0 - dep, X = a => MM(a - W / 2), N = 6, loop = [];
    for (const [ca, cb, q] of [[a1 - r, b1 - r, 0], [a0 + r, b1 - r, 1], [a0 + r, b0 + r, 2], [a1 - r, b0 + r, 3]]) for (let i = 0; i <= N; i++) { const t = (q + i / N) * Math.PI / 2; loop.push([ca + r * Math.cos(t), cb + r * Math.sin(t)]); }
    const S = K3.sheet(a1 - a0, b1 - b0, r, 8), flat = z => { const pos = [], nor = [], uv = []; for (const [a, b] of S.pts) { pos.push(X(a0 + a), MM(b0 + b), MM(z)); nor.push(0, 0, 1); uv.push((a0 + a) / W, (b0 + b) / H); } return K3.geo(pos, nor, uv, S.idx); };
    const floor = K3.mesh(flat(z1), K3.surf('paper', {map: front.material.map, grain: false}), {cast: false}); floor.userData.face = 'front'; pkg.group.add(floor);
    const pos = [], nor = [], uv = [], col = [], idx = [], n = loop.length;
    for (let i = 0; i <= n; i++) { const p = loop[i % n], q = loop[(i + 1) % n], b = loop[(i + n - 1) % n]; let nx = -(q[1] - b[1]), ny = q[0] - b[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      pos.push(X(p[0]), MM(p[1]), MM(z0), X(p[0]), MM(p[1]), MM(z1)); nor.push(nx, ny, 0, nx, ny, 0); uv.push(p[0] / W, p[1] / H, p[0] / W, p[1] / H); col.push(1, 1, 1, .5, .5, .5); }
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
    const wall = K3.mesh(K3.geo(pos, nor, uv, idx, col), K3.surf('paper', {color: '#CFC6B2', ao: true}), {cast: false}); wall.userData.face = 'front'; pkg.group.add(wall);
    pkg.group.add(K3.mesh(flat(z0 - .15), K3.clear({base: .03, edge: .3, rough: .05}), {shadow: false, order: 1}));
  }
  /* a moulded screw cap or lid, turned on a lathe: a ribbed skirt, a round shoulder and (o.band mm) the ring that breaks off
     under it. Its top has a low step, or (o.top: a drawing 2R mm wide) the print that lies flat on it. R, y0, H in mm.
     o.ribs = how many, o.amp = how far they stand out, o.round = the shoulder's radius, o.lip = how far the rim underneath reaches in */
  function screwCap(R, y0, H, color, o = {}) {
    const y1 = y0 + H, n = o.ribs || Math.round(R * 2.7), rad = o.round || 2.2, b = o.band || 0, amp = o.amp || .55, lip = o.lip || 4;
    const rib = th => Math.pow(.5 + .5 * Math.cos(n * th), 2), A = y => sm((y - y0 - 1.6) / 1.2) * sm((y1 - rad - .2 - y) / 1.6);
    const m = K3.surf('cap', {color, mm: [2 * Math.PI * R, H], ao: true}), white = () => 1;
    const low = b ? [[R - lip, y0 - b], [R + .25, y0 - b, .5], [R + .25, y0 - .3, .3], [R - .9, y0 - .1], [R - .9, y0 + .5], [R, y0 + .7, .3], [R, y0 + 1.6]] : [[R - lip, y0], [R, y0, .5], [R, y0 + 1.6]];
    const high = [[R, y1 - rad - .2], [R, y1, rad]].concat(o.top ? [[R - rad - 1, y1]] : [[R * .66, y1, .4], [R * .66 - .7, y1 - .7, .4], [0, y1 - .7]]);
    const out = [
      K3.mesh(K3.revolve([[R, y0 + 1.6], [R, y0 + 2.8], [R, y1 - rad - 1.8], [R, y1 - rad - .2]], {seg: n * 8, wave: (th, r, y) => amp * rib(th) * A(y), shade: (th, r, y) => 1 - .3 * A(y) * (1 - rib(th))}), m),
      K3.mesh(K3.revolve(K3.fillet(low, 4), {seg: 128, shade: b ? (th, r, y) => r < R - .4 && y > y0 - .5 ? .5 : 1 : white}), m),
      K3.mesh(K3.revolve(K3.fillet(high, 6), {seg: 128, shade: white}), m)];
    if (o.top) out.push(K3.mesh(K3.revolve([[R - rad - 1, y1], [0, y1]], {seg: 128, uv: 'top', R}), sf('cap', o.top, {grain: false})));
    return out;
  }
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
  /* flat print: a face filled with one colour, a band across it */
  const flat = (c, col) => { const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return x; };
  const band = (x, c, y0, y1, col) => { x.fillStyle = col; x.fillRect(0, y0 * c.k, c.width, (y1 - y0) * c.k); };
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
     1. Peanut butter jar, 16 oz: clear plastic, 85 mm across, 128 mm tall with its lid; the red lid is 74 mm across and 16 mm
        tall, narrower than the jar, on a round shoulder (a real 16 oz jar's sizes). Made like a store jar: a wrap label with
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
      /* the jar is clear plastic, with the peanut butter inside it: a round heel, a base pushed up a little, a shoulder under the lid */
      plain(pkg, 'body', K3.mesh(K3.revolve(K3.fillet([[0, 1.4], [28, 1.4, 4], [32.5, 0, 3], [42.5, 0, 4.6], [42.5, 104, 8], [34.2, 112.4, 3], [34.2, 118]]), {seg: 128}), K3.clear({base: .025}), {shadow: false, order: 1}));
      const pb = K3.mesh(K3.revolve(K3.fillet([[0, 2.8], [27.4, 2.8, 4], [32, 1.3, 3], [41.2, 1.3, 3.6], [41.2, 104.2, 7.2], [33, 112.2, 2.6], [33, 116.6], [33, 116.6], [0, 116.6]]), {seg: 96}), K3.surf('food', {color: '#C68A4E'}));
      pb.userData.face = ''; pkg.group.add(pb);
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
      const label = K3.mesh(new THREE.CylinderGeometry(MM(Rl), MM(Rl), MM(LH), 160, 1, true, th0, 2 * Math.PI), sf('litho', lc)); label.position.y = MM(LY + LH / 2);
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
      /* the red lid: a ribbed skirt, a round shoulder, the brand printed flat on top */
      const lidR = 37, lidH = 16, lidY = 112.5, tc = cv(2 * lidR, 2 * lidR, 6), tx = flat(tc, RED);
      tx.strokeStyle = 'rgba(255,255,255,.35)'; tx.lineWidth = tc.k * .6; tx.beginPath(); tx.arc(tc.width / 2, tc.height / 2, tc.width * .42, 0, 7); tx.stroke();
      pt(tx, tc, 'Sunny Acres', lidR, lidR, 8.6, '#FFFFFF', {w: 800});
      part(pkg, 'lid', screwCap(lidR, lidY, lidH, RED, {top: tc, ribs: 96, amp: .45, round: 2.4, lip: 2.8}));
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
     2. Store-cut sharp cheddar, vacuum sealed: a 140 x 92 x 34 mm block under tight clear film, the film's flat sealed rim
        round its top, and the store's scale label (74 x 56 mm) on top in the back-left corner.
        New: two dates on one label (PACKED ON and USE BY).
     ====================================================================================================== */
  {
    let ago = ri(1, 2), pack = add(-ago), use = add(7 - ago);
    if (use.getDate() === Number(yy(use))) { ago = 3 - ago; pack = add(-ago); use = add(7 - ago); }
    const mdy = d => `${p2(d.getMonth() + 1)}/${p2(d.getDate())}/${yy(d)}`, packText = mdy(pack), dateText = mdy(use), parts = [{t: 'month', i: 0, n: 2}, {t: 'day', i: 3, n: 2}, {t: 'year', i: 6, n: 2}];
    const lb = [6.99, 7.49, 7.99, 8.49, 8.99][ri(0, 4)], wt = ri(55, 125) / 100, tot = (Math.round(lb * wt * 100) / 100).toFixed(2);
    const W = 140, H = 34, D = 92, RIM = 9, LX = 10, LY = 10, LW = 74, LH = 56;
    const build = () => {
      const pkg = kit.newPkg('cheese'), Q = kit.boxQuads(MM(W), MM(H), MM(D)), GREEN = '#2E7D4F', INK = '#18181E', GREY = '#4a4a55';
      /* the cheese: cheddar orange, with the soft cloudiness of a cut block */
      const R = kit.rng(77), cheddar = (fw, fh, ppm) => { const c = cv(fw, fh, ppm), x = flat(c, '#F2A63A');
        for (let i = Math.round(fw * fh / 55); i > 0; i--) { const cx = R() * c.width, cy = R() * c.height, r = (5 + R() * 15) * ppm, a = .05 + R() * .07, col = R() < .5 ? '255,212,128' : '212,124,22', g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
        return c; };
      /* the block: the film is formed tight round it (round edges), and lies flat over its top */
      const G = K3.rbox(W, H, D, 6, {sharp: {top: true}, n: 6}), side = (n, c, o) => face(pkg, n, K3.mesh(G[n], sf('wrap', c, o)), c, {map: kit.quadMap(Q[n], c), frame: kit.quadFrame(Q[n])});
      for (const [n, fw, fh] of [['front', W, H], ['back', W, H], ['left', D, H], ['right', D, H], ['bottom', W, D]]) side(n, cheddar(fw, fh, 4));
      const tc = cheddar(W, D, 8), k = tc.k; side('top', tc, {coatGrain: ['film', .22], coatRough: .07});
      /* the sealed rim: the two films welded flat all the way round, clear, with the fine ribs of the sealing bar; the front
         right corner is left a little longer and unsealed (the tab it peels open by) */
      { const N = 24, CX = W / 2 - 6, CZ = D / 2 - 6, loop = (off, tab) => { const o = [];
          for (const [sx, sz, q] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) for (let i = 0; i <= N; i++) { const a = (q + i / N) * Math.PI / 2, r = (6 + off) * (tab && q === 0 ? 1 + tab * Math.pow(Math.sin(2 * a), 2) : 1);
            o.push([sx * CX + r * Math.cos(a), sz * CZ + r * Math.sin(a)]); } return o; };
        const L = [loop(-.3), loop(2.6), loop(RIM - .8), loop(RIM - .45, .3), loop(RIM, .3)], n = L[0].length, at = [0]; let len = 0;
        for (let i = 1; i <= n; i++) { const p = L[2][i % n], q = L[2][i - 1]; len += Math.hypot(p[0] - q[0], p[1] - q[1]); at.push(len); }
        const band = (A, B, m) => { const pos = [], nor = [], uv = [], idx = [];
          for (let i = 0; i <= n; i++) { const p = A[i % n], q = B[i % n]; pos.push(MM(p[0]), MM(H + .12), MM(p[1]), MM(q[0]), MM(H + .12), MM(q[1])); nor.push(0, 1, 0, 0, 1, 0); uv.push(at[i] / len, 0, at[i] / len, 1); }
          for (let i = 0; i < n; i++) { const p = i * 2; idx.push(p, p + 3, p + 1, p, p + 2, p + 3); }
          const me = K3.mesh(K3.geo(pos, nor, uv, idx), m, {shadow: false, order: 1}); me.userData.face = ''; pkg.group.add(me); };
        const TINT = 0xBFCBD8, film = K3.clear({tint: TINT, base: .2, edge: .4, rough: .08, side: THREE.DoubleSide});
        band(L[0], L[1], film); band(L[2], L[3], film);
        band(L[1], L[2], K3.clear({tint: TINT, base: .3, edge: .4, rough: .22, side: THREE.DoubleSide, grain: ['seal', 1], mm: [len, RIM - 3.4]}));
        band(L[3], L[4], K3.clear({base: .5, edge: .3, rough: .1, side: THREE.DoubleSide})); }
      /* the scale label: white thermal paper, the store's green band, then the print */
      const lc = cv(LW, LH, 36), lx = lc.getContext('2d'), lk = lc.k;
      lx.save(); lx.beginPath(); lx.roundRect(0, 0, lc.width, lc.height, 2.2 * lk); lx.clip(); lx.fillStyle = '#FFFFFF'; lx.fillRect(0, 0, lc.width, lc.height);
      lx.fillStyle = GREEN; lx.fillRect(0, 0, lc.width, 9.4 * lk); lx.restore();
      lx.save(); lx.strokeStyle = 'rgba(60,70,90,.3)'; lx.lineWidth = lk * .3; lx.beginPath(); lx.roundRect(lk * .15, lk * .15, lc.width - lk * .3, lc.height - lk * .3, 2.1 * lk); lx.stroke(); lx.restore();
      pt(lx, lc, 'Hilltop Grocer', LW / 2 - 6, 4.9, 5.6, '#FFFFFF', {w: 800}); pt(lx, lc, 'DELI', LW - 9, 5, 3.4, '#CDEBD6', {w: 900, n: true, ls: .12});
      const bName = pt(lx, lc, 'SHARP CHEDDAR CHEESE', 4, 14.2, 3.3, INK, {w: 900, n: true, a: 'left', max: 66});
      const L = (s, xm, ym, h, col, w) => pt(lx, lc, s, xm, ym, h, col || INK, {w: w || 900, n: true, a: 'left'});
      const tPack = L('PACKED ON', 4, 20.5, 2.05, GREY, 800), tUse = L('USE BY', 41, 20.5, 2.05, GREY, 800);
      const bPack = L(packText, 4, 25.5, 4.6), bUse = L(dateText, 41, 25.5, 4.6);
      lx.fillStyle = INK; lx.fillRect(4 * lk, 29.4 * lk, (LW - 8) * lk, lk * .28);
      const tLb = L('$/LB', 4, 32.8, 2.05, GREY, 800), tWt = L('NET WT LB', 19, 32.8, 2.05, GREY, 800), tTot = L('TOTAL PRICE', 44, 32.8, 2.05, GREY, 800);
      const bLb = L(lb.toFixed(2), 4, 37.6, 4.2), bWt = L(wt.toFixed(2), 19, 37.6, 4.2), bTot = L('$' + tot, 44, 38.2, 6.4);
      const ub = upc(lx, lc, 4, 42.4, 30, 8, '281234' + '00' + tot.replace('.', '').padStart(3, '0').slice(-3));
      snowflake(lx, lc, 45.6, 45.8, 1.5, GREEN); L('KEEP REFRIGERATED', 47.8, 45.8, 2.1); L('Cut fresh in our store', 44, 49.6, 1.9, GREY, 800);
      const lp = subQuad(Q.top, tc, LX * k, LY * k, (LX + LW) * k, (LY + LH) * k, MM(.2)), lq = quadMesh(lp, K3.surf('thermal', {map: lc, mm: [LW, LH], decal: true})); lq.receiveShadow = true; lq.renderOrder = 2;
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
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'cheese', spot: 'label', where: 'on the label'});
    };
    /* the close look frames the label from the pack's own back-left edge, so the pack runs off the other way */
    R4.push({name: 'Deli cheese', newThing: 'two dates on one label', build, kw: 'USE BY', clue: '<b>USE BY</b>', dateText, date: iso(use), packed: iso(pack), until: iso(use), say: full(use),
      parts, month: MON[use.getMonth()], prompt: FIND, start: [.35, 0], close: framing([-W / 2 - RIM, H, -D / 2 - RIM], [-W / 2 + LX + LW + 6, H, -D / 2 + LY + LH + 5], null, Math.PI / 2 - .52, 0),
      choices: choices({t: full(use), coach: '<b>USE BY</b> is the date to check.'}, [
        {t: full(pack), coach: 'That is the day it was <b>packed</b>.', src: 'packed on'},
        {t: mdYear(use.getMonth(), Number(yy(use)), use.getFullYear()), coach: `<b>${yy(use)}</b> is the <b>year</b>.`},
        {t: full(add(7 - ago + 7)), coach: 'Read the date under <b>USE BY</b>.'}])});
  }

  /* ======================================================================================================
     3. Orange juice, 52 fl oz bottle: clear plastic, 100 mm across, neck 62 mm, green cap. A film label like a store bottle: the brand
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
      /* the bottle is clear plastic with the juice inside it: a round heel, a base pushed up, a sloping shoulder, two rings on the neck */
      const ring = y => [[31, y - 1.3], [32.2, y - .55, .45], [32.2, y + .55, .45], [31, y + 1.3]];
      plain(pkg, 'body', K3.mesh(K3.revolve(K3.fillet([[0, 3.5], [30, 3.5, 6], [37, 0, 4], [50, 0, 8], [50, 168, 26], [31, 195, 8], ...ring(214.4), ...ring(218.9), [31, 229]]), {seg: 128}), K3.clear({base: .025}), {shadow: false, order: 1}));
      const juice = K3.mesh(K3.revolve(K3.fillet([[0, 4.8], [29, 4.8, 6], [36, 1.3, 4], [48.8, 1.3, 6.8], [48.8, 168, 24.8], [29.8, 195, 9.2], [29.8, 227], [29.8, 227], [0, 227]]), {seg: 96, shade: (th, r, y) => .9 + .1 * y / 227}), K3.surf('food', {color: '#F6A12E', ao: true}));
      juice.userData.face = ''; pkg.group.add(juice);
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
      const label = K3.mesh(new THREE.CylinderGeometry(MM(Rl), MM(Rl), MM(LH), 160, 1, true, th0, 2 * Math.PI), sf('sleeve', lc)); label.position.y = MM(LY + LH / 2);
      face(pkg, 'label', label, lc, {map: cylMap(lc, Rl, LH, LY + LH / 2, th0, 2 * Math.PI), frame: cylFrame(lc, th0, 2 * Math.PI), curved: true});
      reg(pkg, 'label', 'nutrition', nf);
      reg(pkg, 'label', 'upc', ub);
      reg(pkg, 'label', 'name', uni(n1, n2));
      reg(pkg, 'label', 'size', sz);
      reg(pkg, 'label', 'price', prc);
      /* hi-res inkjet print on the back of the neck */
      const Rd = 31.12, DW = 34, DH = 12.6, dc = cv(DW, DH, 46), dx = dc.getContext('2d'), dyc = 199 + DH / 2, dthL = DW / Rd, dth0 = Math.PI - dthL / 2;
      kit.printOn(pkg, dx, dc, 'print', ink([
        [{t: 'EXP', k: 'words'}, {t: digits, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}]], 1.5, 1.4, 3.2, 6));
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 48, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      /* the green screw cap, with the ring that breaks off under it */
      const capR = 33, capH = 22, capY = 226;
      part(pkg, 'cap', screwCap(capR, capY, capH, '#3E9F52', {band: 3.2, ribs: 84}));
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
      const W = 160, H = 225, D = 58, pkg = kit.newPkg('crackers'), put = boxOf(pkg, W, H, D, 1.5, {bulge: {front: 1, back: 1}}), C = {}, RED = '#C2352B', CREAM = '#FFF4DC', DARK = '#3A2A22';
      const fc = (n, fw, fh, draw, k) => { const c = cv(fw, fh, k || 6), x = flat(c, RED); draw(x, c); C[n] = c; put(n, c); return c; };
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
     5. Spaghetti, 1 lb: 68 x 262 x 38 mm, printed like a store box, everything reading up the long side: a deep blue box,
        a plate of spaghetti in tomato sauce at the foot, the brand in a red oval, SPAGHETTI in white capitals over a green,
        white and red stripe, the cooking time in a gold ring, and a rounded window with the real strands lying behind its film
        (14 round strands, coloured by the strands picture). The back also reads up the box: how to cook it in four steps,
        Nutrition Facts, ingredients, the maker, the bar code and a wheat picture on a cream panel. The narrow sides carry
        the name and the brand. No "No. 5" on this box: round 4 teaches that NO is November.
        The date is on the top end flap in a white code box: BEST BY MON YYYY (good until the end of that month) and a lot
        code and time. New: month and year only, no day.
     ====================================================================================================== */
  {
    const k0 = t0.getMonth() + (gone.has(4) ? -ri(1, 8) : ri(10, 24)), Y = t0.getFullYear() + Math.floor(k0 / 12), m = ((k0 % 12) + 12) % 12, dateText = `${MON[m]} ${Y}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'year', i: 4, n: 4}];
    const code = 'L' + ri(1000, 9899) + 'ABCDEFGH'[ri(0, 7)], time = time24();
    const build = () => {
      const W = 68, H = 262, D = 38, WIN = [33, 80, 61, 254, 8], pkg = kit.newPkg('spaghetti'), put = boxOf(pkg, W, H, D, 1.2, {hole: {front: WIN}}), C = {};
      const BLUE = '#1B459E', RED = '#D3312B', CREAM = '#FFF4DE', GOLD = '#F6C445', GREEN = '#1E9A4B', INK = '#2a2a33';
      const fc = (n, fw, fh, draw, k) => { const c = cv(fw, fh, k || 7), x = flat(c, BLUE); draw(x, c); C[n] = c; put(n, c); return c; };
      /* a tall face whose print reads up the long side, as on a real spaghetti box: drawn on its side (x = mm up the box,
         y = mm across it), then turned. draw returns [kind, box, coach] to register */
      const up = (n, fw, fh, draw) => { const L = cv(fh, fw, 7), lx = flat(L, BLUE), regs = draw(lx, L) || [];
        const c = fc(n, fw, fh, x => { x.save(); x.translate(0, fh * x.canvas.k); x.rotate(-Math.PI / 2); x.drawImage(L, 0, 0); x.restore(); });
        for (const [kind, b, coach] of regs) reg(pkg, n, kind, [b[1], c.height - b[2], b[3], c.height - b[0]], coach); };
      /* the brand: a red oval with a white rim (middle and half sizes in mm) */
      const oval = (x, c, cx, cy, rx, ry, s) => { const k = c.k; x.save(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.ellipse(cx * k, cy * k, rx * k, ry * k, 0, 0, 7); x.fill();
        x.fillStyle = RED; x.beginPath(); x.ellipse(cx * k, cy * k, (rx - 1.1) * k, (ry - 1.1) * k, 0, 0, 7); x.fill(); x.restore();
        return pt(x, c, 'Casa Bella', cx, cy + .4, s, '#FFFFFF', {w: 800, max: (rx - 3.4) * 2}); };
      /* a soft lighter glow in the blue, as on a printed box */
      const glow = (x, c, cx, cy, r) => { const k = c.k, g = x.createRadialGradient(cx * k, cy * k, 0, cx * k, cy * k, r * k); g.addColorStop(0, 'rgba(72,132,228,.6)'); g.addColorStop(1, 'rgba(72,132,228,0)');
        x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); };
      const name = (x, c, cx, cy, s, o) => pt(x, c, 'SPAGHETTI', cx, cy, s, '#FFFFFF', Object.assign({w: 900, n: true, ls: .05}, o || {}));
      const flag = (x, c, x0, y0, w, h) => { const k = c.k; [GREEN, '#FFFFFF', RED].forEach((col, i) => { x.fillStyle = col; x.fillRect((x0 + i * w / 3) * k, y0 * k, w / 3 * k + 1, h * k); }); };
      up('front', W, H, (x, c) => { const k = c.k;
        glow(x, c, 176, 16, 95);
        /* a plate of spaghetti, running off the bottom end of the box */
        fit(x, c, 'plate', 30, 41, 76, 76, () => { for (const [r, col] of [[37, '#FFFFFF'], [26, '#F3D36B'], [13, RED]]) { x.fillStyle = col; x.beginPath(); x.arc(30 * k, 41 * k, r * k, 0, 7); x.fill(); } });
        oval(x, c, 99, 17, 24.5, 11.5, 8.8);
        const nm = name(x, c, 177, 13.2, 14.6, {max: 96});
        flag(x, c, 131.5, 22.3, 91, 1.3);
        pt(x, c, 'ENRICHED MACARONI PRODUCT', 177, 27.5, 2.6, '#FFFFFF', {w: 900, n: true, ls: .1, max: 90});
        /* how long it cooks, in a gold ring with a little clock */
        x.strokeStyle = GOLD; x.lineWidth = .9 * k; x.beginPath(); x.arc(242.5 * k, 16.6 * k, 11.6 * k, 0, 7); x.stroke();
        x.lineWidth = .5 * k; x.lineCap = 'round'; x.beginPath(); x.arc(242.5 * k, 9.6 * k, 2.1 * k, 0, 7); x.stroke(); x.beginPath(); x.moveTo(242.5 * k, 8.3 * k); x.lineTo(242.5 * k, 9.6 * k); x.lineTo(243.5 * k, 10.2 * k); x.stroke();
        pt(x, c, '10', 242.5, 17.6, 9.6, GOLD, {w: 800}); pt(x, c, 'MIN', 242.5, 24.2, 3, GOLD, {w: 900, n: true, ls: .1});
        /* the window: a white rim, and in it the spaghetti itself, strand for strand (the box's real strands take this drawing) */
        rr(x, c, 78.8, 31.8, 176.4, 30.4, 9.2, '#FFFFFF');
        x.save(); x.beginPath(); x.roundRect(80 * k, 33 * k, 174 * k, 28 * k, 8 * k); x.clip(); x.fillStyle = '#E9BE62'; x.fillRect(80 * k, 33 * k, 174 * k, 28 * k);
        for (let i = 0; i < 4; i++) { const cx = 78 + 30 + i * 60; x.save(); if (i % 2) { x.translate(2 * cx * k, 0); x.scale(-1, 1); }
          if (!(kit.art && kit.art(x, c, 'strands', cx, 47, 60)) && !i) { x.restore(); x.strokeStyle = '#B98A2E'; x.lineWidth = k * .3; for (let s = 1; s < 14; s++) { x.beginPath(); x.moveTo(80 * k, (33 + s * 2) * k); x.lineTo(254 * k, (33 + s * 2) * k); x.stroke(); } break; }
          x.restore(); }
        x.restore();
        const wt = pt(x, c, 'NET WT 16 OZ (1 LB) 454g', 167, 65, 2.7, '#FFFFFF', {w: 900, n: true});
        const pr = priceDot(x, c, 70, 60.2, 6.6, '$1.79');
        return [['name', nm], ['weight', wt], ['price', pr]]; });
      up('back', W, H, (x, c) => { const k = c.k; rr(x, c, 4, 4, 254, 60, 3.5, CREAM);
        /* how to cook it: four steps */
        pt(x, c, 'How to cook', 9, 11.4, 5.8, BLUE, {w: 800, a: 'left'});
        [['Boil 4 quarts of water.', 'Add a little salt.'], ['Add the pasta.', 'Stir it now and then.'], ['Cook 10 minutes.', ''], ['Drain and serve.', '']].forEach(([a, b], i) => { const y = 20.4 + i * 7.6;
          x.fillStyle = RED; x.beginPath(); x.arc(12 * k, y * k, 2.7 * k, 0, 7); x.fill(); pt(x, c, String(i + 1), 12, y + .15, 3.5, '#FFFFFF', {w: 800});
          pt(x, c, a, 17, y - (b ? 1.4 : 0), 2.9, INK, {w: 900, n: true, a: 'left'}); if (b) pt(x, c, b, 17, y + 1.9, 2.5, INK, {w: 700, n: true, a: 'left'}); });
        fit(x, c, 'pasta', 62, 52.6, 50, 15);
        /* Nutrition Facts */
        const nf = nfacts(x, c, 92, 5.6, 47, PASTA_NF, .69);
        /* what is in it, who made it, the bar code */
        const ing = para(x, c, [['INGREDIENTS: ', true], ['Semolina (wheat), durum wheat flour, niacin, iron, thiamine, riboflavin, folic acid. ', false], ['CONTAINS: WHEAT.', true]], 145, 7.4, 68, 2.5, INK);
        para(x, c, [['Casa Bella Pasta Co.', true], [' Saint Louis, MO 63101', false]], 145, ing[3] / k + 2.4, 68, 2.4, INK);
        fit(x, c, 'wheat', 236, 21, 30, 30);
        pt(x, c, 'MADE WITH', 236, 40.2, 2.5, BLUE, {w: 900, n: true, ls: .08}); pt(x, c, 'DURUM WHEAT', 236, 44, 2.9, BLUE, {w: 900, n: true, ls: .04});
        const ub = upc(x, c, 150, 38.5, 40, 18, '07654321098');
        recycle(x, c, 205, 47.5, 3.6, BLUE); pt(x, c, 'PLEASE', 205, 54.2, 2.1, BLUE, {w: 900, n: true}); pt(x, c, 'RECYCLE', 205, 57, 2.1, BLUE, {w: 900, n: true});
        return [['nutrition', nf], ['upc', ub]]; });
      up('right', D, H, (x, c) => { glow(x, c, H / 2, D / 2, 90); fit(x, c, 'wheat', 40, D / 2, 30, 31); name(x, c, 138, 15.6, 13.4); flag(x, c, 100, 24.2, 76, 1.2);
        pt(x, c, 'ENRICHED MACARONI PRODUCT', 138, 29.6, 2.6, '#FFFFFF', {w: 900, n: true, ls: .1}); x.save(); x.translate(2 * 236 * c.k, 0); x.scale(-1, 1); fit(x, c, 'wheat', 236, D / 2, 30, 31); x.restore(); });
      up('left', D, H, (x, c) => { glow(x, c, H / 2, D / 2, 90); oval(x, c, 58, D / 2, 30, 13, 10.4); fit(x, c, 'pasta', 170, D / 2, 130, 26); });
      fc('bottom', W, D, (x, c) => { oval(x, c, W / 2, 14.4, 21, 9.4, 7.2); name(x, c, W / 2, 29.6, 5.4); });
      const tc = fc('top', W, D, (x, c) => { rr(x, c, 5, 6, W - 10, D - 12, 1.6, '#FFFFFF'); }, 48);
      kit.printOn(pkg, tc.getContext('2d'), tc, 'top', ink([
        [{t: 'BEST BY', k: 'words'}, {t: dateText, k: 'date'}],
        [{t: code, k: 'code', coach: isCode(code)}, {t: time, k: 'time', coach: isTime(time)}]], 8, 10.6, 3.1, 8.4));
      /* the window is a real one: the pasta lies inside the box, behind clear film (a tap on it still counts as the front) */
      pocket(pkg, W, H, D, WIN, 2.4, pkg.faces.front.mesh);
      /* and the pasta is real too: 14 round strands side by side, 2 mm each, just over the pocket's floor. Each takes its
         colour from the front's drawing, where the Canva strands lie strand for strand */
      { const [a0, b0, a1, b1] = WIN, n = 14, pw = (a1 - a0) / n, M = 6, hm = 1.2, R = pw / 2 / Math.sin(hm), zf = D / 2 - 2.4 + .08, pos = [], nor = [], uv = [], idx = [];
        for (let i = 0; i < n; i++) for (let j = 0; j <= M; j++) { const ph = (j / M * 2 - 1) * hm, a = a0 + (i + .5) * pw + R * Math.sin(ph), z = zf + R * (Math.cos(ph) - Math.cos(hm));
          for (const b of [b0, b1]) { pos.push(MM(a - W / 2), MM(b), MM(z)); nor.push(Math.sin(ph), 0, Math.cos(ph)); uv.push(a / W, b / H); } }
        for (let i = 0; i < n; i++) for (let j = 0; j < M; j++) { const q = (i * (M + 1) + j) * 2; idx.push(q, q + 2, q + 3, q, q + 3, q + 1); }
        const sp = K3.mesh(K3.geo(pos, nor, uv, idx), K3.surf('food', {map: pkg.faces.front.mesh.material.map, rough: .5}), {cast: false}); sp.userData.face = 'front'; pkg.group.add(sp); }
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
     6. Half gallon of whole milk from a California dairy, in a paper carton with a gable top (the carton of every
        store's dairy case): 95 x 95 mm, 200 mm to the fold, 253 mm with its sealed fin. Board under plastic film,
        modelled the way the carton is folded: four walls that the milk bows out a little, round upright edges that
        pinch to a point at each top corner, a soft fold into the two roof panels, and at each end the side panel
        folded in under the roof: a three-cornered wall that leans in to the middle of the ridge, with a wing under
        each roof panel, so a roof's side edge is two boards thick. The four layers of the fin are pressed flat and
        ribbed by the sealing jaws, and the cut board shows along its top. A white screw cap with its break-off ring
        stands on the front roof panel.
        Printed like a store carton, with Canva pictures: a meadow that runs right round the foot of the carton (its
        mirror image on two of the walls, so all four corners join), a red band and a red top (red means whole milk),
        the brand, a cow standing in the meadow on the front, a glass and a bottle of milk on the back, Nutrition
        Facts on one side, the dairy's story and the bar code on the other.
        The date is inkjet in a white box on the back roof panel (where a dairy prints it), with no clue words, over
        the dairy's code (06 = California). New: no clue words at all.
     ====================================================================================================== */
  {
    const d = add(gone.has(5) ? -ri(2, 6) : ri(5, 14)), m = d.getMonth(), day = d.getDate(), dateText = `${MON[m]} ${p2(day)}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'day', i: 4, n: 2}];
    /* the dairy's code: 06 (California), then the plant number; its first two digits must not make the right date */
    let d1 = ri(1, 9); while (d1 === day || d1 === 6) d1 = ri(1, 9);
    let d2 = ri(1, 9); while ((d1 - 1 === m && d2 === day) || d1 - 1 === 5 && d2 === d1) d2 = ri(1, 9);
    const code = `06-${d1}${d2}${ri(10, 99)}`;
    /* sizes in mm. W = the carton's width and depth, H = up to the fold, G = how far the roof rises, FT x FH = the fin;
       RV = the upright edges' radius (RT where they pinch at the top), RS = the fold into the top, BOW = how far the milk
       bows a wall out. A point s mm up the front roof is (x, H + s * sn, X - s * cs); the wings lie 2 RT under the roofs, and
       the two wings of one end meet under the ridge at height YM, where that end's three-cornered wall ends too */
    const W = 95, H = 200, G = 37, FT = 2.6, FH = 16, X = W / 2, RV = 1.8, RT = .7, RS = 1.6, BOW = 1.5;
    const SL = Math.hypot(G, X - FT / 2), cs = (X - FT / 2) / SL, sn = G / SL, YM = H + (sn * X - 2 * RT) / cs;
    const phiF = Math.PI / 2 - Math.atan2(G, X - FT / 2), phiS = Math.PI / 2 - Math.atan2(YM - H, X), DS = 30.5, DW = 24, DH = 13.6;
    const roofPt = (x, s, sz, under) => [x, H + s * sn - (under || 0) * cs, sz * (X - s * cs - (under || 0) * sn)];   /* sz: 1 the front roof, -1 the back */
    const build = () => {
      const pkg = kit.newPkg('milk'), RED = '#D3312B', NAVY = '#1D3F7A', PAPER = '#FFFFFF', INK = '#2a2a33';
      /* a piece of the carton as grids of points and single triangles (mm). at(i, j) gives {p, n, uv, c}: the point, its way
         out, its place on the drawing and its shade; every grid and triangle is turned to face its way out */
      const piece = () => { const pos = [], nor = [], uv = [], col = [], idx = [];
        const o = {
          grid(ni, nj, at) { const b = pos.length / 3;
            for (let j = 0; j <= nj; j++) for (let i = 0; i <= ni; i++) { const q = at(i, j), c = q.c == null ? 1 : q.c; pos.push(MM(q.p[0]), MM(q.p[1]), MM(q.p[2])); nor.push(q.n[0], q.n[1], q.n[2]); uv.push(q.uv ? q.uv[0] : 0, q.uv ? q.uv[1] : 0); col.push(c, c, c); }
            const mi = b + Math.floor(nj / 2) * (ni + 1) + Math.floor(ni / 2), e = (k, a) => pos[k * 3 + a], B = mi + 1, C = mi + ni + 1;
            const ux = e(B, 0) - e(mi, 0), uy = e(B, 1) - e(mi, 1), uz = e(B, 2) - e(mi, 2), vx = e(C, 0) - e(mi, 0), vy = e(C, 1) - e(mi, 1), vz = e(C, 2) - e(mi, 2);
            const flip = (uy * vz - uz * vy) * nor[mi * 3] + (uz * vx - ux * vz) * nor[mi * 3 + 1] + (ux * vy - uy * vx) * nor[mi * 3 + 2] < 0;
            for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) { const a = b + j * (ni + 1) + i, r = a + 1, u = a + ni + 1, t = u + 1; if (flip) idx.push(a, t, r, a, u, t); else idx.push(a, r, t, a, t, u); }
            return o; },
          tri(P3, n, sh) { const b = pos.length / 3; P3.forEach((p, i) => { const c = sh ? sh[i] : 1; pos.push(MM(p[0]), MM(p[1]), MM(p[2])); nor.push(n[0], n[1], n[2]); uv.push(0, 0); col.push(c, c, c); });
            const [A, B, C] = P3, ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
            if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0) idx.push(b, b + 2, b + 1); else idx.push(b, b + 1, b + 2); return o; },
          geo: () => K3.geo(pos, nor, uv, idx, col)};
        return o; };

      /* ---- the four walls. One wall, from its foot to the end of its fold into the top: [bx, bz] = its bottom-left corner
         seen from outside, [rx, rz] = the way across it, [nx, nz] = its way out, phi = how far its top fold turns.
         Across: half of each upright edge's round (3 steps), and the flat between them. Up: the foot's round edge, the
         wall (its upright edges tighten to RT in the last 14 mm), and the fold (5 steps), which belongs to this wall's
         drawing: its top row of pixels. ---- */
      const rAt = y => RT + (RV - RT) * (1 - sm((y - (H - 14)) / 11));
      const bw = t => { if (t <= 0 || t >= 1) return 0; const q = Math.sin(Math.PI * t); return q * Math.sqrt(q); }, dbw = t => { if (t <= 0 || t >= 1) return 0; const q = Math.sin(Math.PI * t); return 1.5 * Math.sqrt(q) * Math.cos(Math.PI * t) * Math.PI; };
      const wallGeo = ([bx, bz], [rx, rz], [nx, nz], phi) => { const n = 3, div = 14, yT = H - RS * Math.tan(phi / 2), cols = [], rows = [];
        for (let k = n; k >= 0; k--) cols.push([-1, k / n * Math.PI / 4]);
        for (let k = 1; k < div; k++) cols.push([0, k / div]);
        for (let k = 0; k <= n; k++) cols.push([1, k / n * Math.PI / 4]);
        for (let k = n; k >= 1; k--) rows.push([0, k / n * Math.PI / 4]);
        for (let k = 0; k <= 13; k++) rows.push([1, RV + (H - 16 - RV) * k / 13]);
        for (const y of [H - 13, H - 10, H - 7.5, H - 5, H - 3, yT]) rows.push([1, y]);
        for (let k = 1; k <= 5; k++) rows.push([2, phi * k / 5]);
        return piece().grid(cols.length - 1, rows.length - 1, (i, j) => { const [side, cp] = cols[i], [kind, rp] = rows[j], r = kind === 0 ? RV : kind === 1 ? rAt(rp) : RT;
          const ps = side ? cp : 0, hx = side * Math.sin(ps), hn = Math.cos(ps);                 /* this column's way out: hx across, hn straight out */
          const a = side < 0 ? r : side > 0 ? W - r : r + (W - 2 * r) * cp, ua = side < 0 ? r - r * Math.tan(ps) : side > 0 ? W - r + r * Math.tan(ps) : a;
          const at = (y, ax, out) => [bx + rx * (a + ax) + nx * (out - r), y, bz + rz * (a + ax) + nz * (out - r)], way = (ax, y, out) => { const l = Math.hypot(ax, y, out); return [(rx * ax + nx * out) / l, y / l, (rz * ax + nz * out) / l]; };
          if (kind === 0) { const tb = Math.tan(rp), l = Math.hypot(hx / hn, tb, 1); return {p: at(r - r * tb / l, r * hx / hn / l, r / l), n: way(hx / hn, -tb, 1), uv: [ua / W, (r - r * tb) / H]}; }
          if (kind === 2) { const o = RT + RS * (Math.cos(rp) - 1); return {p: at(yT + RS * Math.sin(rp), o * hx, o * hn), n: way(Math.cos(rp) * hx, Math.sin(rp), Math.cos(rp) * hn), uv: [ua / W, 1]}; }
          if (side) return {p: at(rp, r * hx, r * hn), n: way(hx, 0, hn), uv: [ua / W, rp / H]};
          const sb = (rp - RV) / (yT - RV), dd = BOW * bw(cp) * bw(sb);                          /* the milk bows the flat of the wall out */
          return {p: at(rp, 0, r + dd), n: way(-BOW * dbw(cp) / (W - 2 * r) * bw(sb), -BOW * bw(cp) * dbw(sb) / (yT - RV), 1), uv: [ua / W, rp / H]}; }).geo(); };
      const Q = kit.boxQuads(MM(W), MM(H), MM(W));
      const FRAME = {front: [[-X, X], [1, 0], [0, 1], phiF], right: [[X, X], [0, -1], [1, 0], phiS], back: [[X, -X], [-1, 0], [0, -1], phiF], left: [[-X, -X], [0, 1], [-1, 0], phiS]};

      /* ---- the print. Every wall: white board, the red band at the top (it runs on into the red roof), the navy band at
         the foot, and above that the meadow, 95 mm tall and two walls wide: its left half on the front, its right half on
         the right side, then both again as their mirror image, so the meadow joins at all four corners. ---- */
      const TOPB = 7.5, BASE = 11, MY = H - BASE - 47.5;
      const wallFace = (n, half, flipIt, draw) => { const c = cv(W, H, 8), x = flat(c, PAPER), k = c.k;
        x.save(); if (flipIt) { x.translate(W * k, 0); x.scale(-1, 1); }
        if (!(kit.art && kit.art(x, c, 'meadow', half ? 0 : W, MY, 2 * W))) {                    /* the plain stand-in: sky and a green hill */
          const g = x.createLinearGradient(0, (MY - 40) * k, 0, (MY + 6) * k); g.addColorStop(0, PAPER); g.addColorStop(1, '#D3E7F8'); x.fillStyle = g; x.fillRect(0, (MY - 40) * k, W * k, 46 * k);
          x.fillStyle = '#8CC063'; x.fillRect(0, (MY + 6) * k, W * k, 41.5 * k); }
        x.restore();
        band(x, c, 0, TOPB, RED); band(x, c, H - BASE, H, NAVY);
        draw(x, c, k);
        return face(pkg, n, K3.mesh(wallGeo(...FRAME[n]), sf('carton', c)), c, {map: kit.quadMap(Q[n], c), frame: kit.quadFrame(Q[n])}); };
      /* the brand: its name, and FAMILY FARMS between two short red rules */
      const brand = (x, c, cy, s) => { const k = c.k, a = pt(x, c, 'Valley Fresh', X, cy, 16.5 * s, NAVY, {w: 800, max: 86}), b = pt(x, c, 'FAMILY FARMS', X, cy + 12 * s, 3.1 * s, NAVY, {w: 900, n: true, ls: .2});
        x.fillStyle = RED; for (const sg of [-1, 1]) x.fillRect(sg < 0 ? b[0] - 13.5 * s * k : b[2] + 2.5 * s * k, (cy + 12 * s - .28 * s) * k, 11 * s * k, .56 * s * k);
        return uni(a, b); };
      /* the red ribbon with its notched ends: VITAMIN D over WHOLE MILK (y0 = its top edge) */
      const ribbon = (x, c, y0) => { const k = c.k, y1 = y0 + 31, ym = (y0 + y1) / 2; x.fillStyle = RED; x.beginPath();
        x.moveTo(3 * k, y0 * k); x.lineTo((W - 3) * k, y0 * k); x.lineTo((W - 7) * k, ym * k); x.lineTo((W - 3) * k, y1 * k); x.lineTo(3 * k, y1 * k); x.lineTo(7 * k, ym * k); x.closePath(); x.fill();
        pt(x, c, 'VITAMIN D', X, y0 + 6.6, 3.9, '#FFE3DF', {w: 900, n: true, ls: .16});
        return pt(x, c, 'WHOLE MILK', X, y0 + 19.2, 14.2, '#FFFFFF', {w: 800, max: 73}); };
      const grade = (x, c, y) => pt(x, c, 'GRADE A · PASTEURIZED · HOMOGENIZED', X, y, 2.55, NAVY, {w: 900, n: true, max: 84});
      const size = (x, c) => pt(x, c, 'HALF GALLON (1.89 L)', X, H - BASE / 2 + .2, 5.1, '#FFFFFF', {w: 900, n: true});
      const R = [];                                                         /* [face, kind, box, coach, what] to register */
      wallFace('front', 0, false, (x, c) => { brand(x, c, 23.5, 1); R.push(['front', 'name', ribbon(x, c, 45.5)]); grade(x, c, 83.4);
        fit(x, c, 'cow-bell', 40.5, 147.4, 78, 68);
        R.push(['front', 'price', priceDot(x, c, 80.5, 101.5, 8.6, '$2.79')], ['front', 'size', size(x, c)]); });
      wallFace('right', 1, false, (x, c, k) => { const nf = nfacts(x, c, 9.5, 12, 76, MILK_NF, 1.03);
        const ing = para(x, c, [['INGREDIENTS: ', true], ['Whole milk, vitamin D3.', false]], 9.5, nf[3] / k + 2.6, 76, 2.75, INK);
        para(x, c, [['Valley Fresh Dairy', true], [' Tulare, CA 93274', false]], 9.5, ing[3] / k + 1.4, 76, 2.75, INK);
        snowflake(x, c, 20, H - BASE / 2, 2.7, '#FFFFFF'); pt(x, c, 'KEEP REFRIGERATED', 25.5, H - BASE / 2 + .2, 4.3, '#FFFFFF', {w: 900, n: true, a: 'left'});
        /* the side seam: the edge of the board that overlaps at this corner, from the foot to the fold */
        x.fillStyle = 'rgba(40,48,60,.16)'; x.fillRect((W - 2.1) * k, 0, .3 * k, H * k); x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect((W - 1.8) * k, 0, .3 * k, H * k);
        R.push(['right', 'nutrition', nf], ['right', 'other', ing, 'Those are the <b>ingredients</b>.', 'ingredients']); });
      wallFace('back', 1, true, (x, c) => { brand(x, c, 23.5, 1); R.push(['back', 'name', ribbon(x, c, 45.5)]); grade(x, c, 83.4);
        pt(x, c, 'Farm fresh goodness', X, 95.4, 6.6, NAVY, {w: 800}); pt(x, c, 'in every glass', X, 103.4, 6.6, NAVY, {w: 800});
        fit(x, c, 'glass', X + 4, 147.6, 56, 58);
        R.push(['back', 'size', size(x, c)]); });
      wallFace('left', 0, true, (x, c, k) => { brand(x, c, 20, .66);
        pt(x, c, 'From our farm', X, 41.5, 8.8, RED, {w: 800}); pt(x, c, 'to your table', X, 51.8, 8.8, RED, {w: 800});
        para(x, c, [['Our cows graze on green valley grass. We chill their milk right at the farm, so it reaches you fresh.', false]], 9.5, 60, 76, 3.9, INK, {center: true, lh: 1.3});
        rr(x, c, 22.5, 85.4, 50, 28.6, 2.4, '#FFFFFF', 'rgba(29,63,122,.35)', .3);
        R.push(['left', 'upc', upc(x, c, 27.5, 88.8, 40, 19, '04138309029')]);
        recycle(x, c, 27, H - BASE / 2, 3.1, '#FFFFFF'); pt(x, c, 'PLEASE RECYCLE', 33.5, H - BASE / 2 + .2, 4.3, '#FFFFFF', {w: 900, n: true, a: 'left'}); });

      /* ---- the foot: the two closing flaps (one edge shows, a little off the middle) and the creases of the corners tucked under them ---- */
      { const c = cv(W, W, 6), x = flat(c, '#F1F2EE'), k = c.k, ln = (al, lw, ...p) => { x.strokeStyle = `rgba(92,100,110,${al})`; x.lineWidth = lw * k; x.beginPath(); x.moveTo(p[0] * k, p[1] * k); for (let i = 2; i < p.length; i += 2) x.lineTo(p[i] * k, p[i + 1] * k); x.stroke(); };
        x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, 0, W * k, (X + 7) * k);
        ln(.16, .5, 2, 2, X, X, W - 2, 2); ln(.16, .5, 2, W - 2, X, X, W - 2, W - 2); ln(.5, .35, 1.5, X + 7, W - 1.5, X + 7); ln(.13, .9, 1.5, X + 7.7, W - 1.5, X + 7.7);
        face(pkg, 'bottom', K3.mesh(K3.rbox(W, H, W, RV).bottom, sf('carton', c)), c, {map: kit.quadMap(Q.bottom, c), frame: kit.quadFrame(Q.bottom)}); }

      /* ---- the two roof panels, each from the end of its wall's fold up to the fin, with its two side edges: a roof's
         side edge is folded over onto the wing under it, a round nose two boards thick. A little darker toward the fin. ---- */
      const t0 = RS * Math.tan(phiF / 2);
      const roofFace = (n, sz, draw) => { const c = cv(W, SL, 14), x = flat(c, RED); draw(x, c, c.k);
        const g = piece().grid(1, 4, (i, j) => { const s = [t0, SL * .5, SL - 6, SL - 2.4, SL][j], px = (i ? 1 : -1) * sz * (X - RT); return {p: roofPt(px, s, sz), n: [0, cs, sz * sn], uv: [(sz * px + X) / W, s / SL], c: [1, 1, 1, .9, .74][j]}; });
        for (const sx of [1, -1]) g.grid(6, 1, (i, j) => { const ga = i / 6 * Math.PI, s = j ? SL : t0 * .5, cg = Math.cos(ga), sg = Math.sin(ga), ax = roofPt(sx * (X - RT), s, sz, RT);
          return {p: [ax[0] + RT * sg * sx, ax[1] + RT * cg * cs, ax[2] + RT * cg * sz * sn], n: [sg * sx, cg * cs, cg * sz * sn], uv: [sz * sx > 0 ? 1 : 0, s / SL], c: (j ? .74 : 1) * (1 - .1 * (1 - cg))}; });
        const q = [V(MM(-sz * X), MM(H), MM(sz * X)), V(MM(sz * X), MM(H), MM(sz * X)), V(MM(sz * X), MM(H + G), MM(sz * FT / 2)), V(MM(-sz * X), MM(H + G), MM(sz * FT / 2))];
        return face(pkg, n, K3.mesh(g.geo(), sf('carton', c, {ao: true})), c, {map: kit.quadMap(q, c), frame: kit.quadFrame(q)}); };
      /* the cap stands capS mm up the front roof; round it the two arrows that show which way it opens */
      const capS = 30;
      roofFace('roofF', 1, (x, c, k) => { const cx = X * k, cy = (SL - capS) * k, rad = 23.4 * k; x.strokeStyle = '#FFFFFF'; x.fillStyle = '#FFFFFF'; x.lineWidth = 1.15 * k; x.lineCap = 'round';
        for (const [a0, a1] of [[Math.PI * 1.22, Math.PI * .86], [Math.PI * .22, -Math.PI * .14]]) { x.beginPath(); x.arc(cx, cy, rad, a0, a1, true); x.stroke();
          const hx = cx + rad * Math.cos(a1), hy = cy + rad * Math.sin(a1), tx = Math.sin(a1), ty = -Math.cos(a1), h = 3.3 * k;       /* the arrow's head, pointing on round */
          x.beginPath(); x.moveTo(hx + tx * h, hy + ty * h); x.lineTo(hx + Math.cos(a1) * h * .62, hy + Math.sin(a1) * h * .62); x.lineTo(hx - Math.cos(a1) * h * .62, hy - Math.sin(a1) * h * .62); x.closePath(); x.fill(); }
        pt(x, c, 'TWIST TO OPEN', X, SL - 4.3, 2.9, '#FFFFFF', {w: 900, n: true, ls: .14}); });
      /* the back roof: the white box that the dairy leaves clear for its date */
      roofFace('roofB', -1, (x, c) => { rr(x, c, X - 16.5, SL - DS - 9.8, 33, 19.6, 2.4, '#FFFFFF'); });

      /* ---- the two ends, folded in: the side panel's three-cornered wall from its fold in to the ridge's middle (darker the
         deeper it goes), and the two wings under the roof panels, which meet under the ridge ---- */
      { const g = piece(), yT = H - RS * Math.tan(phiS / 2), xe = X - RS * (1 - Math.cos(phiS)), ye = yT + RS * Math.sin(phiS), zc = X - (2 * RT + cs * (ye - H)) / sn;
        for (const sx of [1, -1]) { g.tri([[sx * xe, ye, zc], [sx * xe, ye, -zc], [0, YM, 0]], [sx * Math.cos(phiS), Math.sin(phiS), 0], [1, 1, .5]);
          for (const sz of [1, -1]) g.tri([[0, YM, 0], [sx * (X - RT), YM, 0], roofPt(sx * (X - RT), 0, sz, 2 * RT)], [0, -cs, -sz * sn], [.46, .6, .9]); }
        plain(pkg, 'ends', K3.mesh(g.geo(), K3.surf('carton', {color: RED, ao: true, mm: [W, SL]}))); }

      /* ---- the fin: the four layers of board pressed flat and sealed, ribbed by the jaws; the cut board shows along its top
         as four pale edges, and at each end the two folded edges come up from the roofs with a seam between them ---- */
      { const FG = K3.rbox(W, FH + 1.6, FT, .7, {sharp: {bottom: true, top: true}}), fy = MM(H + G - 1.6);
        const tc = cv(W, FT, 20), tx = flat(tc, '#F3EEE2'), ec = cv(FT, FH + 1.6, 20), ex = flat(ec, RED);
        for (const f of [.26, .5, .74]) { tx.fillStyle = 'rgba(96,84,66,.5)'; tx.fillRect(0, (FT * f - .07) * tc.k, tc.width, .14 * tc.k); }
        ex.fillStyle = 'rgba(70,6,4,.6)'; ex.fillRect((FT / 2 - .11) * ec.k, 0, .22 * ec.k, ec.height);
        const side = K3.surf('carton', {color: RED, grain: ['seal', .9], mm: [W, FH + 1.6]}), end = sf('carton', ec, {grain: false}), top = sf('paper', tc, {grain: false});
        const ms = ['front', 'back', 'left', 'right', 'top'].map(n => { const me = K3.mesh(FG[n], n === 'top' ? top : n === 'left' || n === 'right' ? end : side); me.position.y = fy; return me; });
        part(pkg, 'fin', ms); }

      /* ---- the screw cap (33 mm, white) on its spout: made standing up, then laid on the front roof, capS mm up it ---- */
      { const cc = roofPt(0, capS, 1), turn = new THREE.Matrix4().makeRotationX(Math.atan2(sn, cs));
        const ms = [K3.mesh(K3.revolve(K3.fillet([[12, .1], [19.4, .1, .5], [19.4, 1.2, .5], [17.1, 1.6, .3], [17.1, 2.3]], 4), {seg: 96}), K3.surf('cap', {color: '#F1F2EE', mm: [122, 3]}))]
          .concat(screwCap(16.5, 4.9, 10.2, '#FAFAF7', {band: 2.7, ribs: 60, amp: .4, round: 2.3, lip: 3}));
        ms.forEach(me => { me.geometry.applyMatrix4(turn); me.position.set(MM(cc[0]), MM(cc[1]), MM(cc[2])); });
        part(pkg, 'cap', ms); }

      R.forEach(([f, kind, b, coach, what]) => reg(pkg, f, kind, b, coach, what));
      /* the date: hi-res inkjet in the back roof's white box: the date 4.2 mm, the dairy's code 3 mm.
         at(a, b) = a mm across from the print's middle (as it is read), b mm down the roof from its top edge */
      const dc = cv(DW, DH, 50), dx = dc.getContext('2d');
      kit.printOn(pkg, dx, dc, 'print', ink([[{t: dateText, k: 'date'}]], 1.2, .9, 4.2, 4.2));
      const cb = dots(dx, dc, code, 1.2, 8.2, 3, '#1E2433').box(0, code.length);
      chunk(pkg, 'print', 'code', cb, {t: code, line: 1, h: 3, tag: "dairy's code", coach: `<b>${code}</b> is the <b>dairy's code</b>, not June.`});
      const at = (a, b) => V(...roofPt(-a, DS + DH / 2 - b, -1, -.12).map(MM));
      const dq = [at(-DW / 2, DH), at(DW / 2, DH), at(DW / 2, 0), at(-DW / 2, 0)];
      face(pkg, 'print', quadMesh(dq, decalMat(dc)), dc, {map: (px, py) => onQ(dq, dc, px, py), frame: qFrame(dq), curved: false});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM(H + G + FH) / 2, el: .3, noun: 'milk', spot: 'print', where: 'on the top'});
    };
    const pc = roofPt(0, DS, -1);
    R4.push({name: 'Milk', newThing: 'no clue words at all', build, kw: null, clue: 'the <b>month</b>', dateText, date: iso(d), until: iso(d), say: md(m, day),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-31, pc[1] - 13, pc[2] - 15], [31, pc[1] + 13, pc[2] + 15], null, -.62, Math.PI),
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
