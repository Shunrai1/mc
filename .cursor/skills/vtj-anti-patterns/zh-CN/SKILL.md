---
name: vtj-anti-patterns
description: 防止 vite-threejs 项目中的常见错误和禁止做法。在编写代码前使用，以避免 bug、内存泄漏和维护问题。
---

# vite-threejs 反模式（禁止事项）

## 概述

本文档列出本项目中 **禁止的做法**。违反这些规则会导致 bug、内存泄漏或维护困难。

**在编写任何代码之前，请先检查此列表。**

## 禁止清单

### 1. 类型安全

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| `as any` | 隐藏类型错误 | 正确定义类型 |
| `@ts-ignore` | 绕过检查 | 修复类型问题 |
| `@ts-expect-error` | 绕过检查 | 修复类型问题 |

```javascript
// ❌ FORBIDDEN
const value = someObject as any
// @ts-ignore
problematicCode()

// ✅ CORRECT
const value = someObject // 确保类型正确
```

### 2. 错误处理

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 空 catch 块 | 吞掉错误，调试困难 | 记录或重新抛出 |
| 删除失败的测试 | 隐藏问题 | 修复测试或标记 skip |

```javascript
// ❌ FORBIDDEN
try {
  riskyOperation()
}
catch (e) {} // 空 catch！

// ✅ CORRECT
try {
  riskyOperation()
}
catch (e) {
  console.error('Operation failed:', e)
  // 或重新抛出
  throw e
}
```

### 3. 资源管理

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 缺少 destroy() | 内存泄漏 | 涉及 Object3D 必须实现 |
| 不清理事件监听 | 内存泄漏 | destroy() 中 emitter.off() |
| 不 dispose 材质/几何体 | GPU 内存泄漏 | 销毁时 dispose() |

```javascript
// ❌ FORBIDDEN: 创建 mesh 但没有 destroy
class BadComponent {
  constructor() {
    this.mesh = new THREE.Mesh(...)
    this.scene.add(this.mesh)
    emitter.on('event', this.handler.bind(this))
  }
  // 没有 destroy() → 泄漏！
}

// ✅ CORRECT
class GoodComponent {
  constructor() {
    this.mesh = new THREE.Mesh(...)
    this.scene.add(this.mesh)
    this._boundHandler = this.handler.bind(this)
    emitter.on('event', this._boundHandler)
  }

  destroy() {
    emitter.off('event', this._boundHandler)
    this.scene.remove(this.mesh)
    this.mesh.geometry?.dispose()
    this.mesh.material?.dispose()
    this.mesh = null
  }
}
```

### 4. 输入处理

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 手动计算 NDC | 不一致，易出错 | 使用 iMouse.normalizedMouse |
| 直接监听 window 事件 | 绕过输入系统 | 使用 mitt 事件 |
| 匿名事件监听器 | 无法清理 | 保存函数引用 |

```javascript
// ❌ FORBIDDEN
const x = (event.clientX / window.innerWidth) * 2 - 1
window.addEventListener('keydown', e => this.handle(e))
emitter.on('event', data => this.process(data))

// ✅ CORRECT
const ndc = this.iMouse.normalizedMouse
emitter.on('input:jump', this._boundHandler) // 保存引用
```

### 5. 层分离

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| Vue 直接操作 Three.js | 破坏解耦 | 通过 mitt 事件 |
| Vue 导入 3D 组件类 | 职责混淆 | 只通过事件交互 |
| Three.js 直接写 Pinia | 违反数据流 | emit 事件让 Vue 处理 |

```javascript
// ❌ FORBIDDEN (在 Vue 中)
import Experience from '@three/experience.js'
const exp = new Experience()
exp.world.player.setPosition(0, 0, 0)

// ✅ CORRECT
emitter.emit('game:player-teleport', { x: 0, y: 0, z: 0 })
```

### 6. 调试方法

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| `debuggerInit()` | 命名不一致 | 使用 `debugInit()` |
| `setDebug()` | 命名不一致 | 使用 `debugInit()` |
| 直接访问 debug.ui | 跳过 active 检查 | 先检查 debug.active |

```javascript
// ❌ FORBIDDEN
debuggerInit() { ... }
setDebug() { ... }
this.debug = this.experience.debug.ui

// ✅ CORRECT
constructor() {
  this.debug = this.experience.debug
  if (this.debug.active) {
    this.debugInit()
  }
}
debugInit() {
  this.debugFolder = this.debug.ui.addFolder(...)
}
```

### 7. 时间访问

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 通过参数传递 deltaTime | 不一致 | 通过 Experience 访问 |

```javascript
// ❌ FORBIDDEN
update(deltaTime) {
  this.mesh.rotation.y += deltaTime
}

// ✅ CORRECT
update() {
  const delta = this.experience.time.delta
  this.mesh.rotation.y += delta * 0.001
}
```

### 8. 着色器

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 着色器放 js 目录 | 组织混乱 | 放 src/shaders/ |
| 无调试面板的 uniform | 无法调参 | 必须有 debugInit |
| 颜色不用 view: 'color' | 调参困难 | Tweakpane 用 color view |

```javascript
// ❌ FORBIDDEN
import shader from './world/effect.glsl'  // 在 js 目录

folder.addBinding(config, 'color')  // 没有 view: 'color'

// ✅ CORRECT
import shader from '@/shaders/effect/fragment.glsl'

folder.addBinding(config, 'color', { view: 'color' })
```

### 9. 性能

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 每个对象创建新几何体 | GPU 内存浪费 | 共享几何体 |
| 使用 splice() 移除实例 | O(n) 复杂度 | 使用 swap-and-pop |
| 忘记 needsUpdate = true | 不更新 | 每次修改后设置 |
| 同步区块生成 | 主线程阻塞 | 使用空闲队列 |

```javascript
// ❌ FORBIDDEN
for (const obj of objects) {
  const geometry = new THREE.BoxGeometry(1, 1, 1) // 每个都创建新几何体！
}

// ✅ CORRECT
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1) // 共享几何体
for (const obj of objects) {
  const mesh = new THREE.Mesh(sharedGeometry, material)
}
```
