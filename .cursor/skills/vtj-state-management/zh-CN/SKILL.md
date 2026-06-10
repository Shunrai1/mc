---
name: vtj-state-management
description: 通过 Pinia 和 mitt 在 Vue 和 Three.js 之间管理状态。用于同步 UI 状态、发送事件或实现跨层通信。
---

# vite-threejs 状态管理（Pinia + mitt）

## 概述

本项目使用 **双通道状态管理**：
- **Pinia**：持久化状态，Vue 和 Three.js 双向同步
- **mitt**：即时事件通知，跨层通信

**核心原则**：Pinia 管状态，mitt 管事件。状态变更通过 Pinia，通知 Three.js 通过 mitt emit。

## 使用场景

- 需要在 Vue UI 和 Three.js 之间共享状态
- 需要从 UI 触发 3D 场景行为
- 需要从 3D 场景通知 UI 更新
- 管理游戏设置、用户偏好等持久状态

## 双通道架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Vue UI Layer                         │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   Components    │◄────────►│   Pinia Stores  │           │
│  └─────────────────┘          └────────┬────────┘           │
└────────────────────────────────────────┼────────────────────┘
                                         │ emitter.emit()
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      mitt Event Bus                          │
└─────────────────────────────────────────────────────────────┘
                                         │ emitter.on()
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Three.js Layer                          │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   Components    │◄────────►│   Experience    │           │
│  └─────────────────┘          └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Pinia Store 模式

### Store 定义

```javascript
// src/pinia/settingsStore.js
import emitter from '@three/utils/event-bus.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const shadowQuality = ref('high')

  // Action：修改状态 + 通知 Three.js
  function setShadowQuality(quality) {
    shadowQuality.value = quality
    emitter.emit('shadow:quality-changed', quality)  // 通知 Three.js
    saveSettings()  // 持久化
  }

  return { shadowQuality, setShadowQuality }
})
```

### 在 Vue 中使用

```vue
<script setup>
import { useSettingsStore } from '@pinia/settingsStore.js'

const settings = useSettingsStore()

function handleQualityChange(quality) {
  settings.setShadowQuality(quality)
}
</script>

<template>
  <select v-model="settings.shadowQuality" @change="handleQualityChange">
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  </select>
</template>
```

### 在 Three.js 中使用

```javascript
// 方式一：监听 mitt 事件（推荐）
import emitter from './utils/event-bus.js'

emitter.on('shadow:quality-changed', (quality) => {
  this.updateShadowQuality(quality)
})

// 方式二：直接读取 Pinia（需要时）
import { useSettingsStore } from '@pinia/settingsStore.js'

const settings = useSettingsStore()
const quality = settings.shadowQuality
```

## mitt Event Bus

### 事件总线定义

```javascript
// src/js/utils/event-bus.js
import mitt from 'mitt'
const emitter = mitt()
export default emitter
```

### 事件命名规范

| 前缀 | 来源 | 用途 | 示例 |
|------|------|------|------|
| `ui:` | Vue UI | UI 状态变化 | `ui:pause-changed` |
| `game:` | Vue/Three.js | 游戏逻辑事件 | `game:create_world` |
| `settings:` | Pinia Store | 设置变更通知 | `settings:environment-changed` |
| `core:` | Experience | 核心系统事件 | `core:ready`, `core:resize` |
| `shadow:` | 渲染相关 | 阴影设置 | `shadow:quality-changed` |

### 事件使用模式

```javascript
// 发送事件（Vue/Pinia 层）
emitter.emit('game:create_world', { seed, terrain, trees })
emitter.emit('ui:pause-changed', true)
emitter.emit('settings:environment-changed', { skyMode: 'HDR' })

// 监听事件（Three.js 层）
emitter.on('game:create_world', ({ seed, terrain, trees }) => {
  this.world.reset({ seed, terrain, trees })
})

emitter.on('ui:pause-changed', (paused) => {
  this.isPaused = paused
})

// 移除监听（destroy 时）
this._boundHandler = this.handleEvent.bind(this)
emitter.on('some:event', this._boundHandler)
// ...
emitter.off('some:event', this._boundHandler)
```

## 通信模式

### 模式一：UI → Three.js（最常用）

```javascript
// 1. Pinia Store 中定义 action
function setEnvFogDensity(value) {
  envFogDensity.value = value
  emitter.emit('settings:environment-changed', { fogDensity: value })
  saveSettings()
}

// 2. Three.js 组件监听
emitter.on('settings:environment-changed', (patch) => {
  if (patch.fogDensity !== undefined) {
    this.updateFog(patch.fogDensity)
  }
})
```

### 模式二：Three.js → UI

```javascript
// 1. Three.js 中发送事件
emitter.emit('game:player-health-changed', { health: 80, maxHealth: 100 })

// 2. Vue 组件监听
import emitter from '@three/utils/event-bus.js'
import { onMounted, onUnmounted, ref } from 'vue'

const health = ref(100)

function handleHealthChange({ health: newHealth }) {
  health.value = newHealth
}

onMounted(() => {
  emitter.on('game:player-health-changed', handleHealthChange)
})

onUnmounted(() => {
  emitter.off('game:player-health-changed', handleHealthChange)
})
```

## 何时使用 Pinia vs mitt

| 场景 | 推荐方案 |
|------|----------|
| 持久化状态（游戏设置、用户偏好） | Pinia |
| UI 和 3D 共享的状态（当前模式、选中对象） | Pinia |
| 即时事件（弹窗、提示、动画完成） | mitt |
| 一次性通知 | mitt |
| 需要在多处监听同一事件 | mitt |

## 常见错误

### ❌ Three.js 直接写入 Pinia

```javascript
// 错误：在 Three.js 组件中直接修改 Pinia 状态
import { useGameState } from '@pinia/gameState'
const gameState = useGameState()
gameState.isPaused = true  // 违反数据流！

// 正确：通过 mitt 发送事件
emitter.emit('ui:pause-changed', true)
```

### ❌ Vue 直接操作 Three.js

```javascript
// 错误：在 Vue 组件中直接操作 Three.js
import Experience from '@three/experience'
const exp = new Experience()
exp.world.player.setPosition(0, 0, 0)

// 正确：通过事件触发
emitter.emit('game:player-teleport', { x: 0, y: 0, z: 0 })
```

### ❌ 不清理事件监听

```javascript
// 错误：匿名监听器无法清理
emitter.on('some:event', (data) => this.handle(data))

// 正确：保存引用并在 destroy 中清理
this._boundHandler = this.handle.bind(this)
emitter.on('some:event', this._boundHandler)
// ...
destroy() {
  emitter.off('some:event', this._boundHandler)
}
```
