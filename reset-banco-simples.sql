-- =====================================================
-- RESET SIMPLES DO BANCO SUPABASE - SISTEMA FEPERJ
-- =====================================================
-- ⚠️  Este script remove apenas as tabelas principais
-- Mantém extensões e configurações do Supabase
-- =====================================================

-- Desabilitar RLS temporariamente
SET session_replication_role = replica;

-- =====================================================
-- REMOVER TABELAS EM ORDEM CORRETA
-- =====================================================

-- Tabelas dependentes
DROP TABLE IF EXISTS inscricoes_competicao CASCADE;
DROP TABLE IF EXISTS pagamentos_anuidade CASCADE;
DROP TABLE IF EXISTS anuidades_equipe CASCADE;
DROP TABLE IF EXISTS documentos_contabeis CASCADE;
DROP TABLE IF EXISTS anuidades CASCADE;
DROP TABLE IF EXISTS log_atividades CASCADE;
DROP TABLE IF EXISTS atletas CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS competicoes CASCADE;

-- Tabelas principais
DROP TABLE IF EXISTS equipes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;

-- =====================================================
-- REMOVER FUNÇÕES
-- =====================================================

DROP FUNCTION IF EXISTS atualizar_data_atualizacao() CASCADE;
DROP FUNCTION IF EXISTS gerar_matricula_atleta() CASCADE;
DROP FUNCTION IF EXISTS calcular_total_anuidade_equipe() CASCADE;
DROP FUNCTION IF EXISTS verificar_limite_inscricoes() CASCADE;
DROP FUNCTION IF EXISTS calcular_valor_inscricao() CASCADE;

-- =====================================================
-- REMOVER SEQUÊNCIAS
-- =====================================================

DROP SEQUENCE IF EXISTS seq_matricula_atleta CASCADE;

-- =====================================================
-- REABILITAR RLS
-- =====================================================

SET session_replication_role = DEFAULT;

-- =====================================================
-- CONFIRMAÇÃO
-- =====================================================

SELECT '✅ Reset concluído! Execute agora o supabase-schema.sql' as status;
