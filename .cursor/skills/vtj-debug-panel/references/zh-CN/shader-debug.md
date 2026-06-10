# 调试面板 - ShaderMaterial 集成

通过 Tweakpane 调试 shader uniform 的模式。

## 必需模式

所有 ShaderMaterial uniform 必须有对应的调试控制：

```javascript
// 材质定义
this.material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 0.5 },
    uColor: { value: new THREE.Color('#ffffff') },
  },
  vertexShader,
  fragmentShader,
})

// 调试配置
this.params = {
  intensity: 0.5,
  color: '#ffffff',
}
```

## 基础 Shader 调试面板

```javascript
debugInit() {
  const folder = this.debug.ui.addFolder({
    title: 'Shader Effect',
    expanded: true,
  })

  // 数字 uniform
  folder.addBinding(this.params, 'intensity', {
    label: '强度',
    min: 0, max: 1, step: 0.01,
  }).on('change', (ev) => {
    this.material.uniforms.uIntensity.value = ev.value
  })

  // 颜色 uniform - 必须使用 view: 'color'
  folder.addBinding(this.params, 'color', {
    label: '颜色',
    view: 'color',
  }).on('change', (ev) => {
    if (typeof ev.value === 'object') {
      // RGB 对象格式
      this.material.uniforms.uColor.value.setRGB(
        ev.value.r / 255,
        ev.value.g / 255,
        ev.value.b / 255,
      )
    } else {
      // 字符串格式
      this.material.uniforms.uColor.value.set(ev.value)
    }
  })
}
```

## 颜色转换辅助函数

```javascript
// 用于一致颜色转换的辅助函数
_setUniformColor(uniformName, colorValue) {
  const uniform = this.material.uniforms[uniformName]
  if (typeof colorValue === 'object') {
    uniform.value.setRGB(
      colorValue.r / 255,
      colorValue.g / 255,
      colorValue.b / 255,
    )
  } else {
    uniform.value.set(colorValue)
  }
}

// 在 debugInit 中使用
folder.addBinding(this.params, 'glowColor', {
  view: 'color',
}).on('change', (ev) => {
  this._setUniformColor('uGlowColor', ev.value)
})
```

## 基于时间的 Uniform

```javascript
// 在 update() 中，而非 debugInit
update() {
  const elapsed = this.experience.time.elapsed
  this.material.uniforms.uTime.value = elapsed * 0.001
}
```

## 完整 Shader 调试设置

```javascript
class ShaderEffect {
  constructor() {
    this.experience = new Experience()
    this.debug = this.experience.debug

    this.config = {
      color: { r: 255, g: 255, b: 255 },
      intensity: 1.0,
      speed: 1.0,
    }

    this._createMaterial()

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
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    })
  }

  debugInit() {
    const folder = this.debug.ui.addFolder({
      title: 'Shader Effect',
      expanded: false,
    })

    // 使用 view: 'color' 的颜色
    folder.addBinding(this.config, 'color', {
      label: 'Color',
      view: 'color',
    }).on('change', (ev) => {
      this.material.uniforms.uColor.value.setRGB(
        ev.value.r / 255,
        ev.value.g / 255,
        ev.value.b / 255,
      )
    })

    // 强度滑块
    folder.addBinding(this.config, 'intensity', {
      label: 'Intensity',
      min: 0, max: 2, step: 0.01,
    }).on('change', (ev) => {
      this.material.uniforms.uIntensity.value = ev.value
    })
  }

  update() {
    this.material.uniforms.uTime.value = this.experience.time.elapsed * 0.001
  }

  destroy() {
    this.material.dispose()
  }
}
```

## Uniform 类型映射

| GLSL 类型 | JS 初始值 | 调试控制 |
|-----------|----------|----------|
| `float` | `{ value: 1.0 }` | 带 min/max 的 `addBinding` |
| `vec2` | `new THREE.Vector2(1, 1)` | `view: 'point2d'` 或单独绑定 |
| `vec3` (颜色) | `new THREE.Color(1, 1, 1)` | `view: 'color'` |
| `vec3` (位置) | `new THREE.Vector3(1, 1, 1)` | `view: 'point3d'` |
| `sampler2D` | `{ value: texture }` | 引用选择器（自定义） |
