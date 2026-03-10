@echo off
echo ============================================================
echo   SUBIR PROYECTO A GITHUB
echo ============================================================
echo.

REM Verificar si Git esta instalado
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git no esta instalado
    echo.
    echo Instale Git desde: https://git-scm.com/download/win
    echo Luego ejecute este archivo nuevamente
    pause
    exit /b 1
)

echo [1/7] Inicializando repositorio...
git init

echo.
echo [2/7] Configurando Git...
git config user.name "Aaron Chinchilla"
git config user.email "aaron@example.com"

echo.
echo [3/7] Agregando archivos...
git add .

echo.
echo [4/7] Creando commit...
git commit -m "Initial commit: Automatizador de Matricula v1.0"

echo.
echo [5/7] Configurando rama principal...
git branch -M main

echo.
echo [6/7] Agregando repositorio remoto...
git remote add origin https://github.com/AaronC17/Automatizarcm.git

echo.
echo [7/7] Subiendo a GitHub...
echo.
echo IMPORTANTE: Cuando se solicite:
echo   - Username: AaronC17
echo   - Password: [Use un Personal Access Token de GitHub]
echo.
echo Para obtener el token: https://github.com/settings/tokens
echo.
pause

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   EXITO! Proyecto subido a GitHub
    echo ============================================================
    echo.
    echo Ver en: https://github.com/AaronC17/Automatizarcm
    echo.
) else (
    echo.
    echo ============================================================
    echo   Error al subir. Posibles soluciones:
    echo ============================================================
    echo.
    echo 1. Verifique su autenticacion con GitHub
    echo 2. Use un Personal Access Token en lugar de contrasena
    echo 3. O use GitHub Desktop: https://desktop.github.com/
    echo.
)

pause
