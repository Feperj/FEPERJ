# Sistema FEPERJ - Federação de Powerlifting do Estado do Rio de Janeiro

Sistema web completo para gestão de atletas, equipes, competições e inscrições da FEPERJ.

## 🚀 Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: Supabase
- **Frontend**: HTML + JavaScript (Vanilla)
- **Autenticação**: JWT (JSON Web Tokens)
- **Estilização**: Tailwind CSS
- **Gráficos**: Chart.js
- **Deploy**: Vercel

## 📋 Funcionalidades

### 🔐 Autenticação
- Login seguro com JWT
- Sessão persistente (24 horas)
- Logout automático

### 📊 Dashboard
- Estatísticas em tempo real
- Gráficos interativos
- Visão geral do sistema

### 👥 Gestão de Atletas
- Cadastro completo de atletas
- Busca e filtros
- Edição e exclusão
- Geração automática de matrícula

### 🛡️ Gestão de Equipes
- Cadastro de equipes
- Contagem de atletas por equipe
- Informações de contato

### 🏆 Gestão de Competições
- Cadastro de competições
- Controle de inscrições
- Status de competições

### 📝 Gestão de Inscrições
- Inscrição de atletas em competições
- Controle de categorias
- Relatórios de inscrições

## 🔧 Instalação Local

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/RJSeERMJ/Sistema-FEPERJ-vers-o-Web.git
cd Sistema-FEPERJ-vers-o-Web
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
MONGODB_URI=mongodb+srv://jamarestudo:49912170Lacrimosa1!@familiajamar.wu9knb3.mongodb.net/?retryWrites=true&w=majority&appName=Familiajamar
DB_NAME=project0
JWT_SECRET=7qt1DUw9b4p4zKCC
PORT=3000
```

4. **Execute o servidor**
```bash
npm start
```

5. **Acesse o sistema**
Abra o navegador e acesse: `http://localhost:3000`

## 📱 Acesso Online

- **URL**: https://feperj-sistema.vercel.app
- **Login**: 15119236790
- **Senha**: 49912170

## 🗂️ Estrutura do Projeto

```
feperj-web/
├── server.js              # Servidor Express
├── package.json           # Dependências Node.js
├── vercel.json           # Configuração Vercel
├── public/               # Arquivos frontend
│   ├── index.html        # Página inicial
│   ├── login.html        # Página de login
│   ├── dashboard.html    # Dashboard
│   ├── atletas.html      # Gestão de atletas
│   ├── equipes.html      # Gestão de equipes
│   ├── competicoes.html  # Gestão de competições
│   ├── inscricoes.html   # Gestão de inscrições
│   ├── favicon.svg       # Ícone do sistema
│   └── js/               # Scripts JavaScript
└── README.md             # Documentação
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/login` - Login do usuário
- `GET /api/verificar-token` - Verificar token JWT

### Atletas
- `GET /api/atletas` - Listar atletas
- `POST /api/atletas` - Criar atleta
- `PUT /api/atletas/:id` - Atualizar atleta
- `DELETE /api/atletas/:id` - Excluir atleta

### Equipes
- `GET /api/equipes` - Listar equipes
- `POST /api/equipes` - Criar equipe
- `PUT /api/equipes/:id` - Atualizar equipe
- `DELETE /api/equipes/:id` - Excluir equipe

### Competições
- `GET /api/competicoes` - Listar competições
- `POST /api/competicoes` - Criar competição
- `PUT /api/competicoes/:id` - Atualizar competição
- `DELETE /api/competicoes/:id` - Excluir competição

### Inscrições
- `GET /api/inscricoes` - Listar inscrições
- `POST /api/inscricoes` - Criar inscrição
- `PUT /api/inscricoes/:id` - Atualizar inscrição
- `DELETE /api/inscricoes/:id` - Excluir inscrição

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

### Health Check
- `GET /api/health` - Status da API

## 🚀 Deploy

### Deploy Automático (Recomendado)
Execute o script de deploy:
```bash
deploy_nodejs.bat
```

### Deploy Manual
1. Faça commit das alterações
2. Push para o GitHub
3. O Vercel fará o deploy automaticamente

## 🔒 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Validação de dados
- CORS configurado
- Headers de segurança

## 📊 Banco de Dados

### Coleções MongoDB
- `usuarios` - Usuários do sistema
- `atletas` - Cadastro de atletas
- `equipes` - Cadastro de equipes
- `competicoes` - Cadastro de competições
- `inscricoes` - Inscrições em competições

## 🛠️ Desenvolvimento

### Scripts Disponíveis
- `npm start` - Iniciar servidor de produção
- `npm run dev` - Iniciar servidor de desenvolvimento (nodemon)

### Logs
O sistema registra logs detalhados no console:
- Conexão com MongoDB
- Operações de CRUD
- Erros e exceções
- Autenticação

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: admin@feperj.com
- Sistema: https://feperj-sistema.vercel.app

## 📄 Licença

Este projeto é desenvolvido para a FEPERJ - Federação de Powerlifting do Estado do Rio de Janeiro.

---

**FEPERJ** - Federação de Powerlifting do Estado do Rio de Janeiro  
**Sistema de Gestão** - Versão Web
