# JSMini - 高性能 JavaScript 代码压缩器

随手写的 JavaScript 代码压缩器，核心实现在于保持代码功能不变的前提下显著减小文件体积。

## 安装

```bash
npm install -g jsmini
```

或者作为项目依赖安装：

```bash
npm install jsmini
```

## 使用方法

### 命令行使用

```bash
# 基础压缩
jsmini input.js -o output.min.js

# 启用变量名混淆
jsmini input.js -o output.min.js --mangle

# 生成 Source Map
jsmini input.js -o output.min.js --source-map

# 从标准输入读取
cat input.js | jsmini > output.min.js

# 设置 ECMAScript 版本
jsmini input.js -o output.min.js --ecma 2018

# 保留类名和函数名
jsmini input.js -o output.min.js --mangle --keep-class-names --keep-function-names

# 移除 console 和 debugger 语句
jsmini input.js -o output.min.js --drop-console --drop-debugger
```

### 接口

```javascript
import { JSMini, minify } from 'jsmini';

// 简单使用
const result = minify('const a = 1; const b = 2; console.log(a + b);');
console.log(result.code);

// 高级配置
const jsmini = new JSMini({
  compress: {
    constantFolding: true,
    deadCodeElimination: true,
    booleanOptimization: true,
    dropConsole: true,
  },
  mangle: {
    enabled: true,
    keepClassNames: false,
    keepFunctionNames: false,
    reservedNames: ['MyGlobalVar'],
  },
  output: {
    comments: false,
    sourceMap: true,
  },
  ecma: 2020,
});

const result = jsmini.minify(sourceCode);
console.log('压缩后代码:', result.code);
console.log('Source Map:', result.map);
console.log('警告:', result.warnings);
```

## 配置项

### 压缩选项 (compress)

- `constantFolding`: 常量折叠优化，计算编译时确定的表达式
- `deadCodeElimination`: 移除不可达的代码
- `booleanOptimization`: 优化布尔值表示 (`true` → `!0`, `false` → `!1`)
- `sequenceOptimization`: 合并变量声明序列
- `dropConsole`: 移除 `console.*` 语句
- `dropDebugger`: 移除 `debugger` 语句

### 混淆选项 (mangle)

- `enabled`: 是否启用变量名混淆
- `reservedNames`: 不混淆的变量名列表
- `keepClassNames`: 保留类名不混淆
- `keepFunctionNames`: 保留函数名不混淆

### 输出选项 (output)

- `comments`: 是否保留注释
- `sourceMap`: 是否生成 Source Map

### 其他选项

- `ecma`: 目标 ECMAScript 版本 (2015-2020)

## 设计相关

采用最经典的编译器三段式架构：

```
JavaScript 代码 → [解析器] → AST → [转换器] → 优化后的 AST → [生成器] → 压缩后的代码
```

### 核心组件

1. **解析器 (Parser)**: 基于 Acorn，将 JavaScript 代码解析为 ESTree AST
2. **转换器 (Transformer)**: 插件化的转换引擎，应用各种优化规则
3. **生成器 (Generator)**: 基于 Astring，将 AST 转换为紧凑的代码

### 优化策略

#### 阶段一：无损压缩

- 移除注释和多余空白
- 移除不必要的分号
- 优化字符串引号选择

#### 阶段二：安全转换

- 常量折叠: `2 * 3 + 4` → `10`
- 布尔值优化: `true` → `!0`, `false` → `!1`
- undefined 优化: `undefined` → `void 0`
- 死代码消除: 移除 `if (false)` 块

#### 阶段三：作用域感知转换

- 变量名混淆: 将长变量名替换为短名称
- 保留全局变量和对象属性不被混淆
- 处理 `eval` 和 `with` 的作用域复杂性

## 测试命令

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 代码检查
npm run lint

# 构建项目
npm run build
```

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 设计参考

JSMini 的设计灵感来自于以下优秀项目：

- [Terser](https://github.com/terser/terser)
- [UglifyJS](https://github.com/mishoo/UglifyJS)
- [Babel](https://github.com/babel/babel)
- [ESLint](https://github.com/eslint/eslint)
