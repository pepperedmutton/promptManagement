# Prompt Management Tool Launcher
Write-Host "Starting Prompt Management Tool..." -ForegroundColor Green
Write-Host ""

# Start the backend server in background
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run server
}

# Wait for server to start
Start-Sleep -Seconds 3

# Open browser to the frontend
Start-Process "http://localhost:5173"

Write-Host "Prompt Management Tool is starting..." -ForegroundColor Green
Write-Host "Backend server: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
Read-Host