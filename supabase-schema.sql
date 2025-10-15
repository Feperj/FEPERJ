-- =====================================================
-- SCHEMA SQL PARA SUPABASE - SISTEMA FEPERJ
-- BASEADO NA ESTRUTURA FIREBASE
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(100) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('admin', 'usuario')),
    ativo BOOLEAN DEFAULT true,
    chefe_equipe BOOLEAN DEFAULT false,
    id_equipe UUID,
    nome_equipe VARCHAR(255),
    estado VARCHAR(2),
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID,
    CONSTRAINT fk_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =====================================================
-- TABELA: equipes
-- =====================================================
CREATE TABLE IF NOT EXISTS equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_equipe VARCHAR(255) UNIQUE NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    tecnico VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    id_chefe UUID,
    status VARCHAR(20) DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA', 'SUSPENSA', 'PAGO', 'PENDENTE')),
    valor_anuidade_equipe DECIMAL(10, 2),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_id_chefe FOREIGN KEY (id_chefe) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Adicionar FK de equipe em usuarios
ALTER TABLE usuarios 
ADD CONSTRAINT fk_id_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id) ON DELETE SET NULL;

-- =====================================================
-- TABELA: categorias
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_categoria VARCHAR(100) NOT NULL,
    peso_maximo DECIMAL(5, 2),
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    descricao TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: atletas
-- =====================================================
CREATE TABLE IF NOT EXISTS atletas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    matricula VARCHAR(50) UNIQUE,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    data_filiacao DATE NOT NULL,
    maior_total DECIMAL(6, 2),
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    id_categoria UUID,
    id_equipe UUID,
    endereco TEXT,
    observacoes TEXT,
    comprovante_residencia TEXT,
    carteirinha TEXT,
    foto_3x4 TEXT,
    certificado_adel TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE SET NULL,
    CONSTRAINT fk_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id) ON DELETE SET NULL
);

-- =====================================================
-- TABELA: competicoes
-- =====================================================
CREATE TABLE IF NOT EXISTS competicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_competicao VARCHAR(255) NOT NULL,
    data_competicao DATE NOT NULL,
    valor_inscricao DECIMAL(10, 2) NOT NULL,
    valor_dobra DECIMAL(10, 2),
    data_inicio_inscricao DATE NOT NULL,
    data_fim_inscricao DATE NOT NULL,
    data_nominacao_preliminar DATE,
    data_nominacao_final DATE,
    local VARCHAR(255),
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'AGENDADA' CHECK (status IN ('AGENDADA', 'REALIZADA', 'CANCELADA')),
    permite_dobra_categoria BOOLEAN DEFAULT false,
    modalidade VARCHAR(30) NOT NULL CHECK (modalidade IN ('CLASSICA', 'EQUIPADO', 'CLASSICA_EQUIPADO')),
    tipo_competicao VARCHAR(10),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: inscricoes_competicao
-- =====================================================
CREATE TABLE IF NOT EXISTS inscricoes_competicao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_atleta UUID NOT NULL,
    id_competicao UUID NOT NULL,
    data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_inscricao VARCHAR(20) DEFAULT 'INSCRITO' CHECK (status_inscricao IN ('INSCRITO', 'CANCELADO', 'APROVADO', 'REJEITADO')),
    observacoes TEXT,
    valor_individual DECIMAL(10, 2),
    tem_dobra BOOLEAN DEFAULT false,
    categoria_peso_id UUID,
    categoria_idade_id UUID,
    dobra_categoria_peso_id UUID,
    dobra_categoria_idade_id UUID,
    total_12_meses DECIMAL(6, 2),
    modalidade VARCHAR(30) CHECK (modalidade IN ('CLASSICA', 'EQUIPADO')),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    data_rejeicao TIMESTAMP WITH TIME ZONE,
    aprovado_por UUID,
    rejeitado_por UUID,
    CONSTRAINT fk_inscricao_atleta FOREIGN KEY (id_atleta) REFERENCES atletas(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscricao_competicao FOREIGN KEY (id_competicao) REFERENCES competicoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_aprovado_por FOREIGN KEY (aprovado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_rejeitado_por FOREIGN KEY (rejeitado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =====================================================
-- TABELA: log_atividades
-- =====================================================
CREATE TABLE IF NOT EXISTS log_atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario VARCHAR(255) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    tipo_usuario VARCHAR(20),
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(45)
);

-- =====================================================
-- TABELA: anuidades
-- =====================================================
CREATE TABLE IF NOT EXISTS anuidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valor DECIMAL(10, 2) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: pagamentos_anuidade
-- =====================================================
CREATE TABLE IF NOT EXISTS pagamentos_anuidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_atleta UUID NOT NULL,
    id_equipe UUID,
    nome_atleta VARCHAR(255) NOT NULL,
    nome_equipe VARCHAR(255),
    valor DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'REJEITADO')),
    ano INTEGER NOT NULL,
    data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    data_rejeicao TIMESTAMP WITH TIME ZONE,
    aprovado_por VARCHAR(255),
    rejeitado_por VARCHAR(255),
    observacoes TEXT,
    CONSTRAINT fk_pagamento_atleta FOREIGN KEY (id_atleta) REFERENCES atletas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagamento_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id) ON DELETE SET NULL
);

-- =====================================================
-- TABELA: documentos_contabeis
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos_contabeis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    arquivo_url TEXT NOT NULL,
    tamanho BIGINT,
    content_type VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: anuidades_equipe
-- =====================================================
CREATE TABLE IF NOT EXISTS anuidades_equipe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valor DECIMAL(10, 2) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: configuracoes
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id VARCHAR(50) PRIMARY KEY,
    tipos JSONB,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_atletas_cpf ON atletas(cpf);
CREATE INDEX IF NOT EXISTS idx_atletas_equipe ON atletas(id_equipe);
CREATE INDEX IF NOT EXISTS idx_atletas_status ON atletas(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_atleta ON inscricoes_competicao(id_atleta);
CREATE INDEX IF NOT EXISTS idx_inscricoes_competicao ON inscricoes_competicao(id_competicao);
CREATE INDEX IF NOT EXISTS idx_log_data_hora ON log_atividades(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_log_usuario ON log_atividades(usuario);
CREATE INDEX IF NOT EXISTS idx_pagamentos_atleta ON pagamentos_anuidade(id_atleta);
CREATE INDEX IF NOT EXISTS idx_pagamentos_equipe ON pagamentos_anuidade(id_equipe);

-- =====================================================
-- INSERIR CATEGORIAS PADRÃO
-- =====================================================
INSERT INTO categorias (nome_categoria, peso_maximo, sexo, descricao) VALUES
-- Categorias Femininas
('43kg Feminino', 43.00, 'F', 'Até 43kg - Feminino'),
('47kg Feminino', 47.00, 'F', 'Até 47kg - Feminino'),
('52kg Feminino', 52.00, 'F', 'Até 52kg - Feminino'),
('57kg Feminino', 57.00, 'F', 'Até 57kg - Feminino'),
('63kg Feminino', 63.00, 'F', 'Até 63kg - Feminino'),
('69kg Feminino', 69.00, 'F', 'Até 69kg - Feminino'),
('76kg Feminino', 76.00, 'F', 'Até 76kg - Feminino'),
('84kg Feminino', 84.00, 'F', 'Até 84kg - Feminino'),
('84kg+ Feminino', 999.99, 'F', 'Acima de 84kg - Feminino'),
-- Categorias Masculinas
('53kg Masculino', 53.00, 'M', 'Até 53kg - Masculino'),
('59kg Masculino', 59.00, 'M', 'Até 59kg - Masculino'),
('66kg Masculino', 66.00, 'M', 'Até 66kg - Masculino'),
('74kg Masculino', 74.00, 'M', 'Até 74kg - Masculino'),
('83kg Masculino', 83.00, 'M', 'Até 83kg - Masculino'),
('93kg Masculino', 93.00, 'M', 'Até 93kg - Masculino'),
('105kg Masculino', 105.00, 'M', 'Até 105kg - Masculino'),
('120kg Masculino', 120.00, 'M', 'Até 120kg - Masculino'),
('120kg+ Masculino', 999.99, 'M', 'Acima de 120kg - Masculino')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar matrícula automática
CREATE OR REPLACE FUNCTION gerar_matricula(p_cpf VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_cpf_limpo VARCHAR;
    v_primeiros_digitos VARCHAR;
    v_ano VARCHAR;
    v_matricula VARCHAR;
BEGIN
    -- Limpar CPF (remover caracteres não numéricos)
    v_cpf_limpo := regexp_replace(p_cpf, '[^0-9]', '', 'g');
    
    -- Pegar primeiros 5 dígitos
    v_primeiros_digitos := substring(v_cpf_limpo, 1, 5);
    
    -- Pegar ano atual
    v_ano := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Gerar matrícula
    v_matricula := 'FEPERJ - ' || v_primeiros_digitos || v_ano;
    
    RETURN v_matricula;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar matrícula automaticamente ao criar atleta
CREATE OR REPLACE FUNCTION trigger_gerar_matricula()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
        NEW.matricula := gerar_matricula(NEW.cpf);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_atleta_matricula ON atletas;
CREATE TRIGGER before_insert_atleta_matricula
BEFORE INSERT ON atletas
FOR EACH ROW
EXECUTE FUNCTION trigger_gerar_matricula();

-- Trigger para atualizar data_atualizacao
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_atletas_timestamp ON atletas;
CREATE TRIGGER update_atletas_timestamp
BEFORE UPDATE ON atletas
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();

DROP TRIGGER IF EXISTS update_equipes_timestamp ON equipes;
CREATE TRIGGER update_equipes_timestamp
BEFORE UPDATE ON equipes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();

DROP TRIGGER IF EXISTS update_competicoes_timestamp ON competicoes;
CREATE TRIGGER update_competicoes_timestamp
BEFORE UPDATE ON competicoes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
