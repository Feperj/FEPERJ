@echo off
echo ========================================
echo    DEPLOY SISTEMA FEPERJ - GITHUB
echo ========================================
echo.

:: Verificar se estamos no diretório correto
if not exist "backend\main.py" (
    echo ERRO: Execute este script dentro da pasta feperj-web
    echo.
    pause
    exit /b 1
)

echo [1/5] Verificando status do Git...
git status

echo.
echo [2/5] Adicionando todos os arquivos...
git add .

echo.
echo [3/5] Verificando arquivos que serão commitados...
git status --porcelain

echo.
echo [4/5] Fazendo commit das alterações...
set /p commit_msg="Digite a mensagem do commit (ou pressione Enter para usar 'Atualização automática'): "
if "%commit_msg%"=="" set commit_msg=Atualização automática

git commit -m "%commit_msg%"

echo.
echo [5/5] Enviando para o GitHub...
git push origin main

echo.
echo ========================================
echo    DEPLOY CONCLUÍDO!
echo ========================================
echo.
echo O sistema será atualizado automaticamente no Vercel
echo em alguns minutos.
echo.
echo URL do sistema: https://sistema-feperj-vers-o-web.vercel.app/
echo.
pause
