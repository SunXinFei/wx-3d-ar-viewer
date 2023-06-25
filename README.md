## wx-3d-ar-viewer
微信原生小程序中的ar与3d能力实践
Practical Application of AR and 3D Capability in WeChat Mini Programs

Features:
- [x] AR场景支持文字标尺
- [x] AR场景支持自定义光标表示模型大小
- [x] AR场景支持双指缩放和单指旋转
- [x] AR场景支持进场动画
- [x] AR场景支持事件回调，展示模型缩放比例
- [x] 3D场景支持camera最佳视角
- [x] 支持垃圾回收

Bugs:
- [x] ~~解决小米10花屏问题~~
- [x] ~~解决AR场景性能问题（控制帧率、垃圾回收等），容易崩溃~~
- [ ] 新版本中，AR场景的双指平移手势会推动canvas画布

## 小程序AR的Threejs
- threejs-miniprogram默认为108版本，本项目AR将threejs版本从r108升级到r117
- 并且通过单独升级threejs的r125中的4个normal-shader在threejs-miniprogram中，修复没有预先计算切线的法线贴图引起的模型黑边问题，具体为：threejs的r125会有normalMap黑边问题，而r126没有原因是，在https://github.com/mrdoob/three.js/compare/r125...r126#diff-0ef3a127f3d8eaf75269887ebb9da53c45aa287c14fc79b687c3dcfcd5d95cd9 这次代码提交里面可以看到normal shader相关的变化，解决的问题是：// Normal Mapping Without Precomputed Tangents // http://www.thetenthplanet.de/archives/1180
解决方案： 将threejs-miniprogram/node_modules/three/build/three.js中的shader进行r126版本替换，然后进行`npm run build`编译
或者将threejs-miniprogram编译后的产物：threejs-miniprogram.js直接进行shader替换
- threejs的118版本，会导致微信的vksession闪退，这也是为什么three-platformize项目在AR中崩溃的原因。见：[微信小程序createVKSession崩溃WebGLRenderer](https://github.com/deepkolos/three-platformize/issues/25)
- 将r138版本的gltfloader进行threejs的r117的小程序适配改造

## npm包开发规范
生成测试包：`npm version prerelease --preid=beta`

发布测试包： `npm publish --tag beta`

发布正式包：
```
npm version patch 
npm publish
```

查看tag列表：`npm dist-tag ls`
查看npm包信息：`npm info`

## 提交代码
`npm run commit`

## 本地开发
在项目中使用`npm link`