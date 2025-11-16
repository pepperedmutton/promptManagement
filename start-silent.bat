@echo off
REM Silent start for Prompt Management Tool (for SD Forge integration)

REM Kill any existing Node processes to avoid port conflicts
taskkill /F /IM node.exe > nul 2>&1

REM Change to the app directory
cd /d D:\promptManagement\vite-react-app

REM Start both backend and frontend servers in minimized window
start "Prompt Manager" /MIN cmd /c "npm start"

REM Wait for servers to start
timeout /t 8 /nobreak > nul

REM Open browser
start http://localhost:5173

exit
