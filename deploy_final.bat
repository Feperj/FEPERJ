@echo off
echo ========================================
echo    DEPLOY FINAL - SISTEMA FEPERJ
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
git commit -m "Correcao sistema: pagina de teste simplificada e logs detalhados"

echo.
echo [4/4] Push para GitHub...
git push origin main

echo.
echo ========================================
echo    DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Paginas de teste:
echo - Sistema Simplificado: https://sistema-feperj-vers-o-idfvfpsyk-rjseermjs-projects.vercel.app/sistema
echo - Debug Login: https://sistema-feperj-vers-o-idfvfpsyk-rjseermjs-projects.vercel.app/debug
echo - Teste API: https://sistema-feperj-vers-o-idfvfpsyk-rjseermjs-projects.vercel.app/teste
echo.
echo Credenciais:
echo - Usuario: 15119236790
echo - Senha: 49912170
echo.
echo INSTRUCOES:
echo 1. Teste primeiro a pagina /sistema (sistema simplificado)
echo 2. Se funcionar, o problema esta no sistema principal
echo 3. Se nao funcionar, teste a pagina /debug para diagnosticar
echo.
pause
