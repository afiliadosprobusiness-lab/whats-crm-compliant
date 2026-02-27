$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$distDir = Join-Path $projectRoot "dist"
$zipPath = Join-Path $distDir "whatsapp-crm-compliant-extension.zip"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
if (Test-Path $zipPath) {
  cmd /c del /q "$zipPath" | Out-Null
}

Compress-Archive -Path (Join-Path $scriptDir "*") -DestinationPath $zipPath -Force
Write-Output "ZIP generado en: $zipPath"
