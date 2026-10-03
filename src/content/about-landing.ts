export const aboutLandingMeta = {
  path: "/about",
  title: "关于 Mira",
  description: "关于 Mira Organization：我们在做什么、如何协作，以及我们坚持什么。",
} as const;

export const aboutOrganizationLinks = {
  github: "https://github.com/uichat-mira",
  controlRoom: "https://control.mira.tomz.io",
  fairWork: "https://github.com/uichat-mira/.github/blob/main/FAIR-WORK.md",
} as const;

export const aboutProjects = [
  {
    key: "desktop",
    name: "Mira Desktop",
    role: "本地优先主机与主要工作空间",
    description: "承载对话、知识、工具、文件与个人工作流，是 Mira 的重心。",
    href: "https://github.com/uichat-mira/mira-desktop",
  },
  {
    key: "mobile",
    name: "Mira Mobile",
    role: "随身入口",
    description: "在手机上使用 Mira，也可以可靠地连接回 Desktop Host。",
    href: "https://github.com/uichat-mira/mira-mobile",
  },
  {
    key: "relay",
    name: "Mira Relay",
    role: "连接桥",
    description: "在 Mobile 与 Desktop 之间转发流量；它负责连接，不把自己变成 Mira 的云后端。",
    href: "https://github.com/uichat-mira/uichat-mira-relay",
  },
  {
    key: "docs",
    name: "Mira Docs",
    role: "公开说明",
    description: "承载产品、架构、工程记录，以及 Mira 如何组合在一起的公开地图。",
    href: "https://github.com/uichat-mira/uichat-mira-docs",
  },
  {
    key: "control",
    name: "Control Room",
    role: "组织观测面",
    description: "以只读方式呈现组织、构建、运行时、治理与公共基础设施的当前状态。",
    href: "https://github.com/uichat-mira/control-room",
  },
  {
    key: "cloud",
    name: "Cloud Shiyan",
    role: "云运行时工作",
    description: "Mira Cloud 的组织自有云运行时工程，目前仍处于 bootstrap 阶段。",
    href: "https://github.com/uichat-mira/cloud-shiyan",
  },
] as const;

export const aboutPrinciples = [
  {
    title: "Local first",
    description: "Desktop Host 仍是重心；网络服务增加可达性，但不悄悄拿走本地所有权。",
  },
  {
    title: "小步，可验证",
    description: "优先做能在短循环里实现、评审、测试和回滚的改动。",
  },
  {
    title: "一件事，一个真相源",
    description: "代码与运行时描述事实，Issue 承载工程工作，组织文档承载共享规则；官网与 Control Room 是投影，不是第二本账。",
  },
  {
    title: "边界要清楚",
    description: "Relay 负责传输，Control Room 负责观察，Mobile 负责连接。每一层只拥有它真正该拥有的责任。",
  },
] as const;
