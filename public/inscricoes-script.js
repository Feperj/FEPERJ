// =====================================================
// SISTEMA DE INSCRIÇÕES - FEPERJ
// =====================================================

// Variáveis globais
let currentUser = null;
let currentCompeticao = null;
let inscricoes = [];
let atletasDisponiveis = [];

// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de inscrições...');
    
    // Verificar autenticação
    verificarAutenticacao();
    
    // Carregar dados da competição da URL
    carregarCompeticaoDaURL();
});

// =====================================================
// AUTENTICAÇÃO
// =====================================================

async function verificarAutenticacao() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        currentUser = data.user;
        
        // Atualizar interface do usuário
        document.getElementById('userName').textContent = currentUser.nome;
        document.getElementById('userRole').textContent = currentUser.tipo === 'admin' ? 'Administrador' : 'Usuário';
        
        console.log('✅ Usuário autenticado:', currentUser.nome);
        
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// =====================================================
// CARREGAMENTO DE DADOS
// =====================================================

async function carregarCompeticaoDaURL() {
    try {
        // Obter ID da competição da URL
        const urlParams = new URLSearchParams(window.location.search);
        const idCompeticao = urlParams.get('competicao');
        
        if (!idCompeticao) {
            mostrarAlerta('ID da competição não encontrado na URL', 'error');
            return;
        }
        
        // Carregar dados da competição
        await carregarCompeticao(idCompeticao);
        
        // Carregar inscrições
        await carregarInscricoes(idCompeticao);
        
    } catch (error) {
        console.error('❌ Erro ao carregar competição:', error);
        mostrarAlerta('Erro ao carregar dados da competição', 'error');
    }
}

async function carregarCompeticao(idCompeticao) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/competicoes/${idCompeticao}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar competição');
        }

        const data = await response.json();
        currentCompeticao = data.data;
        
        // Atualizar interface
        document.getElementById('competicaoNome').textContent = currentCompeticao.nome_competicao;
        document.getElementById('competicaoData').textContent = `Data: ${formatarData(currentCompeticao.data_competicao)}`;
        document.getElementById('competicaoLocal').textContent = `Local: ${currentCompeticao.local || 'Não informado'}`;
        document.getElementById('competicaoStatus').textContent = currentCompeticao.status;
        document.getElementById('competicaoStatus').className = `badge badge-${getStatusClass(currentCompeticao.status)}`;
        
        // Mostrar informações da competição
        document.getElementById('competicaoInfo').style.display = 'block';
        
        console.log('✅ Competição carregada:', currentCompeticao.nome_competicao);
        
    } catch (error) {
        console.error('❌ Erro ao carregar competição:', error);
        throw error;
    }
}

async function carregarInscricoes(idCompeticao) {
    try {
        mostrarLoading(true);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/inscricoes/${idCompeticao}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar inscrições');
        }

        const data = await response.json();
        inscricoes = data.data.inscricoes || [];
        
        // Atualizar estatísticas
        atualizarEstatisticas();
        
        // Renderizar tabela
        renderizarTabelaInscricoes();
        
        console.log('✅ Inscrições carregadas:', inscricoes.length);
        
    } catch (error) {
        console.error('❌ Erro ao carregar inscrições:', error);
        mostrarAlerta('Erro ao carregar inscrições', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// =====================================================
// RENDERIZAÇÃO
// =====================================================

function renderizarTabelaInscricoes() {
    const tbody = document.getElementById('inscricoesTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (inscricoes.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = inscricoes.map(inscricao => {
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
                        <button onclick="editarInscricao('${inscricao.id}')" class="btn-warning" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="excluirInscricao('${inscricao.id}')" class="btn-danger" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function atualizarEstatisticas() {
    const totalInscricoes = inscricoes.length;
    const inscricoesConfirmadas = inscricoes.filter(insc => insc.status_inscricao === 'INSCRITO').length;
    const receitaTotal = inscricoes.reduce((total, insc) => total + (insc.valor_individual || 0), 0);
    const equipesUnicas = new Set(inscricoes.map(insc => insc.atleta?.equipe?.id)).size;
    
    document.getElementById('totalInscricoes').textContent = totalInscricoes;
    document.getElementById('inscricoesConfirmadas').textContent = inscricoesConfirmadas;
    document.getElementById('receitaTotal').textContent = `R$ ${receitaTotal.toFixed(2)}`;
    document.getElementById('equipesParticipantes').textContent = equipesUnicas;
}

// =====================================================
// MODAL DE INSCRIÇÃO
// =====================================================

async function novaInscricao() {
    if (!currentCompeticao) {
        mostrarAlerta('Competição não carregada', 'error');
        return;
    }
    
    try {
        // Carregar atletas disponíveis
        await carregarAtletasDisponiveis();
        
        // Limpar formulário
        document.getElementById('inscricaoForm').reset();
        document.getElementById('modalTitle').textContent = 'Nova Inscrição';
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>Salvar';
        
        // Mostrar modal
        document.getElementById('inscricaoModal').classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de inscrição:', error);
        mostrarAlerta('Erro ao carregar atletas disponíveis', 'error');
    }
}

async function carregarAtletasDisponiveis() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/inscricoes/atletas-disponiveis/${currentCompeticao.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar atletas disponíveis');
        }

        const data = await response.json();
        atletasDisponiveis = data.data.atletas || [];
        
        // Renderizar lista de atletas
        renderizarListaAtletas();
        
    } catch (error) {
        console.error('❌ Erro ao carregar atletas disponíveis:', error);
        throw error;
    }
}

function renderizarListaAtletas() {
    const container = document.getElementById('atletasList');
    
    if (atletasDisponiveis.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum atleta disponível para inscrição</p>';
        return;
    }
    
    container.innerHTML = atletasDisponiveis.map(atleta => {
        const equipe = atleta.equipe;
        return `
            <div class="checkbox-group">
                <input type="checkbox" id="atleta_${atleta.id}" value="${atleta.id}" onchange="toggleAtleta('${atleta.id}')">
                <label for="atleta_${atleta.id}" class="cursor-pointer">
                    <div class="font-semibold">${atleta.nome}</div>
                    <div class="text-sm text-gray-500">${equipe?.nome_equipe || 'N/A'} • CPF: ${atleta.cpf}</div>
                </label>
            </div>
        `;
    }).join('');
}

function toggleAtleta(atletaId) {
    // Lógica para gerenciar seleção de atletas
    console.log('Toggle atleta:', atletaId);
}

// =====================================================
// AÇÕES DE INSCRIÇÃO
// =====================================================

async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const modalidade = document.getElementById('modalidade').value;
        const observacoes = document.getElementById('observacoes').value;
        
        // Obter atletas selecionados
        const atletasSelecionados = [];
        atletasDisponiveis.forEach(atleta => {
            const checkbox = document.getElementById(`atleta_${atleta.id}`);
            if (checkbox && checkbox.checked) {
                atletasSelecionados.push(atleta.id);
            }
        });
        
        if (atletasSelecionados.length === 0) {
            mostrarAlerta('Selecione pelo menos um atleta', 'error');
            return;
        }
        
        // Criar inscrições para cada atleta selecionado
        for (const atletaId of atletasSelecionados) {
            const inscricaoData = {
                id_atleta: atletaId,
                id_competicao: currentCompeticao.id,
                modalidade: modalidade,
                observacoes: observacoes,
                status_inscricao: 'INSCRITO',
                valor_individual: currentCompeticao.valor_inscricao || 0
            };
            
            await criarInscricao(inscricaoData);
        }
        
        // Fechar modal e recarregar dados
        closeModal();
        await carregarInscricoes(currentCompeticao.id);
        
        mostrarAlerta('Inscrições criadas com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao salvar inscrição:', error);
        mostrarAlerta('Erro ao salvar inscrição', 'error');
    }
}

async function criarInscricao(inscricaoData) {
    try {
        const token = localStorage.getItem('token');
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

async function editarInscricao(id) {
    // Implementar edição de inscrição
    console.log('Editar inscrição:', id);
    mostrarAlerta('Funcionalidade de edição em desenvolvimento', 'info');
}

async function excluirInscricao(id) {
    if (!confirm('Tem certeza que deseja excluir esta inscrição?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
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
        await carregarInscricoes(currentCompeticao.id);
        
        mostrarAlerta('Inscrição excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir inscrição:', error);
        mostrarAlerta('Erro ao excluir inscrição', 'error');
    }
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function closeModal() {
    document.getElementById('inscricaoModal').classList.remove('active');
}

function voltarCompeticoes() {
    window.location.href = 'competicoes.html';
}

function exportarExcel() {
    if (inscricoes.length === 0) {
        mostrarAlerta('Nenhuma inscrição para exportar', 'error');
        return;
    }
    
    try {
        // Preparar dados para exportação
        const dados = inscricoes.map(inscricao => ({
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
        const nomeArquivo = `inscricoes_${currentCompeticao.nome_competicao}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
        
        mostrarAlerta('Planilha exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao exportar Excel:', error);
        mostrarAlerta('Erro ao exportar planilha', 'error');
    }
}

function mostrarLoading(show) {
    const loadingContainer = document.getElementById('loadingContainer');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        loadingContainer.style.display = 'flex';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingContainer.style.display = 'none';
    }
}

function mostrarAlerta(mensagem, tipo = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
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

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarData(data) {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
}

function getStatusClass(status) {
    const statusClasses = {
        'AGENDADA': 'info',
        'EM_ANDAMENTO': 'warning',
        'FINALIZADA': 'success',
        'CANCELADA': 'danger'
    };
    return statusClasses[status] || 'info';
}

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

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('inscricaoModal');
    if (event.target === modal) {
        closeModal();
    }
}
