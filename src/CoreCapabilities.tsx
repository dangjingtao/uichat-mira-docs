import type { ReactNode } from "react";

export interface CapabilityItem {
  id: string;
  title: string;
  description: string;
  detail?: ReactNode;
  href?: string;
}

export interface CoreCapabilitiesProps {
  items?: CapabilityItem[];
  className?: string;
}

const defaultItems: CapabilityItem[] = [
  {
    id: "01",
    title: "多模型，自由切换",
    description:
      "同时连接云端与本地模型。根据任务选择合适的能力，切换时仍然保留对话与工作上下文。",
  },
  {
    id: "02",
    title: "对话成为长期工作",
    description:
      "分支、角色、附件与历史不再是一次性消息。重要讨论可以继续整理、复用，成为下一次工作的上下文。",
  },
  {
    id: "03",
    title: "知识真正可以使用",
    description:
      "导入文档、建立索引、检索原文并验证答案。知识不只被收藏，也能够进入对话和任务执行。",
  },
  {
    id: "04",
    title: "从回答走向行动",
    description:
      "根据任务选择工具、请求必要权限并执行操作。关键过程保留证据，重要动作始终由你控制。",
    detail: "Agent · Harness · MCP",
  },
];

function CapabilityContent({ item }: { item: CapabilityItem }) {
  return (
    <>
      <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-primary-active">
        {item.id}
      </span>

      <div className="min-w-0">
        <h3 className="m-0 text-[19px] font-semibold leading-7 tracking-[-0.015em] text-ink sm:text-[21px]">
          {item.title}
        </h3>
        <p className="mb-0 mt-2 max-w-[31rem] text-[15px] leading-7 text-muted sm:text-[16px]">
          {item.description}
        </p>
        {item.detail ? (
          <div className="mt-3 text-xs tracking-[0.03em] text-muted-soft">
            {item.detail}
          </div>
        ) : null}
      </div>
    </>
  );
}

function Capability({ item }: { item: CapabilityItem }) {
  const classes =
    "group grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-7 text-left transition-colors duration-200 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4 sm:py-8";

  if (item.href) {
    return (
      <a
        href={item.href}
        className={`${classes} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-4 hover:border-primary`}
      >
        <CapabilityContent item={item} />
      </a>
    );
  }

  return (
    <article className={classes}>
      <CapabilityContent item={item} />
    </article>
  );
}

export function CoreCapabilities({
  items = defaultItems,
  className = "",
}: CoreCapabilitiesProps) {
  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-title"
      className={`bg-canvas px-5 py-20 text-ink sm:px-8 sm:py-24 lg:py-28 ${className}`}
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="pb-12 md:pb-14">
          <div>
            <p className="mb-4 mt-0 font-mono text-[11px] font-medium tracking-[0.16em] text-primary-active">
              核心能力
            </p>
            <h2
              id="capabilities-title"
              className="m-0 max-w-[780px] font-serif text-[38px] font-normal leading-[1.14] tracking-[-0.035em] text-ink sm:text-[44px]"
            >
              不止聊天，
              <span className="block">而是持续工作的上下文。</span>
            </h2>
            <p className="mb-0 mt-6 max-w-[32rem] text-[16px] leading-7 text-muted">
              对话、角色、文件、知识与工具共享同一份上下文。一次交流可以沉淀为长期资料，也可以继续转化为真实行动。
            </p>
          </div>
        </header>

        <div className="mt-7 grid md:mt-9 md:grid-cols-2 md:gap-x-16 lg:gap-x-24">
          {items.map((item) => (
            <Capability key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CoreCapabilities;
