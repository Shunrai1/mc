---
name: vtj-camera-system
description: 配置具有碰撞规避的第三人称相机系统。用于调整跟随行为、实现相机模式或处理洞穴/障碍物检测。
---

# vite-threejs 相机系统

## 概述

本项目采用 **第三人称相机系统**，核心组件：
- **Camera**：主相机类，管理模式切换
- **CameraRig**：第三人称跟随逻辑，处理平滑跟随、避障、bobbing 效果

**核心原则**：相机通过锚点跟随玩家，使用 lerp 平滑过渡，通过方块检测避免穿模。

## 使用场景

- 修改相机跟随行为
- 调整相机偏移和平滑度
- 实现新的相机模式
- 处理相机与地形的碰撞

## 相机架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Camera                               │
│  - mode: 'third-person' | 'bird-perspective'                │
│  - perspectiveCamera: THREE.PerspectiveCamera                │
│  - orbitControls: OrbitControls (鸟瞰模式用)                 │
│  - rig: CameraRig (第三人称用)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       CameraRig                              │
│  - group: THREE.Group (跟随玩家位置)                         │
│  - cameraAnchor: THREE.Object3D (相机位置锚点)               │
│  - targetAnchor: THREE.Object3D (看向目标锚点)               │
│  - _smoothedPosition: 平滑后的位置                           │
│  - _smoothedLookAtTarget: 平滑后的看向点                     │
└─────────────────────────────────────────────────────────────┘
```

## CameraRig 工作原理

### 锚点系统

```javascript
// 锚点附着在 group 上，group 跟随玩家
this.group = new THREE.Group()
this.cameraAnchor = new THREE.Object3D()   // 相机实际位置
this.targetAnchor = new THREE.Object3D()   // 相机看向的点

// 锚点相对于玩家的偏移
this.cameraAnchor.position.copy(this.config.follow.offset)       // (2, 1.5, 3)
this.targetAnchor.position.copy(this.config.follow.targetOffset) // (0, 1.5, -5.5)

this.group.add(this.cameraAnchor)
this.group.add(this.targetAnchor)
```

### 平滑跟随

```javascript
update() {
  const playerPos = this.target.position
  const facingAngle = this.target.facingAngle

  // 平滑位置插值
  this._smoothedPosition.lerp(playerPos, this.config.follow.smoothSpeed)
  this.group.position.copy(this._smoothedPosition)

  // 同步角色朝向
  this.group.rotation.y = facingAngle

  // 获取世界坐标
  const cameraPos = this.cameraAnchor.getWorldPosition(new THREE.Vector3())
  const targetPos = this.targetAnchor.getWorldPosition(new THREE.Vector3())

  // 平滑看向点
  this._smoothedLookAtTarget.lerp(targetPos, this.config.follow.lookAtSmoothSpeed)

  return { cameraPos, targetPos: this._smoothedLookAtTarget, fov: this._currentFov }
}
```

## 配置参数

```javascript
// src/js/camera/camera-rig-config.js
export const CAMERA_RIG_CONFIG = {
  follow: {
    offset: new THREE.Vector3(2, 1.5, 3.0),        // 相机位置偏移
    targetOffset: new THREE.Vector3(0, 1.5, -5.5), // 看向点偏移
    smoothSpeed: 0.1,           // 位置平滑系数 (0-1)
    lookAtSmoothSpeed: 0.45,    // 看向平滑系数
    mouseTargetY: {
      sensitivity: 0.030,       // 鼠标 Y 轴灵敏度
      maxOffset: 4.5,           // 最大俯仰偏移
      returnSpeed: 1.5,         // 回中速度
      damping: 3.5,             // 阻尼
    },
  },
  trackingShot: {
    fov: { baseFov: 55, maxFov: 85, speedThreshold: 3.0 },
    bobbing: {
      verticalFrequency: 4.0,
      verticalAmplitude: 0.025,
      horizontalFrequency: 4.0,
      horizontalAmplitude: 0.015,
      rollFrequency: 4.0,
      rollAmplitude: 0.005,
      idleBreathing: { enabled: true, frequency: 0.7, amplitude: 0.015 },
    },
  },
}
```

## 洞穴避障（非射线方式）

本项目使用 **方块检测** 而非射线检测来处理相机穿模：

```javascript
_checkBlockAbovePlayer(playerPos) {
  const checkHeights = [2, 3]        // 玩家头顶上方
  const checkRange = [-1, 0, 1]      // 3x3 XZ 区域
  let blockCount = 0

  for (const heightOffset of checkHeights) {
    for (const dx of checkRange) {
      for (const dz of checkRange) {
        const block = terrainManager.getBlockWorld(
          playerPos.x + dx,
          playerPos.y + heightOffset,
          playerPos.z + dz
        )
        if (block && block.id !== 0) blockCount++
        if (blockCount >= 4) return true  // 判定为在洞穴中
      }
    }
  }
  return false
}
```

### 洞穴模式处理

```javascript
if (isInCave) {
  // 切换到近距离偏移
  this._caveOffset = new THREE.Vector3(0.0, 1.5, 1.0)
  this._caveTargetOffset = new THREE.Vector3(0, 1.5, -1.5)

  // 淡化玩家模型
  this.target.setOpacity(0.1)
} else {
  // 恢复正常偏移
  this.target.setOpacity(1.0)
}
```

## 肩膀切换（左右视角）

```javascript
toggleSide() {
  this._currentSide *= -1  // 1 → -1 或 -1 → 1

  gsap.to(this, {
    _sideFactor: this._currentSide,
    duration: 0.6,
    ease: 'power2.inOut',
  })
}

// 应用到 X 偏移
this.config.follow.offset.x = this._targetOffset.x * this._sideFactor
```

**触发方式**：

```javascript
emitter.on('input:toggle_camera_side', () => this.toggleSide())
```

## 动态 FOV（速度感）

```javascript
_updateDynamicFov(speed) {
  const { baseFov, maxFov, speedThreshold } = this.config.trackingShot.fov

  const speedRatio = Math.min(speed / speedThreshold, 1.0)
  const targetFov = baseFov + (maxFov - baseFov) * speedRatio

  this._currentFov += (targetFov - this._currentFov) * smoothSpeed
}
```

## 事件监听

```javascript
// 典型事件监听模式
constructor() {
  this._handleCameraToggle = this._handleCameraToggle.bind(this)
  emitter.on('input:toggle_camera_side', this._handleCameraToggle)
}

_handleCameraToggle() {
  this.toggleSide()
}

destroy() {
  emitter.off('input:toggle_camera_side', this._handleCameraToggle)
}
```
