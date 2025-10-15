const API_BASE_URL = window.location.origin;
let competicoes = [];
let editingId = null;
let currentUser = null;

// Verificar autenticação e permissões
window.addEventListener('load', function() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (!token || !userInfo) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userInfo);
        document.getElementById('userName').textContent = currentUser.nome;
        document.getElementById('userRole').textContent = currentUser.tipo === 'admin' ? 'Administrador' : 'Usuário';
        
        // Configurar permissões baseadas no tipo de usuário
        configurarPermissoes();
        
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        logout();
    }
    
    loadCompeticoes();
});

function configurarPermissoes() {
    if (currentUser.tipo === 'admin') {
        // Admin pode ver botão de exportar
        document.getElementById('btnExportExcel').style.display = 'inline-block';
        document.getElementById('pageSubtitle').textContent = 'Gerenciamento completo de competições';
    } else {
        // Usuário comum vê apenas competições
        document.getElementById('pageSubtitle').textContent = 'Visualização de competições';
    }
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// Mostrar alerta
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Carregar competições
async function loadCompeticoes() {
    try {
        console.log('🔍 Carregando competições...');
        const token = localStorage.getItem('authToken');
        console.log('🔍 Token encontrado:', !!token);
        
        const response = await fetch(`${API_BASE_URL}/api/competicoes`);
        
        console.log('🔍 Status da resposta:', response.status);
        const data = await response.json();
        console.log('🔍 Dados recebidos:', data);
        
        if (data.success) {
            competicoes = data.data.competicoes;
            console.log('✅ Competições carregadas:', competicoes.length);
            renderCompeticoes();
            updateStats();
        } else {
            throw new Error(data.error || 'Erro ao carregar competições');
        }
    } catch (error) {
        console.error('Erro ao carregar competições:', error);
        showAlert('Erro ao carregar competições. Tente novamente.', 'error');
    } finally {
        document.getElementById('loadingContainer').style.display = 'none';
    }
}

// Renderizar competições
function renderCompeticoes() {
    const tbody = document.getElementById('competicoesTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (competicoes.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = competicoes.map(competicao => {
        const statusBadge = getStatusBadge(competicao.status);
        const dataFormatada = competicao.data_competicao ? new Date(competicao.data_competicao).toLocaleDateString('pt-BR') : '-';
        const valorFormatado = competicao.valor_inscricao ? `R$ ${competicao.valor_inscricao.toFixed(2)}` : '-';
        const totalInscricoes = competicao.inscricoes ? competicao.inscricoes[0]?.count || 0 : 0;
        
        return `
            <tr>
                <td class="font-semibold text-gray-800">${competicao.nome_competicao}</td>
                <td>${dataFormatada}</td>
                <td>${competicao.local || '-'}</td>
                <td>${valorFormatado}</td>
                <td>
                    <span class="badge badge-info">
                        ${totalInscricoes} inscrições
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="abrirResumoCompeticao('${competicao.id}')" class="btn-primary mr-2" title="Ver Competição">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCompeticao('${competicao.id}')" class="btn-warning mr-2" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCompeticao('${competicao.id}', '${competicao.nome_competicao}')" class="btn-danger" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'AGENDADA': '<span class="badge badge-warning">Agendada</span>',
        'REALIZADA': '<span class="badge badge-success">Realizada</span>',
        'CANCELADA': '<span class="badge badge-danger">Cancelada</span>'
    };
    return badges[status] || badges['AGENDADA'];
}

// Get status class for styling
function getStatusClass(status) {
    const classes = {
        'AGENDADA': 'warning',
        'REALIZADA': 'success',
        'CANCELADA': 'danger'
    };
    return classes[status] || 'warning';
}

// Atualizar estatísticas
function updateStats() {
    const totalCompeticoes = competicoes.length;
    const competicoesAtivas = competicoes.filter(c => c.status === 'AGENDADA').length;
    const totalInscricoes = competicoes.reduce((sum, c) => sum + (c.inscricoes ? c.inscricoes[0]?.count || 0 : 0), 0);
    const receitaTotal = competicoes.reduce((sum, c) => {
        const inscricoes = c.inscricoes ? c.inscricoes[0]?.count || 0 : 0;
        return sum + (c.valor_inscricao * inscricoes);
    }, 0);
    
    document.getElementById('totalCompeticoes').textContent = totalCompeticoes;
    document.getElementById('competicoesAtivas').textContent = competicoesAtivas;
    document.getElementById('totalInscricoes').textContent = totalInscricoes;
    document.getElementById('receitaTotal').textContent = `R$ ${receitaTotal.toFixed(2)}`;
}

// Abrir modal
function openModal() {
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem gerenciar competições.', 'error');
        return;
    }
    
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Nova Competição';
    document.getElementById('competicaoForm').reset();
    document.getElementById('competicaoModal').classList.add('active');
}

// Fechar modal
function closeModal() {
    document.getElementById('competicaoModal').classList.remove('active');
    editingId = null;
}

// Editar competição
function editCompeticao(id) {
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem editar competições.', 'error');
        return;
    }
    
    const competicao = competicoes.find(c => c.id === id);
    if (!competicao) return;
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Competição';
    
    // Preencher formulário
    document.getElementById('nomeCompeticao').value = competicao.nome_competicao || '';
    document.getElementById('dataCompeticao').value = competicao.data_competicao ? competicao.data_competicao.split('T')[0] : '';
    document.getElementById('local').value = competicao.local || '';
    document.getElementById('valorInscricao').value = competicao.valor_inscricao || '';
    document.getElementById('valorDobra').value = competicao.valor_dobra || '';
    document.getElementById('modalidade').value = competicao.modalidade || '';
    document.getElementById('dataInicioInscricao').value = competicao.data_inicio_inscricao ? competicao.data_inicio_inscricao.split('T')[0] : '';
    document.getElementById('dataFimInscricao').value = competicao.data_fim_inscricao ? competicao.data_fim_inscricao.split('T')[0] : '';
    document.getElementById('dataNominacaoPreliminar').value = competicao.data_nominacao_preliminar ? competicao.data_nominacao_preliminar.split('T')[0] : '';
    document.getElementById('dataNominacaoFinal').value = competicao.data_nominacao_final ? competicao.data_nominacao_final.split('T')[0] : '';
    document.getElementById('status').value = competicao.status || 'AGENDADA';
    document.getElementById('descricao').value = competicao.descricao || '';
    document.getElementById('permiteDobraCategoria').checked = competicao.permite_dobra_categoria || false;
    
    document.getElementById('competicaoModal').classList.add('active');
}

// Submeter formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    console.log('🔍 Submetendo formulário de competição...');
    console.log('🔍 Current user:', currentUser);
    
    if (!currentUser) {
        showAlert('Usuário não autenticado.', 'error');
        return;
    }
    
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem gerenciar competições.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    
    const competicaoData = {
        nome_competicao: document.getElementById('nomeCompeticao').value,
        data_competicao: document.getElementById('dataCompeticao').value,
        local: document.getElementById('local').value,
        valor_inscricao: parseFloat(document.getElementById('valorInscricao').value),
        valor_dobra: document.getElementById('valorDobra').value ? parseFloat(document.getElementById('valorDobra').value) : null,
        modalidade: document.getElementById('modalidade').value,
        data_inicio_inscricao: document.getElementById('dataInicioInscricao').value,
        data_fim_inscricao: document.getElementById('dataFimInscricao').value,
        data_nominacao_preliminar: document.getElementById('dataNominacaoPreliminar').value || null,
        data_nominacao_final: document.getElementById('dataNominacaoFinal').value || null,
        status: document.getElementById('status').value,
        descricao: document.getElementById('descricao').value,
        permite_dobra_categoria: document.getElementById('permiteDobraCategoria').checked
    };
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (editingId) {
            // Atualizar competição existente
            const response = await fetch(`${API_BASE_URL}/api/competicoes/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(competicaoData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Competição atualizada com sucesso!', 'success');
                closeModal();
                loadCompeticoes();
            } else {
                throw new Error(data.error || 'Erro ao atualizar competição');
            }
        } else {
            // Criar nova competição
            console.log('🔍 Criando nova competição...');
            console.log('🔍 Dados da competição:', competicaoData);
            
            const response = await fetch(`${API_BASE_URL}/api/competicoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(competicaoData)
            });
            
            console.log('🔍 Status da resposta:', response.status);
            const data = await response.json();
            console.log('🔍 Resposta da API:', data);
            
            if (data.success) {
                showAlert('Competição criada com sucesso!', 'success');
                closeModal();
                loadCompeticoes();
            } else {
                throw new Error(data.error || 'Erro ao criar competição');
            }
        }
    } catch (error) {
        console.error('Erro ao salvar competição:', error);
        showAlert('Erro ao salvar competição. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar';
    }
}

// Excluir competição
async function deleteCompeticao(id, nome) {
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem excluir competições.', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir a competição "${nome}"?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/competicoes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Competição excluída com sucesso!', 'success');
            loadCompeticoes();
        } else {
            throw new Error(data.error || 'Erro ao excluir competição');
        }
    } catch (error) {
        console.error('Erro ao excluir competição:', error);
        showAlert('Erro ao excluir competição. Tente novamente.', 'error');
    }
}

// Exportar Excel
function exportarExcel() {
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem exportar dados.', 'error');
        return;
    }
    
    try {
        // Preparar dados para Excel
        const dados = competicoes.map(competicao => {
            const dataFormatada = competicao.data_competicao ? new Date(competicao.data_competicao).toLocaleDateString('pt-BR') : '';
            const valorFormatado = competicao.valor_inscricao ? `R$ ${competicao.valor_inscricao.toFixed(2)}` : '';
            const totalInscricoes = competicao.inscricoes ? competicao.inscricoes[0]?.count || 0 : 0;
            
            return {
                'Nome': competicao.nome_competicao,
                'Data': dataFormatada,
                'Local': competicao.local || '',
                'Valor Inscrição': valorFormatado,
                'Modalidade': competicao.modalidade || '',
                'Status': competicao.status,
                'Inscrições': totalInscricoes,
                'Descrição': competicao.descricao || ''
            };
        });
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // Criar worksheet
        const ws = XLSX.utils.json_to_sheet(dados);
        
        // Ajustar largura das colunas
        const colWidths = [
            { wch: 30 }, // Nome
            { wch: 12 }, // Data
            { wch: 25 }, // Local
            { wch: 15 }, // Valor
            { wch: 15 }, // Modalidade
            { wch: 12 }, // Status
            { wch: 12 }, // Inscrições
            { wch: 40 }  // Descrição
        ];
        ws['!cols'] = colWidths;
        
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Competições');
        
        // Gerar arquivo Excel
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // Criar blob e fazer download
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `competicoes_feperj_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        
        // Limpar URL
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
        
        showAlert(`${competicoes.length} competições exportadas para Excel com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        showAlert('Erro ao exportar dados para Excel', 'error');
    }
}

// Filtros e busca
document.getElementById('searchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredCompeticoes = competicoes.filter(competicao => {
        const matchesSearch = competicao.nome_competicao.toLowerCase().includes(searchTerm) ||
                             (competicao.local && competicao.local.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || competicao.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderFilteredCompeticoes(filteredCompeticoes);
});

document.getElementById('statusFilter').addEventListener('change', function() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = this.value;
    
    const filteredCompeticoes = competicoes.filter(competicao => {
        const matchesSearch = competicao.nome_competicao.toLowerCase().includes(searchTerm) ||
                             (competicao.local && competicao.local.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || competicao.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderFilteredCompeticoes(filteredCompeticoes);
});

function renderFilteredCompeticoes(filteredCompeticoes) {
    const tbody = document.getElementById('competicoesTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredCompeticoes.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredCompeticoes.map(competicao => {
        const statusBadge = getStatusBadge(competicao.status);
        const dataFormatada = competicao.data_competicao ? new Date(competicao.data_competicao).toLocaleDateString('pt-BR') : '-';
        const valorFormatado = competicao.valor_inscricao ? `R$ ${competicao.valor_inscricao.toFixed(2)}` : '-';
        const totalInscricoes = competicao.inscricoes ? competicao.inscricoes[0]?.count || 0 : 0;
        
        return `
            <tr>
                <td class="font-semibold text-gray-800">${competicao.nome_competicao}</td>
                <td>${dataFormatada}</td>
                <td>${competicao.local || '-'}</td>
                <td>${valorFormatado}</td>
                <td>
                    <span class="badge badge-info">
                        ${totalInscricoes} inscrições
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="abrirResumoCompeticao('${competicao.id}')" class="btn-primary mr-2" title="Ver Competição">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCompeticao('${competicao.id}')" class="btn-warning mr-2" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCompeticao('${competicao.id}', '${competicao.nome_competicao}')" class="btn-danger" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Configurar preenchimento automático das datas de nominata
document.addEventListener('DOMContentLoaded', function() {
    const dataCompeticaoInput = document.getElementById('dataCompeticao');
    
    if (dataCompeticaoInput) {
        dataCompeticaoInput.addEventListener('change', function() {
            const dataCompeticao = this.value;
            
            if (dataCompeticao) {
                const dataCompeticaoObj = new Date(dataCompeticao);
                
                // Nominata preliminar: 60 dias antes
                const dataNominacaoPreliminar = new Date(dataCompeticaoObj);
                dataNominacaoPreliminar.setDate(dataCompeticaoObj.getDate() - 60);
                
                // Nominata final: 21 dias antes
                const dataNominacaoFinal = new Date(dataCompeticaoObj);
                dataNominacaoFinal.setDate(dataCompeticaoObj.getDate() - 21);
                
                // Preencher os campos automaticamente
                document.getElementById('dataNominacaoPreliminar').value = dataNominacaoPreliminar.toISOString().split('T')[0];
                document.getElementById('dataNominacaoFinal').value = dataNominacaoFinal.toISOString().split('T')[0];
            }
        });
    }
});

// Variáveis globais para modal de inscrições
let currentCompeticaoModal = null;
let inscricoesModal = [];
let atletasDisponiveisModal = [];
let atletasSelecionadosCategorizacao = [];

// Variáveis globais para fluxo de inscrição
let atletaSelecionado = null;
let atletasDisponiveis = [];
let modalidadeCategorizacao = '';
let observacoesCategorizacao = '';
let categorizacaoAtletas = new Map();

// Abrir modal de resumo da competição
async function abrirInscricoes(idCompeticao) {
    try {
        console.log('🔍 Abrindo resumo da competição:', idCompeticao);
        console.log('🔍 Lista de competições:', competicoes);
        
        // Buscar dados da competição
        const competicao = competicoes.find(c => c.id === idCompeticao);
        if (!competicao) {
            console.error('❌ Competição não encontrada:', idCompeticao);
            console.error('❌ Competições disponíveis:', competicoes.map(c => ({ id: c.id, nome: c.nome_competicao })));
            showAlert('Competição não encontrada', 'error');
            return;
        }
        
        console.log('✅ Competição encontrada:', competicao.nome_competicao);
        currentCompeticaoModal = competicao;
        
        // Atualizar informações da competição no modal de resumo
        document.getElementById('resumoCompeticaoNome').textContent = competicao.nome_competicao || 'Competição';
        document.getElementById('resumoDataCompeticao').textContent = formatarData(competicao.data_competicao);
        document.getElementById('resumoLocalCompeticao').textContent = competicao.local || 'Não informado';
        document.getElementById('resumoStatusCompeticao').textContent = competicao.status || 'AGENDADA';
        document.getElementById('resumoModalidadeCompeticao').textContent = getModalidadeLabel(competicao.modalidade);
        document.getElementById('resumoValorCompeticao').textContent = `R$ ${competicao.valor_inscricao || 0}`;
        
        // Carregar total de inscrições (simplificado)
        document.getElementById('resumoTotalInscricoes').textContent = '0';
        
        // Atualizar descrição
        const descricaoElement = document.querySelector('#resumoDescricaoCompeticao p');
        if (descricaoElement) {
            descricaoElement.textContent = competicao.descricao || 'Nenhuma descrição disponível';
        }
        
        // Mostrar modal de resumo
        document.getElementById('resumoCompeticaoModal').classList.add('active');
        console.log('✅ Modal de resumo da competição aberto');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de resumo:', error);
        showAlert('Erro ao abrir resumo da competição', 'error');
    }
}

// Fechar modal de resumo da competição
function closeResumoCompeticaoModal() {
    document.getElementById('resumoCompeticaoModal').classList.remove('active');
    currentCompeticaoModal = null;
}

// Excluir competição
async function deleteCompeticao(id, nome) {
    try {
        // Confirmar exclusão
        const confirmar = confirm(`Tem certeza que deseja excluir a competição "${nome}"?\n\nEsta ação não pode ser desfeita e excluirá todas as inscrições relacionadas.`);
        
        if (!confirmar) {
            return;
        }
        
        console.log('🔍 Excluindo competição:', id);
        
        const response = await fetch(`${API_BASE_URL}/api/competicoes/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Competição excluída com sucesso!', 'success');
            
            // Recarregar lista de competições
            await loadCompeticoes();
        } else {
            throw new Error(data.error || 'Erro ao excluir competição');
        }
        
    } catch (error) {
        console.error('Erro ao excluir competição:', error);
        showAlert('Erro ao excluir competição: ' + error.message, 'error');
    }
}

// Abrir modal de inscrições (lista)
async function abrirInscricoesListaModal() {
    try {
        console.log('🔍 Abrindo modal de lista de inscrições...');
        
        if (!currentCompeticaoModal) {
            console.log('❌ Nenhuma competição selecionada, abrindo seletor...');
            await abrirSeletorCompeticao();
            return;
        }
        
        console.log('✅ Competição selecionada:', currentCompeticaoModal.nome_competicao);
        
        // Fechar modal de resumo
        closeResumoCompeticaoModal();
        
        // Atualizar informações da competição no modal de inscrições
        document.getElementById('competicaoNomeModal').textContent = currentCompeticaoModal.nome_competicao;
        document.getElementById('competicaoDataModal').textContent = `Data: ${formatarData(currentCompeticaoModal.data_competicao)}`;
        document.getElementById('competicaoLocalModal').textContent = `Local: ${currentCompeticaoModal.local || 'Não informado'}`;
        document.getElementById('competicaoStatusModal').textContent = currentCompeticaoModal.status;
        document.getElementById('competicaoStatusModal').className = `badge badge-${getStatusClass(currentCompeticaoModal.status)}`;
        
        // Mostrar modal de inscrições
        document.getElementById('inscricoesModal').classList.add('active');
        
        // Carregar inscrições
        await carregarInscricoesModal(currentCompeticaoModal.id);
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de inscrições:', error);
        showAlert('Erro ao abrir inscrições', 'error');
    }
}

// Abrir modal de inscrições (nova inscrição)
async function abrirInscricoesModal(idCompeticao = null) {
    try {
        // Verificar autenticação primeiro (temporariamente desabilitado para teste)
        console.log('🔍 Tentando abrir modal de inscrições...');
        // if (!verificarAutenticacao()) {
        //     return;
        // }

        // Se um ID foi fornecido, buscar a competição
        if (idCompeticao) {
            const competicao = competicoes.find(c => c.id === idCompeticao);
            if (!competicao) {
                showAlert('Competição não encontrada', 'error');
                return;
            }
            currentCompeticaoModal = competicao;
        }

        if (!currentCompeticaoModal) {
            showAlert('Nenhuma competição selecionada', 'error');
            return;
        }
        
        console.log('🔍 Abrindo modal de nova inscrição para:', currentCompeticaoModal.nome_competicao);
        
        // Fechar modal de resumo
        closeResumoCompeticaoModal();
        
        // Abrir modal de nova inscrição diretamente
        await abrirNovaInscricaoModal();
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de inscrições:', error);
        showAlert('Erro ao abrir inscrições', 'error');
    }
}

// Função auxiliar para selecionar competição e abrir modal de inscrição
async function selecionarCompeticaoEInscricao(idCompeticao) {
    try {
        console.log('🔍 Selecionando competição:', idCompeticao);
        
        // Buscar a competição
        const competicao = competicoes.find(c => c.id === idCompeticao);
        if (!competicao) {
            showAlert('Competição não encontrada', 'error');
            return;
        }
        
        // Definir como competição atual
        currentCompeticaoModal = competicao;
        console.log('✅ Competição selecionada:', competicao.nome_competicao);
        
        // Abrir modal de inscrição
        await abrirInscricoesModal();
        
    } catch (error) {
        console.error('❌ Erro ao selecionar competição:', error);
        showAlert('Erro ao selecionar competição', 'error');
    }
}

// Abrir seletor de competição para inscrição
async function abrirSeletorCompeticao() {
    try {
        console.log('🔍 Abrindo seletor de competição...');
        console.log('🔍 Competicoes disponíveis:', competicoes.length);
        
        if (competicoes.length === 0) {
            console.log('❌ Nenhuma competição disponível');
            showAlert('Nenhuma competição disponível', 'error');
            return;
        }
        
        // Criar lista de competições para seleção
        let opcoes = 'Selecione uma competição:\n\n';
        competicoes.forEach((comp, index) => {
            const data = comp.data_competicao ? new Date(comp.data_competicao).toLocaleDateString('pt-BR') : 'Data não definida';
            opcoes += `${index + 1}. ${comp.nome_competicao} - ${data}\n`;
        });
        
        console.log('🔍 Opções criadas:', opcoes);
        
        const selecao = prompt(opcoes + '\nDigite o número da competição:');
        console.log('🔍 Seleção do usuário:', selecao);
        
        if (selecao === null) {
            console.log('🔍 Usuário cancelou');
            return; // Usuário cancelou
        }
        
        const indice = parseInt(selecao) - 1;
        console.log('🔍 Índice calculado:', indice);
        
        if (isNaN(indice) || indice < 0 || indice >= competicoes.length) {
            console.log('❌ Seleção inválida');
            showAlert('Seleção inválida', 'error');
            return;
        }
        
        const competicaoSelecionada = competicoes[indice];
        console.log('✅ Competição selecionada:', competicaoSelecionada.nome_competicao);
        
        // Definir como competição atual
        currentCompeticaoModal = competicaoSelecionada;
        console.log('✅ currentCompeticaoModal definida:', currentCompeticaoModal);
        
        // Abrir modal de inscrição
        console.log('🔍 Abrindo modal de inscrição...');
        await abrirInscricoesModal();
        
    } catch (error) {
        console.error('❌ Erro ao abrir seletor de competição:', error);
        showAlert('Erro ao abrir seletor de competição', 'error');
    }
}

// Abrir modal de nominação
async function abrirNominacaoModal() {
    try {
        if (!currentCompeticaoModal) {
            showAlert('Nenhuma competição selecionada', 'error');
            return;
        }
        
        showAlert('Funcionalidade de nominação será implementada em breve', 'info');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de nominação:', error);
        showAlert('Erro ao abrir nominação', 'error');
    }
}

// Verificar se usuário está autenticado
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    console.log('🔍 Verificando autenticação...');
    console.log('🔍 Token encontrado:', !!token);
    console.log('🔍 Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
        console.log('❌ Token não encontrado');
        showAlert('Você precisa fazer login para acessar esta funcionalidade. Redirecionando...', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return false;
    }
    
    console.log('✅ Token válido encontrado');
    return true;
}

// Formatar data
function formatarData(data) {
    if (!data) return 'Não informado';
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
}

// Carregar total de inscrições
async function carregarTotalInscricoes(idCompeticao) {
    try {
        console.log('🔍 Carregando total de inscrições para competição:', idCompeticao);
        
        // Por enquanto, definir como 0 para evitar problemas de autenticação
        document.getElementById('resumoTotalInscricoes').textContent = '0';
        
    } catch (error) {
        console.error('❌ Erro ao carregar total de inscrições:', error);
        document.getElementById('resumoTotalInscricoes').textContent = '0';
    }
}

// Fechar modal de inscrições
function closeInscricoesModal() {
    document.getElementById('inscricoesModal').classList.remove('active');
    currentCompeticaoModal = null;
    inscricoesModal = [];
    atletasDisponiveisModal = [];
}

// Função removida - usando a versão correta mais abaixo no arquivo

// Renderizar tabela de inscrições no modal
function renderizarTabelaInscricoesModal() {
    const tbody = document.getElementById('inscricoesTableBodyModal');
    const tableContainer = document.getElementById('tableContainerModal');
    const emptyState = document.getElementById('emptyStateModal');
    
    if (inscricoesModal.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = inscricoesModal.map(inscricao => {
        const atleta = inscricao.atleta;
        const equipe = atleta?.equipe;
        
        return `
            <tr>
                <td>
                    <div class="font-semibold">${atleta?.nome || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${atleta?.cpf || 'N/A'}</div>
                </td>
                <td>${equipe?.nome_equipe || 'N/A'}</td>
                <td>
                    <span class="badge badge-info">
                        ${getModalidadeLabel(inscricao.modalidade)}
                    </span>
                </td>
                <td>${inscricao.categoria_peso || 'N/A'}</td>
                <td>${inscricao.categoria_idade || 'N/A'}</td>
                <td class="font-semibold">R$ ${inscricao.valor_individual?.toFixed(2) || '0,00'}</td>
                <td>
                    <span class="badge badge-${getStatusInscricaoClass(inscricao.status_inscricao)}">
                        ${getStatusInscricaoLabel(inscricao.status_inscricao)}
                    </span>
                </td>
                <td>
                    <div class="flex space-x-2">
                        <button onclick="editarInscricaoModal('${inscricao.id}')" class="btn-warning" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="excluirInscricaoModal('${inscricao.id}')" class="btn-danger" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Atualizar estatísticas do modal
function atualizarEstatisticasModal() {
    const totalInscricoes = inscricoesModal.length;
    const inscricoesConfirmadas = inscricoesModal.filter(insc => insc.status_inscricao === 'INSCRITO').length;
    const receitaTotal = inscricoesModal.reduce((total, insc) => total + (insc.valor_individual || 0), 0);
    const equipesUnicas = new Set(inscricoesModal.map(insc => insc.atleta?.equipe?.id)).size;
    
    document.getElementById('totalInscricoesModal').textContent = totalInscricoes;
    document.getElementById('inscricoesConfirmadasModal').textContent = inscricoesConfirmadas;
    document.getElementById('receitaTotalModal').textContent = `R$ ${receitaTotal.toFixed(2)}`;
    document.getElementById('equipesParticipantesModal').textContent = equipesUnicas;
}

// Nova inscrição no modal
async function novaInscricaoModal() {
    // Verificar autenticação primeiro
    if (!verificarAutenticacao()) {
        return;
    }

    if (!currentCompeticaoModal) {
        showAlertModal('Competição não carregada', 'error');
        return;
    }
    
    try {
        console.log('🔍 Abrindo modal de nova inscrição para:', currentCompeticaoModal.nome_competicao);
        
        // Limpar formulário
        document.getElementById('inscricaoFormModal').reset();
        document.getElementById('inscricaoModalTitle').textContent = 'Nova Inscrição';
        document.getElementById('submitBtnModal').innerHTML = '<i class="fas fa-save mr-2"></i>Salvar';
        
        // Mostrar modal primeiro
        document.getElementById('inscricaoModal').classList.add('active');
        
        // Carregar atletas disponíveis (sem bloquear a abertura do modal)
        carregarAtletasDisponiveisModal();
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de inscrição:', error);
        showAlertModal('Erro ao abrir formulário de inscrição', 'error');
    }
}

// Carregar atletas disponíveis para o modal
async function carregarAtletasDisponiveisModal() {
    try {
        // Verificar autenticação
        if (!verificarAutenticacao()) {
            return;
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/inscricoes/atletas-disponiveis/${currentCompeticaoModal.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            atletasDisponiveisModal = data.data.atletas || [];
            
            // Renderizar lista de atletas
            renderizarListaAtletasModal();
        } else if (response.status === 401) {
            console.log('❌ Token inválido, redirecionando para login');
            window.location.href = '/login.html';
        } else {
            console.error('❌ Erro ao carregar atletas disponíveis:', response.status);
            showAlertModal('Erro ao carregar atletas disponíveis', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar atletas disponíveis:', error);
        showAlertModal('Erro ao carregar atletas disponíveis', 'error');
    }
}

// Renderizar lista de atletas no modal
function renderizarListaAtletasModal() {
    const container = document.getElementById('atletasListModal');
    
    if (atletasDisponiveisModal.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum atleta disponível para inscrição</p>';
        return;
    }
    
    container.innerHTML = atletasDisponiveisModal.map(atleta => {
        const equipe = atleta.equipe;
        return `
            <div class="checkbox-group">
                <input type="checkbox" id="atleta_modal_${atleta.id}" value="${atleta.id}" onchange="toggleAtletaModal('${atleta.id}')">
                <label for="atleta_modal_${atleta.id}" class="cursor-pointer">
                    <div class="font-semibold">${atleta.nome}</div>
                    <div class="text-sm text-gray-500">${equipe?.nome_equipe || 'N/A'} • CPF: ${atleta.cpf}</div>
                </label>
            </div>
        `;
    }).join('');
}

// Toggle atleta no modal
function toggleAtletaModal(atletaId) {
    console.log('Toggle atleta modal:', atletaId);
}

// Fechar modal de inscrição
function closeInscricaoModal() {
    document.getElementById('inscricaoModal').classList.remove('active');
}

// Fechar modal de nova inscrição
function closeNovaInscricaoModal() {
    document.getElementById('novaInscricaoModal').classList.remove('active');
    // Limpar formulário
    document.getElementById('novaInscricaoForm').reset();
    document.getElementById('atletaSelect').innerHTML = '<option value="">Carregando atletas...</option>';
}

// Abrir modal de nova inscrição
async function abrirNovaInscricaoModal() {
    try {
        // verificarAutenticacao(); // Temporariamente desabilitado para teste
        
        // Fechar modal de resumo se estiver aberto
        closeResumoCompeticaoModal();
        
        // Abrir modal de nova inscrição
        document.getElementById('novaInscricaoModal').classList.add('active');
        
        // Carregar atletas disponíveis
        await carregarAtletasDisponiveis();
        
        // Carregar categorias
        carregarCategorias();
        
    } catch (error) {
        console.error('Erro ao abrir modal de nova inscrição:', error);
        showAlert('Erro ao abrir modal de inscrição', 'error');
    }
}

// Carregar atletas disponíveis
async function carregarAtletasDisponiveis() {
    try {
        console.log('🔍 Carregando atletas disponíveis...');
        console.log('🔍 currentCompeticaoModal:', currentCompeticaoModal);
        
        if (!currentCompeticaoModal) {
            console.error('❌ currentCompeticaoModal não está definida');
            showAlert('Erro: Competição não selecionada', 'error');
            return;
        }
        
        const atletaSelect = document.getElementById('atletaSelect');
        atletaSelect.innerHTML = '<option value="">Carregando atletas...</option>';
        
        console.log('🔍 Fazendo requisição para:', `${API_BASE_URL}/api/inscricoes/atletas-disponiveis/${currentCompeticaoModal.id}`);
        
        // Temporariamente sem autenticação para teste
        const response = await fetch(`${API_BASE_URL}/api/inscricoes/atletas-disponiveis/${currentCompeticaoModal.id}`);
        console.log('🔍 Status da resposta:', response.status);
        
        const data = await response.json();
        console.log('🔍 Dados recebidos:', data);
        
        if (data.success) {
            const atletas = data.data.atletas;
            
            if (atletas.length === 0) {
                atletaSelect.innerHTML = '<option value="">Nenhum atleta disponível</option>';
                return;
            }
            
            atletaSelect.innerHTML = '<option value="">Selecione um atleta...</option>' + 
                atletas.map(atleta => `
                    <option value="${atleta.id}">
                        ${atleta.nome} - ${atleta.equipe?.nome_equipe || 'N/A'} (CPF: ${atleta.cpf})
                    </option>
                `).join('');
        } else {
            throw new Error(data.error || 'Erro ao carregar atletas');
        }
    } catch (error) {
        console.error('Erro ao carregar atletas disponíveis:', error);
        document.getElementById('atletaSelect').innerHTML = '<option value="">Erro ao carregar atletas</option>';
        showAlert('Erro ao carregar atletas disponíveis', 'error');
    }
}

// Carregar categorias
function carregarCategorias() {
    // Carregar categorias de peso
    const categoriaPesoSelect = document.getElementById('categoriaPesoSelect');
    categoriaPesoSelect.innerHTML = '<option value="">Selecione...</option>' +
        categoriasPeso.map(cat => `
            <option value="${cat.id}">${cat.nome} - ${cat.descricao}</option>
        `).join('');
    
    // Carregar categorias de idade
    const categoriaIdadeSelect = document.getElementById('categoriaIdadeSelect');
    categoriaIdadeSelect.innerHTML = '<option value="">Selecione...</option>' +
        categoriasIdade.map(cat => `
            <option value="${cat.id}">${cat.nome} - ${cat.descricao}</option>
        `).join('');
}

// Handle submit do formulário de nova inscrição
async function handleNovaInscricaoSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const atletaId = document.getElementById('atletaSelect').value;
        const modalidade = document.getElementById('modalidadeSelect').value;
        const categoriaPeso = document.getElementById('categoriaPesoSelect').value;
        const categoriaIdade = document.getElementById('categoriaIdadeSelect').value;
        const valorIndividual = parseFloat(document.getElementById('valorIndividual').value) || 0;
        const temDobra = document.getElementById('temDobra').checked;
        const observacoes = document.getElementById('observacoesInscricao').value;
        
        if (!atletaId || !modalidade || !categoriaPeso || !categoriaIdade) {
            showAlert('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        const inscricaoData = {
            id_atleta: atletaId,
            id_competicao: currentCompeticaoModal.id,
            modalidade: modalidade,
            categoria_peso: categoriaPeso,
            categoria_idade: categoriaIdade,
            valor_individual: valorIndividual,
            tem_dobra: temDobra,
            observacoes: observacoes
        };
        
        console.log('🔍 Dados da inscrição:', inscricaoData);
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/inscricoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(inscricaoData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Atleta inscrito com sucesso!', 'success');
            closeNovaInscricaoModal();
            
            // Recarregar inscrições se o modal estiver aberto
            if (document.getElementById('inscricoesModal').classList.contains('active')) {
                await carregarInscricoesModal(currentCompeticaoModal.id);
            }
            
            // Atualizar estatísticas
            await loadCompeticoes();
        } else {
            throw new Error(data.error || 'Erro ao inscrever atleta');
        }
        
    } catch (error) {
        console.error('Erro ao inscrever atleta:', error);
        showAlert('Erro ao inscrever atleta: ' + error.message, 'error');
    }
}

// Handle submit do formulário de inscrição
async function handleInscricaoSubmit(event) {
    event.preventDefault();
    
    try {
        const modalidade = document.getElementById('modalidadeModal').value;
        const observacoes = document.getElementById('observacoesModal').value;
        
        // Obter atletas selecionados
        const atletasSelecionados = [];
        atletasDisponiveisModal.forEach(atleta => {
            const checkbox = document.getElementById(`atleta_modal_${atleta.id}`);
            if (checkbox && checkbox.checked) {
                atletasSelecionados.push(atleta.id);
            }
        });
        
        if (atletasSelecionados.length === 0) {
            showAlertModal('Selecione pelo menos um atleta', 'error');
            return;
        }
        
        // Validar modalidade se a competição for "Clássica e Equipado"
        if (currentCompeticaoModal.modalidade === 'CLASSICA_EQUIPADO' && !modalidade) {
            showAlertModal('Selecione a modalidade (Clássica ou Equipado) para a inscrição', 'error');
            return;
        }
        
        // Validar se os atletas selecionados não estão já inscritos na modalidade escolhida
        if (currentCompeticaoModal.modalidade === 'CLASSICA_EQUIPADO' && modalidade) {
            const inscricoesExistentes = inscricoesModal.filter(insc => insc.status_inscricao === 'INSCRITO');
            
            const atletasComConflito = atletasSelecionados.filter(atletaId => {
                const inscricoesDoAtleta = inscricoesExistentes.filter(insc => insc.id_atleta === atletaId);
                const modalidadesInscritas = inscricoesDoAtleta.map(insc => insc.modalidade).filter(Boolean);
                return modalidadesInscritas.includes(modalidade);
            });

            if (atletasComConflito.length > 0) {
                const nomesAtletas = atletasComConflito.map(id => 
                    atletasDisponiveisModal.find(a => a.id === id)?.nome
                ).filter(Boolean);
                
                showAlertModal(`Os seguintes atletas já estão inscritos na modalidade ${modalidade === 'CLASSICA' ? 'Clássica' : 'Equipado'}: ${nomesAtletas.join(', ')}`, 'error');
                return;
            }
        }
        
        // Abrir modal de categorização em vez de finalizar diretamente
        closeInscricaoModal();
        await abrirModalCategorizacao(atletasSelecionados, modalidade, observacoes);
        
    } catch (error) {
        console.error('❌ Erro ao salvar inscrição:', error);
        showAlertModal('Erro ao salvar inscrição', 'error');
    }
}

// Criar inscrição no modal
async function criarInscricaoModal(inscricaoData) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/inscricoes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inscricaoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar inscrição');
        }

        const data = await response.json();
        return data.data;
        
    } catch (error) {
        console.error('❌ Erro ao criar inscrição:', error);
        throw error;
    }
}

// Editar inscrição no modal
async function editarInscricaoModal(id) {
    console.log('Editar inscrição modal:', id);
    showAlertModal('Funcionalidade de edição em desenvolvimento', 'info');
}

// Excluir inscrição no modal
async function excluirInscricaoModal(id) {
    if (!confirm('Tem certeza que deseja excluir esta inscrição?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/inscricoes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir inscrição');
        }

        // Recarregar dados
        await carregarInscricoesModal(currentCompeticaoModal.id);
        
        showAlertModal('Inscrição excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir inscrição:', error);
        showAlertModal('Erro ao excluir inscrição', 'error');
    }
}

// Exportar Excel do modal
function exportarExcelModal() {
    if (inscricoesModal.length === 0) {
        showAlertModal('Nenhuma inscrição para exportar', 'error');
        return;
    }
    
    try {
        // Preparar dados para exportação
        const dados = inscricoesModal.map(inscricao => ({
            'Nome do Atleta': inscricao.atleta?.nome || 'N/A',
            'CPF': inscricao.atleta?.cpf || 'N/A',
            'Equipe': inscricao.atleta?.equipe?.nome_equipe || 'N/A',
            'Modalidade': getModalidadeLabel(inscricao.modalidade),
            'Categoria Peso': inscricao.categoria_peso || 'N/A',
            'Categoria Idade': inscricao.categoria_idade || 'N/A',
            'Valor': inscricao.valor_individual || 0,
            'Status': getStatusInscricaoLabel(inscricao.status_inscricao),
            'Observações': inscricao.observacoes || ''
        }));
        
        // Criar planilha
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inscrições');
        
        // Gerar arquivo
        const nomeArquivo = `inscricoes_${currentCompeticaoModal.nome_competicao}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
        
        showAlertModal('Planilha exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao exportar Excel:', error);
        showAlertModal('Erro ao exportar planilha', 'error');
    }
}

// Mostrar loading no modal
function mostrarLoadingModal(show) {
    const loadingContainer = document.getElementById('loadingContainerModal');
    const tableContainer = document.getElementById('tableContainerModal');
    const emptyState = document.getElementById('emptyStateModal');
    
    if (show) {
        loadingContainer.style.display = 'flex';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingContainer.style.display = 'none';
    }
}

// Mostrar alerta no modal
function showAlertModal(mensagem, tipo = 'info') {
    const alertContainer = document.getElementById('alertContainerModal');
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'info': 'alert-info'
    }[tipo] || 'alert-info';
    
    const icon = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'info': 'fas fa-info-circle'
    }[tipo] || 'fas fa-info-circle';
    
    const alertHTML = `
        <div class="alert ${alertClass}">
            <i class="${icon} mr-2"></i>
            ${mensagem}
        </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Funções auxiliares para modal de inscrições
function getStatusInscricaoClass(status) {
    const statusClasses = {
        'INSCRITO': 'success',
        'CONFIRMADO': 'success',
        'PENDENTE': 'warning',
        'CANCELADO': 'danger'
    };
    return statusClasses[status] || 'info';
}

function getStatusInscricaoLabel(status) {
    const statusLabels = {
        'INSCRITO': 'Inscrito',
        'CONFIRMADO': 'Confirmado',
        'PENDENTE': 'Pendente',
        'CANCELADO': 'Cancelado'
    };
    return statusLabels[status] || status;
}

function getModalidadeLabel(modalidade) {
    const modalidadeLabels = {
        'CLASSICA': 'Clássica',
        'EQUIPADO': 'Equipado',
        'CLASSICA_EQUIPADO': 'Clássica e Equipado'
    };
    return modalidadeLabels[modalidade] || modalidade;
}

// =====================================================
// FUNÇÕES DE CATEGORIZAÇÃO
// =====================================================

// Abrir modal de categorização
async function abrirModalCategorizacao(atletasSelecionados, modalidade, observacoes) {
    try {
        atletasSelecionadosCategorizacao = atletasSelecionados;
        modalidadeCategorizacao = modalidade;
        observacoesCategorizacao = observacoes;
        categorizacaoAtletas = new Map();
        
        // Atualizar nome da competição
        document.getElementById('competicaoNomeCategorizacao').textContent = currentCompeticaoModal.nome_competicao;
        
        // Carregar categorias
        await carregarCategorias();
        
        // Renderizar formulários de categorização
        renderizarCategorizacao();
        
        // Mostrar modal
        document.getElementById('categorizacaoModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de categorização:', error);
        showAlertModal('Erro ao abrir categorização', 'error');
    }
}

// Fechar modal de categorização
function closeCategorizacaoModal() {
    document.getElementById('categorizacaoModal').classList.remove('active');
    atletasSelecionadosCategorizacao = [];
    modalidadeCategorizacao = '';
    observacoesCategorizacao = '';
    categorizacaoAtletas = new Map();
}

// Carregar categorias
async function carregarCategorias() {
    try {
        const token = localStorage.getItem('authToken');
        
        // Carregar categorias de idade
        const responseIdade = await fetch('/api/categorias/idade', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!responseIdade.ok) {
            throw new Error('Erro ao carregar categorias de idade');
        }
        
        const dataIdade = await responseIdade.json();
        categoriasIdade = dataIdade.data.categorias;
        
        console.log('✅ Categorias carregadas:', categoriasIdade.length);
        
    } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        throw error;
    }
}

// Renderizar formulários de categorização
function renderizarCategorizacao() {
    const container = document.getElementById('categorizacaoContainer');
    
    container.innerHTML = atletasSelecionadosCategorizacao.map(atletaId => {
        const atleta = atletasDisponiveisModal.find(a => a.id === atletaId);
        if (!atleta) return '';
        
        const idade = calcularIdade(atleta.data_nascimento);
        
        return `
            <div class="card mb-4" id="categorizacao-${atletaId}">
                <div class="card-header">
                    <h4 class="font-bold text-lg">${atleta.nome}</h4>
                    <p class="text-sm text-gray-600">CPF: ${atleta.cpf} • Idade: ${idade} anos</p>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="categoriaPeso-${atletaId}">Categoria de Peso *</label>
                            <select id="categoriaPeso-${atletaId}" onchange="atualizarCategorizacao('${atletaId}')" required>
                                <option value="">Selecione...</option>
                                ${renderizarCategoriasPeso(atleta.sexo, idade)}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="categoriaIdade-${atletaId}">Categoria de Idade *</label>
                            <select id="categoriaIdade-${atletaId}" onchange="atualizarCategorizacao('${atletaId}')" required>
                                <option value="">Selecione...</option>
                                ${renderizarCategoriasIdade(idade)}
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="flex items-center">
                            <input type="checkbox" id="dobraCategoria-${atletaId}" onchange="toggleDobraCategoria('${atletaId}')">
                            <span class="ml-2">Dobra de categoria</span>
                        </label>
                        
                        <div id="dobraContainer-${atletaId}" class="mt-2" style="display: none;">
                            <label for="dobraCategoriaIdade-${atletaId}">Segunda categoria de idade:</label>
                            <select id="dobraCategoriaIdade-${atletaId}" onchange="atualizarCategorizacao('${atletaId}')">
                                <option value="">Selecione...</option>
                                ${renderizarCategoriasIdade(idade)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar categorias de peso
function renderizarCategoriasPeso(sexo, idade) {
    // Carregar categorias de peso baseado no sexo
    const categorias = sexo === 'M' ? 
        [
            { id: 'subjunior-junior-m', nome: 'Até 53,0 kg', pesoMaximo: 53.0, descricao: 'Até 53,0 kg (restrito a subjúnior 14-18 anos)' },
            { id: '59-m', nome: '59,0 kg', pesoMaximo: 59.0, descricao: 'Até 59,0 kg' },
            { id: '66-m', nome: '66,0 kg', pesoMaximo: 66.0, descricao: '53,01 – 66,0 kg' },
            { id: '74-m', nome: '74,0 kg', pesoMaximo: 74.0, descricao: '66,01 – 74,0 kg' },
            { id: '83-m', nome: '83,0 kg', pesoMaximo: 83.0, descricao: '74,01 – 83,0 kg' },
            { id: '93-m', nome: '93,0 kg', pesoMaximo: 93.0, descricao: '83,01 – 93,0 kg' },
            { id: '105-m', nome: '105,0 kg', pesoMaximo: 105.0, descricao: '93,01 – 105,0 kg' },
            { id: '120-m', nome: '120,0 kg', pesoMaximo: 120.0, descricao: '105,01 – 120,0 kg' },
            { id: '120plus-m', nome: '+120,0 kg', pesoMaximo: 999.0, descricao: 'Acima de 120,01 kg' }
        ] :
        [
            { id: 'subjunior-junior-f', nome: 'Até 43,0 kg', pesoMaximo: 43.0, descricao: 'Até 43,0 kg (restrito a subjúnior 14-18 anos)' },
            { id: '47-f', nome: '47,0 kg', pesoMaximo: 47.0, descricao: 'Até 47,0 kg' },
            { id: '52-f', nome: '52,0 kg', pesoMaximo: 52.0, descricao: '47,01 – 52,0 kg' },
            { id: '57-f', nome: '57,0 kg', pesoMaximo: 57.0, descricao: '52,01 – 57,0 kg' },
            { id: '63-f', nome: '63,0 kg', pesoMaximo: 63.0, descricao: '57,01 – 63,0 kg' },
            { id: '69-f', nome: '69,0 kg', pesoMaximo: 69.0, descricao: '63,01 – 69,0 kg' },
            { id: '76-f', nome: '76,0 kg', pesoMaximo: 76.0, descricao: '69,01 – 76,0 kg' },
            { id: '84-f', nome: '84,0 kg', pesoMaximo: 84.0, descricao: '76,01 – 84,0 kg' },
            { id: '84plus-f', nome: '+84,0 kg', pesoMaximo: 999.0, descricao: 'Acima de 84,01 kg' }
        ];
    
    return categorias.map(cat => {
        const podeUsar = validarPesoParaCategoria(idade, cat);
        return `
            <option value="${cat.id}" ${!podeUsar ? 'disabled' : ''}>
                ${cat.nome} - ${cat.descricao}
                ${!podeUsar ? ' (Restrito a Sub-júnior: 14-18 anos)' : ''}
            </option>
        `;
    }).join('');
}

// Renderizar categorias de idade
function renderizarCategoriasIdade(idade) {
    return categoriasIdade.map(cat => {
        const podeUsar = validarIdadeParaCategoria(idade, cat);
        return `
            <option value="${cat.id}" ${!podeUsar ? 'disabled' : ''}>
                ${cat.nome} - ${cat.descricao}
            </option>
        `;
    }).join('');
}

// Atualizar categorização
function atualizarCategorizacao(atletaId) {
    const categoriaPesoId = document.getElementById(`categoriaPeso-${atletaId}`).value;
    const categoriaIdadeId = document.getElementById(`categoriaIdade-${atletaId}`).value;
    const dobraCategoriaIdadeId = document.getElementById(`dobraCategoriaIdade-${atletaId}`).value;
    
    const categoriaPeso = categoriaPesoId ? { id: categoriaPesoId } : null;
    const categoriaIdade = categoriaIdadeId ? categoriasIdade.find(c => c.id === categoriaIdadeId) : null;
    const dobraCategoria = dobraCategoriaIdadeId ? { categoriaIdade: categoriasIdade.find(c => c.id === dobraCategoriaIdadeId) } : null;
    
    categorizacaoAtletas.set(atletaId, {
        categoriaPeso,
        categoriaIdade,
        dobraCategoria
    });
    
    // Verificar se pode finalizar
    verificarPodeFinalizar();
}

// Toggle dobra de categoria
function toggleDobraCategoria(atletaId) {
    const checkbox = document.getElementById(`dobraCategoria-${atletaId}`);
    const container = document.getElementById(`dobraContainer-${atletaId}`);
    
    if (checkbox.checked) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        document.getElementById(`dobraCategoriaIdade-${atletaId}`).value = '';
        atualizarCategorizacao(atletaId);
    }
}

// Verificar se pode finalizar
function verificarPodeFinalizar() {
    const todosComCategoria = atletasSelecionadosCategorizacao.every(atletaId => {
        const categorizacao = categorizacaoAtletas.get(atletaId);
        return categorizacao && categorizacao.categoriaPeso && categorizacao.categoriaIdade;
    });
    
    document.getElementById('btnFinalizarInscricao').disabled = !todosComCategoria;
}

// Finalizar inscrição
async function finalizarInscricao() {
    try {
        // Verificar se todos os atletas têm categorias definidas
        const atletasSemCategoria = atletasSelecionadosCategorizacao.filter(atletaId => {
            const categorizacao = categorizacaoAtletas.get(atletaId);
            return !categorizacao || !categorizacao.categoriaPeso || !categorizacao.categoriaIdade;
        });

        if (atletasSemCategoria.length > 0) {
            showAlertModal('Todos os atletas devem ter categoria de peso e idade definidas', 'error');
            return;
        }

        // Criar inscrições para cada atleta
        for (const atletaId of atletasSelecionadosCategorizacao) {
            const categorizacao = categorizacaoAtletas.get(atletaId);
            
            const inscricaoData = {
                id_atleta: atletaId,
                id_competicao: currentCompeticaoModal.id,
                modalidade: modalidadeCategorizacao,
                observacoes: observacoesCategorizacao,
                status_inscricao: 'INSCRITO',
                valor_individual: currentCompeticaoModal.valor_inscricao || 0,
                categoria_peso: categorizacao.categoriaPeso.id,
                categoria_idade: categorizacao.categoriaIdade.id,
                dobra_categoria: categorizacao.dobraCategoria ? categorizacao.dobraCategoria.categoriaIdade.id : null
            };
            
            await criarInscricaoModal(inscricaoData);
        }
        
        // Fechar modal e recarregar dados
        closeCategorizacaoModal();
        await carregarInscricoesModal(currentCompeticaoModal.id);
        
        showAlertModal(`${atletasSelecionadosCategorizacao.length} atleta(s) inscrito(s) com sucesso!`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao finalizar inscrição:', error);
        showAlertModal('Erro ao finalizar inscrição', 'error');
    }
}

// Funções auxiliares
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

function validarPesoParaCategoria(idade, categoriaPeso) {
    const categoriasRestritas = ['subjunior-junior-m', 'subjunior-junior-f'];
    
    if (categoriasRestritas.includes(categoriaPeso.id)) {
        return idade >= 14 && idade <= 18;
    }
    
    return true;
}

function validarIdadeParaCategoria(idade, categoriaIdade) {
    switch (categoriaIdade.id) {
        case 'subjunior':
            return idade >= 14 && idade <= 18;
        case 'junior':
            return idade >= 19 && idade <= 23;
        case 'open':
            // Master 3 (60-69) e Master 4 (70+) NÃO podem usar categoria Open
            if (idade >= 60) {
                return false;
            }
            return idade >= 19;
        case 'master1':
            return idade >= 40 && idade <= 49;
        case 'master2':
            return idade >= 50 && idade <= 59;
        case 'master3':
            return idade >= 60 && idade <= 69;
        case 'master4':
            return idade >= 70;
        case 'convidado':
            return true; // Convidados não têm restrições de idade/peso
        default:
            return false;
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('competicaoModal');
    const resumoModal = document.getElementById('resumoCompeticaoModal');
    const inscricoesModal = document.getElementById('inscricoesModal');
    const inscricaoModal = document.getElementById('inscricaoModal');
    const categorizacaoModal = document.getElementById('categorizacaoModal');
    
    if (event.target === modal) {
        closeModal();
    } else if (event.target === resumoModal) {
        closeResumoCompeticaoModal();
    } else if (event.target === inscricoesModal) {
        closeInscricoesModal();
    } else if (event.target === inscricaoModal) {
        closeInscricaoModal();
    } else if (event.target === categorizacaoModal) {
        closeCategorizacaoModal();
    } else if (event.target === document.getElementById('novaInscricaoModal')) {
        closeNovaInscricaoModal();
    }
}

// =====================================================
// FLUXO COMPLETO DE INSCRIÇÃO DE ATLETAS
// =====================================================

// Abrir modal de seleção de atleta
async function abrirModalSelecaoAtleta() {
    try {
        console.log('🔍 Abrindo modal de seleção de atleta...');
        
        if (!currentCompeticaoModal) {
            showAlert('Nenhuma competição selecionada', 'error');
            return;
        }
        
        // Atualizar informações da competição no modal
        document.getElementById('competicaoSelecaoNome').textContent = currentCompeticaoModal.nome_competicao;
        document.getElementById('competicaoSelecaoData').textContent = `Data: ${formatarData(currentCompeticaoModal.data_competicao)}`;
        
        // Carregar atletas disponíveis
        await carregarAtletasDisponiveis();
        
        // Carregar equipes para filtro
        await carregarEquipesFiltro();
        
        // Mostrar modal
        document.getElementById('selecaoAtletaModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de seleção de atleta:', error);
        showAlert('Erro ao abrir seleção de atleta', 'error');
    }
}

// Carregar atletas disponíveis
async function carregarAtletasDisponiveis() {
    try {
        console.log('🔍 Carregando atletas disponíveis...');
        
        // Determinar filtro baseado no tipo de usuário
        let url = '/api/atletas';
        if (currentUser.tipo !== 'admin') {
            url += `?equipe=${currentUser.id_equipe}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        const data = await response.json();
        console.log('📊 Resposta da API de atletas:', data);
        
        if (data.success) {
            atletasDisponiveis = data.data.atletas;
            console.log('✅ Atletas carregados:', atletasDisponiveis.length);
            console.log('📋 Primeiro atleta:', atletasDisponiveis[0]);
            renderizarListaAtletas();
        } else {
            throw new Error(data.error || 'Erro ao carregar atletas');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar atletas:', error);
        showAlert('Erro ao carregar atletas disponíveis', 'error');
    }
}

// Carregar equipes para filtro
async function carregarEquipesFiltro() {
    try {
        const response = await fetch('/api/equipes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        const data = await response.json();
        console.log('📊 Resposta da API de equipes:', data);
        
        if (data.success) {
            const selectEquipe = document.getElementById('filtroEquipe');
            selectEquipe.innerHTML = '<option value="">Todas as equipes</option>';
            
            data.data.equipes.forEach(equipe => {
                const option = document.createElement('option');
                option.value = equipe.id;
                option.textContent = equipe.nome_equipe;
                selectEquipe.appendChild(option);
            });
            console.log('✅ Equipes carregadas:', data.data.equipes.length);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar equipes:', error);
    }
}

// Renderizar lista de atletas
function renderizarListaAtletas() {
    console.log('🎨 Renderizando lista de atletas...');
    console.log('📊 Atletas disponíveis:', atletasDisponiveis);
    
    const listaAtletas = document.getElementById('listaAtletas');
    const buscarAtleta = document.getElementById('buscarAtleta').value.toLowerCase();
    const filtroEquipe = document.getElementById('filtroEquipe').value;
    
    console.log('🔍 Filtros aplicados:', { buscarAtleta, filtroEquipe });
    
    let atletasFiltrados = atletasDisponiveis.filter(atleta => {
        const nomeMatch = atleta.nome.toLowerCase().includes(buscarAtleta);
        const equipeMatch = !filtroEquipe || atleta.id_equipe === filtroEquipe;
        return nomeMatch && equipeMatch;
    });
    
    console.log('📋 Atletas filtrados:', atletasFiltrados.length);
    
    if (atletasFiltrados.length === 0) {
        listaAtletas.innerHTML = '<div class="p-4 text-center text-gray-500">Nenhum atleta encontrado</div>';
        return;
    }
    
    listaAtletas.innerHTML = atletasFiltrados.map(atleta => {
        const idade = calcularIdade(atleta.data_nascimento);
        return `
            <div class="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer atleta-item" data-atleta-id="${atleta.id}">
                <div class="flex items-center justify-between">
                    <div>
                        <h5 class="font-semibold text-gray-800">${atleta.nome}</h5>
                        <p class="text-sm text-gray-600">${atleta.equipe?.nome_equipe || 'Sem equipe'} • ${idade} anos</p>
                        <p class="text-xs text-gray-500">CPF: ${atleta.cpf}</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-block w-3 h-3 rounded-full bg-gray-300 atleta-indicator"></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar eventos de clique
    document.querySelectorAll('.atleta-item').forEach(item => {
        item.addEventListener('click', function() {
            selecionarAtleta(this.dataset.atletaId);
        });
    });
}

// Selecionar atleta
function selecionarAtleta(atletaId) {
    // Remover seleção anterior
    document.querySelectorAll('.atleta-item').forEach(item => {
        item.classList.remove('bg-blue-50', 'border-blue-300');
        item.querySelector('.atleta-indicator').classList.remove('bg-blue-500');
        item.querySelector('.atleta-indicator').classList.add('bg-gray-300');
    });
    
    // Selecionar atleta atual
    const atletaItem = document.querySelector(`[data-atleta-id="${atletaId}"]`);
    atletaItem.classList.add('bg-blue-50', 'border-blue-300');
    atletaItem.querySelector('.atleta-indicator').classList.remove('bg-gray-300');
    atletaItem.querySelector('.atleta-indicator').classList.add('bg-blue-500');
    
    // Armazenar atleta selecionado
    atletaSelecionado = atletasDisponiveis.find(a => a.id === atletaId);
    
    // Habilitar botão prosseguir
    document.getElementById('btnProsseguir').disabled = false;
}

// Prosseguir com atleta selecionado
async function prosseguirComAtleta() {
    try {
        console.log('🚀 Iniciando prosseguirComAtleta...');
        
        if (!atletaSelecionado) {
            console.error('❌ Nenhum atleta selecionado!');
            showAlert('Selecione um atleta para prosseguir', 'error');
            return;
        }
        
        console.log('🔍 Prosseguindo com atleta:', atletaSelecionado.nome);
        console.log('📊 Dados do atleta:', atletaSelecionado);
        
        // Fechar modal de seleção
        console.log('🚪 Fechando modal de seleção...');
        closeSelecaoAtletaModal();
        
        // Abrir modal de categorização
        console.log('🎯 Abrindo modal de categorização...');
        await abrirModalCategorizacao();
        
        console.log('✅ ProsseguirComAtleta concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao prosseguir com atleta:', error);
        console.error('❌ Stack trace:', error.stack);
        showAlert('Erro ao prosseguir com atleta: ' + error.message, 'error');
    }
}

// Abrir modal de categorização
async function abrirModalCategorizacao() {
    try {
        console.log('🔍 Abrindo modal de categorização...');
        console.log('👤 Atleta selecionado:', atletaSelecionado);
        console.log('🏆 Competição atual:', currentCompeticaoModal);
        
        // Verificar se atleta e competição existem
        if (!atletaSelecionado) {
            throw new Error('Nenhum atleta selecionado');
        }
        if (!currentCompeticaoModal) {
            throw new Error('Nenhuma competição selecionada');
        }
        
        // Atualizar informações do atleta
        console.log('📝 Atualizando informações do atleta...');
        const nomeElement = document.getElementById('atletaCategorizacaoNome');
        const equipeElement = document.getElementById('atletaCategorizacaoEquipe');
        const idadeElement = document.getElementById('atletaCategorizacaoIdade');
        
        if (nomeElement) {
            nomeElement.textContent = atletaSelecionado.nome;
            console.log('✅ Nome do atleta atualizado');
        } else {
            console.error('❌ Elemento atletaCategorizacaoNome não encontrado!');
        }
        
        if (equipeElement) {
            equipeElement.textContent = `Equipe: ${atletaSelecionado.equipe?.nome_equipe || 'Sem equipe'}`;
            console.log('✅ Equipe do atleta atualizada');
        } else {
            console.error('❌ Elemento atletaCategorizacaoEquipe não encontrado!');
        }
        
        if (idadeElement) {
            const idade = calcularIdade(atletaSelecionado.data_nascimento);
            idadeElement.textContent = `Idade: ${idade} anos`;
            console.log('✅ Idade do atleta atualizada:', idade);
        } else {
            console.error('❌ Elemento atletaCategorizacaoIdade não encontrado!');
        }
        
        // Atualizar informações da competição
        console.log('📝 Atualizando informações da competição...');
        const competicaoNomeElement = document.getElementById('competicaoCategorizacaoNome');
        const competicaoModalidadeElement = document.getElementById('competicaoCategorizacaoModalidade');
        
        if (competicaoNomeElement) {
            competicaoNomeElement.textContent = currentCompeticaoModal.nome_competicao;
            console.log('✅ Nome da competição atualizado');
        } else {
            console.error('❌ Elemento competicaoCategorizacaoNome não encontrado!');
        }
        
        if (competicaoModalidadeElement) {
            competicaoModalidadeElement.textContent = `Modalidade: ${getModalidadeLabel(currentCompeticaoModal.modalidade)}`;
            console.log('✅ Modalidade da competição atualizada');
        } else {
            console.error('❌ Elemento competicaoCategorizacaoModalidade não encontrado!');
        }
        
        // Carregar categorias
        console.log('📚 Carregando categorias...');
        await carregarCategoriasParaModal();
        
        // Configurar modalidade se necessário
        console.log('⚙️ Configurando modalidade...');
        const secaoModalidade = document.getElementById('secaoModalidade');
        if (secaoModalidade) {
            if (currentCompeticaoModal.modalidade === 'CLASSICA_EQUIPADO') {
                secaoModalidade.style.display = 'block';
                console.log('✅ Seção modalidade exibida');
            } else {
                secaoModalidade.style.display = 'none';
                console.log('✅ Seção modalidade ocultada');
            }
        } else {
            console.error('❌ Elemento secaoModalidade não encontrado!');
        }
        
        // Mostrar modal
        console.log('👁️ Mostrando modal de categorização...');
        const modal = document.getElementById('categorizacaoModal');
        if (modal) {
            modal.classList.add('active');
            console.log('✅ Modal de categorização aberto com sucesso!');
        } else {
            throw new Error('Modal de categorização não encontrado!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de categorização:', error);
        console.error('❌ Stack trace:', error.stack);
        showAlert('Erro ao abrir categorização: ' + error.message, 'error');
    }
}

// Carregar categorias para o modal
async function carregarCategoriasParaModal() {
    try {
        console.log('🔍 Carregando categorias para modal...');
        console.log('👤 Atleta selecionado:', atletaSelecionado);
        console.log('⚧ Sexo do atleta:', atletaSelecionado.sexo);
        
        // Carregar categorias de peso
        const urlPeso = `/api/categorias/peso?sexo=${atletaSelecionado.sexo}`;
        console.log('🌐 URL categorias peso:', urlPeso);
        
        const responsePeso = await fetch(urlPeso, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        const dataPeso = await responsePeso.json();
        console.log('📊 Resposta categorias peso:', dataPeso);
        
        if (dataPeso.success) {
            categoriasPeso = dataPeso.data.categorias;
            console.log('✅ Categorias peso carregadas:', categoriasPeso.length);
            preencherCategoriasPeso();
        } else {
            throw new Error(dataPeso.error || 'Erro ao carregar categorias de peso');
        }
        
        // Carregar categorias de idade
        console.log('🌐 Carregando categorias de idade...');
        const responseIdade = await fetch('/api/categorias/idade', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        const dataIdade = await responseIdade.json();
        console.log('📊 Resposta categorias idade:', dataIdade);
        
        if (dataIdade.success) {
            categoriasIdade = dataIdade.data.categorias;
            console.log('✅ Categorias idade carregadas:', categoriasIdade.length);
            preencherCategoriasIdade();
        } else {
            throw new Error(dataIdade.error || 'Erro ao carregar categorias de idade');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        showAlert('Erro ao carregar categorias: ' + error.message, 'error');
    }
}

// Preencher categorias de peso
function preencherCategoriasPeso() {
    console.log('🎨 Preenchendo categorias de peso...');
    console.log('📊 Categorias peso disponíveis:', categoriasPeso);
    
    const select = document.getElementById('categoriaPeso');
    if (!select) {
        console.error('❌ Elemento categoriaPeso não encontrado!');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione a categoria de peso</option>';
    
    categoriasPeso.forEach(categoria => {
        const option = document.createElement('option');
        option.value = JSON.stringify(categoria);
        option.textContent = `${categoria.nome} - ${categoria.descricao}`;
        select.appendChild(option);
    });
    
    console.log('✅ Categorias de peso preenchidas:', categoriasPeso.length);
}

// Preencher categorias de idade
function preencherCategoriasIdade() {
    console.log('🎨 Preenchendo categorias de idade...');
    console.log('📊 Categorias idade disponíveis:', categoriasIdade);
    
    const select = document.getElementById('categoriaIdade');
    if (!select) {
        console.error('❌ Elemento categoriaIdade não encontrado!');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione a categoria de idade</option>';
    
    const idade = calcularIdade(atletaSelecionado.data_nascimento);
    console.log('👤 Idade do atleta:', idade);
    
    categoriasIdade.forEach(categoria => {
        const option = document.createElement('option');
        option.value = JSON.stringify(categoria);
        option.textContent = `${categoria.nome} - ${categoria.descricao}`;
        
        // Desabilitar se não for compatível com a idade
        if (!validarIdadeParaCategoria(idade, categoria)) {
            option.disabled = true;
            option.textContent += ' (Idade não compatível)';
        }
        
        select.appendChild(option);
    });
    
    console.log('✅ Categorias de idade preenchidas:', categoriasIdade.length);
}

// Fechar modal de seleção de atleta
function closeSelecaoAtletaModal() {
    console.log('🚪 Fechando modal de seleção de atleta...');
    
    const modal = document.getElementById('selecaoAtletaModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('✅ Modal de seleção fechado');
    } else {
        console.error('❌ Modal de seleção não encontrado!');
    }
    
    // NÃO limpar atletaSelecionado aqui, pois ainda precisamos dele para categorização
    // atletaSelecionado = null;
    
    const btnProsseguir = document.getElementById('btnProsseguir');
    if (btnProsseguir) {
        btnProsseguir.disabled = true;
        console.log('✅ Botão prosseguir desabilitado');
    } else {
        console.error('❌ Botão prosseguir não encontrado!');
    }
}

// Fechar modal de categorização
function closeCategorizacaoModal() {
    document.getElementById('categorizacaoModal').classList.remove('active');
    atletaSelecionado = null;
}

// =====================================================
// MODAL DE INSCRIÇÕES
// =====================================================

// Abrir modal de inscrições
async function abrirInscricoesListaModal() {
    try {
        console.log('🔍 Abrindo modal de inscrições...');
        
        if (!currentCompeticaoModal) {
            showAlert('Nenhuma competição selecionada', 'error');
            return;
        }
        
        // Carregar inscrições da competição
        await carregarInscricoesModal(currentCompeticaoModal.id);
        
        // Mostrar modal
        document.getElementById('inscricoesModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de inscrições:', error);
        showAlert('Erro ao abrir inscrições', 'error');
    }
}

// Carregar inscrições do modal
async function carregarInscricoesModal(idCompeticao) {
    try {
        console.log('🔍 Carregando inscrições para competição:', idCompeticao);
        
        const response = await fetch(`/api/inscricoes/${idCompeticao}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        console.log('📊 Resposta inscrições:', data);
        
        if (data.success) {
            inscricoesModal = data.data.inscricoes;
            console.log('✅ Inscrições carregadas:', inscricoesModal.length);
            renderizarInscricoesModal();
        } else {
            throw new Error(data.error || 'Erro ao carregar inscrições');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar inscrições:', error);
        showAlert('Erro ao carregar inscrições', 'error');
    }
}

// Renderizar inscrições no modal
function renderizarInscricoesModal() {
    const tbody = document.querySelector('#inscricoesModal tbody');
    if (!tbody) {
        console.error('❌ Tbody não encontrado no modal de inscrições');
        return;
    }
    
    if (inscricoesModal.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-gray-500 py-8">
                    <i class="fas fa-info-circle mr-2"></i>
                    Nenhuma inscrição encontrada
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inscricoesModal.map(inscricao => {
        const dataInscricao = new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR');
        const valorTotal = (inscricao.valor_individual || 0) + (inscricao.valor_dobra || 0);
        
        // Verificar se pode editar/excluir (antes da data de nominação final)
        const podeEditarExcluir = podeEditarExcluirInscricao(currentCompeticaoModal);
        
        return `
            <tr>
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-user text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-800">${inscricao.atleta?.nome || 'N/A'}</div>
                            <div class="text-sm text-gray-500">${inscricao.atleta?.cpf || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${getModalidadeLabel(inscricao.modalidade)}
                    </span>
                </td>
                <td class="px-4 py-3">${inscricao.categoria_peso || 'N/A'}</td>
                <td class="px-4 py-3">${inscricao.categoria_idade || 'N/A'}</td>
                <td class="px-4 py-3 font-semibold">R$ ${valorTotal.toFixed(2)}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${getStatusInscricaoLabel(inscricao.status_inscricao)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="editarInscricao('${inscricao.id}')" 
                                class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${!podeEditarExcluir ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${!podeEditarExcluir ? 'disabled title="Não é possível editar após a nominação final"' : ''}>
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button onclick="excluirInscricao('${inscricao.id}', '${inscricao.atleta?.nome || 'Atleta'}')" 
                                class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${!podeEditarExcluir ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${!podeEditarExcluir ? 'disabled title="Não é possível excluir após a nominação final"' : ''}>
                            <i class="fas fa-trash mr-1"></i>Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =====================================================
// MODAL DE NOMINAÇÃO
// =====================================================

// Abrir modal de nominação
async function abrirNominacaoModal() {
    try {
        console.log('🔍 Abrindo modal de nominação...');
        
        if (!currentCompeticaoModal) {
            showAlert('Nenhuma competição selecionada', 'error');
            return;
        }
        
        // Carregar nominação da competição
        await carregarNominacaoModal(currentCompeticaoModal.id);
        
        // Mostrar modal
        document.getElementById('nominacaoModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de nominação:', error);
        showAlert('Erro ao abrir nominação', 'error');
    }
}

// Carregar nominação do modal
async function carregarNominacaoModal(idCompeticao) {
    try {
        console.log('🔍 Carregando nominação para competição:', idCompeticao);
        
        // Por enquanto, vamos usar as mesmas inscrições
        // Em uma implementação completa, você teria uma tabela específica para nominação
        await carregarInscricoesModal(idCompeticao);
        
        // Filtrar apenas inscrições aprovadas (status = 'APROVADO' ou similar)
        const inscricoesAprovadas = inscricoesModal.filter(inscricao => 
            inscricao.status_inscricao === 'INSCRITO' // Por enquanto, todas as inscrições são consideradas aprovadas
        );
        
        console.log('✅ Inscrições aprovadas para nominação:', inscricoesAprovadas.length);
        renderizarNominacaoModal(inscricoesAprovadas);
        
    } catch (error) {
        console.error('❌ Erro ao carregar nominação:', error);
        showAlert('Erro ao carregar nominação', 'error');
    }
}

// Renderizar nominação no modal
function renderizarNominacaoModal(inscricoes) {
    const tbody = document.querySelector('#nominacaoModal tbody');
    if (!tbody) {
        console.error('❌ Tbody não encontrado no modal de nominação');
        return;
    }
    
    if (inscricoes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-gray-500 py-8">
                    <i class="fas fa-info-circle mr-2"></i>
                    Nenhum atleta nominado
                </td>
            </tr>
        `;
        return;
    }
    
    // Agrupar por sexo e categoria de peso (como no sistema React)
    const agrupadoPorSexo = {};
    inscricoes.forEach(inscricao => {
        const sexo = inscricao.atleta?.sexo || 'N/A';
        if (!agrupadoPorSexo[sexo]) {
            agrupadoPorSexo[sexo] = {};
        }
        
        const categoriaPeso = inscricao.categoria_peso || 'Sem Categoria';
        if (!agrupadoPorSexo[sexo][categoriaPeso]) {
            agrupadoPorSexo[sexo][categoriaPeso] = [];
        }
        agrupadoPorSexo[sexo][categoriaPeso].push(inscricao);
    });
    
    // Ordenar sexos (M primeiro, depois F)
    const sexosOrdenados = Object.keys(agrupadoPorSexo).sort((a, b) => {
        if (a === 'M') return -1;
        if (b === 'M') return 1;
        return a.localeCompare(b);
    });
    
    let html = '';
    
    sexosOrdenados.forEach(sexo => {
        const categoriasDoSexo = agrupadoPorSexo[sexo];
        
        // Ordenar categorias de peso para este sexo
        const categoriasOrdenadas = Object.keys(categoriasDoSexo).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });
        
        const totalAtletasSexo = Object.values(categoriasDoSexo).reduce((total, categoria) => total + categoria.length, 0);
        
        // Cabeçalho do sexo
        html += `
            <tr class="bg-blue-50 border-l-4 border-blue-500">
                <td colspan="6" class="px-4 py-3 font-bold text-blue-800">
                    <i class="fas fa-${sexo === 'M' ? 'male' : 'female'} mr-2"></i>
                    ${sexo === 'M' ? '🏋️‍♂️ Masculino' : '🏋️‍♀️ Feminino'}
                    <span class="ml-2 text-sm font-normal text-blue-600">
                        (${totalAtletasSexo} atleta${totalAtletasSexo !== 1 ? 's' : ''})
                    </span>
                </td>
            </tr>
        `;
        
        categoriasOrdenadas.forEach(categoriaPeso => {
            const inscricoesCategoria = categoriasDoSexo[categoriaPeso];
            
            // Cabeçalho da categoria de peso
            html += `
                <tr class="bg-yellow-50 border-l-4 border-yellow-500">
                    <td colspan="6" class="px-4 py-2 font-semibold text-yellow-800">
                        <i class="fas fa-weight-hanging mr-2"></i>
                        ${categoriaPeso}
                        <span class="ml-2 text-sm font-normal text-yellow-600">
                            (${inscricoesCategoria.length} atleta${inscricoesCategoria.length !== 1 ? 's' : ''})
                        </span>
                    </td>
                </tr>
            `;
            
            // Atletas da categoria
            inscricoesCategoria
                .sort((a, b) => (a.atleta?.nome || '').localeCompare(b.atleta?.nome || ''))
                .forEach(inscricao => {
                    const modalidadeBadge = inscricao.modalidade === 'CLASSICA' 
                        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Clássica</span>'
                        : inscricao.modalidade === 'EQUIPADO'
                        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Equipado</span>'
                        : '<span class="text-gray-500">N/A</span>';
                    
                    const dobraBadge = inscricao.dobra_categoria 
                        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Sim</span>'
                        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Não</span>';
                    
                    html += `
                        <tr class="border-b border-gray-200">
                            <td class="px-4 py-3">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-${sexo === 'M' ? 'blue' : 'pink'}-100 rounded-full flex items-center justify-center mr-3">
                                        <i class="fas fa-user text-${sexo === 'M' ? 'blue' : 'pink'}-600"></i>
                                    </div>
                                    <div>
                                        <div class="font-semibold text-gray-800">${inscricao.atleta?.nome || 'N/A'}</div>
                                        <div class="text-sm text-gray-500">${inscricao.atleta?.equipe?.nome_equipe || 'N/A'}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3">${modalidadeBadge}</td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    ${inscricao.categoria_idade || 'N/A'}
                                </span>
                            </td>
                            <td class="px-4 py-3">${dobraBadge}</td>
                            <td class="px-4 py-3">
                                <span class="font-semibold text-green-600">
                                    ${inscricao.total_atleta ? inscricao.total_atleta + ' kg' : 'N/A'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <button onclick="exportarAtletaNominacao('${inscricao.id}')" class="text-blue-600 hover:text-blue-800" title="Exportar">
                                    <i class="fas fa-download"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
        });
    });
    
    tbody.innerHTML = html;
}

// Exportar atleta da nominação
function exportarAtletaNominacao(idInscricao) {
    console.log('📤 Exportando atleta da nominação:', idInscricao);
    // Implementar exportação individual
    showAlert('Funcionalidade de exportação em desenvolvimento', 'info');
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Obter label da modalidade
function getModalidadeLabel(modalidade) {
    const labels = {
        'CLASSICA': 'Clássica',
        'EQUIPADO': 'Equipado'
    };
    return labels[modalidade] || modalidade;
}

// Obter label do status da inscrição
function getStatusInscricaoLabel(status) {
    const labels = {
        'INSCRITO': 'Inscrito',
        'APROVADO': 'Aprovado',
        'REJEITADO': 'Rejeitado',
        'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
}

// Fechar modal de inscrições
function closeInscricoesModal() {
    document.getElementById('inscricoesModal').classList.remove('active');
}

// Fechar modal de nominação
function closeNominacaoModal() {
    document.getElementById('nominacaoModal').classList.remove('active');
}

// Fechar modal de resumo da competição
function closeResumoCompeticaoModal() {
    document.getElementById('resumoCompeticaoModal').classList.remove('active');
}

// =====================================================
// MODAL RESUMO DA COMPETIÇÃO
// =====================================================

// Abrir modal de resumo da competição
async function abrirResumoCompeticao(idCompeticao) {
    try {
        console.log('🔍 Abrindo resumo da competição:', idCompeticao);
        
        // Buscar dados da competição
        const response = await fetch(`/api/competicoes/${idCompeticao}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Erro ao carregar competição');
        }
        
        currentCompeticaoModal = data.data;
        
        // Atualizar informações no modal
        document.getElementById('resumoCompeticaoNome').textContent = currentCompeticaoModal.nome_competicao || currentCompeticaoModal.nome;
        document.getElementById('resumoDataCompeticao').textContent = new Date(currentCompeticaoModal.data_competicao).toLocaleDateString('pt-BR');
        document.getElementById('resumoLocalCompeticao').textContent = currentCompeticaoModal.local || 'N/A';
        document.getElementById('resumoValorCompeticao').textContent = `R$ ${currentCompeticaoModal.valor_inscricao || 0}`;
        document.getElementById('resumoTotalInscricoes').textContent = currentCompeticaoModal.total_inscricoes || 0;
        
        // Mostrar modal
        document.getElementById('resumoCompeticaoModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao abrir resumo da competição:', error);
        showAlert('Erro ao carregar competição', 'error');
    }
}

// Event listener para o formulário de categorização
document.addEventListener('DOMContentLoaded', function() {
    const formCategorizacao = document.getElementById('formCategorizacao');
    if (formCategorizacao) {
        formCategorizacao.addEventListener('submit', async function(e) {
            e.preventDefault();
            await finalizarInscricao();
        });
    }
    
    // Event listeners para filtros
    const buscarAtleta = document.getElementById('buscarAtleta');
    const filtroEquipe = document.getElementById('filtroEquipe');
    
    if (buscarAtleta) {
        buscarAtleta.addEventListener('input', renderizarListaAtletas);
    }
    
    if (filtroEquipe) {
        filtroEquipe.addEventListener('change', renderizarListaAtletas);
    }
});

// Finalizar inscrição
async function finalizarInscricao() {
    try {
        console.log('🔍 Finalizando inscrição...');
        
        if (!atletaSelecionado) {
            showAlert('Nenhum atleta selecionado', 'error');
            return;
        }
        
        // Validar formulário
        const categoriaPeso = document.getElementById('categoriaPeso').value;
        const categoriaIdade = document.getElementById('categoriaIdade').value;
        const dobraCategoria = document.getElementById('dobraCategoria').value;
        const totalAtleta = document.getElementById('totalAtleta').value;
        const observacoes = document.getElementById('observacoes').value;
        
        if (!categoriaPeso || !categoriaIdade) {
            showAlert('Selecione a categoria de peso e idade', 'error');
            return;
        }
        
        // Validar modalidade se necessário
        let modalidade = currentCompeticaoModal.modalidade;
        if (modalidade === 'CLASSICA_EQUIPADO') {
            const modalidadeRadio = document.querySelector('input[name="modalidade"]:checked');
            if (!modalidadeRadio) {
                showAlert('Selecione a modalidade', 'error');
                return;
            }
            modalidade = modalidadeRadio.value;
        }
        
        // Preparar dados da inscrição
        const categoriaPesoObj = JSON.parse(categoriaPeso);
        const categoriaIdadeObj = JSON.parse(categoriaIdade);
        const dobraCategoriaObj = dobraCategoria ? JSON.parse(dobraCategoria) : null;
        
        const inscricaoData = {
            id_atleta: atletaSelecionado.id,
            id_competicao: currentCompeticaoModal.id,
            modalidade: modalidade,
            observacoes: observacoes,
            status_inscricao: 'INSCRITO',
            valor_individual: currentCompeticaoModal.valor_inscricao || 0,
            valor_dobra: dobraCategoriaObj ? (currentCompeticaoModal.valor_dobra || 0) : 0,
            categoria_peso: categoriaPesoObj.id,
            categoria_idade: categoriaIdadeObj.id,
            dobra_categoria: dobraCategoriaObj ? dobraCategoriaObj.id : null,
            total_atleta: totalAtleta ? parseFloat(totalAtleta) : null
        };
        
        console.log('📝 Dados da inscrição:', inscricaoData);
        
        // Salvar inscrição
        const response = await fetch('/api/inscricoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(inscricaoData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Atleta inscrito com sucesso!', 'success');
            closeCategorizacaoModal();
            
            // Recarregar dados se estiver no modal de inscrições
            if (currentCompeticaoModal) {
                await carregarInscricoesModal(currentCompeticaoModal.id);
            }
        } else {
            throw new Error(data.error || 'Erro ao salvar inscrição');
        }
        
    } catch (error) {
        console.error('❌ Erro ao finalizar inscrição:', error);
        showAlert('Erro ao finalizar inscrição: ' + error.message, 'error');
    }
}

// =====================================================
// FUNÇÕES DE EDIÇÃO E EXCLUSÃO DE INSCRIÇÕES
// =====================================================

// Verificar se pode editar/excluir inscrição (antes da data de nominação final)
function podeEditarExcluirInscricao(competicao) {
    if (!competicao || !competicao.data_nominacao_final) {
        return true; // Se não há data de nominação final, permite editar/excluir
    }
    
    const hoje = new Date();
    const dataNominacaoFinal = new Date(competicao.data_nominacao_final);
    
    // Permite editar/excluir se ainda não chegou na data de nominação final
    return hoje <= dataNominacaoFinal;
}

// Editar inscrição
async function editarInscricao(inscricaoId) {
    try {
        console.log('🔍 Editando inscrição:', inscricaoId);
        
        // Buscar dados da inscrição
        const inscricao = inscricoesModal.find(i => i.id === inscricaoId);
        if (!inscricao) {
            showAlert('Inscrição não encontrada', 'error');
            return;
        }
        
        // Verificar se pode editar
        if (!podeEditarExcluirInscricao(currentCompeticaoModal)) {
            showAlert('Não é possível editar inscrições após a data de nominação final', 'error');
            return;
        }
        
        // Preencher modal de edição
        await preencherModalEdicao(inscricao);
        
        // Mostrar modal
        document.getElementById('editarInscricaoModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao editar inscrição:', error);
        showAlert('Erro ao editar inscrição', 'error');
    }
}

// Preencher modal de edição
async function preencherModalEdicao(inscricao) {
    try {
        // Preencher informações do atleta
        document.getElementById('editarAtletaNome').textContent = inscricao.atleta?.nome || 'N/A';
        document.getElementById('editarAtletaEquipe').textContent = inscricao.atleta?.equipe?.nome_equipe || 'N/A';
        
        // Calcular idade
        const idade = calcularIdade(inscricao.atleta?.data_nascimento);
        document.getElementById('editarAtletaIdade').textContent = idade;
        
        // Carregar categorias
        await carregarCategoriasParaEdicao(inscricao.atleta?.sexo);
        
        // Preencher campos
        document.getElementById('editarCategoriaPeso').value = inscricao.categoria_peso || '';
        document.getElementById('editarCategoriaIdade').value = inscricao.categoria_idade || '';
        document.getElementById('editarDobraCategoria').value = inscricao.dobra_categoria || '';
        document.getElementById('editarTotalAtleta').value = inscricao.total_atleta || '';
        document.getElementById('editarObservacoes').value = inscricao.observacoes || '';
        
        // Armazenar ID da inscrição para salvar
        document.getElementById('editarInscricaoModal').dataset.inscricaoId = inscricao.id;
        
        // Calcular valores
        calcularValoresEdicao();
        
    } catch (error) {
        console.error('❌ Erro ao preencher modal de edição:', error);
        throw error;
    }
}

// Carregar categorias para edição
async function carregarCategoriasParaEdicao(sexo) {
    try {
        // Carregar categorias de peso
        const responsePeso = await fetch(`/api/categorias/peso?sexo=${sexo}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (responsePeso.ok) {
            const dataPeso = await responsePeso.json();
            if (dataPeso.success) {
                preencherSelectCategorias('editarCategoriaPeso', dataPeso.data);
            }
        }
        
        // Carregar categorias de idade
        const responseIdade = await fetch('/api/categorias/idade', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (responseIdade.ok) {
            const dataIdade = await responseIdade.json();
            if (dataIdade.success) {
                preencherSelectCategorias('editarCategoriaIdade', dataIdade.data);
            }
        }
        
        // Carregar opções de dobra
        await carregarOpcoesDobraEdicao();
        
    } catch (error) {
        console.error('❌ Erro ao carregar categorias para edição:', error);
    }
}

// Preencher select com categorias
function preencherSelectCategorias(selectId, categorias) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Manter o valor atual
    const valorAtual = select.value;
    
    // Limpar opções (exceto a primeira)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Adicionar novas opções
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.value || categoria;
        option.textContent = categoria.label || categoria;
        select.appendChild(option);
    });
    
    // Restaurar valor
    select.value = valorAtual;
}

// Carregar opções de dobra para edição
async function carregarOpcoesDobraEdicao() {
    const categoriaIdade = document.getElementById('editarCategoriaIdade').value;
    if (!categoriaIdade) return;
    
    try {
        const response = await fetch('/api/categorias/opcoes-dobra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ categoriaIdade })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const select = document.getElementById('editarDobraCategoria');
                const valorAtual = select.value;
                
                // Limpar opções
                select.innerHTML = '<option value="">Nenhuma</option>';
                
                // Adicionar opções válidas
                data.data.forEach(opcao => {
                    const option = document.createElement('option');
                    option.value = opcao.value;
                    option.textContent = opcao.label;
                    select.appendChild(option);
                });
                
                select.value = valorAtual;
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar opções de dobra:', error);
    }
}

// Calcular valores na edição
function calcularValoresEdicao() {
    if (!currentCompeticaoModal) return;
    
    const valorIndividual = currentCompeticaoModal.valor_inscricao || 0;
    const valorDobra = currentCompeticaoModal.valor_dobra || 0;
    const temDobra = document.getElementById('editarDobraCategoria').value !== '';
    
    const valorTotal = valorIndividual + (temDobra ? valorDobra : 0);
    
    document.getElementById('editarValorIndividual').textContent = `R$ ${valorIndividual.toFixed(2)}`;
    document.getElementById('editarValorDobra').textContent = `R$ ${temDobra ? valorDobra.toFixed(2) : '0,00'}`;
    document.getElementById('editarValorTotal').textContent = `R$ ${valorTotal.toFixed(2)}`;
}

// Salvar edição da inscrição
async function salvarEdicaoInscricao() {
    try {
        const inscricaoId = document.getElementById('editarInscricaoModal').dataset.inscricaoId;
        if (!inscricaoId) {
            showAlert('ID da inscrição não encontrado', 'error');
            return;
        }
        
        // Coletar dados do formulário
        const dadosEdicao = {
            categoria_peso: document.getElementById('editarCategoriaPeso').value,
            categoria_idade: document.getElementById('editarCategoriaIdade').value,
            dobra_categoria: document.getElementById('editarDobraCategoria').value || null,
            total_atleta: parseFloat(document.getElementById('editarTotalAtleta').value) || null,
            observacoes: document.getElementById('editarObservacoes').value
        };
        
        // Validar dados obrigatórios
        if (!dadosEdicao.categoria_peso || !dadosEdicao.categoria_idade) {
            showAlert('Categoria de peso e idade são obrigatórias', 'error');
            return;
        }
        
        // Enviar para API
        const response = await fetch(`/api/inscricoes/${inscricaoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(dadosEdicao)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Inscrição atualizada com sucesso!', 'success');
            closeEditarInscricaoModal();
            
            // Recarregar inscrições
            if (currentCompeticaoModal) {
                await carregarInscricoesModal(currentCompeticaoModal.id);
            }
        } else {
            throw new Error(data.error || 'Erro ao atualizar inscrição');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar edição:', error);
        showAlert('Erro ao salvar edição: ' + error.message, 'error');
    }
}

// Excluir inscrição
async function excluirInscricao(inscricaoId, nomeAtleta) {
    try {
        // Verificar se pode excluir
        if (!podeEditarExcluirInscricao(currentCompeticaoModal)) {
            showAlert('Não é possível excluir inscrições após a data de nominação final', 'error');
            return;
        }
        
        // Confirmar exclusão
        const confirmar = confirm(`Tem certeza que deseja excluir a inscrição de ${nomeAtleta}?`);
        if (!confirmar) return;
        
        // Enviar requisição de exclusão
        const response = await fetch(`/api/inscricoes/${inscricaoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Inscrição excluída com sucesso!', 'success');
            
            // Recarregar inscrições
            if (currentCompeticaoModal) {
                await carregarInscricoesModal(currentCompeticaoModal.id);
            }
        } else {
            throw new Error(data.error || 'Erro ao excluir inscrição');
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir inscrição:', error);
        showAlert('Erro ao excluir inscrição: ' + error.message, 'error');
    }
}

// Fechar modal de edição
function closeEditarInscricaoModal() {
    document.getElementById('editarInscricaoModal').classList.remove('active');
    
    // Limpar dados
    document.getElementById('editarInscricaoModal').dataset.inscricaoId = '';
    document.getElementById('formEditarInscricao').reset();
}

// Event listeners para o modal de edição
document.addEventListener('DOMContentLoaded', function() {
    // Formulário de edição
    const formEditar = document.getElementById('formEditarInscricao');
    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarEdicaoInscricao();
        });
    }
    
    // Event listeners para recalcular valores
    const editarCategoriaIdade = document.getElementById('editarCategoriaIdade');
    const editarDobraCategoria = document.getElementById('editarDobraCategoria');
    
    if (editarCategoriaIdade) {
        editarCategoriaIdade.addEventListener('change', function() {
            carregarOpcoesDobraEdicao();
            calcularValoresEdicao();
        });
    }
    
    if (editarDobraCategoria) {
        editarDobraCategoria.addEventListener('change', calcularValoresEdicao);
    }
});
