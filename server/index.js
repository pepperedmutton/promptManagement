const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// 导入服务模块
const { initDataDir, loadProjects } = require('./services/storage');
const { setupFileWatcher, setBroadcastCallback, syncFileSystem } = require('./services/fileWatcher');
const { initWebSocketServer, broadcast } = require('./services/websocket');

// 导入路由模块
const projectsRouter = require('./routes/projects');
const imagesRouter = require('./routes/images');
const foldersRouter = require('./routes/folders');

// 导入中间件
const { errorHandler, requestLogger, notFoundHandler } = require('./middleware');

const app = express();
const PORT = 3001;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// 静态文件服务 - 提供项目文件夹中的图片
app.get('/images/:projectId/:filename', async (req, res) => {
  try {
    const { projectId, filename } = req.params;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project || !project.folderPath) {
      return res.status(404).send('项目不存在');
    }
    
    const imagePath = path.join(project.folderPath, filename);
    res.sendFile(imagePath);
  } catch (error) {
    res.status(404).send('文件不存在');
  }
});

// API 路由挂载
app.use('/api/projects', projectsRouter);
app.use('/api/images', imagesRouter);
app.use('/api', foldersRouter);  // 挂载到 /api，因为 foldersRouter 内部定义了 /select-folder

// 更新文件监听器的端点
app.post('/api/update-watcher', async (req, res) => {
  try {
    if (global.updateWatcher) {
      await global.updateWatcher();
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '文件监听器未初始化' });
    }
  } catch (error) {
    console.error('更新监听器失败:', error);
    res.status(500).json({ error: '更新监听器失败' });
  }
});

// 404 和错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
async function start() {
  try {
    // 1. 初始化数据目录
    await initDataDir();
    console.log('✓ 数据目录初始化完成');
    
    // 2. 创建 HTTP 服务器
    const server = http.createServer(app);
    
    // 3. 初始化 WebSocket 服务器
    initWebSocketServer(server);
    console.log('✓ WebSocket 服务器初始化完成');
    
    // 4. 设置 WebSocket 广播回调
    setBroadcastCallback(broadcast);
    
    // 5. 设置文件监听器
    global.updateWatcher = await setupFileWatcher();
    console.log('✓ 文件监听器初始化完成');
    
    // 6. 启动时同步一次
    await syncFileSystem();
    
    // 7. 启动 HTTP 服务器
    server.listen(PORT, () => {
      console.log('========================================');
      console.log('  Prompt 管理工具 - 后端服务');
      console.log('========================================');
      console.log(`✓ HTTP 服务器: http://localhost:${PORT}`);
      console.log(`✓ WebSocket 服务器: ws://localhost:${PORT}`);
      console.log('========================================');
    });
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

// 启动应用
start().catch(console.error);
