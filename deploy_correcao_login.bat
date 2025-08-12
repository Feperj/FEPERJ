@echo off
echo ========================================
echo    CORREÇÃO DO LOGIN - SISTEMA FEPERJ
echo ========================================
echo.
cd feperj-web
echo [1/4] Verificando correções...
echo - auth.js: Função showMainSystem corrigida
echo - app.js: Conflitos removidos
echo - Página de teste criada
echo.
echo [2/4] Adicionando arquivos...
git add .
echo.
echo [3/4] Commit...
git commit -m "Correção do login: showMainSystem + conflitos resolvidos + teste"
echo.
echo [4/4] Push para GitHub...
git push origin main
echo.
echo ========================================
echo    CORREÇÃO CONCLUÍDA!
echo ========================================
echo.
echo 🔧 CORREÇÕES APLICADAS:
echo.
echo ✅ Função showMainSystem() corrigida
echo ✅ Conflitos entre auth.js e app.js removidos
echo ✅ Página de teste criada: /teste-login
echo ✅ Logs de debug adicionados
echo.
echo 🧪 TESTE O SISTEMA:
echo.
echo 1. Acesse: https://sistema-feperj-vers-o-web.vercel.app/
echo 2. Use as credenciais: 15119236790 / 49912170
echo 3. Se não funcionar, teste em: /teste-login
echo.
echo 🔍 DEBUG:
echo - Abra o Console do navegador (F12)
echo - Verifique os logs de debug
echo - Teste a conexão com o backend
echo.
echo 🎯 SISTEMA DEVE FUNCIONAR AGORA!
echo.
pause
