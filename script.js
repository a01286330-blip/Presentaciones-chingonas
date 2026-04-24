/* ============================================================
   GRUPOMAKA División Financiera — script.js
   Three.js · GSAP + ScrollTrigger · Zenith X motion logic
   NO ScrollSmoother — native scroll, always works
   ============================================================ */

'use strict';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────
   1. RENDERER + SCENE + CAMERA
   ───────────────────────────────────────────────────────────── */
const canvas = document.getElementById('canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);

function setCameraZ() {
  camera.position.z = window.innerWidth < 600 ? 9 : window.innerWidth < 900 ? 7.5 : 6.5;
}
setCameraZ();

/* ─────────────────────────────────────────────────────────────
   2. COIN CONSTANTS + MATERIALS
   ───────────────────────────────────────────────────────────── */
const CR = 1.5;   // coin radius
const CT = 0.18;  // coin thickness along Z
const HT = CT / 2;

function mkMat(hex, metalness, roughness, extra) {
  return new THREE.MeshStandardMaterial(
    Object.assign({ color: new THREE.Color(hex), metalness, roughness, envMapIntensity: 2.2 }, extra)
  );
}

const matGold   = mkMat('#c9a84c', 1.0, 0.08);
const matGoldMd = mkMat('#9a7020', 1.0, 0.22);
const matTi     = mkMat('#080808', 0.88, 0.42, { side: THREE.DoubleSide });
const matPlate  = mkMat('#050505', 0.70, 0.60, { transparent: true, opacity: 0.93 });

/* ─────────────────────────────────────────────────────────────
   3. PROCEDURAL LOGO CANVAS TEXTURE  (instant — no file load)
   ───────────────────────────────────────────────────────────── */
function makeLogoTexture() {
  const cv  = document.createElement('canvas');
  cv.width  = 512;
  cv.height = 512;
  const cx  = cv.getContext('2d');
  const cx0 = 256, cy0 = 256;

  const grd = cx.createRadialGradient(cx0, cy0 - 30, 0, cx0, cy0, 180);
  grd.addColorStop(0, 'rgba(232,201,122,1)');
  grd.addColorStop(1, 'rgba(138,106,26,0.85)');

  /* Rings */
  [215, 178, 142].forEach((r, i) => {
    cx.beginPath();
    cx.arc(cx0, cy0, r, 0, Math.PI * 2);
    cx.strokeStyle = 'rgba(201,168,76,' + [0.75, 0.45, 0.28][i] + ')';
    cx.lineWidth   = [3, 1.5, 1][i];
    cx.stroke();
  });

  /* 12 dot markers */
  cx.fillStyle = 'rgba(201,168,76,0.55)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    cx.beginPath();
    cx.arc(cx0 + Math.cos(a) * 195, cy0 + Math.sin(a) * 195, i % 3 === 0 ? 4 : 2.5, 0, Math.PI * 2);
    cx.fill();
  }

  /* "GM" monogram */
  cx.fillStyle = grd;
  cx.font      = 'bold 108px Georgia, serif';
  cx.textAlign = 'center';
  cx.textBaseline = 'alphabetic';
  cx.fillText('GM', cx0, cy0 + 40);

  /* GRUPOMAKA */
  cx.fillStyle = 'rgba(201,168,76,0.78)';
  cx.font      = '500 24px Inter, Arial, sans-serif';
  cx.letterSpacing = '6px';
  cx.fillText('GRUPOMAKA', cx0, cy0 + 100);

  /* DIVISIÓN FINANCIERA */
  cx.fillStyle = 'rgba(161,161,161,0.55)';
  cx.font      = '300 14px Inter, Arial, sans-serif';
  cx.letterSpacing = '4px';
  cx.fillText('DIVISIÓN FINANCIERA', cx0, cy0 + 130);

  return new THREE.CanvasTexture(cv);
}

const logoTex = makeLogoTexture();
const matLogo = new THREE.MeshStandardMaterial({
  map:             logoTex,
  alphaMap:        logoTex,
  transparent:     true,
  metalness:       0.92,
  roughness:       0.10,
  color:           new THREE.Color('#d4aa35'),
  envMapIntensity: 2.0,
  side:            THREE.DoubleSide,
});

/* ─────────────────────────────────────────────────────────────
   4. COIN GROUP
   Cylinder axis = Y → rotated -90° on X → axis becomes +Z
   Coin face lies in XY plane; rim wraps around Z
   ───────────────────────────────────────────────────────────── */
const coinGroup = new THREE.Group();
scene.add(coinGroup);

/* RIM */
const rimMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(CR, CR, CT, 160, 2, true),
  matGold
);
rimMesh.rotation.x = -Math.PI / 2;
coinGroup.add(rimMesh);

/* Knurling lines on rim (thin dark strips) */
for (let i = 0; i < 80; i++) {
  const a  = (i / 80) * Math.PI * 2;
  const sg = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.007, CT * 1.025), matGoldMd);
  sg.position.set(Math.cos(a) * CR, Math.sin(a) * CR, 0);
  coinGroup.add(sg);
}

/* FRONT FACE */
const faceFront = new THREE.Group();
faceFront.position.z = HT;
coinGroup.add(faceFront);

faceFront.add(new THREE.Mesh(new THREE.CircleGeometry(CR - 0.012, 128), matTi));

/* logo + rings on front face */
const logoF = new THREE.Mesh(new THREE.CircleGeometry(CR * 0.93, 128), matLogo);
logoF.position.z = 0.003;
faceFront.add(logoF);

[0.33, 0.50, 0.67, 0.84].forEach(f => {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(CR * f, 0.004, 8, 128), mkMat('#c9a84c', 1, 0.12));
  ring.position.z = 0.003;
  faceFront.add(ring);
});

/* BACK FACE */
const faceBack = new THREE.Group();
faceBack.position.z = -HT;
coinGroup.add(faceBack);

const backDisk = new THREE.Mesh(new THREE.CircleGeometry(CR - 0.012, 128), matTi.clone());
backDisk.rotation.y = Math.PI;
faceBack.add(backDisk);

const logoB = new THREE.Mesh(new THREE.CircleGeometry(CR * 0.93, 128), matLogo.clone());
logoB.position.z = -0.003;
logoB.rotation.y = Math.PI;
faceBack.add(logoB);

[0.33, 0.50, 0.67, 0.84].forEach(f => {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(CR * f, 0.004, 8, 128), mkMat('#c9a84c', 1, 0.12));
  ring.position.z = -0.003;
  faceBack.add(ring);
});

/* ─────────────────────────────────────────────────────────────
   5. SWISS WATCH MECHANISM
   ───────────────────────────────────────────────────────────── */
const mechGroup = new THREE.Group();
mechGroup.scale.setScalar(0);
coinGroup.add(mechGroup);

/* Plate */
mechGroup.add(new THREE.Mesh(new THREE.CircleGeometry(CR * 0.93, 128), matPlate));

/* Pillar pins */
for (let i = 0; i < 6; i++) {
  const a   = (i / 6) * Math.PI * 2;
  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, CT * 0.75, 10),
    mkMat('#c9a84c', 1, 0.12)
  );
  pin.position.set(Math.cos(a) * CR * 0.68, Math.sin(a) * CR * 0.68, 0);
  pin.rotation.x = Math.PI / 2;
  mechGroup.add(pin);
}

/* Gear tooth profile builder */
function buildGear(teeth, ri, ro, depth) {
  const shape = new THREE.Shape();
  const step  = (Math.PI * 2) / teeth;

  shape.moveTo(ri * Math.cos(-step * 0.26), ri * Math.sin(-step * 0.26));

  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    shape.lineTo(ro * Math.cos(a - step * 0.16), ro * Math.sin(a - step * 0.16));
    shape.lineTo(ro * Math.cos(a + step * 0.16), ro * Math.sin(a + step * 0.16));
    shape.lineTo(ri * Math.cos(a + step * 0.26), ri * Math.sin(a + step * 0.26));
    shape.lineTo(
      ri * Math.cos((i + 1) * step - step * 0.26),
      ri * Math.sin((i + 1) * step - step * 0.26)
    );
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, ri * 0.28, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.center();
  return geo;
}

/* [teeth, ri, ro, depth, color, roughness, x, y, dir, speed] */
const GEAR_DEF = [
  [24, 0.46, 0.62, 0.072, '#c9a84c', 0.09,  0.00,  0.00,  1, 0.30],
  [15, 0.29, 0.38, 0.062, '#b58c22', 0.14,  0.86,  0.24, -1, 0.48],
  [10, 0.19, 0.26, 0.056, '#c9a84c', 0.09, -0.66, -0.52,  1, 0.72],
  [ 8, 0.15, 0.21, 0.050, '#e0c060', 0.07, -0.50,  0.66, -1, 0.90],
  [ 6, 0.12, 0.16, 0.044, '#b58c22', 0.15,  0.58, -0.64,  1, 1.20],
  [12, 0.23, 0.31, 0.056, '#d4a830', 0.11, -0.18,  0.82, -1, 0.55],
];

const gearMeshes = GEAR_DEF.map(([t, ri, ro, dep, col, rou, x, y, dir, spd]) => {
  const m = new THREE.Mesh(buildGear(t, ri, ro, dep), mkMat(col, 1.0, rou));
  m.position.set(x, y, 0.01);
  m.userData = { dir, spd, ox: x, oy: y };
  mechGroup.add(m);

  /* Hub cylinder */
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(ri * 0.32, ri * 0.32, dep * 1.1, 14),
    mkMat('#c9a84c', 1, 0.12)
  );
  hub.rotation.x = Math.PI / 2;
  m.add(hub);

  return m;
});

/* ─────────────────────────────────────────────────────────────
   6. STUDIO LIGHTING
   ───────────────────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.07));

const keyLight = new THREE.DirectionalLight(0xfffbf0, 4.5);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xc9a84c, 7.0, 22);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0x7aadff, 0.85);
fillLight.position.set(-4, 0, 2);
scene.add(fillLight);

const bottomLight = new THREE.PointLight(0xffd060, 2.2, 12);
bottomLight.position.set(0, -3.5, 2);
scene.add(bottomLight);

scene.add(Object.assign(new THREE.DirectionalLight(0xffffff, 0.45), {
  position: new THREE.Vector3(0, 0, -6),
}));

/* ─────────────────────────────────────────────────────────────
   7. SCROLL STATE
   ───────────────────────────────────────────────────────────── */
let scrollProg = 0;

ScrollTrigger.create({
  trigger:  '.hero',
  start:    'top top',
  end:      'bottom bottom',   // 500vh of hero
  scrub:    2,
  onUpdate: self => { scrollProg = self.progress; },
});

/* ─────────────────────────────────────────────────────────────
   8. SECTION ENTRANCE ANIMATIONS
   ───────────────────────────────────────────────────────────── */

/* Hero text */
gsap.timeline({ delay: 0.5 })
  .to('.eyebrow',      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
  .to('.headline',     { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, '-=0.45')
  .to('.hero-sub',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
  .to('.scroll-hint',  { opacity: 1,        duration: 0.7, ease: 'power2.out' }, '-=0.3');

/* Services rows */
document.querySelectorAll('.service-row').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0,
    duration: 1.1,
    delay: i * 0.16,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' },
  });
});

/* Mission / Vision headings & text */
document.querySelectorAll('.mv-col h2, .mv-col p').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0,
    duration: 1.2,
    delay: i * 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.vision', start: 'top 75%', toggleActions: 'play none none none' },
  });
});

/* Contact headline */
gsap.to('.contact-h2', {
  opacity: 1, y: 0,
  duration: 1.3,
  ease: 'power3.out',
  scrollTrigger: { trigger: '.contacto', start: 'top 75%', toggleActions: 'play none none none' },
});

/* ─────────────────────────────────────────────────────────────
   9. SMOOTH STEP HELPERS
   ───────────────────────────────────────────────────────────── */
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function ss(t)      { const c = clamp01(t); return c * c * (3 - 2 * c); } // smoothstep
function lerp(a, b, t) { return a + (b - a) * t; }

/* ─────────────────────────────────────────────────────────────
   10. COIN SCENE UPDATE  (called every frame)
   ───────────────────────────────────────────────────────────── */
let lerpRotX = 0;
let elapsed  = 0;
let rimAngle = 0;

function updateScene(prog, dt) {
  /* Phase 0→1 values */
  const e2 = ss(clamp01((prog - 0.20) / 0.35)); // decouple  20–55%
  const e3 = ss(clamp01((prog - 0.55) / 0.25)); // expand    55–80%
  const e4 = ss(clamp01((prog - 0.80) / 0.20)); // recede    80–100%

  /* ── Scale & depth recession */
  const sc = 1 - e4 * 0.52;
  coinGroup.scale.setScalar(sc);
  coinGroup.position.z = -e4 * 2.6;

  /* ── Tilt on decouple */
  lerpRotX = lerp(lerpRotX, e2 * 0.48, 0.06);
  coinGroup.rotation.x = lerpRotX;

  /* ── Spin (slows with scroll) */
  const ySpd = (0.34 - prog * 0.22) * dt;
  coinGroup.rotation.y += ySpd;

  /* ── Vertical float */
  coinGroup.position.y = Math.sin(elapsed * 1.1) * 0.07 * (1 - e4);
  coinGroup.position.x = 0;

  /* ── Face separation */
  const sep = e2 * 1.35;
  faceFront.position.z =  HT + sep;
  faceBack.position.z  = -(HT + sep);

  /* Hide rim while opening */
  rimMesh.visible = e2 < 0.96;

  /* ── Mechanism reveal */
  mechGroup.scale.setScalar(e2);

  /* ── Gear expansion in e3 */
  gearMeshes.forEach(g => {
    const boost = (Math.abs(g.userData.ox) + Math.abs(g.userData.oy)) * 1.8;
    g.position.x = g.userData.ox * (1 + e3 * boost);
    g.position.y = g.userData.oy * (1 + e3 * boost);
  });
}

/* ─────────────────────────────────────────────────────────────
   11. RENDER LOOP
   ───────────────────────────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  /* Orbiting golden rim light */
  rimAngle += dt * 0.52;
  rimLight.position.set(
    Math.cos(rimAngle) * 4.0,
    Math.sin(rimAngle * 0.65) * 2.2,
    2.4 + Math.sin(rimAngle * 0.38) * 0.9
  );

  /* Gear self-rotation */
  gearMeshes.forEach(g => {
    g.rotation.z += g.userData.dir * g.userData.spd * dt;
  });

  updateScene(scrollProg, dt);
  renderer.render(scene, camera);
}

animate();

/* ─────────────────────────────────────────────────────────────
   12. RESIZE
   ───────────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  setCameraZ();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ScrollTrigger.refresh();
});
