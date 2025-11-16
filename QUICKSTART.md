# 🚀 快速开始指南# 🚀 快速开始指南



## 📋 项目概述## 📋 项目概述



Stable Diffusion Prompt 管理器 - 一个本地文件夹同步的 Prompt 管理工具Stable Diffusion Prompt 管理器 - 一个专业的多项目 Prompt 管理工具



**核心功能：****核心功能：**

- 📁 打开本地文件夹作为项目- 📁 多项目管理

- 🖼️ 图片上传和实时同步- 🖼️ 图片上传和展示

- 📝 Prompt 自动保存为 .txt 文件- 📝 Prompt 编辑和保存

- 🔄 文件系统双向同步- 💾 本地持久化存储

- ⚡ WebSocket 实时更新

## ⚡ 快速启动（3 步）

## ⚡ 快速启动（2 步）

### 1. 安装依赖

### 1. 双击桌面快捷方式```powershell

直接双击桌面上的 **"Prompt Management Tool"** 图标cd c:\Users\admin\Desktop\promptManagement\vite-react-app

npm install

### 2. 或手动启动```

```powershell

cd D:\promptManagement\vite-react-app### 2. 启动开发服务器

npm start```powershell

```npm run dev

```

浏览器会自动打开 `http://localhost:5173`

### 3. 打开浏览器

## 🎯 使用流程访问 `http://localhost:5173` （或终端显示的端口）



### 首次使用## 🎯 使用流程

1. **打开文件夹**

   - 点击"📁 打开文件夹"### 首次使用

   - 点击"🗂️ 浏览并选择文件夹"选择 SD 输出文件夹1. **创建项目**

   - 或手动输入路径（如 `D:\SD\outputs\project1`）   - 点击"➕ 新建项目"

   - 输入项目名称（可选）   - 输入项目名称（如"角色设计"）

   - 添加描述（可选）

2. **上传图片**

   - 点击项目卡片进入2. **上传图片**

   - 点击"📁 上传图片"选择图片   - 点击项目卡片进入

   - 或直接 Ctrl+V 粘贴图片   - 点击"📁 上传图片"

   - 图片自动保存到本地文件夹   - 选择 SD 生成的图片



3. **编辑 Prompt**3. **添加 Prompt**

   - 在图片下方文本框输入 Prompt   - 在图片下方文本框输入 Prompt

   - 自动保存为同名 `.txt` 文件   - 自动保存到 localStorage

   - 也可以直接在文件管理器中编辑 `.txt` 文件

## 📁 项目结构速览

## 📁 文件结构

```

每个项目文件夹包含：src/

```├── components/      # UI 组件（Button, Modal, Card 等）

project-folder/├── pages/          # 页面（项目列表、Prompt 管理）

├── image1.png├── contexts/       # 全局状态（ProjectContext）

├── image1.txt          # image1.png 的 prompt├── hooks/          # 自定义 Hooks（useLocalStorage）

├── image2.jpg├── styles/         # 全局样式和设计系统

├── image2.txt          # image2.jpg 的 prompt├── utils/          # 工具函数

└── ...└── App.jsx         # 路由配置

``````



## 🎨 技术架构## 🎨 技术亮点



- ✅ **React 18** - 现代化前端框架- ✅ **React 18** - 最新 Hooks API

- ✅ **Node.js + Express** - 后端服务器- ✅ **React Router v7** - 客户端路由

- ✅ **Chokidar** - 文件系统监听- ✅ **Context API** - 全局状态管理

- ✅ **WebSocket** - 实时数据同步- ✅ **localStorage** - 数据持久化

- ✅ **本地文件优先** - 文件系统是唯一数据源- ✅ **CSS Variables** - 统一设计系统

- ✅ **响应式设计** - 移动端友好

## 🛠️ 常用命令

## 🛠️ 常用命令

```powershell

# 启动（前后端）```powershell

npm start            # 同时启动前后端服务器# 开发

npm run dev          # 启动开发服务器（热更新）

# 单独启动

npm run dev          # 只启动前端（Vite）# 构建

npm run server       # 只启动后端（Node.js）npm run build        # 构建生产版本到 dist/



# 构建# 预览

npm run build        # 构建生产版本到 dist/npm run preview      # 预览构建后的生产版本

``````



## 📚 相关文档## 📚 相关文档



- **README.md** - 完整项目说明和功能介绍- **README.md** - 完整项目说明和功能介绍

- **ARCHITECTURE_UPDATE.md** - 最新架构设计（本地文件优先）- **ARCHITECTURE.md** - 详细架构设计文档

- **FORGE_INTEGRATION.md** - Stable Diffusion Forge 集成指南

## 🐛 常见问题

## 🐛 常见问题

### 端口被占用

### 端口被占用如果 5173 端口被占用，Vite 会自动切换到其他端口（如 5174）

服务器会自动清理旧的 Node 进程，如果仍有问题：

```powershell### 数据丢失

taskkill /F /IM node.exe数据保存在 localStorage，清除浏览器数据会导致丢失。建议定期备份重要 Prompt。

```

### 图片不显示

### 文件不同步确保上传的是有效的图片文件（jpg, png, webp 等）

检查后端控制台是否有文件监听日志。确保文件夹路径正确且有读写权限。

## 💡 使用技巧

### 图片不显示

确保：1. **批量上传**：可以一次选择多张图片上传

1. 图片文件确实存在于项目文件夹2. **快速编辑**：Prompt 输入框支持 Ctrl+Z 撤销

2. 后端服务器正在运行（http://localhost:3001）3. **项目分类**：按用途创建不同项目（角色、场景、风格等）

3. 浏览器控制台没有跨域错误4. **及时保存**：输入 Prompt 后，数据会自动保存



## 💡 使用技巧## 🔗 快速链接



1. **批量上传**：可以一次选择多张图片上传- 开发服务器：http://localhost:5173

2. **粘贴上传**：按 Ctrl+V 直接粘贴剪贴板中的图片- 项目仓库：（如有 Git 仓库，填写链接）

3. **外部编辑**：直接在文件管理器中修改 `.txt` 文件，网页会自动同步- 问题反馈：（如有 Issue tracker，填写链接）

4. **撤销功能**：支持 Ctrl+Z 撤销最近的 Prompt 修改

5. **PNG 元数据**：上传 PNG 文件时会自动提取嵌入的 Prompt---



## 🔗 快速链接**准备好了吗？** 运行 `npm run dev` 开始使用！ 🎉


- 前端界面：http://localhost:5173
- 后端 API：http://localhost:3001
- WebSocket：ws://localhost:3001

## 🚀 与 Stable Diffusion Forge 集成

参考 `FORGE_INTEGRATION.md` 将此工具与 SD Forge 一起启动。

---

**准备好了吗？** 双击桌面快捷方式开始使用！ 🎉
