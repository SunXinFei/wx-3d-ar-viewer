import { ERROR_TYPE_ENUM, AR_MODEL_DEF_SCALE, AR_MODEL_SHADOW_SCALE } from './constant';
import bufferGeometryJson from './tool/bufferGeometry.json';
import { registerBufferGeometryUtils } from './tool/bufferGeometryUtils.js';
import { registerSVGLoader } from './loaders/svg-loader.js';
import fontJson from './tool/helvetiker_regular.typeface.json';
import { rulerData } from './tool/ruler.js';
/**
 * 圆角矩形
 * @param {*} x
 * @param {*} y
 * @param {*} width
 * @param {*} height
 * @param {*} radius
 */
const roundedRect = function (ctx, x, y, width, height, radius) {
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
  ctx.lineTo(x + width - radius, y + height);
  ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  ctx.lineTo(x + width, y + radius);
  ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
  ctx.lineTo(x + radius, y);
  ctx.quadraticCurveTo(x, y, x, y + radius);
};
/**
 * 初始化光标
 * @param {*} model
 */
export const initCursorPointer = function (model) {
  // 初始化几何体合并方法
  registerBufferGeometryUtils(this.THREE);
  // 初始化SVGLoader
  registerSVGLoader(this.THREE);

  const boxHelper = new this.THREE.BoxHelper(model, 0xffffff);
  boxHelper.geometry.computeBoundingBox();

  const { x: xLength1, y: yLength1, z: zLength1 } = boxHelper.geometry.boundingBox.max;
  const { x: xLength2, y: yLength2, z: zLength2 } = boxHelper.geometry.boundingBox.min;
  const xLength = (xLength1 - xLength2) / AR_MODEL_SHADOW_SCALE;
  const yLength = (yLength1 - yLength2) / AR_MODEL_SHADOW_SCALE;
  const zLength = (zLength1 - zLength2) / AR_MODEL_SHADOW_SCALE;

  const mergeGeometryList = [];
  const basicMaterial = new this.THREE.MeshBasicMaterial({
    color: 0xffffff
  });
  const path = bufferGeometryJson.paths;
  for (let j = 0, jl = path.length; j < jl; j++) {
    const geometry = this.THREE.SVGLoader.pointsToStroke(
      path[j].map((ppp) => {
        return new this.THREE.Vector2(ppp.x, ppp.y);
      }),
      {
        fill: 'none',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeWidth: 2.4,
        strokeLineJoin: 'round',
        strokeLineCap: 'round',
        strokeMiterLimit: 4,
        stroke: '#FFFFFF'
      }
    );

    if (geometry) {
      mergeGeometryList.push(geometry);
    }
  }
  const iconGeometry = this.THREE.BufferGeometryUtils.mergeBufferGeometries(mergeGeometryList);
  // 释放数组
  mergeGeometryList.length = 0;
  // 设置图标偏移
  iconGeometry.translate(-18, -18, 0); //偏移量直接写死即可，不用重复计算
  iconGeometry.rotateX(-Math.PI / 2);
  const iconMash = new this.THREE.Mesh(iconGeometry, basicMaterial);
  iconMash.scale.set(
    AR_MODEL_DEF_SCALE / AR_MODEL_SHADOW_SCALE,
    AR_MODEL_DEF_SCALE / AR_MODEL_SHADOW_SCALE,
    AR_MODEL_DEF_SCALE / AR_MODEL_SHADOW_SCALE
  );
  iconMash.name = 'iconMesh_mesh';
  // 绘制圆角平面
  const roundedRectShape = new this.THREE.Shape();
  // 圆角度
  const radius = 5 * AR_MODEL_DEF_SCALE;
  roundedRect(roundedRectShape, -xLength / 2, -zLength / 2, xLength, zLength, radius);
  const planeGeometry = new this.THREE.ShapeGeometry(roundedRectShape);
  planeGeometry.rotateX(-Math.PI / 2);
  const planeMash = new this.THREE.Mesh(
    planeGeometry,
    new this.THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
  );
  planeMash.name = 'planeMesh_mesh';
  // 绘制圆角抠洞，形成边线平面
  const roundedRectShape2 = new this.THREE.Shape();
  const lineWidth = 2 * AR_MODEL_DEF_SCALE;
  roundedRect(
    roundedRectShape2,
    -(xLength / 2 + lineWidth),
    -(zLength / 2 + lineWidth),
    xLength + 2 * lineWidth,
    zLength + 2 * lineWidth,
    radius
  );
  roundedRectShape2.holes = [roundedRectShape];
  const lineGeometry = new this.THREE.ShapeGeometry(roundedRectShape2);

  // 绘制三角形
  const triangleLength = 0.08;
  const triangleShape = new this.THREE.Shape();
  triangleShape.moveTo(0, 0);
  triangleShape.lineTo(triangleLength, 0);
  triangleShape.lineTo(0, (-Math.sqrt(3) / 3) * triangleLength);
  triangleShape.lineTo(-triangleLength, 0);
  const triangleGeometry = new this.THREE.ShapeGeometry(triangleShape);
  triangleGeometry.translate(0, -(zLength / 2 + lineWidth), 0);

  lineGeometry.merge(triangleGeometry);

  // 绘制十字光标
  lineGeometry.rotateX(-Math.PI / 2);
  const lineMesh = new this.THREE.Mesh(lineGeometry, basicMaterial);
  lineMesh.name = 'lineMesh_mesh';
  // 创建组
  this.reticle = new this.THREE.Group();
  this.reticle.name = 'reticle_group';
  this.reticle.add(iconMash);
  this.reticle.add(planeMash);
  this.reticle.add(lineMesh);
  this.reticle.visible = false;
  // 2248顶点 852三角面
  this.scene.add(this.reticle);
};

/**
 * 加载模型
 */
export const initLoader = function (loadedCallback, customData = { ModelDefScale: 1 }) {
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
    this.beginModelLoad = false;
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
  };

  const manager = new this.THREE.LoadingManager(loadModel);

  manager.onProgress = (item, loaded, total) => {
    this.onModelProgress && this.onModelProgress(item, loaded, total);
  };

  const loader = new this.THREE.GLTFLoader(manager);
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
      // // 阴影处理
      // gltf.scene.traverse((child) => {
      //   if(child.material && child.material.name && child.material.name.toLowerCase().includes('shadow')){
      //     child.material.alphaMap = child.material.map
      //     child.material.map = null
      //   }
      // });

      // 基于模型包围盒，创建光标
      initCursorPointer.call(this, model);

      // 创建group
      this.markerGroup = new this.THREE.Group();
      this.markerGroup.add(model);
      // this.markerGroup.scale.set(AR_MODEL_DEF_SCALE, AR_MODEL_DEF_SCALE, AR_MODEL_DEF_SCALE);
      this.markerGroup.visible = false;

      this.scene.add(this.markerGroup);
      // 渲染标尺
      renderRuler.call(this);

      loadedCallback && loadedCallback();
    },
    onProgress,
    onError
  );
};

const renderRuler = function () {
  const font = new this.THREE.Font(fontJson);
  const radius = 1 * AR_MODEL_DEF_SCALE;
  const RulerColor = 0xf15f09;
  const textMaterial = new this.THREE.MeshBasicMaterial({ color: RulerColor });
  const lineMaterial = new this.THREE.LineBasicMaterial({
    color: RulerColor
  });
  rulerData.forEach((data) => {
    let lineGroup = new this.THREE.Group();
    lineGroup.name = 'lineGroup';
    const startPointPos = new this.THREE.Vector3(
      data.startPoint.x,
      data.startPoint.y,
      data.startPoint.z
    );
    const endPointPos = new this.THREE.Vector3(data.endPoint.x, data.endPoint.y, data.endPoint.z);
    const pointGeometry = new this.THREE.SphereGeometry(radius, 32, 16);
    // 起始点
    const startPointMesh = new this.THREE.Mesh(pointGeometry, textMaterial);
    startPointMesh.name = 'startPointMesh';
    startPointMesh.position.copy(startPointPos);
    // 终止点
    const endPointMesh = startPointMesh.clone();
    endPointMesh.name = 'endPointMesh';
    endPointMesh.position.copy(endPointPos);
    // 线
    const points = [];
    points.push(startPointPos);
    points.push(endPointPos);
    const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points);
    const lineMesh = new this.THREE.Line(lineGeometry, lineMaterial);
    lineMesh.name = 'lineMesh';
    // 文字
    // const textMesh = createSpriteNode.call(this, `${data.numStr}`, startPointPos.clone().add(endPointPos).divideScalar(2))
    const geometry = new this.THREE.TextGeometry(`${data.numStr}`, {
      font: font,
      size: 5 * AR_MODEL_DEF_SCALE,
      height: 1 * AR_MODEL_DEF_SCALE * AR_MODEL_DEF_SCALE
    });
    geometry.computeBoundingSphere();
    geometry.translate(-geometry.boundingSphere.radius, 0, 0);
    const textMesh = new this.THREE.Mesh(geometry, textMaterial);
    textMesh.name = 'textMesh';
    textMesh.userData.rulerType = 'rulerText';
    textMesh.position.copy(startPointPos.clone().add(endPointPos).divideScalar(2));

    lineGroup.add(lineMesh);
    lineGroup.add(startPointMesh);
    lineGroup.add(endPointMesh);
    lineGroup.add(textMesh);
    this.markerGroup.add(lineGroup);
  });
};

/**
 * 用于构建Sprite，显示空间标识；
 */
const createSpriteNode = function (spriteText, textPosition) {
  this.canvas2d.width = 600;
  this.canvas2d.height = 600;
  const mCanvas = this.canvas2d;
  console.log(this.canvas2d, 'this.canvas2d');
  console.log(this.canvas, 'this.canvas');
  const ctx = this.canvas2d.getContext('2d');
  ctx.font = '65px Arial';
  ctx.fillStyle = '#F15F09';
  let width = ctx.measureText(spriteText).width;

  ctx.clearRect(0, 0, mCanvas.width, mCanvas.height);
  ctx.fillText(spriteText, (mCanvas.width - width) / 2, mCanvas.height / 2);
  let texture = new this.THREE.Texture(mCanvas);
  texture.name = spriteText;
  texture.needsUpdate = true;

  let material = new this.THREE.SpriteMaterial({ map: texture });
  material.sizeAttenuation = false;
  let mesh = new this.THREE.Sprite(material);
  /**
   * 根据图片的大小调整图片的尺寸；
   */
  mesh.scale.set(AR_MODEL_DEF_SCALE * 10, AR_MODEL_DEF_SCALE * 10, AR_MODEL_DEF_SCALE * 10);
  mesh.position.copy(textPosition);
  mesh.name = 'textMesh';
  return mesh;
};

/**
 * 初始化光线
 */
export const initLight = function () {
  // 平行光
  const directionalLight = new this.THREE.DirectionalLight(0xffffff, 0.5);
  this.scene.add(directionalLight);

  // 环境光
  const ambienLight = new this.THREE.AmbientLight(0xffffff, 0.5);
  this.scene.add(ambienLight);
};
