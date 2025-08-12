@echo off
echo ========================================
echo    CONFIGURAÇÃO INICIAL DO GIT
echo ========================================
echo.

:: Verificar se estamos no diretório correto
if not exist "backend\main.py" (
    echo ERRO: Execute este script dentro da pasta feperj-web
    echo.
    pause
    exit /b 1
)

:: Verificar se Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Git não está instalado ou não está no PATH
    echo.
    echo Para instalar o Git:
    echo 1. Acesse: https://git-scm.com/download/win
    echo 2. Baixe e instale o Git para Windows
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo [1/4] Inicializando repositório Git...
git init

echo.
echo [2/4] Configurando repositório remoto...
git remote add origin https://github.com/RJSeERMJ/Sistema-FEPERJ-vers-o-Web.git

echo.
echo [3/4] Configurando branch principal...
git branch -M main

echo.
echo [4/4] Fazendo primeiro commit...
git add .
git commit -m "Configuração inicial do Sistema FEPERJ"

echo.
echo ========================================
echo    CONFIGURAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo Agora você pode usar:
echo - deploy.bat (deploy simples)
echo - deploy_avancado.bat (deploy com verificações)
echo.
echo Para fazer o primeiro push:
echo git push -u origin main
echo.
pause
