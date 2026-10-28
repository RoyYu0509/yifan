import { getCollection } from 'astro:content';
import { worlds, type WorldId } from './worlds';

// 还没有文章的栏目先不出现在导航里，发布第一篇之后自动出现。
export async function visibleSections(world: WorldId) {
  const posts = await getCollection('posts', (e) => !e.data.draft);
  return worlds[world].sections.filter((s) => !s.kind || posts.some((p) => p.data.kind === s.kind));
}
