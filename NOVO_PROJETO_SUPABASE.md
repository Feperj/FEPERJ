# 🚀 Criar Novo Projeto Supabase - Sistema FEPERJ

## 📋 **Passo a Passo:**

### 1. **Criar Novo Projeto:**
1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Clique em **"New Project"**
4. **Nome do projeto:** `feperj-web-novo`
5. **Senha do banco:** Escolha uma senha forte
6. **Região:** South America - São Paulo
7. Clique em **"Create new project"**

### 2. **Aguardar Criação:**
- Aguarde 2-3 minutos para o projeto ser criado
- Anote a **URL** e **chave anônima** que aparecerão

### 3. **Executar Schema:**
1. No painel, vá para **"SQL Editor"**
2. Clique em **"New Query"**
3. Cole o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **"Run"**

### 4. **Configurar .env:**
Substitua as credenciais no arquivo `.env`:
```env
SUPABASE_URL=https://SEU-NOVO-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-nova-chave-anonima
```

### 5. **Testar:**
```bash
node server.js
```

**Você deve ver:**
```
✅ Conectado ao Supabase com sucesso
✅ Usuário admin criado com sucesso
✅ Dados de exemplo criados com sucesso
```

## 🔑 **Credenciais Padrão:**
- **Login:** 15119236790
- **Senha:** 49912170
