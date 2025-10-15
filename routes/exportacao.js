const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { atletaService, logService } = require('../supabaseService');

// Middleware para verificar permissões de exportação
const verificarPermissaoExportacao = async (req, res, next) => {
  const user = req.user;

  // Apenas admins podem exportar dados
  if (user.tipo !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem exportar dados'
    });
  }

  next();
};

// GET /api/exportacao/atletas/excel - Exportar lista de atletas para Excel
router.get('/atletas/excel', verificarPermissaoExportacao, async (req, res) => {
  try {
    const user = req.user;

    // Buscar todos os atletas
    const atletas = await atletaService.getAll();

    // Preparar dados para Excel
    const dadosExcel = atletas.map(atleta => ({
      'Nome': atleta.nome,
      'CPF': atleta.cpf,
      'Matrícula': atleta.matricula || 'N/A',
      'Sexo': atleta.sexo === 'M' ? 'Masculino' : 'Feminino',
      'Email': atleta.email,
      'Telefone': atleta.telefone || 'N/A',
      'Data de Nascimento': atleta.dataNascimento ? atleta.dataNascimento.toLocaleDateString('pt-BR') : 'N/A',
      'Data de Filiação': atleta.dataFiliacao.toLocaleDateString('pt-BR'),
      'Equipe': atleta.equipe?.nomeEquipe || 'N/A',
      'Status': atleta.status === 'ATIVO' ? 'Ativo' : 'Inativo',
      'Maior Total (kg)': atleta.maiorTotal ? atleta.maiorTotal.toString() : 'N/A',
      'Endereço': atleta.endereco || 'N/A',
      'Observações': atleta.observacoes || 'N/A'
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExcel);

    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 15 }, // CPF
      { wch: 20 }, // Matrícula
      { wch: 10 }, // Sexo
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // Data Nascimento
      { wch: 15 }, // Data Filiação
      { wch: 20 }, // Equipe
      { wch: 10 }, // Status
      { wch: 15 }, // Maior Total
      { wch: 30 }, // Endereço
      { wch: 30 }  // Observações
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Atletas');

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Nome do arquivo
    const nomeArquivo = `atletas_feperj_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Exportou lista de atletas',
      detalhes: `Exportou ${atletas.length} atletas em Excel`,
      tipoUsuario: user.tipo
    });

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Erro ao exportar atletas para Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar dados',
      error: error.message
    });
  }
});

// POST /api/exportacao/atletas/importar-excel - Importar atletas de arquivo Excel
router.post('/atletas/importar-excel', verificarPermissaoExportacao, async (req, res) => {
  try {
    const user = req.user;

    // Esta funcionalidade será implementada com multer para upload
    // Por enquanto, retornar mensagem informativa
    res.json({
      success: false,
      message: 'Funcionalidade de importação Excel será implementada com upload de arquivo'
    });
  } catch (error) {
    console.error('Erro ao importar Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao importar dados',
      error: error.message
    });
  }
});

// GET /api/exportacao/atletas/template - Download do template Excel para importação
router.get('/atletas/template', verificarPermissaoExportacao, async (req, res) => {
  try {
    // Criar template vazio para importação
    const templateData = [
      {
        'Nome': 'Exemplo: João Silva',
        'CPF': '000.000.000-00',
        'Email': 'exemplo@email.com',
        'Telefone': '(21) 99999-9999',
        'Data de Nascimento': '01/01/1990',
        'Data de Filiação': '01/01/2024',
        'Sexo': 'M ou F',
        'Equipe': 'Nome da Equipe',
        'Status': 'ATIVO ou INATIVO',
        'Maior Total (kg)': '100.5',
        'Endereço': 'Endereço completo',
        'Observações': 'Observações opcionais'
      }
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Configurar larguras das colunas
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 15 }, // CPF
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // Data Nascimento
      { wch: 15 }, // Data Filiação
      { wch: 10 }, // Sexo
      { wch: 20 }, // Equipe
      { wch: 10 }, // Status
      { wch: 15 }, // Maior Total
      { wch: 30 }, // Endereço
      { wch: 30 }  // Observações
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template Importação');

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Nome do arquivo
    const nomeArquivo = 'template_importacao_atletas.xlsx';

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Erro ao gerar template Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar template',
      error: error.message
    });
  }
});

// GET /api/exportacao/relatorios/atletas-por-equipe - Relatório de atletas por equipe
router.get('/relatorios/atletas-por-equipe', verificarPermissaoExportacao, async (req, res) => {
  try {
    const user = req.user;

    // Buscar todos os atletas
    const atletas = await atletaService.getAll();

    // Agrupar por equipe
    const atletasPorEquipe = {};
    atletas.forEach(atleta => {
      const equipe = atleta.equipe?.nomeEquipe || 'Sem Equipe';
      if (!atletasPorEquipe[equipe]) {
        atletasPorEquipe[equipe] = [];
      }
      atletasPorEquipe[equipe].push(atleta);
    });

    // Preparar dados para Excel
    const dadosExcel = [];
    Object.keys(atletasPorEquipe).forEach(equipe => {
      // Adicionar cabeçalho da equipe
      dadosExcel.push({
        'Equipe': equipe,
        'Total de Atletas': atletasPorEquipe[equipe].length,
        'Ativos': atletasPorEquipe[equipe].filter(a => a.status === 'ATIVO').length,
        'Inativos': atletasPorEquipe[equipe].filter(a => a.status === 'INATIVO').length,
        'Nome': '',
        'CPF': '',
        'Email': '',
        'Status': '',
        'Data Filiação': ''
      });

      // Adicionar atletas da equipe
      atletasPorEquipe[equipe].forEach(atleta => {
        dadosExcel.push({
          'Equipe': '',
          'Total de Atletas': '',
          'Ativos': '',
          'Inativos': '',
          'Nome': atleta.nome,
          'CPF': atleta.cpf,
          'Email': atleta.email,
          'Status': atleta.status,
          'Data Filiação': atleta.dataFiliacao.toLocaleDateString('pt-BR')
        });
      });

      // Linha em branco entre equipes
      dadosExcel.push({
        'Equipe': '',
        'Total de Atletas': '',
        'Ativos': '',
        'Inativos': '',
        'Nome': '',
        'CPF': '',
        'Email': '',
        'Status': '',
        'Data Filiação': ''
      });
    });

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExcel);

    // Configurar larguras das colunas
    const colWidths = [
      { wch: 20 }, // Equipe
      { wch: 15 }, // Total
      { wch: 10 }, // Ativos
      { wch: 10 }, // Inativos
      { wch: 25 }, // Nome
      { wch: 15 }, // CPF
      { wch: 25 }, // Email
      { wch: 10 }, // Status
      { wch: 15 }  // Data Filiação
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Atletas por Equipe');

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Nome do arquivo
    const nomeArquivo = `relatorio_atletas_por_equipe_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Registrar log
    await logService.create({
      dataHora: new Date(),
      usuario: user.nome || user.login,
      acao: 'Exportou relatório de atletas por equipe',
      detalhes: `Exportou relatório com ${atletas.length} atletas`,
      tipoUsuario: user.tipo
    });

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar relatório',
      error: error.message
    });
  }
});

module.exports = router;
