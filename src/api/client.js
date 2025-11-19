const API_BASE = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

class ApiClient {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // 初始重连延迟 1 秒
    this.connectWebSocket();
  }

  // WebSocket 连接
  connectWebSocket() {
    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket 已连接');
        this.reconnectAttempts = 0; // 重置重连计数
        this.reconnectDelay = 1000;  // 重置延迟
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 收到更新:', data.type);
        this.listeners.forEach(listener => listener(data));
      };
      
      this.ws.onclose = () => {
        console.log('⚠️ WebSocket 断开');
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error);
      };
    } catch (error) {
      console.error('❌ WebSocket 连接失败:', error);
      this.scheduleReconnect();
    }
  }

  // 调度重连
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ WebSocket 重连失败次数过多，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000); // 最长 30 秒
    
    console.log(`🔄 ${delay / 1000} 秒后尝试重连... (${this.reconnectAttempts} 次)`);
    setTimeout(() => this.connectWebSocket(), delay);
  }

  // 订阅更新
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 打开系统文件夹选择对话框
  async selectFolder() {
    console.log('发送文件夹选择请求到', `${API_BASE}/select-folder`);
    try {
      const response = await fetch(`${API_BASE}/select-folder`, {
        method: 'POST'
      });
      console.log('收到响应:', response.status, response.statusText);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('请求失败:', error);
        throw new Error(error.error || '打开文件夹选择器失败');
      }
      
      const result = await response.json();
      console.log('选择结果:', result);
      return result;
    } catch (error) {
      console.error('selectFolder 错误:', error);
      throw error;
    }
  }

  // 获取所有项目
  async getProjects() {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('获取项目列表失败');
    return response.json();
  }

  // 打开文件夹作为项目
  async openFolder(folderPath, name) {
    const response = await fetch(`${API_BASE}/projects/open-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath, name })
    });
    if (!response.ok) throw new Error('打开文件夹失败');
    return response.json();
  }

  // 创建项目（废弃，保留兼容）
  async createProject(name, description = '') {
    // 不再使用，改为使用 openFolder
    throw new Error('请使用 openFolder 方法');
  }

  // 从列表移除项目（不删除文件）
  async deleteProject(projectId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('移除项目失败');
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

    const response = await fetch(`${API_BASE}/images/${projectId}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('上传图片失败');
    const data = await response.json();
    return data.image; // 返回完整的图片对象
  }

  // 更新图片 prompt
  async updateImagePrompt(projectId, imageId, prompt) {
    const response = await fetch(`${API_BASE}/images/${projectId}/${imageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('更新 prompt 失败');
    return response.json();
  }

  // 删除图片
  async deleteImage(projectId, imageId) {
    const response = await fetch(`${API_BASE}/images/${projectId}/${imageId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('删除图片失败');
    return response.json();
  }

  // 保存马赛克编辑后的图片
  async saveMosaicImage(projectId, imageId, blob, filename = 'mosaic.png') {
    const formData = new FormData();
    formData.append('image', blob, filename);

    const response = await fetch(`${API_BASE}/images/${projectId}/${imageId}/mosaic`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) throw new Error('保存马赛克图片失败');
    return response.json();
  }

  // 获取图片 URL（支持 cache busting）
  getImageUrl(projectId, filename, version = '') {
    const cacheBuster = version ? `?v=${encodeURIComponent(version)}` : '';
    return `http://localhost:3001/images/${projectId}/${filename}${cacheBuster}`;
  }

  // 创建图片分组
  async createImageGroup(projectId, title = '', description = '', insertIndex = null) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, insertIndex })
    });
    if (!response.ok) throw new Error('创建分组失败');
    return response.json();
  }

  // 更新分组
  async updateImageGroup(projectId, groupId, updates) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('更新分组失败');
    return response.json();
  }

  // 删除分组
  async deleteImageGroup(projectId, groupId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/groups/${groupId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('删除分组失败');
    return response.json();
  }

  // 添加图片到分组
  async addImageToGroup(projectId, groupId, imageId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/groups/${groupId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId })
    });
    if (!response.ok) throw new Error('添加图片到分组失败');
    return response.json();
  }

  // 从分组移除图片
  async removeImageFromGroup(projectId, groupId, imageId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/groups/${groupId}/images/${imageId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('从分组移除图片失败');
    return response.json();
  }
}

export const apiClient = new ApiClient();
