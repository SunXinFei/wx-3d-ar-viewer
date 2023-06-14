module.exports = {
  types: [
    { value: '需求', name: '需求   : 新增加一个功能' },
    { value: '缺陷', name: '缺陷   : 一个 bug 修复' },
    { value: '优化', name: '优化   : 提升性能、体验的代码更改' },
    { value: '文档', name: '文档   : 只有文档发生改变' },
    { value: '构建', name: '构建   : 修改持续集成的配置文件和脚本，增加依赖库' },
    { value: '格式', name: '格式   : 仅仅是对格式进行修改，不改变代码逻辑' },
    { value: '测试', name: '测试   : 增加测试用例，单元测试case' },
    { value: '重构', name: '重构   : 不涉及修复bug和新功能开发的代码更改' },
    { value: 'changelog', name: 'changelog   : 只是changelog提交' }
  ],
  scopes: [
    { name: '3D' },
    { name: 'AR' },
    { name: '文档' },
    { name: '测试' },
    { name: '构建' },
    { name: '格式' }
  ],
  messages: {
    type: '选择你提交的信息类型:',
    scope: '选择本次提交的改变所影响的范围？',
    customScope: '本次提交的改变所影响的范围？',
    subject: '变化描述：\n',
    body: '提供更详细的变更描述 (按 enter 跳过). 使用 "|" 换行：\n',
    breaking: '列出所有的不兼容变更 (按 enter 跳过)：\n',
    footer: '列出此次改动解决的所有 issueId （如："#123, #234"）(按 enter 跳过)：\n',
    confirmCommit: '确认提交以上内容信息？'
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['重构', '构建'],
  breakingPrefix: 'WARNING: ',
  skipQuestions: ['body'],
  subjectLimit: 100,
  breaklineChar: '|',
  footerPrefix: 'issue'
};
