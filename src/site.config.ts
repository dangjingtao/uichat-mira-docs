/**
 * Top-level navigation order. Keys are dynamic page directory names;
 * unlisted directories are appended in their generated order.
 */
export const topNavigationOrder = [
  "docs",
  "mira-docs-api",
  "design-md",
  "blogs",
] as const;

export const directoryLabels: Record<string, string> = {
  "visual/product-design-system": "产品设计系统",
  "visual/theme": "主题",
};
