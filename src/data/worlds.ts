// 站点有两面：
//   work —— 默认的、面向所有人的专业面 (简历上放这一面)
//   off  —— 藏着的个人面，从画面里的入口进去
// 界面上只用大白话命名，不直接出现任何来源性的词。
export type WorldId = 'work' | 'off';
export type Kind = 'blog' | 'log' | 'docs' | 'daily' | 'reading';

export interface Section {
  slug: string;
  label: string; // 导航上的名字
  title: string; // 页面标题
  desc: string;
  kind?: Kind; // 没有 kind 的是静态页
}

export interface World {
  id: WorldId;
  prefix: string; // 路径前缀
  other: WorldId;
  sections: Section[];
}

export const worlds: Record<WorldId, World> = {
  work: {
    id: 'work',
    prefix: '',
    other: 'off',
    sections: [
      { slug: 'blog', label: 'blog', title: 'Blog', desc: '文章与想法', kind: 'blog' },
      { slug: 'log', label: 'log', title: '学习日志', desc: '每天学了什么', kind: 'log' },
      { slug: 'docs', label: 'docs', title: 'Docs', desc: '技术文档与分享', kind: 'docs' },
      { slug: 'about', label: 'about', title: 'About', desc: '关于我 / 简历' },
    ],
  },
  off: {
    id: 'off',
    prefix: '/after',
    other: 'work',
    sections: [
      { slug: 'daily', label: '日常', title: '日常', desc: '生活里的零碎', kind: 'daily' },
      { slug: 'reading', label: '读过的', title: '读过的', desc: '书、电影、音乐', kind: 'reading' },
      { slug: 'me', label: '关于我', title: '关于我', desc: '工作之外的我' },
    ],
  },
};

export const homeOf = (w: WorldId) => (w === 'work' ? '/' : '/after/');
export const pathOf = (w: WorldId, slug: string) => `${worlds[w].prefix}/${slug}/`;
export const worldOfKind = (k: Kind): WorldId => (k === 'daily' || k === 'reading' ? 'off' : 'work');
