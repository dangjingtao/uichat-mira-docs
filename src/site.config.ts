/**
 * Top-level navigation order. Keys are dynamic page directory names;
 * unlisted directories are appended in their generated order.
 */
export const topNavigationOrder = [
  "guide",
  "api",
  "blogs",
  "about",
] as const;

export const logoUrl = "https://assets.tomz.io/images/mira-logo.png";
export const siteUrl = "https://mira.tomz.io";
export const seo = {
  enabled: true,
} as const;

export const directoryLabels: Record<string, string> = {
  about: "认识 Mira",
  philosophy: "产品哲学",
  product: "产品能力",
  configuration: "配置",
  status: "现状与方向",
  architecture: "架构",
  engineering: "工程",
  视觉: "视觉",
};
