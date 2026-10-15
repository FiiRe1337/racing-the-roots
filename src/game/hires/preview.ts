import * as THREE from "three";
import { makeR34, makeDiabloVT, type PaintOpts } from "./cars";

export function createHiresPreview(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
  camera.position.set(4.5, 1.8, 6);

  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);
  const key = new THREE.DirectionalLight(0xfff5e0, 1.4);
  key.position.set(5, 8, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88aacc, 0.4);
  fill.position.set(-4, 3, -2);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(8, 32),
    new THREE.MeshStandardMaterial({ color: 0x151820, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  let current: THREE.Group | null = null;
  let mode: "r34" | "diablo" = "r34";
  let paint: PaintOpts = { body: "#c41822", accent: "#111111", interior: "#2a1810", rims: "#c0c0c0" };

  function show(which: "r34" | "diablo", p?: Partial<PaintOpts>) {
    if (current) scene.remove(current);
    paint = { ...paint, ...p };
    mode = which;
    current = which === "r34" ? makeR34(paint) : makeDiabloVT(paint);
    scene.add(current);
  }

  show("r34");

  let t = 0;
  function loop() {
    requestAnimationFrame(loop);
    t += 0.008;
    if (current) {
      current.rotation.y = t;
    }
    renderer.render(scene, camera);
  }
  loop();

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", resize);

  return {
    show,
    setColor(body: string) {
      show(mode, { body });
    },
    destroy() {
      window.removeEventListener("resize", resize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
