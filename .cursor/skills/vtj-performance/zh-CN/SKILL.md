---
name: vtj-performance
description: 优化 Three.js 渲染性能。用于渲染大量对象、优化帧率、实现流式加载或在体素/方块场景中管理内存。
---

# vite-threejs 性能优化

## 概述

基于体素的 Three.js 应用程序性能模式。

**关键技术：**
- **InstancedMesh**：批量渲染数千个相似对象
- **遮挡剔除**：跳过隐藏的方块
- **几何体共享**：所有方块使用单一几何体
- **交换删除**：O(1) 复杂度的实例移除
- **空闲队列**：非阻塞的区块生成

## 快速参考

| 技术 | 使用时机 | 收益 |
|------|----------|------|
| InstancedMesh | 100+ 相似对象 | 减少绘制调用 |
| 遮挡剔除 | 体素地形 | 更少的顶点处理 |
| 几何体共享 | 多个同形状网格 | 更低内存 |
| Swap-and-pop | 动态实例移除 | O(1) 删除 |
| 空闲队列 | 后台任务 | 不掉帧 |

## InstancedMesh 模式

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1)  // 共享
const material = new THREE.MeshStandardMaterial({ color: 0x888888 })
const mesh = new THREE.InstancedMesh(geometry, material, count)

mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

// 设置索引处的实例
mesh.setMatrixAt(index, matrix)
mesh.instanceMatrix.needsUpdate = true
```

**完整模式：** 查看 [references/instanced-mesh.md](references/instanced-mesh.md)

## O(1) 实例移除

```javascript
// 将最后一个实例交换到已删除的位置
const lastIndex = mesh.count - 1
if (index < lastIndex) {
  mesh.getMatrixAt(lastIndex, tempMatrix)
  mesh.setMatrixAt(index, tempMatrix)
}
mesh.count--
mesh.instanceMatrix.needsUpdate = true
```

**实现细节：** 查看 [references/swap-and-pop.md](references/swap-and-pop.md)

## 遮挡剔除

跳过被其他方块完全遮挡的方块：

```javascript
if (isBlockObscured(x, y, z)) return  // 跳过渲染
renderBlock(x, y, z)
```

**算法：** 查看 [references/occlusion-culling.md](references/occlusion-culling.md)

## 空闲队列

```javascript
// 调度工作而不阻塞主线程
idleQueue.enqueue('chunk', () => {
  chunk.generateData()
}, priority)
```

**API 参考：** 查看 [references/idle-queue.md](references/idle-queue.md)

## 内存管理

```javascript
destroy() {
  // 释放材质
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => m?.dispose())
  } else {
    mesh.material?.dispose()
  }

  // 从场景移除
  scene.remove(mesh)
  mesh = null
}
```

**完整模式：** 查看 [references/memory-management.md](references/memory-management.md)

## 常见错误

- ❌ 为每个对象创建几何体
- ❌ 使用 `splice()` 移除实例
- ❌ 忘记 `needsUpdate = true`
- ❌ 同步区块生成

**完整目录：** 查看 [references/common-mistakes.md](references/common-mistakes.md)

## 配置

```javascript
export const CHUNK_CONFIG = {
  chunkWidth: 64,      // 在绘制调用和内存之间平衡
  viewDistance: 1,     // 1 = 3x3 区块网格
  unloadPadding: 1,    // 卸载时的滞后
}
```

**调优指南：** 查看 [references/configuration.md](references/configuration.md)
