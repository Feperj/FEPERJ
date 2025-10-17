# 🔧 CORRIGIR PERMISSÕES NO SUPABASE

## ❌ **Problema:**
```
Erro ao conectar ao Supabase: permission denied for table usuarios
```

## 🎯 **Causa:**
O Supabase tem **Row Level Security (RLS)** habilitado por padrão, bloqueando o acesso às tabelas.

## 🚀 **SOLUÇÃO:**

### 1. **Acessar Supabase:**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login
3. Abra o projeto: **bzzlbnuqcwuzrxwtgtbg**

### 2. **Executar Script de Permissões:**
1. No painel, clique em **"SQL Editor"** (ícone `</>`)
2. Clique em **"New Query"**
3. **Copie TODO o conteúdo** do arquivo `corrigir-permissoes.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (botão verde)
6. **Aguarde a execução completa**

### 3. **Verificar Resultado:**
Você deve ver:
```
✅ Permissões configuradas com sucesso!
```

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

## 🔧 **O que o script faz:**
- Desabilita Row Level Security
- Concede permissões completas para `anon`, `authenticated` e `service_role`
- Permite operações CRUD em todas as tabelas
- Configura permissões de sequências

## 🎯 **Resultado:**
Após executar o script, o sistema funcionará 100%!

**Execute o script de permissões agora!** 🚀
