---
name: vtj-raycasting-system
description: 实现射线投射和碰撞检测。用于选择对象、检测方块交互或优化射线投射器性能。
---

# vite-threejs 射线系统

## 概述

本项目的射线系统主要用于 **方块交互**（挖掘、放置）和 **目标选择**。

**核心原则**：始终使用 `iMouse.normalizedMouse` 获取 NDC 坐标，射线检测结果通过 mitt 事件通知。

## 使用场景

- 实现点击拾取功能
- 检测鼠标悬停对象
- 实现方块交互（挖掘、放置）
- 添加目标锁定功能

## 基础 Raycaster 模式

```javascript
import * as THREE from 'three'
import Experience from './experience.js'
import emitter from './utils/event-bus.js'

export default class ObjectPicker {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse

    this.raycaster = new THREE.Raycaster()
    this.intersects = []

    // 配置
    this.params = {
      enabled: true,
      maxDistance: 100,
    }

    // 绑定事件
    this._handleClick = this._handleClick.bind(this)
    emitter.on('input:mouse_down', this._handleClick)
  }

  _handleClick({ button }) {
    if (button !== 0 || !this.params.enabled) return

    // 使用 IMouse 的 normalizedMouse（强制要求）
    const ndc = this.iMouse.normalizedMouse
    this.raycaster.setFromCamera(ndc, this.camera)

    // 检测交叉
    this.intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true  // recursive
    )

    if (this.intersects.length > 0) {
      const hit = this.intersects[0]
      emitter.emit('game:object-picked', {
        object: hit.object,
        point: hit.point,
        distance: hit.distance,
      })
    }
  }

  destroy() {
    emitter.off('input:mouse_down', this._handleClick)
  }
}
```

## 屏幕中心射线（第一人称准星）

```javascript
const CENTER_SCREEN = new THREE.Vector2(0, 0)

update() {
  // 第一人称：从屏幕中心发射
  this.raycaster.setFromCamera(CENTER_SCREEN, this.camera)

  // 或者第三人称：从鼠标位置发射
  // this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera)

  const intersects = this.raycaster.intersectObjects(this.targets, true)
  // ...
}
```

## 方块交互模式

本项目的 `BlockRaycaster` 实现了体素方块的射线检测：

```javascript
// src/js/interaction/block-raycaster.js
export default class BlockRaycaster {
  constructor() {
    this.experience = new Experience()
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse

    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = 8  // 最大交互距离

    this.params = {
      useMouse: false,  // false = 屏幕中心, true = 鼠标位置
    }

    this.result = {
      hit: false,
      blockPos: null,
      faceNormal: null,
      adjacentPos: null,  // 放置方块的位置
    }
  }

  update(terrainMeshes) {
    // 选择射线原点
    const ndc = this.params.useMouse
      ? this.iMouse.normalizedMouse
      : new THREE.Vector2(0, 0)

    this.raycaster.setFromCamera(ndc, this.camera)

    const intersects = this.raycaster.intersectObjects(terrainMeshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0]

      // 计算方块坐标（向下取整到格子中心）
      const blockX = Math.floor(hit.point.x - hit.face.normal.x * 0.5)
      const blockY = Math.floor(hit.point.y - hit.face.normal.y * 0.5)
      const blockZ = Math.floor(hit.point.z - hit.face.normal.z * 0.5)

      // 计算相邻方块位置（放置用）
      const adjacentX = blockX + Math.round(hit.face.normal.x)
      const adjacentY = blockY + Math.round(hit.face.normal.y)
      const adjacentZ = blockZ + Math.round(hit.face.normal.z)

      this.result = {
        hit: true,
        blockPos: new THREE.Vector3(blockX, blockY, blockZ),
        faceNormal: hit.face.normal.clone(),
        adjacentPos: new THREE.Vector3(adjacentX, adjacentY, adjacentZ),
        distance: hit.distance,
      }
    } else {
      this.result.hit = false
    }

    return this.result
  }
}
```

## 交互管理器

```javascript
// src/js/interaction/block-interaction-manager.js
export default class BlockInteractionManager {
  constructor(terrainRenderer) {
    this.terrainRenderer = terrainRenderer
    this.raycaster = new BlockRaycaster()

    this._handleMouseDown = this._handleMouseDown.bind(this)
    emitter.on('input:mouse_down', this._handleMouseDown)
  }

  _handleMouseDown({ button }) {
    const result = this.raycaster.result
    if (!result.hit) return

    if (button === 0) {
      // 左键：挖掘方块
      this.terrainRenderer.removeBlock(
        result.blockPos.x,
        result.blockPos.y,
        result.blockPos.z
      )
    } else if (button === 2) {
      // 右键：放置方块
      this.terrainRenderer.placeBlock(
        result.adjacentPos.x,
        result.adjacentPos.y,
        result.adjacentPos.z,
        this.currentBlockType
      )
    }
  }

  update() {
    // 每帧更新射线检测
    const meshes = this.terrainRenderer.getMeshes()
    this.raycaster.update(meshes)
  }

  destroy() {
    emitter.off('input:mouse_down', this._handleMouseDown)
  }
}
```

## 性能优化

### 使用射线过滤

```javascript
// 只检测特定对象类型
const filteredTargets = this.scene.children.filter(
  obj => obj.userData.isInteractive
)
const intersects = this.raycaster.intersectObjects(filteredTargets, false)
```

### 设置射线距离限制

```javascript
this.raycaster.far = 8  // 限制最大距离，减少计算
```

### 使用对象层

```javascript
// 设置对象层
this.targets.forEach(obj => obj.layers.enable(1))

// 只检测特定层的对象
this.raycaster.layers.set(1)
const intersects = this.raycaster.intersectObjects(this.targets)
```

## 常见错误

### ❌ 手动计算 NDC

```javascript
// 错误
const x = (event.clientX / window.innerWidth) * 2 - 1
const y = -(event.clientY / window.innerHeight) * 2 + 1
this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)

// 正确
this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera)
```

### ❌ 不限制射线距离

```javascript
// 错误：无限制的射线可能检测到很远的东西
this.raycaster.far = Infinity

// 正确：设置合理距离
this.raycaster.far = 8
```
