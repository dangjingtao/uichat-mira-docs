---
title: Frontmatter 参考
description: Mira-Docs 当前支持的 Markdown 元数据字段。
group: 参考
order: 10
---

# Frontmatter 参考

Mira-Docs 使用文档开头的 YAML 风格块读取页面元数据。当前实现按行读取 `key: value`，不支持嵌套对象、数组或多行值。

## 完整示例

```yaml
---
title: 导航如何生成
description: Mira-Docs 如何从目录和 Markdown 文件生成页面导航。
nav: Mira-Docs
group: 快速开始
order: 3
merge: product-design-system
mergeIndex: true
---
```

## 字段规则

### title

页面标题。缺失时使用路由路径，正式文章不应省略。

### description

页面摘要。缺失时为空；文档区没有文章摘要时，会使用默认的空目录说明。

### nav

独立文档区的顶部导航名称。索引会使用该目录排序后的第一篇文章的 `nav` 值；没有声明时，使用目录名转换出的标题。

### group

默认文档区的侧边分组名称。独立文档区的侧边导航不使用这个字段，而是使用文件目录生成分组。

### order

数字排序值。数值越小越靠前；缺失时按 `99` 处理。

### merge

把多篇 Markdown 合并为一个页面。拥有相同 `merge` 值的文件会按 `order` 排序后拼接；分段文件不会单独生成文章路由。

### mergeIndex

合并页入口标记。只有同时声明 `merge: ...` 和 `mergeIndex: true` 的文件保留为页面路由，页面路径由这个入口文件决定。
