"use client";
import {useEffect,useMemo,useState} from "react";
import {marked} from "marked";
import indexMd from "../docs/index.md?raw";
import principlesMd from "../docs/principles.md?raw";
import architectureMd from "../docs/architecture.md?raw";
import loopMd from "../docs/agent-loop.md?raw";
import harnessMd from "../docs/harness.md?raw";
import knowledgeMd from "../docs/knowledge.md?raw";
import capabilitiesMd from "../docs/capabilities.md?raw";

type Doc={path:string;title:string;description:string;group:string;order:number;source:string};
const rawDocs=[
  ["/",indexMd],["/guide/principles",principlesMd],["/architecture/overview",architectureMd],
  ["/architecture/agent-loop",loopMd],["/systems/harness",harnessMd],
  ["/systems/knowledge",knowledgeMd],["/status/capabilities",capabilitiesMd]
] as const;
function parseDoc(path:string,raw:string):Doc{const m=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);const meta=Object.fromEntries((m?.[1]||"").split("\n").filter(Boolean).map(x=>{const i=x.indexOf(":");return[x.slice(0,i).trim(),x.slice(i+1).trim()]}));return{path,title:meta.title||path,description:meta.description||"",group:meta.group||"文档",order:Number(meta.order||99),source:m?.[2]||raw}}
const docs=rawDocs.map(([p,s])=>parseDoc(p,s)).sort((a,b)=>a.order-b.order);
function slug(text:string){return text.replace(/<[^>]+>/g,"").replace(/[\s/]+/g,"-").replace(/[^\w\u4e00-\u9fff-]/g,"").toLowerCase()}
function renderMd(source:string){let s=source.replace(/::: tip ([\s\S]*?):::/g,"<div class=\"custom-block tip\"><strong>提示</strong><p>$1</p></div>");const html=marked.parse(s,{gfm:true}) as string;return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g,(_,n,t)=>`<h${n} id="${slug(t)}">${t}<a class="anchor" href="#${slug(t)}">#</a></h${n}>`)}
function route(){if(typeof window==="undefined")return "/";const v=window.location.hash.replace(/^#/,"");return v.startsWith("/")?v.split("#")[0]:"/"}
function Logo(){return <span className="logo" aria-hidden="true"><i/></span>}

export default function Home(){
 const [path,setPath]=useState("/");const [dark,setDark]=useState(false);const [query,setQuery]=useState("");const [menu,setMenu]=useState(false);
 useEffect(()=>{const sync=()=>{setPath(route());setMenu(false);window.scrollTo(0,0)};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
 const current=docs.find(d=>d.path===path)||docs[0];const idx=docs.indexOf(current);const html=useMemo(()=>renderMd(current.source),[current]);
 const headings=[...current.source.matchAll(/^##\s+(.+)$/gm)].map(x=>x[1]);
 const results=query.trim()?docs.filter(d=>(d.title+d.description+d.source).toLowerCase().includes(query.toLowerCase())):[];
 return <div className="docs-shell">
  <header className="topbar"><button className="menu" onClick={()=>setMenu(!menu)} aria-label="打开导航">☰</button><a className="brand" href="#/"><Logo/><span>UIChat <b>Mira</b></span><em>DOCS</em></a><div className="top-actions"><div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索文档…" aria-label="搜索文档"/><kbd>⌘ K</kbd>{results.length>0&&<div className="results">{results.map(d=><a key={d.path} href={`#${d.path}`} onClick={()=>setQuery("")}><b>{d.title}</b><small>{d.group}</small><p>{d.description}</p></a>)}</div>}</div><a className="github" href="https://github.com/dangjingtao/uichat-mira-docs" target="_blank" rel="noreferrer" aria-label="GitHub">⌘</a><button className="theme" onClick={()=>setDark(!dark)} aria-label="切换主题">{dark?"◑":"◐"}</button></div></header>
  <aside className={`sidebar ${menu?"open":""}`}><nav>{[...new Set(docs.map(d=>d.group))].map(g=><div className="nav-group" key={g}><p>{g}</p>{docs.filter(d=>d.group===g).map(d=><a className={d.path===current.path?"active":""} key={d.path} href={`#${d.path}`}>{d.title}</a>)}</div>)}</nav><div className="version"><span>当前版本</span><b>Agent V1.5</b><small>稳定化阶段</small></div></aside>
  {menu&&<button className="scrim" onClick={()=>setMenu(false)} aria-label="关闭导航"/>}
  <main className="doc-layout"><article className="doc"><div className="breadcrumb">UIChat Mira <span>›</span> {current.group} <span>›</span> {current.title}</div><div className="markdown" dangerouslySetInnerHTML={{__html:html}}/><div className="pager">{docs[idx-1]?<a href={`#${docs[idx-1].path}`}><small>上一页</small><b>← {docs[idx-1].title}</b></a>:<span/>}{docs[idx+1]&&<a className="next" href={`#${docs[idx+1].path}`}><small>下一页</small><b>{docs[idx+1].title} →</b></a>}</div><footer>UIChat Mira · 本地优先，多模型驱动，面向真实工作的 AI 系统。</footer></article>
  <aside className="outline"><p>本页目录</p>{headings.map(h=><a key={h} href={`#${slug(h)}`}>{h}</a>)}<div className="outline-rule"/><a href="https://github.com/dangjingtao/uichat-mira-docs" target="_blank" rel="noreferrer">在 GitHub 上编辑 ↗</a></aside></main>
 </div>
}
