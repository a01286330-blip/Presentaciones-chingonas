'use strict';
gsap.registerPlugin(ScrollTrigger);

/* ── 1. RENDERER ── Three.js crea canvas → #canvas-container z-index:1 */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

/* ── 2. ESCENA + CÁMARA ── apunta directamente a (0,0,0) */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 6.8);
camera.lookAt(0, 0, 0);

/* ── 3. TEXTURA CANVAS PROCEDURAL */
function crearTextura() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const c = cv.getContext('2d'), cx = 256, cy = 256;
  c.fillStyle = '#070707';
  c.fillRect(0, 0, 512, 512);
  [[210, 0.80, 3], [170, 0.55, 1.8], [130, 0.35, 1.2], [90, 0.20, 0.8]].forEach(([r, a, w]) => {
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
    c.strokeStyle = `rgba(201,168,76,${a})`; c.lineWidth = w; c.stroke();
  });
  c.fillStyle = 'rgba(201,168,76,0.65)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    c.beginPath(); c.arc(cx + Math.cos(a) * 192, cy + Math.sin(a) * 192, i % 3 === 0 ? 4.5 : 2.5, 0, Math.PI * 2); c.fill();
  }
  const g = c.createRadialGradient(cx, cy - 30, 0, cx, cy, 180);
  g.addColorStop(0, 'rgba(255,220,140,1)'); g.addColorStop(1, 'rgba(160,118,28,.9)');
  c.fillStyle = g; c.font = 'bold 112px Georgia,serif';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText('GM', cx, cy + 46);
  c.fillStyle = 'rgba(201,168,76,.82)'; c.font = '600 23px Inter,Arial,sans-serif';
  c.letterSpacing = '6px'; c.fillText('GRUPOMAKA', cx, cy + 108);
  c.fillStyle = 'rgba(161,161,161,.6)'; c.font = '300 13px Inter,Arial,sans-serif';
  c.letterSpacing = '4px'; c.fillText('DIVISIÓN FINANCIERA', cx, cy + 136);
  return new THREE.CanvasTexture(cv);
}
const texLogo = crearTextura();

/* ── 4. MATERIALES */
const mOro  = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.06 });
const mOroI = new THREE.MeshStandardMaterial({ color: 0x9a7018, metalness: 1.0, roughness: 0.26 });
const mCara = new THREE.MeshStandardMaterial({ map: texLogo, metalness: 0.65, roughness: 0.26, color: 0xc9a84c });
const mInt  = new THREE.MeshStandardMaterial({ color: 0x060606, metalness: 0.85, roughness: 0.48 });
const mPlato= new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.70, roughness: 0.58, transparent: true, opacity: 0.95 });

/* ── 5. MONEDA — CylinderGeometry (dos mitades que se abren) */
const moneda = new THREE.Group();
scene.add(moneda);
const R = 1.5, HM = 0.10;

const mitadTop = new THREE.Mesh(
  new THREE.CylinderGeometry(R, R, HM * 2, 80, 1),
  [mOro, mCara, mInt]
);
mitadTop.position.y = HM;
moneda.add(mitadTop);

const mitadBot = new THREE.Mesh(
  new THREE.CylinderGeometry(R, R, HM * 2, 80, 1),
  [mOro.clone(), mInt.clone(), mCara.clone()]
);
mitadBot.position.y = -HM;
moneda.add(mitadBot);

const borde = new THREE.Mesh(new THREE.TorusGeometry(R, 0.018, 10, 80), mOroI.clone());
borde.rotation.x = Math.PI / 2;
moneda.add(borde);

/* ── 6. MECANISMO RELOJ SUIZO */
const mec = new THREE.Group();
mec.scale.setScalar(0);
moneda.add(mec);

mec.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.94, R * 0.94, 0.012, 64), mPlato));

for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 10), mOroI.clone());
  p.position.set(Math.cos(a) * R * 0.70, 0, Math.sin(a) * R * 0.70);
  mec.add(p);
}

function mkEng(tr, tube, segs, col, x, z, vel) {
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(col), metalness: 1, roughness: 0.09 });
  const eng = new THREE.Mesh(new THREE.TorusGeometry(tr, tube, 8, segs), mat);
  eng.rotation.x = Math.PI / 2;
  eng.position.set(x, 0, z);
  eng.userData = { vel, ox: x, oz: z };
  eng.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(tube * .55, tube * .55, .08, 12), mOro.clone()), {}));
  const nSpokes = Math.max(4, Math.round(segs / 5));
  for (let i = 0; i < nSpokes; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(tr * 1.7, .04, .04), mat.clone());
    sp.rotation.z = (i / nSpokes) * Math.PI * 2; eng.add(sp);
  }
  mec.add(eng); return eng;
}

const engranajes = [
  mkEng(0.90, 0.14, 30, '#c9a84c',  0.00,  0.00,  0.40),
  mkEng(0.52, 0.11, 22, '#b58c22',  1.12,  0.18, -0.76),
  mkEng(0.38, 0.09, 18, '#c9a84c', -0.88, -0.54,  1.10),
  mkEng(0.30, 0.08, 16, '#e2c060', -0.60,  0.78, -1.40),
  mkEng(0.24, 0.07, 14, '#b58c22',  0.76, -0.76,  1.85),
  mkEng(0.32, 0.08, 16, '#d4a830', -0.18,  0.95, -0.92),
  mkEng(0.20, 0.06, 12, '#c9a84c',  0.60,  0.60,  2.20),
];

/* ── 7. ILUMINACIÓN DE ESTUDIO (3 puntos + extras) */
scene.add(new THREE.AmbientLight(0xffffff, 0.50));

const lKey = new THREE.DirectionalLight(0xfffbf0, 5.5);
lKey.position.set(3.5, 5, 4);
scene.add(lKey);

/* PointLight dorada que sigue al mouse */
const lMouse = new THREE.PointLight(0xffd700, 9.0, 22);
lMouse.position.set(0, 0.5, 6);
scene.add(lMouse);

/* SpotLight rim — canto dorado de la moneda */
const lSpot = new THREE.SpotLight(0xc9a84c, 10.0, 26, Math.PI / 7, 0.38, 1);
lSpot.position.set(-4.5, 4, -3);
lSpot.target.position.set(0, 0, 0);
scene.add(lSpot);
scene.add(lSpot.target);

const lFill = new THREE.DirectionalLight(0x7ab0ff, 1.1);
lFill.position.set(-4, 1, 2);
scene.add(lFill);

const lBajo = new THREE.PointLight(0xffcc44, 2.8, 14);
lBajo.position.set(0, -3, 2);
scene.add(lBajo);

/* ── 8. MOUSE TRACKING */
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ── 9. SCROLL TRIGGER */
let scrollProg = 0;
ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 2,
  onUpdate: s => { scrollProg = s.progress; },
});

/* ── 10. ANIMACIONES GSAP DE SECCIONES */
gsap.timeline({ delay: 0.5 })
  .to('.eyebrow',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
  .to('.headline',    { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, '-=0.5')
  .to('.hero-sub',    { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
  .to('.scroll-hint', { opacity: 1,       duration: 0.7, ease: 'power2.out' }, '-=0.3');

document.querySelectorAll('.svc-row').forEach((el, i) => {
  gsap.to(el, { opacity: 1, y: 0, duration: 1.1, delay: i * 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' } });
});
document.querySelectorAll('.mv-col').forEach((el, i) => {
  gsap.from(el, { opacity: 0, y: 64, duration: 1.2, delay: i * 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.vision', start: 'top 75%', toggleActions: 'play none none none' } });
});
gsap.to('.contact-h2', { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out',
  scrollTrigger: { trigger: '.contacto', start: 'top 75%', toggleActions: 'play none none none' } });

/* ── 11. HELPERS */
const cl01 = v => Math.max(0, Math.min(1, v));
const ss   = t => { const c = cl01(t); return c * c * (3 - 2 * c); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ── 12. ACTUALIZAR MONEDA — la moneda se abre al 40 % del scroll */
let lerpTZ = 0, elapsed = 0;

function tick(p, dt) {
  /* Fases: 40-70 %→ apertura | 65-85 %→ expansión engranajes | 85-100 %→ recesión */
  const e2 = ss(cl01((p - 0.40) / 0.30));
  const e3 = ss(cl01((p - 0.65) / 0.20));
  const e4 = ss(cl01((p - 0.85) / 0.15));

  moneda.rotation.y += (0.36 - p * 0.22) * dt;
  moneda.position.y = Math.sin(elapsed * 1.1) * 0.065 * (1 - e4);
  moneda.scale.setScalar(1 - e4 * 0.50);
  moneda.position.z = -e4 * 2.2;

  lerpTZ = lerp(lerpTZ, e2 * 0.28, 0.055);
  moneda.rotation.z = lerpTZ;

  const sep = e2 * 1.45;
  mitadTop.position.y =  HM + sep;
  mitadBot.position.y = -(HM + sep);
  borde.visible = e2 < 0.92;

  mec.scale.setScalar(e2);

  engranajes.forEach(eng => {
    eng.rotation.y += eng.userData.vel * dt;
    const d = Math.hypot(eng.userData.ox, eng.userData.oz);
    eng.position.x = eng.userData.ox * (1 + e3 * d * 1.8);
    eng.position.z = eng.userData.oz * (1 + e3 * d * 1.8);
  });

  /* Mouse light sigue al cursor con suavizado */
  lMouse.position.x += (mouseX * 6.0 - lMouse.position.x) * 0.06;
  lMouse.position.y += (-mouseY * 4.0 + 0.5 - lMouse.position.y) * 0.06;
}

/* ── 13. BUCLE requestAnimationFrame */
const clock = new THREE.Clock();

function animar() {
  requestAnimationFrame(animar);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  tick(scrollProg, dt);
  renderer.render(scene, camera);
}
animar();

/* ── 14. RESIZE */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ScrollTrigger.refresh();
});
