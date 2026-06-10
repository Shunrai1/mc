---
name: vtj-shader-development
description: 使用 vite-plugin-glsl 创建自定义 GLSL 着色器。用于编写顶点/片元着色器、管理 uniform 或添加 ShaderMaterial 调试面板。
---

# vite-threejs 着色器开发

## 概述

本项目使用 **vite-plugin-glsl** 支持 GLSL 文件导入，着色器存放在 `src/shaders/` 目录。

**核心原则**：所有着色器必须存放在 shaders 目录，所有 uniform 必须有调试面板。

## 使用场景

- 创建自定义着色器效果
- 修改现有着色器
- 添加后处理效果
- 需要理解着色器导入和 uniform 管理

## 目录结构

```
src/shaders/
├── includes/              # 共享工具函数
│   ├── ambientLight.glsl
│   ├── directionalLight.glsl
│   └── pointLight.glsl
├── sky/                   # 天空盒
│   ├── vertex.glsl
│   └── fragment.glsl
├── speedlines/            # 后处理：速度线
│   ├── vertex.glsl
│   └── fragment.glsl
├── blocks/                # 方块着色器
│   ├── ao.vert.glsl       # 环境光遮蔽
│   ├── ao.frag.glsl
│   ├── mining.vert.glsl   # 挖掘效果
│   ├── mining.frag.glsl
│   └── wind.vert.glsl     # 植物风动
├── glass/                 # 玻璃折射
├── halftone/              # 半调渲染
└── grid/                  # 调试网格
```

## 导入着色器

### vite.config.js 配置

```javascript
import glsl from 'vite-plugin-glsl'

export default {
  plugins: [
    glsl(),  // 启用 .glsl 文件导入
  ],
}
```

### 导入方式

```javascript
// 使用路径别名（推荐）
import skyFragment from '@/shaders/sky/fragment.glsl'
import skyVertex from '@/shaders/sky/vertex.glsl'

// 或相对路径
import speedLinesFragment from '../shaders/speedlines/fragment.glsl'
```

## ShaderMaterial 模式

### 基础 ShaderMaterial

```javascript
import fragmentShader from '@/shaders/effect/fragment.glsl'
import vertexShader from '@/shaders/effect/vertex.glsl'

export default class EffectMesh {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.debug = this.experience.debug

    // Shader 配置参数
    this.config = {
      color: { r: 255, g: 255, b: 255 },
      intensity: 1.0,
      speed: 1.0,
    }

    this._createMaterial()
    this._createMesh()

    if (this.debug.active) {
      this.debugInit()
    }
  }

  _createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(1, 1, 1) },
        uIntensity: { value: 1.0 },
        uTexture: { value: null },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }

  update() {
    const elapsed = this.experience.time.elapsed
    this.material.uniforms.uTime.value = elapsed * 0.001
  }

  // 必须实现调试面板！
  debugInit() {
    this.debugFolder = this.debug.ui.addFolder({
      title: 'Effect Shader',
      expanded: false,
    })

    // 颜色 uniform 使用 view: 'color'
    this.debugFolder.addBinding(this.config, 'color', {
      label: 'Color',
      view: 'color',
    }).on('change', (ev) => {
      this.material.uniforms.uColor.value.setRGB(
        ev.value.r / 255,
        ev.value.g / 255,
        ev.value.b / 255
      )
    })

    // 数值 uniform 使用 addBinding
    this.debugFolder.addBinding(this.config, 'intensity', {
      label: 'Intensity',
      min: 0, max: 2, step: 0.01,
    }).on('change', (ev) => {
      this.material.uniforms.uIntensity.value = ev.value
    })
  }

  destroy() {
    this.material.dispose()
  }
}
```

### 后处理 ShaderPass

```javascript
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import fragmentShader from '@/shaders/effect/fragment.glsl'
import vertexShader from '@/shaders/effect/vertex.glsl'

// 在 Renderer 中
this.effectPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },  // 必需：接收上一个 pass 的输出
    uTime: { value: 0 },
    uOpacity: { value: 1.0 },
  },
  vertexShader,
  fragmentShader,
})
this.composer.addPass(this.effectPass)
```

## GLSL 代码规范

### 标准结构

```glsl
// ===== Uniforms =====
uniform float uTime;
uniform vec3 uColor;
uniform sampler2D uTexture;

// ===== Varyings =====
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// ===== Helper Functions =====
float random(float seed) {
  return fract(sin(seed) * 43758.5453);
}

// ===== Main =====
void main() {
  // ...

  gl_FragColor = vec4(color, 1.0);
}
```

## Uniform 类型

| GLSL 类型 | JavaScript 初始值 |
|-----------|------------------|
| `float` | `{ value: 1.0 }` |
| `vec2` | `new THREE.Vector2(1, 1)` |
| `vec3` (颜色) | `new THREE.Color(1, 1, 1)` |
| `vec3` (位置) | `new THREE.Vector3(1, 1, 1)` |
| `sampler2D` | `{ value: texture }` |

## 性能提示

- 避免在 fragment shader 中使用分支语句
- 优先使用内置 GLSL 函数
- 减少纹理采样次数
- 善用 `#define` 预定义常量
