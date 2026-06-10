---
name: vtj-ui-integration
description: 在保持严格分离的同时集成 Vue UI 与 Three.js。用于构建 HUD、菜单或通过事件处理 UI 到场景的通信。
---

# vite-threejs UI 集成（Vue ↔ Three.js）

## 概述

本项目采用 **严格的层分离架构**：
- **Vue 层**：UI、用户输入、菜单、HUD
- **Three.js 层**：3D 场景、渲染、游戏逻辑

两层之间 **禁止直接操作**，所有通信通过 Pinia + mitt 完成。

## 使用场景

- 创建需要与 3D 场景交互的 Vue 组件
- 从 Three.js 更新 UI 状态
- 处理用户输入并影响 3D 场景
- 管理游戏状态（暂停、菜单、设置）

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Vue UI Layer                         │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   Components    │◄────────►│   Pinia Stores  │           │
│  │   (src/vue/)   │          │   (src/pinia/)  │           │
│  └─────────────────┘          └────────┬────────┘           │
└────────────────────────────────────────┼────────────────────┘
                                         │ emitter.emit()
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      mitt Event Bus                          │
│                  (src/js/utils/event-bus.js)                 │
└─────────────────────────────────────────────────────────────┘
                                         │ emitter.on()
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Three.js Layer                          │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   Components    │◄────────►│   Experience    │           │
│  │   (src/js/)    │          │   (singleton)   │           │
│  └─────────────────┘          └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 职责分离

| 层 | 职责 | 示例 |
|----|------|------|
| **Vue** | 界面渲染、用户输入、菜单导航 | HUD、暂停菜单、设置面板 |
| **Three.js** | 3D 渲染、物理、动画、游戏逻辑 | 玩家移动、地形生成、相机控制 |

### Vue 层 (src/vue/)

```
src/vue/
├── components/
│   ├── hud/           # 游戏内 HUD（血条、快捷栏等）
│   │   ├── HealthBar.vue
│   │   ├── Hotbar.vue
│   │   └── GameHud.vue
│   ├── menu/          # 菜单系统
│   │   ├── UiRoot.vue       # 菜单根组件
│   │   ├── MainMenu.vue
│   │   ├── PauseMenu.vue
│   │   └── SettingsMenu.vue
│   └── ui/            # 共享 UI 元素
```

### Three.js 层 (src/js/)

```
src/js/
├── experience.js      # 单例入口
├── world/             # 场景元素
├── camera/            # 相机系统
├── interaction/       # 交互系统
└── utils/
    └── event-bus.js   # mitt 实例
```

## 通信模式

### 模式一：UI → Three.js（最常用）

**场景**：用户在 UI 操作，需要影响 3D 场景

```javascript
// 1. Pinia Store 定义 action
// src/pinia/uiStore.js
function toPlaying() {
  screen.value = 'playing'
  isPaused.value = false
  emitter.emit('ui:pause-changed', false)  // 通知 Three.js
  emitter.emit('game:request_pointer_lock')
}

// 2. Three.js 组件监听
// src/js/world/player.js
constructor() {
  this._handlePause = this._handlePause.bind(this)
  emitter.on('ui:pause-changed', this._handlePause)
}

_handlePause(paused) {
  this.isPaused = paused
}

destroy() {
  emitter.off('ui:pause-changed', this._handlePause)
}
```

### 模式二：Three.js → UI

**场景**：3D 场景状态变化，需要更新 UI

```javascript
// 1. Three.js 中发送事件
// src/js/world/player.js
takeDamage(amount) {
  this.health -= amount
  emitter.emit('game:player-health-changed', {
    health: this.health,
    maxHealth: this.maxHealth
  })
}

// 2. Vue 组件监听
// src/vue/components/hud/HealthBar.vue
<script setup>
import emitter from '@three/utils/event-bus.js'
import { onMounted, onUnmounted, ref } from 'vue'

const health = ref(100)
const maxHealth = ref(100)

function handleHealthChange({ health: h, maxHealth: max }) {
  health.value = h
  maxHealth.value = max
}

onMounted(() => {
  emitter.on('game:player-health-changed', handleHealthChange)
})

onUnmounted(() => {
  emitter.off('game:player-health-changed', handleHealthChange)
})
</script>
```

### 模式三：设置变更

**场景**：用户修改设置，Three.js 需要响应

```javascript
// 1. Pinia Store
// src/pinia/settingsStore.js
function setShadowQuality(quality) {
  shadowQuality.value = quality
  emitter.emit('shadow:quality-changed', quality)
  saveSettings()
}

// 2. Three.js Renderer 响应
// src/js/renderer.js
emitter.on('shadow:quality-changed', (quality) => {
  this.updateShadowMapSize(quality)
})
```

## Vue 组件模板

### 带事件监听的组件

```vue
<script setup>
import emitter from '@three/utils/event-bus.js'
import { onMounted, onUnmounted, ref } from 'vue'

// 状态
const value = ref(0)

// 事件处理函数（必须保存引用以便清理）
function handleEvent(data) {
  value.value = data.value
}

// 生命周期
onMounted(() => {
  emitter.on('game:some-event', handleEvent)
})

onUnmounted(() => {
  emitter.off('game:some-event', handleEvent)  // 必须清理！
})
</script>
```

## 常见错误

### ❌ Vue 直接操作 Three.js 对象

```javascript
// 错误
import Experience from '@three/experience.js'
const exp = new Experience()
exp.scene.add(someMesh)

// 正确：通过事件
emitter.emit('game:add-mesh', { mesh: someMesh })
```

### ❌ Three.js 直接修改 Pinia 状态

```javascript
// 错误
import { useGameStore } from '@pinia/gameStore'
const store = useGameStore()
store.health = 50

// 正确：通过事件
emitter.emit('game:health-changed', { health: 50 })
```

### ❌ 不清理事件监听

```javascript
// 错误
onMounted(() => {
  emitter.on('event', (data) => this.handle(data))
})

// 正确：保存引用并清理
setup() {
  const _handleEvent = (data) => handle(data)
  onMounted(() => emitter.on('event', _handleEvent))
  onUnmounted(() => emitter.off('event', _handleEvent))
}
```

## 事件命名约定

| 前缀 | 用途 | 示例 |
|------|------|------|
| `ui:` | UI 层发送的事件 | `ui:pause-changed` |
| `game:` | 游戏逻辑事件 | `game:player-move` |
| `core:` | 核心系统事件 | `core:ready` |
| `settings:` | 设置变更事件 | `settings:shadow-changed` |
