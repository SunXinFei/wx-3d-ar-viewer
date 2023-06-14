const compareFunc = require('compare-func');
const readFileSync = require('fs').readFileSync;
const join = require('path').join;
module.exports = {
  writerOpts: {
    // 详细api查看 https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-writer
    transform: (commit, context) => {
      let discard = true;
      const issues = [];

      if (commit.header) {
        try {
          const tmp1Arr = commit.header.split(':');
          commit.type = tmp1Arr[0].split('(')[0];
          commit.scope = tmp1Arr[0].split('(')[1].split(')')[0];
          commit.subject = tmp1Arr[1];
        } catch (e) {
          console.log(commit.header, '此次提交不在规范内');
          discard = true;
          return;
        }
      }

      commit.notes.forEach((note) => {
        note.title = 'BREAKING CHANGES';
        discard = false;
      });

      switch (commit.type) {
        case 'feature':
        case 'feat':
        case '需求':
          commit.type = '✨ Features | 新功能';
          break;
        case 'fix':
        case '缺陷':
          commit.type = '🐛 Bug Fixes | Bug 修复';
          break;
        case 'perf':
        case '优化':
          commit.type = '⚡ Performance Improvements | 性能/体验优化';
          break;
        case 'docs':
        case '文档':
          commit.type = '📝 Documentation | 文档';
          break;
        case '格式':
        case 'style':
          commit.type = '💄 Styles | 风格';
          break;
        case '重构':
        case 'refactor':
          commit.type = '♻ Code Refactoring | 代码重构';
          break;
        case '测试':
        case 'test':
          commit.type = '✅ Tests | 测试';
          break;
        case '构建':
        case 'build':
          commit.type = '👷‍ Build System | 构建';
          break;
        case 'changelog':
        case 'ignore':
          return;
      }

      if (commit.scope === '*') {
        commit.scope = '';
      }
      if (typeof commit.hash === 'string') {
        commit.hash = commit.hash.substring(0, 7);
      }
      if (typeof commit.subject === 'string') {
        let url = context.repository
          ? `${context.host}/${context.owner}/${context.repository}`
          : context.repoUrl;
        if (url) {
          url = `${url}/issues/`;
          // Issue URLs.
          commit.subject = commit.subject.replace(/#([0-9]+)/g, (_, issue) => {
            issues.push(issue);
            return `[#${issue}](${url}${issue})`;
          });
        }
        if (context.host) {
          // User URLs.
          // commit.subject = commit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9/]){0,38})/g, (_, username) => {
          //   console.log(username,'username')
          //   if (username.includes('/')) {
          //     return `@${username}`
          //   }
          //   let uGitId = '某某某'
          //   try{
          //     uGitId = commit.authorEmail.split('@')[0]
          //   }catch(e){
          //     console.log(commit.authorEmail, '该用户不符合规范')
          //   }
          //   return
          // })
          let uGitId = '某某某';
          try {
            uGitId = commit.authorEmail.split('@')[0];
          } catch (e) {
            console.log(commit.authorEmail, '该用户不符合规范');
          }
          // commit.subject = `${commit.subject}${`[@${commit.authorName}](${context.host}/${uGitId})`}`
        }
      }
      // issue结尾数据处理
      commit.references = commit.references.map((reference) => {
        return {
          action: 'Closes',
          owner: null,
          repository: null,
          issue: reference.issue,
          raw: `#${reference.issue}`
        };
      });
      context.issueHost = 'https://github.com/';
      return commit;
    },
    groupBy: 'type',
    commitGroupsSort: 'title',
    commitsSort: ['scope', 'subject'],
    noteGroupsSort: 'title',
    notesSort: compareFunc,
    commitPartial: readFileSync(join(__dirname, 'changelog-commit.hbs'), 'utf-8') // 模版文件中@root表示context，this表示commit.reference
  }
};
