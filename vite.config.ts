import {mkdirSync,readFileSync,readdirSync,writeFileSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import { defineConfig } from "vite";
import { marked } from "marked";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";
import {logoUrl,seo as seoConfig,siteUrl} from "./src/site.config";

const projectRoot=dirname(fileURLToPath(import.meta.url));
const pagesRoot=resolve(projectRoot,"src/pages");
function pageDirectoryManifest(){return existsSync(pagesRoot)?readdirSync(pagesRoot,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name):[]}
function pageDirectoriesPlugin(){return{name:"page-directories",configureServer(server:any){server.watcher.add(pagesRoot)},resolveId(id:string){return id==="virtual:page-directories"?"\0virtual:page-directories":undefined},load(id:string){if(id!=="\0virtual:page-directories")return;return `export default ${JSON.stringify(pageDirectoryManifest())}`},handleHotUpdate({file,server}:any){const normalized=file.replace(/\\/g,"/");if(!normalized.startsWith(pagesRoot.replace(/\\/g,"/")))return;const module=server.moduleGraph.getModuleById("\0virtual:page-directories");if(module)server.moduleGraph.invalidateModule(module);server.ws.send({type:"full-reload"});return []}}}

const blogDirectoryByGroup:Record<string,string>={
  "产品手记":"product-journal",
  "工程现场":"engineering",
  "共同思考":"shared-thinking",
  "Mira 来信":"mira-letters",
  "开发者生活":"developer-life",
};
function markdownFiles(directory:string):string[]{
  if(!existsSync(directory))return [];
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const path=resolve(directory,entry.name);
    return entry.isDirectory()?markdownFiles(path):entry.name.endsWith(".md")?[path]:[];
  });
}
function blogDirectoryCheck(){
  return {
    name:"blog-directory-check",
    buildStart(this:any){
      const blogsRoot=resolve(pagesRoot,"blogs");
      for(const file of markdownFiles(blogsRoot)){
        const relative=file.slice(blogsRoot.length+1).replace(/\\/g,"/");
        const directory=relative.split("/")[0];
        const source=readFileSync(file,"utf8");
        const group=source.match(/^group:\s*(.+)$/m)?.[1]?.trim();
        const expected=group?blogDirectoryByGroup[group]:undefined;
        if(expected&&directory!==expected){
          this.warn(`博客目录与分类不一致：${relative}，group 为“${group}”，建议放入 blogs/${expected}/。目录移动会改变文章 URL，请单独确认。`);
        }
      }
    },
  };
}

type SeoDoc={path:string;title:string;description:string;group:string;order:number;date?:string;author:string[];source:string;root:string;merge?:string;mergeIndex?:boolean};
function seoMeta(source:string,key:string){return source.match(new RegExp(`^${key}:\\s*(.+)$`,`m`))?.[1]?.trim()||""}
function seoDocPath(file:string){
  const relative=file.slice(pagesRoot.length+1).replace(/\\/g,"/").replace(/\.md$/i,"");
  return relative.startsWith("docs/")?`/${relative.slice(5)}`:`/${relative}`;
}
function readSeoDoc(file:string):SeoDoc{
  const raw=readFileSync(file,"utf8");
  const match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const frontmatter=match?.[1]||"";
  const source=match?.[2]||raw;
  const authorLine=seoMeta(frontmatter,"author");
  const author=authorLine?authorLine.split(/[|,，]/).map(value=>value.trim()).filter(Boolean):["Tomz Dang"];
  return {
    path:seoDocPath(file),
    title:seoMeta(frontmatter,"title")||seoDocPath(file),
    description:seoMeta(frontmatter,"description"),
    group:seoMeta(frontmatter,"group")||"文档",
    order:Number(seoMeta(frontmatter,"order")||99),
    date:seoMeta(frontmatter,"date")||undefined,
    author,
    source,
    root:seoDocPath(file).split("/")[1]||"docs",
    merge:seoMeta(frontmatter,"merge")||undefined,
    mergeIndex:seoMeta(frontmatter,"mergeIndex")==="true",
  };
}
function seoDocs(){
  const docs=markdownFiles(pagesRoot).filter(file=>!/README\.md$/i.test(file)).map(readSeoDoc);
  return docs.filter(doc=>!doc.merge||doc.mergeIndex).map(doc=>{
    if(!doc.merge)return doc;
    const merged=docs.filter(section=>section.merge===doc.merge).sort((a,b)=>a.order-b.order).map(section=>section.source).join("\n\n");
    return {...doc,source:merged};
  });
}
function seoEscape(value:string){return value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character]||character))}
function seoRouteUrl(base:string,path:string){
  const basePath=base==="/"?"":base.replace(/\/$/,"");
  return `${siteUrl.replace(/\/$/,"")}${basePath}${path==="/"?"/":`${path}/`}`;
}
function seoBasePath(base:string){return base==="/"?"":base.replace(/\/$/,"")}
function seoDocumentBody(doc:SeoDoc){
  const body=marked.parse(doc.source) as string;
  return `<main class="doc-main seo-static-content"><div class="doc-eyebrow">${seoEscape(doc.group)}</div><div class="doc-title-block"><h1>${seoEscape(doc.title)}</h1>${doc.description?`<p class="doc-lede">${seoEscape(doc.description)}</p>`:""}</div><article class="markdown">${body}</article></main>`;
}
function seoAreaBody(root:string,docs:SeoDoc[],base:string){
  const title=root==="blogs"?"博客":docs.find(doc=>doc.root===root)?.title||root;
  const basePath=seoBasePath(base);
  const links=docs.filter(doc=>doc.root===root).map(doc=>`<li><a href="${basePath}${doc.path}">${seoEscape(doc.title)}</a><p>${seoEscape(doc.description)}</p></li>`).join("");
  return `<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>${seoEscape(title)}</h1></div><section class="docs-sitemap-grid"><section class="area-overview-card"><ol>${links}</ol></section></section></main>`;
}
function seoHomeBody(){return `<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>本地优先的多模型智能体</h1><p class="doc-lede">UIChat Mira 让对话、模型、角色、文件、知识与工具在同一个持续上下文中协同工作。</p></div></main>`}
function seoJsonLd(doc:SeoDoc|undefined,url:string){
  if(!doc)return {"@context":"https://schema.org","@type":"WebSite",name:"UIChat Mira",url};
  return {"@context":"https://schema.org","@type":doc.root==="blogs"?"Article":"TechArticle",headline:doc.title,description:doc.description,url,datePublished:doc.date,author:doc.author.map(name=>({"@type":"Person",name})),publisher:{"@type":"Organization",name:"UIChat Mira"}};
}
function seoHtml(template:string,body:string,title:string,description:string,url:string,type:string,doc?:SeoDoc,base:string="/"){
  const safeTitle=seoEscape(`${title} · UIChat Mira`);
  const safeDescription=seoEscape(description);
  const json=JSON.stringify(seoJsonLd(doc,url)).replace(/</g,"\\u003c");
  const head=`<meta name="description" content="${safeDescription}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:type" content="${type}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="UIChat Mira"><meta property="og:image" content="${seoEscape(logoUrl || seoRouteUrl("/","/mira-logo.png"))}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${safeTitle}"><meta name="twitter:description" content="${safeDescription}"><script type="application/ld+json">${json}</script>`;
  const assetBase=base==="/"?"/":base;
  const assetTemplate=template.replace(/(href|src)="\/mira-logo\.png"/g,`$1="${assetBase}mira-logo.png"`);
  return assetTemplate.replace(/<title>[\s\S]*?<\/title>/i,`<title>${safeTitle}</title>`).replace(/<meta name="description"[^>]*>/i,"").replace("</head>",`${head}</head>`).replace('<div id="root"></div>',`<div id="root">${body}</div>`);
}
function seoBuildPlugin(base:string){
  return {name:"seo-static-pages",writeBundle(){
    const outputDir=resolve(projectRoot,"dist");
    const template=readFileSync(resolve(outputDir,"index.html"),"utf8");
    if(typeof template!=="string")return;
    const docs=seoDocs();
    const routes=new Map<string,{body:string;title:string;description:string;type:string;doc?:SeoDoc}>();
    routes.set("/",{body:seoHomeBody(),title:"本地优先的多模型智能体",description:"UIChat Mira 多模型本地智能体产品文档",type:"website"});
    const roots=[...new Set(docs.map(doc=>doc.root))];
    roots.forEach(root=>{
      const rootDocs=docs.filter(doc=>doc.root===root);
      if(root!=="docs")routes.set(`/${root}`,{body:seoAreaBody(root,rootDocs,base),title:root==="blogs"?"博客":rootDocs[0]?.title||root,description:rootDocs[0]?.description||"UIChat Mira 文档与博客",type:"website"});
    });
    docs.forEach(doc=>routes.set(doc.path,{body:seoDocumentBody(doc),title:doc.title,description:doc.description||"UIChat Mira 文档",type:doc.root==="blogs"?"article":"article",doc}));
    const urls:string[]=[];
    for(const [path,page] of routes){
      const url=seoRouteUrl(base,path);
      const html=seoHtml(template,page.body,page.title,page.description,url,page.type,page.doc,base);
      const fileName=path==="/"?"index.html":`${path.slice(1).replace(/\/+$/g,"")}/index.html`;
      const outputFile=resolve(outputDir,fileName);
      mkdirSync(dirname(outputFile),{recursive:true});
      writeFileSync(outputFile,html,"utf8");
      urls.push(url);
    }
    const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${seoEscape(url)}</loc></url>`).join("")}</urlset>`;
    writeFileSync(resolve(outputDir,"sitemap.xml"),sitemap,"utf8");
    writeFileSync(resolve(outputDir,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${seoRouteUrl(base,"/sitemap.xml").replace(/\/$/,"")}\n`,"utf8");
  }};
}

export default defineConfig(({ mode }) => ({
  server: {
    port: 5174,
  },
  plugins: [pageDirectoriesPlugin(), blogDirectoryCheck(), react(), tailwindcss(), VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["mira-logo.png"],
    manifest: {
      name: "UIChat Mira",
      short_name: "Mira",
      description: "本地优先的多模型智能体工作空间",
      start_url: "./",
      scope: "./",
      display: "standalone",
      theme_color: "#cc785c",
      background_color: "#faf9f5",
      icons: [
        {src: "mira-logo.png", sizes: "any", type: "image/png", purpose: "any"},
      ],
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
  }), ...(seoConfig.enabled ? [seoBuildPlugin(mode === "github-pages" ? "/uichat-mira-docs/" : "/")] : [])],
  base: mode === "github-pages" ? "/uichat-mira-docs/" : "/",
}));
