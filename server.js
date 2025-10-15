// Carregar variáveis de ambiente
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const XLSX = require('xlsx');

// Importar configuração Supabase
const { supabase, testSupabaseConnection, criarAdminInicial, criarDadosExemplo, inicializarConfiguracoes } = require('./supabase');

// Importar todos os serviços do Supabase
const { 
    usuarioService, 
    atletaService, 
    equipeService, 
    categoriaService, 
    competicaoService, 
    inscricaoService, 
    logService,
    fileService,
    dashboardService,
    anuidadeService,
    pagamentoService,
    documentoService,
    tipoCompeticaoService,
    anuidadeEquipeService,
    equipeStatusService
} = require('./supabaseService.js');

// Importar rotas das APIs
const atletasRoutes = require('./routes/atletas');
const documentosRoutes = require('./routes/documentos');
const documentosStorageRoutes = require('./routes/documentos-storage');
const carteirinhasRoutes = require('./routes/carteirinhas');
const exportacaoRoutes = require('./routes/exportacao');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração JWT
const JWT_SECRET = '7qt1DUw9b4p4zKCC';
const JWT_EXPIRES_IN = '24h';

// Configuração Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Função para conectar ao Supabase
async function conectarSupabase() {
    try {
        // Testar conexão
        const conectado = await testSupabaseConnection();
        if (!conectado) {
            return false;
        }
        
        // Inicializar configurações padrão
        await inicializarConfiguracoes();
        
        // Criar usuário admin inicial se não existir
        await criarAdminInicial();
        
        // Criar dados de exemplo se não existirem
        await criarDadosExemplo();
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao conectar ao Supabase:', error.message);
        return false;
    }
}


// Middleware de autenticação
function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token não fornecido' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
}

// Rota de login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username e password são obrigatórios'
            });
        }
        
        // Buscar usuário usando o serviço
        const usuario = await usuarioService.getByLogin(username);
        
        if (!usuario || !usuario.ativo) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        // Verificar senha
        const senhaValida = await bcrypt.compare(password, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                login: usuario.login, 
                tipo: usuario.tipo,
                nome: usuario.nome
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Log da atividade
        await logService.create({
            usuario: usuario.nome,
            acao: 'LOGIN',
            detalhes: `Login realizado com sucesso`,
            tipo_usuario: usuario.tipo
        });
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: usuario.id,
                login: usuario.login,
                nome: usuario.nome,
                tipo: usuario.tipo
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para obter dados do dashboard
app.get('/api/dashboard', verificarToken, async (req, res) => {
    try {
        // Usar o serviço de dashboard
        const stats = await dashboardService.getStats();
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'DASHBOARD_ACCESS',
            detalhes: 'Acesso ao dashboard',
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para listar atletas
app.get('/api/atletas', verificarToken, async (req, res) => {
    try {
        const atletas = await atletaService.getAll();
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'LIST_ATLETAS',
            detalhes: 'Listagem de atletas',
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: atletas
        });
        
    } catch (error) {
        console.error('Erro ao buscar atletas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar atleta por CPF
app.get('/api/atletas/cpf/:cpf', verificarToken, async (req, res) => {
    try {
        const { cpf } = req.params;
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        const atleta = await atletaService.getByCpf(cpfLimpo);
        
        if (!atleta) {
            return res.json({
                success: true,
                data: null,
                message: 'Atleta não encontrado'
            });
        }
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'SEARCH_ATLETA_CPF',
            detalhes: `Busca por CPF: ${cpf}`,
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: atleta
        });
        
    } catch (error) {
        console.error('Erro ao buscar atleta por CPF:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para criar novo atleta
app.post('/api/atletas', verificarToken, async (req, res) => {
    try {
        const dadosAtleta = req.body;
        
        // Verificar se CPF já existe
        const cpfLimpo = dadosAtleta.cpf.replace(/\D/g, '');
        const atletaExistente = await atletaService.getByCpf(cpfLimpo);
        
        if (atletaExistente) {
            return res.status(400).json({
                success: false,
                message: `CPF ${dadosAtleta.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nome_equipe || 'N/A'}). Entre em contato com o administrador.`
            });
        }
        
        // Criar atleta
        const novoAtleta = await atletaService.create({
            ...dadosAtleta,
            cpf: cpfLimpo,
            status: 'ATIVO'
        });
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'CREATE_ATLETA',
            detalhes: `Atleta criado: ${dadosAtleta.nome}`,
            tipo_usuario: req.user.tipo,
            resource_type: 'atleta',
            resource_id: novoAtleta
        });
        
        res.json({
            success: true,
            message: 'Atleta criado com sucesso',
            data: { id: novoAtleta }
        });
        
    } catch (error) {
        console.error('Erro ao criar atleta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para atualizar atleta
app.put('/api/atletas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizacao = req.body;
        
        // Se o CPF foi alterado, verificar se já existe
        if (dadosAtualizacao.cpf) {
            const cpfLimpo = dadosAtualizacao.cpf.replace(/\D/g, '');
            const atletaExistente = await atletaService.getByCpf(cpfLimpo);
            
            if (atletaExistente && atletaExistente.id !== id) {
                return res.status(400).json({
                    success: false,
                    message: `CPF ${dadosAtualizacao.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nome_equipe || 'N/A'}). Entre em contato com o administrador.`
                });
            }
            
            dadosAtualizacao.cpf = cpfLimpo;
        }
        
        // Atualizar atleta
        await atletaService.update(id, dadosAtualizacao);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'UPDATE_ATLETA',
            detalhes: `Atleta atualizado: ${dadosAtualizacao.nome || 'ID: ' + id}`,
            tipo_usuario: req.user.tipo,
            resource_type: 'atleta',
            resource_id: id
        });
        
        res.json({
            success: true,
            message: 'Atleta atualizado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar atleta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para deletar atleta
app.delete('/api/atletas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se atleta tem inscrições
        const inscricoes = await inscricaoService.getByAtleta(id);
        
        if (inscricoes && inscricoes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir atleta com inscrições em competições. Desative o atleta em vez de excluí-lo.'
            });
        }
        
        // Buscar dados do atleta antes de deletar para o log
        const atleta = await atletaService.getById(id);
        
        // Deletar atleta
        await atletaService.delete(id);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'DELETE_ATLETA',
            detalhes: `Atleta deletado: ${atleta?.nome || 'N/A'}`,
            tipo_usuario: req.user.tipo,
            resource_type: 'atleta',
            resource_id: id
        });
        
        res.json({
            success: true,
            message: 'Atleta deletado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao deletar atleta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para exportar atletas para Excel
app.get('/api/atletas/export/excel', verificarToken, async (req, res) => {
    try {
        const atletas = await atletaService.getAll();
        
        // Preparar dados para Excel
        const dadosExcel = atletas.map(atleta => ({
            'ID': atleta.id,
            'Nome': atleta.nome,
            'CPF': atleta.cpf,
            'Data de Nascimento': atleta.data_nascimento ? moment(atleta.data_nascimento).format('DD/MM/YYYY') : '',
            'Sexo': atleta.sexo,
            'Peso': atleta.peso,
            'Categoria': atleta.categoria,
            'Equipe': atleta.equipe_nome || 'Sem Equipe',
            'Status': atleta.ativo ? 'Ativo' : 'Inativo',
            'Data de Cadastro': atleta.created_at ? moment(atleta.created_at).format('DD/MM/YYYY HH:mm') : ''
        }));
        
        // Criar workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
        
        // Definir larguras das colunas
        const colWidths = [
            { wch: 10 }, // ID
            { wch: 30 }, // Nome
            { wch: 15 }, // CPF
            { wch: 15 }, // Data de Nascimento
            { wch: 10 }, // Sexo
            { wch: 10 }, // Peso
            { wch: 15 }, // Categoria
            { wch: 25 }, // Equipe
            { wch: 10 }, // Status
            { wch: 20 }  // Data de Cadastro
        ];
        worksheet['!cols'] = colWidths;
        
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Atletas');
        
        // Gerar buffer do Excel
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'EXPORT_ATLETAS_EXCEL',
            detalhes: `Exportação de ${atletas.length} atletas para Excel`,
            tipo_usuario: req.user.tipo
        });
        
        // Configurar headers para download
        const fileName = `atletas_feperj_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);
        
        res.send(excelBuffer);
        
    } catch (error) {
        console.error('Erro ao exportar atletas para Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para importar atletas do Excel
app.post('/api/atletas/import/excel', verificarToken, upload.single('arquivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi enviado'
            });
        }
        
        // Ler arquivo Excel
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const dados = XLSX.utils.sheet_to_json(worksheet);
        
        if (dados.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Arquivo Excel está vazio'
            });
        }
        
        let sucessos = 0;
        let erros = 0;
        const detalhesErros = [];
        
        // Processar cada linha
        for (let i = 0; i < dados.length; i++) {
            const linha = dados[i];
            
            try {
                // Validar campos obrigatórios
                if (!linha.Nome || !linha.CPF) {
                    erros++;
                    detalhesErros.push(`Linha ${i + 2}: Nome e CPF são obrigatórios`);
                    continue;
                }
                
                // Limpar CPF
                const cpfLimpo = linha.CPF.toString().replace(/\D/g, '');
                
                // Verificar se atleta já existe
                const atletaExistente = await atletaService.getByCpf(cpfLimpo);
                
                if (atletaExistente) {
                    erros++;
                    detalhesErros.push(`Linha ${i + 2}: Atleta com CPF ${cpfLimpo} já existe`);
                    continue;
                }
                
                // Preparar dados do atleta
                const dadosAtleta = {
                    nome: linha.Nome.toString().trim(),
                    cpf: cpfLimpo,
                    data_nascimento: linha['Data de Nascimento'] ? moment(linha['Data de Nascimento'], 'DD/MM/YYYY').format('YYYY-MM-DD') : null,
                    sexo: linha.Sexo ? linha.Sexo.toString().toUpperCase().substring(0, 1) : null,
                    peso: linha.Peso ? parseFloat(linha.Peso) : null,
                    categoria: linha.Categoria ? linha.Categoria.toString().trim() : null,
                    ativo: linha.Status ? linha.Status.toString().toLowerCase().includes('ativo') : true
                };
                
                // Buscar equipe se especificada
                if (linha.Equipe && linha.Equipe.toString().trim() !== 'Sem Equipe') {
                    const equipe = await equipeService.getByNome(linha.Equipe.toString().trim());
                    if (equipe) {
                        dadosAtleta.id_equipe = equipe.id;
                    }
                }
                
                // Criar atleta
                await atletaService.create(dadosAtleta);
                sucessos++;
                
            } catch (error) {
                erros++;
                detalhesErros.push(`Linha ${i + 2}: ${error.message}`);
            }
        }
        
        // Limpar arquivo temporário
        fs.unlinkSync(req.file.path);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'IMPORT_ATLETAS_EXCEL',
            detalhes: `Importação Excel: ${sucessos} sucessos, ${erros} erros`,
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            message: `Importação concluída: ${sucessos} atletas importados com sucesso, ${erros} erros`,
            dados: {
                sucessos,
                erros,
                detalhesErros: erros > 0 ? detalhesErros : []
            }
        });
        
    } catch (error) {
        console.error('Erro ao importar atletas do Excel:', error);
        
        // Limpar arquivo temporário em caso de erro
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para listar equipes
app.get('/api/equipes', verificarToken, async (req, res) => {
    try {
        const equipes = await equipeService.getAll();
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'LIST_EQUIPES',
            detalhes: 'Listagem de equipes',
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: equipes
        });
        
    } catch (error) {
        console.error('Erro ao buscar equipes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para criar nova equipe
app.post('/api/equipes', verificarToken, async (req, res) => {
    try {
        const dadosEquipe = req.body;
        
        // Verificar se nome da equipe já existe
        const equipeExistente = await equipeService.getByNome(dadosEquipe.nome_equipe);
        
        if (equipeExistente) {
            return res.status(400).json({
                success: false,
                message: `Nome da equipe "${dadosEquipe.nome_equipe}" já está cadastrado no sistema.`
            });
        }
        
        // Criar equipe
        const novaEquipe = await equipeService.create(dadosEquipe);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'CREATE_EQUIPE',
            detalhes: `Equipe criada: ${dadosEquipe.nome_equipe}`,
            tipo_usuario: req.user.tipo,
            resource_type: 'equipe',
            resource_id: novaEquipe
        });
        
        res.json({
            success: true,
            message: 'Equipe criada com sucesso',
            data: { id: novaEquipe }
        });
        
    } catch (error) {
        console.error('Erro ao criar equipe:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para listar categorias
app.get('/api/categorias', verificarToken, async (req, res) => {
    try {
        const categorias = await categoriaService.getAll();
        
        res.json({
            success: true,
            data: categorias
        });
        
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para listar competições
app.get('/api/competicoes', verificarToken, async (req, res) => {
    try {
        const competicoes = await competicaoService.getAll();
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'LIST_COMPETICOES',
            detalhes: 'Listagem de competições',
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: competicoes
        });
        
    } catch (error) {
        console.error('Erro ao buscar competições:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para criar nova competição
app.post('/api/competicoes', verificarToken, async (req, res) => {
    try {
        const dadosCompeticao = req.body;
        
        // Criar competição
        const novaCompeticao = await competicaoService.create(dadosCompeticao);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'CREATE_COMPETICAO',
            detalhes: `Competição criada: ${dadosCompeticao.nome_competicao}`,
            tipo_usuario: req.user.tipo,
            resource_type: 'competicao',
            resource_id: novaCompeticao
        });
        
        res.json({
            success: true,
            message: 'Competição criada com sucesso',
            data: { id: novaCompeticao }
        });
        
    } catch (error) {
        console.error('Erro ao criar competição:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para listar inscrições
app.get('/api/inscricoes', verificarToken, async (req, res) => {
    try {
        const { competicaoId } = req.query;
        
        let inscricoes;
        if (competicaoId) {
            inscricoes = await inscricaoService.getByCompeticao(competicaoId);
        } else {
            inscricoes = await inscricaoService.getAll();
        }
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'LIST_INSCRICOES',
            detalhes: `Listagem de inscrições${competicaoId ? ` para competição ${competicaoId}` : ''}`,
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: inscricoes
        });
        
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para criar nova inscrição
app.post('/api/inscricoes', verificarToken, async (req, res) => {
    try {
        const dadosInscricao = req.body;
        
        // Verificar se atleta já está inscrito na competição
        const inscricaoExistente = await inscricaoService.getByAtletaAndCompeticao(
            dadosInscricao.id_atleta, 
            dadosInscricao.id_competicao
        );
        
        if (inscricaoExistente) {
            return res.status(400).json({
                success: false,
                message: 'Atleta já está inscrito nesta competição'
            });
        }
        
        // Criar inscrição
        const novaInscricao = await inscricaoService.create(dadosInscricao);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'CREATE_INSCRICAO',
            detalhes: `Inscrição criada para atleta ${dadosInscricao.id_atleta}`,
            tipo_usuario: req.user.tipo,
            resource_type: 'inscricao',
            resource_id: novaInscricao
        });
        
        res.json({
            success: true,
            message: 'Inscrição criada com sucesso',
            data: { id: novaInscricao }
        });
        
    } catch (error) {
        console.error('Erro ao criar inscrição:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para listar logs de atividades
app.get('/api/logs', verificarToken, async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const logs = await logService.getAll(parseInt(limit), parseInt(offset));
        
        res.json({
            success: true,
            data: logs
        });
        
    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para limpar logs
app.delete('/api/logs', verificarToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores podem limpar logs.'
            });
        }
        
        // Limpar logs
        await logService.clearAll();
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'CLEAR_LOGS',
            detalhes: 'Logs de atividades limpos',
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            message: 'Logs limpos com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao limpar logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para upload de arquivos
app.post('/api/upload', verificarToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi enviado'
            });
        }
        
        // Upload para Supabase Storage
        const fileData = await fileService.upload(req.file);
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'UPLOAD_FILE',
            detalhes: `Arquivo enviado: ${req.file.originalname}`,
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            message: 'Arquivo enviado com sucesso',
            data: fileData
        });
        
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para obter usuários
app.get('/api/usuarios', verificarToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores podem listar usuários.'
            });
        }
        
        const usuarios = await usuarioService.getAll();
        
        // Log da atividade
        await logService.create({
            usuario: req.user.nome,
            acao: 'LIST_USUARIOS',
            detalhes: 'Listagem de usuários',
            tipo_usuario: req.user.tipo
        });
        
        res.json({
            success: true,
            data: usuarios
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para criar usuário
app.post('/api/usuarios', verificarToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.tipo !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores podem criar usuários.'
            });
        }
        
        const dadosUsuario = req.body;
        
        // Verificar se login já existe
        const usuarioExistente = await usuarioService.getByLogin(dadosUsuario.login);
        
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'Login já existe'
            });
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(dadosUsuario.senha, 10);
        
        // Se o usuário não for admin, criar equipe automaticamente
        if (dadosUsuario.tipo === 'usuario') {
            // Criar equipe primeiro
            const novaEquipe = await equipeService.create({
                nome_equipe: dadosUsuario.nome_equipe || dadosUsuario.nome,
                cidade: dadosUsuario.estado || 'A definir',
                tecnico: dadosUsuario.nome,
                telefone: '',
                email: '',
                status: 'ATIVA'
            });
            
            // Criar o usuário com referência à equipe
            const novoUsuario = await usuarioService.create({
                ...dadosUsuario,
                senha: hashedPassword,
                chefe_equipe: true,
                id_equipe: novaEquipe
            });
            
            // Atualizar a equipe com o ID do chefe
            await equipeService.update(novaEquipe, { id_chefe: novoUsuario });
            
            // Log da atividade
            await logService.create({
                usuario: req.user.nome,
                acao: 'CREATE_USUARIO',
                detalhes: `Usuário criado: ${dadosUsuario.nome}`,
                tipo_usuario: req.user.tipo,
                resource_type: 'usuario',
                resource_id: novoUsuario
            });
            
            res.json({
                success: true,
                message: 'Usuário e equipe criados com sucesso',
                data: { id: novoUsuario }
            });
        } else {
            // Para administradores, criar normalmente sem equipe
            const novoUsuario = await usuarioService.create({
                ...dadosUsuario,
                senha: hashedPassword,
                chefe_equipe: false
            });
            
            // Log da atividade
            await logService.create({
                usuario: req.user.nome,
                acao: 'CREATE_USUARIO',
                detalhes: `Usuário criado: ${dadosUsuario.nome}`,
                tipo_usuario: req.user.tipo,
                resource_type: 'usuario',
                resource_id: novoUsuario
            });
            
            res.json({
                success: true,
                message: 'Usuário criado com sucesso',
                data: { id: novoUsuario }
            });
        }
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// =====================================================
// ROTAS DAS NOVAS APIs
// =====================================================

// Usar as rotas das APIs
app.use('/api/atletas', verificarToken, atletasRoutes);
app.use('/api/documentos', verificarToken, documentosRoutes);
app.use('/api/documentos-storage', verificarToken, documentosStorageRoutes);
app.use('/api/carteirinhas', verificarToken, carteirinhasRoutes);
app.use('/api/exportacao', verificarToken, exportacaoRoutes);

// =====================================================
// ROTAS EXISTENTES (MANTER COMPATIBILIDADE)
// =====================================================

// Rota para verificar status da conexão
app.get('/api/status', async (req, res) => {
    try {
        // Testar conexão com Supabase
        const usuarios = await usuarioService.getAll();
        
        res.json({
            success: true,
            message: 'Conexão com Supabase OK',
            timestamp: new Date().toISOString(),
            totalUsuarios: usuarios.length
        });
        
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na conexão com Supabase',
            error: error.message
        });
    }
});

// Rota para servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar servidor
async function iniciarServidor() {
    try {
        console.log('🚀 Iniciando servidor FEPERJ...');
        
        // Conectar ao Supabase
        const conectado = await conectarSupabase();
        if (!conectado) {
            console.log('❌ Falha na conexão com Supabase. Servidor será iniciado mesmo assim para debug.');
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🌐 Acesse: http://localhost:${PORT}`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais para encerramento graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
iniciarServidor();
