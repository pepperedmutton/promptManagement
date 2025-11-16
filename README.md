# Stable Diffusion Prompt 管理器

一个专业的前端应用，帮助你按项目组织和管理 Stable Diffusion 生成的图片及对应的 Prompt。

## ✨ 功能特点

### 项目管理
- 📁 **多项目支持**：创建多个项目分类管理不同类型的图片
- ✏️ **项目信息**：为每个项目添加名称和描述
- 🗑️ **项目删除**：支持删除整个项目及其所有图片

### Prompt 管理
- 🖼️ **图片上传**：支持批量上传多张图片
- 📝 **Prompt 记录**：为每张图片添加和编辑对应的 prompt
- 🎨 **画廊展示**：响应式卡片布局，自动适配屏幕
- 💾 **持久化存储**：项目元数据使用 localStorage，图片文件使用 IndexedDB，关闭浏览器不丢失数据。

### 用户体验
- 🚀 **快速导航**：项目列表 ↔ Prompt 管理页面无缝切换
- 🎯 **直观操作**：清晰的 UI 设计，操作简单易懂
- � **响应式设计**：完美支持桌面和移动设备

## 🏗️ 技术架构

### 技术栈
- **React 18** — 现代化 UI 框架
- **React Router v7** — 客户端路由
- **Vite 5** — 快速开发服务器和构建工具
- **IndexedDB** — 存储图片文件 (Blobs)
- **localStorage** — 存储项目元数据 (JSON)

### 项目结构

```
src/
├── components/          # 可复用 UI 组件
│   ├── Button.jsx      # 按钮组件（支持多种样式）
│   ├── ImageCard.jsx   # 图片卡片组件
│   ├── Modal.jsx       # 模态框组件
│   └── ProjectCard.jsx # 项目卡片组件
├── contexts/           # React Context 状态管理
│   └── ProjectContext.jsx  # 项目和图片状态管理
├── hooks/              # 自定义 Hooks
│   ├── useImageURL.js    # 从 IndexedDB 加载图片 Hook
│   └── useLocalStorage.js  # localStorage 持久化 Hook
├── pages/              # 页面组件
│   ├── ProjectListPage.jsx    # 项目列表页
│   └── PromptManagerPage.jsx  # Prompt 管理页
├── styles/             # 全局样式
│   ├── variables.css   # CSS 变量（设计系统）
│   └── global.css      # 全局样式和重置
├── utils/              # 工具函数
│   ├── db.js           # IndexedDB 帮助函数
│   └── helpers.js      # 日期格式化等工具函数
├── App.jsx             # 路由配置
└── main.jsx            # 应用入口
```

### 设计模式
- **Context API**：全局状态管理（项目和图片数据）
- **自定义 Hooks**：逻辑复用（localStorage 同步）
- **组件化架构**：高度模块化，易于维护和扩展
- **CSS 变量**：统一的设计系统（颜色、间距、阴影等）

## 🚀 快速开始

### 安装依赖
```powershell
cd c:\Users\admin\Desktop\promptManagement\vite-react-app
npm install
```

### 启动开发服务器
```powershell
npm run dev
```

开发服务器将运行在 `http://localhost:5173`

### 构建生产版本
```powershell
npm run build
```

构建产物输出到 `dist/` 目录

### 预览生产版本
```powershell
npm run preview
```

## 📖 使用指南

### 1. 创建项目
1. 访问主页，点击 **"➕ 新建项目"**
2. 输入项目名称（必填）和描述（可选）
3. 点击 **"创建项目"**

### 2. 管理图片和 Prompt
1. 在项目列表中点击项目卡片进入
2. 点击 **"📁 上传图片"** 选择一张或多张图片
3. 在每张图片下方的文本框中输入对应的 Prompt
4. Prompt 会自动保存到 localStorage

### 3. 项目操作
- **打开项目**：点击项目卡片任意位置
- **删除项目**：点击项目卡片右上角的 ✕ 按钮
- **删除图片**：在 Prompt 管理页面点击图片右上角的 ✕ 按钮
- **返回列表**：在 Prompt 管理页面点击 **"← 返回项目列表"**

## 🎨 设计系统

项目采用统一的设计系统，所有样式变量定义在 `src/styles/variables.css`：

- **配色方案**：紫色渐变主题 + 语义化颜色
- **间距系统**：从 0.25rem 到 4rem 的标准间距
- **圆角规范**：4px, 8px, 12px, 16px 多级圆角
- **阴影层级**：4 级阴影深度
- **过渡动画**：150ms, 250ms, 350ms 三档速度

## 📝 开发建议

### 添加新功能
1. 在 `src/components/` 创建新组件
2. 在 `src/pages/` 创建新页面
3. 在 `src/contexts/ProjectContext.jsx` 添加状态管理逻辑
4. 在 `src/App.jsx` 配置新路由

### 样式规范
- 使用 CSS 变量（`var(--color-primary)` 等）
- 遵循 BEM 命名规范（`.component__element--modifier`）
- 每个组件对应一个独立的 CSS 文件

### 状态管理
- 全局状态放在 Context 中
- 组件内部状态使用 `useState`
- 需要持久化的数据使用 `useLocalStorage` Hook

## 🔮 未来扩展建议

- 🔍 **搜索和过滤**：按 Prompt 关键词搜索图片
- 📤 **导出功能**：导出项目数据为 JSON
- 📥 **导入功能**：从 JSON 恢复项目
- 📋 **复制 Prompt**：一键复制 Prompt 到剪贴板
- 🏷️ **标签系统**：为图片添加自定义标签
- 🔄 **版本历史**：Prompt 修改历史记录
- ☁️ **云端同步**：集成后端 API 实现多设备同步

## 📄 许可证

MIT License
