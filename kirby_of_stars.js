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

// 플레이어 클래스 정의
class Player {
   constructor(modelPath) {
      this.model = null;
      this.mixer = null;
      this.actions = {};
      this.velocity = new THREE.Vector3();
      this.gravity = -9.8;
      this.jumpPower = 10;
      this.isGrounded = false;

      // 모델 로드
      this.loadModel(modelPath);
   }

   loadModel(path) {
      const loader = new GLTFLoader();
      loader.load(path, (gltf) => {
         this.model = gltf.scene;
         this.model.scale.set(0.5, 0.5, 0.5); // 모델의 크기를 조정
         this.model.position.y = 0; // 땅에 위치하도록 조정
         this.model.position.z = 0;
         scene.add(this.model);
         console.log('Model loaded and added to scene');

         this.mixer = new THREE.AnimationMixer(this.model);
         gltf.animations.forEach((clip) => {
            const action = this.mixer.clipAction(clip);
            this.actions[clip.name] = action;
         });

         // 모델의 물리 및 충돌 설정 추가
         // ...

         // 애니메이션 루프 시작
         animate();
      });
   }

   // 키보드 입력에 따라 모델을 이동
   move(direction) {
      const speed = 2;
      if (direction === 'left') this.velocity.x = -speed;
      else if (direction === 'right') this.velocity.x = speed;
   }

   // 정지
   stop() {
      this.velocity.x = 0;
   }

   // 점프
   jump() {
      if (this.isGrounded) {
         this.velocity.y = this.jumpPower;
         this.isGrounded = false;
      }
   }

   // 물리 효과 적용 (중력)
   applyPhysics(deltaTime) {
      this.velocity.y += this.gravity * deltaTime;
      if (this.model.position.y <= -1.95) {
         this.velocity.y = 0;
         this.isGrounded = true;
         this.model.position.y = -1.95;
      }
   }

   // 플레이어의 상태를 업데이트
   update(deltaTime, ground) {

      // 플레이어의 위치를 업데이트
      this.model.position.x += this.velocity.x * deltaTime;
      this.model.position.y += this.velocity.y * deltaTime;
      this.applyPhysics(deltaTime);

      // 플레이어의 바닥 충돌 감지 및 처리
      if (boxCollision({ box1: this.model, box2: ground })) {
         this.isGrounded = true;
         this.velocity.y = 0;
         this.model.position.y = ground.top + (this.model.height / 2);
       } else {
         this.isGrounded = false;
       }
   }
}

const clock = new THREE.Clock();
// 플레이어 인스턴스 생성
const player = new Player('assets/kirby/kirby.glb');

// 조작 키 설정
window.addEventListener('keydown', (event) => {
   if (event.code === 'KeyA') {
      player.move('left');
   } else if (event.code === 'KeyD') {
      player.move('right');
   } else if (event.code === 'Space') {
      player.jump();
   }
});

window.addEventListener('keyup', (event) => {
   if (event.code === 'KeyA' || event.code === 'KeyD') {
      player.stop();
   }
});


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




const enemies = []


// 애니메이션 설정 부분
let frames = 0
let spawnRate = 100
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

   // 플레이어 설정
   let deltaTime = clock.getDelta();
   player.update(ground)
   if (player.mixer) {
      player.mixer.update(deltaTime);
   }

   enemies.forEach((enemy) => {
      enemy.update(ground)
      if (
         boxCollision({
            box1: player,
            box2: enemy
         })
      ) {
         cancelAnimationFrame(animationId)
      }
   })

   if (frames % spawnRate === 0) {
      if (spawnRate > 1) spawnRate -= 0.5

      const enemy = new Box({
         width: 1,
         height: 1,
         depth: 1,
         position: {
            x: (Math.random() - 0.75) * 10,
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