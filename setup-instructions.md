# 🚀 Configuração do Supabase - Sistema FEPERJ

## 📋 Passo a Passo

### 1. Criar Projeto no Supabase
- Acesse [supabase.com](https://supabase.com)
- Faça login e crie um novo projeto
- Escolha um nome: "feperj-web"
- Anote a **URL** e **chave anônima**

### 2. Executar Schema SQL
- No painel do Supabase, vá para **SQL Editor**
- Cole todo o conteúdo do arquivo `supabase-schema.sql`
- Clique em **Run** para executar
- Aguarde a criação das tabelas

### 3. Configurar Credenciais
Edite o arquivo `config.env`:
```env
SUPABASE_URL=https://seu-projeto-real.supabase.co
SUPABASE_ANON_KEY=sua-chave-real-aqui
```

### 4. Testar Configuração
```bash
node test-supabase.js
```

### 5. Iniciar Servidor
```bash
node server.js
```

## ✅ Verificações

### Tabelas Criadas:
- [ ] usuarios
- [ ] equipes  
- [ ] categorias
- [ ] atletas
- [ ] competicoes
- [ ] inscricoes_competicao
- [ ] log_atividades
- [ ] anuidades
- [ ] pagamentos_anuidade
- [ ] documentos_contabeis
- [ ] anuidades_equipe
- [ ] configuracoes

### Categorias Padrão:
- [ ] 9 categorias femininas (43kg a 84kg+)
- [ ] 9 categorias masculinas (53kg a 120kg+)

### Funcionalidades:
- [ ] Login de usuários
- [ ] CRUD de atletas
- [ ] CRUD de equipes
- [ ] CRUD de competições
- [ ] Sistema de inscrições
- [ ] Logs de atividade
- [ ] Upload de arquivos

## 🔧 Comandos Úteis

```bash
# Testar conexão
node test-supabase.js

# Iniciar servidor
node server.js

# Verificar status da API
curl http://localhost:3000/api/status
```

## 📞 Suporte

Se houver problemas:
1. Verifique se as credenciais estão corretas
2. Confirme se o schema foi executado completamente
3. Teste a conexão com `node test-supabase.js`
4. Verifique os logs do servidor
