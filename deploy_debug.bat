@echo off
echo ========================================
echo    DEPLOY DEBUG - SISTEMA FEPERJ
echo ========================================
echo.

cd feperj-web

echo [1/4] Adicionando arquivos...
git add .

echo.
echo [2/4] Status dos arquivos...
git status --porcelain

echo.
echo [3/4] Commit...
git commit -m "Debug login: adicionando logs e pagina de debug"

echo.
echo [4/4] Push para GitHub...
git push origin main

echo.
echo ========================================
echo    DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Paginas de teste:
echo - Debug: https://sistema-feperj-vers-o-idfvfpsyk-rjseermjs-projects.vercel.app/debug
echo - Teste: https://sistema-feperj-vers-o-idfvfpsyk-rjseermjs-projects.vercel.app/teste
echo.
echo Credenciais:
echo - Usuario: 15119236790
echo - Senha: 49912170
echo.
pause
