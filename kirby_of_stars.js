import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; 

const scene = new THREE.Scene()

// 카메라 세팅
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(15, 7, 3)

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
})
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = '#00ff00',
    velocity = {
      x: 0,
      y: 0,
      z: 0
    },
    position = {
      x: 0,
      y: 0,
      z: 0
    },
    zAcceleration = false
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color })
    )

    this.width = width
    this.height = height
    this.depth = depth

    this.position.set(position.x, position.y, position.z)

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2

    this.velocity = velocity
    this.gravity = -0.002

    this.zAcceleration = zAcceleration
  }

  updateSides() {
    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2
  }

  update(ground) {
    this.updateSides()

    if (this.zAcceleration) this.velocity.z += 0.0003

    this.position.x += this.velocity.x
    this.position.z += this.velocity.z

    this.applyGravity(ground)
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity

    // this is where we hit the ground
    if (
      boxCollision({
        box1: this,
        box2: ground
      })
    ) {
      const friction = 0.5
      this.velocity.y *= friction
      this.velocity.y = -this.velocity.y
    } else this.position.y += this.velocity.y
  }
}

// 배경 - 하늘
function addSky() {
  var cubeTextureLoader = new THREE.CubeTextureLoader();
  var aCubeMap = cubeTextureLoader.load([
    'assets/img/sky.jpg',
    'assets/img/sky.jpg',
    'assets/img/sky.jpg',
    'assets/img/sky.jpg',
    'assets/img/sky.jpg',
    'assets/img/sky.jpg'
  ]);

  aCubeMap.format = THREE.RGBAFormat;

  var aShader = THREE.ShaderLib['cube'];
  aShader.uniforms['tCube'].value = aCubeMap;

  var aSkyBoxMaterial = new THREE.ShaderMaterial({
    fragmentShader: aShader.fragmentShader,
    vertexShader: aShader.vertexShader,
    uniforms: aShader.uniforms,
    depthWrite: false,
    side: THREE.BackSide
  });

  var aSkybox = new THREE.Mesh(
    new THREE.BoxGeometry(1000000, 1000000, 1000000),
    aSkyBoxMaterial
  );

  scene.add(aSkybox);
}

addSky();


function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
  const zCollision = box1.front >= box2.back && box1.back <= box2.front

  return xCollision && yCollision && zCollision
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  velocity: {
    x: 0,
    y: -0.01,
    z: 0
  }
})
cube.castShadow = true
scene.add(cube)

// 배경 - 바닥
// 기본 바닥(중력을 위한한)
const ground = new Box({
  width: 100000,
  height: 0,
  depth: 100000,
  color: '#65a95e',
  position: {
    x: 0,
    y: -2,
    z: 0
  }
})
ground.receiveShadow = true
scene.add(ground)

const gltfLoader = new GLTFLoader();
// 배경 - 잔디
let grassArray = [];
gltfLoader.load('assets/img/animgrass.glb', (gltf) => {
  const grassModel = gltf.scene;

  grassModel.scale.set(0.07, 0.1, 0.7);

  grassModel.castShadow = true;
  grassModel.receiveShadow = true;

  for (let i = 0; i < 20; i++) {
    const grass = grassModel.clone();
    grass.position.set(-10, -1.95, -120 * i);
    scene.add(grass);
    grassArray.push(grass);

    const grass2 = grassModel.clone();
    grass2.position.set(9, -1.95, -120 * i);
    scene.add(grass2);
    grassArray.push(grass2);
  }
    animate()
});

// 배경 - 나무
let treeArray = [];
gltfLoader.load('assets/img/tree.glb', (gltf) => {
  const treeModel = gltf.scene;

  treeModel.scale.set(1.11, 1, 1.2);

  treeModel.castShadow = true;
  treeModel.receiveShadow = true;

  for (let i = 0; i < 50; i++) {
    const tree = treeModel.clone();
    tree.position.set(-10, -1.95, -30 * i);
    scene.add(tree);
    treeArray.push(tree);
  }
    animate()
});

// 배경 - 꽃
let flowerArray = [];
gltfLoader.load('assets/img/flower2.glb', (gltf) => {
  const flowerModel = gltf.scene;

  flowerModel.scale.set(0.15, 0.15, 0.15);

  flowerModel.castShadow = true;
  flowerModel.receiveShadow = true;

  for (let i = 0; i < 100; i++) {
    const flower = flowerModel.clone();
    flower.position.set(-5, -1.95, - 2 * i);
    scene.add(flower);
    flowerArray.push(flower);
  }

  for (let i = 0; i < 100; i++) {
    const flower2 = flowerModel.clone();
    flower2.position.set(4, -1.95, - 3 * i);
    scene.add(flower2);
    flowerArray.push(flower2);
  }
    animate()
});

// 조명
const light = new THREE.DirectionalLight(0xffffff, 1.0)
light.position.y = 3
light.position.z = 1
light.castShadow = true
scene.add(light)

scene.add(new THREE.AmbientLight(0xffffff, 1.0))

camera.position.z = 5
console.log(ground.top)
console.log(cube.bottom)

// 조작 키 설정
const keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  s: {
    pressed: false
  },
  w: {
    pressed: false
  }
}

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'Space':
      cube.velocity.y = 0.08
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyW':
      keys.w.pressed = false
      break
  }
})

const enemies = []


// 애니메이션 설정 부분
let frames = 0
let spawnRate = 200
let grassSpeed = 0.05
function animate() {
  const animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)

  // 배경 객체들 움직이게 하는 애니메이션
  //grass
  for (let i = 0; i < grassArray.length; i++) {
    grassArray[i].position.z += grassSpeed;
  }
  //tree
  for (let i = 0; i < treeArray.length; i++) {
    treeArray[i].position.z += grassSpeed;
  }
  //flower
  for (let i = 0; i < flowerArray.length; i++) {
    flowerArray[i].position.z += grassSpeed;
  }
  
  // 초록 큐브랑 빨간 큐브 설정
  cube.velocity.x = 0
  cube.velocity.z = 0
  if (keys.a.pressed) cube.velocity.x = -0.05
  else if (keys.d.pressed) cube.velocity.x = 0.05

  if (keys.s.pressed) cube.velocity.z = 0.05
  else if (keys.w.pressed) cube.velocity.z = -0.05

  cube.update(ground)
  enemies.forEach((enemy) => {
    enemy.update(ground)
    if (
      boxCollision({
        box1: cube,
        box2: enemy
      })
    ) {
      cancelAnimationFrame(animationId)
    }
  })

  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 20

    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: -20
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.005
      },
      color: 'red',
      zAcceleration: true
    })
    enemy.castShadow = true
    scene.add(enemy)
    enemies.push(enemy)
  }
  frames++
}