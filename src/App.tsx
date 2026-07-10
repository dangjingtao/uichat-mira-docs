"use client";
import {useEffect,useState} from "react";

const nav=[
  ["overview","产品概览","开始"],["principles","设计原则","开始"],
  ["architecture","系统架构","产品架构"],["loop","Agent Loop","产品架构"],
  ["harness","Harness 与工具","核心系统"],["knowledge","知识与 RAG","核心系统"],
  ["capabilities","能力版图","产品现状"],["roadmap","演进方向","产品现状"]
];
const caps=[
  ["多模型 Provider","已具备","多供应商接入，不锁定单一模型协议"],
  ["Chat / Vision / Embedding / Rerank","已具备","统一的模型能力画像"],
  ["知识库 / RAG","已具备","检索、评测与调用链路追踪"],
  ["Agent 主循环","稳定化","Planner 驱动的可恢复执行闭环"],
  ["工具与权限","演进中","收紧工具暴露、选择与审批"],
  ["语音能力","验证中","轻量本地与高质量外部运行时 POC"]
];

function Logo(){return <span className="logo" aria-hidden="true"><i/></span>}
export default function Home(){
  const [dark,setDark]=useState(false); const [active,setActive]=useState("overview"); const [query,setQuery]=useState("");
  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
  useEffect(()=>{const o=new IntersectionObserver(es=>{const e=es.find(x=>x.isIntersecting);if(e)setActive(e.target.id)},{rootMargin:"-20% 0px -70%"});nav.forEach(([id])=>{const el=document.getElementById(id);if(el)o.observe(el)});return()=>o.disconnect()},[]);
  const results=query?nav.filter(([,label])=>label.includes(query)):[];
  return <div>
    <header><a className="brand" href="#overview"><Logo/><span>UIChat <b>Mira</b></span><em>DOCS</em></a><div className="actions">
      <div className="search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索文档…" aria-label="搜索文档"/><kbd>⌘ K</kbd>{results.length>0&&<div className="results">{results.map(([id,label,group])=><a key={id} href={`#${id}`} onClick={()=>setQuery("")}>{label}<small>{group}</small></a>)}</div>}</div>
      <button onClick={()=>setDark(!dark)} aria-label="切换主题">{dark?"◑":"◐"}</button><a className="status" href="#capabilities"><i/>V1.5 稳定化</a>
    </div></header>
    <aside><nav>{[...new Set(nav.map(x=>x[2]))].map(group=><div className="nav-group" key={group}><p>{group}</p>{nav.filter(x=>x[2]===group).map(([id,label])=><a className={active===id?"active":""} key={id} href={`#${id}`}>{label}</a>)}</div>)}</nav><blockquote><b>产品原则</b><p>稳定优先于炫技，证据优先于猜测。</p></blockquote></aside>
    <main>
      <section id="overview" className="hero"><div className="kicker">PRODUCT DOCUMENTATION <i/></div><h1>让模型成为真正<br/>可工作的<strong>本地智能体</strong></h1><p className="lead">UIChat Mira 是面向桌面与独立 Web 场景的多模型 AI 工作台。它把模型、知识、工具与权限放进一个可观察、可恢复、可演进的执行系统。</p><div className="cta"><a href="#architecture">理解系统架构　→</a><a href="#capabilities">查看能力现状</a></div><div className="facts"><div><b>Multi-provider</b><span>统一模型接入</span></div><div><b>Local-first</b><span>本地桌面为核心</span></div><div><b>Evidence-driven</b><span>证据驱动执行</span></div></div></section>
      <section id="principles"><Title n="01" en="PRODUCT PRINCIPLES" title="不是一个更花哨的聊天壳" desc="Mira 的目标是做“有人用的产品”：能力必须可理解、执行必须可约束、失败必须可恢复。"/><div className="principles"><Card n="01" t="多供应商，而非单模型绑定">Provider / Model Gateway 隔离协议差异，让产品能力高于某一家模型接口。</Card><Card n="02" t="稳定闭环，而非盲目自治">Planner 判断任务是否完成；Policy 与 Harness 约束执行边界。</Card><Card n="03" t="少而清晰的能力面">避免工具爆炸。面向模型暴露稳定语义，把实现复杂度留在 Harness 内部。</Card><Card n="04" t="可观察，而非黑盒魔法">记录请求、证据、耗时、Token 与成本，让失败能够定位、判断能够复核。</Card></div></section>
      <section id="architecture"><Title n="02" en="ARCHITECTURE" title="一个受控的智能体运行系统" desc="Mira 以 MCP Host 为主，把模型推理与实际执行分离。模型提出意图，Harness 解析环境并提供受治理的能力。"/><div className="arch"><Box over="EXPERIENCE" title="Desktop / Web" sub="聊天 · 微应用 · 知识工作台"/><i>↓</i><Box hot over="INTELLIGENCE" title="Agent Runtime" sub="Planner · Evidence · Recovery"/><i>↓</i><Box over="GOVERNANCE" title="Harness / MCP Host" sub="工具发现 · 权限策略 · 调用追踪"/><div className="branches"><Box title="Model Gateway" sub="Chat · Vision · Embedding"/><Box title="Knowledge" sub="RAG · Evaluation · Trace"/><Box title="Capabilities" sub="Read · Edit · Search · Terminal"/></div></div></section>
      <section id="loop"><Title n="03" en="AGENT LOOP" title="Planner 是循环的控制者" desc="当前稳定主循环不扩张 Graph，而是确保每次工具执行都回到 Planner，由它依据目标覆盖度决定继续、恢复或回答。"/><div className="loop">{["Planner","Normalize","Policy","ToolNode","Evidence","Planner ↻"].map((x,i)=><div className={x.startsWith("Planner")?"hot":""} key={i}><small>0{i+1}</small><b>{x}</b>{i<5&&<i>→</i>}</div>)}</div><div className="callout"><b>关键语义</b><p><code>evidence answerable</code> 不等于 <code>task completable</code>。证据能解释局部结果，并不意味着用户目标已经完成。</p></div></section>
      <section id="harness"><Title n="04" en="HARNESS & TOOLS" title="把复杂度藏在正确的地方" desc="Harness 负责理解环境、收敛候选、执行审批，并用稳定能力语义保护 Planner 不被实现细节淹没。"/><div className="tools"><div><small>产品能力</small><small>核心语义</small><small>治理边界</small></div><Row a="Read" b="定位、打开、提取与切片" c="已知目标优先，宽泛 read 仅作降级"/><Row a="Edit" b="受控写入与块级替换" c="预演与旧文本校验"/><Row a="Search" b="统一 Web 研究入口" c="供应商参数由 Harness 隐藏"/><Row a="Terminal" b="进程与会话执行" c="强审批、超时、沙箱与流式观察"/></div></section>
      <section id="knowledge"><Title n="05" en="KNOWLEDGE" title="知识不是塞进上下文就结束"/><div className="split"><p>知识库负责检索，但真正的产品能力来自完整链路：候选召回、重排、引用证据、效果测评与运行追踪。</p><ul><li>本地 Embedding 与 Rerank</li><li>RAG 质量评测</li><li>原始请求 / 响应与耗时追踪</li><li>Token 与成本可观察性</li></ul></div></section>
      <section id="capabilities"><Title n="06" en="CURRENT STATE" title="能力版图" desc="这是一份产品现状，不是营销愿望清单。"/><div className="caps">{caps.map(([t,s,d])=><article key={t}><div><h3>{t}</h3><p>{d}</p></div><span className={s==="已具备"?"done":"doing"}>{s}</span></article>)}</div></section>
      <section id="roadmap"><Title n="07" en="DIRECTION" title="接下来，把已有能力变得可靠"/><div className="roadmap"><Road tag="NOW" title="Planner 稳定性">明确任务完成度，降低工具误选和过早回答。</Road><Road tag="NEXT" title="Workspace Intelligence">让复杂代码与文档系统可定位、可验证，同时控制上下文成本。</Road><Road tag="EXPLORE" title="语音与组织连接">验证本地语音运行时，并逐步连接企业微信、飞书等真实场景。</Road></div><footer><Logo/><div><b>UIChat Mira</b><p>本地优先，多模型驱动，面向真实工作的 AI 系统。</p></div></footer></section>
    </main>
  </div>
}
function Title({n,en,title,desc}:{n:string,en:string,title:string,desc?:string}){return <><p className="section-kicker">{n} · {en}</p><h2>{title}</h2>{desc&&<p className="intro">{desc}</p>}</>}
function Card({n,t,children}:{n:string,t:string,children:React.ReactNode}){return <article><small>{n}</small><h3>{t}</h3><p>{children}</p></article>}
function Box({over,title,sub,hot}:{over?:string,title:string,sub:string,hot?:boolean}){return <div className={`box ${hot?"box-hot":""}`}>{over&&<small>{over}</small>}<b>{title}</b><span>{sub}</span></div>}
function Row({a,b,c}:{a:string,b:string,c:string}){return <div><b>{a}</b><span>{b}</span><em>{c}</em></div>}
function Road({tag,title,children}:{tag:string,title:string,children:React.ReactNode}){return <article><b>{tag}</b><h3>{title}</h3><p>{children}</p></article>}
