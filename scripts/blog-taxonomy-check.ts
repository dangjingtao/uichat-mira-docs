import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { requireBlogCategory } from "../src/content/blog-taxonomy";

function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory()
      ? markdownFiles(path)
      : entry.name.endsWith(".md")
        ? [path]
        : [];
  });
}

export function blogTaxonomyCheck(blogsRoot: string) {
  return {
    name: "blog-taxonomy-check",
    buildStart(this: { error(message: string): never }) {
      for (const file of markdownFiles(blogsRoot)) {
        const relative = file.slice(blogsRoot.length + 1).replace(/\\/g, "/");
        const directory = relative.split("/")[0];
        const source = readFileSync(file, "utf8");
        const group = source.match(/^group:\s*(.+)$/m)?.[1]?.trim();

        if (!group) this.error(`博客缺少 group：${relative}`);

        let category;
        try {
          category = requireBlogCategory(group);
        } catch {
          this.error(`博客分类未登记：${relative}，group 为“${group}”`);
        }

        if (directory !== category.directory) {
          this.error(
            `博客目录与分类不一致：${relative}，group “${group}” 必须位于 blogs/${category.directory}/。`,
          );
        }
      }
    },
  };
}
