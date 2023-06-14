import {
  PerspectiveCamera,
  PLATFORM,
  Scene,
  Group,
  WebGL1Renderer,
  sRGBEncoding,
  ACESFilmicToneMapping,
  BoxHelper,
  EventDispatcher,
  MOUSE,
  Quaternion,
  Spherical,
  TOUCH,
  Vector2,
  PCFSoftShadowMap,
  Vector3
} from 'three-platformize';
import { WechatPlatform } from 'three-platformize/src/WechatPlatform';
import registerOrbit from '../controls/OrbitControlsWx';
import { initLoader, initLight, openDebugger } from '../common3D';
import { FOV, NEAR, FAR } from '../constant';
const TWEEN = require('three-platformize/examples/jsm/libs/tween.module.min.js');

export class Model3DWx {
  constructor({ modelUrl, canvas, onModelProgress, onModelLoaded, onError }) {
    console.log('init -- 初始化');
    this.onModelProgress = onModelProgress;
    this.onModelLoaded = onModelLoaded;
    this.onError = onError;
    // 初始化平台
    const platform = new WechatPlatform(canvas);
    this.platform = platform;
    PLATFORM.set(platform);

    this.$requestAnimationFrame = platform.window.requestAnimationFrame;
    this.$cancelAnimationFrame = platform.window.cancelAnimationFrame;
    this.$window = platform.window;
    // 动画效果
    this.TWEEN = TWEEN;

    this.disposing = false; // 是否正在销毁
    this.openShadow = false; // 开启阴影
    this.beginModelLoad = false; // 模型是否开始加载
    this.canvas = canvas;
    this.modelUrl = modelUrl;
    // 初始化
    this.initRender();
    // 光线初始化
    initLight.call(this);
    // 加载
    if (this.modelUrl) initLoader.call(this);
    // 渲染
    this.sceneRender();
    // 开启调试
    // openDebugger.call(this)
  }
  /**
   * 资源释放
   */
  dispose() {
    this.disposing = true;
    this.$cancelAnimationFrame && this.$cancelAnimationFrame(this.frameId);
    PLATFORM.dispose();

    if (this.markerGroup) {
      (this.markerGroup.children || []).forEach((group) => {
        (group.children || []).forEach((model) => {
          model.traverse((mesh) => {
            if (mesh.type === 'Mesh') {
              this.disposeMesh(mesh);
            }
          });
        });
      });
      // 移除
      let children = [];
      this.markerGroup.traverse((child) => {
        children.push(child);
      });
      children.forEach((child) => {
        child.removeFromParent();
        console.log(child.name, '移除');
      });
      children = [];
    }
    if (this.$cancelAnimationFrame) this.$cancelAnimationFrame = null;
    if (this.$requestAnimationFrame) this.$requestAnimationFrame = null;
    if (this.$window) this.$window = null;
    if (this.TWEEN) this.TWEEN = null;
    if (this.boxHelper) this.boxHelper = null;
    if (this.camera) this.camera = null;
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas.ownerDocument = null;
      this.canvas = null;
      console.log('释放canvas');
    }
    if (this.controls) this.controls = null;
    if (this.directionalLight) this.directionalLight = null;
    if (this.markerGroup) this.markerGroup = null;
    if (this.modelUrl) this.modelUrl = null;
    if (this.onError) this.onError = null;
    if (this.onModelProgress) this.onModelProgress = null;
    if (this.onModelLoaded) this.onModelLoaded = null;
    if (this.scene) this.scene = null;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement = null;
      this.renderer = null;
    }
    if (this.platform) this.platform = null;
    console.log('dispose -- 销毁1');
  }

  disposeMesh(mesh) {
    // 释放几何体
    if (mesh.geometry) {
      mesh.geometry.dispose();
      mesh.geometry = null;
      console.log(mesh.name, '释放几何体');
    }
    // 释放纹理
    if (mesh.material && mesh.material.aoMap) {
      mesh.material.aoMap.dispose();
      mesh.material.aoMap = null;
      console.log(mesh.name, '释放ao纹理');
    }
    if (mesh.material && mesh.material.alphaMap) {
      mesh.material.alphaMap.dispose();
      mesh.material.alphaMap = null;
      console.log(mesh.name, '释放alpha纹理');
    }
    if (mesh.material && mesh.material.map) {
      mesh.material.map.dispose();
      mesh.material.map = null;
      console.log(mesh.name, '释放map纹理');
    }
    if (mesh.material && mesh.material.normalMap) {
      mesh.material.normalMap.dispose();
      mesh.material.normalMap = null;
      console.log(mesh.name, '释放normal纹理');
    }
    // 释放材质
    if (mesh.material) {
      mesh.material.dispose();
      mesh.material = null;
      console.log(mesh.name, '释放材质');
    }
  }

  /**
   * 初始化渲染
   */
  initRender() {
    // 创建场景
    let scene = new Scene();
    this.scene = scene;

    // 用来计算模型体积
    this.boxHelper = new BoxHelper();

    // 创建group
    this.markerGroup = new Group();

    // 创建camera
    this.fov = FOV;
    let camera = new PerspectiveCamera(this.fov, this.canvas.width / this.canvas.height, NEAR, FAR);
    this.camera = camera;

    // 创建render设置size
    let renderer = new WebGL1Renderer({
      antialias: true,
      alpha: true,
      canvas: this.canvas
    });

    // 开启阴影
    if (this.openShadow) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
    }

    renderer.toneMapping = ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;

    renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer = renderer;

    // 抗锯齿
    renderer.setPixelRatio(this.$window.devicePixelRatio);

    // 设置lookAt
    this.camera.lookAt(this.scene.position);

    // 控制器
    const { OrbitControls } = registerOrbit({
      EventDispatcher,
      MOUSE,
      Quaternion,
      Spherical,
      TOUCH,
      Vector2,
      Vector3
    });
    // 控制器
    const controls = new OrbitControls(camera, this.canvas);
    this.controls = controls;
    // 解决小程序控制器的迟钝感
    controls.rotateSpeed = this.$window.devicePixelRatio;
    this.controls.enabled = false;
  }
  /**
   * 查看内存占用情况
   */
  viewWebglRenderInfo() {
    console.log(this.markerGroup, 'this.markerGroup');
    this.renderer.info.reset();
    // console.log(this.renderer)
    console.log(this.renderer.info);
  }
  /**
   * 事件
   * @param {} e
   */
  dispatchTouchEvent(e) {
    if (this.controls.autoRotate) this.controls.autoRotate = false;
    this.platform.dispatchTouchEvent(e);
  }

  resetSize({ canvasWidth, canvasHeight }) {
    this.camera.aspect = canvasWidth / canvasHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvasWidth, canvasHeight);
  }

  sceneRender() {
    if (!this.disposing) this.frameId = this.$requestAnimationFrame(this.sceneRender.bind(this));
    if (!this.controls.enabled && this.TWEEN) this.TWEEN.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
