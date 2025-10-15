// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// SERVIÇOS MIGRADOS DO FIREBASE PARA SUPABASE
// =====================================================

// Função auxiliar para converter timestamp
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return timestamp;
};

// Serviços de Usuários
const usuarioService = {
  async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        equipes:equipes!id_equipe(*)
      `)
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return (data || []).map(usuario => ({
      ...usuario,
      dataCriacao: convertTimestamp(usuario.data_criacao)
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        equipes:equipes!id_equipe(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataCriacao: convertTimestamp(data.data_criacao)
    };
  },

  async getByLogin(login) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        equipes:equipes!id_equipe(*)
      `)
      .eq('login', login)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataCriacao: convertTimestamp(data.data_criacao)
    };
  },

  async create(usuario) {
    // Se o usuário não for admin, criar equipe automaticamente
    if (usuario.tipo === 'usuario') {
      // Criar equipe primeiro
      const { data: novaEquipe, error: equipeError } = await supabase
        .from('equipes')
        .insert({
          nome_equipe: usuario.nomeEquipe || usuario.nome,
          cidade: usuario.estado || 'A definir',
          tecnico: usuario.nome,
          telefone: '',
          email: '',
          status: 'ATIVA'
        })
        .select()
        .single();

      if (equipeError) throw equipeError;

      // Criar o usuário com referência à equipe
      const { data: novoUsuario, error: usuarioError } = await supabase
        .from('usuarios')
        .insert({
          ...usuario,
          chefe_equipe: true,
          id_equipe: novaEquipe.id
        })
        .select()
        .single();

      if (usuarioError) throw usuarioError;

      // Atualizar a equipe com o ID do chefe
      await supabase
        .from('equipes')
        .update({ id_chefe: novoUsuario.id })
        .eq('id', novaEquipe.id);

      return novoUsuario.id;
    } else {
      // Para administradores, criar normalmente sem equipe
      const { data: novoUsuario, error } = await supabase
        .from('usuarios')
        .insert({
          ...usuario,
          chefe_equipe: false
        })
        .select()
        .single();

      if (error) throw error;
      return novoUsuario.id;
    }
  },

  async update(id, usuario) {
    const { error } = await supabase
      .from('usuarios')
      .update(usuario)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Serviços de Equipes
const equipeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return (data || []).map(equipe => ({
      ...equipe,
      dataCriacao: convertTimestamp(equipe.data_criacao)
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataCriacao: convertTimestamp(data.data_criacao)
    };
  },

  async create(equipe) {
    // Buscar o valor atual da anuidade de equipe
    const anuidadeEquipeAtiva = await anuidadeEquipeService.getAtivo();
    const valorAnuidadeEquipe = anuidadeEquipeAtiva?.valor || 0;
    
    const { data: novaEquipe, error } = await supabase
      .from('equipes')
      .insert({
        ...equipe,
        valor_anuidade_equipe: valorAnuidadeEquipe
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Equipe ${equipe.nomeEquipe} criada com valor de anuidade: R$ ${valorAnuidadeEquipe}`);
    return novaEquipe.id;
  },

  async update(id, equipe) {
    const { error } = await supabase
      .from('equipes')
      .update(equipe)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('equipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByNome(nome) {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .eq('nome_equipe', nome)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataCriacao: convertTimestamp(data.data_criacao)
    };
  },

  // Função para aprovar comprovante de inscrição
  async aprovarComprovanteInscricao(equipeId, competicaoId, adminNome, observacoes) {
    try {
      console.log(`✅ Aprovando comprovante de inscrição para equipe ${equipeId} na competição ${competicaoId}`);
      
      // 1. NÃO alterar status da equipe - apenas aprovar o comprovante de inscrição
      console.log(`ℹ️ Status da equipe não alterado - controlado pelos comprovantes de anuidade`);
      
      // 2. Atualizar status das inscrições da equipe para esta competição
      const inscricoesExistentes = await inscricaoService.getByCompeticao(competicaoId);
      const inscricoesEquipe = inscricoesExistentes.filter(insc => {
        // Buscar o atleta para verificar se pertence à equipe
        return insc.atleta && insc.atleta.id_equipe === equipeId;
      });
      
      // Atualizar status de todas as inscrições da equipe para esta competição
      for (const inscricao of inscricoesEquipe) {
        await inscricaoService.update(inscricao.id, {
          status_inscricao: 'INSCRITO',
          data_aprovacao: new Date().toISOString(),
          aprovado_por: adminNome,
          observacoes: observacoes || 'Aprovado via comprovante de inscrição'
        });
      }
      
      console.log(`✅ Comprovante de inscrição aprovado com sucesso para equipe ${equipeId}`);
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante de inscrição:', error);
      throw error;
    }
  },

  // Função para rejeitar comprovante de inscrição
  async rejeitarComprovanteInscricao(equipeId, competicaoId, adminNome, observacoes) {
    try {
      console.log(`❌ Rejeitando comprovante de inscrição para equipe ${equipeId} na competição ${competicaoId}`);
      
      // 1. NÃO alterar status da equipe - apenas rejeitar o comprovante de inscrição
      console.log(`ℹ️ Status da equipe não alterado - controlado pelos comprovantes de anuidade`);
      
      // 2. NÃO cancelar as inscrições - apenas marcar que o comprovante foi rejeitado
      console.log(`❌ Comprovante de inscrição rejeitado com sucesso para equipe ${equipeId}`);
      console.log(`ℹ️ As inscrições dos atletas foram mantidas ativas - apenas o comprovante foi rejeitado`);
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante de inscrição:', error);
      throw error;
    }
  }
};

// Serviços de Categorias
const categoriaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('peso_maximo', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getBySexo(sexo) {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('sexo', sexo)
      .order('peso_maximo', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(categoria) {
    const { data: novaCategoria, error } = await supabase
      .from('categorias')
      .insert(categoria)
      .select()
      .single();

    if (error) throw error;
    return novaCategoria.id;
  },

  async update(id, categoria) {
    const { error } = await supabase
      .from('categorias')
      .update(categoria)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Serviços de Atletas
const atletaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('atletas')
      .select(`
        *,
        categorias:categorias!id_categoria(*),
        equipes:equipes!id_equipe(*)
      `)
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return (data || []).map(atleta => ({
      ...atleta,
      dataNascimento: convertTimestamp(atleta.data_nascimento),
      dataFiliacao: convertTimestamp(atleta.data_filiacao),
      dataCriacao: convertTimestamp(atleta.data_criacao)
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('atletas')
      .select(`
        *,
        categorias:categorias!id_categoria(*),
        equipes:equipes!id_equipe(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataNascimento: convertTimestamp(data.data_nascimento),
      dataFiliacao: convertTimestamp(data.data_filiacao),
      dataCriacao: convertTimestamp(data.data_criacao),
      // Garantir que as relações sejam mapeadas corretamente
      categoria: data.categorias || null,
      equipe: data.equipes || null
    };
  },

  async getByCpf(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('atletas')
      .select(`
        *,
        categorias:categorias!id_categoria(*),
        equipes:equipes!id_equipe(*)
      `)
      .eq('cpf', cpfLimpo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataNascimento: convertTimestamp(data.data_nascimento),
      dataFiliacao: convertTimestamp(data.data_filiacao),
      dataCriacao: convertTimestamp(data.data_criacao)
    };
  },

  async search(searchTerm) {
    const { data, error } = await supabase
      .from('atletas')
      .select(`
        *,
        categorias:categorias!id_categoria(*),
        equipes:equipes!id_equipe(*)
      `)
      .ilike('nome', `%${searchTerm}%`)
      .order('nome', { ascending: true });

    if (error) throw error;
    return (data || []).map(atleta => ({
      ...atleta,
      dataNascimento: convertTimestamp(atleta.data_nascimento),
      dataFiliacao: convertTimestamp(atleta.data_filiacao),
      dataCriacao: convertTimestamp(atleta.data_criacao)
    }));
  },

  async create(atleta) {
    // Verificar se CPF já existe no sistema
    const cpfLimpo = atleta.cpf.replace(/\D/g, '');
    const atletaExistente = await this.getByCpf(cpfLimpo);
    
    if (atletaExistente) {
      throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nome_equipe || 'N/A'}). Entre em contato com o administrador.`);
    }
    
    // Mapear campos camelCase para snake_case
    const atletaData = {
      nome: atleta.nome,
      cpf: cpfLimpo,
      matricula: atleta.matricula,
      sexo: atleta.sexo,
      email: atleta.email,
      telefone: atleta.telefone,
      data_nascimento: atleta.dataNascimento ? new Date(atleta.dataNascimento).toISOString() : null,
      data_filiacao: atleta.dataFiliacao ? new Date(atleta.dataFiliacao).toISOString() : new Date().toISOString(),
      maior_total: atleta.maiorTotal,
      status: atleta.status || 'ATIVO',
      id_categoria: atleta.idCategoria,
      id_equipe: atleta.idEquipe,
      endereco: atleta.endereco,
      observacoes: atleta.observacoes
    };
    
    const { data: novoAtleta, error } = await supabase
      .from('atletas')
      .insert(atletaData)
      .select()
      .single();
      
    if (error) throw error;
    return novoAtleta.id;
  },

  async update(id, atleta) {
    // Se o CPF foi alterado, verificar se já existe no sistema
    if (atleta.cpf) {
      const cpfLimpo = atleta.cpf.replace(/\D/g, '');
      const atletaExistente = await this.getByCpf(cpfLimpo);
      
      // Se encontrou um atleta com o mesmo CPF e não é o mesmo atleta sendo editado
      if (atletaExistente && atletaExistente.id !== id) {
        throw new Error(`CPF ${atleta.cpf} já está cadastrado no sistema. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nome_equipe || 'N/A'}). Entre em contato com o administrador.`);
      }
    }
    
    // Mapear campos camelCase para snake_case
    const updateData = {};
    
    if (atleta.nome !== undefined) updateData.nome = atleta.nome;
    if (atleta.cpf !== undefined) updateData.cpf = atleta.cpf.replace(/\D/g, '');
    if (atleta.matricula !== undefined) updateData.matricula = atleta.matricula;
    if (atleta.sexo !== undefined) updateData.sexo = atleta.sexo;
    if (atleta.email !== undefined) updateData.email = atleta.email;
    if (atleta.telefone !== undefined) updateData.telefone = atleta.telefone;
    if (atleta.dataNascimento !== undefined) {
      updateData.data_nascimento = atleta.dataNascimento ? new Date(atleta.dataNascimento).toISOString() : null;
    }
    if (atleta.dataFiliacao !== undefined) {
      updateData.data_filiacao = atleta.dataFiliacao ? new Date(atleta.dataFiliacao).toISOString() : null;
    }
    if (atleta.maiorTotal !== undefined) updateData.maior_total = atleta.maiorTotal;
    if (atleta.status !== undefined) updateData.status = atleta.status;
    if (atleta.idCategoria !== undefined) updateData.id_categoria = atleta.idCategoria;
    if (atleta.idEquipe !== undefined) updateData.id_equipe = atleta.idEquipe;
    if (atleta.endereco !== undefined) updateData.endereco = atleta.endereco;
    if (atleta.observacoes !== undefined) updateData.observacoes = atleta.observacoes;
    
    const { error } = await supabase
      .from('atletas')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('atletas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Serviços de Competições
const competicaoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('competicoes')
      .select('*')
      .order('data_competicao', { ascending: false });

    if (error) throw error;
    return (data || []).map(competicao => ({
      ...competicao,
      dataCompeticao: convertTimestamp(competicao.data_competicao),
      dataInicioInscricao: convertTimestamp(competicao.data_inicio_inscricao),
      dataFimInscricao: convertTimestamp(competicao.data_fim_inscricao),
      dataNominacaoPreliminar: convertTimestamp(competicao.data_nominacao_preliminar),
      dataNominacaoFinal: convertTimestamp(competicao.data_nominacao_final),
      dataCriacao: convertTimestamp(competicao.data_criacao)
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('competicoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      dataCompeticao: convertTimestamp(data.data_competicao),
      dataInicioInscricao: convertTimestamp(data.data_inicio_inscricao),
      dataFimInscricao: convertTimestamp(data.data_fim_inscricao),
      dataNominacaoPreliminar: convertTimestamp(data.data_nominacao_preliminar),
      dataNominacaoFinal: convertTimestamp(data.data_nominacao_final),
      dataCriacao: convertTimestamp(data.data_criacao)
    };
  },

  async create(competicao) {
    const { data: novaCompeticao, error } = await supabase
      .from('competicoes')
      .insert({
        ...competicao,
        data_competicao: competicao.dataCompeticao ? new Date(competicao.dataCompeticao).toISOString() : null,
        data_inicio_inscricao: competicao.dataInicioInscricao ? new Date(competicao.dataInicioInscricao).toISOString() : null,
        data_fim_inscricao: competicao.dataFimInscricao ? new Date(competicao.dataFimInscricao).toISOString() : null,
        data_nominacao_preliminar: competicao.dataNominacaoPreliminar ? new Date(competicao.dataNominacaoPreliminar).toISOString() : null,
        data_nominacao_final: competicao.dataNominacaoFinal ? new Date(competicao.dataNominacaoFinal).toISOString() : null
      })
      .select()
      .single();
      
    if (error) throw error;
    return novaCompeticao.id;
  },

  async update(id, competicao) {
    const updateData = {
      ...competicao,
      data_competicao: competicao.dataCompeticao ? new Date(competicao.dataCompeticao).toISOString() : undefined,
      data_inicio_inscricao: competicao.dataInicioInscricao ? new Date(competicao.dataInicioInscricao).toISOString() : undefined,
      data_fim_inscricao: competicao.dataFimInscricao ? new Date(competicao.dataFimInscricao).toISOString() : undefined,
      data_nominacao_preliminar: competicao.dataNominacaoPreliminar ? new Date(competicao.dataNominacaoPreliminar).toISOString() : undefined,
      data_nominacao_final: competicao.dataNominacaoFinal ? new Date(competicao.dataNominacaoFinal).toISOString() : undefined
    };
    
    const { error } = await supabase
      .from('competicoes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('competicoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Serviços de Inscrições
const inscricaoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inscricoes_competicao')
      .select(`
        *,
        atletas:atletas!id_atleta(*),
        competicoes:competicoes!id_competicao(*)
      `)
      .order('data_inscricao', { ascending: false });

    if (error) throw error;
    return (data || []).map(inscricao => ({
      ...inscricao,
      dataInscricao: convertTimestamp(inscricao.data_inscricao),
      dataAprovacao: convertTimestamp(inscricao.data_aprovacao),
      dataRejeicao: convertTimestamp(inscricao.data_rejeicao)
    }));
  },

  async getByCompeticao(competicaoId) {
    const { data, error } = await supabase
      .from('inscricoes_competicao')
      .select(`
        *,
        atletas:atletas!id_atleta(*),
        competicoes:competicoes!id_competicao(*)
      `)
      .eq('id_competicao', competicaoId)
      .order('data_inscricao', { ascending: false });

    if (error) throw error;
    return (data || []).map(inscricao => ({
      ...inscricao,
      dataInscricao: convertTimestamp(inscricao.data_inscricao),
      dataAprovacao: convertTimestamp(inscricao.data_aprovacao),
      dataRejeicao: convertTimestamp(inscricao.data_rejeicao)
    }));
  },

  async getByAtleta(atletaId) {
    const { data, error } = await supabase
      .from('inscricoes_competicao')
      .select(`
        *,
        atletas:atletas!id_atleta(*),
        competicoes:competicoes!id_competicao(*)
      `)
      .eq('id_atleta', atletaId)
      .order('data_inscricao', { ascending: false });

    if (error) throw error;
    return (data || []).map(inscricao => ({
      ...inscricao,
      dataInscricao: convertTimestamp(inscricao.data_inscricao),
      dataAprovacao: convertTimestamp(inscricao.data_aprovacao),
      dataRejeicao: convertTimestamp(inscricao.data_rejeicao)
    }));
  },

  async getByAtletaAndCompeticao(atletaId, competicaoId) {
    const { data, error } = await supabase
      .from('inscricoes_competicao')
      .select('*')
      .eq('id_atleta', atletaId)
      .eq('id_competicao', competicaoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(inscricao) {
    const { data: novaInscricao, error } = await supabase
      .from('inscricoes_competicao')
      .insert({
        ...inscricao,
        data_inscricao: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return novaInscricao.id;
  },

  async update(id, inscricao) {
    const { error } = await supabase
      .from('inscricoes_competicao')
      .update(inscricao)
      .eq('id', id);

    if (error) throw error;
  },

  async updateWithRecalculation(id, inscricao, competicao) {
    // Recalcular valor individual baseado na dobra atual
    const valorBase = competicao?.valorInscricao || competicao?.valor_inscricao || 0;
    const valorDobra = competicao?.valorDobra || competicao?.valor_dobra || 0;
    
    let valorIndividual = valorBase;
    
    // Se tem dobraCategoria definida, adicionar valor da dobra
    if (inscricao.dobraCategoria && inscricao.dobraCategoria.categoriaPeso && inscricao.dobraCategoria.categoriaIdade) {
      valorIndividual += valorDobra;
    }
    
    // Atualizar com o valor recalculado
    const dadosAtualizacao = {
      ...inscricao,
      valor_individual: valorIndividual
    };
    
    const { error } = await supabase
      .from('inscricoes_competicao')
      .update(dadosAtualizacao)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('inscricoes_competicao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Serviços de Log
const logService = {
  async getAll() {
    const { data, error } = await supabase
      .from('log_atividades')
      .select('*')
      .order('data_hora', { ascending: false });

    if (error) throw error;
    return (data || []).map(log => ({
      ...log,
      dataHora: convertTimestamp(log.data_hora)
    }));
  },

  async create(log) {
    const { data: novoLog, error } = await supabase
      .from('log_atividades')
      .insert({
        ...log,
        data_hora: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return novoLog.id;
  },

  async clear() {
    const { error } = await supabase
      .from('log_atividades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  }
};

// Serviços de Upload de Arquivos
const fileService = {
  async uploadFile(file, path) {
    try {
      console.log('📁 FileService: Iniciando upload para path:', path);
      console.log('📁 FileService: Tamanho do arquivo:', file.size, 'bytes');
      
      const fileName = `${Date.now()}-${file.originalname || file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file.buffer || file, {
          contentType: file.mimetype
        });

      if (error) throw error;
      
      console.log('📁 FileService: Upload de bytes concluído');
      
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      console.log('📁 FileService: URL de download obtida:', urlData.publicUrl);
      
      return {
        filename: fileName,
        originalName: file.originalname || file.name,
        size: file.size,
        mimetype: file.mimetype,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('❌ FileService: Erro no upload:', error);
      throw error;
    }
  },

  async deleteFile(path) {
    const { error } = await supabase.storage
      .from('uploads')
      .remove([path]);

    if (error) throw error;
  },

  async getFileUrl(path) {
    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(path);

    return data.publicUrl;
  }
};

// Serviços de Dashboard
const dashboardService = {
  async getStats() {
    const [atletas, equipes, competicoes, log, resultadosImportados] = await Promise.all([
      atletaService.getAll(),
      equipeService.getAll(),
      competicaoService.getAll(),
      logService.getAll(),
      resultadoImportadoService.getAll()
    ]);

    const atletasAtivos = atletas.filter(a => a.status === 'ATIVO').length;
    const atletasInativos = atletas.filter(a => a.status === 'INATIVO').length;
    const atletasMasculino = atletas.filter(a => a.sexo === 'M').length;
    const atletasFeminino = atletas.filter(a => a.sexo === 'F').length;

    // Agrupar atletas por equipe
    const atletasPorEquipe = equipes.map(equipe => ({
      equipe: equipe.nome_equipe,
      equipe_nome: equipe.nome_equipe, // Para compatibilidade com frontend HTML
      quantidade: atletas.filter(a => a.id_equipe === equipe.id).length,
      count: atletas.filter(a => a.id_equipe === equipe.id).length // Para compatibilidade com frontend HTML
    }));

    // Top 10 maiores totais
    const maioresTotais = atletas
      .filter(a => a.maior_total && a.maior_total > 0)
      .sort((a, b) => (b.maior_total || 0) - (a.maior_total || 0))
      .slice(0, 10)
      .map(a => ({
        atleta: a.nome,
        total: a.maior_total || 0
      }));

    // Top 10 maiores totais por sexo
    const maioresTotaisMasculino = atletas
      .filter(a => a.maior_total && a.maior_total > 0 && a.sexo === 'M')
      .sort((a, b) => (b.maior_total || 0) - (a.maior_total || 0))
      .slice(0, 10)
      .map(a => ({
        atleta: a.nome,
        total: a.maior_total || 0
      }));

    const maioresTotaisFeminino = atletas
      .filter(a => a.maior_total && a.maior_total > 0 && a.sexo === 'F')
      .sort((a, b) => (b.maior_total || 0) - (a.maior_total || 0))
      .slice(0, 10)
      .map(a => ({
        atleta: a.nome,
        total: a.maior_total || 0
      }));

    // Calcular melhores IPF Points dos resultados importados
    const melhoresIPFPointsMasculino = this.calcularMelhoresIPFPoints(resultadosImportados, 'M');
    const melhoresIPFPointsFeminino = this.calcularMelhoresIPFPoints(resultadosImportados, 'F');

    return {
      totais: {
        atletas: atletas.length,
        equipes: equipes.length,
        competicoes: competicoes.length,
        inscricoes: log.filter(l => l.acao === 'INSCRICAO_CRIADA').length
      },
      atletasAtivos,
      atletasInativos,
      atletasPorSexo: {
        masculino: atletasMasculino,
        feminino: atletasFeminino
      },
      atletas_por_equipe: atletasPorEquipe,
      maioresTotais,
      maioresTotaisMasculino,
      maioresTotaisFeminino,
      melhoresIPFPointsMasculino,
      melhoresIPFPointsFeminino
    };
  },

  // Função para calcular os melhores IPF Points dos resultados importados
  calcularMelhoresIPFPoints(resultadosImportados, sexo) {
    const todosOsResultados = [];

    // Processar cada resultado importado
    resultadosImportados.forEach(resultado => {
      if (resultado.results?.complete) {
        resultado.results.complete.forEach((categoria) => {
          if (categoria.results) {
            categoria.results.forEach((result) => {
              // Verificar se o atleta tem o sexo correto e pontos válidos
              if (result.entry?.sex === sexo && result.points && result.points > 0) {
                todosOsResultados.push({
                  atleta: result.entry.name || 'Atleta Desconhecido',
                  pontos: result.points,
                  total: result.total || 0,
                  competicao: resultado.competitionName || 'Competição Desconhecida'
                });
              }
            });
          }
        });
      }
    });

    // Ordenar por pontos IPF (decrescente) e pegar os top 10
    return todosOsResultados
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 10);
  }
};

// Serviços Financeiros
const anuidadeService = {
  async getAtivo() {
    const { data, error } = await supabase
      .from('anuidades')
      .select('*')
      .eq('ativo', true)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;
    
    return {
      ...data[0],
      dataCriacao: convertTimestamp(data[0].data_criacao),
      dataAtualizacao: convertTimestamp(data[0].data_atualizacao)
    };
  },

  async create(anuidade) {
    // Desativar anuidades anteriores
    await supabase
      .from('anuidades')
      .update({ ativo: false })
      .eq('ativo', true);

    // Criar nova anuidade
    const { data: novaAnuidade, error } = await supabase
      .from('anuidades')
      .insert({
        ...anuidade,
        ativo: true
      })
      .select()
      .single();
      
    if (error) throw error;
    return novaAnuidade.id;
  },

  async update(id, anuidade) {
    const { error } = await supabase
      .from('anuidades')
      .update({
        ...anuidade,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('anuidades')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return (data || []).map(anuidade => ({
      ...anuidade,
      dataCriacao: convertTimestamp(anuidade.data_criacao),
      dataAtualizacao: convertTimestamp(anuidade.data_atualizacao)
    }));
  }
};

const pagamentoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('pagamentos_anuidade')
      .select('*')
      .order('data_pagamento', { ascending: false });

    if (error) throw error;
    return (data || []).map(pagamento => ({
      ...pagamento,
      dataPagamento: convertTimestamp(pagamento.data_pagamento),
      dataAprovacao: convertTimestamp(pagamento.data_aprovacao),
      dataRejeicao: convertTimestamp(pagamento.data_rejeicao)
    }));
  },

  async getByAtleta(idAtleta) {
    const { data, error } = await supabase
      .from('pagamentos_anuidade')
      .select('*')
      .eq('id_atleta', idAtleta)
      .order('data_pagamento', { ascending: false });

    if (error) throw error;
    return (data || []).map(pagamento => ({
      ...pagamento,
      dataPagamento: convertTimestamp(pagamento.data_pagamento)
    }));
  },

  async getByEquipe(idEquipe) {
    const { data, error } = await supabase
      .from('pagamentos_anuidade')
      .select('*')
      .eq('id_equipe', idEquipe)
      .order('data_pagamento', { ascending: false });

    if (error) throw error;
    return (data || []).map(pagamento => ({
      ...pagamento,
      dataPagamento: convertTimestamp(pagamento.data_pagamento)
    }));
  },

  async create(pagamento) {
    const { data: novoPagamento, error } = await supabase
      .from('pagamentos_anuidade')
      .insert({
        ...pagamento,
        data_pagamento: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return novoPagamento.id;
  },

  async update(id, pagamento) {
    const { error } = await supabase
      .from('pagamentos_anuidade')
      .update(pagamento)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('pagamentos_anuidade')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Função para aprovar comprovante de anuidade
  async aprovarComprovante(atletaId, valorAnuidade, adminNome, observacoes) {
    try {
      console.log(`✅ Aprovando comprovante para atleta ${atletaId}`);
      
      // 1. Atualizar status do atleta para ATIVO
      await atletaService.update(atletaId, {
        status: 'ATIVO'
      });
      
      // 2. Criar ou atualizar registro de pagamento
      const pagamentosExistentes = await this.getByAtleta(atletaId);
      const pagamentoAtual = pagamentosExistentes.find(p => p.ano === new Date().getFullYear());
      
      if (pagamentoAtual) {
        // Atualizar pagamento existente
        await this.update(pagamentoAtual.id, {
          status: 'PAGO',
          valor: valorAnuidade,
          data_aprovacao: new Date().toISOString(),
          aprovado_por: adminNome,
          observacoes: observacoes || 'Aprovado via comprovante'
        });
      } else {
        // Criar novo pagamento
        const atleta = await atletaService.getById(atletaId);
        if (!atleta) {
          throw new Error('Atleta não encontrado');
        }
        
        await this.create({
          id_atleta: atletaId,
          id_equipe: atleta.id_equipe,
          nome_atleta: atleta.nome,
          nome_equipe: atleta.equipe?.nome_equipe || 'N/A',
          valor: valorAnuidade,
          status: 'PAGO',
          ano: new Date().getFullYear(),
          data_aprovacao: new Date().toISOString(),
          aprovado_por: adminNome,
          observacoes: observacoes || 'Aprovado via comprovante'
        });
      }
      
      console.log(`✅ Comprovante aprovado com sucesso para atleta ${atletaId}`);
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante:', error);
      throw error;
    }
  },

  // Função para rejeitar comprovante de anuidade
  async rejeitarComprovante(atletaId, adminNome, observacoes) {
    try {
      console.log(`❌ Rejeitando comprovante para atleta ${atletaId}`);
      
      const pagamentosExistentes = await this.getByAtleta(atletaId);
      const pagamentoAtual = pagamentosExistentes.find(p => p.ano === new Date().getFullYear());
      
      if (pagamentoAtual) {
        // Atualizar pagamento existente
        await this.update(pagamentoAtual.id, {
          status: 'REJEITADO',
          data_rejeicao: new Date().toISOString(),
          rejeitado_por: adminNome,
          observacoes: observacoes || 'Rejeitado via comprovante'
        });
      } else {
        // Criar registro de rejeição
        const atleta = await atletaService.getById(atletaId);
        if (!atleta) {
          throw new Error('Atleta não encontrado');
        }
        
        await this.create({
          id_atleta: atletaId,
          id_equipe: atleta.id_equipe,
          nome_atleta: atleta.nome,
          nome_equipe: atleta.equipe?.nome_equipe || 'N/A',
          valor: 0,
          status: 'REJEITADO',
          ano: new Date().getFullYear(),
          data_rejeicao: new Date().toISOString(),
          rejeitado_por: adminNome,
          observacoes: observacoes || 'Rejeitado via comprovante'
        });
      }
      
      console.log(`❌ Comprovante rejeitado com sucesso para atleta ${atletaId}`);
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante:', error);
      throw error;
    }
  },

  // Função para limpar comprovante de anuidade (resetar para PENDENTE)
  async limparComprovante(atletaId, adminNome) {
    try {
      console.log(`🧹 Limpando comprovante para atleta ${atletaId}`);
      
      // 1. Atualizar status do atleta para INATIVO
      await atletaService.update(atletaId, {
        status: 'INATIVO'
      });
      
      // 2. Deletar registro de pagamento existente
      const pagamentosExistentes = await this.getByAtleta(atletaId);
      const pagamentoAtual = pagamentosExistentes.find(p => p.ano === new Date().getFullYear());
      
      if (pagamentoAtual) {
        await this.delete(pagamentoAtual.id);
        console.log(`🗑️ Registro de pagamento deletado para atleta ${atletaId}`);
      }
      
      console.log(`🧹 Comprovante limpo com sucesso para atleta ${atletaId}`);
      console.log(`👤 Status do atleta alterado para INATIVO`);
      console.log(`🗑️ Registro de pagamento removido`);
    } catch (error) {
      console.error('❌ Erro ao limpar comprovante:', error);
      throw error;
    }
  }
};

// Serviço para renovação anual automática
const renovacaoAnualService = {
  // Verificar se precisa fazer renovação anual
  async verificarRenovacaoAnual() {
    try {
      const anoAtual = new Date().getFullYear();
      // Em Node.js, usar uma configuração no banco em vez de localStorage
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'ultima_renovacao_anual')
        .single();
      
      const ultimaRenovacao = data?.valor ? parseInt(data.valor) : 0;
      
      if (ultimaRenovacao < anoAtual) {
        console.log(`🔄 Verificando renovação anual para ${anoAtual}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar renovação anual:', error);
      return false;
    }
  },

  // Executar renovação anual
  async executarRenovacaoAnual() {
    try {
      const anoAtual = new Date().getFullYear();
      console.log(`🔄 Iniciando renovação anual para ${anoAtual}`);
      
      // Buscar todos os atletas
      const atletas = await atletaService.getAll();
      
      // Atualizar status de todos os atletas para INATIVO
      for (const atleta of atletas) {
        if (atleta.id) {
          await atletaService.update(atleta.id, {
            status: 'INATIVO'
          });
        }
      }
      
      // Marcar renovação como executada
      await supabase
        .from('configuracoes')
        .upsert({
          chave: 'ultima_renovacao_anual',
          valor: anoAtual.toString(),
          data_atualizacao: new Date().toISOString()
        });
      
      console.log(`✅ Renovação anual executada com sucesso. ${atletas.length} atletas atualizados.`);
    } catch (error) {
      console.error('❌ Erro ao executar renovação anual:', error);
      throw error;
    }
  },

  // Verificar e executar renovação se necessário
  async verificarEExecutarRenovacao() {
    try {
      const precisaRenovacao = await this.verificarRenovacaoAnual();
      
      if (precisaRenovacao) {
        await this.executarRenovacaoAnual();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar e executar renovação:', error);
      throw error;
    }
  }
};

const documentoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('documentos_contabeis')
      .select('*')
      .order('data_upload', { ascending: false });

    if (error) throw error;
    return (data || []).map(documento => ({
      ...documento,
      dataUpload: convertTimestamp(documento.data_upload)
    }));
  },

  async create(documento) {
    const { data: novoDocumento, error } = await supabase
      .from('documentos_contabeis')
      .insert({
        ...documento,
        ativo: true
      })
      .select()
      .single();
      
    if (error) throw error;
    return novoDocumento.id;
  },

  async update(id, documento) {
    const { error } = await supabase
      .from('documentos_contabeis')
      .update(documento)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('documentos_contabeis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadDocumento(file, tipo) {
    try {
      console.log('📁 Iniciando upload do documento:', file.name);
      const fileName = `documentos_contabeis/${Date.now()}_${file.name}`;
      console.log('📁 Nome do arquivo no storage:', fileName);
      
      const result = await fileService.uploadFile(file, fileName);
      console.log('✅ Upload concluído com sucesso. URL:', result.url);
      return result.url;
    } catch (error) {
      console.error('❌ Erro no upload do documento:', error);
      throw error;
    }
  }
};

// Serviços de Tipos de Competição
const tipoCompeticaoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'tipos_competicao')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      return JSON.parse(data.valor);
    }
    
    // Se não existir, retornar tipos padrão
    return ['S', 'AST', 'T'];
  },

  async update(tipos) {
    const { error } = await supabase
      .from('configuracoes')
      .upsert({
        chave: 'tipos_competicao',
        valor: JSON.stringify(tipos),
        data_atualizacao: new Date().toISOString()
      });

    if (error) throw error;
  },

  async createDefault() {
    const { data } = await supabase
      .from('configuracoes')
      .select('id')
      .eq('chave', 'tipos_competicao')
      .single();
    
    if (data) return; // Já existe
    
    await supabase
      .from('configuracoes')
      .insert({ 
        chave: 'tipos_competicao',
        valor: JSON.stringify(['S', 'AST', 'T'])
      });
  }
};

// Serviços de Anuidade de Equipe
const anuidadeEquipeService = {
  async getAtivo() {
    const { data, error } = await supabase
      .from('anuidades_equipe')
      .select('*')
      .eq('ativo', true)
      .order('data_criacao', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;
    
    return {
      ...data[0],
      dataCriacao: convertTimestamp(data[0].data_criacao),
      dataAtualizacao: convertTimestamp(data[0].data_atualizacao)
    };
  },

  async create(anuidade) {
    // Desativar anuidades anteriores
    await supabase
      .from('anuidades_equipe')
      .update({ ativo: false })
      .eq('ativo', true);

    // Criar nova anuidade
    const { data: novaAnuidade, error } = await supabase
      .from('anuidades_equipe')
      .insert({
        ...anuidade,
        ativo: true
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Atualizar valor da anuidade em todas as equipes existentes
    await this.atualizarValorAnuidadeEmTodasEquipes(anuidade.valor);
    
    return novaAnuidade.id;
  },

  async atualizarValorAnuidadeEmTodasEquipes(valor) {
    try {
      console.log(`🔄 Atualizando valor de anuidade para R$ ${valor} em todas as equipes...`);
      
      const { error } = await supabase
        .from('equipes')
        .update({
          valor_anuidade_equipe: valor,
          data_atualizacao: new Date().toISOString()
        });

      if (error) throw error;
      console.log(`✅ Valor de anuidade atualizado em todas as equipes`);
    } catch (error) {
      console.error('❌ Erro ao atualizar valor de anuidade em todas as equipes:', error);
      throw error;
    }
  },

  async inicializarValorAnuidadeEmEquipesExistentes() {
    try {
      console.log('🔄 Inicializando valor de anuidade em equipes existentes...');
      
      // Buscar anuidade ativa
      const anuidadeAtiva = await this.getAtivo();
      if (!anuidadeAtiva) {
        console.log('⚠️ Nenhuma anuidade de equipe ativa encontrada');
        return;
      }
      
      // Buscar equipes que não possuem valor de anuidade
      const { data: equipes, error } = await supabase
        .from('equipes')
        .select('id')
        .or('valor_anuidade_equipe.is.null,valor_anuidade_equipe.eq.0');

      if (error) throw error;
      
      if (equipes && equipes.length > 0) {
        for (const equipe of equipes) {
          await equipeService.update(equipe.id, {
            valor_anuidade_equipe: anuidadeAtiva.valor,
            data_atualizacao: new Date().toISOString()
          });
        }
        console.log(`✅ Valor de anuidade inicializado em ${equipes.length} equipes existentes`);
      } else {
        console.log('✅ Todas as equipes já possuem valor de anuidade definido');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar valor de anuidade em equipes existentes:', error);
      throw error;
    }
  },

  async update(id, anuidade) {
    const { error } = await supabase
      .from('anuidades_equipe')
      .update({
        ...anuidade,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    
    // Se o valor foi alterado, atualizar todas as equipes
    if (anuidade.valor !== undefined) {
      await this.atualizarValorAnuidadeEmTodasEquipes(anuidade.valor);
    }
  },

  async getAll() {
    const { data, error } = await supabase
      .from('anuidades_equipe')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return (data || []).map(anuidade => ({
      ...anuidade,
      dataCriacao: convertTimestamp(anuidade.data_criacao),
      dataAtualizacao: convertTimestamp(anuidade.data_atualizacao)
    }));
  }
};

// Serviços para atualizar status de equipe
const equipeStatusService = {
  async atualizarStatusEquipe(equipeId, status, adminNome) {
    try {
      console.log(`🔄 Atualizando status da equipe ${equipeId} para ${status}`);
      
      await equipeService.update(equipeId, {
        status: status,
        data_atualizacao: new Date().toISOString()
      });
      
      console.log(`✅ Status da equipe ${equipeId} atualizado para ${status}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da equipe:', error);
      throw error;
    }
  },

  async atualizarValorAnuidadeEquipe(equipeId, valor, adminNome) {
    try {
      console.log(`💰 Atualizando valor de anuidade da equipe ${equipeId} para R$ ${valor}`);
      
      await equipeService.update(equipeId, {
        valor_anuidade_equipe: valor,
        data_atualizacao: new Date().toISOString()
      });
      
      console.log(`✅ Valor de anuidade da equipe ${equipeId} atualizado para R$ ${valor}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar valor de anuidade da equipe:', error);
      throw error;
    }
  }
};

// Serviço mock para resultados importados (implementar depois se necessário)
const resultadoImportadoService = {
  async getAll() {
    // Implementar quando necessário
    return [];
  }
};

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

// Exportar todos os serviços
module.exports = {
  supabase,
  testSupabaseConnection,
  usuarioService,
  equipeService,
  categoriaService,
  atletaService,
  competicaoService,
  inscricaoService,
  logService,
  fileService,
  dashboardService,
  anuidadeService,
  pagamentoService,
  renovacaoAnualService,
  documentoService,
  tipoCompeticaoService,
  anuidadeEquipeService,
  equipeStatusService,
  resultadoImportadoService
};