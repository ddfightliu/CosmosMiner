import * as THREE from 'three';

export function addEquirectangularSkybox(scene: THREE.Scene) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/skybox/earth_atmos_2048.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
  },
  undefined,
  (error) => {
    console.error('Error loading skybox texture:', error);
  });

  const geometry = new THREE.SphereGeometry(500, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
  const skybox = new THREE.Mesh(geometry, material);
  //skybox.rotation.x=-Math.PI/2;
  scene.add(skybox);

  // Add a wireframe grid to the skybox
  //const wireframe = new THREE.WireframeGeometry(geometry);
  //const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  //const grid = new THREE.LineSegments(wireframe, lineMaterial);
  //scene.add(grid);

   // Add XYZ axes indicator
  const axesHelper = new THREE.AxesHelper(100); // Size of the axes
  scene.add(axesHelper);
}