# 🏋️‍♂️ FEPERJ - Sistema de Gestão de Powerlifting

Sistema completo de gestão para a Federação de Powerlifting do Estado do Rio de Janeiro (FEPERJ), desenvolvido como uma aplicação web tradicional com páginas HTML estáticas e backend Node.js.

## 🚀 **Arquitetura do Sistema**

### **Frontend**
- **HTML5** - Páginas estáticas
- **JavaScript (Vanilla)** - Lógica do frontend
- **Tailwind CSS** - Framework CSS utilitário
- **Chart.js** - Gráficos e visualizações
- **Font Awesome** - Ícones

### **Backend (API)**
- **Node.js** com Express.js
- **Supabase** como banco de dados
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **PDF-lib** para geração de carteirinhas

## 📁 **Estrutura do Projeto**

```
feperj-web/
├── 📁 public/                 # Páginas HTML estáticas
│   ├── login.html            # Página de login
│   ├── dashboard.html        # Dashboard principal
│   ├── atletas.html          # Gestão de atletas
│   ├── atleta-detalhes.html  # Detalhes do atleta
│   ├── equipes.html          # Gestão de equipes
│   ├── competicoes.html      # Gestão de competições
│   ├── resultados.html       # Visualização de resultados
│   ├── financeiro.html       # Módulo financeiro
│   └── favicon.svg           # Ícone do sistema
├── 📁 routes/               # APIs modulares
│   ├── atletas.js          # API de atletas
│   ├── equipes.js          # API de equipes
│   ├── documentos.js       # API de documentos
│   ├── carteirinhas.js     # API de carteirinhas
│   └── exportacao.js       # API de exportação
├── 📁 middleware/           # Middlewares de autenticação
├── 📁 services/            # Serviços auxiliares
├── 📁 config/              # Configurações
├── server.js               # Servidor principal
└── supabaseService.js      # Serviços do Supabase
```

## 🛠️ **Instalação e Configuração**

### **Pré-requisitos**
- Node.js 16+
- NPM ou Yarn
- Conta no Supabase

### **1. Instalação das Dependências**
```bash
npm install
```

### **2. Configuração do Ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_KEY=sua_chave_de_servico_do_supabase
JWT_SECRET=seu_jwt_secret_aqui
```

### **3. Configuração do Supabase**
Execute o script de configuração:
```bash
node supabase.js
```

## 🚀 **Executando o Sistema**

### **Desenvolvimento**
```bash
npm run dev
```

### **Produção**
```bash
npm start
```

## 🌐 **Acessos**

- **Sistema Web**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Login Admin**: `15119236790` / `49912170`

## 👥 **Tipos de Usuário**

### **Administrador (`admin`)**
- Acesso completo a todas as funcionalidades
- Gestão de equipes, atletas e competições
- Relatórios e exportações
- Configurações do sistema

### **Usuário (`usuario`)**
- Acesso limitado aos atletas da própria equipe
- Visualização de competições e resultados
- Upload de documentos dos atletas

## 📋 **Funcionalidades Principais**

### **🏃‍♂️ Gestão de Atletas**
- Cadastro completo de atletas
- Upload de documentos (RG, CPF, foto 3x4, etc.)
- Geração automática de carteirinhas
- Exportação para Excel
- Controle de status (ATIVO/INATIVO)

### **👥 Gestão de Equipes**
- Criação e edição de equipes
- Vinculação de chefes de equipe
- Controle de anuidade
- Soft delete com preservação de dados

### **🏆 Competições**
- Cadastro de competições
- Inscrições de atletas
- Controle de resultados
- Relatórios de performance

### **📊 Dashboard**
- Estatísticas em tempo real
- Gráficos de performance
- Resumo de atividades
- Indicadores de crescimento

### **📄 Documentos**
- Upload seguro para Supabase Storage
- Geração de carteirinhas em PDF
- Visualização e download de documentos
- Controle de permissões por equipe

## 🔐 **Segurança**

- **Autenticação JWT** com expiração
- **Controle de acesso baseado em roles**
- **Validação de permissões por equipe**
- **Upload seguro de arquivos**
- **Sanitização de dados**

## 📈 **Tecnologias Utilizadas**

### **Frontend**
- HTML5
- JavaScript (Vanilla)
- Tailwind CSS
- Chart.js
- Font Awesome

### **Backend**
- Node.js
- Express.js
- Supabase
- JWT
- Multer
- PDF-lib
- XLSX

## 🚀 **Deploy**

O sistema está configurado para deploy com suporte a:
- Build automático
- Variáveis de ambiente
- Cache otimizado
- Servidor estático

## 📞 **Suporte**

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento da FEPERJ.

---

**Desenvolvido com ❤️ para a FEPERJ - Federação de Powerlifting do Estado do Rio de Janeiro**