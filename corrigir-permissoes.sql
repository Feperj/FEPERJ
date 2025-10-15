-- =====================================================
-- CORRIGIR PERMISSÕES NO SUPABASE - SISTEMA FEPERJ
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Desabilitar Row Level Security temporariamente para todas as tabelas
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE atletas DISABLE ROW LEVEL SECURITY;
ALTER TABLE competicoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_competicao DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE anuidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_anuidade DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_contabeis DISABLE ROW LEVEL SECURITY;
ALTER TABLE anuidades_equipe DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;

-- Conceder permissões para o role 'anon' (usuário anônimo)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Conceder permissões para o role 'authenticated' (usuário autenticado)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Conceder permissões para o role 'service_role' (chave de serviço)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Permitir operações CRUD para todos os usuários nas tabelas principais
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON equipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON equipes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON atletas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON atletas TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON competicoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON competicoes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON inscricoes_competicao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON inscricoes_competicao TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON log_atividades TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON log_atividades TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON anuidades TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON anuidades TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON pagamentos_anuidade TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON pagamentos_anuidade TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON documentos_contabeis TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON documentos_contabeis TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON anuidades_equipe TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON anuidades_equipe TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON configuracoes TO anon;
GRANT SELECT, INSERT, INSERT, UPDATE, DELETE ON configuracoes TO authenticated;

-- Atualizar permissões de sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Confirmar alterações
SELECT '✅ Permissões configuradas com sucesso!' as status;
