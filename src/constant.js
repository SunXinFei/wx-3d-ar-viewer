// --------- 3D ---------
// camera FOV
export const FOV = 45;
// 3D 近视角
export const NEAR = 0.1;
// 3D 远视角
export const FAR = 1200;
// 最小距离
export const MIN_DISTANCE_SCALE = 300;
// 最大距离
export const MAX_DISTANCE_SCALE = 100;
// ------ 通用 --------
// 错误类型枚举
export const ERROR_TYPE_ENUM = {
  MODEL_AJAX_ERROR: {
    code: 1,
    errorType: 'MODEL_AJAX_ERROR',
    msg: '模型获取失败'
  },
  MODEL_LOADED_ERROR: {
    code: 2,
    errorType: 'MODEL_LOADED_ERROR',
    msg: '模型加载失败'
  },
  WX_VK_ERROR: {
    code: 3,
    errorType: 'WX_Version_VK_ERROR',
    msg: '微信版本太低，不支持vk平面识别'
  },
  WX_VK_START_ERROR: {
    code: 4,
    errorType: 'WX_VK_START_ERROR',
    msg: '微信VK平面识别能力启动失败'
  }
};

// ---- AR -------
// 模型最大缩放值
export const AR_MAX_ZOOM = 2;
// 模型最小缩放值
export const AR_MIN_ZOOM = 0.4;
// 默认缩放值，主要针对SVG等用的真实世界比例，到AR场景需缩小100倍
export const AR_MODEL_DEF_SCALE = 0.01;
// 模型阴影大小倍数（用来精确光标大小）
export const AR_MODEL_SHADOW_SCALE = 1.2;
// AR近视角
export const AR_NEAR = 0.001;
// AR远视角
export const AR_FAR = 1000;
