const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { atletaService, documentoService, logService } = require('../supabaseService');
const { supabaseAdmin } = require('../supabase');

// Configuração do Multer para upload de documentos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const atletaId = req.params.id;
    const uploadDir = path.join(__dirname, '../uploads/documentos', atletaId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const tipo = req.body.tipo || 'documento';
    const timestamp = Date.now();
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `${tipo}_${timestamp}${extensao}`;
    cb(null, nomeArquivo);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Tipos de arquivo permitidos
    const tiposPermitidos = /jpeg|jpg|png|pdf|doc|docx/;
    const extensao = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    const mimeType = tiposPermitidos.test(file.mimetype);

    if (mimeType && extensao) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use: jpeg, jpg, png, pdf, doc, docx'));
    }
  }
});

// Middleware para verificar permissões de documento
const verificarPermissaoDocumento = async (req, res, next) => {
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
        message: 'Você só pode acessar documentos de atletas da sua equipe'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// GET /api/documentos/:id - Listar documentos de um atleta
router.get('/:id', verificarPermissaoDocumento, async (req, res) => {
  try {
    const { id } = req.params;
    const documentos = await documentoService.listDocuments(id);

    res.json({
      success: true,
      data: documentos
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documentos',
      error: error.message
    });
  }
});

// POST /api/documentos/:id/upload - Upload de documento
router.post('/:id/upload', verificarPermissaoDocumento, upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descricao } = req.body;
    const user = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    if (!tipo) {
      // Remover arquivo se tipo não foi especificado
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento é obrigatório'
      });
    }

    // Verificar se atleta existe
    const atleta = await atletaService.getById(id);
    if (!atleta) {
      // Remover arquivo se atleta não existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    // Salvar informações do documento no banco
    const documentoData = {
      atletaId: id,
      tipo: tipo,
      nomeArquivo: req.file.filename,
      nomeArquivoOriginal: req.file.originalname,
      tamanho: req.file.size,
      caminho: req.file.path,
      descricao: descricao || '',
      dataUpload: new Date(),
      uploadPor: user.id
    };

    const documento = await documentoService.createDocument(documentoData);

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Upload de documento',
      detalhes: `Enviou documento ${tipo} para o atleta ${atleta.nome}`,
      tipoUsuario: user.tipo
    });

    res.status(201).json({
      success: true,
      message: 'Documento enviado com sucesso!',
      data: documento
    });
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    
    // Remover arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao enviar documento',
      error: error.message
    });
  }
});

// GET /api/documentos/:id/download/:documentoId - Download de documento
router.get('/:id/download/:documentoId', verificarPermissaoDocumento, async (req, res) => {
  try {
    const { id, documentoId } = req.params;
    const user = req.user;

    // Buscar informações do documento
    const documento = await documentoService.getDocumentById(documentoId);
    if (!documento || documento.atletaId !== id) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(documento.caminho)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado no servidor'
      });
    }

    // Registrar log de download
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Download de documento',
      detalhes: `Baixou documento ${documento.tipo} do atleta`,
      tipoUsuario: user.tipo
    });

    // Enviar arquivo
    res.download(documento.caminho, documento.nomeArquivoOriginal);
  } catch (error) {
    console.error('Erro ao fazer download do documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer download do documento',
      error: error.message
    });
  }
});

// DELETE /api/documentos/:id/:documentoId - Excluir documento
router.delete('/:id/:documentoId', verificarPermissaoDocumento, async (req, res) => {
  try {
    const { id, documentoId } = req.params;
    const user = req.user;

    // Buscar informações do documento
    const documento = await documentoService.getDocumentById(documentoId);
    if (!documento || documento.atletaId !== id) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    // Remover arquivo físico
    if (fs.existsSync(documento.caminho)) {
      fs.unlinkSync(documento.caminho);
    }

    // Remover registro do banco
    await documentoService.deleteDocument(documentoId);

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Excluiu documento',
      detalhes: `Excluiu documento ${documento.tipo}`,
      tipoUsuario: user.tipo
    });

    res.json({
      success: true,
      message: 'Documento excluído com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir documento',
      error: error.message
    });
  }
});

// GET /api/documentos/:id/verificar - Verificar status dos documentos
router.get('/:id/verificar', verificarPermissaoDocumento, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Usar a API de documentos-storage para verificar documentos
    const { data: arquivos, error } = await supabaseAdmin.storage
      .from('feperj')
      .list(id, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Erro ao listar documentos do Supabase Storage:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar documentos'
      });
    }

    // Verificar quais documentos existem
    const status = {
      temMatricula: false, // Matrícula é gerada automaticamente
      temFoto3x4: arquivos.some(arquivo => arquivo.name.startsWith('foto_3x4_')),
      temComprovanteResidencia: arquivos.some(arquivo => arquivo.name.startsWith('comprovante_residencia_')),
      podeGerarCarteirinha: false,
      documentos: arquivos
    };

    // Pode gerar carteirinha se tem foto 3x4 e comprovante de residência
    status.podeGerarCarteirinha = status.temFoto3x4 && status.temComprovanteResidencia;

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Erro ao verificar documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar documentos',
      error: error.message
    });
  }
});

// GET /api/documentos/:id/url-temporaria/:documentoId - Gerar URL temporária
router.get('/:id/url-temporaria/:documentoId', verificarPermissaoDocumento, async (req, res) => {
  try {
    const { id, documentoId } = req.params;
    const { expiraEm = 3600 } = req.query; // Padrão 1 hora

    // Buscar informações do documento
    const documento = await documentoService.getDocumentById(documentoId);
    if (!documento || documento.atletaId !== id) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(documento.caminho)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado no servidor'
      });
    }

    // Gerar URL temporária (simulada - em produção usar serviço de storage)
    const urlTemporaria = `/api/documentos/${id}/download/${documentoId}?temporaria=true&expira=${Date.now() + (expiraEm * 1000)}`;

    res.json({
      success: true,
      data: {
        url: urlTemporaria,
        expiraEm: parseInt(expiraEm),
        tipo: documento.tipo
      }
    });
  } catch (error) {
    console.error('Erro ao gerar URL temporária:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar URL temporária',
      error: error.message
    });
  }
});

module.exports = router;
