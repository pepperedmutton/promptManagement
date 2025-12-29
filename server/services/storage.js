const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// 文件写入锁
let isWriting = false;
let pendingWrite = null;

// 初始化数据目录
async function initDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'images'), { recursive: true });
    
    try {
      await fs.access(PROJECTS_FILE);
    } catch {
      await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    
    console.log(`✓ 数据目录初始化完成: ${DATA_DIR}`);
  } catch (error) {
    console.error('初始化数据目录失败:', error);
    throw error;
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

// 保存项目数据（带写入锁保护）
async function saveProjects(projects) {
  // 如果正在写入，将新的写入操作加入队列
  if (isWriting) {
    pendingWrite = projects;
    console.log('⏳ 写入操作已排队等待...');
    return new Promise((resolve) => {
      // 使用轮询等待写入完成
      const checkInterval = setInterval(() => {
        if (!isWriting) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 10);
    });
  }

  try {
    isWriting = true;
    
    // 序列化 JSON，确保格式正确
    const jsonString = JSON.stringify(projects, null, 2);
    
    // 写入文件，明确指定 UTF-8 编码
    await fs.writeFile(PROJECTS_FILE, jsonString, 'utf-8');
    
    // 验证写入的内容
    const verification = await fs.readFile(PROJECTS_FILE, 'utf-8');
    try {
      JSON.parse(verification);
    } catch (parseError) {
      console.error('❌ 写入的 JSON 无效，正在回滚...', parseError);
      throw new Error('JSON 写入验证失败');
    }
    
  } catch (error) {
    console.error('保存项目数据失败:', error);
    throw error;
  } finally {
    isWriting = false;
    
    // 如果有待处理的写入，立即执行
    if (pendingWrite) {
      const dataToWrite = pendingWrite;
      pendingWrite = null;
      console.log('🚀 执行排队的写入操作...');
      await saveProjects(dataToWrite);
    }
  }
}

module.exports = {
  DATA_DIR,
  PROJECTS_FILE,
  initDataDir,
  loadProjects,
  saveProjects
};
