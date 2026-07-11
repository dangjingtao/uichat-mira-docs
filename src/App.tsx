"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {marked} from "marked";
import origin from "../docs/about/origin.md?raw";
import author from "../docs/about/author.md?raw";
import productMap from "../docs/about/product-map.md?raw";
import localFirst from "../docs/philosophy/local-first.md?raw";
import controlledAgency from "../docs/philosophy/controlled-agency.md?raw";
import evidence from "../docs/philosophy/evidence.md?raw";
import workspace from "../docs/product/workspace.md?raw";
import knowledge from "../docs/product/knowledge.md?raw";
import rolesMicroapps from "../docs/product/roles-microapps.md?raw";
import runtime from "../docs/architecture/runtime.md?raw";
import agent from "../docs/architecture/agent.md?raw";
import harness from "../docs/architecture/harness.md?raw";
import providerContext from "../docs/architecture/provider-context.md?raw";
import repository from "../docs/engineering/repository.md?raw";
import docsSystem from "../docs/engineering/docs-system.md?raw";
import development from "../docs/engineering/development.md?raw";
import current from "../docs/status/current.md?raw";
import roadmap from "../docs/status/roadmap.md?raw";
import sitemapMd from "../docs/sitemap.md?raw";

type Doc={path:string;title:string;description:string;group:string;order:number;source:string;headings:{text:string;id:string}[]};
type Section={key:string;title:string;description:string;docs:Doc[]};
const rawDocs=[
 ["/about/origin",origin],["/about/author",author],["/about/product-map",productMap],
 ["/philosophy/local-first",localFirst],["/philosophy/controlled-agency",controlledAgency],["/philosophy/evidence",evidence],
 ["/product/workspace",workspace],["/product/knowledge",knowledge],["/product/roles-microapps",rolesMicroapps],
 ["/architecture/runtime",runtime],["/architecture/agent",agent],["/architecture/harness",harness],["/architecture/provider-context",providerContext],
 ["/engineering/repository",repository],["/engineering/docs-system",docsSystem],["/engineering/development",development],
 ["/status/current",current],["/status/roadmap",roadmap],["/sitemap",sitemapMd]
] as const;
const sectionInfo:Record<string,{key:string;description:string}>={
 "认识 Mira":{key:"about",description:"品牌、作者与产品全貌"},"产品哲学":{key:"philosophy",description:"我们相信什么，又刻意拒绝什么"},
 "产品能力":{key:"product",description:"用户真正能够使用的工作空间"},"架构":{key:"architecture",description:"运行时、Agent 与能力边界"},
 "工程":{key:"engineering",description:"源码、文档与构建系统"},"现状与方向":{key:"status",description:"代码事实与下一段路"},"导航":{key:"navigation",description:"全站阅读地图"}
};
function slug(v:string){return v.replace(/<[^>]+>/g,"").replace(/[\s/]+/g,"-").replace(/[^\w\u4e00-\u9fff-]/g,"").toLowerCase()}
function parseDoc(path:string,raw:string):Doc{const m=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);const meta=Object.fromEntries((m?.[1]||"").split("\n").filter(Boolean).map(x=>{const i=x.indexOf(":");return[x.slice(0,i).trim(),x.slice(i+1).trim()]}));const source=m?.[2]||raw;return{path,title:meta.title||path,description:meta.description||"",group:meta.group||"文档",order:Number(meta.order||99),source,headings:[...source.matchAll(/^##\s+(.+)$/gm)].map(x=>({text:x[1],id:slug(x[1])}))}}
const allDocs=rawDocs.map(([p,s])=>parseDoc(p,s)).sort((a,b)=>a.order-b.order);
const siteMap=(Object.entries(sectionInfo).map(([title,info])=>({key:info.key,title,description:info.description,docs:allDocs.filter(d=>d.group===title)})).filter(s=>s.docs.length)) as Section[];
function renderMd(source:string){let s=source.replace(/::: tip ([\s\S]*?):::/g,'<div class="custom-block"><strong>提示</strong><p>$1</p></div>');const html=marked.parse(s,{gfm:true}) as string;return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g,(_,n,t)=>`<h${n} id="${slug(t)}">${t}<a class="anchor" href="#${slug(t)}">#</a></h${n}>`)}
function currentPath(){if(typeof window==="undefined")return "/";return new URLSearchParams(window.location.search).get("doc")||"/"}
function Logo({large=false}:{large?:boolean}){return <span className={`logo ${large?"logo-large":""}`} aria-hidden="true"><i/></span>}

export default function Home(){
 const [path,setPath]=useState("/");const [dark,setDark]=useState(false);const [menu,setMenu]=useState(false);const [searchOpen,setSearchOpen]=useState(false);const [query,setQuery]=useState("");const [selectedResult,setSelectedResult]=useState(0);const [activeHeading,setActiveHeading]=useState("");const searchRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{const sync=()=>{setPath(currentPath());setMenu(false);setActiveHeading("");window.scrollTo(0,0)};sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync)},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setSearchOpen(true)}if(e.key==="Escape")setSearchOpen(false)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[]);
 useEffect(()=>{if(searchOpen)setTimeout(()=>searchRef.current?.focus(),20)},[searchOpen]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
 const navigate=(target:string)=>{const url=new URL(window.location.href);target==="/"?url.searchParams.delete("doc"):url.searchParams.set("doc",target);url.hash="";history.pushState({},"",url);setPath(target);setMenu(false);setSearchOpen(false);setQuery("");window.scrollTo(0,0)};
 const currentDoc=allDocs.find(d=>d.path===path);const articleDocs=allDocs.filter(d=>d.group!=="导航");const idx=currentDoc?articleDocs.indexOf(currentDoc):-1;
 const html=useMemo(()=>currentDoc?renderMd(currentDoc.source):"",[currentDoc]);
 useEffect(()=>{if(!currentDoc)return;const nodes=currentDoc.headings.map(h=>document.getElementById(h.id)).filter(Boolean) as HTMLElement[];const onScroll=()=>{let hit="";for(const n of nodes)if(n.getBoundingClientRect().top<150)hit=n.id;setActiveHeading(hit)};onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[currentDoc,html]);
 const searchResults=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return articleDocs.slice(0,7).map(d=>({doc:d,snippet:d.description}));return articleDocs.map(d=>{const hay=(d.title+" "+d.description+" "+d.source).toLowerCase();const pos=hay.indexOf(q);if(pos<0)return null;const plain=d.source.replace(/[#>*`|_-]/g," ").replace(/\s+/g," ");const p=plain.toLowerCase().indexOf(q);return{doc:d,snippet:p>=0?plain.slice(Math.max(0,p-38),p+90):d.description}}).filter(Boolean).slice(0,9) as {doc:Doc;snippet:string}[]},[query]);
 useEffect(()=>setSelectedResult(0),[query,searchOpen]);
 useEffect(()=>{if(!searchOpen)return;const key=(e:KeyboardEvent)=>{if(e.key==="ArrowDown"){e.preventDefault();setSelectedResult(v=>Math.min(v+1,searchResults.length-1))}if(e.key==="ArrowUp"){e.preventDefault();setSelectedResult(v=>Math.max(v-1,0))}if(e.key==="Enter"&&searchResults[selectedResult]){e.preventDefault();navigate(searchResults[selectedResult].doc.path)}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[searchOpen,searchResults,selectedResult]);
 return <div className="site">
  <header className="topbar"><button className="icon-btn menu-btn" onClick={()=>setMenu(!menu)} aria-label="打开目录">☰</button><a className="brand" href="./" onClick={e=>{e.preventDefault();navigate("/")}}><Logo/><span>UIChat <b>Mira</b></span><em>DOCS</em></a><nav className="topnav"><a href="?doc=/about/origin" onClick={e=>{e.preventDefault();navigate("/about/origin")}}>文档</a><a href="?doc=/sitemap" onClick={e=>{e.preventDefault();navigate("/sitemap")}}>Sitemap</a><a href="https://github.com/dangjingtao/uichat-mira" target="_blank" rel="noreferrer">GitHub ↗</a></nav><div className="top-actions"><button className="search-trigger" onClick={()=>setSearchOpen(true)}><span>⌕</span><span>搜索文档</span><kbd>Ctrl K</kbd></button><button className="icon-btn" onClick={()=>setDark(!dark)} aria-label="切换主题">{dark?"◑":"◐"}</button></div></header>
  {path!=="/"&&<aside className={`sidebar ${menu?"open":""}`}><div className="side-home"><a href="./" onClick={e=>{e.preventDefault();navigate("/")}}>← 返回首页</a></div><nav>{siteMap.filter(s=>s.key!=="navigation").map(section=><div className="nav-section" key={section.key}><p>{section.title}</p>{section.docs.map(d=><a className={path===d.path?"active":""} href={`?doc=${d.path}`} onClick={e=>{e.preventDefault();navigate(d.path)}} key={d.path}>{d.title}</a>)}</div>)}</nav><a className={`sitemap-link ${path==="/sitemap"?"active":""}`} href="?doc=/sitemap" onClick={e=>{e.preventDefault();navigate("/sitemap")}}>◇ Sitemap</a></aside>}
  {menu&&<button className="scrim" onClick={()=>setMenu(false)} aria-label="关闭目录"/>}
  {path==="/"?<Landing navigate={navigate}/>:currentDoc?<main className="doc-layout"><article className="doc"><div className="breadcrumb"><button onClick={()=>navigate("/")}>Mira</button><span>/</span>{currentDoc.group}<span>/</span>{currentDoc.title}</div><div className="markdown" dangerouslySetInnerHTML={{__html:html}}/>{path==="/sitemap"?<SitemapGrid navigate={navigate}/>:<div className="pager">{articleDocs[idx-1]?<a href={`?doc=${articleDocs[idx-1].path}`} onClick={e=>{e.preventDefault();navigate(articleDocs[idx-1].path)}}><small>上一篇</small><b>← {articleDocs[idx-1].title}</b></a>:<span/>}{articleDocs[idx+1]&&<a className="next" href={`?doc=${articleDocs[idx+1].path}`} onClick={e=>{e.preventDefault();navigate(articleDocs[idx+1].path)}}><small>下一篇</small><b>{articleDocs[idx+1].title} →</b></a>}</div>}<footer>内容依据 UIChat Mira `dev` 分支源码与 current-contract 文档整理。</footer></article>{currentDoc.headings.length>0&&<aside className="toc"><p>本页导航</p>{currentDoc.headings.map(h=><a className={activeHeading===h.id?"active":""} href={`#${h.id}`} key={h.id}>{h.text}</a>)}<div/><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>回到顶部 ↑</button></aside>}</main>:null}
  {searchOpen&&<div className="search-overlay" role="dialog" aria-modal="true" aria-label="全站搜索" onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><div className="command"><div className="command-input"><span>⌕</span><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索标题、正文与概念…"/><kbd>ESC</kbd></div><p className="command-label">{query?`找到 ${searchResults.length} 个结果`:"推荐阅读"}</p><div className="command-results">{searchResults.map(({doc,snippet},i)=><button className={i===selectedResult?"selected":""} key={doc.path} onMouseEnter={()=>setSelectedResult(i)} onClick={()=>navigate(doc.path)}><span className="result-icon">{sectionInfo[doc.group]?.key.slice(0,1).toUpperCase()}</span><span><b>{doc.title}</b><small>{doc.group} · {snippet}</small></span><em>↵</em></button>)}{searchResults.length===0&&<div className="empty">没有找到相关内容</div>}</div><div className="command-foot"><span>↑↓ 浏览</span><span>Enter 打开</span><span>Esc 关闭</span></div></div></div>}
 </div>
}

function Landing({navigate}:{navigate:(p:string)=>void}){return <main className="landing"><section className="hero"><div className="hero-copy"><div className="hero-tag"><span/>LOCAL-FIRST · MULTI-PROVIDER · EVIDENCE-DRIVEN</div><h1>从聊天出发，<br/>最终回到<em>“接住你”。</em></h1><p>UIChat Mira 是一个本地优先的智能体工作舱。它不许诺替你消失，而是让模型、知识与工具在你仍然掌握方向时，真正开始工作。</p><div className="hero-actions"><button onClick={()=>navigate("/about/origin")}>开始认识 Mira <span>→</span></button><a href="https://github.com/dangjingtao/uichat-mira" target="_blank" rel="noreferrer">查看源码 ↗</a></div></div><div className="hero-mark"><Logo large/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><p>MIRA</p><span>INTELLIGENT AGENT CABIN</span></div></section><section className="manifesto"><p>“自主，不等于失控。<br/>证据先于答案，人的主导权先于自动化。”</p><div><span>产品精神</span><strong>让复杂能力变得可信、可见、可掌握。</strong></div></section><section className="home-map"><div className="section-head"><span>DOCUMENTATION</span><h2>从精神到实现</h2><p>六条阅读路径，共同解释 Mira 为什么存在、如何工作，以及正走向哪里。</p></div><SitemapGrid navigate={navigate} home/></section><section className="author-card"><img src="https://github.com/dangjingtao.png?size=160" alt="Tomz Dang 的 GitHub 头像"/><div><span>CREATED & MAINTAINED BY</span><h2>Tomz Dang</h2><p>一个前端开发者持续构建的 local-first AI workspace。源码、文档与工程判断都公开留在 GitHub。</p><div><a href="https://github.com/dangjingtao" target="_blank" rel="noreferrer">GitHub 主页 ↗</a><a href="https://github.com/dangjingtao/uichat-mira" target="_blank" rel="noreferrer">UIChat Mira ↗</a></div></div><aside><b>0.7.1</b><span>产品版本</span><b>338</b><span>源码 Markdown 索引</span><b>V1.5</b><span>Agent 稳定化</span></aside></section><section className="source-note"><span>SOURCE OF TRUTH</span><p>本站内容已核对 <code>dangjingtao/uichat-mira</code> 的 <code>dev</code> 分支快照 <code>c6c2c098</code>。计划、历史材料与已实现能力在文档中严格分开。</p></section></main>}
function SitemapGrid({navigate,home=false}:{navigate:(p:string)=>void;home?:boolean}){return <div className={`sitemap-grid ${home?"home":""}`}>{siteMap.filter(s=>s.key!=="navigation").map((section,i)=><section key={section.key}><div className="map-number">0{i+1}</div><div className="map-title"><span>{section.key.toUpperCase()}</span><h3>{section.title}</h3><p>{section.description}</p></div><ol>{section.docs.map(d=><li key={d.path}><a href={`?doc=${d.path}`} onClick={e=>{e.preventDefault();navigate(d.path)}}>{d.title}<span>→</span></a></li>)}</ol></section>)}</div>}
