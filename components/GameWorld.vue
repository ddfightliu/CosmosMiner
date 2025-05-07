<template>
  <div>
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <GameHUD :inventory="inventory" :gameTime="gameTime" :worldSeed="worldSeed" :fps="fps" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive } from 'vue';
import { animate } from '@/utils/animationUtils';
import { initGame, handleResize, handleKeyDown, handleKeyUp, handleMouseMove, setupPointerLock, handlePointerLockChange } from '@/utils/gameSetup';
import { generateTerrain, addEquirectangularSkybox, setupMouseWheelZoom } from '@/utils/terrainUtils';
import type { InventoryItem } from '@/types/InventoryItem';
import * as THREE from 'three';

// Game state
let gameCanvas = ref<HTMLCanvasElement | null>(null);
let gameTime = ref(0);
let fps = ref(0);
const worldSeed = Math.random().toString(36).substring(7);
const inventory = reactive<InventoryItem[]>(Array(10).fill({ name: '', count: 0 }));

let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene = new THREE.Scene();
const moveState = reactive({ forward: false, backward: false, left: false, right: false });
const isPointerLocked = ref(false);
const rotation = reactive({ x: 0, y: 0 });

onMounted(() => {
  if (gameCanvas.value) {
    // console.log(window.innerWidth, window.innerHeight,window.devicePixelRatio);
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas.value, antialias: true });
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 50);
    initGame(scene, worldSeed, renderer);
    setupMouseWheelZoom(camera);
    animate(scene, camera, renderer, gameTime, fps, inventory);

  } else {
    console.error('gameCanvas is not available.');
  }

  window.addEventListener('resize', () => handleResize(camera, renderer));
  window.addEventListener('keydown', (event) => handleKeyDown(event, moveState));
  window.addEventListener('keyup', (event) => handleKeyUp(event, moveState));
  window.addEventListener('mousemove', (event) => handleMouseMove(event, camera, isPointerLocked.value, rotation));
  document.addEventListener('pointerlockchange', () => handlePointerLockChange(gameCanvas, isPointerLocked));
  gameCanvas.value?.addEventListener('click', () => setupPointerLock(gameCanvas));
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => handleResize(camera, renderer));
  window.removeEventListener('keydown', (event) => handleKeyDown(event, moveState));
  window.removeEventListener('keyup', (event) => handleKeyUp(event, moveState));
  window.removeEventListener('mousemove', (event) => handleMouseMove(event, camera, isPointerLocked.value, rotation));
  document.removeEventListener('pointerlockchange', () => handlePointerLockChange(gameCanvas, isPointerLocked));
  gameCanvas.value?.removeEventListener('click', () => setupPointerLock(gameCanvas));
});
</script>

<style scoped>
.game-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  outline: none;
}
</style>