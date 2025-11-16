const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { loadProjects, saveProjects } = require('../services/storage');

const router = express.Router();

// POST /api/select-folder - 选择文件夹
router.post('/', async (req, res) => {
  try {
    const vbsPath = path.join(__dirname, '../../select-folder.vbs');
    
    const vbsProcess = spawn('cscript.exe', ['//NoLogo', vbsPath], {
      cwd: path.dirname(vbsPath)
    });
    
    let output = '';
    
    vbsProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    vbsProcess.stderr.on('data', (data) => {
      console.error('VBS 错误:', data.toString());
    });
    
    vbsProcess.on('close', (code) => {
      const folderPath = output.trim();
      
      if (code === 0 && folderPath && folderPath !== 'CANCELLED') {
        res.json({ folderPath });
      } else {
        res.json({ folderPath: null });
      }
    });
    
  } catch (error) {
    console.error('选择文件夹失败:', error);
    res.status(500).json({ error: '选择文件夹失败' });
  }
});



module.exports = router;
