# ====================================================================
# SUBIR_GITHUB.ps1 - Script para subir el proyecto a GitHub
# ====================================================================
# IMPORTANTE: Este script requiere que Git esté instalado
#
# Si Git no está instalado:
# 1. Descargue Git desde: https://git-scm.com/download/win
# 2. Instale y reinicie PowerShell
# 3. Ejecute este script
# ====================================================================

$ErrorActionPreference = "Stop"
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoUrl = "https://github.com/AaronC17/Automatizarcm.git"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " SUBIR PROYECTO A GITHUB" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Git está instalado
try {
    git --version | Out-Null
    Write-Host "[✓] Git instalado correctamente" -ForegroundColor Green
} catch {
    Write-Host "[✗] Git no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCIONES:" -ForegroundColor Yellow
    Write-Host "  1. Descargue Git desde: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "  2. Instale Git con las opciones por defecto" -ForegroundColor White
    Write-Host "  3. Reinicie PowerShell" -ForegroundColor White
    Write-Host "  4. Ejecute este script nuevamente" -ForegroundColor White
    Write-Host ""
    Write-Host "ALTERNATIVA - Comandos manuales:" -ForegroundColor Yellow
    Write-Host "  cd '$repoPath'" -ForegroundColor White
    Write-Host "  git init" -ForegroundColor White
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m 'Initial commit: Automatizador de Matrícula v1.0'" -ForegroundColor White
    Write-Host "  git branch -M main" -ForegroundColor White
    Write-Host "  git remote add origin $repoUrl" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
    Write-Host ""
    Read-Host "Presione Enter para salir"
    exit 1
}

Set-Location $repoPath

Write-Host ""
Write-Host "[1/7] Inicializando repositorio Git..." -ForegroundColor Yellow

# Verificar si ya existe un repo git
if (Test-Path ".git") {
    Write-Host "  Ya existe un repositorio Git en esta carpeta" -ForegroundColor Gray
    $respuesta = Read-Host "  ¿Desea reinicializar? (s/n)"
    if ($respuesta -eq "s" -or $respuesta -eq "S") {
        Remove-Item -Path ".git" -Recurse -Force
        git init
        Write-Host "  Repositorio reinicializado" -ForegroundColor Green
    }
} else {
    git init
    Write-Host "  Repositorio inicializado" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/7] Configurando Git..." -ForegroundColor Yellow

# Configurar nombre y correo si no están configurados
$gitName = git config user.name
$gitEmail = git config user.email

if ([string]::IsNullOrEmpty($gitName)) {
    $nombre = Read-Host "  Ingrese su nombre para Git"
    git config user.name "$nombre"
    Write-Host "  Nombre configurado: $nombre" -ForegroundColor Green
}

if ([string]::IsNullOrEmpty($gitEmail)) {
    $email = Read-Host "  Ingrese su correo para Git"
    git config user.email "$email"
    Write-Host "  Correo configurado: $email" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/7] Agregando archivos al repositorio..." -ForegroundColor Yellow
git add .
Write-Host "  Archivos agregados" -ForegroundColor Green

Write-Host ""
Write-Host "[4/7] Creando commit inicial..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Automatizador de Matrícula v1.0

- 6 módulos VBA completos (Configuración, Utilidades, Sincronización, Correos, Reportes, Panel)
- 3 scripts Power Query para importación y cruce de datos
- Sistema de envío automático de correos vía Outlook
- Generación de reportes ejecutivos en Excel
- Panel de control con botones y proceso completo integrado
- Documentación completa de instalación y uso
- Script de setup automático para Windows
- Plantillas HTML profesionales para correos
"

git commit -m "$commitMessage"
Write-Host "  Commit creado exitosamente" -ForegroundColor Green

Write-Host ""
Write-Host "[5/7] Configurando rama principal como 'main'..." -ForegroundColor Yellow
git branch -M main
Write-Host "  Rama configurada" -ForegroundColor Green

Write-Host ""
Write-Host "[6/7] Agregando remote de GitHub..." -ForegroundColor Yellow

# Verificar si el remote ya existe
$remotes = git remote
if ($remotes -contains "origin") {
    Write-Host "  Remote 'origin' ya existe" -ForegroundColor Gray
    git remote set-url origin $repoUrl
    Write-Host "  URL del remote actualizada" -ForegroundColor Green
} else {
    git remote add origin $repoUrl
    Write-Host "  Remote agregado: $repoUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "[7/7] Subiendo a GitHub..." -ForegroundColor Yellow
Write-Host "  Esto puede tomar unos momentos..." -ForegroundColor Gray
Write-Host ""

try {
    # Intentar push
    git push -u origin main 2>&1 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host " ✓ PROYECTO SUBIDO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repositorio: $repoUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Puede ver su proyecto en:" -ForegroundColor Yellow
    Write-Host "  https://github.com/AaronC17/Automatizarcm" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Yellow
    Write-Host " NOTA IMPORTANTE" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Si obtiene un error de autenticación:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Vaya a GitHub: https://github.com/settings/tokens" -ForegroundColor Yellow
    Write-Host "2. Generate new token (classic)" -ForegroundColor Yellow
    Write-Host "3. Seleccione los siguientes permisos:" -ForegroundColor Yellow
    Write-Host "   - repo (todos)" -ForegroundColor Gray
    Write-Host "4. Copie el token generado" -ForegroundColor Yellow
    Write-Host "5. Ejecute nuevamente:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
    Write-Host "6. Use el token como contraseña cuando se le solicite" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O clone usando SSH si tiene configuradas las claves:" -ForegroundColor White
    Write-Host "  git remote set-url origin git@github.com:AaronC17/Automatizarcm.git" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Error específico:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Read-Host "Presione Enter para finalizar"
