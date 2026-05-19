export default [
  {
    id: 'g1',
    name: '工作',
    order: 0,
    sites: [
      { id: 's1', title: 'GitHub', url: 'https://github.com' },
      { id: 's2', title: '飞书', url: 'https://feishu.cn' },
      { id: 's3', title: 'Jira', url: 'https://jira.com' },
      { id: 's4', title: 'Slack', url: 'https://slack.com' },
    ],
  },
  {
    id: 'g2',
    name: '开发工具',
    order: 1,
    sites: [
      { id: 's5', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { id: 's6', title: 'npm', url: 'https://npmjs.com' },
      { id: 's7', title: 'MDN', url: 'https://developer.mozilla.org' },
      { id: 's8', title: 'Vite', url: 'https://vite.dev' },
      { id: 's9', title: 'Vue 3', url: 'https://vuejs.org' },
    ],
  },
  {
    id: 'g3',
    name: '社交',
    order: 2,
    sites: [
      { id: 's10', title: '知乎', url: 'https://zhihu.com' },
      { id: 's11', title: 'B 站', url: 'https://bilibili.com' },
      { id: 's12', title: '微博', url: 'https://weibo.com' },
    ],
  },
  {
    id: 'g4',
    name: 'AI',
    order: 3,
    sites: [
      { id: 's13', title: 'ChatGPT', url: 'https://chat.openai.com' },
      { id: 's14', title: 'Claude', url: 'https://claude.ai' },
      { id: 's15', title: '通义千问', url: 'https://tongyi.aliyun.com' },
    ],
  },
]

export const mockCredentials = {
  s1: { username: 'myaccount@github.com', password: 'ghp_demo_token_123' },
  s2: { username: 'my@company.com', password: 'Feishu@2024' },
  s5: { username: 'stack_user_123', password: 'StackPass!456' },
  s8: { username: 'npm_user', password: 'Npm@789' },
  s13: { username: 'demo@openai.com', password: 'GPT-Demo-567' },
}
