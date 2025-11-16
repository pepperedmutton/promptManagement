const API_BASE = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

class ApiClient {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.connectWebSocket();
  }

  // WebSocket 连接
  connectWebSocket() {
    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('✓ WebSocket 已连接');
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.listeners.forEach(listener => listener(data));
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket 断开，3秒后重连...');
        setTimeout(() => this.connectWebSocket(), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
      };
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      setTimeout(() => this.connectWebSocket(), 3000);
    }
  }

  // 订阅更新
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 获取所有项目
  async getProjects() {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('获取项目列表失败');
    return response.json();
  }

  // 创建项目
  async createProject(name, description = '') {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (!response.ok) throw new Error('创建项目失败');
    return response.json();
  }

  // 删除项目
  async deleteProject(projectId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('删除项目失败');
    return response.json();
  }

  // 更新项目
  async updateProject(projectId, updates) {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('更新项目失败');
    return response.json();
  }

  // 上传图片
  async addImageToProject(projectId, file, prompt = '') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', prompt);

    const response = await fetch(`${API_BASE}/projects/${projectId}/images`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('上传图片失败');
    const image = await response.json();
    return image.id;
  }

  // 更新图片 prompt
  async updateImagePrompt(projectId, imageId, prompt) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/images/${imageId}/prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('更新 prompt 失败');
    return response.json();
  }

  // 删除图片
  async deleteImage(projectId, imageId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/images/${imageId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('删除图片失败');
    return response.json();
  }

  // 获取图片 URL
  getImageUrl(projectId, filename) {
    return `http://localhost:3001/images/${projectId}/${filename}`;
  }
}

export const apiClient = new ApiClient();
