# Backend Refactoring Summary

## 概述

将 610 行的单体服务器文件 `server/index.js` 重构为模块化架构，遵循服务器开发最佳实践。

## 新架构

### 目录结构

```
server/
├── index.js              # 主服务器文件（100 行）- 仅负责启动和编排
├── services/             # 业务逻辑服务层
│   ├── storage.js        # 数据持久化服务
│   ├── fileWatcher.js    # 文件监听服务
│   └── websocket.js      # WebSocket 实时通信服务
├── routes/               # API 路由层
│   ├── projects.js       # 项目相关路由
│   ├── images.js         # 图片相关路由
│   └── folders.js        # 文件夹选择路由
└── middleware/           # 中间件
    └── index.js          # 错误处理、日志、404 处理
```

### 模块职责

#### 1. **services/storage.js** - 数据持久化
- `initDataDir()` - 初始化数据目录
- `loadProjects()` - 读取项目数据
- `saveProjects()` - 保存项目数据
- 导出常量：`DATA_DIR`, `PROJECTS_FILE`

#### 2. **services/fileWatcher.js** - 文件监听
- `setupFileWatcher()` - 设置 Chokidar 文件监听
- `scanProjectFolder()` - 扫描项目文件夹
- `syncFileSystem()` - 同步文件系统到数据库（带防抖）
- `performSync()` - 执行实际同步操作
- `setBroadcastCallback()` - 设置 WebSocket 广播回调

**配置：**
- 轮询模式：`usePolling: true`
- 轮询间隔：100ms
- 稳定性阈值：200ms
- 防抖延迟：50ms

#### 3. **services/websocket.js** - 实时通信
- `initWebSocketServer(server)` - 初始化 WebSocket 服务器
- `broadcast(message)` - 广播消息到所有客户端
- `getClientCount()` - 获取连接的客户端数量

#### 4. **routes/projects.js** - 项目路由
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建新项目
- `POST /api/projects/open-folder` - 打开文件夹作为项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

#### 5. **routes/images.js** - 图片路由
- `POST /api/images/:projectId` - 添加图片
- `PUT /api/images/:projectId/:imageId` - 更新图片 prompt
- `DELETE /api/images/:projectId/:imageId` - 删除图片
- `GET /api/images/:projectId/:imageId/file` - 获取图片文件

**特性：**
- 使用 Multer 处理文件上传（内存存储）
- 支持 PNG 元数据提取（pngjs）
- 本地文件优先架构

#### 6. **routes/folders.js** - 文件夹路由
- `POST /api/select-folder` - 打开原生文件夹选择对话框（VBScript）

#### 7. **middleware/index.js** - 中间件
- `errorHandler` - 全局错误处理
- `requestLogger` - 请求日志
- `notFoundHandler` - 404 处理

### 主服务器文件（index.js）

精简为启动和编排逻辑，仅 100 行：

```javascript
1. 导入所有模块
2. 配置 Express 中间件
3. 挂载路由
4. 启动流程：
   - 初始化数据目录
   - 创建 HTTP 服务器
   - 初始化 WebSocket
   - 设置文件监听
   - 执行初始同步
   - 启动服务器
5. 优雅退出处理
```

## API 路由变更

### 旧路由 → 新路由

| 旧路由 | 新路由 | 说明 |
|--------|--------|------|
| `POST /api/projects/:projectId/images` | `POST /api/images/:projectId` | 图片上传 |
| `PUT /api/projects/:projectId/images/:imageId/prompt` | `PUT /api/images/:projectId/:imageId` | 更新 prompt |
| `DELETE /api/projects/:projectId/images/:imageId` | `DELETE /api/images/:projectId/:imageId` | 删除图片 |

**原因：** 遵循 RESTful 最佳实践，资源独立路由

## 前端适配

已更新 `src/api/client.js` 以匹配新路由：

```javascript
// 旧
fetch(`${API_BASE}/projects/${projectId}/images`, ...)

// 新
fetch(`${API_BASE}/images/${projectId}`, ...)
```

同时修复了返回值解析：

```javascript
// 旧
const image = await response.json();
return image.id;

// 新
const data = await response.json();
return data.image.id;
```

## 优势

### 1. **可维护性**
- 每个模块职责单一，文件大小合理（50-150 行）
- 易于定位和修复 Bug
- 代码复用性高

### 2. **可扩展性**
- 添加新功能只需创建新路由/服务模块
- 不影响现有功能
- 支持单元测试

### 3. **可读性**
- 清晰的目录结构
- 模块间依赖明确
- 符合业界标准

### 4. **性能**
- 保持原有优化配置
- 文件监听：100ms 轮询 + 200ms 稳定性阈值
- WebSocket 广播优化

## 向后兼容

- 保留旧备份：`server/index.js.backup`
- API 路由完全兼容（除 images 路径调整）
- 数据格式无变化
- 配置参数无变化

## 依赖

新增：
```json
{
  "pngjs": "^7.0.0"  // PNG 元数据提取
}
```

## 测试检查清单

- [ ] 服务器启动无错误
- [ ] WebSocket 连接成功
- [ ] 文件监听正常工作
- [ ] 打开文件夹选择对话框
- [ ] 添加项目
- [ ] 粘贴图片（Ctrl+V）
- [ ] 编辑 prompt
- [ ] 删除图片
- [ ] 查看图片
- [ ] 文件系统同步（添加/删除/修改文件）
- [ ] WebSocket 实时更新

## 下一步

继续实现优化 UI 更新（让前端粘贴操作立即显示变动）：

1. 在 `ProjectContext` 中实现乐观更新
2. 粘贴时立即添加到本地状态
3. 后端处理完成后通过 WebSocket 同步最终数据
4. 如果后端失败，回滚本地状态

## 文件对比

**重构前：**
- `server/index.js`: 610 行（所有功能）

**重构后：**
- `server/index.js`: ~100 行（启动编排）
- `server/services/storage.js`: ~50 行
- `server/services/fileWatcher.js`: ~150 行
- `server/services/websocket.js`: ~50 行
- `server/routes/projects.js`: ~140 行
- `server/routes/images.js`: ~170 行
- `server/routes/folders.js`: ~40 行
- `server/middleware/index.js`: ~40 行

**总计：** ~740 行（增加 130 行，但代码组织清晰，可维护性大幅提升）

## 运行

```bash
# 开发模式（并发运行前后端）
npm start

# 仅后端
npm run server

# 仅前端
npm run dev
```

## 回滚（如需要）

```bash
# 恢复旧版本
mv server/index.js server/index.refactored.js
mv server/index.js.backup server/index.js

# 删除新模块（可选）
rm -rf server/services server/routes server/middleware
```
