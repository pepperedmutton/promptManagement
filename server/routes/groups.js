const express = require('express');
const { loadProjects, saveProjects } = require('../services/storage');

const router = express.Router();

// POST /api/projects/:projectId/groups - 创建分组
router.post('/:projectId/groups', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    // 初始化分组数组
    if (!project.imageGroups) {
      project.imageGroups = [];
    }
    
    // 创建新分组
    const newGroup = {
      id: `group-${Date.now()}`,
      title: title || '未命名分组',
      description: description || '',
      imageIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    project.imageGroups.push(newGroup);
    await saveProjects(projects);
    
    console.log(`✓ 创建分组: ${newGroup.title}`);
    res.json(newGroup);
  } catch (error) {
    console.error('创建分组失败:', error);
    res.status(500).json({ error: '创建分组失败' });
  }
});

// PUT /api/projects/:projectId/groups/:groupId - 更新分组
router.put('/:projectId/groups/:groupId', async (req, res) => {
  try {
    const { projectId, groupId } = req.params;
    const updates = req.body;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.imageGroups) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    const groupIndex = project.imageGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    // 更新分组
    project.imageGroups[groupIndex] = {
      ...project.imageGroups[groupIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await saveProjects(projects);
    
    console.log(`✓ 更新分组: ${project.imageGroups[groupIndex].title}`);
    res.json(project.imageGroups[groupIndex]);
  } catch (error) {
    console.error('更新分组失败:', error);
    res.status(500).json({ error: '更新分组失败' });
  }
});

// DELETE /api/projects/:projectId/groups/:groupId - 删除分组
router.delete('/:projectId/groups/:groupId', async (req, res) => {
  try {
    const { projectId, groupId } = req.params;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.imageGroups) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    const group = project.imageGroups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    project.imageGroups = project.imageGroups.filter(g => g.id !== groupId);
    await saveProjects(projects);
    
    console.log(`✓ 删除分组: ${group.title}`);
    res.json({ success: true });
  } catch (error) {
    console.error('删除分组失败:', error);
    res.status(500).json({ error: '删除分组失败' });
  }
});

// POST /api/projects/:projectId/groups/:groupId/images - 添加图片到分组
router.post('/:projectId/groups/:groupId/images', async (req, res) => {
  try {
    const { projectId, groupId } = req.params;
    const { imageId } = req.body;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.imageGroups) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    const group = project.imageGroups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    // 检查图片是否存在
    const imageExists = project.images.some(img => img.id === imageId);
    if (!imageExists) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    // 添加图片到分组
    if (!group.imageIds.includes(imageId)) {
      group.imageIds.push(imageId);
      group.updatedAt = new Date().toISOString();
      await saveProjects(projects);
      console.log(`✓ 添加图片 ${imageId} 到分组 ${group.title}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('添加图片到分组失败:', error);
    res.status(500).json({ error: '添加图片到分组失败' });
  }
});

// DELETE /api/projects/:projectId/groups/:groupId/images/:imageId - 从分组移除图片
router.delete('/:projectId/groups/:groupId/images/:imageId', async (req, res) => {
  try {
    const { projectId, groupId, imageId } = req.params;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.imageGroups) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    const group = project.imageGroups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    group.imageIds = group.imageIds.filter(id => id !== imageId);
    group.updatedAt = new Date().toISOString();
    await saveProjects(projects);
    
    console.log(`✓ 从分组 ${group.title} 移除图片 ${imageId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('从分组移除图片失败:', error);
    res.status(500).json({ error: '从分组移除图片失败' });
  }
});

module.exports = router;
