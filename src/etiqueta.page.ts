import slug from "./_data/slug.ts";

export const layout = "layouts/tag.vto";
export const type = "tag";

type Post = { tags?: string[]; date?: Date };

export default function* ({ search }: Lume.Data) {
  const groups = new Map<string, { variants: Map<string, number>; posts: Set<Post> }>();

  for (const post of search.pages("type=post") as Post[]) {
    for (const tag of post.tags || []) {
      if (tag === "post") continue;
      const tagSlug = slug(tag);
      if (!tagSlug) continue;
      let group = groups.get(tagSlug);
      if (!group) {
        group = { variants: new Map(), posts: new Set() };
        groups.set(tagSlug, group);
      }
      group.variants.set(tag, (group.variants.get(tag) || 0) + 1);
      group.posts.add(post);
    }
  }

  for (const [tagSlug, group] of groups) {
    const canonical = [...group.variants.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))[0][0];

    const posts = [...group.posts].sort(
      (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0),
    );

    yield {
      url: `/etiqueta/${tagSlug}/`,
      title: `Etiqueta: ${canonical}`,
      tag: canonical,
      posts,
      section_mark: `Etiqueta · ${canonical}`,
      description: `Entradas etiquetadas con #${canonical} en PAIGAR.`,
    };
  }
}
