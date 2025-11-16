const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const chokidar = require('chokidar');
const { loadProjects, saveProjects } = require('./storage');

let watcher = null;
let syncTimeout = null;
let isSyncing = false;
let broadcastCallback = null;

// 设置广播回调
function setBroadcastCallback(callback) {
  broadcastCallback = callback;
}

// 扫描项目文件夹
async function scanProjectFolder(project) {
  try {
    const files = await fs.readdir(project.folderPath);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    project.images = [];
    
    for (const file of imageFiles) {
      const imageId = path.parse(file).name;
      
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
        addedAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString()
      });
    }
    
    console.log(`✓ 扫描到 ${project.images.length} 张图片`);
  } catch (error) {
    console.error('扫描文件夹失败:', error);
  }
}

// 设置文件监听器
async function setupFileWatcher() {
  async function updateWatcher() {
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
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: 100,
      binaryInterval: 300,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50
      },
      atomic: true
    });
    
    watcher
      .on('add', async (filePath) => {
        console.log(`✓ 文件添加: ${path.basename(filePath)}`);
        await syncFileSystem();
      })
      .on('unlink', async (filePath) => {
        console.log(`✓ 文件删除: ${path.basename(filePath)}`);
        await syncFileSystem();
      })
      .on('change', async (filePath) => {
        if (filePath.endsWith('.txt')) {
          console.log(`✓ Prompt 更新: ${path.basename(filePath)}`);
          await syncFileSystem();
        }
      });
    
    console.log(`✓ 正在监听 ${folders.length} 个文件夹`);
  }
  
  await updateWatcher();
  return updateWatcher;
}

// 同步文件系统（带防抖）
async function syncFileSystem() {
  if (isSyncing) {
    console.log('⏳ 同步进行中，跳过本次触发');
    return;
  }
  
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    isSyncing = true;
    try {
      await performSync();
    } finally {
      isSyncing = false;
    }
  }, 50);
}

// 执行实际同步
async function performSync() {
  try {
    const projects = await loadProjects();
    let hasChanges = false;
    
    for (const project of projects) {
      if (!project.folderPath || !fsSync.existsSync(project.folderPath)) {
        continue;
      }
      
      const files = await fs.readdir(project.folderPath);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
      
      // 检查新增的图片
      for (const file of imageFiles) {
        const imageId = path.parse(file).name;
        const exists = project.images.some(img => img.id === imageId);
        
        if (!exists) {
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
            addedAt: stat.birthtime.toISOString(),
            updatedAt: stat.mtime.toISOString()
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
      
      // 更新 prompt 及图片元数据
      for (const image of project.images) {
        const promptFile = path.join(project.folderPath, `${image.id}.txt`);
        const imagePath = path.join(project.folderPath, image.filename);

        try {
          const stat = await fs.stat(imagePath);
          const updatedAt = stat.mtime.toISOString();
          if (image.updatedAt !== updatedAt) {
            image.updatedAt = updatedAt;
            hasChanges = true;
          }
        } catch {
          // 文件可能暂时不可访问，交给后续删除流程处�?
        }

        try {
          const prompt = await fs.readFile(promptFile, 'utf-8');
          if (image.prompt !== prompt) {
            image.prompt = prompt;
            hasChanges = true;
          }
        } catch {
          if (image.prompt !== '') {
            image.prompt = '';
            hasChanges = true;
          }
        }
      }
    }
    
    if (hasChanges) {
      await saveProjects(projects);
      console.log('✓ 数据库已同步');
      
      // 广播更新
      if (broadcastCallback) {
        broadcastCallback({ type: 'projects-updated' });
      }
    }
  } catch (error) {
    console.error('同步文件系统失败:', error);
  }
}

module.exports = {
  scanProjectFolder,
  setupFileWatcher,
  syncFileSystem,
  performSync,
  setBroadcastCallback
};
