import * as THREE from 'three';
import { generateTerrain } from '@/utils/terrainUtils';
import { addEquirectangularSkybox } from '@/utils/skyboxUtils';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function setScene(
  sceneroot: THREE.Scene,
  worldSeed: string,
  renderer: THREE.WebGLRenderer,
  onModelLoaded?: (model: THREE.Object3D) => void
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

  // 动画相关变量
  let mixer: THREE.AnimationMixer | null = null;
  const clock = new THREE.Clock();

  // 加载模型
  const loader = new GLTFLoader();
  loader.load('/people/low_poly_female_base_mesh/scene.gltf', (gltf: any) => {
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(10, 10, 10); // 可根据需要调整缩放
    scene.add(gltf.scene);

    // 如果有动画，创建 AnimationMixer 并播放第一个动画
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }

    if (onModelLoaded) {
      onModelLoaded(gltf.scene); // 回调返回模型
    }
  }, undefined, (error: any) => {
    console.error('Error loading model:', error);
  });

  // 渲染循环，更新动画
  function animate() {
    requestAnimationFrame(animate);
    if (mixer) {
      mixer.update(clock.getDelta());
    }
    renderer.render(scene, (renderer as any).camera || new THREE.PerspectiveCamera());
  }
  animate();

  sceneroot.add(scene);
}