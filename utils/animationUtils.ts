import * as THREE from 'three';
import type { Ref } from 'vue';

interface InventoryItem {
  name: string;
  count: number;
}

export function animate(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  gameTime: Ref<number>,
  fps: Ref<number>,
  inventory: InventoryItem[]
) {
  let lastFrameTime = performance.now();

  function calculateFPS() {
    const now = performance.now();
    fps.value = Math.round(1000 / (now - lastFrameTime));
    lastFrameTime = now;
  }

  function updateDayNightCycle() {
    gameTime.value = (gameTime.value + 1 / 60) % 24;
    const sunAngle = (gameTime.value / 24) * Math.PI * 2;

    const ambientIntensity = Math.sin(sunAngle) * 0.5 + 0.5;
    scene.children.forEach((child) => {
      if (child instanceof THREE.AmbientLight) {
        child.intensity = Math.max(0.1, ambientIntensity);
      }
    });

    const skyColor = new THREE.Color(0x87ceeb);
    skyColor.multiplyScalar(Math.max(0.1, ambientIntensity));
    scene.background = skyColor;
  }

  function updateHUD() {
    const fpsElement = document.querySelector('.fps');
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fps.value}`;
    }
  }

  function loop() {
    requestAnimationFrame(loop);
    calculateFPS();
    updateDayNightCycle();
    updateHUD();
    renderer.render(scene, camera);
  }

  loop();
}