import { defineConfig } from 'astro/config';

// GitHub Pages: 用户站点 (<user>.github.io) 不需要 base；项目站点需要把 base 设成 '/<repo>'
// 通过环境变量覆盖，deploy workflow 里会设置。
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.SITE_BASE || '/',
  devToolbar: { enabled: false },
});
