const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const PNG = require('pngjs').PNG;
const { loadProjects, saveProjects } = require('../services/storage');
const { broadcast } = require('../services/websocket');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 从 PNG 提取元数据
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
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    const imageId = `${timestamp}`;
    const filename = `${imageId}${ext}`;
    const imagePath = path.join(project.folderPath, filename);
    
    // 1. 先写入图片文件
    await fs.writeFile(imagePath, file.buffer);
    console.log(`✓ 图片已保存: ${filename}`);
    
    // 2. 提取并保存 prompt
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
      console.log(`✓ Prompt 已保存: ${imageId}.txt`);
    }
    
    // 3. 返回立即响应，让文件监听器处理同步
    res.json({
      success: true,
      image: {
        id: imageId,
        filename,
        mime: file.mimetype,
        prompt,
        addedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('添加图片失败:', error);
    res.status(500).json({ error: '添加图片失败' });
  }
});

// PUT /api/images/:projectId/:imageId - 更新图片 prompt
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
    
    // 1. 先写入 prompt 文件
    const promptPath = path.join(project.folderPath, `${imageId}.txt`);
    await fs.writeFile(promptPath, prompt || '', 'utf-8');
    console.log(`✓ Prompt 已更新: ${imageId}.txt`);
    
    // 2. 返回立即响应，让文件监听器处理同步
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
    
    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    // 1. 先删除文件
    const imagePath = path.join(project.folderPath, image.filename);
    const promptPath = path.join(project.folderPath, `${imageId}.txt`);
    
    await fs.unlink(imagePath).catch(() => {});
    await fs.unlink(promptPath).catch(() => {});
    console.log(`✓ 图片已删除: ${image.filename}`);
    
    // 2. 返回立即响应，让文件监听器处理同步
    res.json({ success: true });
    
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ error: '删除图片失败' });
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
