# 文件夹同步说明

## 新架构

应用现在采用**本地服务器 + Web 前端**架构，实现与本地文件夹的双向同步。

## 数据存储

所有数据存储在 `data/` 目录下：

```
data/
├── projects.json          # 项目元数据
└── images/               # 图片文件夹
    ├── {project-id}/     # 每个项目一个文件夹
    │   ├── xxx.png       # 图片文件
    │   ├── xxx.txt       # 对应的 prompt 文件
    │   └── ...
    └── ...
```

## 双向同步机制

### 1. **网页 → 文件夹**
- 在网页上传图片 → 自动保存到 `data/images/{project-id}/` 文件夹
- 修改 prompt → 自动保存到对应的 `.txt` 文件
- 删除图片 → 自动删除文件夹中的图片和 txt 文件

### 2. **文件夹 → 网页**
- 直接复制图片到项目文件夹 → 自动显示在网页
- 修改 `.txt` 文件 → 自动更新网页上的 prompt
- 删除文件 → 自动从网页移除

### 3. **实时监听**
- 使用 `chokidar` 监听文件系统变化
- 使用 `WebSocket` 实时推送更新到前端
- 无需手动刷新，自动同步

## 使用方法

### 启动应用
```bash
npm start
# 或直接运行 启动应用.bat
```

这会同时启动：
- 后端服务器: http://localhost:3001
- 前端界面: http://localhost:5173

### 手动管理文件
你可以直接在文件系统中操作：

1. **添加图片**：复制图片到 `data/images/{project-id}/` 文件夹
2. **添加 Prompt**：创建同名 `.txt` 文件（如 `image123.png` → `image123.txt`）
3. **修改 Prompt**：编辑 `.txt` 文件
4. **删除图片**：删除图片文件和 txt 文件

所有更改会自动同步到网页！

## 备份数据

备份整个 `data/` 文件夹即可保存所有数据。

## 技术栈

**后端:**
- Express.js - HTTP 服务器
- Chokidar - 文件监听
- WebSocket - 实时通信
- Multer - 文件上传

**前端:**
- React + Vite
- React Router
- WebSocket 客户端
