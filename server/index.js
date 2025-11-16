const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = 3001;

// 数据存储目录 - 在项目根目录创建 data 文件夹
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// 中间件
app.use(cors());
app.use(express.json());

// 动态提供项目文件夹中的图片
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

// 初始化数据目录
async function initDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'images'), { recursive: true });
    
    // 如果 projects.json 不存在，创建空数组
    try {
      await fs.access(PROJECTS_FILE);
    } catch {
      await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2));
    }
    
    console.log(`✓ 数据目录初始化完成: ${DATA_DIR}`);
  } catch (error) {
    console.error('初始化数据目录失败:', error);
  }
}

// 读取项目数据
async function loadProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取项目数据失败:', error);
    return [];
  }
}

// 保存项目数据
async function saveProjects(projects) {
  try {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    broadcastUpdate({ type: 'projects-updated' });
  } catch (error) {
    console.error('保存项目数据失败:', error);
    throw error;
  }
}

// API 路由

// 获取所有项目
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await loadProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

// 打开/添加文件夹作为项目
app.post('/api/projects/open-folder', async (req, res) => {
  try {
    const { folderPath, name } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ error: '必须提供文件夹路径' });
    }
    
    // 检查文件夹是否存在
    try {
      await fs.access(folderPath);
    } catch {
      return res.status(400).json({ error: '文件夹不存在' });
    }
    
    const projects = await loadProjects();
    
    // 检查是否已经添加过这个文件夹
    const existing = projects.find(p => p.folderPath === folderPath);
    if (existing) {
      return res.json(existing);
    }
    
    const newProject = {
      id: Date.now().toString(),
      name: name || path.basename(folderPath),
      folderPath,
      createdAt: new Date().toISOString(),
      images: []
    };
    
    // 扫描文件夹中的图片
    await scanProjectFolder(newProject);
    
    projects.push(newProject);
    await saveProjects(projects);
    
    // 更新文件监听
    await onProjectAdded();
    
    res.json(newProject);
  } catch (error) {
    console.error('打开文件夹失败:', error);
    res.status(500).json({ error: '打开文件夹失败' });
  }
});

// 扫描项目文件夹
async function scanProjectFolder(project) {
  try {
    const files = await fs.readdir(project.folderPath);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    project.images = [];
    
    for (const file of imageFiles) {
      const imageId = path.parse(file).name;
      
      // 读取对应的 prompt 文件
      let prompt = '';
      const promptFile = path.join(project.folderPath, `${imageId}.txt`);
      try {
        prompt = await fs.readFile(promptFile, 'utf-8');
      } catch {}
      
      const stat = await fs.stat(path.join(project.folderPath, file));
      project.images.push({
        id: imageId,
        filename: file,
        mime: `image/${path.extname(file).slice(1)}`,
        prompt,
        addedAt: stat.birthtime.toISOString()
      });
    }
    
    console.log(`✓ 扫描到 ${project.images.length} 张图片`);
  } catch (error) {
    console.error('扫描文件夹失败:', error);
  }
}

// 从列表移除项目（不删除文件）
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await loadProjects();
    
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    // 只从列表移除，不删除文件夹
    projects.splice(projectIndex, 1);
    await saveProjects(projects);
    
    res.json({ success: true });
  } catch (error) {
    console.error('移除项目失败:', error);
    res.status(500).json({ error: '移除项目失败' });
  }
});

// 更新项目（只能修改名称）
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const projects = await loadProjects();
    
    const project = projects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (name) project.name = name;
    
    await saveProjects(projects);
    res.json(project);
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ error: '更新项目失败' });
  }
});

// 上传图片
const multer = require('multer');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const projectId = req.params.projectId;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project || !project.folderPath) {
      return cb(new Error('项目不存在或未关联文件夹'));
    }
    
    cb(null, project.folderPath);
  },
  filename: (req, file, cb) => {
    const imageId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${imageId}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/projects/:projectId/images', upload.single('image'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { prompt } = req.body;
    const projects = await loadProjects();
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    const imageId = path.parse(req.file.filename).name;
    const newImage = {
      id: imageId,
      filename: req.file.filename,
      mime: req.file.mimetype,
      prompt: prompt || '',
      addedAt: new Date().toISOString()
    };
    
    // 如果有 prompt，保存为 txt 文件
    if (prompt) {
      const promptFile = path.join(project.folderPath, `${imageId}.txt`);
      await fs.writeFile(promptFile, prompt, 'utf-8');
    }
    
    project.images.push(newImage);
    await saveProjects(projects);
    
    res.json(newImage);
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ error: '上传图片失败' });
  }
});

// 更新图片 prompt
app.put('/api/projects/:projectId/images/:imageId/prompt', async (req, res) => {
  try {
    const { projectId, imageId } = req.params;
    const { prompt } = req.body;
    const projects = await loadProjects();
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    image.prompt = prompt;
    
    // 保存 prompt 到 txt 文件
    const promptFile = path.join(project.folderPath, `${imageId}.txt`);
    await fs.writeFile(promptFile, prompt, 'utf-8');
    
    await saveProjects(projects);
    res.json(image);
  } catch (error) {
    console.error('更新 prompt 失败:', error);
    res.status(500).json({ error: '更新 prompt 失败' });
  }
});

// 删除图片
app.delete('/api/projects/:projectId/images/:imageId', async (req, res) => {
  try {
    const { projectId, imageId } = req.params;
    const projects = await loadProjects();
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    const imageIndex = project.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    const image = project.images[imageIndex];
    
    // 删除图片文件和 prompt 文件
    const imageFile = path.join(project.folderPath, image.filename);
    const promptFile = path.join(project.folderPath, `${imageId}.txt`);
    
    await fs.unlink(imageFile).catch(() => {});
    await fs.unlink(promptFile).catch(() => {});
    
    project.images.splice(imageIndex, 1);
    await saveProjects(projects);
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ error: '删除图片失败' });
  }
});

// WebSocket 服务器用于实时通知
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✓ 新的 WebSocket 连接');
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcastUpdate(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 文件监听 - 监听所有项目文件夹
function setupFileWatcher() {
  let watcher = null;
  
  async function updateWatcher() {
    // 关闭旧的 watcher
    if (watcher) {
      await watcher.close();
    }
    
    const projects = await loadProjects();
    const folders = projects
      .filter(p => p.folderPath && fsSync.existsSync(p.folderPath))
      .map(p => p.folderPath);
    
    if (folders.length === 0) {
      console.log('没有需要监听的文件夹');
      return;
    }
    
    watcher = chokidar.watch(folders, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true
    });
    
    watcher
      .on('add', async (filePath) => {
        console.log(`文件添加: ${filePath}`);
        await syncFileSystemToDatabase();
      })
      .on('unlink', async (filePath) => {
        console.log(`文件删除: ${filePath}`);
        await syncFileSystemToDatabase();
      })
      .on('change', async (filePath) => {
        if (filePath.endsWith('.txt')) {
          console.log(`文件修改: ${filePath}`);
          await syncFileSystemToDatabase();
        }
      });
    
    console.log(`✓ 正在监听 ${folders.length} 个文件夹`);
  }
  
  updateWatcher();
  
  // 返回更新函数供外部调用
  return updateWatcher;
}

let updateWatcher = null;

// 同步文件系统到数据库
async function syncFileSystemToDatabase() {
  try {
    const projects = await loadProjects();
    let hasChanges = false;
    
    for (const project of projects) {
      if (!project.folderPath || !fsSync.existsSync(project.folderPath)) {
        continue;
      }
      
      try {
        const files = await fs.readdir(project.folderPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        
        // 检查新增的图片文件
        for (const file of imageFiles) {
          const imageId = path.parse(file).name;
          const exists = project.images.some(img => img.id === imageId);
          
          if (!exists) {
            // 读取对应的 prompt 文件
            let prompt = '';
            const promptFile = path.join(project.folderPath, `${imageId}.txt`);
            try {
              prompt = await fs.readFile(promptFile, 'utf-8');
            } catch {}
            
            const stat = await fs.stat(path.join(project.folderPath, file));
            project.images.push({
              id: imageId,
              filename: file,
              mime: `image/${path.extname(file).slice(1)}`,
              prompt,
              addedAt: stat.birthtime.toISOString()
            });
            
            hasChanges = true;
            console.log(`✓ 同步新图片: ${file}`);
          }
        }
        
        // 检查已删除的图片
        const imagesToRemove = [];
        for (const image of project.images) {
          const imagePath = path.join(project.folderPath, image.filename);
          if (!fsSync.existsSync(imagePath)) {
            imagesToRemove.push(image.id);
          }
        }
        
        if (imagesToRemove.length > 0) {
          project.images = project.images.filter(img => !imagesToRemove.includes(img.id));
          hasChanges = true;
          console.log(`✓ 移除已删除的图片: ${imagesToRemove.length} 个`);
        }
        
        // 更新 prompt（检查 txt 文件）
        for (const image of project.images) {
          const promptFile = path.join(project.folderPath, `${image.id}.txt`);
          try {
            const prompt = await fs.readFile(promptFile, 'utf-8');
            if (image.prompt !== prompt) {
              image.prompt = prompt;
              hasChanges = true;
            }
          } catch {
            // txt 文件不存在，清空 prompt
            if (image.prompt !== '') {
              image.prompt = '';
              hasChanges = true;
            }
          }
        }
        
      } catch (error) {
        console.error(`扫描项目 ${project.name} 失败:`, error);
      }
    }
    
    if (hasChanges) {
      await saveProjects(projects);
      console.log('✓ 数据库已同步');
    }
  } catch (error) {
    console.error('同步文件系统失败:', error);
  }
}

// 启动服务器
async function start() {
  await initDataDir();
  await syncFileSystemToDatabase(); // 启动时同步一次
  updateWatcher = setupFileWatcher();
  
  server.listen(PORT, () => {
    console.log('========================================');
    console.log('  Prompt 管理工具 - 后端服务');
    console.log('========================================');
    console.log(`✓ HTTP 服务器运行在: http://localhost:${PORT}`);
    console.log(`✓ WebSocket 服务器运行在: ws://localhost:${PORT}`);
    console.log(`✓ 数据目录: ${DATA_DIR}`);
    console.log('========================================');
  });
}

start().catch(console.error);

// 在打开新文件夹后更新监听
async function onProjectAdded() {
  if (updateWatcher) {
    await updateWatcher();
  }
}
