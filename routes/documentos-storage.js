const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../supabase');
const router = express.Router();

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas JPG, PNG e PDF são aceitos.'), false);
    }
  }
});

// Tipos de documentos permitidos
const TIPOS_DOCUMENTOS = {
  'comprovante_residencia': 'Comprovante de Residência',
  'foto_3x4': 'Foto 3x4',
  'certificado_adel': 'Certificado ADEL',
  'termo_imagem': 'Termo de Imagem'
};

// Função para gerar nome único do arquivo (compatível com bucket feperj)
function gerarNomeArquivo(atletaId, tipoDocumento, extensao, nomeOriginal) {
  const timestamp = Date.now();
  return `${atletaId}/${tipoDocumento}_${timestamp}${extensao}`;
}

// Função para obter extensão do arquivo
function obterExtensao(nomeArquivo) {
  return '.' + nomeArquivo.split('.').pop().toLowerCase();
}

// POST /api/documentos-storage/upload - Upload de documento
router.post('/upload', upload.single('documento'), async (req, res) => {
  try {
    console.log('🔍 Upload recebido:', {
      headers: req.headers,
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    const { atletaId, tipoDocumento } = req.body;
    const file = req.file;

    if (!atletaId || !tipoDocumento) {
      console.log('❌ Dados obrigatórios ausentes:', { atletaId, tipoDocumento });
      return res.status(400).json({
        success: false,
        message: 'ID do atleta e tipo de documento são obrigatórios'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo não fornecido'
      });
    }

    if (!TIPOS_DOCUMENTOS[tipoDocumento]) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento inválido'
      });
    }

    // Gerar nome único do arquivo (compatível com bucket feperj)
    const extensao = obterExtensao(file.originalname);
    const nomeArquivo = gerarNomeArquivo(atletaId, tipoDocumento, extensao);

    // Upload para o Supabase Storage (usando bucket feperj)
    const { data, error } = await supabaseAdmin.storage
      .from('feperj')
      .upload(nomeArquivo, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do arquivo: ' + error.message
      });
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseAdmin.storage
      .from('feperj')
      .getPublicUrl(nomeArquivo);

    res.json({
      success: true,
      message: 'Documento enviado com sucesso',
      data: {
        nomeArquivo,
        url: urlData.publicUrl,
        tipo: tipoDocumento,
        tamanho: file.size,
        contentType: file.mimetype
      }
    });

  } catch (error) {
    console.error('Erro no upload de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// GET /api/documentos-storage/list/:atletaId - Listar documentos do atleta
router.get('/list/:atletaId', async (req, res) => {
  try {
    const { atletaId } = req.params;

    if (!atletaId) {
      return res.status(400).json({
        success: false,
        message: 'ID do atleta é obrigatório'
      });
    }

    // Listar arquivos do atleta no bucket (usando feperj)
    const { data: arquivos, error } = await supabaseAdmin.storage
      .from('feperj')
      .list(atletaId, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Erro ao listar documentos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar documentos: ' + error.message
      });
    }

    // Processar lista de arquivos
    const documentos = await Promise.all(arquivos.map(async (arquivo) => {
      const partes = arquivo.name.split('_');
      const tipo = partes[0];
      const filePath = `${atletaId}/${arquivo.name}`;
      
      // Gerar signed URL para cada arquivo (válida por 1 hora)
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('feperj')
        .createSignedUrl(filePath, 3600);
      
      return {
        nome: arquivo.name,
        tipo: tipo,
        tipoNome: TIPOS_DOCUMENTOS[tipo] || tipo,
        tamanho: arquivo.metadata?.size || 0,
        dataUpload: arquivo.created_at,
        signedUrl: signedUrlData?.signedUrl || null,
        expiresIn: 3600
      };
    }));

    res.json({
      success: true,
      data: documentos
    });

  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// GET /api/documentos-storage/download/:atletaId/:nomeArquivo - Gerar URL temporária para download
router.get('/download/:atletaId/:nomeArquivo', async (req, res) => {
  try {
    const { atletaId, nomeArquivo } = req.params;

    if (!atletaId || !nomeArquivo) {
      return res.status(400).json({
        success: false,
        message: 'ID do atleta e nome do arquivo são obrigatórios'
      });
    }

    const filePath = `${atletaId}/${nomeArquivo}`;

    // Gerar signed URL para download (válida por 30 minutos)
    const { data, error } = await supabaseAdmin.storage
      .from('feperj')
      .createSignedUrl(filePath, 1800); // 1800 segundos = 30 minutos

    if (error) {
      console.error('Erro ao gerar URL temporária:', error);
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado ou erro ao gerar link'
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: data.signedUrl,
        fileName: nomeArquivo,
        expiresIn: 1800
      }
    });

  } catch (error) {
    console.error('Erro ao gerar URL de download:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// GET /api/documentos-storage/view/:atletaId/:nomeArquivo - Gerar URL temporária para visualização
router.get('/view/:atletaId/:nomeArquivo', async (req, res) => {
  try {
    const { atletaId, nomeArquivo } = req.params;

    if (!atletaId || !nomeArquivo) {
      return res.status(400).json({
        success: false,
        message: 'ID do atleta e nome do arquivo são obrigatórios'
      });
    }

    const filePath = `${atletaId}/${nomeArquivo}`;

    // Gerar signed URL para visualização (válida por 30 minutos)
    const { data, error } = await supabaseAdmin.storage
      .from('feperj')
      .createSignedUrl(filePath, 1800); // 1800 segundos = 30 minutos

    if (error) {
      console.error('Erro ao gerar URL temporária:', error);
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado ou erro ao gerar link'
      });
    }

    // Determinar tipo de conteúdo
    const extensao = obterExtensao(nomeArquivo);
    let contentType = 'application/octet-stream';
    
    if (['.jpg', '.jpeg'].includes(extensao)) {
      contentType = 'image/jpeg';
    } else if (extensao === '.png') {
      contentType = 'image/png';
    } else if (extensao === '.pdf') {
      contentType = 'application/pdf';
    }

    res.json({
      success: true,
      data: {
        viewUrl: data.signedUrl,
        fileName: nomeArquivo,
        contentType: contentType,
        expiresIn: 1800
      }
    });

  } catch (error) {
    console.error('Erro ao gerar URL de visualização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// DELETE /api/documentos-storage/:atletaId/:nomeArquivo - Excluir documento
router.delete('/:atletaId/:nomeArquivo', async (req, res) => {
  try {
    const { atletaId, nomeArquivo } = req.params;

    if (!atletaId || !nomeArquivo) {
      return res.status(400).json({
        success: false,
        message: 'ID do atleta e nome do arquivo são obrigatórios'
      });
    }

    // Excluir arquivo do storage (usando bucket feperj)
    const { error } = await supabaseAdmin.storage
      .from('feperj')
      .remove([`${atletaId}/${nomeArquivo}`]);

    if (error) {
      console.error('Erro na exclusão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir arquivo: ' + error.message
      });
    }

    res.json({
      success: true,
      message: 'Documento excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na exclusão de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

module.exports = router;
