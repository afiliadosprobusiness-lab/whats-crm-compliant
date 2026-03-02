$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$distDir = Join-Path $projectRoot "dist"
$manifestPath = Join-Path $scriptDir "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = [string]$manifest.version
$zipPath = Join-Path $distDir "whatsapp-crm-compliant-extension-v$version.zip"
$legacyZipPath = Join-Path $distDir "whatsapp-crm-compliant-extension.zip"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
Get-ChildItem -Path $distDir -Filter "whatsapp-crm-compliant-extension*.zip" -ErrorAction SilentlyContinue | ForEach-Object {
  cmd /c del /q "$($_.FullName)" | Out-Null
}

Compress-Archive -Path (Join-Path $scriptDir "*") -DestinationPath $zipPath -Force
Copy-Item -Path $zipPath -Destination $legacyZipPath -Force
Write-Output "ZIP generado en: $zipPath"
