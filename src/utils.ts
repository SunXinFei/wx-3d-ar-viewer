/**
 * 四舍五入保留 指定位数 小数 P0
 * @param v 点
 * @param precision 精度
 */
export const toFixed = (v, precision = 2) =>
  v.fromArray(v.toArray().map((_) => parseFloat(_.toFixed(precision))));

/**
 * 根据四元素获取lookat
 * @param quaternion 四元素
 */
export function getLookAt(quaternion) {
  // @ts-ignore
  const vector = new this.THREE.Vector3(0, 0, -1);
  vector.applyQuaternion(quaternion);
  return toFixed(vector);
}

/**
 *
 * @param {Number} x 屏幕坐标 x
 * @param {Number} y 屏幕坐标 y
 * @param {Document} domContainer 存放元素的容积
 * @param {PerspectiveCamera} camera 相机
 * @param {Number} targetZ  z轴 默认为0
 */
export function screenPointToThreeCoords() {
  // @ts-ignore
  const raycaster = new this.THREE.Raycaster();
  return function screenPointToThreeCoords2({ x, y }, camera, target) {
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera({ x, y }, camera);
    // 计算物体和射线的焦点
    const intersect = raycaster.intersectObject(target);
    return intersect;
  };
}

/**
 * 根据当前模型
 * 计算camera位置和lookAt位置
 * @param boxHelper
 * @param model
 * @param VFov camera的fov（垂直）
 * @param aspect canvas比例尺
 * @return {lookPos,cameraPos,distance} distance: camera到物体距离
 */
export function calculatePos(boxHelper, model, VFov = 45, aspect = 1) {
  const { center, radius } = boxHelper.geometry.boundingSphere;
  // boxHelper.geometry.computeBoundingBox();
  // const { x: xLength } = boxHelper.geometry.boundingBox.max; // 取物体的横向边长
  // 计算水平Fov
  const HFov = (2 * Math.atan(Math.tan((VFov * Math.PI) / 180 / 2) * aspect) * 180) / Math.PI;
  // 取直角三角形的斜边边长为摄像头距离，直角三角形为视锥体与球相切
  const zEye = Math.abs(radius) / Math.sin(((HFov / 2) * Math.PI) / 180);
  // @ts-ignore
  const cameraPos = new this.THREE.Vector3(
    center.x + model.position.x,
    center.y + model.position.y,
    zEye
  );
  // @ts-ignore
  const lookPos = new this.THREE.Vector3(
    center.x + model.position.x,
    center.y + model.position.y,
    center.z + model.position.z
  );

  return {
    lookPos,
    cameraPos,
    distance: zEye,
    modelRadius: radius
  };
}

/**
 * 对比位置信息是否相同
 * @param pos1 Vector3
 * @param pos2 Vector3
 * @param bool 是否相同
 */
export const diffVector3 = (pos1, pos2, precision = 2) => {
  const fixedPos1 = toFixed(pos1, precision);
  const fixedPos2 = toFixed(pos2, precision);
  if (fixedPos1.x !== fixedPos2.x || fixedPos1.y !== fixedPos2.y || fixedPos1.z !== fixedPos2.z) {
    return true;
  }
  return false;
};

/**
 * 添加实时阴影
 * 对AR性能有影响，
 * @param mRadius 模型半径
 */
export const addShadow = (_this: any, THREE, model, mRadius) => {
  // 模型创造阴影
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
  let modelRadius = 100;
  // 通过包裹盒计算模型半径
  if (mRadius) {
    modelRadius = mRadius;
  } else {
    const boxHelper = new THREE.BoxHelper();
    boxHelper.setFromObject(model);
    modelRadius = boxHelper.geometry.boundingSphere.radius;
  }

  // 创建接收阴影平面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(modelRadius * 2, modelRadius * 2),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25 })
  );
  ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
  ground.position.y = -1;
  ground.receiveShadow = true;
  _this.markerGroup.add(ground);
  // 平行光阴影属性设置
  _this.directionalLight.castShadow = true;
  _this.directionalLight.autoUpdate = false;
  _this.directionalLight.position.set(0, modelRadius, 0);
  _this.directionalLight.shadow.mapSize.x = 128;
  _this.directionalLight.shadow.mapSize.y = 128;
  _this.directionalLight.shadow.camera.top = modelRadius;
  _this.directionalLight.shadow.camera.top = modelRadius;
  _this.directionalLight.shadow.camera.bottom = -modelRadius;
  _this.directionalLight.shadow.camera.left = -modelRadius;
  _this.directionalLight.shadow.camera.right = modelRadius;
};
