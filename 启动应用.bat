@echo off
chcp 65001 >nul
echo ========================================
echo   Stable Diffusion Prompt 管理工具
echo ========================================
echo.
echo 正在启动服务...
echo.

cd /d "%~dp0"

:: 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [提示] 首次运行需要安装依赖，请稍候...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败，请检查网络连接或 Node.js 是否正确安装
        pause
        exit /b 1
    )
    echo.
    echo [完成] 依赖安装成功！
    echo.
)

:: 同时启动后端服务器和前端开发服务器
echo [启动] 正在启动后端服务器和前端开发服务器...
echo.
echo ----------------------------------------
echo 后端服务器: http://localhost:3001
echo 前端界面:   http://localhost:5173
echo 数据目录:   %CD%\data
echo ----------------------------------------
echo.
call npm start

pause
