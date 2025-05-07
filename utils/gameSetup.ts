import * as THREE from 'three';
import { generateTerrain, addEquirectangularSkybox } from '@/utils/terrainUtils';


export function initGame(
  sceneroot: THREE.Scene,
  worldSeed: string,
  renderer: THREE.WebGLRenderer,
) {
  const scene = new THREE.Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(50, 50, 50);

  scene.add(ambientLight, directionalLight);

  generateTerrain(scene, worldSeed);
  addEquirectangularSkybox(scene);
  sceneroot.add(scene);

}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function handleKeyDown(event: KeyboardEvent, moveState: { forward: boolean; backward: boolean; left: boolean; right: boolean }) {
  switch (event.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.backward = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
  }
}

export function handleKeyUp(event: KeyboardEvent, moveState: { forward: boolean; backward: boolean; left: boolean; right: boolean }) {
  switch (event.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.backward = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
  }
}

export function handleMouseMove(event: MouseEvent, camera: THREE.PerspectiveCamera, isPointerLocked: boolean, rotation: { x: number; y: number }) {
  if (!isPointerLocked) return;

  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;

  rotation.y -= movementX * 0.002;
  rotation.x -= movementY * 0.002;

  rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));

  camera.rotation.order = 'YXZ';
  camera.rotation.y = rotation.y;
  camera.rotation.x = rotation.x;
}

export function setupPointerLock(gameCanvas: Ref<HTMLCanvasElement | null>) {
  gameCanvas.value?.requestPointerLock();
}

export function handlePointerLockChange(gameCanvas: Ref<HTMLCanvasElement | null>, isPointerLocked: Ref<boolean>) {
  isPointerLocked.value = document.pointerLockElement === gameCanvas.value;
}