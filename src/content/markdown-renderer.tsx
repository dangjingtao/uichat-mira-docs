import { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js/lib/common";
import { slug } from "./mira-docs-adapter";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character] || character
  ));
}

function removeMarkdownH1(source: string) {
  let inFence = false;
  return source
    .split(/\r?\n/)
    .filter((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return true;
      }
      return inFence || !/^#\s+/.test(line);
    })
    .join("\n");
}

function renderCodeBlock(text: string, lang?: string) {
  const language = lang?.trim().toLowerCase();
  if (language === "mermaid") {
    return `<div class="markdown-mermaid" data-mermaid data-mermaid-source="${escapeHtml(text)}"></div>`;
  }
  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(text, { language, ignoreIllegals: true }).value
    : hljs.highlightAuto(text).value;
  const languageClass = language && /^[a-z0-9-]+$/.test(language)
    ? ` language-${language}`
    : "";
  return `<pre><code class="hljs${languageClass}">${highlighted}</code></pre>`;
}

function restoreHtmlBlocks(html: string, htmlBlocks: string[]) {
  return htmlBlocks.reduce((result, block, index) => {
    const placeholder = `MIRA_HTML_BLOCK_${index}`;
    return result.replace(
      new RegExp(`<p>${placeholder}</p>|${placeholder}`, "g"),
      block,
    );
  }, html);
}

function addHeadingAnchors(html: string) {
  return html.replace(
    /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g,
    (_, level, attributes, text) => {
      if (/\bid\s*=\s*["'][^"']+["']/i.test(attributes)) {
        return `<h${level}${attributes}>${text}</h${level}>`;
      }
      const id = slug(text);
      return id
        ? `<h${level}${attributes} id="${id}">${text}<a class="md-anchor" href="#${id}">#</a></h${level}>`
        : `<h${level}${attributes}>${text}</h${level}>`;
    },
  );
}

export function renderMarkdown(source: string) {
  const htmlBlocks: string[] = [];
  const prepared = removeMarkdownH1(source)
    .replace(
      /::: tip ([\s\S]*?):::/g,
      '<div class="md-custom-block"><strong>提示</strong><p>$1</p></div>',
    )
    .replace(/::: html\s*([\s\S]*?):::/g, (_, html) => {
      const index = htmlBlocks.push(html.trim()) - 1;
      return `MIRA_HTML_BLOCK_${index}`;
    });

  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }) => renderCodeBlock(text, lang);

  const html = marked.parse(prepared, { gfm: true, renderer }) as string;
  return addHeadingAnchors(restoreHtmlBlocks(html, htmlBlocks));
}

async function renderMermaid(container: HTMLElement) {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>("[data-mermaid]"),
  );
  if (!nodes.length) return;

  try {
    const { default: mermaid } = await import("mermaid");
    const dark = document.documentElement.classList.contains("dark");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "base",
      themeVariables: dark ? undefined : {
        fontFamily: "Public Sans, sans-serif",
        primaryColor: "#efe9de",
        primaryTextColor: "#141413",
        lineColor: "#cc785c",
        secondaryColor: "#f5f0e8",
        tertiaryColor: "#faf9f5",
      },
    });
    await Promise.all(nodes.map(async (node, index) => {
      const sourceCode = node.dataset.mermaidSource || "";
      const result = await mermaid.render(
        `mira-mermaid-${Date.now()}-${index}`,
        sourceCode,
      );
      node.innerHTML = result.svg;
    }));
  } catch (error) {
    console.warn("Mira Mermaid 图表渲染失败，已保留源码。", error);
    for (const node of nodes) {
      node.textContent = node.dataset.mermaidSource || "";
    }
  }
}

export function RenderedMarkdown({
  html,
  className = "markdown",
}: Readonly<{
  html: string;
  className?: string;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let renderQueue = Promise.resolve();
    const scheduleRender = () => {
      renderQueue = renderQueue.then(async () => {
        if (active) await renderMermaid(container);
      });
    };

    scheduleRender();
    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
