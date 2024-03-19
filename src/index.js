import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Event listener for file input
document.getElementById('fileInput').addEventListener('change', handleFileSelect);

// Initialize variables for camera, scene, renderer, etc.
let camera, scene, renderer;
const clock = new THREE.Clock();
let mixer; // Animation mixer

init();
animate();

var file = {}; // Variable to store the selected file

// Function to handle file selection event
function handleFileSelect(event) {
  try {
    // Get the selected file
    file = event.target.files[0];
    if (!file) return;

    // Display loading spinner
    document.getElementById('loadingSpinner').style.display = 'block';

    // Read the selected file
    const reader = new FileReader();
    reader.onload = function (e) {
      // Use FBXLoader to load the file
      const loader = new FBXLoader();
      loader.load(e.target.result, async function (object) {
        // Traverse through the loaded object's children
        object.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add the loaded object to the scene
        await scene.add(object);

        // Hide loading spinner after loading is complete
        document.getElementById('loadingSpinner').style.display = 'none';

       

        // Display download button for GLTF export
        const downloadBtn = document.getElementById('button');
        downloadBtn.style.display = 'block';
        downloadBtn.addEventListener("click", function () {
          exportGLTF(object);
        });
      });
    };
    // Read the file as data URL
    reader.readAsDataURL(file);
  } catch (error) {
    console.log(error);
  }
}

// Function to initialize the Three.js scene
export function init() {
  // Create a container for the Three.js scene
  const container = document.getElementById('info');
  document.body.appendChild(container);

  // Create a perspective camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(100, 200, 300);

  // Create a new scene with background color and fog
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

  // Add hemisphere light and directional light to the scene for lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 5);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);

  // Create a ground plane and grid helper
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  // Load the model if file is provided
  const loader = new FBXLoader();
  if (file != null) {
    loader.load(file, async function (object) {
      document.getElementById('fileInput').disabled = true;

      // Show loading spinner
      document.getElementById('loadingSpinner').style.display = 'block';

      // Traverse through the loaded object's children
      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add the loaded object to the scene
      await scene.add(object);

      // Hide loading spinner after loading is complete
      document.getElementById('loadingSpinner').style.display = 'none';
    });
  }

  // Initialize renderer
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Initialize OrbitControls for scene navigation
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 100, 0);
  controls.update();

  // Add event listener for window resize
  window.addEventListener('resize', onWindowResize);

  // GLB downloader button
//   const downloadBtn = document.getElementById('button');
//   downloadBtn.addEventListener('click', () => exportGLTF(scene));
 }

// Function to handle window resize event
function onWindowResize() {
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// Function to export the scene to GLTF format
function exportGLTF(input) {
  if(file.name==null) {
    console.log(file);
    return ;}
  console.log(file);
  const gltfExporter = new GLTFExporter();
  const options = {
    trs: true,
    onlyVisible: true,
    binary: true,
    maxTextureSize: 1000000
  };
  gltfExporter.parse(
    input,
    function (result) {
      if (result instanceof ArrayBuffer) {
        // Save the result as a GLB file
        saveArrayBuffer(result, 'scene11.glb');
      } else {
        const output = JSON.stringify(result, null, 2);
        console.log(output);
        // Save the result as a GLTF file
        saveString(output, 'scene.gltf');
      }
    },
    function (error) {
      console.log('An error happened during parsing', error);
    },
    options
  );
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

const link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link);

// Function to save data as a blob
function save(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Function to save string data as a file
function saveString(text, filename) {
  save(new Blob([text], { type: 'text/plain' }), filename);
}

// Function to save array buffer data as a file
function saveArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}
