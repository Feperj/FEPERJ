// Gerenciamento de Competições

let competicoes = [];

// Carregar competições
async function loadCompeticoes() {
    const competicoesGrid = document.getElementById('competicoesGrid');
    if (!competicoesGrid) return;
    
    try {
        showLoading(competicoesGrid);
        
        const response = await apiRequest('/competicoes');
        competicoes = response;
        
        renderCompeticoesGrid(competicoes);
        
    } catch (error) {
        console.error('Erro ao carregar competições:', error);
        showAlert('Erro ao carregar competições: ' + error.message, 'error');
        competicoesGrid.innerHTML = '<div class="col-span-full text-center text-red-600">Erro ao carregar dados</div>';
    }
}

// Renderizar grid de competições
function renderCompeticoesGrid(competicoesData) {
    const competicoesGrid = document.getElementById('competicoesGrid');
    if (!competicoesGrid) return;
    
    if (competicoesData.length === 0) {
        competicoesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500">Nenhuma competição encontrada</div>';
        return;
    }
    
    competicoesGrid.innerHTML = competicoesData.map(competicao => {
        const dataInicio = new Date(competicao.data_inicio);
        const dataFim = new Date(competicao.data_fim);
        const hoje = new Date();
        
        let statusClass = 'status-pendente';
        let statusText = 'PENDENTE';
        
        if (hoje < dataInicio) {
            statusClass = 'status-pendente';
            statusText = 'PENDENTE';
        } else if (hoje >= dataInicio && hoje <= dataFim) {
            statusClass = 'status-ativo';
            statusText = 'EM ANDAMENTO';
        } else {
            statusClass = 'status-inativo';
            statusText = 'FINALIZADA';
        }
        
        return `
            <div class="competicao-card">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-lg font-semibold text-gray-900">${competicao.nome}</h4>
                    <div class="flex space-x-2">
                        <button onclick="viewCompeticao('${competicao._id}')" class="btn-view">
                            <i class="fas fa-eye mr-1"></i>Ver
                        </button>
                        ${hasPermission('edit_competicao') ? `
                            <button onclick="editCompeticao('${competicao._id}')" class="btn-edit">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                        ` : ''}
                        ${hasPermission('delete_competicao') ? `
                            <button onclick="deleteCompeticao('${competicao._id}')" class="btn-danger">
                                <i class="fas fa-trash mr-1"></i>Excluir
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="space-y-2">
                    <p><i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>${competicao.local}</p>
                    <p><i class="fas fa-calendar text-gray-400 mr-2"></i>${formatDate(competicao.data_inicio)} a ${formatDate(competicao.data_fim)}</p>
                    <p><i class="fas fa-dollar-sign text-gray-400 mr-2"></i>${formatCurrency(competicao.valor_inscricao)}</p>
                    ${competicao.permite_dobra ? '<p><i class="fas fa-check text-green-400 mr-2"></i>Permite dobra</p>' : ''}
                </div>
                
                <div class="competicao-dates">
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-users mr-1"></i>
                        ${competicao.total_inscricoes || 0} inscrições
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Visualizar competição
function viewCompeticao(competicaoId) {
    const competicao = competicoes.find(c => c._id === competicaoId);
    if (!competicao) {
        showAlert('Competição não encontrada', 'error');
        return;
    }
    
    const modal = document.getElementById('competicaoModal');
    const modalTitle = document.getElementById('competicaoModalTitle');
    
    modalTitle.textContent = 'Detalhes da Competição';
    
    // Preencher formulário com dados da competição
    fillCompeticaoForm(competicao);
    
    // Desabilitar campos para visualização
    disableCompeticaoForm();
    
    showModal('competicaoModal');
}

// Editar competição
function editCompeticao(competicaoId) {
    const competicao = competicoes.find(c => c._id === competicaoId);
    if (!competicao) {
        showAlert('Competição não encontrada', 'error');
        return;
    }
    
    const modal = document.getElementById('competicaoModal');
    const modalTitle = document.getElementById('competicaoModalTitle');
    
    modalTitle.textContent = 'Editar Competição';
    
    // Preencher formulário com dados da competição
    fillCompeticaoForm(competicao);
    
    // Habilitar campos para edição
    enableCompeticaoForm();
    
    // Configurar formulário para edição
    const form = document.getElementById('competicaoForm');
    form.dataset.mode = 'edit';
    form.dataset.competicaoId = competicaoId;
    
    showModal('competicaoModal');
}

// Excluir competição
async function deleteCompeticao(competicaoId) {
    const competicao = competicoes.find(c => c._id === competicaoId);
    if (!competicao) {
        showAlert('Competição não encontrada', 'error');
        return;
    }
    
    if (competicao.total_inscricoes > 0) {
        showAlert('Não é possível excluir uma competição que possui inscrições', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir a competição "${competicao.nome}"?`)) {
        return;
    }
    
    try {
        await apiRequest(`/competicoes/${competicaoId}`, {
            method: 'DELETE'
        });
        
        showAlert('Competição excluída com sucesso!', 'success');
        loadCompeticoes();
        
    } catch (error) {
        console.error('Erro ao excluir competição:', error);
        showAlert('Erro ao excluir competição: ' + error.message, 'error');
    }
}

// Preencher formulário de competição
function fillCompeticaoForm(competicao) {
    document.getElementById('competicaoNome').value = competicao.nome || '';
    document.getElementById('competicaoLocal').value = competicao.local || '';
    document.getElementById('competicaoDataInicio').value = competicao.data_inicio || '';
    document.getElementById('competicaoDataFim').value = competicao.data_fim || '';
    document.getElementById('competicaoValor').value = competicao.valor_inscricao || '';
    document.getElementById('competicaoPermiteDobra').value = competicao.permite_dobra ? 'true' : 'false';
    document.getElementById('competicaoInscricaoInicio').value = competicao.periodo_inscricao_inicio || '';
    document.getElementById('competicaoInscricaoFim').value = competicao.periodo_inscricao_fim || '';
    document.getElementById('competicaoDescricao').value = competicao.descricao || '';
}

// Desabilitar formulário de competição
function disableCompeticaoForm() {
    const form = document.getElementById('competicaoForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Esconder botão de salvar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
}

// Habilitar formulário de competição
function enableCompeticaoForm() {
    const form = document.getElementById('competicaoForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Mostrar botão de salvar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.display = '';
    }
}

// Limpar formulário de competição
function clearCompeticaoForm() {
    const form = document.getElementById('competicaoForm');
    form.reset();
    form.dataset.mode = 'create';
    delete form.dataset.competicaoId;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botão adicionar competição
    const addCompeticaoBtn = document.getElementById('addCompeticaoBtn');
    if (addCompeticaoBtn) {
        addCompeticaoBtn.addEventListener('click', function() {
            const modal = document.getElementById('competicaoModal');
            const modalTitle = document.getElementById('competicaoModalTitle');
            
            modalTitle.textContent = 'Nova Competição';
            
            clearCompeticaoForm();
            enableCompeticaoForm();
            
            showModal('competicaoModal');
        });
    }
    
    // Formulário de competição
    const competicaoForm = document.getElementById('competicaoForm');
    if (competicaoForm) {
        competicaoForm.addEventListener('submit', handleCompeticaoSubmit);
    }
    
    // Calcular datas automaticamente
    const dataInicioInput = document.getElementById('competicaoDataInicio');
    const dataFimInput = document.getElementById('competicaoDataFim');
    const inscricaoInicioInput = document.getElementById('competicaoInscricaoInicio');
    const inscricaoFimInput = document.getElementById('competicaoInscricaoFim');
    
    if (dataInicioInput && dataFimInput) {
        dataInicioInput.addEventListener('change', function() {
            if (this.value && !dataFimInput.value) {
                const dataInicio = new Date(this.value);
                dataInicio.setDate(dataInicio.getDate() + 1);
                dataFimInput.value = dataInicio.toISOString().split('T')[0];
            }
        });
    }
    
    if (dataInicioInput && inscricaoInicioInput) {
        dataInicioInput.addEventListener('change', function() {
            if (this.value && !inscricaoInicioInput.value) {
                const dataInicio = new Date(this.value);
                dataInicio.setDate(dataInicio.getDate() - 30); // 30 dias antes
                inscricaoInicioInput.value = dataInicio.toISOString().split('T')[0];
            }
        });
    }
    
    if (dataInicioInput && inscricaoFimInput) {
        dataInicioInput.addEventListener('change', function() {
            if (this.value && !inscricaoFimInput.value) {
                const dataInicio = new Date(this.value);
                dataInicio.setDate(dataInicio.getDate() - 1); // 1 dia antes
                inscricaoFimInput.value = dataInicio.toISOString().split('T')[0];
            }
        });
    }
});

// Manipular envio do formulário de competição
async function handleCompeticaoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const mode = form.dataset.mode || 'create';
    const competicaoId = form.dataset.competicaoId;
    
    // Coletar dados do formulário
    const competicaoData = {
        nome: document.getElementById('competicaoNome').value.trim(),
        local: document.getElementById('competicaoLocal').value.trim(),
        data_inicio: document.getElementById('competicaoDataInicio').value,
        data_fim: document.getElementById('competicaoDataFim').value,
        valor_inscricao: parseFloat(document.getElementById('competicaoValor').value) || 0,
        permite_dobra: document.getElementById('competicaoPermiteDobra').value === 'true',
        periodo_inscricao_inicio: document.getElementById('competicaoInscricaoInicio').value,
        periodo_inscricao_fim: document.getElementById('competicaoInscricaoFim').value,
        descricao: document.getElementById('competicaoDescricao').value.trim()
    };
    
    // Validações
    if (!competicaoData.nome) {
        showAlert('Nome da competição é obrigatório', 'error');
        return;
    }
    
    if (!competicaoData.local) {
        showAlert('Local é obrigatório', 'error');
        return;
    }
    
    if (!competicaoData.data_inicio) {
        showAlert('Data de início é obrigatória', 'error');
        return;
    }
    
    if (!competicaoData.data_fim) {
        showAlert('Data de fim é obrigatória', 'error');
        return;
    }
    
    if (new Date(competicaoData.data_fim) <= new Date(competicaoData.data_inicio)) {
        showAlert('Data de fim deve ser posterior à data de início', 'error');
        return;
    }
    
    if (competicaoData.valor_inscricao < 0) {
        showAlert('Valor da inscrição não pode ser negativo', 'error');
        return;
    }
    
    if (!competicaoData.periodo_inscricao_inicio) {
        showAlert('Início do período de inscrições é obrigatório', 'error');
        return;
    }
    
    if (!competicaoData.periodo_inscricao_fim) {
        showAlert('Fim do período de inscrições é obrigatório', 'error');
        return;
    }
    
    if (new Date(competicaoData.periodo_inscricao_fim) <= new Date(competicaoData.periodo_inscricao_inicio)) {
        showAlert('Fim do período de inscrições deve ser posterior ao início', 'error');
        return;
    }
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        submitBtn.disabled = true;
        
        if (mode === 'edit') {
            // Atualizar competição
            await apiRequest(`/competicoes/${competicaoId}`, {
                method: 'PUT',
                body: JSON.stringify(competicaoData)
            });
            showAlert('Competição atualizada com sucesso!', 'success');
        } else {
            // Criar nova competição
            await apiRequest('/competicoes', {
                method: 'POST',
                body: JSON.stringify(competicaoData)
            });
            showAlert('Competição criada com sucesso!', 'success');
        }
        
        hideModal('competicaoModal');
        loadCompeticoes();
        
    } catch (error) {
        console.error('Erro ao salvar competição:', error);
        showAlert('Erro ao salvar competição: ' + error.message, 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Função para obter competição por ID
function getCompeticaoById(competicaoId) {
    return competicoes.find(competicao => competicao._id === competicaoId);
}

// Função para obter nome da competição por ID
function getCompeticaoNameById(competicaoId) {
    const competicao = getCompeticaoById(competicaoId);
    return competicao ? competicao.nome : 'N/A';
}

// Função para verificar se uma competição está ativa
function isCompeticaoAtiva(competicaoId) {
    const competicao = getCompeticaoById(competicaoId);
    if (!competicao) return false;
    
    const hoje = new Date();
    const dataInicio = new Date(competicao.data_inicio);
    const dataFim = new Date(competicao.data_fim);
    
    return hoje >= dataInicio && hoje <= dataFim;
}

// Função para verificar se uma competição está no período de inscrições
function isCompeticaoInscricoesAbertas(competicaoId) {
    const competicao = getCompeticaoById(competicaoId);
    if (!competicao) return false;
    
    const hoje = new Date();
    const inicioInscricoes = new Date(competicao.periodo_inscricao_inicio);
    const fimInscricoes = new Date(competicao.periodo_inscricao_fim);
    
    return hoje >= inicioInscricoes && hoje <= fimInscricoes;
}

// Função para obter competições ativas
function getCompeticoesAtivas() {
    return competicoes.filter(competicao => isCompeticaoAtiva(competicao._id));
}

// Função para obter competições com inscrições abertas
function getCompeticoesInscricoesAbertas() {
    return competicoes.filter(competicao => isCompeticaoInscricoesAbertas(competicao._id));
}

// Função para exportar competições para CSV
async function exportCompeticoesCSV() {
    try {
        const competicoesData = await apiRequest('/competicoes');
        
        const csvData = competicoesData.map(competicao => ({
            'Nome': competicao.nome,
            'Local': competicao.local,
            'Data de Início': formatDate(competicao.data_inicio),
            'Data de Fim': formatDate(competicao.data_fim),
            'Valor da Inscrição': formatCurrency(competicao.valor_inscricao),
            'Permite Dobra': competicao.permite_dobra ? 'Sim' : 'Não',
            'Início das Inscrições': formatDate(competicao.periodo_inscricao_inicio),
            'Fim das Inscrições': formatDate(competicao.periodo_inscricao_fim),
            'Total de Inscrições': competicao.total_inscricoes || 0,
            'Descrição': competicao.descricao || '-'
        }));
        
        downloadCSV(csvData, `competicoes_${new Date().toISOString().split('T')[0]}.csv`);
        showAlert('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar competições:', error);
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

// Função para obter estatísticas das competições
function getCompeticaoStats() {
    const hoje = new Date();
    const stats = {
        total: competicoes.length,
        ativas: competicoes.filter(c => {
            const dataInicio = new Date(c.data_inicio);
            const dataFim = new Date(c.data_fim);
            return hoje >= dataInicio && hoje <= dataFim;
        }).length,
        pendentes: competicoes.filter(c => {
            const dataInicio = new Date(c.data_inicio);
            return hoje < dataInicio;
        }).length,
        finalizadas: competicoes.filter(c => {
            const dataFim = new Date(c.data_fim);
            return hoje > dataFim;
        }).length,
        totalInscricoes: competicoes.reduce((sum, c) => sum + (c.total_inscricoes || 0), 0)
    };
    
    return stats;
}
