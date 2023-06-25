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

Bugs:
- [x] ~~解决小米10花屏问题~~
- [x] ~~解决AR场景性能问题，容易崩溃~~


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