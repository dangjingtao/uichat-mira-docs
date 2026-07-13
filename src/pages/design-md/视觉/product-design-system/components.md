---
title: 组件系统
description: Claude 视觉设计系统的组件系统。
group: 视觉设计
order: 30
merge: product-design-system
---

::: html
<div class="claude-visual">
<section class="band" id="comp-nav">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>顶部导航 top-nav</h2>
          <p>高度固定 64px，米白底色，左侧品牌标识，中间主菜单，右侧登录链接与珊瑚色主按钮。小于 768px 时收起为汉堡菜单，展开为全屏米色抽屉。</p>
        </div>
        <div class="demo-topnav">
          <div class="brand"><span class="mark"></span>Claude</div>
          <ul class="menu">
            <li><a href="#">产品</a></li>
            <li><a href="#">定价</a></li>
            <li><a href="#">公司</a></li>
          </ul>
          <div class="right">
            <a class="text-link" href="#">登录</a>
            <a class="btn btn-primary" href="#">试用 Claude</a>
          </div>
        </div>
      </div>
    </section>
<section class="band" id="comp-buttons">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>按钮、徽标与分段标签</h2>
          <p>按钮统一高度 40px，圆角 8px；徽标与标签统一使用全圆角（pill）；系统明确规定"按下态只会变暗，不会有其它任何 hover 效果"。</p>
        </div>
        <div class="demo-grid">
          <div class="demo-card">
            <h4>button-primary</h4>
            <div class="row">
              <a class="btn btn-primary" href="#">默认</a>
              <a class="btn btn-primary is-disabled" href="#" aria-disabled="true">禁用</a>
            </div>
          </div>
          <div class="demo-card">
            <h4>button-secondary</h4>
            <div class="row"><a class="btn btn-secondary" href="#">次要按钮</a></div>
          </div>
          <div class="demo-card" style="background:var(--surface-dark)">
            <h4 style="color:var(--on-dark)">button-icon-circular</h4>
            <div class="row"><span class="btn-icon-circular">✦</span></div>
          </div>
          <div class="demo-card">
            <h4>badge-pill / badge-coral</h4>
            <div class="row">
              <span class="badge-pill">连接器</span>
              <span class="badge-coral">New</span>
            </div>
          </div>
          <div class="demo-card">
            <h4>category-tab</h4>
            <div class="tab-row">
              <span class="tab active">全部</span>
              <span class="tab">模型</span>
              <span class="tab">研究</span>
            </div>
          </div>
        </div>
      </div>
    </section>
<section class="band" id="comp-input">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>输入框</h2>
          <p>米白底色配细边框，聚焦态切换为珊瑚色描边并附加淡色光晕，不使用系统默认蓝色焦点框。</p>
        </div>
        <div class="input-demo">
          <label for="ex-email">工作邮箱</label>
          <input id="ex-email" type="email" placeholder="you@company.com">
        </div>
      </div>
    </section>
<section class="band" id="comp-model">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>模型对比卡片 model-comparison-card</h2>
          <p>米色底、细边框、大圆角，配抽象几何缩略图，用于并排展示不同能力档位。</p>
        </div>
        <div class="model-grid">
          <div class="model-card"><div class="thumb"></div><h3>轻量版</h3><p>响应速度快，适合高频率的简单任务。</p><a class="text-link" href="#">了解更多 →</a></div>
          <div class="model-card"><div class="thumb"></div><h3>均衡版</h3><p>日常默认选择，兼顾速度与能力。</p><a class="text-link" href="#">了解更多 →</a></div>
          <div class="model-card"><div class="thumb"></div><h3>旗舰版</h3><p>面向最复杂任务，能力优先。</p><a class="text-link" href="#">了解更多 →</a></div>
        </div>
      </div>
    </section>
<section class="band" id="comp-feature">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>功能卡片 feature-card</h2>
          <p>比画布更深一级的米色（#efe9de），大内边距（32px）让文字更透气，顶部小图标 + 标题 + 描述的三段式结构。</p>
        </div>
        <div class="feature-grid">
          <div class="feature-card"><div class="icon"></div><h3>长上下文</h3><p>一次性处理更长的文档与对话历史。</p></div>
          <div class="feature-card"><div class="icon"></div><h3>工具调用</h3><p>连接外部工具，完成多步骤任务。</p></div>
          <div class="feature-card"><div class="icon"></div><h3>安全对齐</h3><p>训练过程中重视可靠与可控。</p></div>
        </div>
      </div>
    </section>
<section class="band" id="comp-mockup">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>深色产品卡片 product-mockup-card-dark</h2>
          <p>用于展示真实产品截图（代码编辑器 / 聊天界面），自带行号、语法高亮、状态栏等"内部纵深"，因此几乎不需要额外阴影。</p>
        </div>
        <div class="mockup-dark">
          <div class="titlebar"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
          <div class="line"><span class="kw">function</span> generateReport(<span class="str">"q3"</span>) {</div>
          <div class="line" style="padding-left:16px">return claude.analyze(data);</div>
          <div class="line">}</div>
          <div class="statusbar">main.ts · UTF-8 · Claude 正在协助编写代码</div>
        </div>
      </div>
    </section>
<section class="band" id="comp-pricing">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>定价卡片 pricing-tier-card</h2>
          <p>桌面端 3～4 栏并排，被选中的档位不额外加边框或角标，而是直接把整张卡片反转为深色背景——"深色即推荐"信号。移动端收起为单列。</p>
        </div>
        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="plan-name">个人版</div><div class="price">¥0</div><div class="price-sub">每月 · 个人使用</div>
            <ul class="feature-list"><li>基础对话额度</li><li>标准响应速度</li><li>社区支持</li></ul>
            <a class="btn btn-secondary" href="#">开始使用</a>
          </div>
          <div class="pricing-card featured">
            <div class="plan-name">专业版</div><div class="price">¥148</div><div class="price-sub">每月 · 按人数计费</div>
            <ul class="feature-list"><li>更高使用额度</li><li>优先响应速度</li><li>团队协作空间</li></ul>
            <a class="btn btn-on-coral" href="#">升级到专业版</a>
          </div>
          <div class="pricing-card">
            <div class="plan-name">团队版</div><div class="price">¥定制</div><div class="price-sub">每月 · 面向组织</div>
            <ul class="feature-list"><li>集中管理与权限</li><li>专属技术支持</li><li>安全与合规保障</li></ul>
            <a class="btn btn-secondary" href="#">联系销售</a>
          </div>
        </div>
      </div>
    </section>
<section class="band" id="comp-cta">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>CTA 板块 cta-band</h2>
          <p>珊瑚色版本用于常规页面收尾；深色版本更多出现在面向开发者的页面，常与代码窗口卡片搭配。两者都保持整块纯色填充、大圆角、无阴影。</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-md)">
          <div class="cta-band cta-band-coral">
            <h2>珊瑚色 CTA</h2>
            <p>用于常规页面收尾前的行动号召，通常搭配一句简短说明。</p>
            <div class="cta-actions">
              <a class="btn btn-on-coral" href="#">立即开始</a>
              <a class="btn btn-ghost-dark" href="#">查看文档</a>
            </div>
          </div>
          <div class="cta-band cta-band-dark">
            <h2>深色 CTA</h2>
            <p>面向开发者的页面更常用这种深色版本，常与代码窗口卡片搭配出现。</p>
            <div class="cta-actions">
              <a class="btn btn-primary" href="#">阅读接入文档</a>
              <a class="btn btn-ghost-dark" href="#">查看示例</a>
            </div>
          </div>
        </div>
      </div>
    </section>
<section class="band" id="comp-footer">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">03 · 组件</span>
          <h2>页脚 footer</h2>
          <p>深棕黑底色，四栏链接列表，顶部放品牌标识，垂直内边距 64px。页脚"永远不会反转成亮色"，是全站唯一固定的深色区域。</p>
        </div>
        <div class="demo-footer">
          <div class="top-row"><span class="mark" style="width:20px;height:20px;border-radius:50%;background:var(--primary);display:inline-block;position:relative"></span>Anthropic</div>
          <div class="footer-cols">
            <div><h5>产品</h5><ul><li>Claude</li><li>API</li><li>定价</li></ul></div>
            <div><h5>公司</h5><ul><li>关于我们</li><li>招聘</li><li>新闻</li></ul></div>
            <div><h5>资源</h5><ul><li>文档</li><li>研究</li><li>安全</li></ul></div>
            <div><h5>法务</h5><ul><li>隐私政策</li><li>使用条款</li></ul></div>
          </div>
        </div>
      </div>
    </section>
</div>
:::
