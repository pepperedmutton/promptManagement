# 🚀 快速开始指南

## 📋 项目概述

Stable Diffusion Prompt 管理器 - 一个专业的多项目 Prompt 管理工具

**核心功能：**
- 📁 多项目管理
- 🖼️ 图片上传和展示
- 📝 Prompt 编辑和保存
- 💾 本地持久化存储

## ⚡ 快速启动（3 步）

### 1. 安装依赖
```powershell
cd c:\Users\admin\Desktop\promptManagement\vite-react-app
npm install
```

### 2. 启动开发服务器
```powershell
npm run dev
```

### 3. 打开浏览器
访问 `http://localhost:5173` （或终端显示的端口）

## 🎯 使用流程

### 首次使用
1. **创建项目**
   - 点击"➕ 新建项目"
   - 输入项目名称（如"角色设计"）
   - 添加描述（可选）

2. **上传图片**
   - 点击项目卡片进入
   - 点击"📁 上传图片"
   - 选择 SD 生成的图片

3. **添加 Prompt**
   - 在图片下方文本框输入 Prompt
   - 自动保存到 localStorage

## 📁 项目结构速览

```
src/
├── components/      # UI 组件（Button, Modal, Card 等）
├── pages/          # 页面（项目列表、Prompt 管理）
├── contexts/       # 全局状态（ProjectContext）
├── hooks/          # 自定义 Hooks（useLocalStorage）
├── styles/         # 全局样式和设计系统
├── utils/          # 工具函数
└── App.jsx         # 路由配置
```

## 🎨 技术亮点

- ✅ **React 18** - 最新 Hooks API
- ✅ **React Router v7** - 客户端路由
- ✅ **Context API** - 全局状态管理
- ✅ **localStorage** - 数据持久化
- ✅ **CSS Variables** - 统一设计系统
- ✅ **响应式设计** - 移动端友好

## 🛠️ 常用命令

```powershell
# 开发
npm run dev          # 启动开发服务器（热更新）

# 构建
npm run build        # 构建生产版本到 dist/

# 预览
npm run preview      # 预览构建后的生产版本
```

## 📚 相关文档

- **README.md** - 完整项目说明和功能介绍
- **ARCHITECTURE.md** - 详细架构设计文档

## 🐛 常见问题

### 端口被占用
如果 5173 端口被占用，Vite 会自动切换到其他端口（如 5174）

### 数据丢失
数据保存在 localStorage，清除浏览器数据会导致丢失。建议定期备份重要 Prompt。

### 图片不显示
确保上传的是有效的图片文件（jpg, png, webp 等）

## 💡 使用技巧

1. **批量上传**：可以一次选择多张图片上传
2. **快速编辑**：Prompt 输入框支持 Ctrl+Z 撤销
3. **项目分类**：按用途创建不同项目（角色、场景、风格等）
4. **及时保存**：输入 Prompt 后，数据会自动保存

## 🔗 快速链接

- 开发服务器：http://localhost:5173
- 项目仓库：（如有 Git 仓库，填写链接）
- 问题反馈：（如有 Issue tracker，填写链接）

---

**准备好了吗？** 运行 `npm run dev` 开始使用！ 🎉
