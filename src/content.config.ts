import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 所有内容放 src/content/posts/*.md，用 kind 区分归属哪个栏目。
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    kind: z.enum(['blog', 'log', 'docs', 'daily', 'reading']),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// 首页面板里的文字：src/content/home/work.md 和 off.md，直接用 Markdown 写。
const home = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/home' }),
});

export const collections = { posts, home };
