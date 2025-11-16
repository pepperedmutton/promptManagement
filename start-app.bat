@echo off
echo ========================================
echo   Prompt Management Tool
echo ========================================
echo.
echo Starting servers...
echo.

REM Kill any existing Node processes to avoid port conflicts
taskkill /F /IM node.exe > nul 2>&1

REM Wait a moment
timeout /t 1 /nobreak > nul

REM Start both backend and frontend servers using npm start
start "Prompt Management Tool Servers" cmd /c "npm start"

REM Wait for servers to start
echo Waiting for servers to start...
timeout /t 8 /nobreak > nul

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo   Servers are running:
echo   - Backend:  http://localhost:3001
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo To stop the servers, close the 
echo "Prompt Management Tool Servers" window.
echo.
echo Press any key to close this launcher...
pause > nul