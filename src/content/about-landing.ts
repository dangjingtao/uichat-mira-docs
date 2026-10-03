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

type AboutProject = {
  key: string;
  name: string;
  role: string;
  description: string;
  href: string;
};

const aboutProjectRows = [
  ["desktop", "Mira Desktop", "本地优先主机与主要工作空间", "承载对话、知识、工具、文件与个人工作流，是 Mira 的重心。", "https://github.com/uichat-mira/mira-desktop"],
  ["mobile", "Mira Mobile", "随身入口", "在手机上使用 Mira，也可以可靠地连接回 Desktop Host。", "https://github.com/uichat-mira/mira-mobile"],
  ["relay", "Mira Relay", "连接桥", "在 Mobile 与 Desktop 之间转发流量；它负责连接，不把自己变成 Mira 的云后端。", "https://github.com/uichat-mira/uichat-mira-relay"],
  ["docs", "Mira Docs", "公开说明", "承载产品、架构、工程记录，以及 Mira 如何组合在一起的公开地图。", "https://github.com/uichat-mira/uichat-mira-docs"],
  ["control", "Control Room", "组织观测面", "以只读方式呈现组织、构建、运行时、治理与公共基础设施的当前状态。", "https://github.com/uichat-mira/control-room"],
  ["cloud", "Cloud Shiyan", "云运行时工作", "Mira Cloud 的组织自有云运行时工程，目前仍处于 bootstrap 阶段。", "https://github.com/uichat-mira/cloud-shiyan"],
] as const;

export const aboutProjects: readonly AboutProject[] = aboutProjectRows.map(
  ([key, name, role, description, href]) => ({ key, name, role, description, href }),
);

const aboutPrincipleRows = [
  ["Local first", "Desktop Host 仍是重心；网络服务增加可达性，但不悄悄拿走本地所有权。"],
  ["小步，可验证", "优先做能在短循环里实现、评审、测试和回滚的改动。"],
  ["一件事，一个真相源", "代码与运行时描述事实，Issue 承载工程工作，组织文档承载共享规则；官网与 Control Room 是投影，不是第二本账。"],
  ["边界要清楚", "Relay 负责传输，Control Room 负责观察，Mobile 负责连接。每一层只拥有它真正该拥有的责任。"],
] as const;

export const aboutPrinciples = aboutPrincipleRows.map(
  ([title, description]) => ({ title, description }),
);
