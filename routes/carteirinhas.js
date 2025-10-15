const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { atletaService, equipeService, documentoService, logService } = require('../supabaseService');
const { supabaseAdmin } = require('../supabase');
const { obterConfiguracaoCarteirinha } = require('../config/carteirinha');
const carteirinhaService = require('../services/carteirinhaService');

// Configuração do multer para upload de modelo de carteirinha
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos para modelo de carteirinha'), false);
    }
  }
});

// Middleware para verificar permissões de carteirinha
const verificarPermissaoCarteirinha = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (user.tipo === 'admin') {
      return next();
    }

    if (!user.idEquipe) {
      return res.status(403).json({
        success: false,
        message: 'Usuário não está vinculado a uma equipe'
      });
    }

    // Verificar se o atleta pertence à equipe do usuário
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
        message: 'Você só pode gerar carteirinhas de atletas da sua equipe'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de carteirinha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};


// POST /api/carteirinhas/:id/gerar - Gerar carteirinha para atleta (versão simplificada)
router.post('/:id/gerar', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🎯 Iniciando geração de carteirinha para atleta ID:', id);

    // Validar ID do atleta
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID do atleta é obrigatório'
      });
    }

    // Buscar dados reais do atleta
    const atleta = await atletaService.getById(id);
    if (!atleta) {
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    // Buscar dados da equipe
    let equipe = { nomeEquipe: 'SEM EQUIPE', cidade: '' };
    if (atleta.idEquipe) {
      const equipeData = await equipeService.getById(atleta.idEquipe);
      if (equipeData) {
        equipe = {
          nomeEquipe: equipeData.nomeEquipe,
          cidade: equipeData.cidade || ''
        };
      }
    }

    console.log('✅ Usando dados reais do atleta:', atleta.nome);

    // Gerar PDF da carteirinha usando o serviço
    console.log('📄 Gerando PDF da carteirinha...');
    const pdfBytes = await carteirinhaService.gerarCarteirinha(atleta, equipe);

    // Criar nome do arquivo
    const nomeArquivo = `carteirinha_${carteirinhaService.limparNomeParaArquivo(atleta.nome)}_${Date.now()}.pdf`;

    console.log('✅ Carteirinha gerada com sucesso');

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    // Enviar PDF como Buffer
    res.end(pdfBytes);
  } catch (error) {
    console.error('Erro ao gerar carteirinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar carteirinha',
      error: error.message
    });
  }
});

// GET /api/carteirinhas/:id/verificar - Verificar se pode gerar carteirinha
router.get('/:id/verificar', verificarPermissaoCarteirinha, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se atleta existe
    const atleta = await atletaService.getById(id);
    if (!atleta) {
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    // Verificar documentos necessários usando Supabase Storage (bucket feperj)
    const { data: arquivos, error: listError } = await supabaseAdmin.storage
      .from('feperj')
      .list(id, {
        limit: 100,
        offset: 0
      });

    if (listError) {
      console.error('Erro ao listar documentos:', listError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar documentos'
      });
    }

    const temFoto3x4 = arquivos.some(arquivo => arquivo.name.startsWith('foto_3x4_'));
    const temComprovanteResidencia = arquivos.some(arquivo => arquivo.name.startsWith('comprovante_residencia_'));
    const podeGerar = temFoto3x4 && temComprovanteResidencia;

    res.json({
      success: true,
      data: {
        podeGerar,
        temFoto3x4,
        temComprovanteResidencia,
        documentos: arquivos.map(arquivo => ({
          nome: arquivo.name,
          tamanho: arquivo.metadata?.size || 0,
          dataUpload: arquivo.created_at
        })),
        totalArquivos: arquivos.length
      }
    });
  } catch (error) {
    console.error('Erro ao verificar carteirinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar carteirinha',
      error: error.message
    });
  }
});

// GET /api/carteirinhas/modelo - Buscar modelo de carteirinha
router.get('/modelo', async (req, res) => {
  try {
    // Buscar modelo de carteirinha (implementação futura)
    res.json({
      success: true,
      message: 'Funcionalidade de modelo de carteirinha será implementada',
      data: null
    });
  } catch (error) {
    console.error('Erro ao buscar modelo de carteirinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar modelo de carteirinha',
      error: error.message
    });
  }
});

// POST /api/carteirinhas/modelo - Upload de modelo de carteirinha
router.post('/modelo', async (req, res) => {
  try {
    const user = req.user;

    // Verificar se é admin
    if (user.tipo !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem alterar o modelo de carteirinha'
      });
    }

    // Implementação futura para upload de modelo
    res.json({
      success: true,
      message: 'Funcionalidade de upload de modelo será implementada'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload do modelo',
      error: error.message
    });
  }
});

// GET /api/carteirinhas/estatisticas - Estatísticas de carteirinhas
router.get('/estatisticas', async (req, res) => {
  try {
    const user = req.user;

    // Implementação futura para estatísticas
    res.json({
      success: true,
      data: {
        totalCarteirinhas: 0,
        carteirinhasMes: 0,
        carteirinhasPendentes: 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

// =====================================================
// ROTAS PARA MODELO DE CARTEIRINHA
// =====================================================

// GET /api/carteirinhas/modelo - Download do modelo padrão de carteirinha
router.get('/modelo', async (req, res) => {
  try {
    // Tentar buscar modelo personalizado do Supabase Storage
    const { data: arquivos, error: listError } = await supabaseAdmin.storage
      .from('feperj')
      .list('modelos', {
        limit: 1,
        offset: 0
      });

    if (!listError && arquivos && arquivos.length > 0) {
      // Usar modelo personalizado
      const { data: modeloData, error: downloadError } = await supabaseAdmin.storage
        .from('feperj')
        .download('modelos/carteirinha_modelo.pdf');

      if (downloadError) {
        throw new Error('Erro ao baixar modelo personalizado');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="carteirinha_modelo_personalizado.pdf"');
      
      const arrayBuffer = await modeloData.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
      return;
    }

    // Usar modelo padrão (se não houver modelo personalizado)
    const modeloPadraoPath = path.join(__dirname, '../public/modelos/carteirinha_modelo.pdf');
    
    if (fs.existsSync(modeloPadraoPath)) {
      res.download(modeloPadraoPath, 'carteirinha_modelo_padrao.pdf');
    } else {
      res.status(404).json({
        success: false,
        message: 'Modelo de carteirinha não encontrado'
      });
    }

  } catch (error) {
    console.error('Erro ao baixar modelo de carteirinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao baixar modelo de carteirinha',
      error: error.message
    });
  }
});

// POST /api/carteirinhas/modelo - Upload de modelo personalizado de carteirinha
router.post('/modelo', upload.single('modelo'), async (req, res) => {
  try {
    const user = req.user;

    // Verificar se é admin
    if (user.tipo !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem fazer upload de modelo de carteirinha'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo PDF é obrigatório'
      });
    }

    // Upload do modelo para Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('feperj')
      .upload('modelos/carteirinha_modelo.pdf', req.file.buffer, {
        contentType: 'application/pdf',
        upsert: true // Substituir se já existir
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload do modelo: ' + uploadError.message);
    }

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Upload modelo carteirinha',
      detalhes: 'Fez upload de modelo personalizado de carteirinha',
      tipoUsuario: user.tipo
    });

    res.json({
      success: true,
      message: 'Modelo de carteirinha atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao fazer upload do modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload do modelo',
      error: error.message
    });
  }
});

// GET /api/carteirinhas/configuracao - Obter configuração da carteirinha
router.get('/configuracao', async (req, res) => {
  try {
    const config = obterConfiguracaoCarteirinha();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configuração da carteirinha',
      error: error.message
    });
  }
});

module.exports = router;
