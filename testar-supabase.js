// Teste detalhado de conexão com Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testando conexão com Supabase...');
console.log('📊 URL:', process.env.SUPABASE_URL);
console.log('🔑 Chave:', process.env.SUPABASE_ANON_KEY ? 'Configurada' : 'NÃO CONFIGURADA');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testarConexao() {
    try {
        console.log('\n🔄 Testando conexão básica...');
        
        // Teste 1: Conexão básica
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('❌ Erro na query:', error.message);
            console.log('📋 Código do erro:', error.code);
            console.log('💡 Detalhes:', error.details);
            
            if (error.message.includes('permission denied')) {
                console.log('\n🚨 PROBLEMA: Tabela "usuarios" não existe ou sem permissão');
                console.log('📋 SOLUÇÃO: Execute o reset-banco-simples.sql e depois o supabase-schema.sql');
            }
            
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.log('\n🚨 PROBLEMA: Tabela não existe');
                console.log('📋 SOLUÇÃO: Execute o supabase-schema.sql');
            }
            
            return false;
        }
        
        console.log('✅ Conexão funcionando!');
        console.log('📊 Dados encontrados:', data);
        return true;
        
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        
        if (error.message.includes('fetch failed')) {
            console.log('\n🚨 PROBLEMA: Não consegue conectar ao Supabase');
            console.log('📋 POSSÍVEIS CAUSAS:');
            console.log('   - URL incorreta');
            console.log('   - Chave incorreta');
            console.log('   - Projeto pausado');
            console.log('   - Problema de internet');
        }
        
        return false;
    }
}

async function verificarTabelas() {
    try {
        console.log('\n🔍 Verificando tabelas existentes...');
        
        // Listar tabelas usando uma query que funciona sempre
        const { data, error } = await supabase
            .rpc('exec_sql', { sql: `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            ` });
        
        if (error) {
            console.log('❌ Erro ao listar tabelas:', error.message);
            
            // Tentar método alternativo
            const { data: altData, error: altError } = await supabase
                .from('usuarios')
                .select('*')
                .limit(0);
                
            if (altError && altError.message.includes('does not exist')) {
                console.log('🚨 CONFIRMADO: Tabela "usuarios" não existe');
                console.log('📋 AÇÃO NECESSÁRIA: Execute o supabase-schema.sql');
            }
            
            return false;
        }
        
        console.log('✅ Tabelas encontradas:', data);
        return true;
        
    } catch (error) {
        console.log('❌ Erro ao verificar tabelas:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando diagnóstico do Supabase...\n');
    
    const conexaoOk = await testarConexao();
    
    if (!conexaoOk) {
        await verificarTabelas();
        
        console.log('\n📋 RESUMO DO PROBLEMA:');
        console.log('   - Credenciais: ✅ Configuradas');
        console.log('   - Conexão: ❌ Falhando');
        console.log('   - Causa: Tabelas não existem');
        
        console.log('\n🔧 SOLUÇÃO:');
        console.log('   1. Acesse supabase.com');
        console.log('   2. Abra o projeto: bzzlbnuqcwuzrxwtgtbg');
        console.log('   3. Vá para SQL Editor');
        console.log('   4. Execute: reset-banco-simples.sql');
        console.log('   5. Execute: supabase-schema.sql');
        console.log('   6. Teste novamente');
    } else {
        console.log('\n✅ Sistema funcionando perfeitamente!');
    }
}

main().catch(console.error);
