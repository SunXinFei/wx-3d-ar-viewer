module.exports = Object.assign(
  {},
  {
    parserPreset: {
      parserOpts: {
        headerPattern: /^(\w*|[\u4e00-\u9fa5]*)(?:[\(\（](.*)[\)\）])?[\:\：] (.*)/,
        headerCorrespondence: ['type', 'scope', 'subject'],
        referenceActions: [
          'close',
          'closes',
          'closed',
          'fix',
          'fixes',
          'fixed',
          'resolve',
          'resolves',
          'resolved'
        ],
        issuePrefixes: ['#'],
        noteKeywords: ['BREAKING CHANGE', '不兼容变更'],
        fieldPattern: /^-(.*?)-$/,
        revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
        revertCorrespondence: ['header', 'hash'],
        warn() {},
        mergePattern: null,
        mergeCorrespondence: null
      }
    },
    rules: {
      /**
       * How to handle violation of rule
       * 0 - ignore
       * 1 - warn
       * 2 - throw
       */
      /**
       * Application of rule
       * always - positive
       * never - negative
       */
      // Value：用于这条规则的值。
      'subject-empty': [2, 'never'],
      'type-empty': [2, 'never'],
      'scope-empty': [2, 'never'],
      'type-enum': [
        2,
        'always',
        [
          '需求',
          '缺陷',
          '优化',
          '重构',
          '文档',
          '构建',
          '格式',
          '测试',
          'changelog',
          'ignore',
          'docs',
          'build',
          'release',
          'feat',
          'fix',
          'docs',
          'style',
          'refactor',
          'perf',
          'test',
          'chore',
          'revert'
        ]
      ]
    }
  }
);
