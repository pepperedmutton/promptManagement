# Stable Diffusion Forge 集成指南

## 自动启动 Prompt 管理器

将 Prompt 管理器集成到 Stable Diffusion Forge，让它在启动 Forge 时自动运行。

### 方法 1：修改 webui-user.bat

在你的 Stable Diffusion Forge 目录中，找到并编辑 `webui-user.bat` 文件：

```batch
@echo off

set PYTHON=
set GIT=
set VENV_DIR=
set COMMANDLINE_ARGS=--xformers

@REM ================================================
@REM Start Prompt Management Tool automatically
@REM ================================================
echo Starting Prompt Management Tool...
start "" "D:\promptManagement\vite-react-app\start-silent.bat"
echo.

call webui.bat
```

### 方法 2：创建新的启动脚本

如果你不想修改原始的 `webui-user.bat`，可以创建一个新的启动脚本 `start-forge-with-manager.bat`：

```batch
@echo off
echo ================================================
echo   Starting Stable Diffusion Forge
echo   with Prompt Management Tool
echo ================================================
echo.

REM Start Prompt Manager
echo [1/2] Starting Prompt Management Tool...
start "" "D:\promptManagement\vite-react-app\start-silent.bat"

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start Forge
echo [2/2] Starting Stable Diffusion Forge...
call webui-user.bat
```

### 注意事项

1. **路径检查**：确保 `D:\promptManagement\vite-react-app\start-silent.bat` 路径正确
2. **端口冲突**：`start-silent.bat` 会自动清理旧的 Node 进程，避免端口冲突
3. **浏览器标签**：Prompt 管理器会在浏览器新标签页中自动打开
4. **关闭顺序**：先关闭 Forge，然后关闭 "Prompt Manager" 窗口

### 访问地址

- **Stable Diffusion Forge**: http://localhost:7860 (默认)
- **Prompt Management Tool**: http://localhost:5173

### 手动启动/停止

如果需要单独控制 Prompt 管理器：

**启动**：
```batch
D:\promptManagement\vite-react-app\start-app.bat
```

**停止**：
关闭 "Prompt Management Tool Servers" 或 "Prompt Manager" 窗口

---

已创建的文件：
- `start-silent.bat` - 静默启动脚本（用于 Forge 集成）
- `start-app.bat` - 普通启动脚本（桌面快捷方式使用）
- `webui-user.bat.example` - Forge 配置示例
