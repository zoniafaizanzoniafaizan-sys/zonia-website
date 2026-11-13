import * as THREE from 'three';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 45, 180);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcceeff, 0x52633c, 2));

const sun = new THREE.DirectionalLight(0xfff1cf, 3);
sun.position.set(-30, 50, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x397b32, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const mountainMat = new THREE.MeshStandardMaterial({ color: 0x65756b, roughness: 1 });
for (let i = 0; i < 24; i++) {
  const h = 15 + Math.random() * 25;
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(12 + Math.random() * 12, h, 6),
    mountainMat
  );
  const a = i / 24 * Math.PI * 2;
  mountain.position.set(Math.cos(a) * 105, h / 2 - 2, Math.sin(a) * 105);
  mountain.castShadow = true;
  scene.add(mountain);
}

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x684326 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x205c27, roughness: 1 });

for (let i = 0; i < 100; i++) {
  const x = (Math.random() - 0.5) * 180;
  const z = (Math.random() - 0.5) * 180;
  if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3, 7), trunkMat);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.1, 5, 8), leafMat);
  leaves.position.y = 5;
  leaves.castShadow = true;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  scene.add(tree);
}

const player = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.55, 1.1, 5, 10),
  new THREE.MeshStandardMaterial({ color: 0x263cbb, roughness: 0.7 })
);
body.position.y = 1.25;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.42, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xe5b38b })
);
head.position.y = 2.35;
head.castShadow = true;
player.add(head);
scene.add(player);

const keys = {};
addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const controls = document.createElement('div');
controls.id = 'controls';
controls.innerHTML = `
<div id="joy"><div id="stick"></div></div>
<button id="jump">JUMP</button>
<div id="help">MOVE: joystick / WASD</div>`;
document.body.appendChild(controls);

let joyX = 0, joyY = 0, jumping = false, velocityY = 0;
const joy = document.getElementById('joy');
const stick = document.getElementById('stick');

joy.addEventListener('pointermove', e => {
  if (!e.buttons) return;
  const r = joy.getBoundingClientRect();
  joyX = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / 35, -1, 1);
  joyY = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / 35, -1, 1);
  stick.style.transform = `translate(${joyX * 28}px,${joyY * 28}px)`;
});
joy.addEventListener('pointerdown', e => joy.setPointerCapture(e.pointerId));
function stopJoy() {
  joyX = 0; joyY = 0;
  stick.style.transform = 'translate(0,0)';
}
joy.addEventListener('pointerup', stopJoy);
joy.addEventListener('pointercancel', stopJoy);

document.getElementById('jump').onclick = () => {
  if (player.position.y <= 0.01) velocityY = 8;
};

camera.position.set(0, 5, 9);

function animate() {
  requestAnimationFrame(animate);

  let x = joyX + (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  let z = joyY + (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
  const length = Math.hypot(x, z);
  if (length > 1) { x /= length; z /= length; }

  player.position.x += x * 0.13;
  player.position.z += z * 0.13;
  if (length > 0.05) player.rotation.y = Math.atan2(x, z);

  velocityY -= 0.22;
  player.position.y += velocityY * 0.016;
  if (player.position.y < 0) {
    player.position.y = 0;
    velocityY = 0;
  }

  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 4,
    player.position.z + 8
  );
  camera.position.lerp(target, 0.08);
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z);

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
