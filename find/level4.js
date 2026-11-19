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
   Date rules: no date equal to today. Every date to check is after today. PACKED ON is in the past, as on a real label.
   Say it: the wrong choices come from real mistakes (the time read as a date, the year read as the day, the year and
   the day swapped, the PACKED ON date, the dairy code read as June). Each wrong choice has src: 'date' when it misreads
   the date itself (the engine shows the year / month / day tags), or the line it came from ('time' or 'code': a chunk k
   on the date's face; 'packed on': the reg with that what), which the engine outlines in amber instead of the tags.

   Packages are drawn in code in the game's colored-pencil style, in real millimetres: 1 unit = 100 mm, origin at the
   bottom centre, +Z front, +Y up. Every mesh carries userData.face. Prints use real letter heights (2.5 to 4.6 mm). */

const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
/* Canadian bilingual month symbols (CFIA), only the ones that are the first two letters of the English month.
   MR (March), AL (April), JN (June) and JL (July) are left out for now. */
const CA = {0:'JA',1:'FE',4:'MA',7:'AU',8:'SE',9:'OC',10:'NO',11:'DE'};
const p2 = n => String(n).padStart(2,'0');
const FIND = 'Find the date<br><b>to check.</b>';
/* round.close: the close look's framing, tested with the v3 layout. pts are points in mm, group-local (origin at the bottom
   centre); frame them all in the free area, with the package at rx, ry (YXZ). Most are the 8 corners of a box round the
   print; a few more mark the edge of the package that faces the words, so the package never covers them. The framing may
   stop short on the far side (the package then runs off that way, away from the words). The deli, crackers and spaghetti
   boxes are the approved pictures' framings. clear: 'strip' means the package also runs off the top of the screen there,
   so the free area's left edge is the right edge of the top strip too (peanut butter). */

export function rounds(kit, {today, rand}) {
  const {THREE, rng, cv, paper, pencil, edge, txt, dots, barcode, nutrition, MM, V} = kit;

  /* ---------- dates and numbers from today and rand ---------- */
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const add = n => new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + n);
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const yy = d => p2(d.getFullYear() % 100);
  const full = d => `${MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const md = (m, day) => `${MONTH[m]} ${day}`;
  const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const time24 = () => `${ri(13, 23)}:${p2(ri(0, 59))}`;               /* 13:00 to 23:59, can't be read as a month */
  /* three choices: the right one first, then the wrong ones in order of preference; duplicates and look-alikes of the
     right answer are skipped; the order is shuffled with rand */
  /* a choice must name a real day (no February 30); a choice with no year may be February 29 */
  const real = t => { const x = t.match(/^([A-Z][a-z]+) (\d{1,2})(?:, (\d{4}))?$/); if (!x) return true; const mi = MONTH.indexOf(x[1]), d = +x[2], y = x[3] ? +x[3] : 2028, dt = new Date(y, mi, d); return mi >= 0 && d >= 1 && dt.getMonth() === mi && dt.getDate() === d; };
  function choices(right, wrong) {
    const key = t => t.toLowerCase().replace(/,? \d{4}$/, ''), seen = new Set([right.t.toLowerCase()]), near = key(right.t);
    const out = [{t: right.t, ok: true, coach: right.coach}];
    /* spare: the month next to it, the same day (a month misread), only if the predicted mistakes run out */
    const x = right.t.match(/^([A-Z][a-z]+)( .*)$/), mi = x ? MONTH.indexOf(x[1]) : -1;
    const spare = mi < 0 ? [] : [1, 11].map(k => ({t: MONTH[(mi + k) % 12] + x[2], coach: `Look at the <b>month</b> again.`, src: 'date'}));
    for (const w of wrong.concat(spare)) {
      if (out.length >= 3) break;
      if (!w || !w.t || !real(w.t)) continue;
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
  /* clean printed text (store labels, pre-printed words): crisp, no pencil. Returns its box in canvas px (cap height). */
  function ptxt(x, c, s, pxmm, pymm, sizemm, col, o) { o = o || {}; const k = c.k; x.save(); x.fillStyle = col || '#1C1C22';
    x.font = (o.w || 900) + ' ' + (sizemm * k) + 'px ' + (o.f || 'Nunito'); x.textAlign = o.a || 'left'; x.textBaseline = 'alphabetic';
    x.fillText(s, pxmm * k, pymm * k); const w = x.measureText(s).width; x.restore();
    const x0 = o.a === 'center' ? pxmm * k - w / 2 : o.a === 'right' ? pxmm * k - w : pxmm * k; return [x0, (pymm - sizemm * .74) * k, x0 + w, (pymm + sizemm * .06) * k]; }
  const mmBox = (c, x0, y0, x1, y1) => [x0 * c.k, y0 * c.k, x1 * c.k, y1 * c.k];
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
     1. Peanut butter jar, 16 oz: body 85 mm across, 105 mm tall, red lid 21 mm.
        The date is black inkjet on the back label, right under the barcode, in 2.5 mm letters. New: a time that looks like a date.
     ====================================================================================================== */
  {
    const d = add(ri(150, 420)), m = d.getMonth(), day = d.getDate(), Y = d.getFullYear();
    let tm = ri(10, 28); while (tm === day || p2(tm) === yy(d)) tm = ri(10, 28);
    const time = `${p2(m + 1)}:${p2(tm)}`, line = 'L' + ri(1, 9), code = String(ri(1000, 9899));
    const dateText = `${MON[m]} ${p2(day)} ${Y}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'day', i: 4, n: 2}, {t: 'year', i: 7, n: 4}];
    const build = () => {
      const R = rng(31), pkg = kit.newPkg('peanut butter');
      const prof = [[0,0],[37,0],[41,1.2],[42.5,4.5],[42.5,93],[41.6,97.5],[39.2,100.8],[37,102.6],[36.6,105]];
      const bc = cv(268, 105, 5), bx = paper(bc, R, '#D7A061'); pencil(bx, bc, R, 0, 0, bc.width, bc.height, '#B97536', 1.1);
      bx.save(); bx.globalAlpha = .22; bx.fillStyle = '#fff'; bx.fillRect(bc.width * .06, 0, bc.width * .035, bc.height); bx.restore();
      face(pkg, 'body', new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(MM(r), MM(y))), 112), lam(bc, {side: THREE.DoubleSide})), bc, {map: latheMap(prof, bc), frame: latheFrame(bc), curved: true});
      /* the paper label all the way round: u = .25 faces the front (+Z), u = .75 the back */
      const Rl = 42.85, LH = 76, LY = 12, circ = 2 * Math.PI * Rl, th0 = -Math.PI / 2;
      const lc = cv(circ, LH, 14), lx = paper(lc, R, '#FBF6EA'), k = lc.k, FX = circ * .25, BX = circ * .75;
      pencil(lx, lc, R, 0, 0, lc.width, 13 * k, '#D9453B', 1.3); pencil(lx, lc, R, 0, (LH - 9) * k, lc.width, 9 * k, '#5B8FD1', 1.2);
      txt(lx, lc, 'CREAMY', FX, 7, 8.2, '#FFF6EA');
      txt(lx, lc, 'PEANUT', FX, 24.5, 15.5, '#7A3410'); txt(lx, lc, 'BUTTER', FX, 39, 15.5, '#7A3410');
      const nut = (cx, cy, s) => { pencil(lx, lc, R, (cx - 11 * s) * k, (cy - 6 * s) * k, 22 * s * k, 12 * s * k, '#C98B45', 1.6, y => { y.ellipse((cx - 5 * s) * k, cy * k, 6.4 * s * k, 5.6 * s * k, .15, 0, 7); y.ellipse((cx + 5.4 * s) * k, (cy + .2) * k, 6.2 * s * k, 5.4 * s * k, -.1, 0, 7); });
        lx.save(); lx.strokeStyle = 'rgba(110,60,20,.55)'; lx.lineWidth = k * .45; lx.beginPath(); lx.ellipse((cx - 5 * s) * k, cy * k, 6.4 * s * k, 5.6 * s * k, .15, 0, 7); lx.stroke(); lx.beginPath(); lx.ellipse((cx + 5.4 * s) * k, (cy + .2) * k, 6.2 * s * k, 5.4 * s * k, -.1, 0, 7); lx.stroke(); lx.restore(); };
      nut(FX - 14, 55, 1); nut(FX + 13, 56, .9);
      txt(lx, lc, 'NET WT 16 OZ (1 LB) 454g', FX, LH - 4.4, 3.3, '#FFFFFF', {f: 'Nunito', w: 900});
      nutrition(lx, lc, BX - 56, 16, 35, [['Calories','190'],['Total Fat','16g'],['Sodium','140mg'],['Total Carb','8g'],['Sugars','3g'],['Protein','7g']]);
      ['INGREDIENTS: ROASTED','PEANUTS, SUGAR, PALM','OIL, SALT.','CONTAINS: PEANUTS.','','Stir before using.','Keep lid tight.'].forEach((l, i) => txt(lx, lc, l, BX + 20.5, 20 + i * 3.4, 2.3, '#2a2a33', {a: 'left', f: 'Nunito', w: 800}));
      txt(lx, lc, 'PEANUT BUTTER', 20, 7, 6, '#FFF6EA'); txt(lx, lc, 'PEANUT BUTTER', BX, 7, 6, '#FFF6EA');
      edge(lx, lc, R, 'rgba(70,64,80,.35)');
      const label = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rl), MM(Rl), MM(LH), 160, 1, true, th0, 2 * Math.PI), lam(lc)); label.position.y = MM(LY + LH / 2);
      face(pkg, 'label', label, lc, {map: cylMap(lc, Rl, LH, LY + LH / 2, th0, 2 * Math.PI), frame: cylFrame(lc, th0, 2 * Math.PI), curved: true});
      reg(pkg, 'label', 'nutrition', mmBox(lc, BX - 56, 16, BX - 21, 16 + 9 + 6 * 4.2));
      reg(pkg, 'label', 'other', mmBox(lc, BX + 20, 18, BX + 49, 41.6), 'Those are the <b>ingredients</b>.', 'ingredients');
      reg(pkg, 'label', 'name', mmBox(lc, FX - 29, 16, FX - -29, 47));
      reg(pkg, 'label', 'weight', mmBox(lc, FX - 23, LH - 6.6, FX + 23, LH - 2.2));
      /* hi-res ink print over the back middle: the barcode, the inkjet lines (a little gap under the barcode, room for a tag) and the phone line */
      const DX = BX - 18, DW = 36, DY = 14, DH = 46, Rd = Rl + .08, dc = cv(DW, DH, 46), dx = dc.getContext('2d');
      barcode(dx, dc, R, 4.6, 2.6, 26.8, 12, '0 12345 67890 5');
      reg(pkg, 'print', 'upc', mmBox(dc, 2.6, .6, 33.4, 19.4));
      kit.printOn(pkg, dx, dc, 'print', ink([
        [{t: 'BEST IF USED BY', k: 'words'}],
        [{t: dateText, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}, {t: code, k: 'code', coach: isCode(code)}]], 1.2, 23, 2.5, 3.5));
      reg(pkg, 'print', 'other', ptxt(dx, dc, 'Questions? 1-800-555-0142', DW / 2, 23 + 3 * 3.5 + 6.2, 2.05, '#2a2a33', {a: 'center', w: 800}), 'That is the <b>phone number</b>.', 'phone');
      ptxt(dx, dc, 'Made in USA', DW / 2, 23 + 3 * 3.5 + 9.4, 2.05, '#2a2a33', {a: 'center', w: 800});
      const dth0 = th0 + 2 * Math.PI * (DX / circ), dthL = 2 * Math.PI * (DW / circ), dyc = LY + LH - (DY + DH / 2);
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 48, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      /* red lid with ridges */
      const lidR = 43.7, lidH = 21, lidY = 102.5, sc = cv(2 * Math.PI * lidR, lidH, 7), sx = paper(sc, R, '#E0574A'); pencil(sx, sc, R, 0, 0, sc.width, sc.height, '#C8322A', 1.4);
      sx.save(); sx.strokeStyle = 'rgba(120,20,15,.35)'; sx.lineWidth = sc.k * .35; for (let i = 0; i < sc.width; i += sc.k * 1.6) { sx.beginPath(); sx.moveTo(i, sc.k * 1.2); sx.lineTo(i, sc.height - sc.k * 1.2); sx.stroke(); } sx.restore();
      const tc = cv(2 * lidR, 2 * lidR, 6), tx = paper(tc, R, '#E0574A'); pencil(tx, tc, R, 0, 0, tc.width, tc.height, '#C8322A', 1.1);
      tx.save(); tx.strokeStyle = 'rgba(120,20,15,.4)'; tx.lineWidth = tc.k * .5; tx.beginPath(); tx.arc(tc.width / 2, tc.height / 2, tc.width * .44, 0, 7); tx.stroke(); tx.restore();
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(MM(lidR), MM(lidR), MM(lidH), 112, 1, false), [lam(sc), lam(tc), lam(tc)]); lid.position.y = MM(lidY + lidH / 2);
      face(pkg, 'lid', lid, sc, {map: cylMap(sc, lidR, lidH, lidY + lidH / 2, 0, 2 * Math.PI), frame: cylFrame(sc, 0, 2 * Math.PI), curved: true});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM((lidY + lidH) / 2), el: .22, noun: 'peanut butter', spot: 'print', where: 'on the back'});
    };
    R4.push({name: 'Peanut butter', newThing: 'a time that looks like a date', build, kw: 'BEST IF USED BY', clue: '<b>BEST IF USED BY</b>', dateText, date: iso(d),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-43, 30, -43], [25, 62, 0], [[44, 30, 0], [44, 62, 0]], .05, Math.PI, 'strip'),
      choices: choices({t: full(d), coach: `<b>${time}</b> is only the time.`}, [
        {t: md(m, tm), coach: `<b>${time}</b> is a <b>time</b>.`, src: 'time'},
        {t: md(m, Number(yy(d))), coach: `<b>${Y}</b> is the <b>year</b>.`, src: 'date'},
        {t: md(m, Number(code.slice(0, 2)) <= 28 ? Number(code.slice(0, 2)) : 12), coach: `<b>${code}</b> is the <b>factory code</b>.`, src: 'code'}])});
  }

  /* ======================================================================================================
     2. Store-packed deli turkey: foam tray 230 x 165 x 26 mm under film, with the store's scale label (74 x 56 mm) in the
        back-left corner. New: two dates on one label (PACKED ON and USE BY).
     ====================================================================================================== */
  {
    let ago = ri(1, 2), pack = add(-ago), use = add(7 - ago);
    if (use.getDate() === Number(yy(use))) { ago = 3 - ago; pack = add(-ago); use = add(7 - ago); }
    const mdy = d => `${p2(d.getMonth() + 1)}/${p2(d.getDate())}/${yy(d)}`, packText = mdy(pack), dateText = mdy(use), parts = [{t: 'month', i: 0, n: 2}, {t: 'day', i: 3, n: 2}, {t: 'year', i: 6, n: 2}];
    const lb = [6.99, 7.49, 7.99, 8.49, 8.99][ri(0, 4)], wt = ri(55, 125) / 100, tot = (Math.round(lb * wt * 100) / 100).toFixed(2);
    const build = () => {
      const R = rng(44), W = 230, H = 26, D = 165, pkg = kit.newPkg('turkey'), Q = kit.boxQuads(MM(W), MM(H), MM(D));
      const side = (n, fw, fh) => { const c = cv(fw, fh, 5), x = paper(c, R, '#F3F6FA'); pencil(x, c, R, 0, 0, c.width, c.height, '#DCE4EE', .6); edge(x, c, R, 'rgba(90,100,120,.35)'); box(pkg, Q, n, c); return c; };
      side('front', W, H); side('back', W, H); side('left', D, H); side('right', D, H); side('bottom', W, D);
      /* top: foam rim, turkey slices, film shine */
      const tc = cv(W, D, 8), tx = paper(tc, R, '#F3F6FA'), k = tc.k; pencil(tx, tc, R, 0, 0, tc.width, tc.height, '#DCE4EE', .5);
      const slice = (cx, cy, rx, ry, a) => { pencil(tx, tc, R, (cx - rx) * k, (cy - ry) * k, 2 * rx * k, 2 * ry * k, '#E7B9A0', 1.5, y => { y.ellipse(cx * k, cy * k, rx * k, ry * k, a, 0, 7); });
        tx.save(); tx.strokeStyle = 'rgba(170,100,80,.55)'; tx.lineWidth = k * .6; tx.beginPath(); tx.ellipse(cx * k, cy * k, rx * k, ry * k, a, 0, 7); tx.stroke(); tx.restore(); };
      [[48,60,34,26,.3],[78,72,36,27,-.2],[110,58,35,26,.15],[142,74,36,27,-.25],[172,62,34,26,.2],[60,112,36,27,-.1],[96,118,35,26,.25],[130,110,36,27,-.15],[166,116,34,26,.1],[196,96,26,22,.4]].forEach(s => slice(...s));
      tx.save(); tx.strokeStyle = 'rgba(150,165,185,.6)'; tx.lineWidth = k * .8; tx.strokeRect(7 * k, 7 * k, (W - 14) * k, (D - 14) * k); tx.restore();
      tx.save(); tx.globalAlpha = .35; tx.strokeStyle = '#ffffff'; tx.lineCap = 'round'; [[20,150,90,20],[60,160,150,24],[150,150,210,60]].forEach(([a, b, c2, d2]) => { tx.lineWidth = k * (2 + R() * 2); tx.beginPath(); tx.moveTo(a * k, b * k); tx.lineTo(c2 * k, d2 * k); tx.stroke(); }); tx.restore();
      box(pkg, Q, 'top', tc);
      /* the scale label: white, a printed blue band, then the thermal print */
      const LX = 8, LY = 8, LW = 74, LH = 56, lc = cv(LW, LH, 36), lx = lc.getContext('2d'), lk = lc.k;
      lx.fillStyle = '#FFFFFF'; lx.beginPath(); lx.roundRect(0, 0, lc.width, lc.height, 2.2 * lk); lx.fill();
      lx.save(); lx.beginPath(); lx.roundRect(0, 0, lc.width, lc.height, 2.2 * lk); lx.clip(); lx.fillStyle = '#2B63B0'; lx.fillRect(0, 0, lc.width, 10 * lk); lx.restore();
      lx.save(); lx.strokeStyle = 'rgba(60,70,90,.35)'; lx.lineWidth = lk * .3; lx.beginPath(); lx.roundRect(lk * .15, lk * .15, lc.width - lk * .3, lc.height - lk * .3, 2.1 * lk); lx.stroke(); lx.restore();
      ptxt(lx, lc, 'FRESH DELI', LW / 2, 7.1, 5.6, '#FFFFFF', {a: 'center', f: '"Baloo 2"', w: 800});
      const bName = ptxt(lx, lc, 'SLICED TURKEY BREAST', 4, 15.6, 3.5, '#18181E');
      const tPack = ptxt(lx, lc, 'PACKED ON', 4, 21.4, 2.05, '#4a4a55'), tUse = ptxt(lx, lc, 'USE BY', 41, 21.4, 2.05, '#4a4a55');
      const bPack = ptxt(lx, lc, packText, 4, 27.2, 4.6, '#18181E'), bUse = ptxt(lx, lc, dateText, 41, 27.2, 4.6, '#18181E');
      lx.fillStyle = '#18181E'; lx.fillRect(4 * lk, 29.6 * lk, (LW - 8) * lk, lk * .28);
      const tLb = ptxt(lx, lc, '$/LB', 4, 33.6, 2.05, '#4a4a55'), tWt = ptxt(lx, lc, 'NET WT LB', 19, 33.6, 2.05, '#4a4a55'), tTot = ptxt(lx, lc, 'TOTAL PRICE', 44, 33.6, 2.05, '#4a4a55');
      const bLb = ptxt(lx, lc, lb.toFixed(2), 4, 39.2, 4.2, '#18181E'), bWt = ptxt(lx, lc, wt.toFixed(2), 19, 39.2, 4.2, '#18181E'), bTot = ptxt(lx, lc, '$' + tot, 44, 40.4, 6.4, '#18181E');
      barcode(lx, lc, R, 4, 42.6, 30, 7.2, '2 81234 00' + tot.replace('.', '').padStart(3, '0').slice(-3) + ' 8');
      ptxt(lx, lc, 'KEEP REFRIGERATED', 44, 46.4, 2.1, '#18181E', {w: 900}); ptxt(lx, lc, 'Store 105', 44, 50, 1.9, '#4a4a55', {w: 800});
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
      reg(pkg, 'label', 'upc', mmBox(lc, 2.5, 41.2, 35.5, 53));
      reg(pkg, 'label', 'name', bName);
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'turkey', spot: 'label', where: 'on the label'});
    };
    R4.push({name: 'Deli turkey', newThing: 'two dates on one label', build, kw: 'USE BY', clue: '<b>USE BY</b>', dateText, date: iso(use), packed: iso(pack),
      parts, month: MON[use.getMonth()], prompt: FIND, start: [.35, 0], close: framing([-115, 26, -82.5], [-27, 26, -13.5], null, Math.PI / 2 - .52, 0),
      choices: choices({t: full(use), coach: '<b>USE BY</b> is the date to check.'}, [
        {t: full(pack), coach: 'That is the day it was <b>packed</b>.', src: 'packed on'},
        {t: md(use.getMonth(), Number(yy(use))), coach: `<b>${yy(use)}</b> is the <b>year</b>.`},
        {t: full(add(7 - ago + 7)), coach: 'Read the date under <b>USE BY</b>.'}])});
  }

  /* ======================================================================================================
     3. Orange juice, 52 fl oz bottle: body 100 mm across, neck 62 mm, green cap. The date is inkjet on the back of the neck,
        above the label, 3.2 mm letters. New: no slashes (EXP 112826 means 11 / 28 / 26).
     ====================================================================================================== */
  {
    let d = add(ri(9, 40)); for (let n = 0; n < 40 && p2(d.getDate()) === yy(d); n++) d = add(ri(9, 40));
    const m = d.getMonth(), day = d.getDate(), digits = `${p2(m + 1)}${p2(day)}${yy(d)}`, time = time24(), line = 'L' + ri(1, 6), parts = [{t: 'month', i: 0, n: 2}, {t: 'day', i: 2, n: 2}, {t: 'year', i: 4, n: 2}];
    const build = () => {
      const R = rng(71), pkg = kit.newPkg('juice');
      const prof = [[0,0],[42,0],[48,2.5],[50,9],[50,150],[48.6,163],[44,175],[37.5,185],[32.5,192],[31,197],[31,228]];
      const bc = cv(320, 60, 4), bx = paper(bc, R, '#F4A73A'); pencil(bx, bc, R, 0, 0, bc.width, bc.height, '#E8891C', 1.1);
      bx.save(); bx.globalAlpha = .28; bx.fillStyle = '#fff'; bx.fillRect(bc.width * .07, 0, bc.width * .025, bc.height); bx.restore();
      face(pkg, 'body', new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(MM(r), MM(y))), 112), lam(bc, {side: THREE.DoubleSide})), bc, {map: latheMap(prof, bc), frame: latheFrame(bc), curved: true});
      /* the label all the way round: green, ORANGE JUICE on the front; nutrition and barcode on the back */
      const Rl = 50.25, LH = 120, LY = 22, circ = 2 * Math.PI * Rl, th0 = -Math.PI / 2, lc = cv(circ, LH, 10), lx = paper(lc, R, '#FBF6EA'), k = lc.k, FX = circ * .25, BX = circ * .75;
      pencil(lx, lc, R, 0, 0, lc.width, lc.height, '#3E9B4F', 1.2);
      txt(lx, lc, 'ORANGE', FX, 24, 19, '#FFFFFF'); txt(lx, lc, 'JUICE', FX, 43, 19, '#FFE7B8');
      pencil(lx, lc, R, (FX - 17) * k, 62 * k, 34 * k, 34 * k, '#F39A1E', 1.8, y => { y.arc(FX * k, 79 * k, 17 * k, 0, 7); }); lx.save(); lx.strokeStyle = 'rgba(150,70,0,.55)'; lx.lineWidth = k * .5; lx.beginPath(); lx.arc(FX * k, 79 * k, 17 * k, 0, 7); lx.stroke(); lx.restore();
      pencil(lx, lc, R, (FX + 2) * k, 57 * k, 14 * k, 8 * k, '#2E7D3A', 1.8, y => { y.ellipse((FX + 9) * k, 61 * k, 7 * k, 3.4 * k, -.4, 0, 7); });
      txt(lx, lc, '100% PURE SQUEEZED', FX, 106, 5, '#FFFFFF', {f: 'Nunito', w: 900}); txt(lx, lc, '52 FL OZ (1.53 L)', FX, 114, 4.4, '#FFFFFF', {f: 'Nunito', w: 900});
      lx.fillStyle = '#FBF6EA'; lx.fillRect((BX - 44) * k, 10 * k, 88 * k, 98 * k);
      nutrition(lx, lc, BX - 40, 15, 38, [['Calories','110'],['Sodium','0mg'],['Potassium','450mg'],['Total Carb','26g'],['Sugars','22g'],['Vitamin C','100%']]);
      barcode(lx, lc, R, BX + 4, 20, 34, 18, '0 48500 20262 1');
      txt(lx, lc, 'KEEP REFRIGERATED', BX + 21, 56, 3.6, '#2E6B3A', {f: 'Nunito', w: 900}); txt(lx, lc, 'Shake well', BX + 21, 62, 3.6, '#2E6B3A', {f: 'Nunito', w: 900});
      edge(lx, lc, R, 'rgba(40,70,40,.4)');
      const label = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rl), MM(Rl), MM(LH), 160, 1, true, th0, 2 * Math.PI), lam(lc)); label.position.y = MM(LY + LH / 2);
      face(pkg, 'label', label, lc, {map: cylMap(lc, Rl, LH, LY + LH / 2, th0, 2 * Math.PI), frame: cylFrame(lc, th0, 2 * Math.PI), curved: true});
      reg(pkg, 'label', 'nutrition', mmBox(lc, BX - 40, 15, BX - 2, 15 + 9 + 6 * 4.2));
      reg(pkg, 'label', 'upc', mmBox(lc, BX + 2, 18, BX + 40, 43));
      reg(pkg, 'label', 'name', mmBox(lc, FX - 34, 13, FX + 34, 54));
      reg(pkg, 'label', 'size', mmBox(lc, FX - 22, 110.5, FX + 22, 117));
      /* ribs on the neck */
      [214, 218.5, 223].forEach((y, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(MM(31.2), MM(.9), 8, 96), new THREE.MeshLambertMaterial({color: '#F7B95A'})); t.rotation.x = Math.PI / 2; t.position.y = MM(y); plain(pkg, 'rib' + (i + 1), t); });
      /* hi-res inkjet print on the back of the neck */
      const Rd = 31.12, DW = 34, DH = 12.6, dc = cv(DW, DH, 46), dx = dc.getContext('2d'), dyc = 199 + DH / 2, dthL = DW / Rd, dth0 = Math.PI - dthL / 2;
      kit.printOn(pkg, dx, dc, 'print', ink([
        [{t: 'EXP', k: 'words'}, {t: digits, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}]], 1.5, 1.4, 3.2, 6));
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 48, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      /* green ridged cap */
      const capR = 33, capH = 22, capY = 226, sc = cv(2 * Math.PI * capR, capH, 7), sx = paper(sc, R, '#4CAF5E'); pencil(sx, sc, R, 0, 0, sc.width, sc.height, '#2F8A42', 1.4);
      sx.save(); sx.strokeStyle = 'rgba(20,70,30,.35)'; sx.lineWidth = sc.k * .35; for (let i = 0; i < sc.width; i += sc.k * 1.6) { sx.beginPath(); sx.moveTo(i, sc.k * 1.2); sx.lineTo(i, sc.height - sc.k * 1.2); sx.stroke(); } sx.restore();
      const tc = cv(2 * capR, 2 * capR, 6), tx = paper(tc, R, '#4CAF5E'); pencil(tx, tc, R, 0, 0, tc.width, tc.height, '#2F8A42', 1.1);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(MM(capR), MM(capR), MM(capH), 112, 1, false), [lam(sc), lam(tc), lam(tc)]); cap.position.y = MM(capY + capH / 2);
      face(pkg, 'cap', cap, sc, {map: cylMap(sc, capR, capH, capY + capH / 2, 0, 2 * Math.PI), frame: cylFrame(sc, 0, 2 * Math.PI), curved: true});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM((capY + capH) / 2), el: .26, noun: 'juice', spot: 'print', where: 'on the neck'});
    };
    const sw = `${p2(day)}${p2(m + 1)}${yy(d)}`;
    R4.push({name: 'Orange juice', newThing: 'no slashes', build, kw: 'EXP', clue: '<b>EXP</b>', dateText: digits, date: iso(d),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-40, 185, -33], [40, 249, 0], null, 0, Math.PI),
      choices: choices({t: full(d), coach: `<b>${digits}</b> means ${p2(m + 1)} / ${p2(day)} / ${yy(d)}.`}, [
        {t: md(m, Number(yy(d))), coach: `<b>${yy(d)}</b> is the <b>year</b>. Read it in twos: <b>${p2(m + 1)} / ${p2(day)} / ${yy(d)}</b>.`},
        {t: `${MONTH[m]} ${Number(yy(d))}, 20${p2(day)}`, coach: `Read it in twos: <b>month</b>, <b>day</b>, <b>year</b>.`},
        {t: md(m, Number(sw.slice(2, 4)) || 1), coach: `Read it in twos: <b>${p2(m + 1)} / ${p2(day)} / ${yy(d)}</b>.`}])});
  }

  /* ======================================================================================================
     4. Crackers made in Canada (bilingual box), 160 x 225 x 58 mm. The date is on the bottom: printed BEST BEFORE /
        MEILLEUR AVANT, then inkjet YY MO DD (year first) and a time, line and code. New: the year comes first.
     ====================================================================================================== */
  {
    let d = null;
    for (let n = 0; n < 200 && !d; n++) { const c = add(ri(60, 300)); if (CA[c.getMonth()] && c.getDate() >= 10 && c.getDate() <= 28 && p2(c.getDate()) !== yy(c)) d = c; }
    if (!d) { let c = add(60); while (!(CA[c.getMonth()] && c.getDate() >= 10 && c.getDate() <= 28 && p2(c.getDate()) !== yy(c))) c = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1); d = c; }
    const m = d.getMonth(), day = d.getDate(), dateText = `${yy(d)} ${CA[m]} ${p2(day)}`, parts = [{t: 'year', i: 0, n: 2}, {t: 'month', i: 3, n: 2}, {t: 'day', i: 6, n: 2}];
    let hh = ri(1, 12); while (hh === m + 1) hh = ri(1, 12);
    const mm = ri(10, 28), time = `${p2(hh)}:${p2(mm)}`, line = 'L' + ri(1, 6), code = String(ri(1000, 9899));
    const build = () => {
      const R = rng(52), W = 160, H = 225, D = 58, pkg = kit.newPkg('crackers'), Q = kit.boxQuads(MM(W), MM(H), MM(D)), C = {};
      const fc = (n, fw, fh, draw, k) => { const c = cv(fw, fh, k || 6), x = paper(c, R, '#FFF6E2'); draw(x, c); edge(x, c, R); C[n] = c; box(pkg, Q, n, c); return c; };
      const sq = (x, c, cx, cy, s) => { const k = c.k; pencil(x, c, R, (cx - s / 2) * k, (cy - s / 2) * k, s * k, s * k, '#E2A64B', 1.6); x.save(); x.strokeStyle = 'rgba(120,70,20,.6)'; x.lineWidth = k * .5; x.strokeRect((cx - s / 2) * k, (cy - s / 2) * k, s * k, s * k); x.fillStyle = 'rgba(120,70,20,.55)';
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { x.beginPath(); x.arc((cx - s / 3 + i * s / 3) * k, (cy - s / 3 + j * s / 3) * k, k * .9, 0, 7); x.fill(); } x.restore(); };
      fc('front', W, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#C8402E', 1.1); pencil(x, c, R, 10 * c.k, 92 * c.k, (W - 20) * c.k, 96 * c.k, '#FFF1D6', 1);
        txt(x, c, 'CRACKERS', W / 2, 36, 28, '#FFF6E2'); txt(x, c, 'CRAQUELINS', W / 2, 60, 15, '#FFE3B5'); txt(x, c, 'Whole wheat · Blé entier', W / 2, 78, 7, '#FFF6E2', {f: 'Nunito', w: 900});
        [[52,116],[86,112],[118,120],[60,150],[96,148],[128,154],[74,178],[110,176]].forEach(([a, b]) => sq(x, c, a, b, 26));
        txt(x, c, 'NET WT 8.5 OZ (241 g) · POIDS NET', W / 2, 212, 5.2, '#FFF6E2', {f: 'Nunito', w: 900}); });
      reg(pkg, 'front', 'name', mmBox(C.front, 14, 20, W - 14, 66));
      reg(pkg, 'front', 'weight', mmBox(C.front, 22, 208, W - 22, 216));
      fc('back', W, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#C8402E', .9); x.fillStyle = '#FFF6E2'; x.fillRect(12 * c.k, 14 * c.k, (W - 24) * c.k, 150 * c.k);
        nutrition(x, c, 18, 20, 64, [['Calories / Calories','130'],['Fat / Lipides','4g'],['Sodium','220mg'],['Carbohydrate / Glucides','21g'],['Fibre / Fibres','3g'],['Protein / Protéines','3g']]);
        txt(x, c, 'Made in Canada', W * .73, 40, 5, '#7A2A1A', {f: 'Nunito', w: 900}); txt(x, c, 'Fabriqué au Canada', W * .73, 48, 4.4, '#7A2A1A', {f: 'Nunito', w: 900});
        barcode(x, c, R, W * .56, 176, 44, 24, '0 62345 98761 2'); });
      reg(pkg, 'back', 'nutrition', mmBox(C.back, 18, 20, 82, 20 + 9 + 6 * 4.2));
      reg(pkg, 'back', 'upc', mmBox(C.back, W * .56 - 2, 174, W * .56 + 46, 207));
      fc('right', D, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#C8402E', .9); txt(x, c, 'CRACKERS · CRAQUELINS', D / 2, H / 2, 9, '#FFF6E2', {rot: -Math.PI / 2}); });
      fc('left', D, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#C8402E', .9); txt(x, c, 'CRACKERS · CRAQUELINS', D / 2, H / 2, 9, '#FFF6E2', {rot: Math.PI / 2}); });
      fc('top', W, D, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#C8402E', .8); txt(x, c, 'OPEN HERE · OUVRIR ICI', W / 2, D / 2, 6, '#FFF6E2', {f: 'Nunito', w: 900}); });
      /* the bottom (where the date is): the print is upright when the box is tipped toward the viewer */
      let w1, w2;
      const bc = fc('bottom', W, D, (x, c) => { const k = c.k; pencil(x, c, R, 0, 0, c.width, c.height, '#C8402E', .75); x.fillStyle = '#FFF6E2'; x.fillRect(10 * k, 10 * k, (W - 20) * k, (D - 20) * k);
        w1 = ptxt(x, c, 'BEST BEFORE', 16, 22.6, 3.6, '#2a2a33'); w2 = ptxt(x, c, 'MEILLEUR AVANT', 16, 28.4, 3.6, '#2a2a33');
        ptxt(x, c, 'Recycle · Recyclez', 16, 42, 2.6, '#6b5a4a', {w: 800}); }, 40);
      kit.printOn(pkg, bc.getContext('2d'), bc, 'bottom', ink([
        [{t: dateText, k: 'date'}],
        [{t: time, k: 'time', coach: isTime(time)}, {t: line, k: 'line', coach: isLine(line)}, {t: code, k: 'code', coach: isCode(code)}]], 62, 19.2, 3.6, 8.4));
      chunk(pkg, 'bottom', 'words', uni(w1, w2), {t: 'BEST BEFORE / MEILLEUR AVANT', line: 2, h: 3.6});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'crackers', spot: 'bottom', where: 'on the bottom'});
    };
    R4.push({name: 'Crackers from Canada', newThing: `the year comes first, and ${CA[m]} = ${MONTH[m]}`, build, kw: 'BEST BEFORE', clue: '<b>BEST BEFORE</b>', dateText, date: iso(d),
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-80, 0, -11], [32, 0, 23], null, -(Math.PI / 2 + .48), 0),
      choices: choices({t: full(d), coach: 'Here the <b>year</b> comes first.'}, [
        {t: `${MONTH[m]} ${Number(yy(d))}, 20${p2(day)}`, coach: 'Here the <b>year</b> comes first.'},
        {t: md(hh - 1, mm), coach: `<b>${time}</b> is a <b>time</b>.`, src: 'time'},
        {t: md(m, Number(yy(d))), coach: `<b>${yy(d)}</b> is the <b>year</b>.`}])});
  }

  /* ======================================================================================================
     5. Spaghetti, 1 lb: 68 x 262 x 38 mm. The date is on the top end flap in a white code box: BEST BY MON YYYY
        (good until the end of that month) and a lot code and time. New: month and year only, no day.
     ====================================================================================================== */
  {
    const k0 = t0.getMonth() + ri(10, 24), Y = t0.getFullYear() + Math.floor(k0 / 12), m = k0 % 12, dateText = `${MON[m]} ${Y}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'year', i: 4, n: 4}];
    const code = 'L' + ri(1000, 9899) + 'ABCDEFGH'[ri(0, 7)], time = time24();
    const build = () => {
      const R = rng(63), W = 68, H = 262, D = 38, pkg = kit.newPkg('spaghetti'), Q = kit.boxQuads(MM(W), MM(H), MM(D)), C = {};
      const fc = (n, fw, fh, draw, k) => { const c = cv(fw, fh, k || 7), x = paper(c, R, '#F4F7FC'); draw(x, c); edge(x, c, R); C[n] = c; box(pkg, Q, n, c); return c; };
      fc('front', W, H, (x, c) => { const k = c.k; pencil(x, c, R, 0, 0, c.width, c.height, '#2F66C2', 1.2);
        x.fillStyle = 'rgba(255,248,226,.92)'; x.beginPath(); x.roundRect(10 * k, 120 * k, (W - 20) * k, 110 * k, 8 * k); x.fill();
        x.save(); x.strokeStyle = '#E3B85B'; x.lineCap = 'round'; for (let i = 0; i < 34; i++) { x.lineWidth = k * (.6 + R() * .5); x.beginPath(); const sx = (14 + R() * 40) * k; x.moveTo(sx, (124 + R() * 6) * k); x.lineTo(sx + (R() - .5) * 6 * k, (222 + R() * 6) * k); x.stroke(); } x.restore();
        txt(x, c, 'SPAGHETTI', W / 2, 64, 17, '#FFFFFF', {rot: -Math.PI / 2}); txt(x, c, 'NET WT 16 OZ (1 LB) 454g', W / 2, 248, 4, '#FFFFFF', {f: 'Nunito', w: 900}); });
      reg(pkg, 'front', 'name', mmBox(C.front, W / 2 - 10, 14, W / 2 + 10, 114));
      reg(pkg, 'front', 'weight', mmBox(C.front, 6, 245, W - 6, 251));
      fc('back', W, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#2F66C2', 1); nutrition(x, c, 8, 20, W - 16, [['Calories','200'],['Total Fat','1g'],['Sodium','0mg'],['Total Carb','42g'],['Protein','7g']]); barcode(x, c, R, 14, 200, 40, 20, '0 76543 21098 4'); });
      reg(pkg, 'back', 'nutrition', mmBox(C.back, 8, 20, W - 8, 20 + 9 + 5 * 4.2));
      reg(pkg, 'back', 'upc', mmBox(C.back, 12, 198, 56, 227));
      fc('right', D, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#2F66C2', .9); txt(x, c, 'SPAGHETTI', D / 2, H / 2, 11, '#FFFFFF', {rot: -Math.PI / 2}); });
      fc('left', D, H, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#2F66C2', .9); txt(x, c, 'Cook 9-11 min', D / 2, H / 2, 6, '#FFFFFF', {rot: Math.PI / 2, f: 'Nunito', w: 900}); });
      fc('bottom', W, D, (x, c) => { pencil(x, c, R, 0, 0, c.width, c.height, '#2F66C2', .8); });
      const tc = fc('top', W, D, (x, c) => { const k = c.k; pencil(x, c, R, 0, 0, c.width, c.height, '#2F66C2', .8); x.fillStyle = '#FFFFFF'; x.fillRect(5 * k, 6 * k, (W - 10) * k, (D - 12) * k); }, 48);
      kit.printOn(pkg, tc.getContext('2d'), tc, 'top', ink([
        [{t: 'BEST BY', k: 'words'}, {t: dateText, k: 'date'}],
        [{t: code, k: 'code', coach: isCode(code)}, {t: time, k: 'time', coach: isTime(time)}]], 8, 10.6, 3.1, 8.4));
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM(H) / 2, el: .22, noun: 'spaghetti', spot: 'top', where: 'on the top end'});
    };
    R4.push({name: 'Spaghetti', newThing: 'month and year only', build, kw: 'BEST BY', clue: '<b>BEST BY</b>', dateText, date: `${Y}-${p2(m + 1)}`,
      parts, month: MON[m], prompt: FIND, start: [0, 0], close: framing([-34, 262, -19], [34, 262, 19], null, Math.PI / 2 - .5, 0),
      choices: choices({t: `${MONTH[m]} ${Y}`, coach: 'No day here. Say the <b>month</b> and the <b>year</b>.'}, [
        {t: md(m, Number(String(Y).slice(0, 2))), coach: `<b>${Y}</b> is the <b>year</b>. There is no day.`},
        {t: md(m, Number(String(Y).slice(2))), coach: `<b>${Y}</b> is the <b>year</b>. There is no day.`},
        {t: `${MONTH[(m + 11) % 12]} ${Y}`, coach: `<b>${MON[m]}</b> is <b>${MONTH[m]}</b>.`}])});
  }

  /* ======================================================================================================
     6. Gallon of milk from a California dairy: rounded-square jug 150 x 150 mm, red cap, handle at the back-right corner.
        The date is inkjet on the neck under the cap, with no clue words, over the dairy's code (06 = California).
        New: no clue words at all.
     ====================================================================================================== */
  {
    const d = add(ri(5, 14)), m = d.getMonth(), day = d.getDate(), dateText = `${MON[m]} ${p2(day)}`, parts = [{t: 'month', i: 0, n: 3}, {t: 'day', i: 4, n: 2}];
    /* the dairy's code: 06 (California), then the plant number; its first two digits must not make the right date */
    let d1 = ri(1, 9); while (d1 === day || d1 === 6) d1 = ri(1, 9);
    let d2 = ri(1, 9); while ((d1 - 1 === m && d2 === day) || d1 - 1 === 5 && d2 === d1) d2 = ri(1, 9);
    const code = `06-${d1}${d2}${ri(10, 99)}`;
    const build = () => {
      const R = rng(83), pkg = kit.newPkg('milk');
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
      const wc = cv(per, HS, 5), wx = paper(wc, R, '#F3F6F9'), k = wc.k, FX = per * .5, LX = per * .25; pencil(wx, wc, R, 0, 0, wc.width, wc.height, '#DCE3EB', .6);
      /* the front label: blue band, MILK; the left side: nutrition and barcode */
      const ly0 = (HS - 150) * k, lh = 118 * k; wx.fillStyle = '#FFFFFF'; wx.fillRect((FX - 62) * k, ly0, 124 * k, lh); pencil(wx, wc, R, (FX - 62) * k, ly0 + 70 * k, 124 * k, 30 * k, '#3F7FD0', 1.3);
      txt(wx, wc, 'MILK', FX, HS - 150 + 40, 34, '#2E5A92'); txt(wx, wc, 'Vitamin D', FX, HS - 150 + 62, 8, '#2E5A92', {f: 'Nunito', w: 900}); txt(wx, wc, '1 GALLON (3.78 L)', FX, HS - 150 + 85, 7, '#FFFFFF', {f: 'Nunito', w: 900}); txt(wx, wc, 'Grade A  Pasteurized', FX, HS - 150 + 108, 5, '#2E5A92', {f: 'Nunito', w: 900});
      wx.save(); wx.strokeStyle = 'rgba(60,70,90,.35)'; wx.lineWidth = k * .4; wx.strokeRect((FX - 62) * k, ly0, 124 * k, lh); wx.restore();
      nutrition(wx, wc, LX - 30, HS - 150 + 4, 60, [['Calories','150'],['Total Fat','8g'],['Sodium','120mg'],['Total Carb','12g'],['Protein','8g'],['Calcium','25%']]);
      barcode(wx, wc, R, LX - 18, HS - 150 + 52, 36, 18, '0 41383 09012 8'); txt(wx, wc, 'KEEP REFRIGERATED', LX, HS - 150 + 84, 4.4, '#2E5A92', {f: 'Nunito', w: 900});
      /* canvas px -> point on the jug: invert the length round the jug */
      const bodyMap = (px, py) => { const u = px / wc.width, y = HS * (1 - py / wc.height); let lo = 0, hi = SEG; while (hi - lo > 1) { const mi = (lo + hi) >> 1; if (uu[mi] <= u) lo = mi; else hi = mi; }
        const f = (u - uu[lo]) / ((uu[hi] - uu[lo]) || 1), t = ths[lo] + (ths[hi] - ths[lo]) * f, r = rAt(t, y); return V(MM(r * Math.sin(t)), MM(y), MM(r * Math.cos(t))); };
      const bodyFrame = (px, py) => { const a = bodyMap(Math.max(0, px - 2), py), b = bodyMap(Math.min(wc.width, px + 2), py), r = b.sub(a).normalize(), u = V(0, 1, 0), n = r.clone().cross(u).normalize(); return {r, u, n}; };
      face(pkg, 'body', new THREE.Mesh(geo, lam(wc, {side: THREE.DoubleSide})), wc, {map: bodyMap, frame: bodyFrame, curved: true});
      reg(pkg, 'body', 'name', mmBox(wc, FX - 40, HS - 150 + 22, FX + 40, HS - 150 + 67));
      reg(pkg, 'body', 'size', mmBox(wc, FX - 36, HS - 150 + 80, FX + 36, HS - 150 + 90));
      reg(pkg, 'body', 'nutrition', mmBox(wc, LX - 30, HS - 150 + 4, LX + 30, HS - 150 + 4 + 9 + 6 * 4.2));
      reg(pkg, 'body', 'upc', mmBox(wc, LX - 20, HS - 150 + 50, LX + 20, HS - 150 + 77));
      /* bottom */
      const bp = [0, MM(.2), 0]; ths.forEach(t => bp.push(MM(rSq(t) * Math.sin(t)), MM(.2), MM(rSq(t) * Math.cos(t)))); const bi = []; for (let i = 1; i <= SEG; i++) bi.push(0, i + 1 > SEG + 1 ? 1 : i + 1, i);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setIndex(bi); bg.computeVertexNormals();
      plain(pkg, 'bottom', new THREE.Mesh(bg, new THREE.MeshLambertMaterial({color: '#E3E9EF', side: THREE.DoubleSide})));
      /* the handle along the back-right corner, in front of the hand hole */
      const dir = [Math.sin(cr), Math.cos(cr)], at = (y, out) => { const b = bAt(y), r = (1 - b) * rSq(cr) + b * RN + out; return V(MM(r * dir[0]), MM(y), MM(r * dir[1])); };
      const curve = new THREE.CatmullRomCurve3([at(203, -6), at(197, 3), at(187, 6), at(165, 6), at(142, 6), at(126, 4), at(119, -6)]);
      plain(pkg, 'handle', new THREE.Mesh(new THREE.TubeGeometry(curve, 64, MM(9), 16, false), new THREE.MeshLambertMaterial({color: '#EDF1F5'})));
      /* neck, neck ring, red cap */
      const nc = cv(2 * Math.PI * RN, 24, 4); nc.getContext('2d').fillStyle = '#EEF2F6'; nc.getContext('2d').fillRect(0, 0, nc.width, nc.height);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(MM(RN), MM(RN), MM(24), 96, 1, true), lam(nc, {side: THREE.DoubleSide})); neck.position.y = MM(HS + 12);
      face(pkg, 'neck', neck, nc, {map: cylMap(nc, RN, 24, HS + 12, 0, 2 * Math.PI), frame: cylFrame(nc, 0, 2 * Math.PI), curved: true});
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(MM(25), MM(25), MM(2.6), 96), new THREE.MeshLambertMaterial({color: '#C9D1DB'})); ring.position.y = MM(HS + 20.3); plain(pkg, 'ring', ring);
      const capR = 23.5, capH = 18, capY = HS + 24, sc = cv(2 * Math.PI * capR, capH, 8), sx = paper(sc, R, '#E0574A'); pencil(sx, sc, R, 0, 0, sc.width, sc.height, '#C8322A', 1.4);
      sx.save(); sx.strokeStyle = 'rgba(120,20,15,.4)'; sx.lineWidth = sc.k * .35; for (let i = 0; i < sc.width; i += sc.k * 1.4) { sx.beginPath(); sx.moveTo(i, sc.k * 1); sx.lineTo(i, sc.height - sc.k * 1); sx.stroke(); } sx.restore();
      const tc = cv(2 * capR, 2 * capR, 6), tx = paper(tc, R, '#E0574A'); pencil(tx, tc, R, 0, 0, tc.width, tc.height, '#C8322A', 1.1);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(MM(capR), MM(capR), MM(capH), 96, 1, false), [lam(sc), lam(tc), lam(tc)]); cap.position.y = MM(capY + capH / 2);
      face(pkg, 'cap', cap, sc, {map: cylMap(sc, capR, capH, capY + capH / 2, 0, 2 * Math.PI), frame: cylFrame(sc, 0, 2 * Math.PI), curved: true});
      /* the date: hi-res inkjet on the front of the neck, right under the ring: the date 4.2 mm, the dairy's code 3 mm */
      const Rd = RN + .1, DW = 24, DH = 13.6, dc = cv(DW, DH, 50), dx = dc.getContext('2d'), dyc = HS + 1.2 + DH / 2, dthL = DW / Rd, dth0 = -dthL / 2;
      kit.printOn(pkg, dx, dc, 'print', ink([[{t: dateText, k: 'date'}]], 1.2, .9, 4.2, 4.2));
      const cb = dots(dx, dc, code, 1.2, 8.2, 3, '#1E2433').box(0, code.length);
      chunk(pkg, 'print', 'code', cb, {t: code, line: 1, h: 3, coach: `<b>${code}</b> is the <b>dairy's code</b>, not June.`});
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(MM(Rd), MM(Rd), MM(DH), 40, 1, true, dth0, dthL), decalMat(dc)); decal.position.y = MM(dyc);
      face(pkg, 'print', decal, dc, {map: cylMap(dc, Rd, DH, dyc, dth0, dthL), frame: cylFrame(dc, dth0, dthL), curved: true});
      inkParts(pkg, parts);
      return finish(pkg, {cy: MM((capY + capH) / 2), el: .3, noun: 'milk', spot: 'print', where: 'on the neck'});
    };
    R4.push({name: 'Milk', newThing: 'no clue words at all', build, kw: null, clue: 'the <b>month</b>', dateText, date: iso(d),
      parts, month: MON[m], prompt: FIND, start: [0, Math.PI], close: framing([-78, 175, 0], [40, 236, 60], null, .1, 0),
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
