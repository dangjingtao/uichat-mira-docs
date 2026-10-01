export const blogCategories = [
  { label: "Mira 雷达", icon: "compass" },
  { label: "工程现场", icon: "code" },
  { label: "产品手记", icon: "sparkles" },
  { label: "开发日志", icon: "file" },
] as const;

export type BlogCategoryIconKey = (typeof blogCategories)[number]["icon"];

const categoryRank = new Map(
  blogCategories.map((category, index) => [category.label, index]),
);

export function orderBlogCategories(groups: Iterable<string>): string[] {
  return [...new Set(groups)]
    .filter(Boolean)
    .sort((left, right) => {
      const leftRank = categoryRank.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = categoryRank.get(right) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.localeCompare(right, "zh-CN");
    });
}

export function blogCategoryIconKey(category: string): BlogCategoryIconKey {
  return blogCategories.find((item) => item.label === category)?.icon ?? "compass";
}
