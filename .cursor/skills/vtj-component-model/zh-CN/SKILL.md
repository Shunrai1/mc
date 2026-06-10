---
name: vtj-component-model
description: 使用 Experience 单例模式创建 3D 组件。用于在 src/js/ 中构建新类、实现生命周期方法或管理 Three.js 对象。
---

# vite-threejs 3D 组件模型

## 概述

本项目中所有 3D 组件都遵循 **类-based 单例模式**。组件通过 `Experience` 单例访问共享资源，并实现标准化的生命周期方法。

**核心原则**：按需提取，只实现所有必需的 lifecycle 方法，始终清理资源。

## 使用场景

- 在 `src/js/` 中创建任何新类
- 构建与场景交互的 3D 对象、管理器、控制器或工具类
- 封装 Three.js 功能为可复用组件

## 组件模板

```javascript
import Experience from '@/js/experience.js'
import emitter from '@/js/utils/event-bus.js'
import * as THREE from 'three'

export default class YourComponent {
  constructor(options = {}) {
    // 1. 获取 Experience 单例
    this.experience = new Experience()

    // 2. 按需提取依赖（仅取所需，避免冗余）
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    // 3. 组件参数
    this.params = {
      enabled: options.enabled ?? true,
      // ... 其他参数
    }

    // 4. 组件状态
    this.mesh = null

    // 5. 初始化
    this._init()

    // 6. 调试面板（必须在 debug.active 条件下调用）
    if (this.debug.active) {
      this.debugInit()
    }
  }

  _init() {
    // 创建 3D 对象并添加到场景
    this.mesh = new THREE.Mesh(/* ... */)
    this.scene.add(this.mesh)
  }

  debugInit() {
    // 调试面板 - 详见 vtj-debug-panel skill
  }

  update() {
    // 每帧更新逻辑
    // 时间通过 this.experience.time 访问，不通过参数传递
  }

  resize() {
    // 窗口尺寸变化时调用
  }

  destroy() {
    // 清理资源 - 涉及 Object3D 的组件必须实现
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.mesh.geometry?.dispose()
      this.mesh.material?.dispose()
      this.mesh = null
    }
  }
}
```

## 依赖提取规则

**只提取组件实际需要的依赖**：

| 组件类型 | 典型依赖 |
|----------|----------|
| 渲染对象 | `scene`, `resources` |
| 交互组件 | `scene`, `camera.instance`, `iMouse` |
| 动画组件 | `scene`, `time` |
| 调试组件 | `debug` |
| UI 相关 | `sizes`, `canvas` |

```javascript
// ✅ GOOD: 只取所需
this.scene = this.experience.scene
this.resources = this.experience.resources

// ❌ BAD: 提取全部
this.scene = this.experience.scene
this.camera = this.experience.camera
this.renderer = this.experience.renderer
this.time = this.experience.time
this.sizes = this.experience.sizes
this.iMouse = this.experience.iMouse
this.debug = this.experience.debug
// ... 大部分根本用不到
```

## 生命周期方法

| 方法 | 必需条件 | 调用方 |
|------|----------|--------|
| `debugInit()` | 有可调参数 | 构造函数，`if (debug.active)` |
| `update()` | 有逐帧逻辑 | 父组件的 `update()` |
| `resize()` | 响应尺寸变化 | 父组件的 `resize()` |
| `destroy()` | **涉及 Object3D** | 父组件的 `destroy()` |

### destroy() 是强制要求

**任何涉及 Object3D 的组件必须实现 `destroy()` 方法**。

```javascript
destroy() {
  // 1. 移除事件监听
  emitter.off('some:event', this._handler)

  // 2. 从场景移除对象
  if (this.mesh) {
    this.scene.remove(this.mesh)
  }

  // 3. 销毁几何体
  this.mesh?.geometry?.dispose()

  // 4. 销毁材质
  if (this.mesh?.material) {
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose())
    } else {
      this.mesh.material.dispose()
    }
  }

  // 5. 销毁纹理（如果组件自己创建的）
  this.texture?.dispose()

  // 6. 销毁子组件
  this.childComponent?.destroy()

  // 7. 清空引用
  this.mesh = null
}
```

## 调试访问模式

**统一使用以下方式访问调试系统**：

```javascript
// 在构造函数中
this.debug = this.experience.debug

// 检查是否激活
if (this.debug.active) {
  this.debugInit()
}

// 在 debugInit() 中创建面板
debugInit() {
  this.debugFolder = this.debug.ui.addFolder({
    title: 'Component Name',
    expanded: false,
  })

  this.debugFolder.addBinding(this.params, 'someValue', {
    label: '参数名称',
    min: 0,
    max: 1,
  })
}
```

**注意**：
- 方法名统一使用 `debugInit()`（不是 `debugInit` 或 `setDebug`）
- 通过 `this.debug.ui` 访问 Tweakpane 实例
- 通过 `this.debug.active` 判断是否启用

## 常见错误

### ❌ 缺少 destroy() 方法

```javascript
// BAD: 组件创建了 mesh 但没有 destroy
class BadComponent {
  constructor() {
    this.mesh = new THREE.Mesh(...)
    this.scene.add(this.mesh)
    emitter.on('event', this.handler.bind(this))
  }
  // 没有 destroy() → 泄漏！
}

// GOOD: 正确实现 destroy
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

### ❌ 在 debug.active 检查前调用 debugInit

```javascript
// BAD
constructor() {
  this.debugInit() // 如果 #debug 未激活会崩溃
}

// GOOD
constructor() {
  if (this.debug.active) {
    this.debugInit()
  }
}
```

### ❌ 提取全部依赖

```javascript
// BAD: 提取不需要的依赖
this.scene = this.experience.scene
this.camera = this.experience.camera
this.renderer = this.experience.renderer
// ...

// GOOD: 只提取需要的
this.scene = this.experience.scene
this.debug = this.experience.debug
```
