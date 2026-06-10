# 调试面板 - 高级模式

复杂的面板结构和专用用例。

## 文件夹层级

```javascript
debugInit() {
  // Level 1: 组件主文件夹
  const mainFolder = this.debug.ui.addFolder({
    title: 'Environment',
    expanded: false,
  })

  // Level 2: 功能分组
  const lightFolder = mainFolder.addFolder({
    title: 'Sun Light',
    expanded: true,  // 常用功能：展开
  })

  const fogFolder = mainFolder.addFolder({
    title: 'Fog',
    expanded: false,  // 次要功能：折叠
  })

  // Level 3: 细节（最大深度）
  const shadowFolder = lightFolder.addFolder({
    title: 'Shadow Settings',
    expanded: false,
  })
}
```

## 完整组件示例

```javascript
debugInit() {
  // 主面板
  this.debugFolder = this.debug.ui.addFolder({
    title: 'Block Raycaster',
    expanded: false,
  })

  // 设置分组
  const settings = this.debugFolder.addFolder({
    title: '设置',
    expanded: true
  })

  settings.addBinding(this.params, 'enabled', {
    label: '启用'
  }).on('change', () => {
    if (!this.params.enabled) this._clear()
  })

  settings.addBinding(this.params, 'maxDistance', {
    label: '最大距离',
    min: 1, max: 30, step: 0.5,
  }).on('change', () => {
    this.raycaster.far = this.params.maxDistance
  })

  // 监控分组
  const monitor = this.debugFolder.addFolder({
    title: '拾取监控',
    expanded: true
  })

  monitor.addBinding(this.debugInfo, 'log', {
    label: '实时状态',
    readonly: true,
    multiline: true,
    rows: 6,
  })

  // 操作分组
  const actions = this.debugFolder.addFolder({
    title: '快捷操作',
    expanded: false,
  })

  actions.addButton({ title: 'Reset' }).on('click', () => {
    this.reset()
  })
}
```

## 分组原则

| 原则 | 实现方式 |
|------|----------|
| 按功能分组 | Light / Fog / Shadow 分开文件夹 |
| 常用展开 | `expanded: true` 用于频繁使用的 |
| 次要折叠 | `expanded: false` 用于偶尔使用的 |
| 最大深度 | 不超过 3 层嵌套 |

## 访问模式参考

```javascript
// 正确的访问顺序
constructor() {
  this.experience = new Experience()
  this.debug = this.experience.debug  // 获取 debug 对象
}

debugInit() {
  // 首先检查 active
  if (!this.debug.active) return

  // 然后访问 ui
  this.debugFolder = this.debug.ui.addFolder({
    title: 'My Component',
  })
}
```
