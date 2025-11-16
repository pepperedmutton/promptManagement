const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const router = express.Router();

// POST /api/select-folder - 触发系统文件夹选择器
router.post('/select-folder', async (req, res) => {
  try {
    const vbsPath = path.join(__dirname, '../../select-folder.vbs');
    const vbsProcess = spawn('cscript.exe', ['//NoLogo', vbsPath], {
      cwd: path.dirname(vbsPath)
    });

    let stdout = '';
    let stderr = '';

    vbsProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    vbsProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    vbsProcess.on('error', (error) => {
      console.error('VBS 进程错误:', error);
    });

    vbsProcess.on('close', (code) => {
      const folderPath = stdout.trim();

      console.log('VBS 退出码:', code);
      if (stderr) {
        console.error('VBS stderr:', stderr);
      }

      if (code === 0 && folderPath && folderPath !== 'CANCELLED') {
        res.json({ folderPath });
      } else {
        res.json({ folderPath: null });
      }
    });
  } catch (error) {
    console.error('选择文件夹失败:', error);
    res.status(500).json({ error: '选择文件夹失败: ' + error.message });
  }
});

module.exports = router;
