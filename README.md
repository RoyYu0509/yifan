# Yifan — personal site

Astro 静态站点，部署在 GitHub Pages。

## 目录结构

```
src/
  content/home/*.md    首页面板里的文字 (work.md / off.md)，直接用 Markdown 写
  data/profile.ts      简历数据 (目前页面没用到，留作备用)
  data/site.ts         站名、简介、简历 PDF 的文件名
  data/worlds.ts       栏目配置 (导航里有哪些栏目)
  data/bgm.ts          背景音乐曲目
  content/posts/*.md   所有文章 (blog / log / docs / daily / reading)
  pages/               路由 (文件路径 = URL)
  components/ layouts/ 页面组件
  scripts/scene/       背景像素动画
  styles/global.css    全局样式
public/                原样复制到站点根目录的文件 (favicon、bgm/ 下的 mp3)
.github/workflows/     部署流程 (push 到 main 自动构建并发布)
```

## 日常操作

**写一篇文章**：在 `src/content/posts/` 新建 `xxx.md`：

```yaml
---
title: 标题
date: 2026-10-28
kind: log        # blog | log | docs | daily | reading
summary: 一句话摘要
tags: [tag1, tag2]
draft: false     # true 则不发布
---
正文 (Markdown)
```

某个栏目第一次有文章后，导航里才会出现它。

**改个人信息**：编辑 `src/data/profile.ts`。

**改首页的文字**：编辑 `src/content/home/work.md`（work 面）和 `off.md`（off 面），用 Markdown 写，推送后网页自动更新。内容比面板高时，面板里可以上下滚动。指向本站文件的链接写成 `/resume.pdf` 这样即可（部署时自动补前缀）；指向 `.pdf` 的链接点击后直接下载；邮箱只当文字显示。图片放进 `public/`，用 `![说明](/xxx.png)` 引用。

**更新简历**：把新的 PDF 命名为 `resume.pdf`，覆盖 `public/resume.pdf`，提交并推送即可。首页右上角的 `resume ↓` 和联系方式里的 `Resume ↓` 点击后直接下载（文件名在 `src/data/site.ts` 的 `resumeName`）。公开前请先去掉手机号、年龄、性别、照片这类信息；`site.resume` 留空则不显示入口。

**页面结构**：首页 (`Landing.astro`) 是背景加一个信息面板；点进任何栏目后是只有内容的阅读页，没有背景。

**加背景音乐**：mp3 放进 `public/bgm/`，在 `src/data/bgm.ts` 里登记。

**本地预览**：

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

## 部署原理

GitHub Pages 只是一个**静态文件托管**：它把仓库里「构建好的 HTML/CSS/JS」按路径原样提供出去，自己不运行任何服务器代码。
Astro 项目的源码不能直接被托管，必须先 `npm run build` 得到 `dist/`。这一步由 GitHub Actions 自动完成：

```
git push (main)
  → GitHub Actions 触发 .github/workflows/deploy.yml
  → npm ci && npm run build        (生成 dist/)
  → upload-pages-artifact          (把 dist/ 打包)
  → deploy-pages                   (发布到 Pages)
  → https://<用户名>.github.io
```

需要在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**（只需设置一次）。

- 仓库名为 `<用户名>.github.io` 时，站点在根路径 `https://<用户名>.github.io/`。
- 其它仓库名则在 `https://<用户名>.github.io/<仓库名>/`，此时需要 `base`，workflow 已经通过 `SITE_BASE` 自动传入。

## 排错

- 页面没更新：看仓库的 **Actions** 标签页，找最新一次 workflow，红色即构建失败，点进去看日志。
- 本地能跑、线上 404：多半是路径写死了 `/`，应使用 `import.meta.env.BASE_URL`。
- 构建报 frontmatter 错误：检查 `kind` 是否是 `blog | log | docs | daily | reading` 之一、`date` 格式是否正确。
