const express = require('express');
const { loadProjects, saveProjects } = require('../services/storage');
const { scanProjectFolder } = require('../services/fileWatcher');
const { broadcast } = require('../services/websocket');

const router = express.Router();

// GET /api/projects - 获取所有项目
router.get('/', async (req, res) => {
  try {
    const projects = await loadProjects();
    res.json(projects);
  } catch (error) {
    console.error('加载项目失败:', error);
    res.status(500).json({ error: '加载项目失败' });
  }
});

// POST /api/projects - 创建新项目
router.post('/', async (req, res) => {
  try {
    const { name, folderPath } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }
    
    const projects = await loadProjects();
    
    const newProject = {
      id: Date.now().toString(),
      name,
      folderPath: folderPath || '',
      images: [],
      createdAt: new Date().toISOString()
    };
    
    // 如果有文件夹路径，扫描图片
    if (folderPath) {
      await scanProjectFolder(newProject);
    }
    
    projects.push(newProject);
    await saveProjects(projects);
    
    broadcast({ type: 'project-created', project: newProject });
    res.json(newProject);
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ error: '创建项目失败' });
  }
});

// POST /api/projects/open-folder - 打开文件夹作为项目
router.post('/open-folder', async (req, res) => {
  try {
    const { folderPath, name } = req.body;
    const fs = require('fs').promises;
    
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
    
    const path = require('path');
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
    if (global.updateWatcher) {
      await global.updateWatcher();
    }
    
    broadcast({ type: 'project-created', project: newProject });
    res.json(newProject);
  } catch (error) {
    console.error('打开文件夹失败:', error);
    res.status(500).json({ error: '打开文件夹失败' });
  }
});

// PUT /api/projects/:id - 更新项目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    // 更新项目信息
    Object.assign(project, updates);
    
    // 如果更新了文件夹路径，重新扫描
    if (updates.folderPath) {
      await scanProjectFolder(project);
    }
    
    await saveProjects(projects);
    
    broadcast({ type: 'project-updated', project });
    res.json(project);
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ error: '更新项目失败' });
  }
});

// DELETE /api/projects/:id - 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let projects = await loadProjects();
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    projects = projects.filter(p => p.id !== id);
    await saveProjects(projects);
    
    broadcast({ type: 'project-deleted', projectId: id });
    res.json({ success: true });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ error: '删除项目失败' });
  }
});

module.exports = router;
