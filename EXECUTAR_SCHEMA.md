# 🗄️ Executar Schema SQL no Supabase

## ✅ **Status Atual:**
- ✅ Credenciais configuradas
- ✅ Conexão estabelecida
- ❌ **Schema SQL não executado** (tabelas não existem)

## 🚀 **Próximos Passos:**

### 1. **Acessar o Supabase:**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Abra o projeto: **bzzlbnuqcwuzrxwtgtbg**

### 2. **Executar o Schema:**
1. No painel do Supabase, clique em **"SQL Editor"** (ícone `</>`)
2. Clique em **"New Query"**
3. **Copie TODO o conteúdo** do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (botão verde)
6. Aguarde a execução completa

### 3. **Verificar Tabelas Criadas:**
No painel do Supabase:
1. Vá para **"Table Editor"**
2. Verifique se as seguintes tabelas foram criadas:
   - ✅ usuarios
   - ✅ equipes
   - ✅ categorias
   - ✅ atletas
   - ✅ competicoes
   - ✅ inscricoes_competicao
   - ✅ log_atividades
   - ✅ anuidades
   - ✅ pagamentos_anuidade
   - ✅ documentos_contabeis
   - ✅ anuidades_equipe
   - ✅ configuracoes

### 4. **Testar o Sistema:**
Após executar o schema, teste o servidor:
```bash
node server.js
```

**Você deve ver:**
```
✅ Conectado ao Supabase com sucesso
✅ Usuário admin criado com sucesso
✅ Dados de exemplo criados com sucesso
```

## 🔧 **Se Houver Erros:**

### Erro: "relation does not exist"
- O schema não foi executado completamente
- Execute novamente o arquivo `supabase-schema.sql`

### Erro: "permission denied"
- Verifique se está usando a conta correta
- Confirme se o projeto está ativo

### Erro: "syntax error"
- Verifique se copiou o arquivo completo
- Execute o schema em partes se necessário

## 📞 **Precisa de Ajuda?**
Se encontrar problemas:
1. Verifique os logs no painel do Supabase
2. Teste a conexão: `node -e "const { testSupabaseConnection } = require('./config/supabase'); testSupabaseConnection();"`
3. Confirme se todas as tabelas foram criadas

**Após executar o schema, o sistema estará 100% funcional!** 🎉
