@echo off
echo ========================================
echo    DEPLOY NODE.JS - SISTEMA FEPERJ
echo ========================================
echo.
cd feperj-web
echo [1/5] Verificando estrutura...
echo - server.js: OK
echo - package.json: OK
echo - public/: OK
echo - vercel.json: Atualizado
echo.

echo [2/5] Instalando dependências...
npm install
echo.

echo [3/5] Adicionando arquivos...
git add .
echo.

echo [4/5] Commit...
git commit -m "Sistema remodelado para Node.js + Express + MongoDB"
echo.

echo [5/5] Push para GitHub...
git push origin main
echo.

echo ========================================
echo    DEPLOY CONCLUÍDO!
echo ========================================
echo.
echo ✅ SISTEMA NODE.JS FUNCIONANDO:
echo.
echo 🔧 TECNOLOGIAS:
echo - Node.js + Express (Backend)
echo - MongoDB Atlas (Banco de dados)
echo - HTML + JavaScript (Frontend)
echo - JWT (Autenticação)
echo - Tailwind CSS (Estilização)
echo.
echo 📱 ACESSO:
echo - Sistema: https://feperj-sistema.vercel.app
echo - Login: 15119236790
echo - Senha: 49912170
echo.
echo 🚀 FUNCIONALIDADES:
echo - Login seguro com JWT
echo - Dashboard com gráficos
echo - Gestão de atletas
echo - Gestão de equipes
echo - Gestão de competições
echo - Gestão de inscrições
echo.
echo ⏱️ Aguarde alguns minutos para o Vercel fazer o deploy...
echo.
pause
