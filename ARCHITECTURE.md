# 项目架构文档

## 📐 架构概览

这是一个采用现代 React 最佳实践的单页应用（SPA），使用组件化、模块化架构设计。

## 🗂️ 目录结构

```
vite-react-app/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用 UI 组件
│   │   ├── Button.jsx
│   │   ├── Button.css
│   │   ├── ImageCard.jsx
│   │   ├── ImageCard.css
│   │   ├── Modal.jsx
│   │   ├── Modal.css
│   │   ├── ProjectCard.jsx
│   │   └── ProjectCard.css
│   │
│   ├── pages/              # 页面级组件
│   │   ├── ProjectListPage.jsx
│   │   ├── ProjectListPage.css
│   │   ├── PromptManagerPage.jsx
│   │   └── PromptManagerPage.css
│   │
│   ├── contexts/           # React Context 全局状态
│   │   └── ProjectContext.jsx
│   │
│   ├── hooks/              # 自定义 Hooks
│   │   └── useLocalStorage.js
│   │
│   ├── styles/             # 全局样式系统
│   │   ├── variables.css   # CSS 变量（设计系统）
│   │   └── global.css      # 全局样式
│   │
│   ├── utils/              # 工具函数
│   │   └── helpers.js
│   │
│   ├── App.jsx             # 路由配置
│   └── main.jsx            # 应用入口
│
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
├── package.json            # 依赖和脚本
└── README.md               # 项目文档

```

## 🔧 技术栈

### 核心框架
- **React 18.2.0** - UI 框架（使用 Hooks 和函数组件）
- **React Router DOM 7.9.6** - 客户端路由
- **Vite 5.0.0** - 构建工具和开发服务器

### 开发工具
- **@vitejs/plugin-react 4.0.0** - Vite 的 React 插件

## 🏗️ 架构层次

### 1. 数据层（Data Layer）
- **ProjectContext.jsx**: 全局状态管理
  - 管理所有项目数据
  - 提供 CRUD 操作接口
  - 与 localStorage 同步

- **useLocalStorage.js**: 持久化 Hook
  - 自动同步 state 和 localStorage
  - 错误处理和类型安全

### 2. 业务逻辑层（Business Logic）
- **utils/helpers.js**: 纯函数工具
  - 日期格式化
  - 文本处理
  - ID 生成

### 3. 展示层（Presentation Layer）

#### Pages（页面组件）
- **ProjectListPage**: 项目列表页
  - 显示所有项目
  - 创建新项目
  - 删除项目
  
- **PromptManagerPage**: Prompt 管理页
  - 上传图片
  - 编辑 Prompt
  - 删除图片

#### Components（可复用组件）
- **Button**: 通用按钮组件
  - 支持多种变体（primary, secondary, danger, ghost）
  - 支持多种尺寸（small, medium, large）
  
- **Modal**: 模态框组件
  - 背景遮罩
  - ESC 关闭支持
  
- **ProjectCard**: 项目卡片
  - 显示项目信息
  - 预览图片
  - 导航到项目详情
  
- **ImageCard**: 图片卡片
  - 显示图片
  - 编辑 Prompt
  - 删除图片

### 4. 样式层（Style Layer）
- **variables.css**: 设计系统
  - CSS 自定义属性
  - 颜色、间距、圆角、阴影等
  
- **global.css**: 全局样式
  - CSS 重置
  - 全局字体和布局
  - 动画定义

## 🔄 数据流

```
用户操作 → 组件事件 → Context API → 更新 State → useLocalStorage Hook → localStorage
                                          ↓
                                    触发重新渲染
                                          ↓
                                     更新 UI
```

## 🛣️ 路由结构

```
/                           → 重定向到 /projects
/projects                   → 项目列表页
/projects/:projectId        → 特定项目的 Prompt 管理页
/*                          → 404 重定向到 /projects
```

## 📦 状态管理

### 全局状态（ProjectContext）
```javascript
{
  projects: [
    {
      id: string,
      name: string,
      description: string,
      createdAt: ISO string,
      images: [
        {
          id: number,
          file: File,
          url: string (blob URL),
          prompt: string,
          addedAt: ISO string
        }
      ]
    }
  ]
}
```

### Context 提供的方法
- `createProject(name, description)` - 创建项目
- `deleteProject(projectId)` - 删除项目
- `updateProject(projectId, updates)` - 更新项目信息
- `addImageToProject(projectId, file)` - 添加图片
- `updateImagePrompt(projectId, imageId, prompt)` - 更新 Prompt
- `deleteImage(projectId, imageId)` - 删除图片
- `getProject(projectId)` - 获取项目详情

## 🎨 设计系统

### 颜色规范
- **Primary**: `#667eea` (主题紫色)
- **Secondary**: `#764ba2` (次要紫色)
- **Danger**: `#e53e3e` (危险红色)
- **Success**: `#48bb78` (成功绿色)

### 间距规范
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### 圆角规范
- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px

### 阴影层级
- sm: 轻微阴影
- md: 中等阴影
- lg: 较深阴影
- xl: 深度阴影

## 🔐 最佳实践

### 组件设计
✅ 函数组件 + Hooks  
✅ Props 解构  
✅ 明确的 PropTypes（通过 JSDoc）  
✅ 单一职责原则  
✅ 组件内部状态最小化  

### 状态管理
✅ 全局状态用 Context  
✅ 局部状态用 useState  
✅ 副作用用 useEffect  
✅ 自定义 Hook 封装逻辑  

### 样式管理
✅ 每个组件独立 CSS 文件  
✅ BEM 命名规范  
✅ CSS 变量统一管理  
✅ 响应式设计（移动优先）  

### 代码组织
✅ 按功能分组（components, pages, etc.）  
✅ 单文件单职责  
✅ 清晰的导入顺序（React → 第三方 → 本地）  
✅ 注释和文档完善  

## 🚀 性能优化

### 当前实现
- ✅ 懒加载路由（可选添加 React.lazy）
- ✅ 事件委托
- ✅ 避免不必要的重渲染（Context 分离）

### 未来优化建议
- React.memo 优化组件
- useMemo 缓存计算结果
- useCallback 缓存函数引用
- 虚拟滚动（大量图片时）
- 图片懒加载
- Service Worker 缓存

## 📈 扩展指南

### 添加新页面
1. 在 `src/pages/` 创建组件和样式文件
2. 在 `src/App.jsx` 添加路由
3. 更新导航链接

### 添加新功能
1. 在 Context 中添加状态和方法
2. 创建相关 UI 组件
3. 在页面中集成
4. 更新测试

### 添加第三方库
```powershell
npm install <package-name>
```

## 🧪 测试建议

### 单元测试
- 使用 Vitest + React Testing Library
- 测试组件渲染
- 测试用户交互
- 测试工具函数

### 集成测试
- 测试路由导航
- 测试 Context 数据流
- 测试 localStorage 同步

### E2E 测试
- 使用 Playwright 或 Cypress
- 测试完整用户流程

## 📚 参考资源

- [React 官方文档](https://react.dev/)
- [React Router 文档](https://reactrouter.com/)
- [Vite 文档](https://vitejs.dev/)
- [CSS Variables MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
