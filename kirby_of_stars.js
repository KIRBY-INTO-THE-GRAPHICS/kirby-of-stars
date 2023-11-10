import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene()
const clock = new THREE.Clock()
let backgroundSpeed = 0.05;

// 카메라 세팅
const camera = new THREE.PerspectiveCamera(
   75,
   window.innerWidth / window.innerHeight,
   0.1,
   1000
)
camera.position.set(2, 5, 7)

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
      opacity = 1.0,
      transparent = false,
      velocity = {
         x: 0,
         y: 0,
         z: 0.05
      },
      position = {
         x: 0,
         y: 0,
         z: 0
      },
      zAcceleration = false
   }) {
      const material = new THREE.MeshStandardMaterial({ color, opacity, transparent });
      super(new THREE.BoxGeometry(width, height, depth), material);

      this.width = width;
      this.height = height;
      this.depth = depth;

      this.position.set(position.x, position.y, position.z);

      this.velocity = velocity;
      this.gravity = -0.0019;

      this.zAcceleration = zAcceleration;

      this.isJumping = false;

      this.updateSides();
   }

   updateSides() {
      this.right = this.position.x + this.width / 2;
      this.left = this.position.x - this.width / 2;

      this.bottom = this.position.y - this.height / 2;
      this.top = this.position.y + this.height / 2;

      this.front = this.position.z + this.depth / 2;
      this.back = this.position.z - this.depth / 2;
   }

   update(ground) {
      this.updateSides();

      // if (this.zAcceleration) {
      //   this.velocity.z += 0.0003;
      // }

      this.velocity.z = backgroundSpeed;  // Set a constant velocity for z-axis

      this.position.x += this.velocity.x;
      this.position.z += this.velocity.z;

      this.applyGravity(ground);
   }

   applyGravity(ground) {
      this.velocity.y += this.gravity;

      if (boxCollision({
         box1: this,
         box2: ground
      })) {
         this.velocity.y *= 0;
         this.isJumping = false;
      } else {
         this.position.y += this.velocity.y;
      }
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

// 플레이어(커비)
let playerModel
let mixer
// GLTF 모델을 로드하는 함수
function loadKirbyModel() {
   const loader = new GLTFLoader();
   loader.load('assets/kirby/kirby_animation.glb', (gltf) => {
      playerModel = gltf.scene;
      playerModel.scale.set(0.4, 0.4, 0.4); // 모델의 크기
      playerModel.position.copy(player.position); // Box 객체의 초기 위치를 가져옴
      playerModel.castShadow = true;
      scene.add(playerModel);

      // AnimationMixer를 생성합니다.
      mixer = new THREE.AnimationMixer(playerModel);

      // 모든 애니메이션 클립을 재생합니다.
      gltf.animations.forEach((clip) => {
         mixer.clipAction(clip).play();
      });

      animate(); // 모델 로드 후 애니메이션 시작
      
   });
}

const player = new Box({
   width: 1,
   height: 1,
   depth: 1,
   color: '#FFFFFF',
   opacity: 0,
   transparent: true,
   velocity: {
      x: 0,
      y: -0.01,
      z: 0
   }
});
loadKirbyModel();

// 배경 - 바닥
// 기본 바닥(중력을 위한)
const ground = new Box({
   width: 100,
   height: 0,
   depth: 80,
   color: '#65a95e',
   position: {
      x: 0,
      y: -2,
      z: -15
   }
})
ground.receiveShadow = true
scene.add(ground)

const gltfLoader = new GLTFLoader();

// 배경 - 잔디
const grassCount = 11;
const grassSpacing = 5;
let grassArray = [];
let grass2Array = [];
gltfLoader.load('assets/img/grassground.glb', (gltf) => {
   const grassModel = gltf.scene;
   grassModel.scale.set(0.05, 0.01, 0.05);
   grassModel.castShadow = true;
   grassModel.receiveShadow = true;

   for (let i = 0; i < grassCount; i++) {
      const grass = grassModel.clone();
      grass.position.set(-10, -1.95, -grassSpacing * i);
      scene.add(grass);
      grassArray.push(grass);
   }
   animate()
   
});

gltfLoader.load('assets/img/grassground.glb', (gltf) => {
   const grassModel = gltf.scene;
   grassModel.scale.set(0.03, 0.01, 0.05);
   grassModel.castShadow = true;
   grassModel.receiveShadow = true;

   for (let i = 0; i < grassCount; i++) {
      const grass = grassModel.clone();
      grass.position.set(10, -1.95, -grassSpacing * i);
      scene.add(grass);
      grass2Array.push(grass);
   }
   animate();
   
});

// 배경 - 나무
const treeCount = 3;
const treeSpacing = 20;
let treeArray = [];
let tree2Array = [];
gltfLoader.load('assets/img/fantasy_tree.glb', (gltf) => {
   const treeModel = gltf.scene;
   treeModel.scale.set(0.1, 0.1, 0.1);
   treeModel.castShadow = true;
   treeModel.receiveShadow = true;

   for (let i = 0; i < treeCount; i++) {
      const tree = treeModel.clone();
      tree.position.set(-10, -1.95, -treeSpacing * i);
      scene.add(tree);
      treeArray.push(tree);
   }
   animate();
   

});

gltfLoader.load('assets/img/fantasy_tree.glb', (gltf) => {
   const treeModel = gltf.scene;
   treeModel.scale.set(0.1, 0.1, 0.1);
   treeModel.castShadow = true;
   treeModel.receiveShadow = true;

   for (let i = 0; i < treeCount; i++) {
      const tree = treeModel.clone();
      tree.position.set(12, -1.95, -treeSpacing * i);
      scene.add(tree);
      tree2Array.push(tree);
   }
   animate();
   
});

// 배경 - 꽃
const flowerCount = 11;
const flowerSpacing = 5;
let flowerArray = [];
let flower2Array = [];
gltfLoader.load('assets/img/flower2.glb', (gltf) => {
   const flowerModel = gltf.scene;
   flowerModel.scale.set(0.15, 0.15, 0.15);
   flowerModel.castShadow = true;
   flowerModel.receiveShadow = true;

   for (let i = 0; i < flowerCount; i++) {
      const flower = flowerModel.clone();
      flower.position.set(-5, -1.95, -flowerSpacing * i);
      scene.add(flower);
      flowerArray.push(flower);
   }
   animate();
});

gltfLoader.load('assets/img/flower2.glb', (gltf) => {
   const flowerModel = gltf.scene;
   flowerModel.scale.set(0.15, 0.15, 0.15);
   flowerModel.castShadow = true;
   flowerModel.receiveShadow = true;

   for (let i = 0; i < flowerCount; i++) {
      const flower = flowerModel.clone();
      flower.position.set(7, -1.95, -flowerSpacing * i);
      scene.add(flower);
      flower2Array.push(flower);
   }
   animate();
   
});

// 배경 - 구름
const cloudCount = 5;
const cloudSpacing = 10;
let cloudArray = [];
gltfLoader.load('assets/img/cloud.glb', (gltf) => {
   const cloudModel = gltf.scene;
   cloudModel.scale.set(0.005, 0.005, 0.005);
   cloudModel.castShadow = true;
   cloudModel.receiveShadow = true;

   for (let i = 0; i < cloudCount; i++) {
      const cloud = cloudModel.clone();
      cloud.position.set(Math.random() < 0.5 ? -10 - Math.random() * 10 : 4 + Math.random() * 10, 4, -cloudSpacing * i);
      scene.add(cloud);
      cloudArray.push(cloud);
   }
   animate();
   
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
console.log(player.bottom)

// 조작 키 설정
const keys = {
   a: {
      pressed: false
   },
   d: {
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
      case 'Space':
         if (!player.isJumping) { // 점프 상태가 아닐 때만 점프를 허용
            player.velocity.y = 0.12
            player.isJumping = true; // 점프 상태로 설정
         }
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
   }
})

var animationId;

const enemies = []
// 잠자리 모델을 로드하는 함수
function loadDragonflyModel(enemy) {
   const loader = new GLTFLoader();
   loader.load('assets/obstacle/dragonfly.glb', (gltf) => {
      const dragonflyModel = gltf.scene;
      dragonflyModel.scale.set(0.3, 0.3, 0.3); // 모델의 크기를 조정합니다.
      dragonflyModel.position.copy(enemy.position); // Box 객체의 초기 위치를 가져옴
      dragonflyModel.castShadow = true;
      scene.add(dragonflyModel);

      enemy.model = dragonflyModel; // Box 객체에 모델을 연결합니다.
      enemy.type = 'dragonfly'; // 장애물 타입 -> 이걸로 어떤 장애물인지 구별
   });
}
// 별 아이템 모델을 로드하는 함수
function loadStarModel(item) {
   const loader = new GLTFLoader();
   loader.load('assets/img/star.glb', (gltf) => {
      const starModel = gltf.scene;
      starModel.scale.set(0.7, 0.7, 0.7);
      starModel.position.copy(item.position);
      starModel.castShadow = true;
      scene.add(starModel);

      item.model = starModel; // Box 객체에 모델을 연결합니다.
      item.type = 'star'; // 장애물 타입 -> 이걸로 어떤 장애물인지 구별
   });
}
// 박스 모델을 로드하는 함수
function loadBoxModel(enemy) {
   const loader = new GLTFLoader();
   loader.load('assets/obstacle/box.glb', (gltf) => {
      const boxModel = gltf.scene;
      boxModel.scale.set(0.7, 0.7, 0.7);
      boxModel.position.copy(enemy.position);
      boxModel.castShadow = true;
      scene.add(boxModel);

      enemy.model = boxModel; // Box 객체에 모델을 연결합니다.
      enemy.type = 'box'; // 장애물 타입 -> 이걸로 어떤 장애물인지 구별
   });
}

// 가시 모델을 로드하는 함수
function loadThornModel(enemy) {
   const loader = new GLTFLoader();
   loader.load('assets/obstacle/thorn.glb', (gltf) => {
      const thornModel = gltf.scene;
      thornModel.scale.set(0.7, 0.7, 0.7);
      thornModel.position.copy(enemy.position); 
      thornModel.castShadow = true;
      scene.add(thornModel);

      enemy.model = thornModel; // Box 객체에 모델을 연결합니다.
      enemy.type = 'box'; // 장애물 타입 -> 이걸로 어떤 장애물인지 구별
   });
}

// 애니메이션 설정 부분
let frames = 0
let spawnRate = 150
function animate() {
  animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
   // 배경 객체들 움직이게 하는 애니메이션
   //grass
   // 객체를 뒤로 이동
   for (let i = 0; i < grassArray.length; i++) {
      const grass = grassArray[i];
      grass.position.z += backgroundSpeed;
      // 화면 밖으로 나가면 초기 위치로 이동
      if (grass.position.z > grassSpacing) {
         grass.position.z = -grassSpacing * (grassArray.length - 1);
      }
   }
   for (let i = 0; i < grass2Array.length; i++) {
      const grass = grass2Array[i];
      grass.position.z += backgroundSpeed;
      if (grass.position.z > grassSpacing) {
         grass.position.z = -grassSpacing * (grass2Array.length - 1);
      }
   }
   //tree
   for (let i = 0; i < treeArray.length; i++) {
      const tree = treeArray[i];
      tree.position.z += backgroundSpeed;
      if (tree.position.z > treeSpacing) {
         tree.position.z = -treeSpacing * (treeArray.length - 1);
      }
   }
   for (let i = 0; i < tree2Array.length; i++) {
      const tree = tree2Array[i];
      tree.position.z += backgroundSpeed;
      if (tree.position.z > treeSpacing) {
         tree.position.z = -treeSpacing * (tree2Array.length - 1);
      }
   }
   //flower
   for (let i = 0; i < flowerArray.length; i++) {
      const flower = flowerArray[i];
      flower.position.z += backgroundSpeed;
      if (flower.position.z > flowerSpacing) {
         flower.position.z = -flowerSpacing * (flowerArray.length - 1);
      }
   }
   for (let i = 0; i < flower2Array.length; i++) {
      const flower = flower2Array[i];
      flower.position.z += backgroundSpeed;
      if (flower.position.z > flowerSpacing) {
         flower.position.z = -flowerSpacing * (flower2Array.length - 1);
      }
   }
   //cloud
   for (let i = 0; i < cloudArray.length; i++) {
      const cloud = cloudArray[i];
      cloud.position.z += backgroundSpeed;
      if (cloud.position.z > cloudSpacing) {
         cloud.position.z = -cloudSpacing * (cloudArray.length - 1);
         cloud.position.x = Math.random() < 0.5 ? -10 - Math.random() * 10 : 4 + Math.random() * 10;
      }
   }

   // 플레이어 위치 설정
   player.velocity.x = 0;
   player.velocity.z = -0.05;

   if (keys.a.pressed) {
      console.log(player.position.x);
      if(player.position.x - 0.05 > - 3) {
         player.velocity.x = -0.05
      }
   } else if (keys.d.pressed) {
      console.log(player.position.x);
      if(player.position.x + 0.05 < 5) {
         player.velocity.x = 0.05
      }
   }

   player.position.z -= backgroundSpeed;

   if (playerModel) {
      player.update(ground); // 플레이어 물리적 위치 업데이트
      playerModel.position.copy(player.position); // 커비 모델 위치를 player 위치와 동기화
      playerModel.rotation.y = Math.PI;

      // 커비 뛰는 애니메이션 적용
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
   }


   // 장애물 생성
   if (frames % spawnRate === 0) {
      if (spawnRate > 40) spawnRate -= 0.5

      const enemy = new Box({
         width: 1,
         height: 1,
         depth: 1,
         opacity: 0,
         transparent: true,
         position: {
            x: (Math.random() - 0.7) * 10 + 3,
            y: -1.3,
            z: -40
         },
         velocity: {
            x: 0,
            y: 0,
            z: 0
         },
         zAcceleration: true
      })
      enemy.castShadow = true
      scene.add(enemy)
      enemies.push(enemy)

      const rand = Math.random();
      if (rand < 0.05) {
         loadStarModel(enemy);
      } else if (rand < 0.2) {
         loadDragonflyModel(enemy);
         incrementScore()
      } else if (rand < 0.5) {
         loadThornModel(enemy);
         incrementScore()
      }
      else {
         loadBoxModel(enemy);
         incrementScore()
      }
      
   }
   enemies.forEach((enemy) => {
      enemy.update(ground)
      if (
         boxCollision({
            box1: player,
            box2: enemy
         })
      ) {
         gameOver();
      }
      if (enemy && enemy.model) {
         enemy.model.position.copy(enemy.position);
         // 잠자리일때 모델 rotation
         if (enemy.model && enemy.type === 'dragonfly') {
            enemy.model.rotation.y = -10.3;
            enemy.gravity = -10;
         }
         enemy.model.position.copy(enemy.position);
      }
   })

   frames++
}

// 점수 변수
let score = -50;

// 화면에 점수 업데이트
function updateScore() {
   const scoreElement = document.getElementById("score");
   if (scoreElement) {
      scoreElement.textContent = `Score: ${score}`;
   }
}

// 점수 증가
function incrementScore() {
   score += 50
   if (score % 100 == 0) {
    backgroundSpeed += 0.0003;
   }
   updateScore();
}

// 초기 점수 설정
updateScore();


function removeAllObjects() {
   for (let i = scene.children.length - 1; i >= 0; i--) {
      const obj = scene.children[i];
      if (obj.update) {
         obj.update();
      }
      if (obj.position.z > 10) {
         // 화면에서 벗어난 객체 모델 제거
         scene.remove(obj);
      }
   }
}

const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

restartButton.addEventListener('click', () => {
  location.reload();
});

function gameOver() {
  cancelAnimationFrame(animationId);

  // Show the game over screen
  gameOverScreen.style.display = 'block';

  // Update the final score
  finalScore.textContent = score;
}
