# UIChat Mira 产品文档

Markdown 驱动的 UIChat Mira 产品文档站，提供分组导航、页内目录、全文搜索、上一篇/下一篇、代码块和明暗主题。

## 内容维护

所有文档都在 `docs/*.md`。新增或修改文档后，提交到 `main` 即可自动发布。

## 本地开发

```bash
npm install
npm run dev
```

## GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`，推送到 `main` 后自动构建并发布。

## Cloudflare Pages

在 Cloudflare Pages 中连接本仓库并使用：

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `22`

无需单独维护 Cloudflare 分支或配置文件。
