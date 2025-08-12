# Sistema FEPERJ - Versão Web

Sistema de gestão para a Federação de Powerlifting do Estado do Rio de Janeiro (FEPERJ) desenvolvido em HTML, JavaScript e FastAPI.

## 🚀 Funcionalidades

- **Gestão de Atletas**: Cadastro, edição, visualização e exclusão de atletas
- **Gestão de Equipes**: Criação e gerenciamento de equipes
- **Gestão de Competições**: Organização de competições com períodos de inscrição
- **Gestão de Inscrições**: Controle de inscrições em competições
- **Dashboard**: Relatórios e estatísticas em tempo real
- **Autenticação**: Sistema de login seguro com JWT
- **Relatórios**: Exportação de dados em CSV
- **Interface Responsiva**: Funciona em desktop e mobile

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework Python para API REST
- **MongoDB**: Banco de dados NoSQL
- **PyMongo**: Driver Python para MongoDB
- **Pydantic**: Validação de dados
- **JWT**: Autenticação segura
- **Passlib**: Hash de senhas

### Frontend
- **HTML5**: Estrutura da aplicação
- **JavaScript (Vanilla)**: Lógica da aplicação
- **Tailwind CSS**: Framework CSS para estilização
- **Chart.js**: Gráficos e visualizações
- **Font Awesome**: Ícones

## 📋 Pré-requisitos

- Python 3.8+
- Node.js (opcional, para desenvolvimento)
- MongoDB Atlas (já configurado)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd feperj-web
```

### 2. Configure o ambiente Python
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure as variáveis de ambiente
As variáveis já estão configuradas no `vercel.json`, mas você pode criar um arquivo `.env` para desenvolvimento local:

```env
MONGO_URI=mongodb+srv://jamarestudo:49912170Lacrimosa1!@familiajamar.wu9knb3.mongodb.net/?retryWrites=true&w=majority&appName=Familiajamar
DATABASE_NAME=project0
SECRET_KEY=7qt1DUw9b4p4zKCC
```

### 4. Execute o servidor de desenvolvimento
```bash
cd backend
python main.py
```

O servidor estará disponível em `http://localhost:8000`

## 🌐 Deploy no Vercel

### 1. Instale o Vercel CLI
```bash
npm install -g vercel
```

### 2. Faça login no Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Configure as variáveis de ambiente no Vercel
```bash
vercel env add MONGO_URI
vercel env add DATABASE_NAME
vercel env add SECRET_KEY
```

## 👤 Usuário Padrão

O sistema cria automaticamente um usuário administrador:

- **Usuário**: `15119236790`
- **Senha**: `49912170`

**⚠️ IMPORTANTE**: Este é o usuário administrador fixo do sistema!

## 📁 Estrutura do Projeto

```
feperj-web/
├── backend/
│   ├── main.py              # API FastAPI principal
│   └── requirements.txt     # Dependências Python
├── frontend/
│   ├── index.html          # Página principal
│   ├── css/
│   │   └── style.css       # Estilos personalizados
│   └── js/
│       ├── app.js          # JavaScript principal
│       ├── auth.js         # Autenticação
│       ├── atletas.js      # Gestão de atletas
│       ├── equipes.js      # Gestão de equipes
│       ├── competicoes.js  # Gestão de competições
│       ├── inscricoes.js   # Gestão de inscrições
│       └── dashboard.js    # Dashboard e relatórios
├── vercel.json             # Configuração do Vercel
└── README.md               # Este arquivo
```

## 🔐 Segurança

- Autenticação JWT com expiração de 30 minutos
- Senhas criptografadas com bcrypt
- Validação de dados com Pydantic
- CORS configurado para segurança
- Verificação de permissões por nível de acesso

## 📊 Níveis de Acesso

- **Admin**: Acesso total ao sistema
- **Coordenador**: Pode gerenciar atletas, equipes e inscrições
- **Usuário**: Pode visualizar dados e criar inscrições

## 🔄 API Endpoints

### Autenticação
- `POST /login` - Login de usuário
- `POST /usuarios` - Criar usuário

### Atletas
- `GET /atletas` - Listar atletas
- `POST /atletas` - Criar atleta
- `PUT /atletas/{id}` - Atualizar atleta
- `DELETE /atletas/{id}` - Excluir atleta

### Equipes
- `GET /equipes` - Listar equipes
- `POST /equipes` - Criar equipe
- `PUT /equipes/{id}` - Atualizar equipe
- `DELETE /equipes/{id}` - Excluir equipe

### Competições
- `GET /competicoes` - Listar competições
- `POST /competicoes` - Criar competição
- `PUT /competicoes/{id}` - Atualizar competição
- `DELETE /competicoes/{id}` - Excluir competição

### Inscrições
- `GET /inscricoes` - Listar inscrições
- `POST /inscricoes` - Criar inscrição
- `DELETE /inscricoes/{id}` - Cancelar inscrição

### Relatórios
- `GET /relatorios/dashboard` - Dados do dashboard

## 🐛 Solução de Problemas

### Erro de conexão com MongoDB
- Verifique se a URI do MongoDB está correta
- Confirme se o IP está liberado no MongoDB Atlas
- Verifique se as credenciais estão corretas

### Erro de CORS
- O CORS está configurado para aceitar todas as origens em desenvolvimento
- Para produção, configure as origens permitidas

### Erro de autenticação
- Verifique se o token JWT está sendo enviado corretamente
- Confirme se o token não expirou
- Verifique se o usuário existe no banco de dados

## 📝 Logs

O sistema registra logs de todas as operações importantes. Os logs incluem:
- Login/logout de usuários
- Criação, edição e exclusão de registros
- Erros do sistema
- Acessos não autorizados

## 🔄 Backup

Para fazer backup dos dados:
1. Acesse o MongoDB Atlas
2. Vá para "Database" > "Browse Collections"
3. Selecione as coleções desejadas
4. Clique em "Export" para baixar os dados

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

## 📄 Licença

Este projeto é desenvolvido para a FEPERJ. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para a Federação de Powerlifting do Estado do Rio de Janeiro**
