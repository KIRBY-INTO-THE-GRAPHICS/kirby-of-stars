// Importing necessary modules from the Three.js library
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Creating a Three.js scene
const scene = new THREE.Scene()
const clock = new THREE.Clock()
let backgroundSpeed = 0.05;

// Setting up the camera
const camera = new THREE.PerspectiveCamera(
   75,
   window.innerWidth / window.innerHeight,
   0.1,
   1000
)
camera.position.set(2, 5, 7)

// Creating a WebGLRenderer
const renderer = new THREE.WebGLRenderer({
   alpha: true,
   antialias: true
})
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Adding orbit controls for easier camera manipulation
const controls = new OrbitControls(camera, renderer.domElement)

// Creating a custom class 'Box' which extends THREE.Mesh
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
      // Creating material for the box
      const material = new THREE.MeshStandardMaterial({ color, opacity, transparent });
      // Calling the super constructor with BoxGeometry and the created material
      super(new THREE.BoxGeometry(width, height, depth), material);

      // Setting properties of the box
      this.width = width;
      this.height = height;
      this.depth = depth;

      this.position.set(position.x, position.y, position.z);

      this.velocity = velocity;
      this.gravity = -0.0019;

      this.zAcceleration = zAcceleration;

      this.isJumping = false;
      this.isTransformed = false;

      this.updateSides();
   }

   // Helper method to update the sides of the box
   updateSides() {
      this.right = this.position.x + this.width / 2;
      this.left = this.position.x - this.width / 2;

      this.bottom = this.position.y - this.height / 2;
      this.top = this.position.y + this.height / 2;

      this.front = this.position.z + this.depth / 2;
      this.back = this.position.z - this.depth / 2;
   }

   // Method to update the box's position and apply gravity
   update(ground) {
      this.updateSides();

      // Set a constant velocity for z-axis
      this.velocity.z = backgroundSpeed;  

      this.position.x += this.velocity.x;
      this.position.z += this.velocity.z;

      this.applyGravity(ground);
   }

   // Method to apply gravity to the box
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

// Get audio resources from html
var bgmAudio = document.getElementById("bgmAudio");
var jumpAudio = document.getElementById("jumpAudio");
var starAudio = document.getElementById("starAudio");
var gameOverAudio = document.getElementById("gameOverAudio");

window.onload = function() {
   // Request audio authorization to user
   navigator.mediaDevices.getUserMedia({ audio: true })
   .then(function(stream) {
      // Play bgm
      playSound(bgmAudio);
   })
   .catch(function(error) {
       console.error('Error accessing audio:', error);
   });

   // Set up a function that runs at the end of audio
   bgmAudio.addEventListener("ended", function() {
       // Play audio all over again
       bgmAudio.currentTime = 0;
       playSound(bgmAudio);
   });
};

// Functions to play and pause audio sound
function playSound(audio) {
   audio.play();
}
function pauseSound(audio) {
   audio.pause();
}

// Function to add a skybox to the scene
function addSky() {
   // Creating a cube texture loader
   var cubeTextureLoader = new THREE.CubeTextureLoader();
   // Loading sky textures
   var aCubeMap = cubeTextureLoader.load([
      'assets/img/sky.jpg',
      'assets/img/sky.jpg',
      'assets/img/sky.jpg',
      'assets/img/sky.jpg',
      'assets/img/sky.jpg',
      'assets/img/sky.jpg'
   ]);

   aCubeMap.format = THREE.RGBAFormat;

   // Creating a shader for the skybox
   var aShader = THREE.ShaderLib['cube'];
   aShader.uniforms['tCube'].value = aCubeMap;

   // Creating a material for the skybox
   var aSkyBoxMaterial = new THREE.ShaderMaterial({
      fragmentShader: aShader.fragmentShader,
      vertexShader: aShader.vertexShader,
      uniforms: aShader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
   });

   // Creating a mesh for the skybox
   var aSkybox = new THREE.Mesh(
      new THREE.BoxGeometry(1000000, 1000000, 1000000),
      aSkyBoxMaterial
   );

   // Adding the skybox to the scene
   scene.add(aSkybox);
}

// Calling the addSky function to add the skybox to the scene
addSky();

// Function to check collision between two boxes
function boxCollision({ box1, box2 }) {
   const xCollision = box1.right >= box2.left && box1.left <= box2.right
   const yCollision =
      box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
   const zCollision = box1.front >= box2.back && box1.back <= box2.front

   return xCollision && yCollision && zCollision
}

// Loading the Kirby model
let playerModel
let kirbyModel
let mixer
let kirbyStarModel

// Function to load the Kirby model
function loadKirbyModel() {
   const loader = new GLTFLoader();
   loader.load('assets/kirby/kirby.glb', (gltf) => {
      kirbyModel = gltf.scene;
      kirbyModel.scale.set(0.4, 0.4, 0.4); // Scaling the model
      kirbyModel.position.copy(player.position); // Setting the initial position
      kirbyModel.castShadow = true;
      playerModel = kirbyModel

      scene.add(playerModel);

      // Creating an AnimationMixer
      mixer = new THREE.AnimationMixer(playerModel);

      // Playing all animation clips
      gltf.animations.forEach((clip) => {
         mixer.clipAction(clip).play();
      });

      animate(); // Starting animation after loading the model
      
   });
}

// Function to load the Kirby Star model
function loadKirbyStarModel() {
   const loader = new GLTFLoader();
   loader.load('assets/kirby/kirby_star.glb', (gltf) => {
      kirbyStarModel = gltf.scene;
      kirbyStarModel.scale.set(0.4, 0.4, 0.4);
      kirbyStarModel.position.copy(player.position);
      kirbyStarModel.castShadow = true;
   });
}
loadKirbyStarModel();

// Function to change the player model after 5 seconds
function changePlayerModel() {
   if (kirbyStarModel) {
      // Changing the Kirby model
      scene.remove(playerModel);
      playerModel = kirbyStarModel;
      scene.add(playerModel);
      player.isTransformed = true;
      
       // Returning to the original model after 5 seconds
      setTimeout(() => {
         scene.remove(playerModel);
         playerModel = kirbyModel;
         scene.add(playerModel);
         player.isTransformed = false;

      // Playing the original Kirby animation clips
      gltf.animations.forEach((clip) => {
         mixer.clipAction(clip).play();
      });

      animate(); // Starting animation after loading the model
      }, 5000);
   }
}

// Creating a player object using the Box class
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

// Loading the Kirby model
loadKirbyModel();

// Creating the ground object
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

// Creating a GLTFLoader
const gltfLoader = new GLTFLoader();

// Creating grass objects
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

// Creating tree objects
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

   treeModel.type = 'tree';

   for (let i = 0; i < treeCount; i++) {
      const tree = treeModel.clone();
      tree.position.set(12, -1.95, -treeSpacing * i);
      scene.add(tree);
      tree2Array.push(tree);
   }
   animate();
   
});

// Creating flower objects
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

// Creating cloud objects
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

// Light
const light = new THREE.DirectionalLight(0xffffff, 1.0)
light.position.y = 3
light.position.z = 1
light.castShadow = true
scene.add(light)

scene.add(new THREE.AmbientLight(0xffffff, 1.0))

camera.position.z = 5
console.log(ground.top)
console.log(player.bottom)

// Setting up event listeners for keyboard input
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
         if (!player.isJumping && !player.isTransformed) {
            playSound(jumpAudio);
            // Allowing jump only when not already jumping and not transformed
            player.velocity.y = 0.12
            player.isJumping = true; // Set with jump mode
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
// Load dragonfly objects
function loadDragonflyModel(enemy) {
   const loader = new GLTFLoader();
   loader.load('assets/obstacle/dragonfly.glb', (gltf) => {
      const dragonflyModel = gltf.scene;
      dragonflyModel.scale.set(0.3, 0.3, 0.3); // Model size
      dragonflyModel.position.copy(enemy.position); // get the position of the box object
      dragonflyModel.castShadow = true;
      scene.add(dragonflyModel);

      enemy.model = dragonflyModel; // Connect the object with the box object
      enemy.type = 'dragonfly'; // Obstacle Type -> To distinguish which obstacle is
   });
}
// Load star objects
function loadStarModel(item) {
   const loader = new GLTFLoader();
   loader.load('assets/img/star.glb', (gltf) => {
      const starModel = gltf.scene;
      starModel.scale.set(0.7, 0.7, 0.7);
      starModel.position.copy(item.position);
      starModel.castShadow = true;
      scene.add(starModel);

      item.model = starModel; // Connect the object with the box object
      item.type = 'star'; // Obstacle Type -> To distinguish which obstacle is
   });
}
// Load box object
function loadBoxModel(enemy) {
   const loader = new GLTFLoader();
   loader.load('assets/obstacle/box.glb', (gltf) => {
      const boxModel = gltf.scene;
      boxModel.scale.set(0.7, 0.7, 0.7);
      boxModel.position.copy(enemy.position);
      boxModel.castShadow = true;
      scene.add(boxModel);

      enemy.model = boxModel; // Connect the object with the box object
      enemy.type = 'box'; // Obstacle Type -> To distinguish which obstacle is
   });
}

// Load thorn model
function loadThornModel(enemy) {
   const loader = new GLTFLoader();
   loader.load('assets/obstacle/obstacle_thorn.glb', (gltf) => {
      const thornModel = gltf.scene;
      thornModel.scale.set(0.7, 0.7, 0.7);
      thornModel.position.copy(enemy.position);
      thornModel.position.x = -1;
      console.log(thornModel.position.x);
      thornModel.castShadow = true;
      scene.add(thornModel);

      enemy.model = thornModel; // Connect the object with the box object
      enemy.type = 'box'; // Obstacle Type -> To distinguish which obstacle is
   });
}

// Set the animation
let frames = 0
let spawnRate = 150
// Function to handle animation
function animate() {
   // Use requestAnimationFrame for smooth animation loop
   animationId = requestAnimationFrame(animate);
   // Render the scene using Three.js renderer
   renderer.render(scene, camera);
 
   // Animation for moving background objects
   // Update the position of each object and reset to the initial position if it goes off-screen
   // Grass
   for (let i = 0; i < grassArray.length; i++) {
      const grass = grassArray[i];
      grass.position.z += backgroundSpeed;
      // Move to the initial position when it leave the screen
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

  // Set player's velocity
  player.velocity.x = 0;
  player.velocity.z = -0.05;

  // Adjust player's velocity based on keyboard input
   if (keys.a.pressed) {
      if(player.position.x - 0.05 > - 3) {
         player.velocity.x = -0.05
      }
   } else if (keys.d.pressed) {
      if(player.position.x + 0.05 < 5) {
         player.velocity.x = 0.05
      }
   }

  // Update player's z position
  player.position.z -= backgroundSpeed;

  // Update player model if it exists
   if (playerModel) {
      player.update(ground); // Update player physical location
      playerModel.position.copy(player.position); // Synchronize Kirby model location with player location
      playerModel.rotation.y = Math.PI;

      // Apply Kirby's jumping animation
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
   }


   // Spawn obstacles at regular intervals
   if (frames % spawnRate === 0) {
      if (spawnRate > 40) spawnRate -= 0.5

      // Create obstacles
      const enemy = new Box({
         width: 1,
         height: 1,
         depth: 1,
         opacity: 0,
         transparent: true,
         position: {
            x: (Math.random() - 0.7) * 10 + 3,
            y: 0,
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

      // Randomly load obstacle models
      const rand = Math.random();
      if (rand < 0.05) {
         loadStarModel(enemy);
      } else if (rand < 0.2) {
         loadDragonflyModel(enemy);
         incrementScore()
      } else if (rand < 0.4) {
         enemy.width = 20
         enemy.position.x = 0
         loadThornModel(enemy);
         incrementScore()
      }
      else {
         loadBoxModel(enemy);
         incrementScore()
      }
   }

   // Update and check collisions for obstacles
   enemies.forEach((enemy) => {
      enemy.update(ground)
      if (!player.isTransformed && boxCollision({ box1: player, box2: enemy })) {
         if(enemy && enemy.model) {
            if(enemy.type === 'star') {
               changePlayerModel();
               playSound(starAudio);
            }
            else gameOver();
         }
      }

      // Update model position if it exists
      if (enemy && enemy.model) {
         enemy.model.position.copy(enemy.position);

         // Adjust model rotation and position for dragonfly
         if (enemy.model && enemy.type === 'dragonfly') {
            enemy.model.rotation.y = -10.3;
            enemy.gravity = -10;
            enemy.position.y = 2;
         }
         enemy.model.position.copy(enemy.position);
      }

      // Remove objects that are off-screen
      if (enemy.position.z > 20) {

         // Renove from the array
         const index = enemies.indexOf(enemy);
         enemies.splice(index, 1);

         // Remove from the scene
         scene.remove(enemy.model); // Modify based on expected model references

         if (enemy.model && enemy.model.dispose) {
            enemy.model.dispose(); // Release resources used by Three.js
         }         

         // Disconnect reference to model
         enemy.model = null; 
         enemy = null;

         renderer.render(scene, camera);
      }
   })

   // Increment frame count
   frames++
}

// Score
let score = -50;

// Update score int he screen
function updateScore() {
   const scoreElement = document.getElementById("score");
   if (scoreElement) {
      scoreElement.textContent = `Score: ${score}`;
   }
}

// Increasing the score
function incrementScore() {
   score += 50
   if (score % 100 == 0) {
    backgroundSpeed += 0.001;
   }
   updateScore();
}

// Initial Score Settings
updateScore();

const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

restartButton.addEventListener('click', () => {
  location.reload();
});

function gameOver() {
  cancelAnimationFrame(animationId);

  // Set audios
  pauseSound(bgmAudio);
  playSound(gameOverAudio);

  // Show the game over screen
  gameOverScreen.style.display = 'block';

  // Update the final score
  finalScore.textContent = score;
}