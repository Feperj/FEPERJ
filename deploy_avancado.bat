@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    DEPLOY AVANÇADO - SISTEMA FEPERJ
echo ========================================
echo.

:: Cores para output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

:: Verificar se estamos no diretório correto
if not exist "backend\main.py" (
    echo %RED%ERRO: Execute este script dentro da pasta feperj-web%RESET%
    echo.
    pause
    exit /b 1
)

:: Verificar se Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERRO: Git não está instalado ou não está no PATH%RESET%
    echo.
    pause
    exit /b 1
)

:: Verificar se o repositório está configurado
git remote -v >nul 2>&1
if errorlevel 1 (
    echo %RED%ERRO: Repositório Git não configurado%RESET%
    echo.
    pause
    exit /b 1
)

echo %BLUE%[1/6] Verificando status do Git...%RESET%
git status

echo.
echo %BLUE%[2/6] Verificando se há alterações para commitar...%RESET%
git diff --quiet
if errorlevel 1 (
    echo %YELLOW%Alterações detectadas!%RESET%
) else (
    echo %GREEN%Nenhuma alteração detectada.%RESET%
    echo.
    set /p continuar="Deseja continuar mesmo assim? (s/n): "
    if /i not "!continuar!"=="s" (
        echo Deploy cancelado.
        pause
        exit /b 0
    )
)

echo.
echo %BLUE%[3/6] Adicionando todos os arquivos...%RESET%
git add .
if errorlevel 1 (
    echo %RED%ERRO ao adicionar arquivos%RESET%
    pause
    exit /b 1
)

echo.
echo %BLUE%[4/6] Verificando arquivos que serão commitados...%RESET%
git status --porcelain

echo.
echo %BLUE%[5/6] Fazendo commit das alterações...%RESET%
set /p commit_msg="Digite a mensagem do commit (ou pressione Enter para usar 'Atualização automática'): "
if "%commit_msg%"=="" set commit_msg=Atualização automática

git commit -m "%commit_msg%"
if errorlevel 1 (
    echo %RED%ERRO ao fazer commit%RESET%
    pause
    exit /b 1
)

echo.
echo %BLUE%[6/6] Enviando para o GitHub...%RESET%
git push origin main
if errorlevel 1 (
    echo %RED%ERRO ao enviar para o GitHub%RESET%
    echo.
    echo Possíveis soluções:
    echo 1. Verifique sua conexão com a internet
    echo 2. Verifique suas credenciais do GitHub
    echo 3. Execute: git pull origin main
    echo.
    pause
    exit /b 1
)

echo.
echo %GREEN%========================================
echo    DEPLOY CONCLUÍDO COM SUCESSO!
echo ========================================%RESET%
echo.
echo %YELLOW%O sistema será atualizado automaticamente no Vercel
echo em alguns minutos.%RESET%
echo.
echo %BLUE%URL do sistema: https://sistema-feperj-vers-o-web.vercel.app/%RESET%
echo.
echo %GREEN%Para verificar o status do deploy:%RESET%
echo 1. Acesse: https://vercel.com/dashboard
echo 2. Clique no projeto "sistema-feperj-vers-o-web"
echo 3. Verifique os logs de deploy
echo.
pause
