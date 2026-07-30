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

export const logoUrl = "https://assets.tomz.io/images/mira-logo.png";
export const siteUrl = "https://tomz.io";
export const seo = {
  enabled: true,
} as const;

export const directoryLabels: Record<string, string> = {
  "视觉/product-design-system": "产品设计系统",
  "视觉/theme": "主题",
};
