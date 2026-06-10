# 调试面板 - 控制类型

Tweakpane 详细控制类型配置。

## 数字滑块

```javascript
folder.addBinding(this.params, 'intensity', {
  label: '强度',
  min: 0,
  max: 10,
  step: 0.1,
})
```

## 颜色选择器

**必需：始终使用 `view: 'color'`**

```javascript
// 字符串格式
this.params = { color: '#ff0000' }
folder.addBinding(this.params, 'color', {
  label: '颜色',
  view: 'color',
})

// RGB 对象格式
this.params = { color: { r: 255, g: 128, b: 0 } }
folder.addBinding(this.params, 'color', {
  label: '颜色',
  view: 'color',
})
```

## 3D 点/向量

```javascript
this.params = { position: { x: 0, y: 10, z: 0 } }

folder.addBinding(this.params, 'position', {
  label: '位置',
  view: 'point3d',
  x: { step: 1 },
  y: { min: 0, max: 100, step: 1 },
  z: { step: 1 },
})
```

## 布尔开关

```javascript
folder.addBinding(this.params, 'enabled', {
  label: '启用',
})
```

## 下拉选择

```javascript
folder.addBinding(this.params, 'mode', {
  label: '模式',
  options: {
    '模式A': 'modeA',
    '模式B': 'modeB',
    '模式C': 'modeC',
  },
})
```

## 只读监控

```javascript
folder.addBinding(this.debugInfo, 'fps', {
  label: 'FPS',
  readonly: true,
})

// 多行文本
folder.addBinding(this.debugInfo, 'log', {
  label: '状态',
  readonly: true,
  multiline: true,
  rows: 4,
})
```

## 按钮

```javascript
folder.addButton({ title: 'Reset' }).on('click', () => {
  this.reset()
})

folder.addButton({ title: '⏸️ Pause' }).on('click', () => {
  this.params.paused = !this.params.paused
})
```

## 变更处理器

### 方法一：内联回调

```javascript
folder.addBinding(this.params, 'intensity', {
  min: 0, max: 1,
}).on('change', (ev) => {
  this.material.uniforms.uIntensity.value = ev.value
})
```

### 方法二：绑定到类方法

```javascript
folder.addBinding(this.params, 'color', {
  view: 'color',
}).on('change', this.updateColor.bind(this))

updateColor() {
  this.light.color.set(this.params.color)
}
```

### 方法三：直接对象绑定

```javascript
// 直接绑定到 Three.js 对象属性
folder.addBinding(this.mesh, 'visible', { label: '显示' })
folder.addBinding(this.helper, 'visible', { label: 'Helper' })
```
