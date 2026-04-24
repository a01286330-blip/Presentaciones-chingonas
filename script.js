/* ============================================================
   GRUPOMAKA Financial Division — script.js
   Three.js  ·  GSAP + ScrollTrigger + ScrollSmoother
   Zenith X motion logic
   ============================================================ */

'use strict';

/* ── 0. REGISTER GSAP PLUGINS ─────────────────────────────── */
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/* ── 1. SMOOTH SCROLLER ───────────────────────────────────── */
let smoother;
try {
  smoother = ScrollSmoother.create({
    wrapper:  '#smooth-wrapper',
    content:  '#smooth-content',
    smooth:   1.8,
    effects:  true,
    smoothTouch: 0.1,
  });
} catch (e) {
  // ScrollSmoother unavailable — fall back to native scroll
  document.documentElement.style.scrollBehavior = 'smooth';
}

/* ── 2. THREE.JS RENDERER & SCENE ─────────────────────────── */
const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 6.5);

/* ── 3. COIN CONSTANTS ────────────────────────────────────── */
const CR = 1.5;   // coin radius
const CT = 0.18;  // coin thickness
const HT = CT / 2;

/* ── 4. MATERIALS ─────────────────────────────────────────── */
const matGold = new THREE.MeshStandardMaterial({
  color:            new THREE.Color('#c9a84c'),
  metalness:        1.0,
  roughness:        0.1,
  envMapIntensity:  2.5,
});

const matGoldDeep = new THREE.MeshStandardMaterial({
  color:            new THREE.Color('#7a5c0e'),
  metalness:        1.0,
  roughness:        0.25,
  envMapIntensity:  1.5,
});

const matTitanium = new THREE.MeshStandardMaterial({
  color:            new THREE.Color('#080808'),
  metalness:        0.85,
  roughness:        0.45,
  envMapIntensity:  0.6,
  side:             THREE.DoubleSide,
});

const matGear = (hex, r = 0.12) => new THREE.MeshStandardMaterial({
  color:           new THREE.Color(hex),
  metalness:       1.0,
  roughness:       r,
  envMapIntensity: 2.0,
});

/* ── 5. COIN GROUP ────────────────────────────────────────── */
const coinGroup = new THREE.Group();
scene.add(coinGroup);

/* RIM */
const rimGeo = new THREE.CylinderGeometry(CR, CR, CT, 160, 1, true);
const rim    = new THREE.Mesh(rimGeo, matGold);
rim.rotation.x = Math.PI / 2;
coinGroup.add(rim);

/* Knurling stripe ring (subtle) */
for (let i = 0; i < 80; i++) {
  const a   = (i / 80) * Math.PI * 2;
  const geo = new THREE.BoxGeometry(0.005, CT * 1.015, 0.012);
  const m   = new THREE.Mesh(geo, matGoldDeep);
  m.position.set(Math.cos(a) * CR, Math.sin(a) * CR, 0);
  m.rotation.z = a;
  rim.add(m);
}

/* FRONT FACE GROUP */
const faceFront = new THREE.Group();
faceFront.position.z = HT;
coinGroup.add(faceFront);

const frontDisk = new THREE.Mesh(
  new THREE.CircleGeometry(CR - 0.015, 128),
  matTitanium
);
faceFront.add(frontDisk);

/* BACK FACE GROUP */
const faceBack = new THREE.Group();
faceBack.position.z = -HT;
coinGroup.add(faceBack);

const backDisk = new THREE.Mesh(
  new THREE.CircleGeometry(CR - 0.015, 128),
  matTitanium.clone()
);
backDisk.rotation.y = Math.PI;
faceBack.add(backDisk);

/* Decorative concentric rings on both faces */
[0.38, 0.55, 0.72, 0.88].forEach(frac => {
  const r    = CR * frac;
  const tGeo = new THREE.TorusGeometry(r, 0.005, 8, 160);
  const tf   = new THREE.Mesh(tGeo, matGold);
  tf.position.z = 0.002;
  faceFront.add(tf);

  const tb = new THREE.Mesh(tGeo.clone(), matGold.clone());
  tb.position.z = -0.002;
  faceBack.add(tb);
});

/* Logo texture — gold engraving on both faces */
const tLoader = new THREE.TextureLoader();
tLoader.load('logo.png', tex => {
  tex.needsUpdate = true;

  const logoMat = new THREE.MeshStandardMaterial({
    map:              tex,
    alphaMap:         tex,
    transparent:      true,
    metalness:        0.95,
    roughness:        0.1,
    color:            new THREE.Color('#d4a830'),
    envMapIntensity:  2.0,
  });

  const lGeo = new THREE.CircleGeometry(CR * 0.58, 128);

  const logoF = new THREE.Mesh(lGeo, logoMat);
  logoF.position.z = 0.003;
  faceFront.add(logoF);

  const logoB = new THREE.Mesh(lGeo.clone(), logoMat.clone());
  logoB.position.z = -0.003;
  logoB.rotation.y = Math.PI;
  faceBack.add(logoB);
});

/* ── 6. SWISS WATCH MECHANISM ─────────────────────────────── */
const mechGroup = new THREE.Group();
mechGroup.scale.setScalar(0);
coinGroup.add(mechGroup);

/* Plate */
const plateMesh = new THREE.Mesh(
  new THREE.CircleGeometry(CR * 0.92, 128),
  new THREE.MeshStandardMaterial({
    color:       new THREE.Color('#060606'),
    metalness:   0.7,
    roughness:   0.55,
    transparent: true,
    opacity:     0.92,
  })
);
plateMesh.position.z = -0.05;
mechGroup.add(plateMesh);

/* Pillar pins */
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.055, 10),
    matGold.clone()
  );
  pin.position.set(Math.cos(a) * CR * 0.66, Math.sin(a) * CR * 0.66, 0);
  pin.rotation.x = Math.PI / 2;
  mechGroup.add(pin);
}

/* Gear builder */
function buildGear(teeth, innerR, outerR, depth) {
  const shape   = new THREE.Shape();
  const step    = (Math.PI * 2) / teeth;

  shape.moveTo(innerR * Math.cos(-step * 0.22), innerR * Math.sin(-step * 0.22));

  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    shape.lineTo(outerR * Math.cos(a - step * 0.18), outerR * Math.sin(a - step * 0.18));
    shape.lineTo(outerR * Math.cos(a + step * 0.18), outerR * Math.sin(a + step * 0.18));
    shape.lineTo(innerR * Math.cos(a + step * 0.38), innerR * Math.sin(a + step * 0.38));
    shape.lineTo(innerR * Math.cos((i + 1) * step - step * 0.38), innerR * Math.sin((i + 1) * step - step * 0.38));
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerR * 0.28, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.center();
  return geo;
}

/* Gear data: [teeth, innerR, outerR, depth, color, roughness, x, y, rotSpeed] */
const gearData = [
  [24, 0.48, 0.64, 0.07, '#c9a84c', 0.10,  0.00,  0.00,  0.30],
  [16, 0.30, 0.40, 0.06, '#b8922a', 0.14,  0.88,  0.25, -0.46],
  [10, 0.19, 0.27, 0.055,'#c9a84c', 0.10, -0.68, -0.52,  0.74],
  [ 8, 0.15, 0.21, 0.05, '#e0c060', 0.08, -0.52,  0.68, -0.92],
  [ 6, 0.11, 0.16, 0.05, '#b8922a', 0.16,  0.60, -0.65,  1.20],
  [12, 0.24, 0.32, 0.055,'#d4a830', 0.12, -0.18,  0.82, -0.55],
];

const gearMeshes = gearData.map(([teeth, ir, or_, dep, col, rou, x, y, spd]) => {
  const mesh = new THREE.Mesh(buildGear(teeth, ir, or_, dep), matGear(col, rou));
  mesh.position.set(x, y, 0.01);
  mesh.userData.rotSpeed   = spd;
  mesh.userData.originX    = x;
  mesh.userData.originY    = y;
  mechGroup.add(mesh);
  return mesh;
});

/* ── 7. STUDIO LIGHTING ───────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.08));

/* Key — warm top-right */
const keyLight = new THREE.DirectionalLight(0xfffbf0, 4.0);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

/* Moving golden rim light */
const rimLight = new THREE.PointLight(0xc9a84c, 6.0, 20);
rimLight.position.set(-3, 1.5, 2.5);
scene.add(rimLight);

/* Fill — cool left */
const fillLight = new THREE.DirectionalLight(0x7aa8ff, 0.9);
fillLight.position.set(-4.5, 0, 2);
scene.add(fillLight);

/* Bottom rim accent */
const bottomLight = new THREE.PointLight(0xffd060, 2.2, 10);
bottomLight.position.set(0, -3.5, 2);
scene.add(bottomLight);

/* Backlight for silhouette */
const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(0, 0, -6);
scene.add(backLight);

/* Secondary gold bounce */
const bounceLight = new THREE.PointLight(0xc9a84c, 1.5, 12);
bounceLight.position.set(2, -2, 3);
scene.add(bounceLight);

/* ── 8. SCROLL STATE ──────────────────────────────────────── */
let scrollProg = 0;

ScrollTrigger.create({
  trigger:  '#hero',
  start:    'top top',
  end:      () => `+=${document.getElementById('scroll-spacer').offsetHeight + window.innerHeight}`,
  scrub:    true,
  onUpdate: self => { scrollProg = self.progress; },
});

/* ── 9. SECTION ANIMATIONS ────────────────────────────────── */

/* Hero entrance */
const heroTL = gsap.timeline({ delay: 0.6 });
heroTL
  .to('.eyebrow',         { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
  .to('.headline',        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, '-=0.4')
  .to('.hero-sub',        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
  .to('.hero-scroll-hint',{ opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.2');

/* Services stagger */
document.querySelectorAll('.service-item').forEach((el, i) => {
  gsap.to(el, {
    opacity:   1,
    y:         0,
    duration:  1.1,
    delay:     i * 0.18,
    ease:      'power3.out',
    scrollTrigger: {
      trigger:       el,
      start:         'top 82%',
      toggleActions: 'play none none none',
    },
  });
});

/* Mission columns */
gsap.utils.toArray('.mission-col').forEach((el, i) => {
  gsap.from(el, {
    y:         80,
    opacity:   0,
    duration:  1.3,
    delay:     i * 0.22,
    ease:      'power3.out',
    scrollTrigger: {
      trigger:       '.mission',
      start:         'top 75%',
      toggleActions: 'play none none none',
    },
  });
});

/* Contact headline */
gsap.from('.contact-headline', {
  y:         80,
  opacity:   0,
  duration:  1.3,
  ease:      'power3.out',
  scrollTrigger: {
    trigger:       '.contact',
    start:         'top 75%',
    toggleActions: 'play none none none',
  },
});

/* ── 10. ANIMATION LOOP ───────────────────────────────────── */
const clock = new THREE.Clock();
let rimAngle = 0;

/* Lerp helpers */
let lerpRotX = 0;

function lerp(a, b, t) { return a + (b - a) * t; }

function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function updateScene(t, dt) {
  /* Phase extents */
  const p1 = Math.min(t / 0.20, 1);              // 0–20 %  : intro float
  const p2 = Math.max(0, Math.min((t - 0.20) / 0.30, 1)); // 20–50 % : decouple
  const p3 = Math.max(0, Math.min((t - 0.50) / 0.30, 1)); // 50–80 % : expand
  const p4 = Math.max(0, Math.min((t - 0.80) / 0.20, 1)); // 80–100%: recede

  const e2 = easeInOut(p2);
  const e4 = easeInOut(p4);

  /* ─ Coin scale & depth ─ */
  const sc = 1 - e4 * 0.52;
  coinGroup.scale.setScalar(sc);
  coinGroup.position.z = -e4 * 2.5;

  /* ─ Tilt ─ */
  const targetRotX = e2 * 0.45;
  lerpRotX = lerp(lerpRotX, targetRotX, 0.06);
  coinGroup.rotation.x = lerpRotX;

  /* ─ Face separation ─ */
  const sep = e2 * 1.3;
  faceFront.position.z = HT + sep;
  faceBack.position.z  = -(HT + sep);

  /* Fade rim as faces separate */
  matGold.opacity     = 1;
  matGold.transparent = false;
  rim.visible         = p2 < 0.95;

  /* ─ Mechanism reveal ─ */
  const ms = e2;
  mechGroup.scale.setScalar(ms);

  /* ─ Gear expansion in p3 ─ */
  const e3 = easeInOut(p3);
  gearMeshes.forEach(g => {
    const ox = g.userData.originX;
    const oy = g.userData.originY;
    const boost = (Math.abs(ox) + Math.abs(oy)) * 1.6;
    g.position.x = ox * (1 + e3 * boost);
    g.position.y = oy * (1 + e3 * boost);
  });

  /* ─ Continuous Y rotation (slows with scroll) ─ */
  const ySpeed = 0.32 - t * 0.22;
  coinGroup.rotation.y += ySpeed * dt;

  /* ─ Gentle float ─ */
  const elapsed = clock.elapsedTime;
  const floatAmp = 0.07 * (1 - e4);
  coinGroup.position.y = Math.sin(elapsed * 1.15) * floatAmp;
  coinGroup.position.x = 0;
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  /* Moving rim light orbit */
  rimAngle += dt * 0.55;
  rimLight.position.set(
    Math.cos(rimAngle) * 3.8,
    Math.sin(rimAngle * 0.6) * 2.0,
    2.2 + Math.sin(rimAngle * 0.4) * 0.8
  );

  /* Gear self-rotation */
  gearMeshes.forEach(g => {
    g.rotation.z += g.userData.rotSpeed * dt;
  });

  updateScene(scrollProg, dt);
  renderer.render(scene, camera);
}

animate();

/* ── 11. RESIZE HANDLER ───────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ScrollTrigger.refresh();
});
