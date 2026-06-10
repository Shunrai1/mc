---
name: vtj-input-system
description: 通过 IMouse 和 InputManager 系统处理鼠标、键盘和触摸输入。用于实现控制、射线投射或 FPS 风格的 PointerLock。
---

# vite-threejs 输入系统

## 概述

本项目使用 **三层输入系统**：
- **IMouse**：鼠标/触摸位置追踪，提供多种坐标格式
- **InputManager**：键盘和鼠标按钮状态，通过 mitt 发送事件
- **PointerLockManager**：FPS 风格鼠标锁定

**核心原则**：永远使用 `iMouse.normalizedMouse` 进行射线拾取，永远通过 mitt 事件消费输入。

## 使用场景

- 实现鼠标交互（点击、拖拽、悬停）
- 添加键盘控制
- 进行射线拾取（Raycasting）
- 处理相机控制输入

## 输入架构

```
Window Events (keydown/mousemove/etc)
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│                      Input Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   IMouse     │  │ InputManager │  │ PointerLock  │      │
│  │ (positions)  │  │ (key states) │  │ (FPS mouse)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│                    mitt Event Bus                           │
│         input:update, input:jump, input:mouse_move          │
└────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│                   Consumer Layer                            │
│   Player, CameraRig, BlockInteraction, BlockRaycaster       │
└────────────────────────────────────────────────────────────┘
```

## IMouse：位置追踪

### 访问方式

```javascript
// 通过 Experience 单例访问
this.iMouse = this.experience.iMouse
```

### 可用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `normalizedMouse` | `Vector2` | **NDC 坐标 [-1, 1]**，用于射线拾取 |
| `mouse` | `Vector2` | 左下角原点坐标 |
| `mouseDOM` | `Vector2` | DOM 坐标 (clientX, clientY) |
| `mouseScreen` | `Vector2` | 屏幕中心相对坐标 |
| `mouseDOMDelta` | `Vector2` | 帧间位移 |
| `isMouseMoving` | `boolean` | 鼠标是否移动中 |

### 射线拾取（强制模式）

```javascript
// ✅ ALWAYS: 使用 iMouse.normalizedMouse
const ndc = this.iMouse.normalizedMouse
this.raycaster.setFromCamera(ndc, this.camera)
const intersects = this.raycaster.intersectObjects(this.scene.children)

// ❌ NEVER: 手动计算 NDC
const x = (event.clientX / window.innerWidth) * 2 - 1   // 禁止！
const y = -(event.clientY / window.innerHeight) * 2 + 1 // 禁止！
```

**屏幕中心射线**（第一人称准星）：

```javascript
const CENTER_SCREEN = new THREE.Vector2(0, 0)
this.raycaster.setFromCamera(CENTER_SCREEN, this.camera)
```

## InputManager：按键事件

### 事件列表

| 事件 | 触发条件 | 数据 |
|------|----------|------|
| `input:update` | 任意按键变化 | `{ forward, backward, left, right, shift, space, ... }` |
| `input:jump` | 空格键按下 | 无 |
| `input:punch_straight` | Z 键 | 无 |
| `input:punch_hook` | X 键 | 无 |
| `input:block` | C 键 | `{ isPressed: boolean }` |
| `input:toggle_camera_side` | Tab 键 | 无 |
| `input:mouse_down` | 鼠标按下 | `{ button: 0|1|2 }` |
| `input:mouse_up` | 鼠标释放 | `{ button: 0|1|2 }` |
| `input:wheel` | 滚轮 | `{ deltaY: number }` |
| `ui:escape` | ESC 键 | 无 |

### 消费输入事件

```javascript
import emitter from './utils/event-bus.js'

export default class Player {
  constructor() {
    // 保存绑定引用以便清理
    this._handleInput = this._handleInput.bind(this)
    this._handleJump = this._handleJump.bind(this)

    emitter.on('input:update', this._handleInput)
    emitter.on('input:jump', this._handleJump)
  }

  _handleInput(keys) {
    this.inputState = keys
    // keys = { forward: true, backward: false, left: false, right: true, shift: false, ... }
  }

  _handleJump() {
    if (this.movement.isGrounded) {
      this.movement.jump()
    }
  }

  destroy() {
    emitter.off('input:update', this._handleInput)
    emitter.off('input:jump', this._handleJump)
  }
}
```

## PointerLockManager：FPS 鼠标

### 事件列表

| 事件 | 说明 | 数据 |
|------|------|------|
| `pointer:locked` | 鼠标锁定成功 | 无 |
| `pointer:unlocked` | 鼠标解锁 | 无 |
| `input:mouse_move` | 相对鼠标移动 | `{ movementX, movementY }` |

### 相机控制示例

```javascript
// 在 CameraRig 中
constructor() {
  this._handleMouseMove = this._handleMouseMove.bind(this)
  emitter.on('input:mouse_move', this._handleMouseMove)
}

_handleMouseMove({ movementX, movementY }) {
  // Y 轴：控制相机俯仰
  this.mouseYVelocity += movementY * this.config.sensitivity

  // X 轴：通常在 Player 中处理，控制角色朝向
}

destroy() {
  emitter.off('input:mouse_move', this._handleMouseMove)
}
```

### 玩家朝向控制

```javascript
// 在 Player 中
emitter.on('input:mouse_move', ({ movementX }) => {
  this.targetFacingAngle -= movementX * this.config.mouseSensitivity
})
```

## 输入解析器

用于处理冲突输入（如同时按 W+S）：

```javascript
import { resolveDirectionInput } from './input-resolver.js'

const rawInput = { forward: true, backward: true, left: false, right: true }
const { resolvedInput, weights } = resolveDirectionInput(rawInput)

// resolvedInput = { forward: false, backward: false, left: false, right: true }
// W+S 互相抵消，只保留 D
```

## 添加新输入动作

### Step 1: InputManager 中添加按键处理

```javascript
// src/js/utils/input.js
// 在 handleKeyDown 或 handleKeyUp 中添加新动作处理
```

### Step 2: 定义事件常量

```javascript
// src/js/utils/input-actions.js
export const INPUT_ACTIONS = {
  // ... 现有动作
  NEW_ACTION: 'input:new_action',
}
```

### Step 3: 组件中监听事件

```javascript
// 在需要响应输入的组件中
this._handleNewAction = this._handleNewAction.bind(this)
emitter.on('input:new_action', this._handleNewAction)

_handleNewAction() {
  // 处理新动作
}

destroy() {
  emitter.off('input:new_action', this._handleNewAction)
}
```
