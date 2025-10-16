// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || null;

// Verificar se as variáveis de ambiente estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️ Configuração do Supabase não encontrada. Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY');
    console.warn('⚠️ Usando valores padrão que não funcionarão em produção');
}

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Criar cliente com service key (para operações administrativas)
const supabaseAdmin = SUPABASE_SERVICE_KEY ? 
    createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : 
    supabase;

// Função para testar conexão
async function testSupabaseConnection() {
    try {
        console.log('🔄 Conectando ao Supabase...');
        
        // Testar conexão fazendo uma query simples
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('❌ Erro ao conectar ao Supabase:', error.message);
            return false;
        }
        
        console.log('✅ Conectado ao Supabase com sucesso');
        console.log('📊 URL:', SUPABASE_URL);
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao conectar ao Supabase:', error);
        return false;
    }
}

// Função para criar usuário admin inicial
async function criarAdminInicial() {
    try {
        // Verificar se admin já existe
        const { data: admin, error: searchError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('login', '15119236790')
            .single();
        
        if (searchError && searchError.code !== 'PGRST116') {
            throw searchError;
        }
        
        if (!admin) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('49912170', 10);
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert({
                    login: '15119236790',
                    senha: hashedPassword,
                    nome: 'Administrador FEPERJ',
                    tipo: 'admin',
                    ativo: true,
                    chefe_equipe: false
                });
            
            if (insertError) {
                throw insertError;
            }
            
            console.log('✅ Usuário admin criado com sucesso');
        } else {
            console.log('ℹ️ Usuário admin já existe');
        }
    } catch (error) {
        console.log('❌ Erro ao criar admin:', error);
    }
}

// Função para criar dados de exemplo (equipes de teste removidas)
async function criarDadosExemplo() {
    try {
        // Verificar se já existem dados
        const { data: equipes, error: equipesError } = await supabase
            .from('equipes')
            .select('*');
        
        if (equipesError) {
            throw equipesError;
        }
        
        if (equipes && equipes.length > 0) {
            console.log('ℹ️ Dados de exemplo já existem');
            return;
        }
        
        // Equipes de teste removidas - sistema funciona sem equipes fictícias
        console.log('ℹ️ Sistema configurado para funcionar sem equipes de teste');
        console.log('ℹ️ Atletas podem ser cadastrados sem equipe definida');
        
    } catch (error) {
        console.log('❌ Erro ao verificar dados de exemplo:', error);
    }
}

// Função para verificar e criar configurações iniciais
async function inicializarConfiguracoes() {
    try {
        // Criar tipos de competição padrão
        const { data: tiposExistentes } = await supabase
            .from('configuracoes')
            .select('id')
            .eq('chave', 'tipos_competicao')
            .single();
        
        if (!tiposExistentes) {
            await supabase
                .from('configuracoes')
                .insert({
                    chave: 'tipos_competicao',
                    valor: JSON.stringify(['S', 'AST', 'T']),
                    descricao: 'Tipos de competição disponíveis'
                });
            
            console.log('✅ Configurações padrão criadas');
        }
        
        // Criar anuidade padrão
        const { data: anuidadeExistente } = await supabase
            .from('anuidades')
            .select('id')
            .eq('ativo', true)
            .single();
        
        if (!anuidadeExistente) {
            await supabase
                .from('anuidades')
                .insert({
                    ano: new Date().getFullYear(),
                    valor: 50.00,
                    ativo: true,
                    descricao: 'Anuidade padrão'
                });
            
            console.log('✅ Anuidade padrão criada');
        }
        
        // Criar anuidade de equipe padrão
        const { data: anuidadeEquipeExistente } = await supabase
            .from('anuidades_equipe')
            .select('id')
            .eq('ativo', true)
            .single();
        
        if (!anuidadeEquipeExistente) {
            await supabase
                .from('anuidades_equipe')
                .insert({
                    ano: new Date().getFullYear(),
                    valor: 100.00,
                    ativo: true,
                    descricao: 'Anuidade de equipe padrão'
                });
            
            console.log('✅ Anuidade de equipe padrão criada');
        }
        
    } catch (error) {
        console.log('❌ Erro ao inicializar configurações:', error);
    }
}

module.exports = {
    supabase,
    supabaseAdmin,
    testSupabaseConnection,
    criarAdminInicial,
    criarDadosExemplo,
    inicializarConfiguracoes
};
