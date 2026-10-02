export const mobileLandingMeta = {
  path: "/guide/about/mobile",
  title: "Mira Mobile",
  description: "随身使用 Mira：直接连接自己的模型，或连接桌面端 Mira。",
  group: "认识 Mira",
  order: 4,
  root: "guide",
  directory: "about",
} as const;

export const mobileLandingPaths = [
  {
    key: "local",
    eyebrow: "01 · LOCAL",
    title: "直接使用自己的模型",
    description:
      "在手机端配置兼容的 Provider 与凭据，由 Mobile 自己的 Runtime 完成对话。离开桌面端，它仍然是一条独立可用的链路。",
    endpoint: "PHONE → PROVIDER / API",
  },
  {
    key: "remote",
    eyebrow: "02 · REMOTE",
    title: "连接你的桌面 Mira",
    description:
      "与 Desktop Host 配对后，从手机发起和继续远程会话。需要本地环境与更重能力时，让电脑留在它最擅长的位置。",
    endpoint: "PHONE → DESKTOP HOST",
  },
] as const;

export const mobileLandingFacts = [
  {
    title: "自配 Provider",
    description: "在手机端保存自己的模型服务配置与凭据。",
  },
  {
    title: "本地 Agent Runtime",
    description: "手机端已有独立的 Provider Runtime 与 Agent Loop。",
  },
  {
    title: "远程配对",
    description: "连接 Desktop Host，在移动端进入远程会话链路。",
  },
  {
    title: "双平台构建",
    description: "Android 提供签名 APK；iOS 提供未签名真机测试 IPA。",
  },
] as const;

export const mobileLandingSearchText = [
  mobileLandingMeta.description,
  "Mira Mobile Preview Android APK iOS IPA",
  "手机端 Provider Agent Runtime Desktop Host 远程配对",
  ...mobileLandingPaths.flatMap((item) => [
    item.title,
    item.description,
    item.endpoint,
  ]),
  ...mobileLandingFacts.flatMap((item) => [item.title, item.description]),
].join("\n");
