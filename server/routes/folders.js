const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { loadProjects, saveProjects } = require('../services/storage');

const router = express.Router();

// POST /api/select-folder - 选择文件夹
router.post('/select-folder', async (req, res) => {
  console.log('=== 收到文件夹选择请求 ===');
  try {
    const vbsPath = path.join(__dirname, '../../select-folder.vbs');
    
    console.log('VBS 路径:', vbsPath);
    console.log('VBS 文件存在:', require('fs').existsSync(vbsPath));
    
    const vbsProcess = spawn('cscript.exe', ['//NoLogo', vbsPath], {
      cwd: path.dirname(vbsPath)
    });
    
    let output = '';
    let errorOutput = '';
    
    vbsProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log('VBS stdout:', chunk);
      output += chunk;
    });
    
    vbsProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.error('VBS stderr:', chunk);
      errorOutput += chunk;
    });
    
    vbsProcess.on('error', (error) => {
      console.error('VBS 进程错误:', error);
    });
    
    vbsProcess.on('close', (code) => {
      const folderPath = output.trim();
      
      console.log('VBS 退出码:', code);
      console.log('VBS 输出:', folderPath);
      console.log('VBS 错误输出:', errorOutput);
      
      if (code === 0 && folderPath && folderPath !== 'CANCELLED') {
        console.log('返回成功结果:', { folderPath });
        res.json({ folderPath });
      } else {
        console.log('返回取消或失败结果');
        res.json({ folderPath: null });
      }
    });
    
  } catch (error) {
    console.error('选择文件夹失败:', error);
    res.status(500).json({ error: '选择文件夹失败: ' + error.message });
  }
});



module.exports = router;
