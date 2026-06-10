# 调试面板 - 常见错误

常见错误及其正确模式的目录。

## ❌ 颜色没有 view: 'color'

**错误：**
```javascript
folder.addBinding(this.params, 'color', {
  label: '颜色',
})
// 显示为文本输入框
```

**正确：**
```javascript
folder.addBinding(this.params, 'color', {
  label: '颜色',
  view: 'color',  // 颜色选择器必需
})
```

## ❌ 直接提取 debug.ui

**错误：**
```javascript
// 在构造函数中
this.debug = this.experience.debug.ui  // 错误的层级
```

**正确：**
```javascript
this.debug = this.experience.debug     // 正确
// 通过 this.debug.ui 在 debugInit() 中访问
```

## ❌ 缺少 debug.active 检查

**错误：**
```javascript
constructor() {
  this.debugInit()  // 如果 #debug 未激活会崩溃
}
```

**正确：**
```javascript
constructor() {
  if (this.debug.active) {
    this.debugInit()
  }
}
```

## ❌ 深层嵌套（>3 层）

**错误：**
```javascript
mainFolder.addFolder()
  .addFolder()
  .addFolder()
  .addFolder()  // 太深了！
```

**正确：**
```javascript
// 最多 3 层
const main = this.debug.ui.addFolder({ title: 'Main' })
const sub = main.addFolder({ title: 'Sub' })
const detail = sub.addFolder({ title: 'Detail' })
```

## ❌ 所有面板都展开

**错误：**
```javascript
const f1 = this.debug.ui.addFolder({ expanded: true })
const f2 = this.debug.ui.addFolder({ expanded: true })
const f3 = this.debug.ui.addFolder({ expanded: true })
// 面板太长，难以导航
```

**正确：**
```javascript
const f1 = this.debug.ui.addFolder({ expanded: true })   // 常用：展开
const f2 = this.debug.ui.addFolder({ expanded: false })  // 次要：折叠
const f3 = this.debug.ui.addFolder({ expanded: false })  // 次要：折叠
```

## ❌ 匿名事件监听器

**错误：**
```javascript
emitter.on('input:update', (data) => this.handle(data))
// 之后无法移除监听器
```

**正确：**
```javascript
constructor() {
  this._boundHandler = this.handle.bind(this)
  emitter.on('input:update', this._boundHandler)
}

destroy() {
  emitter.off('input:update', this._boundHandler)
}
```
