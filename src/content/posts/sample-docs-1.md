---
title: 示例：怎么在这个站点写新内容
date: 2026-10-25
kind: docs
summary: 在 src/content/posts 下新建 .md，用 kind 决定它出现在哪个栏目。
draft: true
tags: [sample, meta]
---

## 新建一篇

在 `src/content/posts/` 下新建一个 `.md` 文件，frontmatter 如下：

```yaml
---
title: 标题
date: 2026-10-28
kind: log        # blog | log | docs | daily | reading
summary: 一句话摘要
tags: [tag1, tag2]
---
```

`git push` 之后，GitHub Actions 会自动构建并部署。
