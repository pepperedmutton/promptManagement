const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const PNG = require('pngjs').PNG;
const { loadProjects, saveProjects } = require('../services/storage');
const { broadcast } = require('../services/websocket');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 尝试从 PNG 中提取 metadata（主要用于 prompt）
function extractPNGMetadata(buffer) {
  try {
    const png = PNG.sync.read(buffer);
    if (png.text && png.text.parameters) {
      return png.text.parameters;
    }
  } catch (error) {
    console.error('提取 PNG 元数据失败:', error);
  }
  return null;
}

// POST /api/images/:projectId - 添加图片
router.post('/:projectId', upload.single('image'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.folderPath) {
      return res.status(400).json({ error: '项目未绑定文件夹' });
    }
    
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    const imageId = `${timestamp}`;
    const filename = `${imageId}${ext}`;
    const imagePath = path.join(project.folderPath, filename);
    
    await fs.writeFile(imagePath, file.buffer);
    console.log(`📸 图片已保存 ${filename}`);
    
    let prompt = req.body.prompt || '';
    if (!prompt && ext.toLowerCase() === '.png') {
      const metadata = extractPNGMetadata(file.buffer);
      if (metadata) {
        prompt = metadata;
      }
    }
    
    if (prompt) {
      const promptPath = path.join(project.folderPath, `${imageId}.txt`);
      await fs.writeFile(promptPath, prompt, 'utf-8');
      console.log(`📝 Prompt 已保存 ${imageId}.txt`);
    }
    
    const now = new Date().toISOString();
    const newImage = {
      id: imageId,
      filename,
      mime: file.mimetype,
      prompt,
      addedAt: now,
      updatedAt: now
    };

    // 将新图片添加到项目数据库
    if (!project.images) {
      project.images = [];
    }
    project.images.push(newImage);
    await saveProjects(projects);
    console.log(`✓ 图片 ${filename} 已添加到项目数据库`);

    broadcast({ type: 'projects-updated' });



    res.json({
      success: true,
      image: newImage
    });
  } catch (error) {
    console.error('添加图片失败:', error);
    res.status(500).json({ error: '添加图片失败' });
  }
});

// PUT /api/images/:projectId/:imageId - 更新 prompt
router.put('/:projectId/:imageId', async (req, res) => {
  try {
    const { projectId, imageId } = req.params;
    const { prompt } = req.body;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.folderPath) {
      return res.status(400).json({ error: '项目未绑定文件夹' });
    }
    
    const promptPath = path.join(project.folderPath, `${imageId}.txt`);
    await fs.writeFile(promptPath, prompt || '', 'utf-8');
    console.log(`📝 Prompt 已更新 ${imageId}.txt`);
    
    const image = (project.images || []).find(img => img.id === imageId);
    if (image) {
      image.prompt = prompt || '';
      image.updatedAt = new Date().toISOString();
    }

    await saveProjects(projects);
    broadcast({ type: 'projects-updated' });

    res.json({ success: true });
  } catch (error) {
    console.error('更新 prompt 失败:', error);
    res.status(500).json({ error: '更新 prompt 失败' });
  }
});

// DELETE /api/images/:projectId/:imageId - 删除图片
router.delete('/:projectId/:imageId', async (req, res) => {
  try {
    const { projectId, imageId } = req.params;

    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    if (!project.folderPath) {
      return res.status(400).json({ error: '项目未绑定文件夹' });
    }

    if (!project.images) {
      project.images = [];
    }

    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const imagePath = path.join(project.folderPath, image.filename);
    const promptPath = path.join(project.folderPath, `${imageId}.txt`);

    await fs.unlink(imagePath).catch(() => {});
    await fs.unlink(promptPath).catch(() => {});

    if (project.imageGroups) {
      project.imageGroups.forEach(group => {
        if (group.imageIds && group.imageIds.includes(imageId)) {
          group.imageIds = group.imageIds.filter(id => id !== imageId);
          group.updatedAt = new Date().toISOString();
          console.log(`从分组 ${group.title} 移除了图片 ${imageId}`);
        }
      });
    }

    project.images = project.images.filter(img => img.id !== imageId);
    await saveProjects(projects);
    broadcast({ type: 'projects-updated' });

    console.log(`🗑️ 图片已删除 ${image.filename}`);

    res.json({ success: true });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ error: '删除图片失败' });
  }
});

// PUT /api/images/:projectId/:imageId/mosaic - 保存马赛克结果
// PUT /api/images/:projectId/:imageId/mosaic - 保存马赛克结果

// PUT /api/images/:projectId/:imageId/mosaic - 保存马赛克结果
router.put('/:projectId/:imageId/mosaic', upload.single('image'), async (req, res) => {
  try {
    const { projectId, imageId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: '没有收到更新后的图片' });
    }
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    if (!project.folderPath) {
      return res.status(400).json({ error: '项目未绑定文件夹' });
    }
    
    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    const imagePath = path.join(project.folderPath, image.filename);
    await fs.writeFile(imagePath, file.buffer);
    
    image.updatedAt = new Date().toISOString();
    await saveProjects(projects);
    
    broadcast({ type: 'projects-updated' });
    res.json({ success: true, updatedAt: image.updatedAt });
  } catch (error) {
    console.error('保存马赛克图片失败:', error);
    res.status(500).json({ error: '保存马赛克图片失败' });
  }
});

// GET /api/images/:projectId/:imageId/file - 获取图片文件
router.get('/:projectId/:imageId/file', async (req, res) => {
  try {
    const { projectId, imageId } = req.params;
    
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    
    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    const imagePath = path.join(project.folderPath, image.filename);
    res.sendFile(imagePath);
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({ error: '获取图片失败' });
  }
});

module.exports = router;
