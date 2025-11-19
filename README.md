<p align="center">
  <img src="https://img.shields.io/badge/Stable%20Diffusion-Prompt%20Manager-7a59ff.svg" alt="Prompt Management Tool badge" />
</p>

# Prompt 管理工具 · Stable Diffusion Prompt Manager

> 一个专注于 Stable Diffusion / CG 项目的本地化 Prompt & 资产管控台：项目化管理、分组分页、PNG metadata 自动提取、文本剧本导入、马赛克编辑，以及实时文件夹同步的组合拳。

## 目录
1. [产品概述](#产品概述)
2. [功能亮点](#功能亮点)
3. [架构概览](#架构概览)
4. [快速开始](#快速开始)
5. [核心工作流](#核心工作流)
6. [自动同步与实时更新](#自动同步与实时更新)
7. [API 概览](#api-概览)
8. [目录结构](#目录结构)
9. [故障排查](#故障排查)
10. [开发与构建](#开发与构建)
11. [贡献与许可](#贡献与许可)

---

## 产品概述

本项目是一套「前端 React + Vite」与「后端 Node.js + Express + WebSocket」的桌面级工具链，核心价值是用统一界面管理 Stable Diffusion 产出的海量图片、Prompt、剧本分镜，并保持与本地文件夹的实时同步。所有图片、`.txt` Prompt 和马赛克修改都存放在用户指定的文件夹中，应用只做调度，不上传任何数据，天然满足离线 / 本地化需求。

---

## 功能亮点

### Prompt & 资产管理
- 支持**打开任意本地文件夹**作为项目，图片与 Prompt 仍保留在原路径；
- 上传图片会自动生成唯一 ID 并写入对应 `.txt`（后端使用 `multer` + `pngjs`，前端也会尝试读取 PNG metadata）；
- ImageCard 提供复制 Prompt、删除、移动、拖拽、三点菜单等操作，支持多行编辑与乐观更新；
- `Ctrl+V` 直接粘贴剪贴板图片，Prompt 自动补全（若 PNG metadata 带 `parameters`、`prompt`、`Negative prompt` 等）。

### 分组 / 分页驱动的剧本管理
- ImageGroup 组件支持双击编辑标题 & 描述、折叠、拖拽高亮、删除（不会删文件）；
- 通过 `GroupSelector` 以模态形式移动图片或指定插入位置，可插入在任意页之前/之后；
- 解析 `第X页` 的文本文件（见 `example-pages.txt`），一键批量生成/更新分组描述；
- normalize 规则确保所有页标题统一为 `第 N 页`，删除/插入后会自动重排页码；
- “未分组”托底区永远展示还未分配的图片，方便在画廊视角里复盘。

### 自动化与防抖
- 后端通过 `chokidar` + `fs.watch` 监听所有绑定的项目文件夹，自动识别新增/删除/重命名；
- `server/utils/Debouncer` + `apiWriteLock` 控制写锁与轮询，避免上传/写入过程中触发不必要的重复扫描；
- `syncFileSystem()` 会校对 `.txt` Prompt 的落盘内容和图片时间戳，必要时更新 `data/projects.json` 并广播前端；
- 支持 `POST /api/update-watcher` 热更新监听路径，新增项目后不需重启服务。

### 可视化工具与体验
- Prompt Manager、Project List、Mosaic Editor 三大页面全部由 React Router 7.9.6 驱动，使用统一 Button/Modal/卡片组件；
- Mosaic Editor 提供画笔拖拽、强度调节、←/→ 翻页、状态提示与保存（PUT /api/images/:projectId/:imageId/mosaic，并通过 cache busting 刷新）；最新版本还加入了更紧凑的工作区、分组缩略图以及可滚动的多行预览。
- Undo（`Ctrl+Z`）可恢复最近一次 Prompt 编辑（ProjectContext 维护历史栈）；
- 项目卡片展示文件夹路径、图片数量、创建时间、缩略图列表，列表页提供清晰空态与“一键移除”操作。

### 桌面集成
- Windows 启动器：`start-app.bat`、`start-app.ps1` 几秒内并行拉起前后端并打开浏览器，`start-silent.bat` 可隐藏控制台；
- `select-folder.vbs` + `/api/select-folder` 提供系统级文件夹选择器，配合 `open folder` 按钮一键接管 SD 输出目录；
- `create-shortcut.vbs` & `webui-user.bat.example` 方便打包成桌面工具，适合分发给非技术用户。

---

## 架构概览

```
[本地图片文件夹] ←→ [Express API + WebSocket + chokidar] ←WS→ [React/Vite 前端]
        ↑                         ↓                          ↑
   PNG/txt 读写            data/projects.json         React Context / hooks
```

- **前端 (`src/`)**：React 18 + Vite 5，使用 Context (`ProjectContext`) 管理项目状态；`apiClient` 负责 REST + WebSocket 订阅；
- **后端 (`server/`)**：Express 4.18，划分 `routes/`、`services/`、`middleware/`、`utils/`，所有文件 I/O 通过 `fs/promises`，实时更新通过 `ws`;
- **数据层 (`data/projects.json`)**：记录项目元数据/分组/图片列表；真实的图片与 Prompt 始终保留在用户选择的文件夹中；
- **实时机制**：文件夹变化触发 `syncFileSystem` → 写入 `projects.json` → `broadcast({ type: 'projects-updated' })`，前端订阅后自动 `loadProjects()`。

---

## 快速开始

### 环境要求
- Node.js ≥ 18（Vite 5 与部分依赖需要）；
- Windows 10/11 获得最佳体验（ `select-folder.vbs` 与启动脚本针对 Windows）；macOS / Linux 也可运行，但需要手动输入文件夹路径；
- npm 通过 Node 自带即可。

### 安装
```powershell
# 1. 安装依赖
npm install

# 2. 启动前后端（并行运行 server + vite）
npm start
# 或单独运行
npm run server  # 仅后端 http://localhost:3001
npm run dev     # 同 npm start
```

默认端口：前端 `http://localhost:5173`（占用则自动递增），后端 `http://localhost:3001`。

### 常用 npm 脚本

| Script            | 说明 |
| ----------------- | ---- |
| `npm start` / `npm run dev` | 使用 `concurrently` 启动 Express + Vite，开发首选 |
| `npm run server`  | 仅启动后端 API（用于桌面启动器或部署） |
| `npm run build`   | 生成生产版静态资源到 `dist/` |
| `npm run preview` | 预览生产构建（Vite preview server） |

### Windows 启动脚本
- `start-app.bat`：终端版启动器，会强制杀死残留 `node.exe`，拉起 `npm start` 并在 8 秒后打开浏览器；
- `start-app.ps1`：PowerShell 版启动器，后台 `Start-Job` 跑 `npm run server`，前端由默认浏览器打开；
- `start-silent.bat`：静默模式，用于创建桌面快捷方式或在无人值守环境运行；
- `select-folder.vbs`：被 `/api/select-folder` 调用，利用 `cscript` 弹出 `Shell.Application.BrowseForFolder`。

### 数据与存储
- `data/projects.json`：由 `server/services/storage.js` 管理，保存项目列表、分组与图片元信息；
- 实际图片/Prompt `.txt` 存储在项目绑定的文件夹，结构不做侵入式修改；
- Mosaic 编辑会覆盖源图片文件（同名写回，保留同一 ID），若需留备份可在操作前复制。

---

## 核心工作流

### 1. 打开或创建项目
1. 打开首页（ProjectListPage）→ 点击 **“?? 打开文件夹”**；
2. 使用系统文件夹选择器（Windows）或手动输入路径；
3. 可自定义项目名（默认用文件夹名），确认后会：
   - 记录项目到 `projects.json`；
   - 扫描该文件夹内的 `jpg/png/webp/gif` 等图片和同名 `.txt`；
   - 触发 `setupFileWatcher()` 监听新目录。
4. 项目列表展示图片数量、最近更新时间等，点击卡片即可进入 Prompt Manager。

> 删除项目会直接删除其绑定文件夹内的所有图片与 prompt，请操作前做好备份。

### 2. 上传 / 粘贴 / 管理 Prompt
- 通过顶部 **“?? 上传图片”** 或空态按钮选择多张图片；
- `Ctrl+V` 粘贴剪贴板图片；粘贴时组件会锁定一次事件，避免重复；
- PNG 自动尝试解析 metadata（`extractPngMetadata`）填充 Prompt；若 metadata 缺失，则使用手工输入；
- Prompt 编辑区支持多行文本、复制按钮、实时保存（PUT `/api/images/:projectId/:imageId`）；
- `Ctrl+Z` 撤销最近一次 Prompt 修改（历史记录保存在 ProjectContext，删除暂不支持撤销）。

### 3. 分组与分页
- `ImageGroup` 提供双击编辑标题/描述、折叠开关、删除按钮；
- 拖拽图片卡片到其他分组会有灰色高亮，内部通过 HTML5 DnD + `onDrop`；
- 也可以点三点菜单 → “?? 移动到分组”，弹出 `GroupSelector`；
- 分组按钮：`? 创建分组`、`? 插入分组`（选择插入位置）、`?? 导入剧本`；
- 删除分组不会删除图片，只是从 `imageIds` 中移除，剩余分组会自动重新编号 (`normalizeGroupTitle`)。

### 4. 文本剧本导入
- 格式要求：使用诸如 `第一页`、`第 2 页`、`第十页` 的标记分隔内容（示例见 `example-pages.txt`）；
- 菜单 → **“?? 导入剧本”** → 选择 `.txt`：
  - `parsePageText` 会扫描所有页码，提取每段描述（过滤掉 `<10` 字符的意外匹配）；
  - 若存在同名页（normalize 后一致），会更新描述而非重复创建；
  - 可选地根据导入顺序对新分组进行插入排序；
- 适合从脚本/分镜工具复制的文本，确保每一页在 UI 中都有对应说明。

### 5. 马赛克编辑模式
- 在 Prompt Manager 顶部点击 **“?? 马赛克模式”**，或直接访问 `/projects/:projectId/mosaic/:imageId`；
- 功能点：
  - 左右箭头切换图片、顶部按钮可跳图；
  - 强度滑杆 6-80px，指针按下即绘制像素化块，松开停止；
  - **还原** 恢复原图（基于隐藏的 `baseImageRef`）；
  - **保存** 将画布转 Blob，PUT 到 `/api/images/:projectId/:imageId/mosaic` 并更新 `updatedAt`；
  - 保存成功后状态条显示绿色提示，并刷新缩略图（通过 `?v=timestamp` cache busting）。

### 6. 快捷键列表
| 快捷键 | 场景 | 功能 |
| ------ | ---- | ---- |
| `Ctrl+V` | Prompt Manager | 直接粘贴剪贴板图片 |
| `Ctrl+Z` / `Cmd+Z` | Prompt Manager | 撤销最近一次 Prompt 编辑 |
| `←` / `→` | Mosaic Editor | 切换上一张 / 下一张图片 |
| `Esc` | 任意模态/选择器 | 关闭 `Modal` / `GroupSelector` / 文件夹选择提示 |

---

## 自动同步与实时更新

- **文件监听**：`server/services/fileWatcher.js`
  - `setupFileWatcher()` 收集所有项目的 `folderPath`，用 `chokidar.watch` 监听，开启 `usePolling` 以兼容 NAS/网络盘；
  - 每次变动触发 `fileWatcherDebouncer.trigger(syncFileSystem)`，避免频繁写入；
  - `syncFileSystem()` 会：
    1. 扫描实际文件夹，新增图片会加载 `.txt` Prompt 和 `stat` 元数据；
    2. 删除不存在的图片 & 清理对应分组引用；
    3. 更新 `updatedAt`、Prompt 内容等字段；
    4. 若有变化则 `saveProjects()` 并广播 WebSocket 消息。
- **写锁**：`apiWriteLock` 中间件在每个 API 请求头尾 `lock/unlock` 防抖器，确保批量写入（例如上传图片时写入 `.png` + `.txt`）不会被监听器立即吞掉；
- **WebSocket**：`server/services/websocket.js` 提供 `ws://localhost:3001`，前端 `apiClient` 自动重连（指数退避），订阅 `projects-updated`、`project-created` 等事件；
- **手动同步**：如果在应用外批量移动图片，可调用 `POST /api/update-watcher` 或直接重启服务器，触发重新扫描。

---

## API 概览

| 方法 & 路径 | 描述 |
| ----------- | ---- |
| `GET /api/projects` | 获取所有项目（含图片、分组、元数据） |
| `POST /api/projects/open-folder` | 绑定文件夹为项目，扫描现有图片 |
| `PUT /api/projects/:projectId` | 更新项目名称、路径等 |
| `DELETE /api/projects/:projectId` | 删除项目并移除其绑定文件夹下的所有图片/Prompt |
| `POST /api/projects/:projectId/groups` | 创建分组 |
| `PUT /api/projects/:projectId/groups/:groupId` | 更新分组标题/描述 |
| `DELETE /api/projects/:projectId/groups/:groupId` | 删除分组 |
| `POST /api/projects/:projectId/groups/:groupId/images` | 将图片加入分组（会自动从其他分组移除） |
| `DELETE /api/projects/:projectId/groups/:groupId/images/:imageId` | 将图片从分组移除 |
| `POST /api/images/:projectId` | 上传单张图片（multipart/form-data，字段 `image`/`prompt`） |
| `PUT /api/images/:projectId/:imageId` | 更新指定图片的 Prompt |
| `DELETE /api/images/:projectId/:imageId` | 删除图片及同名 `.txt` |
| `PUT /api/images/:projectId/:imageId/mosaic` | 保存马赛克后的图片（multipart/form-data） |
| `GET /api/images/:projectId/:imageId/file` | 下载原始图片文件 |
| `GET /images/:projectId/:filename` | 静态图像访问（支持 `?v=` cache busting） |
| `POST /api/select-folder` | Windows 上打开文件夹选择器（调用 `select-folder.vbs`） |
| `POST /api/update-watcher` | 重新创建文件监听器 |

前端 `ApiClient` 封装了上述接口，并负责在上传后自动刷新项目状态。

---

## 目录结构

```
.
├── src/
│   ├── api/                # apiClient（REST + WebSocket）
│   ├── components/         # Button、ImageCard、ImageGroup、Modal、ProjectCard、GroupSelector 等
│   ├── contexts/           # ProjectContext：状态管理、Undo、分组操作
│   ├── pages/              # ProjectListPage、PromptManagerPage、MosaicEditorPage
│   ├── styles/             # global.css + variables.css
│   └── utils/              # pngMetadata、textParser、helpers 等
├── server/
│   ├── routes/             # projects/images/groups/folders
│   ├── services/           # storage、fileWatcher、websocket
│   ├── middleware/         # apiWriteLock、logger、error handler
│   └── utils/              # Debouncer、textUtils
├── data/                   # 自动生成的 projects.json
├── example-pages.txt       # 文本导入示例
├── start-app.* / select-folder.vbs
├── vite.config.js
└── package.json
```

---

## 故障排查

- **文件夹内容没有刷新**：确认后端终端中是否有 `Debouncer locked` 长时间未解除；必要时调用 `POST /api/update-watcher` 或重启服务器；
- **选择文件夹按钮无反应**：`select-folder.vbs` 仅在 Windows 下可用；其他平台请手动输入路径；
- **端口冲突**：`npm start` 会自动尝试下一个 Vite 端口，后端端口需手工修改 `server/index.js` 中的 `PORT`；
- **马赛克保存后页面仍显示旧图**：确认状态提示为“保存成功”，若仍旧请检查浏览器缓存或 `getImageUrl` 的 `version` 参数是否被代理缓存；
- **Undo 未生效**：目前撤销仅覆盖 Prompt 更新历史，删除图片无法恢复。

---

## 开发与构建

1. 常规开发：`npm start`，Vite + Express 并行热更新；
2. 生产构建：`npm run build` 输出到 `dist/`，可配合任意静态服务器；后端依然需要 `npm run server`；
3. 自定义打包：可将 `start-app.bat` 配合 `npm install --production` 一起打包给非技术用户；
4. 测试策略：暂未集成自动化测试，建议通过 `example-pages.txt`、手工上传、马赛克流程回归；
5. 代码规范：以函数式 React Hooks + Context 为主，CSS 走 BEM + 全局变量，新增组件请放在 `src/components` 并附带 CSS。
