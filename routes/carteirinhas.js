const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { atletaService, equipeService, documentoService, logService } = require('../supabaseService');

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

// Função para gerar PDF da carteirinha (simplificada)
const gerarPDFCarteirinha = async (atleta, equipe, foto3x4Url) => {
  // Esta é uma implementação simplificada
  // Em produção, você usaria uma biblioteca como PDFKit, Puppeteer ou similar
  
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
  /Font <<
    /F1 4 0 R
  >>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 200
>>
stream
BT
/F1 18 Tf
100 700 Td
(CARTEIRINHA FEPERJ) Tj
0 -30 Td
/F1 12 Tf
(Nome: ${atleta.nome}) Tj
0 -20 Td
(CPF: ${atleta.cpf}) Tj
0 -20 Td
(Matrícula: ${atleta.matricula || 'N/A'}) Tj
0 -20 Td
(Equipe: ${equipe.nomeEquipe}) Tj
0 -20 Td
(Data de Filiação: ${atleta.dataFiliacao.toLocaleDateString('pt-BR')}) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000254 00000 n 
0000000334 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
583
%%EOF
  `;

  return Buffer.from(pdfContent, 'utf8');
};

// POST /api/carteirinhas/:id/gerar - Gerar carteirinha para atleta
router.post('/:id/gerar', verificarPermissaoCarteirinha, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Buscar dados do atleta
    const atleta = await atletaService.getById(id);
    if (!atleta) {
      return res.status(404).json({
        success: false,
        message: 'Atleta não encontrado'
      });
    }

    // Buscar equipe do atleta
    const equipe = await equipeService.getById(atleta.idEquipe);
    if (!equipe) {
      return res.status(404).json({
        success: false,
        message: 'Equipe do atleta não encontrada'
      });
    }

    // Verificar se atleta tem os documentos necessários
    const documentos = await documentoService.listDocuments(id);
    const temFoto3x4 = documentos.some(doc => doc.tipo === 'foto-3x4');
    const temComprovanteResidencia = documentos.some(doc => doc.tipo === 'comprovante-residencia');

    if (!temFoto3x4 || !temComprovanteResidencia) {
      return res.status(400).json({
        success: false,
        message: 'Atleta deve ter foto 3x4 e comprovante de residência cadastrados',
        documentos: {
          temFoto3x4,
          temComprovanteResidencia,
          falta: [
            ...(temFoto3x4 ? [] : ['foto-3x4']),
            ...(temComprovanteResidencia ? [] : ['comprovante-residencia'])
          ]
        }
      });
    }

    // Buscar foto 3x4
    let foto3x4Url = null;
    try {
      const foto3x4Doc = documentos.find(doc => doc.tipo === 'foto-3x4');
      if (foto3x4Doc) {
        // Gerar URL temporária para a foto
        foto3x4Url = `/api/documentos/${id}/download/${foto3x4Doc.id}`;
      }
    } catch (error) {
      console.warn('Erro ao buscar foto 3x4:', error);
    }

    // Gerar PDF da carteirinha
    const pdfBytes = await gerarPDFCarteirinha(atleta, equipe, foto3x4Url);

    // Criar nome do arquivo
    const nomeArquivo = `carteirinha_${atleta.nome.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Gerou carteirinha',
      detalhes: `Gerou carteirinha do atleta: ${atleta.nome}`,
      tipoUsuario: user.tipo
    });

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', pdfBytes.length);

    res.send(pdfBytes);
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

    // Verificar documentos
    const documentos = await documentoService.listDocuments(id);
    const temFoto3x4 = documentos.some(doc => doc.tipo === 'foto-3x4');
    const temComprovanteResidencia = documentos.some(doc => doc.tipo === 'comprovante-residencia');
    const podeGerar = temFoto3x4 && temComprovanteResidencia;

    res.json({
      success: true,
      data: {
        podeGerar,
        temFoto3x4,
        temComprovanteResidencia,
        documentos: documentos.map(doc => ({
          id: doc.id,
          tipo: doc.tipo,
          nomeArquivo: doc.nomeArquivoOriginal,
          dataUpload: doc.dataUpload
        }))
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

module.exports = router;
