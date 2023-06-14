/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author ScieCode / http://github.com/sciecode
 */

const registerObjectControls = (
  THREE,
  customConstantObj = {
    minZoom: Infinity,
    maxZoom: Infinity,
    screenWidth: 0,
    screenHeight: 0,
    camera: null,
    handleTouchMoveDollyZooming: null,
    handleTouchMoveDollyZoomEnd: null,
    handleTouchMoveDollyPanEnd: null
  }
) => {
  // 注意：这里需要外部主动传入THREE的相关类，否则会undefined
  const { EventDispatcher, MOUSE, Spherical, TOUCH, Vector2, Vector3, Vector4 } = THREE;

  // This set of controls performs orbiting, dollying (zooming), and panning.
  // Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
  //
  //    Orbit - left mouse / touch: one-finger move
  //    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
  //    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

  var ObjectControls = function (object, domElement) {
    if (domElement === undefined)
      console.warn('THREE.ObjectControls: The second parameter "domElement" is now mandatory.');
    if (domElement === document)
      console.error(
        'THREE.ObjectControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'
      );

    this.object = object;
    this.domElement = domElement;

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the object orbits around
    this.target = new Vector3();

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = customConstantObj.minZoom || Infinity;
    this.maxZoom = customConstantObj.maxZoom || Infinity;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    this.minAzimuthAngle = -Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false;
    this.dampingFactor = 0.05;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 0.5;

    // Set to false to disable rotating
    this.enableRotate = true;
    this.rotateSpeed = 0.05;

    // Set to false to disable panning
    this.enablePan = true;
    this.panSpeed = 1000;
    this.screenSpacePanning = false; // if true, pan in screen-space
    this.keyPanSpeed = 7.0; // pixels moved per arrow key push

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    // Set to false to disable use of the keys
    this.enableKeys = true;
    // 摄像头
    this.camera = customConstantObj.camera;
    // 屏幕的长宽
    this.screenWidth = customConstantObj.screenWidth;
    this.screenHeight = customConstantObj.screenHeight;
    // 双指缩放回调函数
    this.handleTouchMoveDollyZooming = customConstantObj.handleTouchMoveDollyZooming || null;
    // 双指缩放结束回调函数
    this.handleTouchMoveDollyZoomEnd = customConstantObj.handleTouchMoveDollyZoomEnd || null;
    // 双指平移结束回调函数
    this.handleTouchMoveDollyPanEnd = customConstantObj.handleTouchMoveDollyPanEnd || null;
    // 单指旋转结束回调函数
    this.handleTouchMoveRotateEnd = customConstantObj.handleTouchMoveRotateEnd || null;

    // The four arrow keys
    this.keys = {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      BOTTOM: 40
    };

    // Mouse buttons
    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN
    };

    // Touch fingers
    this.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN
    };

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    //
    // public methods
    //

    this.getPolarAngle = function () {
      return spherical.phi;
    };

    this.getAzimuthalAngle = function () {
      return spherical.theta;
    };

    this.saveState = function () {
      scope.target0.copy(scope.target);
      scope.position0.copy(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };

    this.reset = function () {
      scope.target.copy(scope.target0);
      scope.object.position.copy(scope.position0);
      scope.object.zoom = scope.zoom0;

      scope.object.updateProjectionMatrix();
      scope.dispatchEvent(changeEvent);

      // scope.update();

      state = STATE.NONE;
    };

    // this method is exposed, but perhaps it would be better if we can make it private...

    this.dispose = function () {
      scope.domElement.removeEventListener('touchstart', onTouchStart, false);
      scope.domElement.removeEventListener('touchend', onTouchEnd, false);
      scope.domElement.removeEventListener('touchmove', onTouchMove, false);

      //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
    };

    //
    // internals
    //

    var scope = this;

    var changeEvent = {
      type: 'change'
    };
    var startEvent = {
      type: 'start'
    };
    var endEvent = {
      type: 'end'
    };

    var STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6
    };

    var state = STATE.NONE;

    var EPS = 0.000001;

    // current position in spherical coordinates
    var spherical = new Spherical();
    var sphericalDelta = new Spherical();

    var scale = 1;
    var panOffset = new Vector3();
    var zoomChanged = false;

    var rotateStart = new Vector2();
    var rotateEnd = new Vector2();
    var rotateDelta = new Vector2();

    var panStart = new Vector2();
    var panEnd = new Vector2();
    var panDelta = new Vector2();

    var dollyStart = new Vector2();
    var dollyEnd = new Vector2();
    var dollyDelta = new Vector2();
    // 起始点双指坐标
    var panStartTwoPoints = new Vector4();
    // 结束点双指坐标
    var panEndTwoPoints = new Vector4();
    //  起始与终点点形成向量
    var panStartEndVector1 = new Vector2();
    var panStartEndVector2 = new Vector2();
    // 起始与终止形成的向量，双指的向量夹角
    var panStartEndAngle = 0;

    // 双指平移屏幕坐标
    var panStartScreenVector = new Vector3();
    // 双指平移屏幕坐标
    var panEndScreenVector = new Vector3();
    // 双指平移世界坐标
    var panStartWorldVector = new Vector3();
    // 双指平移世界坐标
    var panEndWorldVector = new Vector3();

    //
    // event callbacks - update the object state
    //

    function handleTouchStartRotate(event) {
      if (event.touches.length == 1) {
        rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
      }
    }

    function handleTouchStartPan(event) {
      if (event.touches.length == 1) {
        panStart.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

        panStart.set(x, y);
      }
    }

    function handleTouchStartDolly(event) {
      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;

      var distance = Math.sqrt(dx * dx + dy * dy);

      dollyStart.set(0, distance);

      panStartTwoPoints.set(
        event.touches[0].pageX,
        event.touches[0].pageY,
        event.touches[1].pageX,
        event.touches[1].pageY
      );
    }

    function handleTouchStartDollyPan(event) {
      if (scope.enableZoom || scope.enablePan) handleTouchStartDolly(event);

      // if (scope.enablePan) handleTouchStartPan(event);
    }

    function handleTouchMoveRotate(event) {
      if (event.touches.length == 1) {
        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      }

      // rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

      // var element = scope.domElement;

      // rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight); // yes, height

      // rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight);

      // scope.object.rotation.y += Math.sign(rotateStart.x - rotateEnd.x) * scope.rotateSpeed;

      scope.object.rotateY(
        ((rotateEnd.x - rotateStart.x) / scope.domElement.clientWidth) * 2 * Math.PI
      );

      rotateStart.copy(rotateEnd);
    }
    /**
     * 计算两个向量夹角
     * @param {*} start
     * @param {*} end
     */
    function vectorUseAngle(start, end) {
      panStartEndVector1.set(start.x, start.y);
      panStartEndVector2.set(end.x, end.y);

      var v1 = panStartEndVector1.normalize();
      var v2 = panStartEndVector2.normalize();

      return (Math.acos(v1.dot(v2)) * 180) / Math.PI;
    }

    function enableZoomCallback() {
      const distanceDelta = dollyEnd.y - dollyStart.y;

      // 防止太小的缩放值抖动
      if (Math.abs(distanceDelta) < 0.5) {
        dollyStart.copy(dollyEnd);
        return;
      }

      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed / 2));
      let scale = Math.max(
        scope.minZoom,
        Math.min(scope.maxZoom, scope.object.scale.multiplyScalar(dollyDelta.y).x)
      );
      scope.object.scale.set(scale, scale, scale);
      dollyStart.copy(dollyEnd);
      // 触发双指缩放回调
      scope.handleTouchMoveDollyZooming && scope.handleTouchMoveDollyZooming(scale);
    }

    function enablePanCallback() {
      // 屏幕坐标转世界坐标
      const x1 = (panStartTwoPoints.x / scope.screenWidth) * 2 - 1;
      const y1 = -(panStartTwoPoints.y / scope.screenHeight) * 2 + 1;
      panStartScreenVector.set(x1, y1, 0.5);
      panStartWorldVector = panStartScreenVector.unproject(scope.camera);
      // 屏幕坐标转世界坐标
      const x2 = (panEndTwoPoints.x / scope.screenWidth) * 2 - 1;
      const y2 = -(panEndTwoPoints.y / scope.screenHeight) * 2 + 1;
      panEndScreenVector.set(x2, y2, 0.5);
      panEndWorldVector = panEndScreenVector.unproject(scope.camera);
      scope.object.position.add(
        panEndWorldVector.clone().sub(panStartWorldVector).multiplyScalar(scope.panSpeed).setY(0)
      );

      panStartTwoPoints.copy(panEndTwoPoints);
    }

    function handleTouchMoveDolly(event) {
      if (event.touches.length === 0 || event.touches.length === 1) return;

      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;

      var distance = Math.sqrt(dx * dx + dy * dy);

      dollyEnd.set(0, distance);

      panEndTwoPoints.set(
        event.touches[0].pageX,
        event.touches[0].pageY,
        event.touches[1].pageX,
        event.touches[1].pageY
      );

      // var distanceDelta = dollyEnd.y - dollyStart.y;

      // var curScale = scope.object.scale;
      // var newScale = curScale.clone();

      // if (distanceDelta > 0) {
      //   // 距离变大，放大
      //   // if (newScale.x - scope.zoomSpeed > scope.maxZoom) return;
      //   // scope.object.scale.set(
      //   //   newScale.x + scope.zoomSpeed,
      //   //   newScale.y + scope.zoomSpeed,
      //   //   newScale.z + scope.zoomSpeed
      //   // );
      // } else if (distanceDelta < 0) {
      //   // 距离变小，缩小
      //   // if (newScale.x - scope.zoomSpeed < scope.minZoom) return;
      //   // scope.object.scale.set(
      //   //   newScale.x - scope.zoomSpeed,
      //   //   newScale.y - scope.zoomSpeed,
      //   //   newScale.z - scope.zoomSpeed
      //   // );

      // }
      // console.log(scope.camera.matrixWorld,'.matrixWorld')
      // 判断是否是平移还是缩放
      panStartEndAngle = vectorUseAngle(
        {
          x: panEndTwoPoints.x - panStartTwoPoints.x,
          y: panEndTwoPoints.y - panStartTwoPoints.y
        },
        {
          x: panEndTwoPoints.z - panStartTwoPoints.z,
          y: panEndTwoPoints.w - panStartTwoPoints.w
        }
      );
      // console.log('panStartEndAngle', panStartEndAngle)
      // 临界条件，判断不出来是缩放还是平移
      if (
        scope.enablePan &&
        scope.enableZoom &&
        (panStartEndAngle == 90 || panStartEndAngle == 135 || panStartEndAngle == 180)
      ) {
        dollyStart.copy(dollyEnd);
        panStartTwoPoints.copy(panEndTwoPoints);
        return;
      }

      if (scope.enablePan && scope.enableZoom) {
        // 第一次双指move。通过角度区分zoom还是pan
        if (panStartEndAngle < 80) {
          scope.enableZoom = false;
          scope.enablePan = true;
        } else {
          scope.enableZoom = true;
          scope.enablePan = false;
        }
      }

      if (scope.enablePan && !scope.enableZoom) {
        // 平移
        enablePanCallback();
      } else if (scope.enableZoom && !scope.enablePan) {
        //缩放
        enableZoomCallback();
      }
    }

    function handleTouchMoveDollyPan(event) {
      if (scope.enableZoom || scope.enablePan) handleTouchMoveDolly(event);

      // if (scope.enablePan) handleTouchMovePan(event);
    }

    function handleTouchEnd(/*event*/) {
      // no-op
      switch (state) {
        case STATE.TOUCH_DOLLY_PAN: // 双指
          if (scope.enableZoom === false && scope.enablePan === false) return;
          if (scope.enableZoom === true && scope.enablePan === false) {
            // 双指缩放结束
            // 触发双指缩放结束回调
            scope.handleTouchMoveDollyZoomEnd && scope.handleTouchMoveDollyZoomEnd();
          }
          if (scope.enableZoom === false && scope.enablePan === true) {
            // 双指平移结束
            // 触发双指平移结束回调
            scope.handleTouchMoveDollyPanEnd && scope.handleTouchMoveDollyPanEnd();
          }
          // 恢复zoom与pan
          scope.enableZoom = true;
          scope.enablePan = true;
          break;
        case STATE.TOUCH_ROTATE: // 单指旋转
          scope.handleTouchMoveRotateEnd && scope.handleTouchMoveRotateEnd();
          break;
      }
    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    function onTouchStart(event) {
      if (scope.enabled === false) return;

      event.preventDefault(); // prevent scrolling

      switch (event.touches.length) {
        case 1:
          switch (scope.touches.ONE) {
            case TOUCH.ROTATE:
              if (scope.enableRotate === false) return;

              handleTouchStartRotate(event);

              state = STATE.TOUCH_ROTATE;

              break;

            default:
              state = STATE.NONE;
          }

          break;

        case 2:
          switch (scope.touches.TWO) {
            case TOUCH.DOLLY_PAN:
              if (scope.enableZoom === false && scope.enablePan === false) return;

              handleTouchStartDollyPan(event);

              state = STATE.TOUCH_DOLLY_PAN;

              break;

            default:
              state = STATE.NONE;
          }

          break;

        default:
          state = STATE.NONE;
      }

      if (state !== STATE.NONE) {
        scope.dispatchEvent(startEvent);
      }
    }

    function onTouchMove(event) {
      if (scope.enabled === false) return;

      event.preventDefault(); // prevent scrolling
      event.stopPropagation();
      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (scope.enableRotate === false) return;

          handleTouchMoveRotate(event);
          // scope.update();

          break;

        case STATE.TOUCH_DOLLY_PAN:
          if (scope.enableZoom === false && scope.enablePan === false) return;
          handleTouchMoveDollyPan(event);
          // scope.update();

          break;

        default:
          state = STATE.NONE;
      }
    }

    function onTouchEnd(event) {
      if (scope.enabled === false) return;

      handleTouchEnd(event);

      scope.dispatchEvent(endEvent);

      state = STATE.NONE;
    }

    //

    scope.domElement.addEventListener('touchstart', onTouchStart, false);
    scope.domElement.addEventListener('touchend', onTouchEnd, false);
    scope.domElement.addEventListener('touchmove', onTouchMove, false);

    // make sure element can receive keys.

    if (scope.domElement.tabIndex === -1) {
      scope.domElement.tabIndex = 0;
    }

    // force an update at start

    // this.update();
  };

  ObjectControls.prototype = Object.create(EventDispatcher.prototype);
  ObjectControls.prototype.constructor = ObjectControls;

  // This set of controls performs orbiting, dollying (zooming), and panning.
  // Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
  // This is very similar to ObjectControls, another set of touch behavior
  //
  //    Orbit - right mouse, or left mouse + ctrl/meta/shiftKey / touch: two-finger rotate
  //    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
  //    Pan - left mouse, or arrow keys / touch: one-finger move

  var MapControls = function (object, domElement) {
    ObjectControls.call(this, object, domElement);

    this.mouseButtons.LEFT = MOUSE.PAN;
    this.mouseButtons.RIGHT = MOUSE.ROTATE;

    this.touches.ONE = TOUCH.PAN;
    this.touches.TWO = TOUCH.DOLLY_ROTATE;
  };

  MapControls.prototype = Object.create(EventDispatcher.prototype);
  MapControls.prototype.constructor = MapControls;

  return {
    ObjectControls,
    MapControls
  };
};

export default registerObjectControls;
