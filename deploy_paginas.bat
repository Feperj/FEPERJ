@echo off
echo ========================================
echo    DEPLOY PAGINAS - SISTEMA FEPERJ
echo ========================================
echo.
cd feperj-web
echo [1/3] Adicionando arquivos...
git add .
echo.
echo [2/3] Commit...
git commit -m "Adicionando paginas HTML separadas para cada modulo"
echo.
echo [3/3] Push para GitHub...
git push origin main
echo.
echo ========================================
echo    DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Paginas criadas:
echo - /auth - Pagina de login
echo - /dashboard - Dashboard principal
echo - /atletas - Gestao de atletas
echo - /equipes - Gestao de equipes
echo - /competicoes - Gestao de competicoes
echo - /inscricoes - Gestao de inscricoes
echo.
echo Credenciais:
echo - Usuario: 15119236790
echo - Senha: 49912170
echo.
echo URL: https://sistema-feperj-vers-o-web.vercel.app/
echo.
pause
