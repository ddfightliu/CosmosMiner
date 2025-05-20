import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export function generateTerrain(scene: THREE.Scene, worldSeed: string) {
  const prng = alea(worldSeed);
  const noise2D = createNoise2D(prng);

  // Create a PlaneGeometry for the terrain
  const geometry = new THREE.PlaneGeometry(1000, 1000, 1000, 1000); // Increased resolution for smoother terrain
  geometry.rotateX(-Math.PI / 2); // Rotate the plane to be horizontal
  const material = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: false });

  const vertices = geometry.attributes.position.array; // Access the vertices directly
  const colors = new Float32Array(vertices.length);

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] / 100;
    const z = vertices[i + 2] / 100;

    // Base terrain height using Perlin-like noise
    const baseHeight = noise2D(x , z ) ;

    // Add mountain ranges with higher frequency noise
    const mountainHeight = Math.pow(Math.abs(noise2D(x*0.3, z * 0.5)), 5) * 50;

    // Simulate river valleys by carving out lower areas
    const riverNoise = Math.abs(noise2D(x , z ));
    let height = baseHeight + mountainHeight;

    if (riverNoise < 0.05) {
      height -= 10 * (0.1 - riverNoise); // Carve deeper valleys near rivers
    }

    vertices[i + 1] =height; // Set the Y coordinate (height)

    // Assign colors based on height
    const color = new THREE.Color();
    if (height < 0) {
      color.set(0x1e90ff); // Water
    } else if (height < 10) {
      color.set(0x90ee90); // Grass
    } else if (height < 30) {
      color.set(0xbbbbbb); // Dirt
    } else {
      color.set(0xffffff); // Snow
    }

    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  geometry.computeVertexNormals(); // Recalculate normals for smooth shading

  const terrain = new THREE.Mesh(geometry, material);

  //const wireframe = new THREE.WireframeGeometry(geometry);
  //const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  //const grid = new THREE.LineSegments(wireframe, lineMaterial);
  //scene.add(grid);

  // Ensure a light source is added to the scene
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(100, 200, 100);
  scene.add(light);

  scene.add(terrain);
}



