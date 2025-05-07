import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export function generateTerrain(scene: THREE.Scene, worldSeed: string) {
  const prng = alea(worldSeed);
  const noise2D = createNoise2D(prng);

  const geometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);
  const material = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true });

  const vertices = geometry.attributes.position.array;
  const colors = new Float32Array(vertices.length);

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / 100;
    const z = vertices[i + 2] / 100;

    const baseNoise = noise2D(x * 0.5, z * 0.5) * 20;
    const detailNoise = noise2D(x * 2, z * 2) * 5;
    const mountainNoise = Math.pow(Math.abs(noise2D(x * 0.2, z * 0.2)), 2) * 30;
    const riverNoise = Math.abs(noise2D(x * 0.3, z * 0.3));

    const temperature = (noise2D(x * 0.2 + 1000, z * 0.2 + 1000) + 1) * 0.5;
    const moisture = (noise2D(x * 0.2 + 2000, z * 0.2 + 2000) + 1) * 0.5;

    let height = baseNoise + detailNoise + mountainNoise;

    if (riverNoise < 0.1 && height > -5) {
      height = Math.min(height, -3);
    }

    vertices[i + 1] = height;

    const color = new THREE.Color(0x90ee90);
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;

  scene.add(terrain);
}

export function addEquirectangularSkybox(scene: THREE.Scene) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/public/skybox/earth_atmos_2048.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
  });

  const geometry = new THREE.SphereGeometry(500, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
  const skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);
}

export function setupMouseWheelZoom(camera: THREE.PerspectiveCamera) {
  window.addEventListener('wheel', (event) => {
    const zoomFactor = 0.1;
    if (event.deltaY < 0) {
      camera.position.z -= zoomFactor;
    } else {
      camera.position.z += zoomFactor;
    }
    camera.position.z = Math.max(1, Math.min(100, camera.position.z));
  });
}