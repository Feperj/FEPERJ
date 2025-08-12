@echo off
echo ========================================
echo    DEPLOY RAPIDO - SISTEMA FEPERJ
echo ========================================
echo.

cd feperj-web

echo [1/3] Adicionando arquivos...
git add .

echo.
echo [2/3] Commit...
git commit -m "Correcao admin fixo: 15119236790/49912170"

echo.
echo [3/3] Push para GitHub...
git push origin main

echo.
echo ========================================
echo    DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Credenciais:
echo - Usuario: 15119236790
echo - Senha: 49912170
echo.
echo URL: https://sistema-feperj-vers-o-web.vercel.app/
echo.
pause
