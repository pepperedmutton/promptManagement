# Prompt Management Tool Launcher
Write-Host "Starting Prompt Management Tool..." -ForegroundColor Green
Write-Host ""

# Ensure dependencies are installed
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Checking npm dependencies..." -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $projectRoot 'node_modules'))) {
    Write-Host "Installing dependencies (npm install)..." -ForegroundColor Yellow
    Push-Location $projectRoot
    npm install
    $installExitCode = $LASTEXITCODE
    Pop-Location

    if ($installExitCode -ne 0) {
        Write-Host "Dependency installation failed. Please review the logs above." -ForegroundColor Red
        Read-Host
        exit 1
    }
} else {
    Write-Host "Dependencies already installed." -ForegroundColor DarkGreen
}

# Start the backend server in background
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:projectRoot
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
