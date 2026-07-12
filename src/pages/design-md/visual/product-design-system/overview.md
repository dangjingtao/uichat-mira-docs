---
title: 总览与定位
description: Claude 视觉设计系统的总览与定位。
group: 视觉设计
order: 2
merge: product-design-system
---

::: html
<div class="claude-visual">
<section class="band hero" id="overview">
      <div class="band-inner">
        <span class="eyebrow">非官方 · 第三方逆向分析 · 基于 VoltAgent/awesome-design-md</span>
        <div class="hero-grid">
          <div>
            <h1 class="hero-title">暖色画布上的<br>编辑体设计系统。</h1>
            <p class="lede">这份文档完整还原了社区对 Claude / Anthropic 网站视觉语言的公开分析。</p>
            <div class="hero-cta">
              <a class="btn btn-primary" href="#colors-brand">浏览完整色板</a>
              <a class="btn btn-secondary" href="#comp-nav">浏览全部组件</a>
            </div>
          </div>
          <div class="hero-illustration-card">
            <div class="stroke">
              <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="46" stroke="#cc785c" stroke-width="2"/>
                <path d="M100 34 L100 20 M100 126 L100 140 M54 80 L40 80 M146 80 L160 80" stroke="#cc785c" stroke-width="2" stroke-linecap="round"/>
                <circle cx="100" cy="80" r="6" fill="#cc785c"/>
              </svg>
            </div>
          </div>
        </div>
        <p class="note-card" style="margin-top:var(--sp-lg)">说明：以下所有代币（颜色、字号、间距、组件规则）均整理自公开的第三方分析文档，仅作学习与风格参考，并非 Anthropic 官方发布的设计规范，也不代表 claude.ai 产品界面的真实源码。</p>
      </div>
    </section>
<section class="band" id="colors-brand">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">01 · 色彩</span>
          <h2>品牌色与文字色</h2>
          <p>整个系统只保留一个强调色——珊瑚陶土色，其余全部依靠明暗层次的文字色阶来建立秩序。</p>
        </div>
        <div class="swatch-grid">
          <div class="swatch"><div class="swatch-fill" style="background:var(--primary)"></div><div class="swatch-meta"><div class="name">primary</div><div class="hex">#cc785c</div><div class="role">唯一品牌强调色，按钮/CTA/徽标</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--primary-active)"></div><div class="swatch-meta"><div class="name">primary-active</div><div class="hex">#a9583e</div><div class="role">按钮按下态</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--primary-disabled)"></div><div class="swatch-meta"><div class="name">primary-disabled</div><div class="hex">#e6dfd8</div><div class="role">禁用态背景</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--ink)"></div><div class="swatch-meta"><div class="name">ink</div><div class="hex">#141413</div><div class="role">标题 / 高对比正文</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--body-c)"></div><div class="swatch-meta"><div class="name">body</div><div class="hex">#3d3d3a</div><div class="role">正文段落</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--body-strong)"></div><div class="swatch-meta"><div class="name">body-strong</div><div class="hex">#252523</div><div class="role">加粗正文 / 强调句</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--muted)"></div><div class="swatch-meta"><div class="name">muted</div><div class="hex">#6c6a64</div><div class="role">次要文字</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--muted-soft)"></div><div class="swatch-meta"><div class="name">muted-soft</div><div class="hex">#8e8b82</div><div class="role">占位符 / 三级文字</div></div></div>
        </div>
      </div>
    </section>
<section class="band" id="colors-surface">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">01 · 色彩</span>
          <h2>底色与表面层级</h2>
          <p>画布必须是带暖调的米白色，而不是纯白或冷灰——这是与其它 AI 产品拉开辨识度的关键。</p>
        </div>
        <div class="swatch-grid">
          <div class="swatch"><div class="swatch-fill" style="background:var(--canvas)"></div><div class="swatch-meta"><div class="name">canvas</div><div class="hex">#faf9f5</div><div class="role">页面主底色</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--surface-soft)"></div><div class="swatch-meta"><div class="name">surface-soft</div><div class="hex">#f5f0e8</div><div class="role">轻微区隔的分区底色</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--surface-card)"></div><div class="swatch-meta"><div class="name">surface-card</div><div class="hex">#efe9de</div><div class="role">卡片背景（比画布更深一级）</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--surface-cream-strong)"></div><div class="swatch-meta"><div class="name">surface-cream-strong</div><div class="hex">#e8e0d2</div><div class="role">强调型米色区块</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--hairline)"></div><div class="swatch-meta"><div class="name">hairline</div><div class="hex">#e6dfd8</div><div class="role">卡片细边框</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--hairline-soft)"></div><div class="swatch-meta"><div class="name">hairline-soft</div><div class="hex">#ebe6df</div><div class="role">更轻的分隔线</div></div></div>
        </div>
      </div>
    </section>
<section class="band" id="colors-dark" style="background:var(--surface-dark)">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow" style="background:rgba(250,249,245,.1);color:var(--on-dark)">01 · 色彩</span>
          <h2 style="color:var(--on-dark)">深色对比板块</h2>
          <p style="color:var(--on-dark-soft)">深色只出现在页脚与少数收尾 CTA、以及产品截图（代码编辑器 / 聊天界面）模块中，从不作为页面主基调。</p>
        </div>
        <div class="swatch-grid">
          <div class="swatch"><div class="swatch-fill" style="background:var(--surface-dark)"></div><div class="swatch-meta"><div class="name">surface-dark</div><div class="hex">#181715</div><div class="role">深色板块底色 / 页脚</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--surface-dark-elevated)"></div><div class="swatch-meta"><div class="name">surface-dark-elevated</div><div class="hex">#252320</div><div class="role">深色内嵌卡片 / 状态栏</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--surface-dark-soft)"></div><div class="swatch-meta"><div class="name">surface-dark-soft</div><div class="hex">#1f1e1b</div><div class="role">深色次级分区</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--on-dark)"></div><div class="swatch-meta"><div class="name">on-dark</div><div class="hex">#faf9f5</div><div class="role">深色背景上的主文字</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--on-dark-soft)"></div><div class="swatch-meta"><div class="name">on-dark-soft</div><div class="hex">#a09d96</div><div class="role">深色背景上的次要文字</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--on-primary)"></div><div class="swatch-meta"><div class="name">on-primary</div><div class="hex">#ffffff</div><div class="role">珊瑚色按钮上的文字</div></div></div>
        </div>
      </div>
    </section>
<section class="band" id="colors-accent">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">01 · 色彩</span>
          <h2>辅助色与状态色</h2>
          <p>青绿与琥珀作为极少量的点缀色（多见于代码高亮），成功/警告/错误则是常规语义色，同样只做点缀，不作为大面积色块。</p>
        </div>
        <div class="swatch-grid">
          <div class="swatch"><div class="swatch-fill" style="background:var(--accent-teal)"></div><div class="swatch-meta"><div class="name">accent-teal</div><div class="hex">#5db8a6</div><div class="role">代码高亮 / 图表点缀</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--accent-amber)"></div><div class="swatch-meta"><div class="name">accent-amber</div><div class="hex">#e8a55a</div><div class="role">代码高亮 / 图表点缀</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--success)"></div><div class="swatch-meta"><div class="name">success</div><div class="hex">#5db872</div><div class="role">成功状态</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--warning)"></div><div class="swatch-meta"><div class="name">warning</div><div class="hex">#d4a017</div><div class="role">警告状态</div></div></div>
          <div class="swatch"><div class="swatch-fill" style="background:var(--error)"></div><div class="swatch-meta"><div class="name">error</div><div class="hex">#c64545</div><div class="role">错误状态</div></div></div>
        </div>
      </div>
    </section>
</div>
:::
