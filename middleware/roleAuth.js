// Middleware para controle de acesso baseado em roles
const jwt = require('jsonwebtoken');

// Configurações de acesso por tipo de usuário
const ACCESS_CONTROL = {
  admin: {
    allowedPages: ['dashboard', 'atletas', 'equipes', 'competicoes', 'resultados', 'financeiro'],
    allowedAPIs: ['*'], // Admin pode acessar todas as APIs
    description: 'Administrador - Acesso total ao sistema'
  },
  usuario: {
    allowedPages: ['dashboard', 'atletas', 'competicoes', 'resultados', 'financeiro'],
    allowedAPIs: ['dashboard', 'atletas', 'competicoes', 'resultados', 'financeiro', 'documentos', 'carteirinhas', 'exportacao'],
    description: 'Usuário - Acesso limitado à própria equipe'
  }
};

// Função para verificar se o usuário tem acesso à página
const verificarAcessoPagina = (userType, pageName) => {
  const userAccess = ACCESS_CONTROL[userType];
  if (!userAccess) {
    return false;
  }
  
  return userAccess.allowedPages.includes(pageName);
};

// Função para verificar se o usuário tem acesso à API
const verificarAcessoAPI = (userType, apiName) => {
  const userAccess = ACCESS_CONTROL[userType];
  if (!userAccess) {
    return false;
  }
  
  // Admin pode acessar todas as APIs
  if (userAccess.allowedAPIs.includes('*')) {
    return true;
  }
  
  return userAccess.allowedAPIs.includes(apiName);
};

// Middleware para verificar acesso à página
const verificarAcessoPaginaMiddleware = (pageName) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!verificarAcessoPagina(decoded.tipo, pageName)) {
        return res.status(403).json({
          success: false,
          message: `Acesso negado. Usuários do tipo "${decoded.tipo}" não podem acessar a página "${pageName}"`
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Erro ao verificar acesso à página:', error);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  };
};

// Middleware para verificar acesso à API
const verificarAcessoAPIMiddleware = (apiName) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!verificarAcessoAPI(decoded.tipo, apiName)) {
        return res.status(403).json({
          success: false,
          message: `Acesso negado. Usuários do tipo "${decoded.tipo}" não podem acessar a API "${apiName}"`
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Erro ao verificar acesso à API:', error);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  };
};

// Função para obter informações de acesso do usuário
const obterInformacoesAcesso = (userType) => {
  return ACCESS_CONTROL[userType] || null;
};

// Função para verificar se o usuário é admin
const verificarAdmin = (userType) => {
  return userType === 'admin';
};

// Função para verificar se o usuário é usuario
const verificarUsuario = (userType) => {
  return userType === 'usuario';
};

module.exports = {
  ACCESS_CONTROL,
  verificarAcessoPagina,
  verificarAcessoAPI,
  verificarAcessoPaginaMiddleware,
  verificarAcessoAPIMiddleware,
  obterInformacoesAcesso,
  verificarAdmin,
  verificarUsuario
};
