const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://jamarestudo:49912170Lacrimosa1!@familiajamar.wu9knb3.mongodb.net/?retryWrites=true&w=majority&appName=Familiajamar';
const DB_NAME = 'project0';

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

let db = null;
let client = null;

// Função para conectar ao MongoDB Atlas
async function conectarMongoDB() {
    try {
        console.log('🔄 Conectando ao MongoDB Atlas...');
        
        client = new MongoClient(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        await client.connect();
        db = client.db(DB_NAME);
        
        console.log('✅ Conectado ao MongoDB Atlas com sucesso');
        console.log('📊 Banco:', DB_NAME);
        
        // Criar usuário admin inicial se não existir
        await criarAdminInicial();
        
        // Criar dados de exemplo se não existirem
        await criarDadosExemplo();
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao conectar ao MongoDB Atlas:', error.message);
        return false;
    }
}

// Função para criar usuário admin inicial
async function criarAdminInicial() {
    try {
        const usuariosCollection = db.collection('usuarios');
        const admin = await usuariosCollection.findOne({ username: '15119236790' });
        
        if (!admin) {
            const hashedPassword = await bcrypt.hash('49912170', 10);
            await usuariosCollection.insertOne({
                username: '15119236790',
                password: hashedPassword,
                nome: 'Administrador FEPERJ',
                email: 'admin@feperj.com',
                nivel_acesso: 'admin',
                data_criacao: new Date()
            });
            console.log('✅ Usuário admin criado com sucesso');
        } else {
            console.log('ℹ️ Usuário admin já existe');
        }
    } catch (error) {
        console.log('❌ Erro ao criar admin:', error.message);
    }
}

// Função para criar dados de exemplo
async function criarDadosExemplo() {
    try {
        // Verificar se já existem dados
        const equipesCollection = db.collection('equipes');
        const count = await equipesCollection.countDocuments();
        
        if (count > 0) {
            console.log('ℹ️ Dados de exemplo já existem');
            return;
        }
        
        // Inserir equipes de exemplo
        const equipes = [
            {
                nome: 'Power Rio',
                cidade: 'Rio de Janeiro',
                tecnico: 'João Silva',
                telefone: '(21) 99999-1111',
                email: 'powerrio@email.com',
                data_criacao: new Date()
            },
            {
                nome: 'Força Carioca',
                cidade: 'Rio de Janeiro',
                tecnico: 'Maria Santos',
                telefone: '(21) 99999-2222',
                email: 'forcacarioca@email.com',
                data_criacao: new Date()
            },
            {
                nome: 'Levantadores RJ',
                cidade: 'Niterói',
                tecnico: 'Pedro Costa',
                telefone: '(21) 99999-3333',
                email: 'levantadores@email.com',
                data_criacao: new Date()
            }
        ];
        
        await equipesCollection.insertMany(equipes);
        
        // Inserir categorias de exemplo
        const categoriasCollection = db.collection('categorias');
        const categorias = [
            { nome: '59kg Feminino', peso_minimo: 0, peso_maximo: 59, sexo: 'F', descricao: 'Até 59kg - Feminino' },
            { nome: '66kg Feminino', peso_minimo: 59.01, peso_maximo: 66, sexo: 'F', descricao: '59.01kg a 66kg - Feminino' },
            { nome: '74kg Feminino', peso_minimo: 66.01, peso_maximo: 74, sexo: 'F', descricao: '66.01kg a 74kg - Feminino' },
            { nome: '83kg Feminino', peso_minimo: 74.01, peso_maximo: 83, sexo: 'F', descricao: '74.01kg a 83kg - Feminino' },
            { nome: '84kg+ Feminino', peso_minimo: 83.01, peso_maximo: 999, sexo: 'F', descricao: 'Acima de 83kg - Feminino' },
            { nome: '66kg Masculino', peso_minimo: 0, peso_maximo: 66, sexo: 'M', descricao: 'Até 66kg - Masculino' },
            { nome: '74kg Masculino', peso_minimo: 66.01, peso_maximo: 74, sexo: 'M', descricao: '66.01kg a 74kg - Masculino' },
            { nome: '83kg Masculino', peso_minimo: 74.01, peso_maximo: 83, sexo: 'M', descricao: '74.01kg a 83kg - Masculino' },
            { nome: '93kg Masculino', peso_minimo: 83.01, peso_maximo: 93, sexo: 'M', descricao: '83.01kg a 93kg - Masculino' },
            { nome: '105kg Masculino', peso_minimo: 93.01, peso_maximo: 105, sexo: 'M', descricao: '93.01kg a 105kg - Masculino' },
            { nome: '120kg Masculino', peso_minimo: 105.01, peso_maximo: 120, sexo: 'M', descricao: '105.01kg a 120kg - Masculino' },
            { nome: '120kg+ Masculino', peso_minimo: 120.01, peso_maximo: 999, sexo: 'M', descricao: 'Acima de 120kg - Masculino' }
        ];
        
        await categoriasCollection.insertMany(categorias);
        
        console.log('✅ Dados de exemplo criados com sucesso');
        
    } catch (error) {
        console.log('❌ Erro ao criar dados de exemplo:', error.message);
    }
}

// Middleware de autenticação
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Rota de login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }
        
        const usuariosCollection = db.collection('usuarios');
        const usuario = await usuariosCollection.findOne({ username });
        
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const senhaValida = await bcrypt.compare(password, usuario.password);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: usuario._id, 
                username: usuario.username,
                nivel_acesso: usuario.nivel_acesso 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Remover senha do objeto de resposta
        delete usuario.password;
        
        res.json({
            success: true,
            token,
            usuario
        });
        
    } catch (error) {
        console.log('❌ Erro no login:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para verificar token
app.get('/api/verificar-token', autenticarToken, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// ==================== ROTAS DE ATLETAS ====================

// Buscar atletas
app.get('/api/atletas', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        const atletas = await atletasCollection.find({}).toArray();
        
        // Buscar dados relacionados
        const equipesCollection = db.collection('equipes');
        const categoriasCollection = db.collection('categorias');
        
        const atletasCompletos = await Promise.all(
            atletas.map(async (atleta) => {
                const equipe = atleta.id_equipe ? await equipesCollection.findOne({ _id: new ObjectId(atleta.id_equipe) }) : null;
                const categoria = atleta.id_categoria ? await categoriasCollection.findOne({ _id: new ObjectId(atleta.id_categoria) }) : null;
                
                return {
                    ...atleta,
                    _id: atleta._id.toString(),
                    equipe_nome: equipe ? equipe.nome : null,
                    categoria_nome: categoria ? categoria.nome : null
                };
            })
        );
        
        res.json(atletasCompletos);
    } catch (error) {
        console.log('❌ Erro ao buscar atletas:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar atleta
app.post('/api/atletas', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        
        // Verificar se CPF já existe
        const cpfExistente = await atletasCollection.findOne({ cpf: req.body.cpf });
        if (cpfExistente) {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }
        
        const atleta = {
            ...req.body,
            data_criacao: new Date(),
            matricula: gerarMatricula(req.body.cpf),
            status: 'ATIVO'
        };
        
        const result = await atletasCollection.insertOne(atleta);
        
        res.json({
            success: true,
            id: result.insertedId.toString(),
            message: 'Atleta criado com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao criar atleta:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar atleta
app.put('/api/atletas/:id', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        const { id } = req.params;
        
        // Verificar se CPF já existe em outro atleta
        const cpfExistente = await atletasCollection.findOne({ 
            cpf: req.body.cpf, 
            _id: { $ne: new ObjectId(id) } 
        });
        if (cpfExistente) {
            return res.status(400).json({ error: 'CPF já cadastrado para outro atleta' });
        }
        
        const result = await atletasCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...req.body, data_atualizacao: new Date() } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Atleta não encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Atleta atualizado com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao atualizar atleta:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Excluir atleta
app.delete('/api/atletas/:id', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        const { id } = req.params;
        
        const result = await atletasCollection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Atleta não encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Atleta excluído com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao excluir atleta:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE EQUIPES ====================

// Buscar equipes
app.get('/api/equipes', autenticarToken, async (req, res) => {
    try {
        const equipesCollection = db.collection('equipes');
        const equipes = await equipesCollection.find({}).toArray();
        
        // Contar atletas por equipe
        const atletasCollection = db.collection('atletas');
        const equipesComContagem = await Promise.all(
            equipes.map(async (equipe) => {
                const count = await atletasCollection.countDocuments({ id_equipe: equipe._id.toString() });
                return {
                    ...equipe,
                    _id: equipe._id.toString(),
                    total_atletas: count
                };
            })
        );
        
        res.json(equipesComContagem);
    } catch (error) {
        console.log('❌ Erro ao buscar equipes:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar equipe
app.post('/api/equipes', autenticarToken, async (req, res) => {
    try {
        const equipesCollection = db.collection('equipes');
        
        // Verificar se equipe já existe
        const equipeExistente = await equipesCollection.findOne({ nome: req.body.nome });
        if (equipeExistente) {
            return res.status(400).json({ error: 'Equipe já existe' });
        }
        
        const equipe = {
            ...req.body,
            data_criacao: new Date()
        };
        
        const result = await equipesCollection.insertOne(equipe);
        
        res.json({
            success: true,
            id: result.insertedId.toString(),
            message: 'Equipe criada com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao criar equipe:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE CATEGORIAS ====================

// Buscar categorias
app.get('/api/categorias', autenticarToken, async (req, res) => {
    try {
        const categoriasCollection = db.collection('categorias');
        const categorias = await categoriasCollection.find({}).toArray();
        
        const categoriasFormatadas = categorias.map(categoria => ({
            ...categoria,
            _id: categoria._id.toString()
        }));
        
        res.json(categoriasFormatadas);
    } catch (error) {
        console.log('❌ Erro ao buscar categorias:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE COMPETIÇÕES ====================

// Buscar competições
app.get('/api/competicoes', autenticarToken, async (req, res) => {
    try {
        const competicoesCollection = db.collection('competicoes');
        const competicoes = await competicoesCollection.find({}).toArray();
        
        // Contar inscrições por competição
        const inscricoesCollection = db.collection('inscricoes');
        const competicoesComContagem = await Promise.all(
            competicoes.map(async (competicao) => {
                const count = await inscricoesCollection.countDocuments({ competicao_id: competicao._id.toString() });
                return {
                    ...competicao,
                    _id: competicao._id.toString(),
                    total_inscricoes: count
                };
            })
        );
        
        res.json(competicoesComContagem);
    } catch (error) {
        console.log('❌ Erro ao buscar competições:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar competição
app.post('/api/competicoes', autenticarToken, async (req, res) => {
    try {
        const competicoesCollection = db.collection('competicoes');
        
        const competicao = {
            ...req.body,
            data_criacao: new Date(),
            status: 'AGENDADA'
        };
        
        const result = await competicoesCollection.insertOne(competicao);
        
        res.json({
            success: true,
            id: result.insertedId.toString(),
            message: 'Competição criada com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao criar competição:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE INSCRIÇÕES ====================

// Buscar inscrições
app.get('/api/inscricoes', autenticarToken, async (req, res) => {
    try {
        const inscricoesCollection = db.collection('inscricoes');
        const inscricoes = await inscricoesCollection.find({}).toArray();
        
        // Buscar dados relacionados
        const atletasCollection = db.collection('atletas');
        const competicoesCollection = db.collection('competicoes');
        
        const inscricoesCompleta = await Promise.all(
            inscricoes.map(async (inscricao) => {
                const atleta = await atletasCollection.findOne({ _id: new ObjectId(inscricao.atleta_id) });
                const competicao = await competicoesCollection.findOne({ _id: new ObjectId(inscricao.competicao_id) });
                
                return {
                    ...inscricao,
                    _id: inscricao._id.toString(),
                    atleta_nome: atleta ? atleta.nome : 'N/A',
                    competicao_nome: competicao ? competicao.nome : 'N/A'
                };
            })
        );
        
        res.json(inscricoesCompleta);
    } catch (error) {
        console.log('❌ Erro ao buscar inscrições:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar inscrição
app.post('/api/inscricoes', autenticarToken, async (req, res) => {
    try {
        const inscricoesCollection = db.collection('inscricoes');
        
        // Verificar se atleta já está inscrito nesta competição
        const inscricaoExistente = await inscricoesCollection.findOne({
            atleta_id: req.body.atleta_id,
            competicao_id: req.body.competicao_id
        });
        
        if (inscricaoExistente) {
            return res.status(400).json({ error: 'Atleta já está inscrito nesta competição' });
        }
        
        const inscricao = {
            ...req.body,
            data_inscricao: new Date(),
            status: 'INSCRITO'
        };
        
        const result = await inscricoesCollection.insertOne(inscricao);
        
        res.json({
            success: true,
            id: result.insertedId.toString(),
            message: 'Inscrição criada com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao criar inscrição:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE RESULTADOS ====================

// Buscar resultados
app.get('/api/resultados', autenticarToken, async (req, res) => {
    try {
        const resultadosCollection = db.collection('resultados');
        const resultados = await resultadosCollection.find({}).toArray();
        
        // Buscar dados relacionados
        const atletasCollection = db.collection('atletas');
        const competicoesCollection = db.collection('competicoes');
        
        const resultadosCompletos = await Promise.all(
            resultados.map(async (resultado) => {
                const atleta = await atletasCollection.findOne({ _id: new ObjectId(resultado.atleta_id) });
                const competicao = await competicoesCollection.findOne({ _id: new ObjectId(resultado.competicao_id) });
                
                return {
                    ...resultado,
                    _id: resultado._id.toString(),
                    atleta_nome: atleta ? atleta.nome : 'N/A',
                    competicao_nome: competicao ? competicao.nome : 'N/A'
                };
            })
        );
        
        res.json(resultadosCompletos);
    } catch (error) {
        console.log('❌ Erro ao buscar resultados:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar resultado
app.post('/api/resultados', autenticarToken, async (req, res) => {
    try {
        const resultadosCollection = db.collection('resultados');
        
        const resultado = {
            ...req.body,
            data_registro: new Date(),
            total: (parseFloat(req.body.agachamento) || 0) + (parseFloat(req.body.supino) || 0) + (parseFloat(req.body.terra) || 0)
        };
        
        const result = await resultadosCollection.insertOne(resultado);
        
        res.json({
            success: true,
            id: result.insertedId.toString(),
            message: 'Resultado registrado com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao criar resultado:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE RELATÓRIOS ====================

// Dashboard/estatísticas
app.get('/api/dashboard', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        const equipesCollection = db.collection('equipes');
        const competicoesCollection = db.collection('competicoes');
        const inscricoesCollection = db.collection('inscricoes');
        const resultadosCollection = db.collection('resultados');
        
        const totalAtletas = await atletasCollection.countDocuments({});
        const totalEquipes = await equipesCollection.countDocuments({});
        const totalCompeticoes = await competicoesCollection.countDocuments({});
        const totalInscricoes = await inscricoesCollection.countDocuments({});
        const totalResultados = await resultadosCollection.countDocuments({});
        
        // Atletas por equipe
        const pipeline = [
            {
                $lookup: {
                    from: 'equipes',
                    localField: 'id_equipe',
                    foreignField: '_id',
                    as: 'equipe'
                }
            },
            {
                $group: {
                    _id: '$id_equipe',
                    count: { $sum: 1 },
                    equipe_nome: { $first: '$equipe.nome' }
                }
            },
            { $sort: { count: -1 } }
        ];
        
        const atletasPorEquipe = await atletasCollection.aggregate(pipeline).toArray();
        
        // Top 10 maiores totais
        const top10Totais = await resultadosCollection
            .find({})
            .sort({ total: -1 })
            .limit(10)
            .toArray();
        
        res.json({
            totais: {
                atletas: totalAtletas,
                equipes: totalEquipes,
                competicoes: totalCompeticoes,
                inscricoes: totalInscricoes,
                resultados: totalResultados
            },
            atletas_por_equipe: atletasPorEquipe,
            top10_totais: top10Totais
        });
        
    } catch (error) {
        console.log('❌ Erro ao buscar dashboard:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE UPLOAD ====================

// Upload de documentos
app.post('/api/upload-documento', autenticarToken, upload.single('documento'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }
        
        const { atleta_id, tipo_documento } = req.body;
        
        // Atualizar atleta com o caminho do documento
        const atletasCollection = db.collection('atletas');
        const updateField = {};
        updateField[tipo_documento] = req.file.filename;
        
        await atletasCollection.updateOne(
            { _id: new ObjectId(atleta_id) },
            { $set: updateField }
        );
        
        res.json({
            success: true,
            filename: req.file.filename,
            message: 'Documento enviado com sucesso'
        });
        
    } catch (error) {
        console.log('❌ Erro ao fazer upload:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS AUXILIARES ====================

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Sistema FEPERJ funcionando',
        timestamp: new Date().toISOString()
    });
});

// Função para gerar matrícula
function gerarMatricula(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const ultimosDigitos = cpfLimpo.slice(-4);
    const timestamp = moment().format('YYYYMMDDHHmmss');
    return `FEP${timestamp}${ultimosDigitos}`;
}

// Rota para servir páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/atletas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'atletas.html'));
});

app.get('/equipes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'equipes.html'));
});

app.get('/competicoes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'competicoes.html'));
});

app.get('/inscricoes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'inscricoes.html'));
});

app.get('/resultados', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resultados.html'));
});

app.get('/relatorios', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'relatorios.html'));
});

// Inicializar servidor
async function iniciarServidor() {
    const conectado = await conectarMongoDB();
    
    if (!conectado) {
        console.log('❌ Não foi possível conectar ao MongoDB. Servidor não iniciado.');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log('🚀 Servidor FEPERJ iniciado na porta', PORT);
        console.log('📱 Sistema online em: http://localhost:' + PORT);
        console.log('🔗 MongoDB Atlas conectado');
    });
}

iniciarServidor();
