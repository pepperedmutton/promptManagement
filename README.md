Prompt 管理工具# Stable Diffusion Prompt 管理器



这是一个用于管理 Stable Diffusion / 图片项目的前端 + 后端小工具。它支持：一个专业的前端应用，帮助你按项目组织和管理 Stable Diffusion 生成的图片及对应的 Prompt。



- 图片上传与展示（按时间/文件名）## ✨ 功能特点

- 将图片组织到“分组”（分页 / 页面）并为分组添加说明

- 双重移动图片方式：拖拽或通过图片菜单选择目标分组### 项目管理

- 从包含“第X页”标记的文本文件批量导入分组内容- 📁 **多项目支持**：创建多个项目分类管理不同类型的图片

- PNG 元数据（prompt）提取与保存- ✏️ **项目信息**：为每个项目添加名称和描述

- 实时同步（WebSocket）用于多窗口/客户端协作- 🗑️ **项目删除**：支持删除整个项目及其所有图片



快速开始### Prompt 管理

- 🖼️ **图片上传**：支持批量上传多张图片

1) 安装依赖- 📝 **Prompt 记录**：为每张图片添加和编辑对应的 prompt

- 🎨 **画廊展示**：响应式卡片布局，自动适配屏幕

在项目根目录（Windows PowerShell）：- 💾 **本地文件存储**：图片和 Prompt 保存在本地文件夹，通过文件监听实时同步到网页端

- 📂 **文件夹同步**：外部修改文件夹内容会自动同步到网页

```powershell- 🧩 **马赛克编辑**：内置图片打码工具，支持键盘快捷键翻页

npm install

```### 用户体验

- 🚀 **快速导航**：项目列表 ↔ Prompt 管理页面无缝切换

2) 启动开发环境- ⌨️ **键盘快捷键**：Ctrl+Z 撤销，← → 翻页，Ctrl+V 粘贴图片

- 🎯 **直观操作**：清晰的 UI 设计，操作简单易懂

```powershell- 📱 **响应式设计**：完美支持桌面和移动设备

npm start

```## 🏗️ 技术架构



这会并行启动：### 技术栈

- 后端 HTTP + WebSocket 服务（默认 http://localhost:3001）- **React 18** — 现代化 UI 框架

- Vite 前端开发服务器（默认 http://localhost:5173，若被占用会自动尝试其他端口）- **React Router v7** — 客户端路由

- **Vite 5** — 快速开发服务器和构建工具

主要页面与功能说明- **Node.js + Express** — 模块化后端服务器

- **Chokidar** — 文件系统监听（100ms 轮询优化）

- 项目列表：管理多个项目。- **WebSocket** — 实时数据同步（指数退避重连）

- 项目页面（Prompt Manager）：- **pngjs** — PNG 元数据提取

  - 图片卡片显示图片和其 prompt，支持复制与编辑。

  - 分组（ImageGroup）：可编辑标题与说明；支持折叠。### 项目结构

  - 拖放移动：直接将图片拖到目标分组（会有高亮提示）。

  - 菜单移动：图片左上角三点菜单 → “移动到分组” → 选择目标分组。```

  - 文本导入：点击页面顶部的“导入文本”按钮，上传包含“第X页”标记的 .txt 文件，系统会把每一页之间的内容解析为一个分组并创建。src/

├── components/          # 可复用 UI 组件

开发者说明│   ├── Button.jsx      # 按钮组件（支持多种样式）

│   ├── ImageCard.jsx   # 图片卡片组件

- 主要目录│   ├── Modal.jsx       # 模态框组件

  - `server/`：后端服务（Express）与路由（例如 `server/routes/groups.js`）。│   └── ProjectCard.jsx # 项目卡片组件

  - `src/`：前端代码（React + Vite）。关键组件：├── contexts/           # React Context 状态管理

    - `src/components/ImageCard.jsx`：单张图片的显示与操作。│   └── ProjectContext.jsx  # 项目和图片状态管理

    - `src/components/ImageGroup.jsx`：分组容器，处理拖放目标逻辑。├── pages/              # 页面组件

    - `src/components/GroupSelector.jsx`：选择分组的模态对话框。│   ├── ProjectListPage.jsx    # 项目列表页

    - `src/utils/textParser.js`：.txt 文件解析（按“第X页”分割）。│   └── PromptManagerPage.jsx  # Prompt 管理页

    - `src/contexts/ProjectContext.jsx`：项目数据管理与本地持久化接口。├── styles/             # 全局样式

│   ├── variables.css   # CSS 变量（设计系统）

- 数据一致性│   └── global.css      # 全局样式和重置

  - 后端在添加图片到分组时会先从其它分组中移除该图片，确保一张图片只存在于一个分组中。├── utils/              # 工具函数

  - 前端有相应的回调/乐观更新以保持界面与后端同步。│   ├── helpers.js      # 日期格式化等工具函数

│   └── pngMetadata.js  # PNG 元数据提取

测试与示例├── api/                # API 客户端

│   └── client.js       # 后端 API 通信和 WebSocket

- 项目根目录下包含 `example-pages.txt`，示例说明了可以导入的文本格式（含“第一页/第1页”标记）。├── App.jsx             # 路由配置

└── main.jsx            # 应用入口

常见命令

server/

```powershell└── index.js            # Node.js 后端服务器

# 安装依赖```

npm install

### 设计模式

# 启动（开发模式）- **Context API**：全局状态管理（项目和图片数据）

npm start- **WebSocket 实时同步**：文件变化自动推送到前端

- **本地文件优先**：所有数据优先写入本地文件系统

# 运行后端单独启动（在需要时）- **文件系统监听**：Chokidar 监听文件变化并自动同步

cd server; node index.js- **组件化架构**：高度模块化，易于维护和扩展

```- **CSS 变量**：统一的设计系统（颜色、间距、阴影等）



问题与贡献## 🚀 快速开始



欢迎用 Issues 或 Pull Requests 贡献改进。请遵循仓库的代码风格并保持变更小而明确。### 桌面快捷方式

双击桌面上的 **"Prompt Management Tool"** 快捷方式即可启动应用。

许可

快捷方式将自动：

根据仓库原有许可（如无则按作者指定）。1. 启动后端服务器 (http://localhost:3001)

2. 打开浏览器访问前端界面 (http://localhost:5173)

#### 重新创建快捷方式
如果桌面快捷方式丢失，可以运行以下命令重新创建：

**PowerShell 方法：**
```powershell
cscript create-shortcut.vbs
```

**手动创建：**
1. 右键桌面 → 新建 → 快捷方式
2. 目标：`cmd.exe /c "cd /d D:\promptManagement\vite-react-app && start-app.bat"`
3. 起始位置：`D:\promptManagement\vite-react-app`
4. 名称：`Prompt Management Tool`

### 手动启动

#### 安装依赖
```powershell
cd c:\Users\admin\Desktop\promptManagement\vite-react-app
npm install
```

#### 启动开发服务器
```powershell
npm run dev
```

前后端服务器同时启动，开发服务器运行在 `http://localhost:5173`

#### 启动完整应用（前后端）
```powershell
npm start
```

等同于 `npm run dev`

#### 仅启动后端服务器
```powershell
npm run server
```

后端服务器运行在 `http://localhost:3001`

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
1. 访问主页，点击 **"📁 打开文件夹"**
2. 点击 **"🗂️ 浏览并选择文件夹"** 选择本地文件夹，或手动输入路径
3. 输入项目名称（可选，留空则使用文件夹名）
4. 点击 **"打开文件夹"**

### 2. 管理图片和 Prompt
1. 在项目列表中点击项目卡片进入
2. 点击 **"📁 上传图片"** 选择一张或多张图片（或按 Ctrl+V 粘贴）
3. 图片会自动保存到本地文件夹
4. 在每张图片下方的文本框中输入对应的 Prompt
5. Prompt 会自动保存为同名 `.txt` 文件

### 3. 马赛克编辑（新功能）
1. 在 Prompt 管理页面点击 **"🧩 马赛克模式"** 按钮
2. 拖动鼠标在图片上绘制马赛克区域
3. 调整滑块改变马赛克强度（6-80px）
4. 使用 **← →** 键快速切换图片
5. 点击 **"还原"** 按钮恢复原图
6. 点击 **"保存马赛克"** 将修改保存到本地文件

### 4. 项目操作
- **打开项目**：点击项目卡片任意位置
- **从列表移除**：点击项目卡片右上角的 ✕ 按钮（不会删除本地文件）
- **删除图片**：在 Prompt 管理页面点击图片右上角的 ✕ 按钮（会删除本地文件）
- **返回列表**：在 Prompt 管理页面点击 **"← 返回项目列表"**
- **外部编辑**：直接在文件管理器中修改 `.txt` 文件，网页会自动同步

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
- 数据同步通过 WebSocket 实时更新
- 本地文件系统是唯一的数据源

## 🔮 未来扩展建议

- 🔍 **搜索和过滤**：按 Prompt 关键词搜索图片
-  **批量操作**：批量修改 Prompt、批量导出
- 🏷️ **标签系统**：为图片添加自定义标签
- 🔄 **版本历史**：Prompt 修改历史记录
- 📊 **统计分析**：Prompt 使用频率分析
- 🎨 **主题切换**：亮色/暗色主题
- 🌐 **多语言支持**：界面国际化

## 📄 许可证

MIT License
