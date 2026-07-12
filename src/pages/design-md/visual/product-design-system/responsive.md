---
title: 响应式行为
description: Claude 视觉设计系统的响应式行为。
group: 视觉设计
order: 70
merge: product-design-system
---

::: html
<div class="claude-visual">
<section class="band" id="responsive">
      <div class="band-inner">
        <div class="section-head">
          <span class="eyebrow">07 · 响应式</span>
          <h2>断点行为</h2>
        </div>
        <table class="resp-table">
          <tr><th>组件</th><th>断点行为</th></tr>
          <tr><td>顶部导航</td><td>&lt;768px 收起为汉堡菜单，展开为全屏米色抽屉</td></tr>
          <tr><td>Hero 区块</td><td>6:6 网格收起为单列：先显示 h1 + 副标题 + 按钮，插画/产品截图卡片放在下方；标题字号从 64px 降到 32px</td></tr>
          <tr><td>功能卡片网格</td><td>缩减列数而不是缩小卡片本身</td></tr>
          <tr><td>定价卡片</td><td>4 栏 → 2 栏 → 1 栏；被选中档位的深色背景在所有断点下都保持醒目</td></tr>
          <tr><td>代码窗口卡片</td><td>代码保持原字号，横向滚动而不是换行，确保可读性</td></tr>
          <tr><td>连接器卡片</td><td>整张卡片都可点击，有效点击区域远大于 44px</td></tr>
          <tr><td>圆形图标按钮</td><td>固定 36×36px，略小于 WCAG 建议的 44px，但视觉上居中对齐</td></tr>
          <tr><td>页脚</td><td>4 栏收起为 1 栏</td></tr>
        </table>
      </div>
    </section>
</div>
:::
