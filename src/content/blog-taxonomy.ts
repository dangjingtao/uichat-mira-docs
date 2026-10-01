export const blogCategories = [
  { label: "Mira 雷达", directory: "radar", icon: "compass" },
  { label: "工程现场", directory: "engineering", icon: "code" },
  { label: "产品手记", directory: "product-journal", icon: "sparkles" },
  { label: "开发日志", directory: "dev-log", icon: "file" },
] as const;

export type BlogCategory = (typeof blogCategories)[number];
export type BlogCategoryIconKey = BlogCategory["icon"];

const categoryByLabel = new Map<string, BlogCategory>(
  blogCategories.map((category) => [category.label, category]),
);

export function getBlogCategory(label: string): BlogCategory | undefined {
  return categoryByLabel.get(label);
}

export function requireBlogCategory(label: string): BlogCategory {
  const category = getBlogCategory(label);
  if (!category) throw new Error(`Unknown blog category: ${label}`);
  return category;
}

export function orderBlogCategories(groups: Iterable<string>): string[] {
  const categoryRank = new Map(
    blogCategories.map((category, index) => [category.label, index]),
  );
  return [...new Set(groups)]
    .filter(Boolean)
    .sort((left, right) => {
      const leftRank = categoryRank.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = categoryRank.get(right) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.localeCompare(right, "zh-CN");
    });
}

export function blogCategoryIconKey(category: string): BlogCategoryIconKey {
  return requireBlogCategory(category).icon;
}
