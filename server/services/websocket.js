const WebSocket = require('ws');

let wss = null;
const clients = new Set();

// 初始化 WebSocket 服务器
function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('✓ WebSocket 客户端已连接');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('✗ WebSocket 客户端断开');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      clients.delete(ws);
    });
  });
  
  return wss;
}

// 广播消息到所有客户端
function broadcast(message) {
  const data = JSON.stringify(message);
  let sent = 0;
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
        sent++;
      } catch (error) {
        console.error('发送 WebSocket 消息失败:', error);
      }
    }
  });
  
  if (sent > 0) {
    console.log(`✓ WebSocket 广播: ${message.type} (${sent} 个客户端)`);
  }
}

// 获取连接的客户端数量
function getClientCount() {
  return clients.size;
}

module.exports = {
  initWebSocketServer,
  broadcast,
  getClientCount
};
