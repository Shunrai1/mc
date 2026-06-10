---
name: vtj-debug-panel
description: 为 3D 组件配置 Tweakpane 调试面板。当需要通过 #debug 接口添加调试控制、监控组件状态或实时调整参数时使用。
---

# vite-threejs 调试面板 (Tweakpane)

## 概述

使用 Tweakpane 创建实时参数调整面板。通过 `#debug` URL 哈希激活。

**核心原则：**
- 每个可调参数都应有控制项
- 颜色必须使用 `view: 'color'`
- 分层组织面板（最多 3 级）

## 快速开始

```javascript
constructor() {
  this.experience = new Experience()
  this.debug = this.experience.debug

  this.params = { intensity: 1.0, color: '#ffffff' }

  if (this.debug.active) {
    this.debugInit()
  }
}

debugInit() {
  this.debugFolder = this.debug.ui.addFolder({
    title: 'Component Name',
    expanded: false,
  })

  this.debugFolder.addBinding(this.params, 'intensity', {
    min: 0, max: 10, step: 0.1,
  })
}
```

## 使用场景

- 创建新的 3D 组件
- 添加 ShaderMaterial uniform 控制
- 监控运行时状态
- 添加操作按钮

## 控制类型

| 类型 | 关键配置 |
|------|----------|
| 数字 | `min`, `max`, `step` |
| 颜色 | `view: 'color'` (必需) |
| 3D 点 | `view: 'point3d'` |
| 布尔 | 无需额外配置 |
| 下拉选择 | `options: { label: value }` |
| 按钮 | `addButton({ title })` |

**详细示例：** 查看 [references/controls.md](references/controls.md)

## ShaderMaterial 集成

所有 ShaderMaterial uniform 必须有调试控制：

```javascript
folder.addBinding(this.params, 'color', { view: 'color' })
  .on('change', (ev) => {
    this.material.uniforms.uColor.value.set(ev.value)
  })
```

**完整模式：** 查看 [references/shader-debug.md](references/shader-debug.md)

## 常见错误

- ❌ 颜色没有 `view: 'color'`
- ❌ 直接提取 `this.debug.ui`
- ❌ 不检查 `debug.active` 就调用 `debugInit()`
- ❌ 嵌套超过 3 级
- ❌ 默认全部展开面板

**完整错误目录：** 查看 [references/common-mistakes.md](references/common-mistakes.md)

## 快速参考

| 需求 | 代码 |
|------|------|
| 访问 debug | `this.debug = this.experience.debug` |
| 检查激活状态 | `if (this.debug.active)` |
| 创建文件夹 | `this.debug.ui.addFolder({ title })` |
| 绑定参数 | `folder.addBinding(params, 'key', options)` |
| 处理变更 | `.on('change', callback)` |
| 方法名 | `debugInit()` |

**高级模式：** 查看 [references/advanced-patterns.md](references/advanced-patterns.md)
