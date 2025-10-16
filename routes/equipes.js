const express = require('express');
const router = express.Router();
const { equipeService, usuarioService, atletaService, logService } = require('../supabaseService');
const { verificarAdmin } = require('../middleware/adminAuth');

// Middleware removido - usando o centralizado de middleware/adminAuth.js

// Middleware para validar dados de equipe
const validarDadosEquipe = (req, res, next) => {
  const { nome_equipe, cidade } = req.body;
  
  if (!nome_equipe || !cidade) {
    return res.status(400).json({
      success: false,
      message: 'Nome da equipe e cidade são obrigatórios'
    });
  }
  
  if (nome_equipe.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Nome da equipe deve ter pelo menos 3 caracteres'
    });
  }
  
  next();
};

// GET /api/equipes - Listar todas as equipes
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando todas as equipes...');
    console.log('🔍 Usuário autenticado:', req.user);
    
    const equipes = await equipeService.getAll();
    console.log('📊 Equipes encontradas no banco:', equipes.length);
    
    // Buscar dados do chefe para cada equipe
    console.log('🔍 Buscando dados dos chefes e atletas...');
    const equipesComChefe = await Promise.all(
      equipes.map(async (equipe) => {
        let chefe = null;
        if (equipe.id_chefe) {
          try {
            console.log(`👤 Buscando chefe para equipe ${equipe.nome_equipe} (ID: ${equipe.id_chefe})`);
            chefe = await usuarioService.getById(equipe.id_chefe);
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar chefe da equipe ${equipe.id}:`, error.message);
          }
        }
        
        // Contar atletas da equipe
        const atletas = await atletaService.getAll();
        const totalAtletas = atletas.filter(atleta => atleta.idEquipe === equipe.id).length;
        console.log(`🏃 Equipe ${equipe.nome_equipe}: ${totalAtletas} atletas`);
        
        return {
          ...equipe,
          chefe: chefe ? {
            id: chefe.id,
            nome: chefe.nome,
            login: chefe.login,
            tipo: chefe.tipo
          } : null,
          total_atletas: totalAtletas
        };
      })
    );
    
    console.log(`✅ ${equipesComChefe.length} equipes encontradas`);
    console.log('📊 Estrutura dos dados:', JSON.stringify({
      success: true,
      data: {
        equipes: equipesComChefe.length,
        total: equipesComChefe.length
      }
    }, null, 2));
    
    res.json({
      success: true,
      data: {
        equipes: equipesComChefe,
        total: equipesComChefe.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar equipes:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao listar equipes',
      error: error.message
    });
  }
});

// GET /api/equipes/:id - Buscar equipe por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando equipe ID: ${id}`);
    
    const equipe = await equipeService.getById(id);
    
    if (!equipe) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }
    
    // Buscar dados do chefe
    let chefe = null;
    if (equipe.id_chefe) {
      try {
        chefe = await usuarioService.getById(equipe.id_chefe);
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar chefe da equipe ${id}:`, error.message);
      }
    }
    
    // Contar atletas da equipe
    const atletas = await atletaService.getAll();
    const totalAtletas = atletas.filter(atleta => atleta.idEquipe === id).length;
    
    console.log(`✅ Equipe encontrada: ${equipe.nome_equipe}`);
    
    res.json({
      success: true,
      data: {
        ...equipe,
        chefe: chefe ? {
          id: chefe.id,
          nome: chefe.nome,
          login: chefe.login,
          tipo: chefe.tipo
        } : null,
        total_atletas: totalAtletas
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar equipe',
      error: error.message
    });
  }
});

// POST /api/equipes - Criar nova equipe
router.post('/', verificarAdmin, validarDadosEquipe, async (req, res) => {
  try {
    const equipeData = req.body;
    const user = req.user;
    
    console.log(`🏗️ Criando nova equipe: ${equipeData.nome_equipe}`);
    
    // Verificar se já existe equipe com o mesmo nome
    const equipes = await equipeService.getAll();
    const equipeExistente = equipes.find(e => 
      e.nome_equipe.toLowerCase() === equipeData.nome_equipe.toLowerCase()
    );
    
    if (equipeExistente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe uma equipe com este nome'
      });
    }
    
    const novaEquipe = await equipeService.create({
      nome_equipe: equipeData.nome_equipe,
      cidade: equipeData.cidade,
      tecnico: equipeData.tecnico || null,
      telefone: equipeData.telefone || null,
      email: equipeData.email || null,
      status: 'ATIVA'
    });
    
    // Log da criação
    await logService.create({
      dataHora: new Date().toISOString(),
      usuario: user.nome || user.login || 'Sistema',
      acao: 'Criou equipe',
      detalhes: `Criou nova equipe: ${equipeData.nome_equipe} (${equipeData.cidade})`,
      tipoUsuario: user.tipo || 'admin'
    });
    
    console.log(`✅ Equipe criada com sucesso: ${equipeData.nome_equipe} (ID: ${novaEquipe})`);
    
    res.status(201).json({
      success: true,
      message: 'Equipe criada com sucesso',
      data: {
        id: novaEquipe,
        nome_equipe: equipeData.nome_equipe,
        cidade: equipeData.cidade
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao criar equipe',
      error: error.message
    });
  }
});

// PUT /api/equipes/:id - Atualizar equipe
router.put('/:id', verificarAdmin, validarDadosEquipe, async (req, res) => {
  try {
    const { id } = req.params;
    const equipeData = req.body;
    const user = req.user;
    
    console.log(`✏️ Atualizando equipe ID: ${id}`);
    
    // Verificar se a equipe existe
    const equipeExistente = await equipeService.getById(id);
    if (!equipeExistente) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }
    
    // Verificar se o novo nome já existe em outra equipe
    if (equipeData.nome_equipe !== equipeExistente.nome_equipe) {
      const equipes = await equipeService.getAll();
      const nomeExistente = equipes.find(e => 
        e.id !== id && e.nome_equipe.toLowerCase() === equipeData.nome_equipe.toLowerCase()
      );
      
      if (nomeExistente) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma equipe com este nome'
        });
      }
    }
    
    // Atualizar equipe
    await equipeService.update(id, {
      nome_equipe: equipeData.nome_equipe,
      cidade: equipeData.cidade,
      tecnico: equipeData.tecnico || null,
      telefone: equipeData.telefone || null,
      email: equipeData.email || null
    });
    
    let usuarioAtualizado = null;
    
    // Se há dados do usuário para atualizar, processar
    if (equipeData.usuarioData) {
      console.log('🔄 Atualizando dados do usuário chefe...');
      
      // Buscar usuário chefe da equipe
      const usuarios = await usuarioService.getAll();
      const usuarioChefe = usuarios.find(u => u.id_equipe === id);
      
      if (usuarioChefe) {
        const dadosUsuario = {
          login: equipeData.usuarioData.login,
          nome: equipeData.usuarioData.nome,
          tipo: equipeData.usuarioData.tipo
        };
        
        // Se uma nova senha foi fornecida, incluí-la
        if (equipeData.usuarioData.novaSenha && equipeData.usuarioData.novaSenha.trim()) {
          const bcrypt = require('bcrypt');
          dadosUsuario.senha = await bcrypt.hash(equipeData.usuarioData.novaSenha, 10);
        }
        
        await usuarioService.update(usuarioChefe.id, dadosUsuario);
        usuarioAtualizado = usuarioChefe.nome;
        
        console.log(`✅ Usuário chefe atualizado: ${usuarioChefe.nome}`);
      } else {
        console.log('⚠️ Nenhum usuário chefe encontrado para atualizar');
      }
    }
    
    // Log da atualização
    await logService.create({
      dataHora: new Date().toISOString(),
      usuario: user.nome || user.login || 'Sistema',
      acao: 'Atualizou equipe',
      detalhes: `Atualizou equipe: ${equipeData.nome_equipe} (${equipeData.cidade})${usuarioAtualizado ? ` e usuário: ${usuarioAtualizado}` : ''}`,
      tipoUsuario: user.tipo || 'admin'
    });
    
    console.log(`✅ Equipe atualizada com sucesso: ${equipeData.nome_equipe}`);
    
    let mensagem = 'Equipe atualizada com sucesso';
    if (usuarioAtualizado) {
      mensagem = `Equipe e usuário chefe atualizados com sucesso`;
    }
    
    res.json({
      success: true,
      message: mensagem,
      data: {
        id: id,
        nome_equipe: equipeData.nome_equipe,
        cidade: equipeData.cidade,
        usuarioAtualizado: usuarioAtualizado ? true : false,
        usuarioNome: usuarioAtualizado
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao atualizar equipe',
      error: error.message
    });
  }
});

// DELETE /api/equipes/:id - Excluir equipe
router.delete('/:id', verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    console.log(`🗑️ Excluindo equipe ID: ${id}`);
    
    // Verificar se a equipe existe
    const equipe = await equipeService.getById(id);
    if (!equipe) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }
    
    // Verificar e atualizar atletas vinculados (soft delete)
    const atletas = await atletaService.getAll();
    const atletasVinculados = atletas.filter(atleta => atleta.idEquipe === id);
    
    if (atletasVinculados.length > 0) {
      console.log(`🔄 Atualizando ${atletasVinculados.length} atletas vinculados...`);
      
      // Atualizar atletas: status INATIVO e remover vínculo com equipe
      const atletasAtualizados = await atletaService.updateAtletasDaEquipe(id, {
        status: 'INATIVO',
        idEquipe: null
      });
      
      console.log(`✅ ${atletasAtualizados.length} atletas atualizados (status: INATIVO, sem equipe)`);
    }
    
    // Excluir usuários vinculados à equipe (chefe da equipe)
    const usuarios = await usuarioService.getAll();
    const usuariosVinculados = usuarios.filter(usuario => usuario.id_equipe === id);
    
    if (usuariosVinculados.length > 0) {
      console.log(`🔄 Excluindo ${usuariosVinculados.length} usuário(s) chefe(s) da equipe...`);
      
      for (const usuario of usuariosVinculados) {
        await usuarioService.delete(usuario.id);
        console.log(`✅ Usuário chefe excluído: ${usuario.nome} (${usuario.login})`);
      }
    }
    
    // Excluir a equipe
    await equipeService.delete(id);
    
    // Log da exclusão
    await logService.create({
      dataHora: new Date().toISOString(),
      usuario: user.nome || user.login || 'Sistema',
      acao: 'Excluiu equipe',
      detalhes: `Excluiu equipe: ${equipe.nome_equipe} (${equipe.cidade})`,
      tipoUsuario: user.tipo || 'admin'
    });
    
    console.log(`✅ Equipe excluída com sucesso: ${equipe.nome_equipe}`);
    
    let mensagem = 'Equipe excluída com sucesso';
    if (usuariosVinculados.length > 0 && atletasVinculados.length > 0) {
      mensagem = `Equipe excluída com sucesso. ${usuariosVinculados.length} usuário(s) chefe(s) e ${atletasVinculados.length} atleta(s) foram removidos.`;
    } else if (usuariosVinculados.length > 0) {
      mensagem = `Equipe excluída com sucesso. ${usuariosVinculados.length} usuário(s) chefe(s) foi(ram) excluído(s).`;
    } else if (atletasVinculados.length > 0) {
      mensagem = `Equipe excluída com sucesso. ${atletasVinculados.length} atleta(s) foram marcados como inativos e removidos da equipe.`;
    }
    
    res.json({
      success: true,
      message: mensagem,
      data: {
        equipeExcluida: {
          id: id,
          nome_equipe: equipe.nome_equipe,
          cidade: equipe.cidade
        },
        usuariosExcluidos: usuariosVinculados.length,
        atletasExcluidos: atletasVinculados.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao excluir equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao excluir equipe',
      error: error.message
    });
  }
});

// PUT /api/equipes/:id/status - Alterar status da equipe
router.put('/:id/status', verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    
    console.log(`🔄 Alterando status da equipe ID: ${id} para: ${status}`);
    
    // Validar status
    const statusValidos = ['ATIVA', 'INATIVA', 'SUSPENSA', 'PAGO', 'PENDENTE'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Use um dos seguintes: ${statusValidos.join(', ')}`
      });
    }
    
    // Verificar se a equipe existe
    const equipe = await equipeService.getById(id);
    if (!equipe) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }
    
    await equipeService.update(id, { status });
    
    // Log da alteração de status
    await logService.create({
      dataHora: new Date().toISOString(),
      usuario: user.nome || user.login || 'Sistema',
      acao: 'Alterou status da equipe',
      detalhes: `Alterou status da equipe ${equipe.nome_equipe} de ${equipe.status} para ${status}`,
      tipoUsuario: user.tipo || 'admin'
    });
    
    console.log(`✅ Status da equipe alterado com sucesso: ${equipe.nome_equipe} -> ${status}`);
    
    res.json({
      success: true,
      message: 'Status da equipe alterado com sucesso',
      data: {
        id: id,
        nome_equipe: equipe.nome_equipe,
        statusAnterior: equipe.status,
        statusNovo: status
      }
    });
  } catch (error) {
    console.error('❌ Erro ao alterar status da equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao alterar status da equipe',
      error: error.message
    });
  }
});

// GET /api/equipes/:id/usuarios - Buscar usuários da equipe
router.get('/:id/usuarios', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 Buscando usuários da equipe ID: ${id}`);
    
    const usuarios = await usuarioService.getAll();
    const usuariosEquipe = usuarios.filter(usuario => usuario.id_equipe === id);
    
    console.log(`✅ ${usuariosEquipe.length} usuários encontrados para a equipe ${id}`);
    
    res.json({
      success: true,
      data: {
        usuarios: usuariosEquipe,
        total: usuariosEquipe.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários da equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar usuários da equipe',
      error: error.message
    });
  }
});

// GET /api/equipes/:id/atletas - Buscar atletas da equipe
router.get('/:id/atletas', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏃 Buscando atletas da equipe ID: ${id}`);
    
    const atletas = await atletaService.getAll();
    const atletasEquipe = atletas.filter(atleta => atleta.idEquipe === id);
    
    console.log(`✅ ${atletasEquipe.length} atletas encontrados para a equipe ${id}`);
    
    res.json({
      success: true,
      data: {
        atletas: atletasEquipe,
        total: atletasEquipe.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar atletas da equipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar atletas da equipe',
      error: error.message
    });
  }
});

module.exports = router;
