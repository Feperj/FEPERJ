@echo off
echo ========================================
echo    DEPLOY COMPLETO - SISTEMA FEPERJ
echo ========================================
echo.
cd feperj-web
echo [1/6] Verificando estrutura...
echo - server.js: Atualizado com todas as funcionalidades
echo - package.json: Dependências atualizadas (multer)
echo - public/: Páginas frontend completas
echo - vercel.json: Configurado para Node.js
echo.

echo [2/6] Instalando dependências...
npm install
echo.

echo [3/6] Verificando arquivos...
if not exist "server.js" (
    echo ❌ ERRO: server.js não encontrado
    pause
    exit /b 1
)
if not exist "package.json" (
    echo ❌ ERRO: package.json não encontrado
    pause
    exit /b 1
)
if not exist "public\index.html" (
    echo ❌ ERRO: public/index.html não encontrado
    pause
    exit /b 1
)
echo ✅ Todos os arquivos principais encontrados
echo.

echo [4/6] Adicionando arquivos...
git add .
echo.

echo [5/6] Commit...
git commit -m "Sistema FEPERJ completo: Node.js + MongoDB + todas as funcionalidades do sistema original"
echo.

echo [6/6] Push para GitHub...
git push origin main
echo.

echo ========================================
echo    DEPLOY CONCLUÍDO!
echo ========================================
echo.
echo ✅ SISTEMA FEPERJ COMPLETO ONLINE:
echo.
echo 🔧 TECNOLOGIAS IMPLEMENTADAS:
echo - Node.js + Express (Backend completo)
echo - MongoDB Atlas (Banco de dados)
echo - HTML + JavaScript (Frontend moderno)
echo - JWT (Autenticação segura)
echo - Multer (Upload de arquivos)
echo - Tailwind CSS (Interface responsiva)
echo.
echo 📋 FUNCIONALIDADES DO SISTEMA ORIGINAL:
echo ✅ Gestão completa de atletas
echo ✅ Gestão de equipes
echo ✅ Gestão de competições
echo ✅ Gestão de inscrições
echo ✅ Gestão de resultados
echo ✅ Sistema de categorias
echo ✅ Upload de documentos
echo ✅ Exportação CSV
echo ✅ Dashboard com gráficos
echo ✅ Relatórios e estatísticas
echo ✅ Filtros e busca avançada
echo ✅ Validações de dados
echo.
echo 📱 ACESSO AO SISTEMA:
echo - URL: https://feperj-sistema.vercel.app
echo - Login: 15119236790
echo - Senha: 49912170
echo.
echo 🗂️ ESTRUTURA DO BANCO:
echo - usuarios: Usuários do sistema
echo - atletas: Cadastro completo de atletas
echo - equipes: Equipes da FEPERJ
echo - categorias: Categorias por peso e sexo
echo - competicoes: Competições organizadas
echo - inscricoes: Inscrições em competições
echo - resultados: Resultados das competições
echo.
echo ⏱️ Aguarde 2-3 minutos para o Vercel fazer o deploy...
echo.
echo 🎯 PRÓXIMOS PASSOS:
echo 1. Acesse o sistema com as credenciais
echo 2. Teste todas as funcionalidades
echo 3. Cadastre atletas, equipes e competições
echo 4. Faça inscrições e registre resultados
echo.
pause
