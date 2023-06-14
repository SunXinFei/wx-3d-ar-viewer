/**
 * 微信AR
 * 基于threejs-miniprogram
 */
import { registerGLTFLoader } from '../loaders/gltf-loader.js';
import { initLoader, initLight } from '../commonAr';
import registerObjectControls from '../controls/ObjectControlsWx';
const { createScopedThreejs } = require('../lib/threejs-miniprogram.js');
import { Version, SDKName } from '../../version.js';
import { ERROR_TYPE_ENUM, AR_MIN_ZOOM, AR_MAX_ZOOM, AR_NEAR, AR_FAR } from '../constant';
const FPS = 40; //设置40，考虑函数执行时间，实际执行效果为30频率

export class wxAR {
  constructor({
    modelUrl,
    canvas,
    pixelRatio,
    onModelProgress,
    onModelLoaded,
    onError,
    onChangeModelStatus,
    onScaleNumChange,
    onScaleNumChangeEnd
  }) {
    console.log(`Name: ${SDKName}, Module: wxAR ,Version: ${Version}`);
    console.log('wxAR-init');
    this.initStartTime = new Date().getTime(); // 起始时间
    this.onModelProgress = onModelProgress;
    this.onModelLoaded = onModelLoaded;
    this.onError = onError;
    this.onChangeModelStatus = onChangeModelStatus; // 当模型状态修改
    this.onScaleNumChange = onScaleNumChange; // 缩放百分比变化回调
    this.onScaleNumChangeEnd = onScaleNumChangeEnd; // 缩放百分比变化结束回调
    this.modelUrl = modelUrl;
    this.isPoint = false; // 是否标定模型位置
    this.disposing = false; // 是否正在销毁
    this.canvas = canvas; // webgl渲染
    // this.canvas2d = canvas2d; // 图片渲染
    const THREE = (this.THREE = createScopedThreejs(this.canvas));
    this.pixelRatio = pixelRatio || 2;
    this.beginModelLoad = false; // 模型是否开始加载
    // 初始化THREE
    this._initTHREE();

    // 初始化加载器
    registerGLTFLoader(THREE);

    // 打印THREE版本号
    console.log(THREE.REVISION, 'three');

    this.modelUrl = modelUrl;
    // 光标加载
    // initCursorPointer.call(this);

    // 加载
    if (this.modelUrl) initLoader.call(this, this._initVK.bind(this));

    // 初始化摄像头纹理
    this._initGL();

    // 开启调试
    // openDebugger.call(this)
  }

  /**
   * 坚持是否可以使用AR
   */
  static checkCanIUse() {
    if (wx.canIUse('createVKSession')) {
      return true;
    }
    return false;
  }

  /**
   * 资源释放
   */
  dispose() {
    this.disposing = true;
    if (this.initStartTime) this.initStartTime = null;
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    try {
      if (this.markerGroup) {
        (this.markerGroup.children || []).forEach((group) => {
          (group.children || []).forEach((model) => {
            model.traverse((mesh) => {
              this._disposeMesh(mesh);
            });
          });
        });
        // 移除
        let children = [];
        this.markerGroup.traverse((child) => {
          children.push(child);
        });
        children.forEach((child) => {
          if (child.parent && child.parent.remove) {
            child.parent.remove(child);
            console.log(child.name, '移除');
          }
        });
        children.length = 0;
      }

      if (this.reticle) {
        // 移除
        let children = [];
        this.reticle.traverse((mesh) => {
          children.push(mesh);
          if (mesh.type === 'Mesh' || mesh.type === 'LineSegments') {
            this._disposeMesh(mesh);
          }
        });
        children.forEach((child) => {
          if (child.parent && child.parent.remove) {
            child.parent.remove(child);
            console.log(child.name, '移除');
          }
        });
        children.length = 0;
      }
    } catch (e) {
      console.log(e, 'error!');
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement = null;
      this.renderer = null;
      console.log('释放renderer');
    }
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
      console.log('释放scene');
    }
    if (this.camera) this.camera = null;
    if (this.reticle) this.reticle = null;
    if (this.markerGroup) this.markerGroup = null;
    if (this.directionalLight) this.directionalLight = null;
    if (this.mixers) {
      this.mixers.forEach((mixer) => mixer.uncacheRoot(mixer.getRoot()));
      this.mixers = null;
    }

    if (this.THREE) this.THREE = null;
    if (this._program && this._program.gl) {
      this._program.gl.deleteProgram(this._program);
      this._program = null;
      console.log('释放_program');
    }
    if (this.session) {
      this.session.cancelAnimationFrame(this.requestFrameId);
      this.session.stop();
      this.session.destroy();
      this.session = null;
      this.requestFrameId = null;
      console.log('释放session');
    }

    if (this.clock) {
      this.clock.stop();
      this.clock = null;
      console.log('释放clock');
    }

    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas.ownerDocument = null;
      this.canvas = null;
      console.log('释放canvasWebgl');
    }

    if (this.matrix4) {
      this.matrix4 = null;
      console.log('释放frame的matrix');
    }

    // if (this.systemInfo) this.systemInfo = null;
    if (this.onError) this.onError = null;
    if (this.onModelProgress) this.onModelProgress = null;
    if (this.onModelLoaded) this.onModelLoaded = null;
    if (this.onChangeModelStatus) this.onChangeModelStatus = null;
    if (this.onScaleNumChange) this.onScaleNumChange = null;
    if (this.onScaleNumChangeEnd) this.onScaleNumChangeEnd = null;
    if (this.onScaleNumChangeEnd) this.onScaleNumChangeEnd = null;
    if (this.isPoint) this.isPoint = null;
    if (this.pixelRatio) this.pixelRatio = null;
    if (this.beginModelLoad) this.beginModelLoad = null;
    if (this.modelUrl) this.modelUrl = null;
    if (this.disposing) this.disposing = null;
    console.log('dispose -- 销毁1');
  }

  _disposeMesh(mesh) {
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
    if (mesh.material && mesh.material.roughnessMap) {
      mesh.material.roughnessMap.dispose();
      mesh.material.roughnessMap = null;
      console.log(mesh.name, '释放粗糙纹理');
    }
    if (mesh.material && mesh.material.bumpMap) {
      mesh.material.bumpMap.dispose();
      mesh.material.bumpMap = null;
      console.log(mesh.name, '释放凹凸纹理');
    }
    if (mesh.material && mesh.material.emissiveMap) {
      mesh.material.emissiveMap.dispose();
      mesh.material.emissiveMap = null;
      console.log(mesh.name, '释放发光纹理');
    }
    if (mesh.material && mesh.material.metalnessMap) {
      mesh.material.metalnessMap.dispose();
      mesh.material.metalnessMap = null;
      console.log(mesh.name, '释放金属纹理');
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
  _initTHREE() {
    //开启定时器
    this.clock = new this.THREE.Clock();
    this.clock.start();
    // 相机
    this.camera = new this.THREE.Camera();

    // 解构frame用
    this.matrix4 = new this.THREE.Matrix4();

    // 场景
    this.scene = new this.THREE.Scene();

    // 光线初始化
    initLight.call(this);

    // 渲染层
    const renderer = (this.renderer = new this.THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    }));

    // 开启阴影
    // if (this.openShadow) {
    //   renderer.shadowMap.enabled = true;
    //   renderer.shadowMap.autoUpdate = false;
    //   renderer.shadowMap.needsUpdate = true;
    //   renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
    // }

    //
    renderer.toneMapping = this.THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.5;
    // 该版本three不支持outputEncoding，需要用gamma校正
    // renderer.outputEncoding = this.THREE.sRGBEncoding;
    // 抗锯齿，同时防止过大影响性能，防止安卓机器3.5等数值
    this.pixelRatio = Math.min(3, this.pixelRatio);
    renderer.setPixelRatio(this.pixelRatio);

    renderer.outputEncoding = this.THREE.sRGBEncoding;
    // renderer.gammaOutput = true;
    // renderer.gammaFactor = 2.2;
  }

  /**
   * 查看内存占用情况
   */
  viewWebglRenderInfo() {
    console.log(this.renderer.info);
  }

  /**
   *
   */
  _initVK() {
    // 校验是否支持VK
    if (!wxAR.checkCanIUse()) {
      this.onError && this.onError(ERROR_TYPE_ENUM['WX_VK_ERROR']);
      return;
    }
    // 创建 session 对象
    const session = (this.session = wx.createVKSession({
      track: {
        plane: { mode: 1 }
      }
    }));

    session.start((err) => {
      if (err) {
        this.onError && this.onError(ERROR_TYPE_ENUM['WX_VK_START_ERROR']);
        return console.log('VK error: ', err);
      }
      // debug调试，查看减帧效果
      // let oldTime = (new Date()).valueOf()
      // let val = 0
      let timeS = 0;
      // 逐帧渲染
      const onFrame = () => {
        if (!this.disposing) {
          this.requestFrameId = session.requestAnimationFrame(onFrame);
          timeS = this.clock && this.clock.getDelta() + timeS;

          // debug调试，查看减帧效果
          // if (timeS > (1 / FPS)) {
          //   if ((new Date()).valueOf() - oldTime <= 1000) {
          //     console.log(++val)
          //   }
          // }
          // if ((new Date()).valueOf() - oldTime > 1000) {
          //   oldTime = (new Date()).valueOf()
          //   val = 0
          // }

          // 开发者可以自己控制帧率
          if (timeS > 1 / FPS && !this.disposing) {
            const frame = session.getVKFrame(this.canvas.width, this.canvas.height);
            if (frame) {
              this._renderFrame(frame);
            }
            timeS = 0;
          }
        }
      };
      onFrame();
      // 成功回调
      this.onModelLoaded && this.onModelLoaded();
    });
  }

  /**
   *
   * @param {*} frame
   */
  _renderFrame(frame) {
    this._renderGL(frame);

    // 修改光标位置
    // 光标模型存在且没有放置物体则计算光标位置
    if (this.reticle && !this.isPoint) {
      const hitTestRes = this.session.hitTest(0.5, 0.5);
      if (hitTestRes.length) {
        // 获取四维矩阵
        this.matrix4.fromArray(hitTestRes[0].transform);
        // 从四维矩阵提取位置，舍弃scale和rotate
        this.reticle.position.setFromMatrixPosition(this.matrix4);
        this.reticle.visible = true;
      } else {
        // this.reticle.visible = false;
      }
    }
    // 相机
    if (frame.camera) {
      // 更新three.js相机对象的视图矩阵
      this.camera.matrixAutoUpdate = false;
      this.camera.matrixWorldInverse.fromArray(frame.camera.viewMatrix);
      this.camera.matrixWorld.getInverse(this.camera.matrixWorldInverse);

      // 更新three.js相机对象的投影矩阵
      const projectionMatrix = frame.camera.getProjectionMatrix(AR_NEAR, AR_FAR);
      this.camera.projectionMatrix.fromArray(projectionMatrix);
      this.camera.projectionMatrixInverse.getInverse(this.camera.projectionMatrix);
      // 更新摄像头位置
      // this.camera.position.setFromMatrixPosition(this.camera.matrixWorld)
      // console.log(this.camera.position,'this.camera.position')
    }
    // 文字始终朝向camera
    // this.markerGroup.traverse((mesh) => {
    //     if(mesh.type === 'Mesh' && mesh.userData && mesh.userData.rulerType === 'rulerText'){
    //       mesh.lookAt(this.camera.position)
    //     }
    // });
    this._sceneRender();
  }

  /**
   * 初始化控制器
   */
  _initControl() {
    // const { EventDispatcher, MOUSE, Spherical, TOUCH, Vector2, Vector3, Vector4 } = this.THREE;
    const { ObjectControls } = registerObjectControls(
      {
        EventDispatcher: this.THREE.EventDispatcher,
        MOUSE: this.THREE.MOUSE,
        Spherical: this.THREE.Spherical,
        TOUCH: this.THREE.TOUCH,
        Vector2: this.THREE.Vector2,
        Vector3: this.THREE.Vector3,
        Vector4: this.THREE.Vector4,
        Matrix4: this.THREE.Matrix4
      },
      {
        minZoom: AR_MIN_ZOOM,
        maxZoom: AR_MAX_ZOOM,
        screenWidth: this.canvas.width / this.pixelRatio,
        screenHeight: this.canvas.height / this.pixelRatio,
        camera: this.camera,
        handleTouchMoveDollyZooming: this._handleTouchMoveDollyZooming.bind(this), //双指缩放中
        handleTouchMoveDollyZoomEnd: this._handleTouchMoveDollyZoomEnd.bind(this), // 双指缩放结束
        handleTouchMoveDollyPanEnd: this._handleTouchMoveDollyPanEnd.bind(this), // 双指平移结束
        handleTouchMoveRotateEnd: this._handleTouchMoveRotateEnd.bind(this) // 单指旋转结束
      }
    );
    // 控制器
    const controls = new ObjectControls(this.markerGroup, this.canvas);
    this.controls = controls;
  }

  /**
   * 单指旋转结束回调
   */
  _handleTouchMoveRotateEnd() {}

  /**
   * 双指平移结束回调
   */
  _handleTouchMoveDollyPanEnd() {}

  /**
   * 双指缩放回调函数
   */
  _handleTouchMoveDollyZooming(scale) {
    if (this.onScaleNumChange) {
      this.onScaleNumChange({
        scale
      });
    }
  }

  /**
   * 双指缩放结束回调
   */
  _handleTouchMoveDollyZoomEnd() {
    // 光标大小和模型保持一致
    this.reticle.scale.copy(this.markerGroup.scale);
    // 触发回调
    if (this.onScaleNumChangeEnd) {
      this.onScaleNumChangeEnd();
    }
  }

  /**
   * 重置平面
   */
  onResetPanel() {
    this.isPoint = false;
    this.markerGroup.visible = false;
    this.reticle.visible = true;
    // 重新识别平面
    this.session.hitTest(0.5, 0.5, true);
    // 通知业务方状态值修改
    this.onChangeModelStatus &&
      this.onChangeModelStatus({
        isModelOnPanel: this.markerGroup.visible //模型是否已放置平面
      });
    // 震动提醒
    try {
      wx.vibrateShort({ type: 'light' });
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * 重新加载模型
   */
  refreshModelLoad() {
    if (this.modelUrl) initLoader.call(this, this._initVK.bind(this));
  }

  /**
   * 获取模型的一些状态值
   */
  getModelStatus() {
    return {
      isModelOnPanel: this.markerGroup.visible //模型是否已放置平面
    };
  }

  /**
   * 创建webgl着色器
   */
  _initGL() {
    const gl = this.renderer.getContext();
    const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const vs = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        uniform mat3 displayTransform;
        varying vec2 v_texCoord;
        void main() {
          vec3 p = displayTransform * vec3(a_position, 0);
          gl_Position = vec4(p, 1);
          v_texCoord = a_texCoord;
        }
      `;
    const fs = `
        precision highp float;

        uniform sampler2D y_texture;
        uniform sampler2D uv_texture;
        varying vec2 v_texCoord;
        void main() {
          vec4 y_color = texture2D(y_texture, v_texCoord);
          vec4 uv_color = texture2D(uv_texture, v_texCoord);

          float Y, U, V;
          float R ,G, B;
          Y = y_color.r;
          U = uv_color.r - 0.5;
          V = uv_color.a - 0.5;
          
          R = Y + 1.402 * V;
          G = Y - 0.344 * U - 0.714 * V;
          B = Y + 1.772 * U;
          
          gl_FragColor = vec4(R, G, B, 1.0);
        }
      `;
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vs);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fs);
    gl.compileShader(fragShader);

    const program = (this._program = gl.createProgram());
    this._program.gl = gl;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const uniformYTexture = gl.getUniformLocation(program, 'y_texture');
    gl.uniform1i(uniformYTexture, 5);
    const uniformUVTexture = gl.getUniformLocation(program, 'uv_texture');
    gl.uniform1i(uniformUVTexture, 6);

    gl.useProgram(currentProgram);
  }

  /**
   * 将YUV格式图像转换为RGB格式图像
   * @param {*} frame
   */
  _renderGL(frame) {
    const gl = this.renderer.getContext();
    // 解决安卓机器花屏问题
    gl.disable(gl.DEPTH_TEST);
    // 从AR帧图像中获取YUV格式图像
    const { yTexture, uvTexture } = frame.getCameraTexture(gl, 'yuv');
    // 获取YUV格式纹理图像的调整矩阵
    const displayTransform = frame.getDisplayTransform();

    if (yTexture && uvTexture) {
      const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
      const currentTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
      gl.useProgram(this._program);

      const posAttr = gl.getAttribLocation(this._program, 'a_position');
      const pos = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pos);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
        gl.STATIC_DRAW
      );
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posAttr);

      const texcoordAttr = gl.getAttribLocation(this._program, 'a_texCoord');
      const texcoord = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoord);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(texcoordAttr, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(texcoordAttr);

      const dt = gl.getUniformLocation(this._program, 'displayTransform');
      gl.uniformMatrix3fv(dt, false, displayTransform);

      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

      gl.activeTexture(gl.TEXTURE0 + 5);
      gl.bindTexture(gl.TEXTURE_2D, yTexture);

      gl.activeTexture(gl.TEXTURE0 + 6);
      gl.bindTexture(gl.TEXTURE_2D, uvTexture);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.useProgram(currentProgram);
      gl.activeTexture(currentTexture);
    }
    // 解决穿模问题
    gl.enable(gl.DEPTH_TEST);
  }

  /**
   * 事件
   * @param {} e
   */
  dispatchTouchEvent(e) {
    // 光标处放一个模型
    if (
      e.type === 'touchend' &&
      this.scene &&
      this.reticle &&
      this.markerGroup &&
      this.isPoint === false
    ) {
      if (this.markerGroup.visible === false) {
        this.markerGroup.visible = true;
      }
      // 震动提醒
      try {
        wx.vibrateShort({ type: 'light' });
      } catch (e) {
        console.log(e);
      }
      this.markerGroup.position.copy(this.reticle.position);
      this.markerGroup.rotation.copy(this.reticle.rotation);
      this.reticle.visible = false;
      this.isPoint = true;
      // 通知业务方状态值修改
      this.onChangeModelStatus &&
        this.onChangeModelStatus({
          isModelOnPanel: this.markerGroup.visible //模型是否已放置平面
        });
      // 控制器
      if (!this.controls) {
        this._initControl();
      }
    }

    // 模型已摆放
    if (this.markerGroup && this.isPoint && this.reticle) {
      this.canvas.dispatchTouchEvent(e);
    }
  }

  // resetSize({ canvasWidth, canvasHeight }) {
  //   this.camera.aspect = canvasWidth / canvasHeight;
  //   this.camera.updateProjectionMatrix();
  //   this.renderer.setSize(canvasWidth, canvasHeight);
  // }

  _sceneRender() {
    // 清除颜色缓存
    this.renderer.autoClearColor = false;
    this.renderer.render(this.scene, this.camera);
    // 保留模型的正面和背面
    this.renderer.state.setCullFace(this.THREE.CullFaceNone);
  }
}
