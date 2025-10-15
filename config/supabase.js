// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima';

// Verificar se as variáveis de ambiente estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️ Configuração do Supabase não encontrada. Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY');
    console.warn('⚠️ Usando valores padrão que não funcionarão em produção');
}

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Função para criar dados de exemplo
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
        
        // Inserir equipes de exemplo
        const equipesExemplo = [
            {
                nome_equipe: 'Power Rio',
                cidade: 'Rio de Janeiro',
                tecnico: 'João Silva',
                telefone: '(21) 99999-1111',
                email: 'powerrio@email.com',
                status: 'ATIVA'
            },
            {
                nome_equipe: 'Força Carioca',
                cidade: 'Rio de Janeiro',
                tecnico: 'Maria Santos',
                telefone: '(21) 99999-2222',
                email: 'forcacarioca@email.com',
                status: 'ATIVA'
            },
            {
                nome_equipe: 'Levantadores RJ',
                cidade: 'Niterói',
                tecnico: 'Pedro Costa',
                telefone: '(21) 99999-3333',
                email: 'levantadores@email.com',
                status: 'ATIVA'
            }
        ];
        
        const { error: insertEquipesError } = await supabase
            .from('equipes')
            .insert(equipesExemplo);
        
        if (insertEquipesError) {
            throw insertEquipesError;
        }
        
        console.log('✅ Dados de exemplo criados com sucesso');
    } catch (error) {
        console.log('❌ Erro ao criar dados de exemplo:', error);
    }
}

module.exports = {
    supabase,
    testSupabaseConnection,
    criarAdminInicial,
    criarDadosExemplo
};
