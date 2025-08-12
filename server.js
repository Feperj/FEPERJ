const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// Rota para buscar atletas
app.get('/api/atletas', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        const atletas = await atletasCollection.find({}).toArray();
        
        // Converter ObjectId para string
        const atletasFormatados = atletas.map(atleta => ({
            ...atleta,
            _id: atleta._id.toString()
        }));
        
        res.json(atletasFormatados);
    } catch (error) {
        console.log('❌ Erro ao buscar atletas:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para criar atleta
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
            matricula: gerarMatricula(req.body.cpf)
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

// Rota para buscar equipes
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

// Rota para criar equipe
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

// Rota para buscar competições
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

// Rota para criar competição
app.post('/api/competicoes', autenticarToken, async (req, res) => {
    try {
        const competicoesCollection = db.collection('competicoes');
        
        const competicao = {
            ...req.body,
            data_criacao: new Date()
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

// Rota para buscar inscrições
app.get('/api/inscricoes', autenticarToken, async (req, res) => {
    try {
        const inscricoesCollection = db.collection('inscricoes');
        const inscricoes = await inscricoesCollection.find({}).toArray();
        
        // Buscar dados relacionados
        const atletasCollection = db.collection('atletas');
        const competicoesCollection = db.collection('competicoes');
        
        const inscricoesCompleta = await Promise.all(
            inscricoes.map(async (inscricao) => {
                const atleta = await atletasCollection.findOne({ _id: new MongoClient.ObjectId(inscricao.atleta_id) });
                const competicao = await competicoesCollection.findOne({ _id: new MongoClient.ObjectId(inscricao.competicao_id) });
                
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

// Rota para criar inscrição
app.post('/api/inscricoes', autenticarToken, async (req, res) => {
    try {
        const inscricoesCollection = db.collection('inscricoes');
        
        const inscricao = {
            ...req.body,
            data_inscricao: new Date()
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

// Rota para dashboard/estatísticas
app.get('/api/dashboard', autenticarToken, async (req, res) => {
    try {
        const atletasCollection = db.collection('atletas');
        const equipesCollection = db.collection('equipes');
        const competicoesCollection = db.collection('competicoes');
        const inscricoesCollection = db.collection('inscricoes');
        
        const totalAtletas = await atletasCollection.countDocuments({});
        const totalEquipes = await equipesCollection.countDocuments({});
        const totalCompeticoes = await competicoesCollection.countDocuments({});
        const totalInscricoes = await inscricoesCollection.countDocuments({});
        
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
        
        res.json({
            totais: {
                atletas: totalAtletas,
                equipes: totalEquipes,
                competicoes: totalCompeticoes,
                inscricoes: totalInscricoes
            },
            atletas_por_equipe: atletasPorEquipe
        });
        
    } catch (error) {
        console.log('❌ Erro ao buscar dashboard:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

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
