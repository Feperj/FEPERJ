// Gerenciamento de Inscrições

let inscricoes = [];
let atletas = [];
let competicoes = [];

// Carregar inscrições
async function loadInscricoes() {
    const tableBody = document.getElementById('inscricoesTableBody');
    if (!tableBody) return;
    
    try {
        showLoading(tableBody);
        
        // Carregar dados em paralelo
        const [inscricoesResponse, atletasResponse, competicoesResponse] = await Promise.all([
            apiRequest('/inscricoes'),
            apiRequest('/atletas'),
            apiRequest('/competicoes')
        ]);
        
        inscricoes = inscricoesResponse;
        atletas = atletasResponse;
        competicoes = competicoesResponse;
        
        renderInscricoesTable(inscricoes);
        
    } catch (error) {
        console.error('Erro ao carregar inscrições:', error);
        showAlert('Erro ao carregar inscrições: ' + error.message, 'error');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-red-600">Erro ao carregar dados</td></tr>';
    }
}

// Renderizar tabela de inscrições
function renderInscricoesTable(inscricoesData) {
    const tableBody = document.getElementById('inscricoesTableBody');
    if (!tableBody) return;
    
    if (inscricoesData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">Nenhuma inscrição encontrada</td></tr>';
        return;
    }
    
    tableBody.innerHTML = inscricoesData.map(inscricao => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${inscricao.atleta_nome}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${inscricao.competicao_nome}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${inscricao.categorias ? inscricao.categorias.join(', ') : '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${inscricao.status === 'CONFIRMADA' ? 'status-ativo' : 'status-pendente'}">
                    ${inscricao.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="viewInscricao('${inscricao._id}')" class="btn-view">
                        <i class="fas fa-eye mr-1"></i>Ver
                    </button>
                    ${hasPermission('edit_inscricao') ? `
                        <button onclick="editInscricao('${inscricao._id}')" class="btn-edit">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                    ` : ''}
                    ${hasPermission('delete_inscricao') ? `
                        <button onclick="cancelarInscricao('${inscricao._id}')" class="btn-danger">
                            <i class="fas fa-times mr-1"></i>Cancelar
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Visualizar inscrição
function viewInscricao(inscricaoId) {
    const inscricao = inscricoes.find(i => i._id === inscricaoId);
    if (!inscricao) {
        showAlert('Inscrição não encontrada', 'error');
        return;
    }
    
    // Criar modal dinâmico para visualizar inscrição
    const modalHtml = `
        <div class="modal" id="inscricaoViewModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="text-lg font-medium text-gray-900">Detalhes da Inscrição</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Atleta</label>
                            <p class="mt-1 text-sm text-gray-900">${inscricao.atleta_nome}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Competição</label>
                            <p class="mt-1 text-sm text-gray-900">${inscricao.competicao_nome}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Categorias</label>
                            <p class="mt-1 text-sm text-gray-900">${inscricao.categorias ? inscricao.categorias.join(', ') : '-'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Status</label>
                            <p class="mt-1">
                                <span class="status-badge ${inscricao.status === 'CONFIRMADA' ? 'status-ativo' : 'status-pendente'}">
                                    ${inscricao.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Valor Pago</label>
                            <p class="mt-1 text-sm text-gray-900">${formatCurrency(inscricao.valor_pago)}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Data da Inscrição</label>
                            <p class="mt-1 text-sm text-gray-900">${formatDateTime(inscricao.data_inscricao)}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary modal-close">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior se existir
    const existingModal = document.getElementById('inscricaoViewModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Configurar event listeners
    const modal = document.getElementById('inscricaoViewModal');
    modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    showModal('inscricaoViewModal');
}

// Editar inscrição
function editInscricao(inscricaoId) {
    const inscricao = inscricoes.find(i => i._id === inscricaoId);
    if (!inscricao) {
        showAlert('Inscrição não encontrada', 'error');
        return;
    }
    
    // Implementar edição de inscrição
    showAlert('Funcionalidade de edição de inscrição será implementada em breve', 'info');
}

// Cancelar inscrição
async function cancelarInscricao(inscricaoId) {
    const inscricao = inscricoes.find(i => i._id === inscricaoId);
    if (!inscricao) {
        showAlert('Inscrição não encontrada', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja cancelar a inscrição de "${inscricao.atleta_nome}" na competição "${inscricao.competicao_nome}"?`)) {
        return;
    }
    
    try {
        await apiRequest(`/inscricoes/${inscricaoId}`, {
            method: 'DELETE'
        });
        
        showAlert('Inscrição cancelada com sucesso!', 'success');
        loadInscricoes();
        
    } catch (error) {
        console.error('Erro ao cancelar inscrição:', error);
        showAlert('Erro ao cancelar inscrição: ' + error.message, 'error');
    }
}

// Nova inscrição
function novaInscricao() {
    // Criar modal dinâmico para nova inscrição
    const modalHtml = `
        <div class="modal" id="novaInscricaoModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="text-lg font-medium text-gray-900">Nova Inscrição</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="novaInscricaoForm">
                    <div class="modal-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Atleta</label>
                                <select id="novaInscricaoAtleta" required class="form-select">
                                    <option value="">Selecione um atleta</option>
                                    ${atletas.map(atleta => `
                                        <option value="${atleta._id}">${atleta.nome} - ${formatCPF(atleta.cpf)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Competição</label>
                                <select id="novaInscricaoCompeticao" required class="form-select">
                                    <option value="">Selecione uma competição</option>
                                    ${competicoes.filter(c => isCompeticaoInscricoesAbertas(c._id)).map(competicao => `
                                        <option value="${competicao._id}">${competicao.nome} - ${formatDate(competicao.data_inicio)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Categorias</label>
                                <div id="categoriasContainer" class="space-y-2">
                                    <div class="flex items-center space-x-2">
                                        <input type="text" id="categoria1" placeholder="Categoria 1" class="form-input flex-1">
                                        <button type="button" onclick="adicionarCategoria()" class="btn-primary">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Valor Pago</label>
                                <input type="number" id="novaInscricaoValor" step="0.01" required class="form-input">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary modal-close">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remover modal anterior se existir
    const existingModal = document.getElementById('novaInscricaoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Configurar event listeners
    const modal = document.getElementById('novaInscricaoModal');
    const form = document.getElementById('novaInscricaoForm');
    
    modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    form.addEventListener('submit', handleNovaInscricao);
    
    showModal('novaInscricaoModal');
}

// Adicionar categoria
function adicionarCategoria() {
    const container = document.getElementById('categoriasContainer');
    const categoriaCount = container.children.length + 1;
    
    const categoriaDiv = document.createElement('div');
    categoriaDiv.className = 'flex items-center space-x-2';
    categoriaDiv.innerHTML = `
        <input type="text" id="categoria${categoriaCount}" placeholder="Categoria ${categoriaCount}" class="form-input flex-1">
        <button type="button" onclick="removerCategoria(this)" class="btn-danger">
            <i class="fas fa-minus"></i>
        </button>
    `;
    
    container.appendChild(categoriaDiv);
}

// Remover categoria
function removerCategoria(button) {
    button.parentElement.remove();
}

// Manipular nova inscrição
async function handleNovaInscricao(event) {
    event.preventDefault();
    
    const atletaId = document.getElementById('novaInscricaoAtleta').value;
    const competicaoId = document.getElementById('novaInscricaoCompeticao').value;
    const valorPago = parseFloat(document.getElementById('novaInscricaoValor').value) || 0;
    
    // Coletar categorias
    const categorias = [];
    const categoriaInputs = document.querySelectorAll('#categoriasContainer input');
    categoriaInputs.forEach(input => {
        if (input.value.trim()) {
            categorias.push(input.value.trim());
        }
    });
    
    // Validações
    if (!atletaId) {
        showAlert('Selecione um atleta', 'error');
        return;
    }
    
    if (!competicaoId) {
        showAlert('Selecione uma competição', 'error');
        return;
    }
    
    if (categorias.length === 0) {
        showAlert('Adicione pelo menos uma categoria', 'error');
        return;
    }
    
    if (valorPago < 0) {
        showAlert('Valor pago não pode ser negativo', 'error');
        return;
    }
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        submitBtn.disabled = true;
        
        const inscricaoData = {
            atleta_id: atletaId,
            competicao_id: competicaoId,
            categorias: categorias,
            valor_pago: valorPago,
            status: 'CONFIRMADA'
        };
        
        await apiRequest('/inscricoes', {
            method: 'POST',
            body: JSON.stringify(inscricaoData)
        });
        
        showAlert('Inscrição criada com sucesso!', 'success');
        
        // Fechar modal
        const modal = document.getElementById('novaInscricaoModal');
        modal.remove();
        
        // Recarregar inscrições
        loadInscricoes();
        
    } catch (error) {
        console.error('Erro ao criar inscrição:', error);
        showAlert('Erro ao criar inscrição: ' + error.message, 'error');
    } finally {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botão adicionar inscrição
    const addInscricaoBtn = document.getElementById('addInscricaoBtn');
    if (addInscricaoBtn) {
        addInscricaoBtn.addEventListener('click', novaInscricao);
    }
});

// Função para obter inscrição por ID
function getInscricaoById(inscricaoId) {
    return inscricoes.find(inscricao => inscricao._id === inscricaoId);
}

// Função para obter inscrições por atleta
function getInscricoesByAtleta(atletaId) {
    return inscricoes.filter(inscricao => inscricao.atleta_id === atletaId);
}

// Função para obter inscrições por competição
function getInscricoesByCompeticao(competicaoId) {
    return inscricoes.filter(inscricao => inscricao.competicao_id === competicaoId);
}

// Função para exportar inscrições para CSV
async function exportInscricoesCSV() {
    try {
        const inscricoesData = await apiRequest('/inscricoes');
        
        const csvData = inscricoesData.map(inscricao => ({
            'Atleta': inscricao.atleta_nome,
            'Competição': inscricao.competicao_nome,
            'Categorias': inscricao.categorias ? inscricao.categorias.join(', ') : '-',
            'Status': inscricao.status,
            'Valor Pago': formatCurrency(inscricao.valor_pago),
            'Data da Inscrição': formatDateTime(inscricao.data_inscricao)
        }));
        
        downloadCSV(csvData, `inscricoes_${new Date().toISOString().split('T')[0]}.csv`);
        showAlert('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar inscrições:', error);
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

// Event listener para exportar inscrições
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportInscricoesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportInscricoesCSV);
    }
});

// Função para obter estatísticas das inscrições
function getInscricaoStats() {
    const stats = {
        total: inscricoes.length,
        confirmadas: inscricoes.filter(i => i.status === 'CONFIRMADA').length,
        pendentes: inscricoes.filter(i => i.status === 'PENDENTE').length,
        totalValor: inscricoes.reduce((sum, i) => sum + (i.valor_pago || 0), 0)
    };
    
    return stats;
}

// Função para obter inscrições por período
function getInscricoesByPeriodo(dataInicio, dataFim) {
    return inscricoes.filter(inscricao => {
        const dataInscricao = new Date(inscricao.data_inscricao);
        return dataInscricao >= dataInicio && dataInscricao <= dataFim;
    });
}
