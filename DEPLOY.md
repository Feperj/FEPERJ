# 🚀 Guia Rápido de Deploy - Sistema FEPERJ

## Deploy no Vercel (Recomendado)

### 1. Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Conta no [GitHub](https://github.com) (opcional, mas recomendado)

### 2. Deploy Automático (Mais Fácil)

1. **Faça upload do projeto para o GitHub**
   ```bash
   git init
   git add .
   git commit -m "Sistema FEPERJ - Versão Web"
   git remote add origin https://github.com/seu-usuario/feperj-web.git
   git push -u origin main
   ```

2. **Conecte ao Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta
   - Clique em "New Project"
   - Importe o repositório do GitHub
   - Clique em "Deploy"

3. **Configure as variáveis de ambiente**
   - No painel do Vercel, vá em "Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:
     ```
     MONGO_URI=mongodb+srv://jamarestudo:49912170Lacrimosa1!@familiajamar.wu9knb3.mongodb.net/?retryWrites=true&w=majority&appName=Familiajamar
     DATABASE_NAME=project0
     SECRET_KEY=7qt1DUw9b4p4zKCC
     ```

### 3. Deploy Manual (CLI)

1. **Instale o Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Faça login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure variáveis de ambiente**
   ```bash
   vercel env add MONGO_URI
   vercel env add DATABASE_NAME
   vercel env add SECRET_KEY
   ```

## 🌐 Acesso ao Sistema

Após o deploy, você receberá uma URL como:
```
https://feperj-web.vercel.app
```

### Credenciais de Acesso
- **Usuário**: `admin`
- **Senha**: `admin123`

**⚠️ IMPORTANTE**: Altere a senha após o primeiro login!

## 🔧 Configurações Adicionais

### Domínio Personalizado
1. No painel do Vercel, vá em "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruído

### Variáveis de Ambiente
Se precisar alterar as configurações:
1. Vá em "Settings" > "Environment Variables"
2. Edite as variáveis necessárias
3. Faça um novo deploy

## 📊 Monitoramento

### Logs
- Acesse "Functions" no painel do Vercel
- Clique em uma função para ver os logs

### Analytics
- Vá em "Analytics" para ver métricas de uso
- Monitore performance e erros

## 🔄 Atualizações

### Deploy Automático
- Cada push para o GitHub fará deploy automático
- Configure branches de desenvolvimento se necessário

### Deploy Manual
```bash
vercel --prod
```

## 🐛 Solução de Problemas

### Erro de Build
- Verifique se todas as dependências estão no `requirements.txt`
- Confirme se o Python 3.8+ está sendo usado

### Erro de Conexão com MongoDB
- Verifique se a URI está correta
- Confirme se o IP está liberado no MongoDB Atlas

### Erro de CORS
- O CORS está configurado para aceitar todas as origens
- Para produção, configure origens específicas

## 📞 Suporte

- **Documentação Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Status do Vercel**: [vercel-status.com](https://vercel-status.com)
- **Comunidade**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**🎉 Parabéns! Seu sistema FEPERJ está online!**
