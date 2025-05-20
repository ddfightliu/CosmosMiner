<template>
  <div>
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <GameHUD :inventory="inventory" :gameTime="gameTime" :worldSeed="worldSeed" :fps="fps" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive } from 'vue';
import { handleResize, handleKeyDown, handleKeyUp, handleMouseMove, setupPointerLock, handlePointerLockChange, setupMouseWheelZoom } from '@/utils/camraControlUtils';

import type { InventoryItem } from '@/types/InventoryItem';
import * as THREE from 'three';
import Stats from 'stats.js';
// Game state
let gameCanvas = ref<HTMLCanvasElement | null>(null);
let gameTime = ref(0);
let fps = ref(0);
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene = new THREE.Scene();

let worldSeed = Math.random().toString(36).substring(7);
worldSeed = 'worldSeed';
const inventory = reactive<InventoryItem[]>(Array(10).fill({ name: '', count: 0 }));
const moveState = reactive({ forward: false, backward: false, left: false, right: false });
const isPointerLocked = ref(false);
const rotation = reactive({ x: 0, y: 0 });


onMounted(() => {
  if (gameCanvas.value) {
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas.value, antialias: true });
    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // 初始化 stats.js
    const stats = new Stats();
    stats.showPanel(0); // 0: FPS, 1: ms, 2: memory
    document.body.appendChild(stats.dom);
    setScene(scene, worldSeed, renderer, (model) => {
      // 以model为中心，设置相机到model上方偏后的45度俯视角
      const distance = 50; // 距离可根据需要调整
      const angle = Math.PI / 4; // 45度
      // 计算相机位置
      const offsetX = distance * Math.sin(angle);
      const offsetY = distance;
      const offsetZ = distance * Math.cos(angle);
      camera.position.set(
        model.position.x + offsetX,
        model.position.y + offsetY,
        model.position.z + offsetZ
      );
      camera.lookAt(model.position);

      // 在动画循环中持续跟随model
      function animate() {
        stats.begin();
        // 跟随model移动
        camera.position.set(
          model.position.x + offsetX,
          model.position.y + offsetY,
          model.position.z + offsetZ
        );
        camera.lookAt(model.position);
        renderer.render(scene, camera);
        stats.end();
        requestAnimationFrame(animate);
      }
      animate();
    });
    setupMouseWheelZoom(camera);


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
  renderer.dispose();
  scene.clear();
  gameCanvas.value = null;
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