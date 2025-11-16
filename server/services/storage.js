const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// 初始化数据目录
async function initDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'images'), { recursive: true });
    
    try {
      await fs.access(PROJECTS_FILE);
    } catch {
      await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2));
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

// 保存项目数据
async function saveProjects(projects) {
  try {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('保存项目数据失败:', error);
    throw error;
  }
}

module.exports = {
  DATA_DIR,
  PROJECTS_FILE,
  initDataDir,
  loadProjects,
  saveProjects
};
