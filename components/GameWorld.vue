<template>
  <div>
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <div class="hud">
      <div class="crosshair">+</div>
      <div class="inventory">
        <div v-for="(item, index) in inventory" :key="index" class="inventory-slot">
          {{ item.count > 0 ? `${item.name} (${item.count})` : '' }}
        </div>
      </div>
      <div class="time">{{ formatGameTime(gameTime) }}</div>
      <div class="seed-info">Seed: {{ worldSeed }}</div>
      <div class="fps">FPS: {{ fps }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { onMounted, onBeforeUnmount, ref, reactive } from 'vue';
import alea from 'alea';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Game state
const gameCanvas = ref<HTMLCanvasElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let terrain: THREE.Mesh;
let isPointerLocked = false;
let gameTime = ref(0);
const DAY_LENGTH = 1200;

// FPS calculation
let fps = ref(0);
let lastFrameTime = performance.now();
function calculateFPS() {
  const now = performance.now();
  fps.value = Math.round(1000 / (now - lastFrameTime));
  lastFrameTime = now;
}

// Update the HUD to display FPS
function updateHUD() {
  const fpsElement = document.querySelector('.fps');
  if (fpsElement) {
    fpsElement.textContent = `FPS: ${fps.value}`;
  }
}

// World generation
const worldSeed = Math.random().toString(36).substring(7);
const prng = alea(worldSeed);
const noise2D = createNoise2D(prng);

// Resource system
interface Resource {
  position: THREE.Vector3;
  type: string;
  mesh: THREE.Mesh;
  respawnTime?: number;
}

interface InventoryItem {
  name: string;
  count: number;
}

const resources: Resource[] = [];
const inventory = reactive<InventoryItem[]>(Array(10).fill({ name: '', count: 0 }));

// Player movement state
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  speed: 0.1
};

// Camera rotation
let rotationX = 0;
let rotationY = 0;

// Enhanced biome definitions
const BIOMES = {
  DEEP_OCEAN: { color: 0x000066, height: -10, temperature: 0.5, moisture: 1.0 },
  OCEAN: { color: 0x0077be, height: -5, temperature: 0.5, moisture: 0.8 },
  BEACH: { color: 0xffd700, height: -2, temperature: 0.7, moisture: 0.3 },
  PLAINS: { color: 0x90ee90, height: 0, temperature: 0.5, moisture: 0.4 },
  FOREST: { color: 0x228b22, height: 2, temperature: 0.5, moisture: 0.6 },
  RAINFOREST: { color: 0x004d00, height: 3, temperature: 0.8, moisture: 0.9 },
  MOUNTAINS: { color: 0x808080, height: 8, temperature: 0.3, moisture: 0.5 },
  SNOW_PEAKS: { color: 0xfffafa, height: 12, temperature: 0.1, moisture: 0.4 },
  DESERT: { color: 0xf4a460, height: 0, temperature: 0.9, moisture: 0.1 },
  TUNDRA: { color: 0xc9c9c9, height: 1, temperature: 0.1, moisture: 0.3 },
  SAVANNA: { color: 0xd2b48c, height: 1, temperature: 0.8, moisture: 0.3 }
};

// Enhanced resource types
const RESOURCES = {
  TREE: {
    geometry: new THREE.CylinderGeometry(0.5, 1, 5),
    material: new THREE.MeshPhongMaterial({ color: 0x3d2817 }),
    respawnTime: 300,
    biomes: ['FOREST', 'RAINFOREST', 'PLAINS']
  },
  STONE: {
    geometry: new THREE.DodecahedronGeometry(1),
    material: new THREE.MeshPhongMaterial({ color: 0x808080 }),
    respawnTime: 600,
    biomes: ['MOUNTAINS', 'SNOW_PEAKS']
  },
  BERRY: {
    geometry: new THREE.SphereGeometry(0.3),
    material: new THREE.MeshPhongMaterial({ color: 0xff0000 }),
    respawnTime: 120,
    biomes: ['PLAINS', 'FOREST']
  },
  CACTUS: {
    geometry: new THREE.CylinderGeometry(0.3, 0.3, 3),
    material: new THREE.MeshPhongMaterial({ color: 0x2e8b57 }),
    respawnTime: 400,
    biomes: ['DESERT']
  },
  IRON_ORE: {
    geometry: new THREE.DodecahedronGeometry(0.8),
    material: new THREE.MeshPhongMaterial({ color: 0x8b4513 }),
    respawnTime: 900,
    biomes: ['MOUNTAINS']
  },
  GOLD_ORE: {
    geometry: new THREE.DodecahedronGeometry(0.6),
    material: new THREE.MeshPhongMaterial({ color: 0xffd700 }),
    respawnTime: 1200,
    biomes: ['MOUNTAINS']
  }
};

// Get biome based on height, temperature and moisture
function getBiome(height: number, temperature: number, moisture: number): typeof BIOMES[keyof typeof BIOMES] {
  if (height < BIOMES.DEEP_OCEAN.height) return BIOMES.DEEP_OCEAN;
  if (height < BIOMES.OCEAN.height) return BIOMES.OCEAN;
  if (height < BIOMES.BEACH.height) return BIOMES.BEACH;

  if (temperature > 0.8) {
    if (moisture > 0.7) return BIOMES.RAINFOREST;
    if (moisture > 0.3) return BIOMES.SAVANNA;
    return BIOMES.DESERT;
  } else if (temperature < 0.2) {
    return height > BIOMES.SNOW_PEAKS.height ? BIOMES.SNOW_PEAKS : BIOMES.TUNDRA;
  } else {
    if (height > BIOMES.MOUNTAINS.height) return BIOMES.MOUNTAINS;
    if (moisture > 0.6) return BIOMES.FOREST;
    return BIOMES.PLAINS;
  }
}

function getBiomeName(biome: typeof BIOMES[keyof typeof BIOMES]): string {
  return Object.entries(BIOMES).find(([_, value]) => value === biome)?.[0] || '';
}

// Format game time as HH:MM
function formatGameTime(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.floor((time % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Generate resources based on biome
function generateResources(biome: typeof BIOMES[keyof typeof BIOMES], position: THREE.Vector3) {
  const biomeName = getBiomeName(biome);
  const resourceNoise = noise2D(position.x * 0.1, position.z * 0.1);

  if (resourceNoise > 0.7) {
    const availableResources = Object.entries(RESOURCES).filter(([_, resource]) =>
      resource.biomes.includes(biomeName)
    );

    if (availableResources.length > 0) {
      const resourceIndex = Math.floor(prng() * availableResources.length);
      const [resourceType, resource] = availableResources[resourceIndex];

      const mesh = new THREE.Mesh(resource.geometry, resource.material);
      mesh.position.copy(position);
      scene.add(mesh);
      resources.push({
        position: position.clone(),
        type: resourceType,
        mesh,
        respawnTime: resource.respawnTime
      });
    }
  }
}

// Modify terrain generation to include smoother transitions and more realistic features
function generateTerrain() {
  const geometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);
  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    flatShading: true
  });

  const vertices = geometry.attributes.position.array;
  const colors = new Float32Array(vertices.length);

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / 100;
    const z = vertices[i + 2] / 100;

    // Combine multiple noise layers for smoother transitions
    const baseNoise = noise2D(x * 0.5, z * 0.5) * 20;
    const detailNoise = noise2D(x * 2, z * 2) * 5;
    const mountainNoise = Math.pow(Math.abs(noise2D(x * 0.2, z * 0.2)), 2) * 30;
    const riverNoise = Math.abs(noise2D(x * 0.3, z * 0.3));

    // Climate variables
    const temperature = (noise2D(x * 0.2 + 1000, z * 0.2 + 1000) + 1) * 0.5;
    const moisture = (noise2D(x * 0.2 + 2000, z * 0.2 + 2000) + 1) * 0.5;

    // Calculate final height with smoother transitions
    let height = baseNoise + detailNoise + mountainNoise;

    // Add river system with smoother integration
    if (riverNoise < 0.1 && height > BIOMES.OCEAN.height) {
      height = Math.min(height, BIOMES.OCEAN.height + 2);
    }

    vertices[i + 1] = height;

    // Determine biome and color
    const biome = getBiome(height, temperature, moisture);
    const color = new THREE.Color(biome.color);

    // Add height-based color variation
    const heightFactor = Math.min(Math.max((height + 10) / 30, 0), 1);
    color.lerp(new THREE.Color(0xffffff), heightFactor * 0.3);

    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;

    // Generate resources
    if (i % 90 === 0) {
      generateResources(biome, new THREE.Vector3(vertices[i], height, vertices[i + 2]));
    }
  }

  geometry.computeVertexNormals();
  terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;
  
  const wireframe = new THREE.WireframeGeometry(terrain.geometry);
  const line= new THREE.LineSegments(wireframe)
  scene.add(line);
  scene.add(terrain);
}

// Add a wireframe grid to the terrain for debugging
function addTerrainGrid() {
  if (terrain) {
    const wireframe = new THREE.WireframeGeometry(terrain.geometry);
    const line = new THREE.LineSegments(wireframe);
    scene.add(line);
  }
}

// Handle resource collection
function collectResource(resource: Resource) {
  const itemIndex = inventory.findIndex(item => item.count === 0 || item.name === resource.type);
  if (itemIndex !== -1) {
    inventory[itemIndex] = {
      name: resource.type,
      count: (inventory[itemIndex].count || 0) + 1
    };
    scene.remove(resource.mesh);
    setTimeout(() => {
      scene.add(resource.mesh);
    }, resource.respawnTime! * 1000);
  }
}

// Update day/night cycle
function updateDayNightCycle() {
  gameTime.value = (gameTime.value + 1 / 60) % 24;
  const sunAngle = (gameTime.value / 24) * Math.PI * 2;

  const ambientIntensity = Math.sin(sunAngle) * 0.5 + 0.5;
  scene.children.forEach(child => {
    if (child instanceof THREE.AmbientLight) {
      child.intensity = Math.max(0.1, ambientIntensity);
    }
  });

  const skyColor = new THREE.Color(0x87CEEB);
  skyColor.multiplyScalar(Math.max(0.1, ambientIntensity));
  scene.background = skyColor;

  updateSkybox();
}

// Update the skybox dynamically based on the time of day
function updateSkybox() {
  const hour = gameTime.value;

  let skyboxPath;
  if (hour >= 6 && hour < 12) {
    skyboxPath = '/public/skybox/morning/';
  } else if (hour >= 12 && hour < 18) {
    skyboxPath = '/public/skybox/afternoon/';
  } else if (hour >= 18 && hour < 21) {
    skyboxPath = '/public/skybox/evening/';
  } else {
    skyboxPath = '/public/skybox/night/';
  }

  const loader = new THREE.CubeTextureLoader();
}

// Handle keyboard input
function handleKeyDown(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.backward = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
    case 'KeyE': {
      const playerPosition = camera.position;
      resources.forEach(resource => {
        if (playerPosition.distanceTo(resource.position) < 3) {
          collectResource(resource);
        }
      });
      break;
    }
  }
}

function handleKeyUp(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.backward = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
  }
}

// Handle mouse movement for camera rotation
function handleMouseMove(event: MouseEvent) {
  if (!isPointerLocked) return;

  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;

  rotationY -= movementX * 0.002;
  rotationX -= movementY * 0.002;

  rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

  camera.rotation.order = 'YXZ';
  camera.rotation.y = rotationY;
  camera.rotation.x = rotationX;
}

// Handle pointer lock
function setupPointerLock() {
  gameCanvas.value?.requestPointerLock();
}

function handlePointerLockChange() {
  isPointerLocked = document.pointerLockElement === gameCanvas.value;
}

// Update player position based on input
function updatePlayerPosition() {
  const direction = new THREE.Vector3();
  const rotation = camera.rotation.clone();

  if (moveState.forward) direction.z -= 1;
  if (moveState.backward) direction.z += 1;
  if (moveState.left) direction.x -= 1;
  if (moveState.right) direction.x += 1;

  direction.normalize();
  direction.applyEuler(new THREE.Euler(0, rotation.y, 0));

  camera.position.add(direction.multiplyScalar(moveState.speed));
}

// 添加视锥体剔除逻辑
let frustum = new THREE.Frustum();
let cameraViewProjectionMatrix = new THREE.Matrix4();

function updateFrustum() {
  camera.updateMatrixWorld();
  cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
}

function cullObjects() {
  resources.forEach(resource => {
    if (!frustum.containsPoint(resource.position)) {
      resource.mesh.visible = false;
    } else {
      resource.mesh.visible = true;
    }
  });
}

// Add a spherical skybox using equirectangular projection
function addEquirectangularSkybox() {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/public/skybox/earth_atmos_2048.jpg',(texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping; // Set equirectangular projection
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
  });
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide
  });
  const skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);
  scene.background = texture;

}

// Add a wireframe grid to the skybox for debugging
function addSkyboxGrid() {
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const line = new THREE.LineSegments(wireframe);
  scene.add(line);
}

// Add coordinate axes to the scene
function addCoordinateAxes() {
  const axesHelper = new THREE.AxesHelper(50); // Length of axes
  scene.add(axesHelper);
}

// Add mouse wheel zoom functionality
function setupMouseWheelZoom() {
  window.addEventListener('wheel', (event) => {
    const zoomFactor = 0.1;
    if (event.deltaY < 0) {
      camera.position.z -= zoomFactor; // Zoom in
    } else {
      camera.position.z += zoomFactor; // Zoom out
    }
    camera.position.z = Math.max(1, Math.min(100, camera.position.z)); // Clamp zoom range
  });
}

// 修改动画循环以包含FPS计算和HUD更新
function animate() {
  requestAnimationFrame(animate);
  updatePlayerPosition();
  updateDayNightCycle();
  updateFrustum();
  cullObjects();
  calculateFPS();
  updateHUD();
  renderer.render(scene, camera);
}

// Ensure proper lighting and camera setup
function initGame() {
  if (!gameCanvas.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // Default sky color

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 50); // Adjusted camera position to ensure visibility

  renderer = new THREE.WebGLRenderer({
    canvas: gameCanvas.value,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased intensity
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased intensity
  directionalLight.position.set(50, 50, 50); // Adjusted position
  scene.add(directionalLight);

  generateTerrain();
  addEquirectangularSkybox();
  addSkyboxGrid();
  addCoordinateAxes();
  addTerrainGrid();
  setupMouseWheelZoom();
  animate();
}

// Handle window resize
function handleResize() {
  if (!gameCanvas.value) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

onMounted(() => {
  initGame();

  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('pointerlockchange', handlePointerLockChange);
  gameCanvas.value?.addEventListener('click', setupPointerLock);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('pointerlockchange', handlePointerLockChange);
  gameCanvas.value?.removeEventListener('click', setupPointerLock);
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

.hud {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: white;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  user-select: none;
}

.inventory {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.inventory-slot {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid white;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
}

.time {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  font-weight: bold;
}

.seed-info {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 16px;
}

.fps {
  position: absolute;
  top: 50px;
  left: 20px;
  font-size: 16px;
  font-weight: bold;
}
</style>