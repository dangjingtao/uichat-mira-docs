---
title: 字体系统
description: Claude 视觉设计系统的字体系统。
group: 视觉设计
order: 20
merge: product-design-system
---

::: html
<div class="claude-visual">
<section class="band" id="type">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">02 · 字体</span>
          <h2>字体角色与字号</h2>
          <p>展示字体是原版的 Copernicus（衬线，此处用 Cormorant Garamond 替代），只用常规字重、不加粗，并且在大号字上必须带负字距，否则会失去"文学感"。正文与界面统一使用无衬线的 StyreneB（此处用 Public Sans 替代），标签常用等宽字体做点缀。</p>
        </div>
        <div class="type-row">
          <span class="type-sample" style="font-size:64px;letter-spacing:-1.5px">Aa 展示级 display-lg</span>
          <span class="type-label">Copernicus(→Cormorant Garamond) · 400 · 64px · 字距 −1.5px</span>
        </div>
        <div class="type-row">
          <span class="type-sample" style="font-size:40px;letter-spacing:-1px">Aa 区块标题 display-sm</span>
          <span class="type-label">Copernicus · 400 · 40px · 字距 −1px</span>
        </div>
        <div class="type-row">
          <span class="type-sample" style="font-size:28px;letter-spacing:-.3px">Aa 卡片大标题 title-xl</span>
          <span class="type-label">Copernicus · 400 · 28px · 字距 −0.3px</span>
        </div>
        <div class="type-row">
          <span class="type-sample-sans" style="font-size:20px;font-weight:600">Aa 卡片标题 title-lg</span>
          <span class="type-label">StyreneB(→Public Sans) · 600 · 20px</span>
        </div>
        <div class="type-row">
          <span class="type-sample-sans" style="font-size:17px;font-weight:600">Aa 组件标题 title-md</span>
          <span class="type-label">Public Sans · 600 · 17px</span>
        </div>
        <div class="type-row">
          <span class="type-sample-sans" style="font-size:16px;font-weight:400">Aa 正文段落 body-md</span>
          <span class="type-label">Public Sans · 400 · 16px / 1.6</span>
        </div>
        <div class="type-row">
          <span class="type-sample-sans" style="font-size:14px;font-weight:500">Aa 导航链接 nav-link / 按钮文字 button</span>
          <span class="type-label">Public Sans · 500 · 14px</span>
        </div>
        <div class="type-row">
          <span class="type-sample-sans" style="font-size:13px;font-weight:500">Aa 小号标签 caption</span>
          <span class="type-label">Public Sans · 500 · 13px</span>
        </div>
        <div class="type-row">
          <span class="mono-label" style="font-size:12px">AA 大写标签 CAPTION-UPPERCASE</span>
          <span class="type-label">mono · 500 · 12px · 字距 1.5px · 大写</span>
        </div>
        <div class="type-row">
          <span style="font-family:var(--font-mono);font-size:13px">const claude = "code block";</span>
          <span class="type-label">JetBrains Mono · 400 · 13px（代码块专用）</span>
        </div>
        <p class="note-card" style="margin-top:var(--sp-md)">字体替代说明：Copernicus 与 StyreneB 是 Anthropic 的授权字体，未公开提供 Web Font。第三方分析建议的替代顺序为 —— 衬线：Tiempos Headline / Cormorant Garamond / EB Garamond；无衬线：Inter / Söhne / Public Sans。</p>
      </div>
    </section>
</div>
:::
