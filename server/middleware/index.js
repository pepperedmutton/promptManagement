// 错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// 请求日志中间件
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(
      `${req.method} ${req.path} ${statusColor}${res.statusCode}\x1b[0m ${duration}ms`
    );
  });
  
  next();
}

// 404 处理中间件
function notFoundHandler(req, res) {
  res.status(404).json({ error: '路径不存在' });
}

module.exports = {
  errorHandler,
  requestLogger,
  notFoundHandler
};
