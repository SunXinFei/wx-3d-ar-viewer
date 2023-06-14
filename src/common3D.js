import {
  LoadingManager,
  DirectionalLight,
  AmbientLight,
  DirectionalLightHelper,
  AxesHelper,
  PlaneGeometry,
  ShadowMaterial,
  Mesh,
  BoxHelper,
  CameraHelper
} from 'three-platformize';
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader';
import { calculatePos, addShadow } from './utils.ts';
import { MIN_DISTANCE_SCALE, MAX_DISTANCE_SCALE, ERROR_TYPE_ENUM } from './constant';

export const initLoader = function () {
  if (this.beginModelLoad) return; // 防止重复加载
  this.beginModelLoad = true;
  // loadManager
  const onProgress = (xhr) => {
    // if (xhr.lengthComputable) {
    //   const percentComplete = xhr.loaded / xhr.total * 100;
    //   console.log('model ' + Math.round(percentComplete, 2) + '% downloaded');
    // }
  };

  /**
   * 请求glb模型失败
   * @param {*} error
   */
  const onError = (error) => {
    this.onError && this.onError(ERROR_TYPE_ENUM['MODEL_LOADED_ERROR']);
    // 埋点-请求资源-失败
    console.error('gltf-loader-request-error', error);
  };

  const loadModel = () => {
    // 埋点-加载资源-成功
    const timeGltfLoaderLoadedSuccess = new Date().getTime();
    console.log(
      'gltf-loader-loaded-delta',
      timeGltfLoaderLoadedSuccess - timeGltfLoaderRequestBegin
    );
    this.onModelLoaded && this.onModelLoaded();
  };

  const manager = new LoadingManager(loadModel);

  manager.onProgress = (item, loaded, total) => {
    this.onModelProgress && this.onModelProgress(item, loaded, total);
  };

  const loader = new GLTFLoader(manager);
  // 埋点-请求资源-开始
  const timeGltfLoaderRequestBegin = new Date().getTime();
  console.log('gltf-loader-request-begin', timeGltfLoaderRequestBegin);

  // 加载模型
  loader.load(
    this.modelUrl,
    (gltf) => {
      // 埋点-请求资源-成功
      const timeGltfLoaderRequestSuccess = new Date().getTime();
      console.log('gltf-loader-request-success', timeGltfLoaderRequestSuccess);
      console.log(
        'gltf-loader-request-delta',
        timeGltfLoaderRequestSuccess - timeGltfLoaderRequestBegin
      );

      const model = gltf.scene;

      this.markerGroup.add(gltf.scene);
      this.scene.add(this.markerGroup);

      // 通过模型信息计算镜头
      this.boxHelper.setFromObject(model);
      const { lookPos, cameraPos, distance, modelRadius } = calculatePos(
        this.boxHelper,
        model,
        this.fov,
        this.canvas.width / this.canvas.height
      );

      // 开启阴影
      if (this.openShadow) {
        addShadow(
          this,
          {
            BoxHelper,
            Mesh,
            PlaneGeometry,
            ShadowMaterial
          },
          model,
          modelRadius
        );
      }

      this.camera.lookAt(lookPos);
      this.camera.position.copy(cameraPos);
      // 控制器设置
      this.controls.target = lookPos;
      this.controls.dampingFactor = 0.25;
      this.controls.enablePan = false;
      this.controls.enableDamping = true;
      // 设置最大最小距离
      this.controls.minDistance = distance - MIN_DISTANCE_SCALE;
      this.controls.maxDistance = distance + MAX_DISTANCE_SCALE;
      this.controls.autoRotate = true;
      // 动画开启
      new this.TWEEN.Tween({
        scale: 0.6,
        rotateY: 0.1
      })
        .to(
          {
            scale: 1,
            rotateY: 0
          },
          1000
        )
        .easing(this.TWEEN.Easing.Quadratic.InOut) // | TWEEN.Easing.Linear.None
        .onUpdate((res) => {
          this.markerGroup.scale.set(res.scale, res.scale, res.scale);
          this.markerGroup.rotateY(res.rotateY);
        })
        .onComplete(() => {
          this.controls.enabled = true;
        })
        .start();
    },
    onProgress,
    onError
  );
};

/**
 * 初始化光线
 */
export const initLight = function () {
  // 平行光
  const directionalLight = new DirectionalLight(0xffffff, 1);
  this.directionalLight = directionalLight;
  this.scene.add(directionalLight);

  // 环境光
  const ambienLight = new AmbientLight(0xffffff);
  this.scene.add(ambienLight);
};

/**
 * 开启调试
 */
export const openDebugger = function () {
  // helper
  // 平行光
  this.directionalLightHelper = new DirectionalLightHelper(this.directionalLight);
  this.scene.add(this.directionalLightHelper);
  //坐标系
  this.scene.add(new AxesHelper());
  // 边框
  this.markerGroup.add(this.boxHelper);
  //摄像头
  this.scene.add(new CameraHelper(this.camera));
  // 阴影
  this.scene.add(new CameraHelper(this.directionalLight.shadow.camera));
};
