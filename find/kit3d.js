/* ============================================================================================================
   Find the Date!: the 3D kit. The studio light, the materials and the shapes that the packages are made of.
   find.js loads it with import() and hands it three.js once: init(THREE). find/level4.js imports it too.
   Everything is made in code: no model files and no pictures. Sizes are real millimetres (1 scene unit = 100 mm),
   +Y up, +Z toward the class; an angle th round the Y axis puts a point at x = r sin(th), z = r cos(th).
   The look it is after: plastic that looks like plastic (glossy or dull), paper like paper, board like board,
   steel like steel, and clear plastic you can see the food through.
   This is a public page: no student names or student data anywhere in it.
   ============================================================================================================ */
let T = null;
const MM = v => v / 100, TAU = Math.PI * 2;
export function init(THREE) { if (THREE && THREE.BufferGeometry) T = THREE; return !!T; }
export const ready = () => !!T;

/* ---------- small maths ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rnd(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ============================================ surfaces you can feel ============================================
   A grain is a small height field that repeats (made once from noise) turned into a normal map: paper fibres, the
   slow wave of a printed board, the orange peel of moulded plastic, the creases of tight film. A material takes the
   grain at its real size: mm = [width, height] of the area that the mesh's u, v 0..1 covers. */
function lattice(n, cx, cy, R) {
  const g = new Float32Array(cx * cy); for (let i = 0; i < g.length; i++) g[i] = R() * 2 - 1;
  const out = new Float32Array(n * n), s = t => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++) { const fy = y / n * cy, y0 = Math.floor(fy), ty = s(fy - y0), ya = (y0 % cy) * cx, yb = ((y0 + 1) % cy) * cx;
    for (let x = 0; x < n; x++) { const fx = x / n * cx, x0 = Math.floor(fx), tx = s(fx - x0), xa = x0 % cx, xb = (x0 + 1) % cx;
      const a = g[ya + xa] + (g[ya + xb] - g[ya + xa]) * tx, b = g[yb + xa] + (g[yb + xb] - g[yb + xa]) * tx; out[y * n + x] = a + (b - a) * ty; } }
  return out;
}
/* name: [tile in mm, pixels, layers [cells across, cells down, height in mm, shape]]; shape 1 = sharp ridges (creases),
   2 = straight ribs across (a heat seal) */
const GRAINS = {
  board: [64, 256, [[3, 3, .11], [8, 7, .03], [110, 60, .0035], [128, 128, .002]]],
  paper: [32, 256, [[4, 4, .016], [100, 44, .004], [128, 128, .003]]],
  peel: [36, 256, [[4, 4, .05], [22, 22, .011], [64, 64, .0025]]],
  film: [70, 256, [[3, 4, .22, 1], [7, 9, .07, 1], [36, 36, .006]]],
  seal: [12, 128, [[1, 12, .034, 2], [30, 30, .004]]]
};
const GR = {};
function grainBase(name) {
  if (GR[name]) return GR[name];
  const [tile, n, layers] = GRAINS[name], R = rnd(name.length * 7919 + name.charCodeAt(0) * 31 + 5), h = new Float32Array(n * n);
  for (const [cx, cy, amp, shape] of layers) {
    if (shape === 2) { for (let y = 0; y < n; y++) { const v = .5 - .5 * Math.cos(y / n * cy * TAU); for (let x = 0; x < n; x++) h[y * n + x] += amp * v; } continue; }
    const L = lattice(n, cx, cy, R); for (let i = 0; i < h.length; i++) h[i] += amp * (shape === 1 ? 1 - 2 * Math.abs(L[i]) : L[i]);
  }
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), im = x.createImageData(n, n), d = im.data, px = tile / n;
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
    const sx = (h[y * n + (xx + 1) % n] - h[y * n + (xx + n - 1) % n]) / (2 * px), sy = (h[((y + 1) % n) * n + xx] - h[((y + n - 1) % n) * n + xx]) / (2 * px);
    const l = Math.hypot(sx, sy, 1), i = (y * n + xx) * 4;
    d[i] = Math.round((-sx / l * .5 + .5) * 255); d[i + 1] = Math.round((sy / l * .5 + .5) * 255); d[i + 2] = Math.round((1 / l * .5 + .5) * 255); d[i + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; t.userData.shared = true;
  return GR[name] = {t, tile};
}
/* the grain at its real size on an area w x h mm (a copy of the texture that shares its pixels) */
export function grain(name, w, h) { const b = grainBase(name), t = b.t.clone(); t.repeat.set(w / b.tile, h / b.tile); t.userData.shared = true; return t; }
/* a drawing (canvas) as a colour texture */
export function tex(c, o) { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16; if (o && o.wrap) t.wrapS = T.RepeatWrapping; return t; }

/* what each kind of surface is like: rough (0 mirror .. 1 chalk), spec = how much the surface itself mirrors (less than 1
   keeps printed colours rich: the wide, dull mirror of paper only greys them), coat = a clear glossy layer on top (varnish, film),
   sheen = the soft glow of milky plastic, metal, aniso = brushed, grain = [which, how strong], coatGrain = the same for the
   clear layer alone (the creases of film over smooth food) */
const KINDS = {
  board:   {rough: .62, spec: .35, coat: .32, coatRough: .34, grain: ['board', 1]},      /* a printed, varnished folding box */
  carton:  {rough: .46, spec: .4, coat: .75, coatRough: .16, grain: ['board', .7]},      /* a milk carton: board under plastic film */
  paper:   {rough: .66, spec: .4, grain: ['paper', 1]},                                  /* a paper label */
  litho:   {rough: .5, spec: .4, coat: .45, coatRough: .22, grain: ['paper', .7]},       /* a glossy printed paper label */
  thermal: {rough: .8, spec: .4, grain: ['paper', .6]},                                  /* a store's scale label */
  sleeve:  {rough: .3, spec: .3, coat: 1, coatRough: .08, grain: ['film', .35]},         /* a printed plastic film label */
  hdpe:    {rough: .4, coat: .35, coatRough: .26, sheen: .1, sheenRough: .5, grain: ['peel', 1]},   /* milk-jug plastic: waxy, half glossy */
  cap:     {rough: .34, grain: ['peel', .6]},                                   /* a moulded cap or lid: glossy, hard */
  steel:   {rough: .3, metal: 1, aniso: .75},                                   /* a can end: turned tinplate */
  alu:     {rough: .3, metal: 1},                                               /* a pressed aluminium part: a ring tab */
  food:    {rough: .6, spec: .15},                                              /* what is inside a clear jar or bottle (the wall has the shine) */
  wrap:    {rough: .62, spec: .3, coat: 1, coatRough: .1, coatGrain: ['film', .5]},      /* food under tight clear film (vacuum sealed) */
  ink:     {rough: .7, spec: .3}                                                         /* inkjet print on its own see-through patch */
};
let ENV = 1;
/* a material of one kind. o = {map: canvas or texture, color, mm: [w, h] (for the grain), rough, coat, env, decal (a
   see-through patch just above another surface), lift (a skin that lies right on another surface, like a paper label),
   sink (a surface tucked right under another one, like the folded-in end of a carton under its roof: drawn a little
   deeper, so that no edge of it can show through the surface over it), ao (the mesh has vertex shades), side,
   grain: false or [name, k]} */
export function surf(kind, o = {}) {
  const p = KINDS[kind] || KINDS.board, q = {roughness: o.rough != null ? o.rough : p.rough, metalness: p.metal || 0, envMapIntensity: ENV * (o.env != null ? o.env : 1)};
  if (o.map) q.map = o.map.isTexture ? o.map : tex(o.map);
  if (o.color != null) q.color = o.color;
  if (o.ao) q.vertexColors = true;
  if (o.side != null) q.side = o.side;
  if (o.decal) Object.assign(q, {transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4});
  if (o.lift) Object.assign(q, {polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5});
  if (o.sink) Object.assign(q, {polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2});
  const coat = o.coat != null ? o.coat : p.coat;
  if (coat) { q.clearcoat = coat; q.clearcoatRoughness = o.coatRough != null ? o.coatRough : p.coatRough; }
  if (p.sheen) { q.sheen = p.sheen; q.sheenRoughness = p.sheenRough; q.sheenColor = new T.Color(1, 1, 1); }
  if (p.aniso) { q.anisotropy = p.aniso; }
  const spec = o.spec != null ? o.spec : p.spec; if (spec != null) q.specularIntensity = spec;
  const g = o.grain === false ? null : (o.grain || p.grain);
  if (g && o.mm) { q.normalMap = grain(g[0], o.mm[0], o.mm[1]); q.normalScale = new T.Vector2(g[1], g[1]); }
  const cg = o.coatGrain === false ? null : (o.coatGrain || p.coatGrain);
  if (cg && coat && o.mm) { q.clearcoatNormalMap = grain(cg[0], o.mm[0], o.mm[1]); q.clearcoatNormalScale = new T.Vector2(cg[1], cg[1]); }
  return (coat || p.sheen || p.aniso || spec != null) ? new T.MeshPhysicalMaterial(q) : new T.MeshStandardMaterial(q);
}
/* clear plastic (a jar, a bottle, tight film): you see what is behind it, plus the light that glances off it. Its
   shine keeps its strength however clear the plastic is (a pixel is as solid as its shine is bright); the edges turn a
   little milky, as thick clear walls do.
   o = {tint, rough, base (how milky straight on, 0..1), edge (how milky at the edges), ior, mm + grain (creases)} */
export function clear(o = {}) {
  const q = {color: o.tint != null ? o.tint : 0xffffff, roughness: o.rough != null ? o.rough : .07, metalness: 0, ior: o.ior || 1.75, transparent: true, premultipliedAlpha: true,
    depthWrite: false, envMapIntensity: ENV * (o.env != null ? o.env : 1), side: o.side != null ? o.side : T.FrontSide};
  if (o.grain && o.mm) { q.normalMap = grain(o.grain[0], o.mm[0], o.mm[1]); q.normalScale = new T.Vector2(o.grain[1], o.grain[1]); }
  const m = new T.MeshPhysicalMaterial(q), U = {uBase: {value: o.base != null ? o.base : .07}, uEdge: {value: o.edge != null ? o.edge : .5}};
  m.onBeforeCompile = sh => { sh.uniforms.uBase = U.uBase; sh.uniforms.uEdge = U.uEdge;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uBase;\nuniform float uEdge;')
      .replace('#include <opaque_fragment>', 'float fdA = clamp( uBase + uEdge * pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 3.0 ), 0.0, 1.0 );\n' +
        'vec3 fdS = max( outgoingLight - totalDiffuse, vec3( 0.0 ) );\n' +
        'float fdO = clamp( fdA + max( fdS.r, max( fdS.g, fdS.b ) ), 0.0, 1.0 );\n' +
        'gl_FragColor = vec4( ( totalDiffuse * fdA + fdS ) / max( fdO, 0.0001 ), fdO );'); };
  m.customProgramCacheKey = () => 'fd-clear';
  return m;
}
/* a mesh that takes part in the light: it throws a shadow and takes one (o.shadow false: neither, for print patches and
   clear shells; o.cast false: takes one only) */
export function mesh(g, m, o = {}) { const me = new T.Mesh(g, m); me.castShadow = o.shadow !== false && o.cast !== false; me.receiveShadow = o.shadow !== false; if (o.order) me.renderOrder = o.order; return me; }

/* ================================================= the studio =================================================
   The light of a product photo: a room of soft boxes that every surface mirrors a little (bright, never harsh), and
   one key light from the upper left that gives the package its shape and a soft shadow on itself. Bright spots roll
   off softly instead of burning out; the printed colours stay the colours that were drawn. */
function toneCurve() {
  const C = T.ShaderChunk, from = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
  if (C.tonemapping_pars_fragment.includes(from)) C.tonemapping_pars_fragment = C.tonemapping_pars_fragment.replace(from,
    'vec3 CustomToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\tconst float k = 0.8;\n\tvec3 over = max( color - k, 0.0 ) / ( 1.0 - k );\n' +
    '\treturn mix( color, k + ( 1.0 - k ) * ( 1.0 - exp( - over ) ), step( k, color ) );\n}');
}
const KEY_DIR = [-2.5, 4, 4];
export function studio(renderer, scene, o = {}) {
  toneCurve(); renderer.toneMapping = T.CustomToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  /* the room: a soft sky that is a little brighter above, and the boxes of light */
  const room = new T.Scene(), junk = [];
  const add = (g, m) => { const me = new T.Mesh(g, m); junk.push(g, m); room.add(me); return me; };
  { const g = new T.SphereGeometry(60, 48, 24), p = g.attributes.position, col = [];
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 60, v = y > 0 ? .38 + .12 * y : .38 + .03 * y; col.push(v, v, v * 1.02); }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); add(g, new T.MeshBasicMaterial({side: T.BackSide, vertexColors: true})); }
  /* a box of light: where it is (a direction), how wide and tall it looks from the package (degrees), how bright */
  const box = (dir, wd, hd, L, warm) => { const w = 2 * 20 * Math.tan(wd * Math.PI / 360), h = 2 * 20 * Math.tan(hd * Math.PI / 360);
    const me = add(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({color: new T.Color().setRGB(L * (1 + (warm || 0)), L, L * (1 - (warm || 0))), side: T.DoubleSide}));
    me.position.set(dir[0], dir[1], dir[2]).normalize().multiplyScalar(20); me.lookAt(0, 0, 0); };
  box(KEY_DIR, 22, 17, 5, .02);              /* the key, where the key light is */
  box([.15, 1, .2], 46, 32, 1.2);            /* a soft top */
  box([.92, .2, -.34], 9, 64, 3.4, -.02);    /* a tall strip behind on the right: the bright edge on round things */
  box([-.86, .1, -.5], 11, 44, 1.8);         /* a strip behind on the left */
  box([.42, -.06, 1], 40, 28, .6);           /* a dim card by the camera: glossy fronts never go black */
  box([0, -1, .15], 80, 80, .42, .03);       /* the light table underneath */
  const pm = new T.PMREMGenerator(renderer), rt = pm.fromScene(room, 0, .1, 200); pm.dispose(); junk.forEach(x => x.dispose());
  scene.environment = rt.texture;
  const key = new T.DirectionalLight(0xffffff, o.key != null ? o.key : 1.15), D = 6;
  key.position.set(KEY_DIR[0], KEY_DIR[1], KEY_DIR[2]).normalize().multiplyScalar(D); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 2.2; key.shadow.bias = -.00035; key.shadow.normalBias = .0035;
  scene.add(key); scene.add(key.target);
  const last = new T.Quaternion(9, 9, 9, 9); let lastObj = null, lvl = 0;
  return {key, env: rt.texture,
    /* the shadow covers a ball of radius R (scene units) round the middle of the turning package */
    fit(R) { const c = key.shadow.camera, s = R * 1.04; c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = D - s * 1.1; c.far = D + s * 1.1; c.updateProjectionMatrix(); lastObj = null; },
    /* call before every render: the shadow is drawn again only when the package turned or changed */
    touch(obj, q) { if (obj !== lastObj || !last.equals(q)) { lastObj = obj; last.copy(q); renderer.shadowMap.needsUpdate = true; } },
    /* 0 = the full look; 1 = a smaller shadow picture; 2 = no shadow on the package (slow tablets) */
    quality(n) { n = clamp(n | 0, 0, 2); if (n === lvl) return; lvl = n; key.castShadow = n < 2; const s = n ? 1024 : 2048;
      if (key.shadow.mapSize.x !== s) { key.shadow.mapSize.set(s, s); if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; } } lastObj = null; },
    dispose() { scene.environment = null; rt.dispose(); if (key.shadow.map) key.shadow.map.dispose(); scene.remove(key); scene.remove(key.target); }};
}

/* ================================================== shapes ================================================== */
/* a geometry from plain arrays (positions in scene units) */
export function geo(pos, nor, uv, idx, col, tan) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  if (uv) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  if (tan) g.setAttribute('tangent', new T.Float32BufferAttribute(tan, 4));
  g.setIndex(idx.length > 65535 || pos.length / 3 > 65535 ? new T.Uint32BufferAttribute(idx, 1) : new T.Uint16BufferAttribute(idx, 1));
  return g;
}
/* a line of points [[r, y, rad], ...] with its corners rounded: a third number rounds that corner with that radius (mm);
   0 makes it a hard crease (the point comes out twice); none leaves the point as it is. n = pieces per quarter turn */
export function fillet(P, n = 7) {
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], rad = p[2];
    if (rad === 0 && i > 0 && i < P.length - 1) { out.push([p[0], p[1]], [p[0], p[1]]); continue; }
    if (!rad || i === 0 || i === P.length - 1) { out.push([p[0], p[1]]); continue; }
    const a = P[i - 1], b = P[i + 1];
    let ux = a[0] - p[0], uy = a[1] - p[1], vx = b[0] - p[0], vy = b[1] - p[1];
    const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy); ux /= lu; uy /= lu; vx /= lv; vy /= lv;
    const ang = Math.acos(clamp(ux * vx + uy * vy, -1, 1));
    if (ang > Math.PI - 1e-3 || ang < 1e-3) { out.push([p[0], p[1]]); continue; }
    let t = rad / Math.tan(ang / 2), r2 = rad;
    const tmax = Math.min(lu * (a[2] ? .5 : 1), lv * (b[2] ? .5 : 1));
    if (t > tmax) { t = tmax; r2 = t * Math.tan(ang / 2); }
    const p0 = [p[0] + ux * t, p[1] + uy * t], p1 = [p[0] + vx * t, p[1] + vy * t];
    let bx = ux + vx, by = uy + vy; const lb = Math.hypot(bx, by); bx /= lb; by /= lb;
    const cx = p[0] + bx * r2 / Math.sin(ang / 2), cy = p[1] + by * r2 / Math.sin(ang / 2);
    const a0 = Math.atan2(p0[1] - cy, p0[0] - cx); let da = Math.atan2(p1[1] - cy, p1[0] - cx) - a0;
    while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    const k = Math.max(2, Math.ceil(Math.abs(da) / (Math.PI / 2) * n));
    for (let j = 0; j <= k; j++) { const aa = a0 + da * j / k; out.push([cx + r2 * Math.cos(aa), cy + r2 * Math.sin(aa)]); }
  }
  return out;
}
/* a shape turned round the Y axis (a can, a jar, a cap). P = its outline [[r, y], ...] in mm, drawn so that the outside
   is on the right of the way it goes (up the outside wall, in across the top); a point given twice is a hard crease.
   o.seg = steps round (96); o.arc = [start angle, how far] (a full turn if left out);
   o.wave(th, r, y) = mm added to r (ribs, flutes: give enough seg); o.shade(th, r, y) = 0..1 vertex shade (the dark in grooves);
   o.uv = 'wrap' (u round, v up: the default; o.v = [y0, y1] the heights that v 0..1 covers), 'len' (v along the outline),
   'top' or 'bottom' (flat, from above or below: o.R = the radius that u, v 0..1 cover), or (th, r, y, s) => [u, v];
   o.tan = also give the brushing direction (round the axis) for brushed metal */
export function revolve(P, o = {}) {
  const seg = o.seg || 96, th0 = o.arc ? o.arc[0] : 0, thL = o.arc ? o.arc[1] : TAU, full = !o.arc || Math.abs(thL - TAU) < 1e-9;
  const runs = []; let cur = [P[0]];
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; if (Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) { if (cur.length > 1) runs.push(cur); cur = [b]; } else cur.push(b); }
  if (cur.length > 1) runs.push(cur);
  let y0 = Infinity, y1 = -Infinity, len = 0; for (const p of P) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const v0 = o.v ? o.v[0] : y0, v1 = o.v ? o.v[1] : y1, R = o.R || 1, mode = o.uv || 'wrap';
  const pos = [], nor = [], uv = [], idx = [], col = o.shade ? [] : null, tan = o.tan ? [] : null; let base = 0, s0 = 0;
  for (const run of runs) {
    const m = run.length, sAt = [s0]; for (let j = 1; j < m; j++) sAt.push(sAt[j - 1] + Math.hypot(run[j][0] - run[j - 1][0], run[j][1] - run[j - 1][1]));
    const rr = new Float32Array(m * (seg + 1));
    for (let j = 0; j < m; j++) for (let i = 0; i <= seg; i++) { const th = th0 + thL * i / seg; rr[j * (seg + 1) + i] = run[j][0] + (o.wave ? o.wave(th, run[j][0], run[j][1]) : 0); }
    for (let j = 0; j < m; j++) { const ja = Math.max(0, j - 1), jb = Math.min(m - 1, j + 1), y = run[j][1];
      for (let i = 0; i <= seg; i++) { const th = th0 + thL * i / seg, sn = Math.sin(th), cs = Math.cos(th), r = rr[j * (seg + 1) + i];
        pos.push(MM(r * sn), MM(y), MM(r * cs));
        /* the normal: across the outline (in its own plane), leaned by the wave's slope round the axis */
        const dr = rr[jb * (seg + 1) + i] - rr[ja * (seg + 1) + i], dy = run[jb][1] - run[ja][1]; let nr = dy, ny = -dr, nt = 0;
        if (o.wave && r > 1e-6) { const ia = full ? (i + seg - 1) % seg : Math.max(0, i - 1), ib = full ? (i + 1) % seg : Math.min(seg, i + 1), dth = (full ? 2 : (ib - ia)) * thL / seg;
          nt = -(rr[j * (seg + 1) + ib] - rr[j * (seg + 1) + ia]) / (dth * r) * dy; }
        const l = Math.hypot(nr, ny, nt) || 1; nr /= l; ny /= l; nt /= l;
        nor.push(nr * sn + nt * cs, ny, nr * cs - nt * sn);
        if (mode === 'top') uv.push(r * sn / (2 * R) + .5, -r * cs / (2 * R) + .5);
        else if (mode === 'bottom') uv.push(r * sn / (2 * R) + .5, r * cs / (2 * R) + .5);
        else if (mode === 'len') uv.push(i / seg, sAt[j] / (len || 1));
        else if (typeof mode === 'function') { const q = mode(th, r, y, sAt[j]); uv.push(q[0], q[1]); }
        else uv.push(i / seg, (y - v0) / ((v1 - v0) || 1));
        if (col) { const c = o.shade(th, r, y); col.push(c, c, c); }
        if (tan) tan.push(cs, 0, -sn, 1);
      } }
    for (let j = 0; j < m - 1; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i, b = a + 1, c = a + seg + 1, e = c + 1;
      if (run[j][0] > 1e-7 || run[j + 1][0] > 1e-7) { if (run[j][0] > 1e-7) idx.push(a, b, e); if (run[j + 1][0] > 1e-7) idx.push(a, e, c); } }
    base += m * (seg + 1); s0 = sAt[m - 1];
  }
  return geo(pos, nor, uv, idx, col, tan);
}
/* a box with rounded edges, as six face meshes. Every face keeps its own flat drawing: its u, v run 0..1 over the whole
   face, edge to edge, and each face carries its half of the round edges beside it. Corners in the engine's order
   (bottom-left, bottom-right, top-right, top-left, seen from outside). r = edge radius (mm).
   o.bulge = mm (or {front, back, ...}) that the middle of a face swells out (a full carton, a bowed box);
   o.sharp = {top: true, ...} sides whose edges stay as crisp folds; o.n = pieces across a round edge (4); o.div = pieces
   across a face (1, or 10 when it bulges); o.hole = {front: [a0, b0, a1, b1, r]} a window cut through that face, with round
   corners (mm from the face's left and bottom edges) */
export function rbox(W, H, D, r, o = {}) {
  const X = W / 2, Z = D / 2, n = o.n || 4, sh = o.sharp || {};
  const lo = [sh.left ? -X : -X + r, sh.bottom ? 0 : r, sh.back ? -Z : -Z + r], hi = [sh.right ? X : X - r, sh.top ? H : H - r, sh.front ? Z : Z - r];
  const F = {front: [[-X, 0, Z], [1, 0, 0], [0, 1, 0], W, H], back: [[X, 0, -Z], [-1, 0, 0], [0, 1, 0], W, H], right: [[X, 0, Z], [0, 0, -1], [0, 1, 0], D, H],
    left: [[-X, 0, -Z], [0, 0, 1], [0, 1, 0], D, H], top: [[-X, H, Z], [1, 0, 0], [0, 0, -1], W, D], bottom: [[-X, 0, -Z], [1, 0, 0], [0, 0, 1], W, D]};
  const out = {};
  for (const name in F) {
    const [bl, ri, up, fw, fh] = F[name], nf = [ri[1] * up[2] - ri[2] * up[1], ri[2] * up[0] - ri[0] * up[2], ri[0] * up[1] - ri[1] * up[0]];
    const B = typeof o.bulge === 'number' ? o.bulge : (o.bulge && o.bulge[name]) || 0, div = o.div || (B ? 10 : 1);
    const ticks = len => { const t = []; for (let k = n; k >= 0; k--) t.push(r - r * Math.tan(k / n * Math.PI / 4)); for (let k = 1; k < div; k++) t.push(r + (len - 2 * r) * k / div);
      for (let k = 0; k <= n; k++) t.push(len - r + r * Math.tan(k / n * Math.PI / 4)); return t; };
    const hole = o.hole && o.hole[name], HM = 6;
    /* a window: its straight edges and its round corners fall on grid lines, so the cut follows grid points exactly */
    const cut = (t, h0, h1, hr) => { for (let k = 0; k <= HM; k++) { const c = hr * (1 - Math.cos(k / HM * Math.PI / 2)); t.push(h0 + c, h1 - c); } t.sort((x, y) => x - y); return t.filter((v, i) => !i || v - t[i - 1] > 1e-6); };
    const A = hole ? cut(ticks(fw), hole[0], hole[2], hole[4]) : ticks(fw), Bt = hole ? cut(ticks(fh), hole[1], hole[3], hole[4]) : ticks(fh), pos = [], nor = [], uv = [], idx = [];
    const inHole = (a, b) => { const [a0, b0, a1, b1, hr] = hole; if (a <= a0 || a >= a1 || b <= b0 || b >= b1) return false;
      const ca = a < a0 + hr ? a0 + hr : a > a1 - hr ? a1 - hr : a, cb = b < b0 + hr ? b0 + hr : b > b1 - hr ? b1 - hr : b; return Math.hypot(a - ca, b - cb) < hr; };
    const w = s => { s = clamp(s, 0, 1); const q = Math.sin(Math.PI * s); return q * Math.sqrt(q); }, dw = s => { if (s <= 0 || s >= 1) return 0; const q = Math.sin(Math.PI * s); return 1.5 * Math.sqrt(q) * Math.cos(Math.PI * s) * Math.PI; };
    for (const b of Bt) for (const a of A) {
      const p = [bl[0] + ri[0] * a + up[0] * b, bl[1] + ri[1] * a + up[1] * b, bl[2] + ri[2] * a + up[2] * b];
      const c = [clamp(p[0], lo[0], hi[0]), clamp(p[1], lo[1], hi[1]), clamp(p[2], lo[2], hi[2])];
      let nx = p[0] - c[0], ny = p[1] - c[1], nz = p[2] - c[2], l = Math.hypot(nx, ny, nz);
      if (l < 1e-9) { nx = nf[0]; ny = nf[1]; nz = nf[2]; l = 1; } nx /= l; ny /= l; nz /= l;
      /* on a sharp side the face runs flat to its edge: keep the point where it is */
      let q = [c[0] + nx * Math.min(l, r), c[1] + ny * Math.min(l, r), c[2] + nz * Math.min(l, r)];
      if (l < r - 1e-9) { q = p; nx = nf[0]; ny = nf[1]; nz = nf[2]; }
      if (B) { const sa = (a - r) / (fw - 2 * r), sb = (b - r) / (fh - 2 * r), d = B * w(sa) * w(sb), da = B * dw(sa) / (fw - 2 * r) * w(sb), db = B * w(sa) * dw(sb) / (fh - 2 * r);
        if (d > 0) { q = [q[0] + nf[0] * d, q[1] + nf[1] * d, q[2] + nf[2] * d]; nx = nf[0] - da * ri[0] - db * up[0]; ny = nf[1] - da * ri[1] - db * up[1]; nz = nf[2] - da * ri[2] - db * up[2]; const l2 = Math.hypot(nx, ny, nz); nx /= l2; ny /= l2; nz /= l2; } }
      pos.push(MM(q[0]), MM(q[1]), MM(q[2])); nor.push(nx, ny, nz); uv.push(a / fw, b / fh);
    }
    const na = A.length; for (let j = 0; j < Bt.length - 1; j++) for (let i = 0; i < na - 1; i++) { const a = j * na + i, b = a + 1, c = a + na, e = c + 1;
      if (!hole) { idx.push(a, b, e, a, e, c); continue; }
      /* in a window's corner the square is halved along the cut; a half whose middle lies in the window is left out */
      const ma = (A[i] + A[i + 1]) / 2, mb = (Bt[j] + Bt[j + 1]) / 2, lowA = ma < hole[0] + hole[4], hiA = ma > hole[2] - hole[4], lowB = mb < hole[1] + hole[4], hiB = mb > hole[3] - hole[4];
      const tris = (lowA && lowB) || (hiA && hiB) ? [[a, b, c], [b, e, c]] : [[a, b, e], [a, e, c]];
      for (const t of tris) { let sa = 0, sb = 0; for (const v of t) { sa += A[v % na]; sb += Bt[Math.floor(v / na)]; } if (!inHole(sa / 3, sb / 3)) idx.push(t[0], t[1], t[2]); } }
    out[name] = geo(pos, nor, uv, idx);
  }
  return out;
}
/* a flat sheet with rounded corners as a grid of points (a label, a window): returns {pts: [[a, b], ...], idx} with a across
   0..W and b up 0..H (mm); step = the most a grid square may measure */
export function sheet(W, H, r, step = 6) {
  const ticks = len => { const t = [0]; if (r > 0) for (let k = 1; k <= 3; k++) t.push(r * k / 3); const m = Math.max(1, Math.ceil((len - 2 * r) / step)); for (let k = 1; k <= m; k++) t.push(r + (len - 2 * r) * k / m);
    if (r > 0) for (let k = 1; k <= 3; k++) t.push(len - r + r * k / 3); return t; };
  const A = ticks(W), B = ticks(H), pts = [], idx = [];
  for (const b of B) for (const a of A) { let x = a, y = b;
    /* a corner square is pulled into a quarter circle */
    const cx = a < r ? r : a > W - r ? W - r : null, cy = b < r ? r : b > H - r ? H - r : null;
    if (cx !== null && cy !== null) { const dx = a - cx, dy = b - cy, m = Math.max(Math.abs(dx), Math.abs(dy)), l = Math.hypot(dx, dy); if (l > 1e-9) { x = cx + dx * m / l; y = cy + dy * m / l; } }
    pts.push([x, y]); }
  const na = A.length; for (let j = 0; j < B.length - 1; j++) for (let i = 0; i < na - 1; i++) { const a = j * na + i, b = a + 1, c = a + na, e = c + 1; idx.push(a, b, e, a, e, c); }
  return {pts, idx};
}
/* a smooth solid from a field F(x, y, z) in mm (below zero inside, above zero outside, rising about 1 per mm): the way
   to make shapes that no lathe or box can, like a jug with its handle. Surface nets on cubes `cell` mm wide inside
   box = [x0, y0, z0, x1, y1, z1]; then every corner is pulled exactly onto F = 0 and takes F's slope as its normal.
   Returns plain arrays {pos (mm), nor, idx}; o.shade = also the dark of hollows, one number per corner (0..1) */
export function nets(F, box, cell, o = {}) {
  const [x0, y0, z0, x1, y1, z1] = box, nx = Math.ceil((x1 - x0) / cell) + 1, ny = Math.ceil((y1 - y0) / cell) + 1, nz = Math.ceil((z1 - z0) / cell) + 1, nxy = nx * ny;
  const val = new Float32Array(nx * ny * nz);
  for (let k = 0, q = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++, q++) val[q] = F(x0 + i * cell, y0 + j * cell, z0 + k * cell) || 1e-6;
  const vid = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), P = [], cnx = nx - 1, cnxy = (nx - 1) * (ny - 1);
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], cv = new Float64Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const q = k * nxy + j * nx + i; let neg = 0;
    for (let c = 0; c < 8; c++) { cv[c] = val[q + (c & 1) + ((c >> 1) & 1) * nx + ((c >> 2) & 1) * nxy]; if (cv[c] < 0) neg++; }
    if (neg === 0 || neg === 8) continue;
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (const [a, b] of E) { const fa = cv[a], fb = cv[b]; if ((fa < 0) === (fb < 0)) continue; const t = fa / (fa - fb);
      sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; m++; }
    vid[k * cnxy + j * cnx + i] = P.length / 3; P.push(x0 + (i + sx / m) * cell, y0 + (j + sy / m) * cell, z0 + (k + sz / m) * cell);
  }
  /* pull each corner onto the surface (two Newton steps), then take the slope there as its normal */
  const nv = P.length / 3, pos = new Float32Array(P), nor = new Float32Array(nv * 3), h = cell * .2, g = [0, 0, 0];
  const grad = (x, y, z) => { const a = F(x + h, y - h, z - h), b = F(x - h, y - h, z + h), c = F(x - h, y + h, z - h), d = F(x + h, y + h, z + h);
    g[0] = (a - b - c + d) / (4 * h); g[1] = (-a - b + c + d) / (4 * h); g[2] = (-a + b - c + d) / (4 * h); };
  for (let v = 0; v < nv; v++) { let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    for (let it = 0; it < 2; it++) { const f = F(x, y, z); grad(x, y, z); const l2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2] || 1, s = clamp(f / l2, -cell, cell); x -= g[0] * s; y -= g[1] * s; z -= g[2] * s; }
    grad(x, y, z); const l = Math.hypot(g[0], g[1], g[2]) || 1; pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z; nor[v * 3] = g[0] / l; nor[v * 3 + 1] = g[1] / l; nor[v * 3 + 2] = g[2] / l; }
  /* a square for every grid edge that the surface crosses, wound to face out */
  const idx = [], quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d); };
  const V = (i, j, k) => vid[k * cnxy + j * cnx + i];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = k * nxy + j * nx + i, f = val[q];
    if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1 && (f < 0) !== (val[q + 1] < 0)) quad(V(i, j - 1, k - 1), V(i, j, k - 1), V(i, j, k), V(i, j - 1, k), f > 0);
    if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1 && (f < 0) !== (val[q + nx] < 0)) quad(V(i - 1, j, k - 1), V(i - 1, j, k), V(i, j, k), V(i, j, k - 1), f > 0);
    if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1 && (f < 0) !== (val[q + nxy] < 0)) quad(V(i - 1, j - 1, k), V(i, j - 1, k), V(i, j, k), V(i - 1, j, k), f > 0); }
  let shade = null;
  if (o.shade) { shade = new Float32Array(nv); const ds = [2.5, 6, 12, 22];
    for (let v = 0; v < nv; v++) { let occ = 0; for (const d of ds) { const f = F(pos[v * 3] + nor[v * 3] * d, pos[v * 3 + 1] + nor[v * 3 + 1] * d, pos[v * 3 + 2] + nor[v * 3 + 2] * d); occ += clamp(1 - f / d, 0, 1); }
      shade[v] = 1 - o.shade * occ / ds.length; }
    /* soften it over the surface: each corner with its neighbours, twice */
    const sum = new Float32Array(nv), cnt = new Uint16Array(nv);
    for (let pass = 0; pass < 2; pass++) { sum.fill(0); cnt.fill(0);
      for (let f = 0; f < idx.length; f += 3) { const a = idx[f], b = idx[f + 1], c = idx[f + 2]; sum[a] += shade[b] + shade[c]; sum[b] += shade[a] + shade[c]; sum[c] += shade[a] + shade[b]; cnt[a] += 2; cnt[b] += 2; cnt[c] += 2; }
      for (let v = 0; v < nv; v++) if (cnt[v]) shade[v] = .4 * shade[v] + .6 * sum[v] / cnt[v]; } }
  return {pos, nor, idx, shade, n: nv};
}
/* the outline of a package for the camera: a few hundred of its outermost points (group-local), not every corner */
export function hull(group) {
  const all = [], v = new T.Vector3();
  group.children.forEach(m => { if (!m.isMesh) return; m.updateMatrix(); const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrix); all.push(v.x, v.y, v.z); } });
  const n = all.length / 3; if (n <= 600) { const out = []; for (let i = 0; i < n; i++) out.push(new T.Vector3(all[i * 3], all[i * 3 + 1], all[i * 3 + 2])); return out; }
  let ax = 1e9, ay = 1e9, az = 1e9, bx = -1e9, by = -1e9, bz = -1e9;
  for (let i = 0; i < n; i++) { const x = all[i * 3], y = all[i * 3 + 1], z = all[i * 3 + 2]; if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; if (z < az) az = z; if (z > bz) bz = z; }
  const cx = (ax + bx) / 2, cy = (ay + by) / 2, cz = (az + bz) / 2, NA = 24, NB = 48, best = new Int32Array(NA * NB).fill(-1), bd = new Float32Array(NA * NB);
  /* the farthest point in each direction cell, and the farthest along a spread of fixed directions */
  const dirs = []; for (let i = 0; i < 90; i++) { const y = 1 - (i + .5) / 45, r = Math.sqrt(Math.max(0, 1 - y * y)), t = i * 2.399963; dirs.push(r * Math.cos(t), y, r * Math.sin(t)); }
  const db = new Int32Array(90).fill(-1), dd = new Float32Array(90).fill(-1e9);
  for (let i = 0; i < n; i++) { const x = all[i * 3] - cx, y = all[i * 3 + 1] - cy, z = all[i * 3 + 2] - cz, d = x * x + y * y + z * z, l = Math.sqrt(d) || 1;
    const a = Math.min(NA - 1, Math.floor(Math.acos(clamp(y / l, -1, 1)) / Math.PI * NA)), b = Math.min(NB - 1, Math.floor((Math.atan2(z, x) + Math.PI) / TAU * NB)), c = a * NB + b;
    if (d > bd[c]) { bd[c] = d; best[c] = i; }
    for (let k = 0; k < 90; k++) { const s = x * dirs[k * 3] + y * dirs[k * 3 + 1] + z * dirs[k * 3 + 2]; if (s > dd[k]) { dd[k] = s; db[k] = i; } } }
  const keep = new Set(); best.forEach(i => { if (i >= 0) keep.add(i); }); db.forEach(i => { if (i >= 0) keep.add(i); });
  return [...keep].map(i => new T.Vector3(all[i * 3], all[i * 3 + 1], all[i * 3 + 2]));
}
