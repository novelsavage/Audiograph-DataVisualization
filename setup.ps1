# Setup script for audiograph-network (PowerShell)
# This script copies the JSON data file to the public folder

Write-Host "Setting up audiograph-network..." -ForegroundColor Cyan

# Check if JSON file exists in parent directory
$jsonPath = "..\spotify_featuring_network.json"
if (Test-Path $jsonPath) {
    Write-Host "Copying spotify_featuring_network.json to public folder..." -ForegroundColor Yellow
    Copy-Item $jsonPath -Destination "public\spotify_featuring_network.json" -Force
    Write-Host "✓ JSON file copied successfully" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: spotify_featuring_network.json not found in parent directory" -ForegroundColor Yellow
    Write-Host "Please copy it manually to public\ folder" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure spotify_featuring_network.json is in public\ folder"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "3. Open http://localhost:3000 in your browser"

