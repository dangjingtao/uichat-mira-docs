import {readdirSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";

const projectRoot=dirname(fileURLToPath(import.meta.url));
const pagesRoot=resolve(projectRoot,"src/pages");
function pageDirectoryManifest(){return existsSync(pagesRoot)?readdirSync(pagesRoot,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name):[]}
function pageDirectoriesPlugin(){return{name:"page-directories",configureServer(server:any){server.watcher.add(pagesRoot)},resolveId(id:string){return id==="virtual:page-directories"?"\0virtual:page-directories":undefined},load(id:string){if(id!=="\0virtual:page-directories")return;return `export default ${JSON.stringify(pageDirectoryManifest())}`},handleHotUpdate({file,server}:any){const normalized=file.replace(/\\/g,"/");if(!normalized.startsWith(pagesRoot.replace(/\\/g,"/")))return;const module=server.moduleGraph.getModuleById("\0virtual:page-directories");if(module)server.moduleGraph.invalidateModule(module);server.ws.send({type:"full-reload"});return []}}}

export default defineConfig(({ mode }) => ({
  server: {
    port: 5174,
  },
  plugins: [pageDirectoriesPlugin(), react(), tailwindcss(), VitePWA({
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
  })],
  base: mode === "github-pages" ? "/uichat-mira-docs/" : "/",
}));
