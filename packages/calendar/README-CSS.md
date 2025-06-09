# CSS 使用说明

## 编译后的 CSS 文件位置

经过配置，`src/css/index.scss` 已经可以成功编译打包到 `dist` 目录中：

- **编译后的 CSS 文件**: `dist/style.css`
- **JavaScript 模块**: `dist/css/index.js` 和 `dist/css/index.cjs`

## 使用方式

### 方式一：直接引入 CSS 文件
```css
/* 在你的项目中直接引入编译后的 CSS */
@import 'swell-calendar/style.css';
```

### 方式二：通过 JavaScript 模块导入
```javascript
// ES 模块方式
import 'swell-calendar/css';

// CommonJS 方式
require('swell-calendar/css');
```

### 方式三：在 HTML 中直接引用
```html
<link rel="stylesheet" href="node_modules/swell-calendar/dist/style.css">
```

## 构建过程

1. **源文件**: `src/css/index.scss`
2. **编译工具**: Vite + Sass
3. **输出文件**: `dist/style.css`

## 自定义样式

如果需要添加更多样式，请在 `src/css/index.scss` 中添加对应的导入语句：

```scss
@import './timeGrid/timeColumn.scss';
@import './your-new-styles.scss';
```

然后运行 `pnpm build` 重新构建即可。
