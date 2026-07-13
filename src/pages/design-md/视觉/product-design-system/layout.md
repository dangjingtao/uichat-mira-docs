---
title: 布局与节奏
description: Claude 视觉设计系统的布局与节奏。
group: 视觉设计
order: 40
merge: product-design-system
---

::: html
<div class="claude-visual">
<section class="band" id="layout">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">04 · 布局</span>
          <h2>网格、间距与页面节奏</h2>
          <p>Hero 区域采用 6:6 对称网格；主要板块之间统一使用 96px 的大间距（spacing.section），营造出杂志专栏式的呼吸感；卡片内部统一使用 32px 内边距。</p>
        </div>
        <h4 style="margin-bottom:8px">12 栏网格示意</h4>
        <div class="grid-demo">
          <div style="grid-column:span 6"></div><div style="grid-column:span 6"></div>
        </div>
        <p class="note-card" style="margin-top:var(--sp-md)">节奏规则：页面表面模式必须交替出现，不能连续两个板块使用相同底色 —— 米色 → 米色卡片 → 深色产品截图 → 米色 → 珊瑚色 CTA → 深色页脚，如此循环。</p>
        <table class="resp-table" style="margin-top:var(--sp-md)">
          <tr><th>间距代币</th><th>数值</th><th>典型用途</th></tr>
          <tr><td>sp-xs</td><td>8px</td><td>徽标 / 标签内边距</td></tr>
          <tr><td>sp-sm</td><td>16px</td><td>组件内部小间距</td></tr>
          <tr><td>sp-md</td><td>24px</td><td>卡片间距</td></tr>
          <tr><td>sp-lg</td><td>32px</td><td>卡片内边距</td></tr>
          <tr><td>sp-xl</td><td>48px</td><td>板块内左右留白</td></tr>
          <tr><td>sp-section</td><td>96px</td><td>主要板块之间的垂直间距</td></tr>
        </table>
      </div>
    </section>
</div>
:::
