// var Canvas = require('canvas');
// var glContext = require('gl')(1, 1); //headless-gl
// var THREE = require('three');

var window = { innerWidth: 800, innerHeight: 600 };
// global.THREE = THREE;
// global.window.jestContext = glContext;

function init() {
  // GL scene renderer
  var canvasGL = new Canvas.Canvas(window.innerWidth, window.innerHeight);
  global.window.jestCanvasGL = canvasGL;
  canvasGL.addEventListener = function (event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()
  var renderer = new THREE.WebGLRenderer({ context: glContext, antialias: true, canvas: canvasGL });
  global.renderer = renderer;
  global.window.jestRenderer = renderer;

  // camera
  var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(1, 1, 1);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  global.window.jestCamera = camera;

  // scene
  var scene = new THREE.Scene();
  global.window.jestScene = scene;
}

// init();

// mock localstorage
console.log('setupTests');
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;
