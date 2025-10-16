// Middleware para verificar se o usuário é administrador
const verificarAdmin = (req, res, next) => {
  try {
    console.log('🔐 Verificando permissões de admin...');
    console.log('👤 Usuário:', req.user?.nome || req.user?.login);
    console.log('🏷️ Tipo:', req.user?.tipo);
    
    if (!req.user) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    if (req.user.tipo !== 'admin') {
      console.log('❌ Usuário não é admin');
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem realizar esta ação'
      });
    }
    
    console.log('✅ Usuário é admin - permissão concedida');
    next();
  } catch (error) {
    console.error('❌ Erro na verificação de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = { verificarAdmin };
