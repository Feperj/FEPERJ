# Scripts de Deploy - Sistema FEPERJ

Este diretório contém scripts para facilitar o deploy do sistema para o GitHub e Vercel.

## 📁 Arquivos de Script

### 1. `setup_git.bat`
**Configuração inicial do repositório Git**

- Inicializa o repositório Git local
- Configura o repositório remoto no GitHub
- Faz o primeiro commit
- **Use apenas na primeira vez**

### 2. `deploy.bat`
**Deploy simples e rápido**

- Adiciona todos os arquivos
- Faz commit com mensagem personalizada
- Envia para o GitHub
- **Recomendado para uso diário**

### 3. `deploy_avancado.bat`
**Deploy com verificações completas**

- Verifica se Git está instalado
- Verifica se há alterações para commitar
- Trata erros de forma mais robusta
- Mostra informações detalhadas
- **Recomendado para situações críticas**

## 🚀 Como Usar

### Primeira Configuração

1. **Instale o Git** (se ainda não tiver):
   - Acesse: https://git-scm.com/download/win
   - Baixe e instale o Git para Windows

2. **Configure o repositório**:
   ```bash
   # Execute dentro da pasta feperj-web
   setup_git.bat
   ```

3. **Faça o primeiro push**:
   ```bash
   git push -u origin main
   ```

### Deploy Diário

1. **Deploy simples** (recomendado):
   ```bash
   deploy.bat
   ```

2. **Deploy avançado** (mais seguro):
   ```bash
   deploy_avancado.bat
   ```

## 📋 Passos do Deploy

1. **Verificação**: Confirma se está no diretório correto
2. **Status**: Mostra o status atual do Git
3. **Adição**: Adiciona todos os arquivos modificados
4. **Commit**: Cria um commit com suas alterações
5. **Push**: Envia para o GitHub
6. **Deploy**: O Vercel detecta automaticamente e faz o deploy

## 🔧 Solução de Problemas

### Erro: "Git não está instalado"
- Instale o Git: https://git-scm.com/download/win
- Reinicie o terminal após a instalação

### Erro: "Repositório não configurado"
- Execute `setup_git.bat` primeiro

### Erro: "Failed to push"
- Verifique sua conexão com a internet
- Verifique suas credenciais do GitHub
- Execute: `git pull origin main` para sincronizar

### Erro: "Credenciais inválidas"
- Configure suas credenciais do GitHub:
  ```bash
  git config --global user.name "Seu Nome"
  git config --global user.email "seu-email@exemplo.com"
  ```

## 🌐 URLs Importantes

- **Sistema Online**: https://sistema-feperj-vers-o-web.vercel.app/
- **Repositório GitHub**: https://github.com/RJSeERMJ/Sistema-FEPERJ-vers-o-Web.git
- **Dashboard Vercel**: https://vercel.com/dashboard

## 📝 Dicas

1. **Sempre teste localmente** antes do deploy
2. **Use mensagens descritivas** nos commits
3. **Verifique os logs** no Vercel após o deploy
4. **Mantenha backup** dos arquivos importantes

## 🔄 Fluxo de Trabalho Recomendado

1. Faça suas alterações no código
2. Teste localmente com `run_local.py`
3. Execute `deploy.bat` ou `deploy_avancado.bat`
4. Aguarde alguns minutos para o Vercel fazer o deploy
5. Teste o sistema online
6. Verifique os logs se houver problemas

---

**Desenvolvido para facilitar o deploy do Sistema FEPERJ** 🚀
