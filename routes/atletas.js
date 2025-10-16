const express = require('express');
const router = express.Router();
const { atletaService, equipeService, categoriaService, logService } = require('../supabaseService');
const { verificarAdmin } = require('../middleware/adminAuth');

// Função para gerar matrícula baseada no CPF e ano atual
const gerarMatricula = (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const primeirosDigitos = cpfLimpo.substring(0, 5);
  const anoAtual = new Date().getFullYear();
  return `FEPERJ - ${primeirosDigitos}${anoAtual}`;
};

// Função para validar CPF
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
};

// Middleware para verificar permissões de atleta
const verificarPermissaoAtleta = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  console.log('🔍 Verificando permissões de atleta:', {
    atletaId: id,
    userTipo: user.tipo,
    userIdEquipe: user.idEquipe
  });

  try {
    if (user.tipo === 'admin') {
      console.log('✅ Admin - permissão concedida');
      return next();
    }

    if (!user.idEquipe) {
      console.log('❌ Usuário não vinculado a equipe');
      return res.status(403).json({
        success: false,
        message: 'Usuário não está vinculado a uma equipe'
      });
    }

    // Se está editando um atleta específico, verificar se pertence à equipe
    if (id) {
      const atleta = await atletaService.getById(id);
      if (!atleta) {
        return res.status(404).json({
          success: false,
          message: 'Atleta não encontrado'
        });
      }

      if (atleta.idEquipe !== user.idEquipe) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode acessar atletas da sua equipe'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// GET /api/atletas - Listar todos os atletas
router.get('/', verificarPermissaoAtleta, async (req, res) => {
  try {
    const user = req.user;
    let atletas;

    if (user.tipo === 'admin') {
      // Admin vê todos os atletas
      atletas = await atletaService.getAll();
    } else {
      // Usuário comum vê apenas atletas da sua equipe
      const todosAtletas = await atletaService.getAll();
      atletas = todosAtletas.filter(atleta => atleta.idEquipe === user.idEquipe);
    }

    res.json({
      success: true,
      data: atletas
    });
  } catch (error) {
    console.error('Erro ao buscar atletas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar atletas',
      error: error.message
    });
  }
});

// GET /api/atletas/:id - Buscar atleta por ID
router.get('/:id', verificarPermissaoAtleta, async (req, res) => {
  try {
    const { id } = req.params;
    const atleta = await atletaService.getById(id);

    if (!atleta) {
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    res.json({
      success: true,
      data: atleta
    });
  } catch (error) {
    console.error('Erro ao buscar atleta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar atleta',
      error: error.message
    });
  }
});

// POST /api/atletas - Criar novo atleta
router.post('/', verificarPermissaoAtleta, async (req, res) => {
  try {
    const user = req.user;
    const atletaData = req.body;

    // Validar CPF
    if (!validarCPF(atletaData.cpf)) {
      return res.status(400).json({
        success: false,
        message: 'CPF inválido'
      });
    }

    // Verificar se CPF já existe
    const atletasExistentes = await atletaService.getAll();
    const cpfExistente = atletasExistentes.find(a => 
      a.cpf.replace(/\D/g, '') === atletaData.cpf.replace(/\D/g, '') && 
      a.id !== atletaData.id
    );

    if (cpfExistente) {
      return res.status(400).json({
        success: false,
        message: 'CPF já está cadastrado para outro atleta'
      });
    }

    // Gerar matrícula se não fornecida
    if (!atletaData.matricula) {
      atletaData.matricula = gerarMatricula(atletaData.cpf);
    }

    // Forçar equipe do usuário se não for admin
    if (user.tipo !== 'admin' && user.idEquipe) {
      atletaData.idEquipe = user.idEquipe;
    }

    // Preparar dados para inserção
    const novoAtleta = {
      ...atletaData,
      dataNascimento: atletaData.dataNascimento ? new Date(atletaData.dataNascimento) : null,
      dataFiliacao: new Date(atletaData.dataFiliacao),
      maiorTotal: atletaData.maiorTotal ? parseFloat(atletaData.maiorTotal) : null,
      status: atletaData.status || 'ATIVO'
    };

    const atleta = await atletaService.create(novoAtleta);

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Cadastrou atleta',
      detalhes: `Cadastrou novo atleta: ${atletaData.nome}`,
      tipoUsuario: user.tipo
    });

    res.status(201).json({
      success: true,
      message: 'Atleta cadastrado com sucesso!',
      data: atleta
    });
  } catch (error) {
    console.error('Erro ao criar atleta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar atleta',
      error: error.message
    });
  }
});

// PUT /api/atletas/:id - Atualizar atleta
router.put('/:id', verificarPermissaoAtleta, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const atletaData = req.body;

    // Verificar se atleta existe
    const atletaExistente = await atletaService.getById(id);
    if (!atletaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    // Validar CPF se foi alterado
    if (atletaData.cpf && atletaData.cpf !== atletaExistente.cpf) {
      if (!validarCPF(atletaData.cpf)) {
        return res.status(400).json({
          success: false,
          message: 'CPF inválido'
        });
      }

      // Verificar se novo CPF já existe
      const atletasExistentes = await atletaService.getAll();
      const cpfExistente = atletasExistentes.find(a => 
        a.cpf.replace(/\D/g, '') === atletaData.cpf.replace(/\D/g, '') && 
        a.id !== id
      );

      if (cpfExistente) {
        return res.status(400).json({
          success: false,
          message: 'CPF já está cadastrado para outro atleta'
        });
      }
    }

    // Verificar permissões para alterar status
    if (user.tipo !== 'admin' && atletaData.status !== atletaExistente.status) {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem alterar o status do atleta'
      });
    }

    // Preparar dados para atualização
    const dadosAtualizacao = {
      ...atletaData,
      dataNascimento: atletaData.dataNascimento ? new Date(atletaData.dataNascimento) : null,
      dataFiliacao: atletaData.dataFiliacao ? new Date(atletaData.dataFiliacao) : null,
      maiorTotal: atletaData.maiorTotal ? parseFloat(atletaData.maiorTotal) : null
    };

    const atleta = await atletaService.update(id, dadosAtualizacao);

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Atualizou atleta',
      detalhes: `Atualizou dados do atleta ${atletaData.nome}`,
      tipoUsuario: user.tipo
    });

    res.json({
      success: true,
      message: 'Atleta atualizado com sucesso!',
      data: atleta
    });
  } catch (error) {
    console.error('Erro ao atualizar atleta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar atleta',
      error: error.message
    });
  }
});

// DELETE /api/atletas/:id - Excluir atleta (apenas admin)
router.delete('/:id', verificarPermissaoAtleta, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Verificar se atleta existe
    const atleta = await atletaService.getById(id);
    if (!atleta) {
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    await atletaService.delete(id);

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Excluiu atleta',
      detalhes: `Excluiu atleta: ${atleta.nome}`,
      tipoUsuario: user.tipo
    });

    res.json({
      success: true,
      message: 'Atleta excluído com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao excluir atleta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir atleta',
      error: error.message
    });
  }
});

// POST /api/atletas/validate-cpf - Validar CPF em tempo real
router.post('/validate-cpf', async (req, res) => {
  try {
    const { cpf, atletaId } = req.body;

    if (!cpf) {
      return res.status(400).json({
        success: false,
        message: 'CPF é obrigatório'
      });
    }

    // Validar formato do CPF
    if (!validarCPF(cpf)) {
      return res.json({
        success: true,
        isValid: false,
        message: 'CPF inválido'
      });
    }

    // Verificar se CPF já existe (exceto se for o próprio atleta sendo editado)
    const atletasExistentes = await atletaService.getAll();
    const cpfExistente = atletasExistentes.find(a => 
      a.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '') && 
      a.id !== atletaId
    );

    if (cpfExistente) {
      return res.json({
        success: true,
        isValid: false,
        message: 'CPF já está cadastrado para outro atleta'
      });
    }

    res.json({
      success: true,
      isValid: true,
      message: 'CPF válido'
    });
  } catch (error) {
    console.error('Erro ao validar CPF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar CPF',
      error: error.message
    });
  }
});

module.exports = router;
