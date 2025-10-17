# 🚨 URGENTE: Executar Schema SQL no Supabase

## ❌ **Problema Atual:**
```
Erro ao conectar ao Supabase: permission denied for table usuarios
```

## ✅ **Causa:**
- Sistema migrado com sucesso ✅
- Credenciais funcionando ✅  
- **Tabelas não existem** ❌

## 🔧 **SOLUÇÃO IMEDIATA:**

### 1. **Acessar Supabase:**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login
3. Abra o projeto: **bzzlbnuqcwuzrxwtgtbg**

### 2. **Executar Schema:**
1. No painel, clique em **"SQL Editor"** (ícone `</>`)
2. Clique em **"New Query"**
3. **Copie TODO o conteúdo** do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (botão verde)
6. **Aguarde a execução completa**

### 3. **Verificar Tabelas:**
No painel Supabase:
1. Vá para **"Table Editor"**
2. Verifique se as tabelas foram criadas:
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

### 4. **Testar Sistema:**
```bash
node server.js
```

**Você deve ver:**
```
✅ Conectado ao Supabase com sucesso
✅ Configurações padrão criadas
✅ Usuário admin criado com sucesso
✅ Dados de exemplo criados com sucesso
```

## 🎯 **Resultado Esperado:**
Após executar o schema, o sistema funcionará 100%!

## 🔑 **Credenciais Padrão:**
- **Login:** 15119236790
- **Senha:** 49912170

**Execute o schema SQL agora!** 🚀
