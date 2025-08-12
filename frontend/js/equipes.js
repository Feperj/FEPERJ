// Gerenciamento de Equipes

let equipes = [];

// Carregar equipes
async function loadEquipes() {
    const equipesGrid = document.getElementById('equipesGrid');
    if (!equipesGrid) return;
    
    try {
        showLoading(equipesGrid);
        
        const response = await apiRequest('/equipes');
        equipes = response;
        
        renderEquipesGrid(equipes);
        
    } catch (error) {
        console.error('Erro ao carregar equipes:', error);
        showAlert('Erro ao carregar equipes: ' + error.message, 'error');
        equipesGrid.innerHTML = '<div class="col-span-full text-center text-red-600">Erro ao carregar dados</div>';
    }
}

// Renderizar grid de equipes
function renderEquipesGrid(equipesData) {
    const equipesGrid = document.getElementById('equipesGrid');
    if (!equipesGrid) return;
    
    if (equipesData.length === 0) {
        equipesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500">Nenhuma equipe encontrada</div>';
        return;
    }
    
    equipesGrid.innerHTML = equipesData.map(equipe => `
        <div class="equipe-card">
            <div class="flex justify-between items-start mb-4">
                <h4 class="text-lg font-semibold text-gray-900">${equipe.nome}</h4>
                <div class="flex space-x-2">
                    <button onclick="viewEquipe('${equipe._id}')" class="btn-view">
                        <i class="fas fa-eye mr-1"></i>Ver
                    </button>
                    ${hasPermission('edit_equipe') ? `
                        <button onclick="editEquipe('${equipe._id}')" class="btn-edit">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                    ` : ''}
                    ${hasPermission('delete_equipe') ? `
                        <button onclick="deleteEquipe('${equipe._id}')" class="btn-danger">
                            <i class="fas fa-trash mr-1"></i>Excluir
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="space-y-2">
                <p><i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>${equipe.cidade}, ${equipe.estado}</p>
                ${equipe.telefone ? `<p><i class="fas fa-phone text-gray-400 mr-2"></i>${formatPhone(equipe.telefone)}</p>` : ''}
                ${equipe.email ? `<p><i class="fas fa-envelope text-gray-400 mr-2"></i>${equipe.email}</p>` : ''}
                ${equipe.responsavel ? `<p><i class="fas fa-user text-gray-400 mr-2"></i>${equipe.responsavel}</p>` : ''}
            </div>
            
            <div class="equipe-stats">
                <span class="text-sm text-gray-600">
                    <i class="fas fa-users mr-1"></i>
                    ${equipe.total_atletas || 0} atletas
                </span>
                <span class="text-xs text-gray-500">
                    Criada em ${formatDate(equipe.data_criacao)}
                </span>
            </div>
        </div>
    `).join('');
}

// Visualizar equipe
function viewEquipe(equipeId) {
    const equipe = equipes.find(e => e._id === equipeId);
    if (!equipe) {
        showAlert('Equipe não encontrada', 'error');
        return;
    }
    
    const modal = document.getElementById('equipeModal');
    const modalTitle = document.getElementById('equipeModalTitle');
    
    modalTitle.textContent = 'Detalhes da Equipe';
    
    // Preencher formulário com dados da equipe
    fillEquipeForm(equipe);
    
    // Desabilitar campos para visualização
    disableEquipeForm();
    
    showModal('equipeModal');
}

// Editar equipe
function editEquipe(equipeId) {
    const equipe = equipes.find(e => e._id === equipeId);
    if (!equipe) {
        showAlert('Equipe não encontrada', 'error');
        return;
    }
    
    const modal = document.getElementById('equipeModal');
    const modalTitle = document.getElementById('equipeModalTitle');
    
    modalTitle.textContent = 'Editar Equipe';
    
    // Preencher formulário com dados da equipe
    fillEquipeForm(equipe);
    
    // Habilitar campos para edição
    enableEquipeForm();
    
    // Configurar formulário para edição
    const form = document.getElementById('equipeForm');
    form.dataset.mode = 'edit';
    form.dataset.equipeId = equipeId;
    
    showModal('equipeModal');
}

// Excluir equipe
async function deleteEquipe(equipeId) {
    const equipe = equipes.find(e => e._id === equipeId);
    if (!equipe) {
        showAlert('Equipe não encontrada', 'error');
        return;
    }
    
    if (equipe.total_atletas > 0) {
        showAlert('Não é possível excluir uma equipe que possui atletas', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir a equipe "${equipe.nome}"?`)) {
        return;
    }
    
    try {
        await apiRequest(`/equipes/${equipeId}`, {
            method: 'DELETE'
        });
        
        showAlert('Equipe excluída com sucesso!', 'success');
        loadEquipes();
        
    } catch (error) {
        console.error('Erro ao excluir equipe:', error);
        showAlert('Erro ao excluir equipe: ' + error.message, 'error');
    }
}

// Preencher formulário de equipe
function fillEquipeForm(equipe) {
    document.getElementById('equipeNome').value = equipe.nome || '';
    document.getElementById('equipeCidade').value = equipe.cidade || '';
    document.getElementById('equipeEstado').value = equipe.estado || '';
    document.getElementById('equipeTelefone').value = equipe.telefone || '';
    document.getElementById('equipeEmail').value = equipe.email || '';
    document.getElementById('equipeResponsavel').value = equipe.responsavel || '';
}

// Desabilitar formulário de equipe
function disableEquipeForm() {
    const form = document.getElementById('equipeForm');
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Esconder botão de salvar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
}

// Habilitar formulário de equipe
function enableEquipeForm() {
    const form = document.getElementById('equipeForm');
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Mostrar botão de salvar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.style.display = '';
    }
}

// Limpar formulário de equipe
function clearEquipeForm() {
    const form = document.getElementById('equipeForm');
    form.reset();
    form.dataset.mode = 'create';
    delete form.dataset.equipeId;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botão adicionar equipe
    const addEquipeBtn = document.getElementById('addEquipeBtn');
    if (addEquipeBtn) {
        addEquipeBtn.addEventListener('click', function() {
            const modal = document.getElementById('equipeModal');
            const modalTitle = document.getElementById('equipeModalTitle');
            
            modalTitle.textContent = 'Nova Equipe';
            
            clearEquipeForm();
            enableEquipeForm();
            
            showModal('equipeModal');
        });
    }
    
    // Formulário de equipe
    const equipeForm = document.getElementById('equipeForm');
    if (equipeForm) {
        equipeForm.addEventListener('submit', handleEquipeSubmit);
    }
    
    // Máscara para telefone
    const telefoneInput = document.getElementById('equipeTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                e.target.value = value;
            }
        });
    }
});

// Manipular envio do formulário de equipe
async function handleEquipeSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const mode = form.dataset.mode || 'create';
    const equipeId = form.dataset.equipeId;
    
    // Coletar dados do formulário
    const equipeData = {
        nome: document.getElementById('equipeNome').value.trim(),
        cidade: document.getElementById('equipeCidade').value.trim(),
        estado: document.getElementById('equipeEstado').value.trim(),
        telefone: document.getElementById('equipeTelefone').value.replace(/\D/g, ''),
        email: document.getElementById('equipeEmail').value.trim(),
        responsavel: document.getElementById('equipeResponsavel').value.trim()
    };
    
    // Validações
    if (!equipeData.nome) {
        showAlert('Nome da equipe é obrigatório', 'error');
        return;
    }
    
    if (!equipeData.cidade) {
        showAlert('Cidade é obrigatória', 'error');
        return;
    }
    
    if (!equipeData.estado) {
        showAlert('Estado é obrigatório', 'error');
        return;
    }
    
    if (equipeData.email && !validateEmail(equipeData.email)) {
        showAlert('Email inválido', 'error');
        return;
    }
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        submitBtn.disabled = true;
        
        if (mode === 'edit') {
            // Atualizar equipe
            await apiRequest(`/equipes/${equipeId}`, {
                method: 'PUT',
                body: JSON.stringify(equipeData)
            });
            showAlert('Equipe atualizada com sucesso!', 'success');
        } else {
            // Criar nova equipe
            await apiRequest('/equipes', {
                method: 'POST',
                body: JSON.stringify(equipeData)
            });
            showAlert('Equipe criada com sucesso!', 'success');
        }
        
        hideModal('equipeModal');
        loadEquipes();
        
    } catch (error) {
        console.error('Erro ao salvar equipe:', error);
        showAlert('Erro ao salvar equipe: ' + error.message, 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Função para obter equipe por ID
function getEquipeById(equipeId) {
    return equipes.find(equipe => equipe._id === equipeId);
}

// Função para obter nome da equipe por ID
function getEquipeNameById(equipeId) {
    const equipe = getEquipeById(equipeId);
    return equipe ? equipe.nome : 'N/A';
}

// Função para atualizar contadores de atletas
async function updateEquipeAthleteCounts() {
    try {
        const atletasResponse = await apiRequest('/atletas');
        const atletas = atletasResponse;
        
        // Contar atletas por equipe
        const equipeCounts = {};
        atletas.forEach(atleta => {
            if (atleta.id_equipe) {
                equipeCounts[atleta.id_equipe] = (equipeCounts[atleta.id_equipe] || 0) + 1;
            }
        });
        
        // Atualizar contadores nas equipes
        equipes.forEach(equipe => {
            equipe.total_atletas = equipeCounts[equipe._id] || 0;
        });
        
        // Re-renderizar grid se estiver na seção de equipes
        const equipesSection = document.getElementById('equipes');
        if (equipesSection && equipesSection.classList.contains('active')) {
            renderEquipesGrid(equipes);
        }
        
    } catch (error) {
        console.error('Erro ao atualizar contadores de atletas:', error);
    }
}

// Função para exportar equipes para CSV
async function exportEquipesCSV() {
    try {
        const equipesData = await apiRequest('/equipes');
        
        const csvData = equipesData.map(equipe => ({
            'Nome': equipe.nome,
            'Cidade': equipe.cidade,
            'Estado': equipe.estado,
            'Telefone': formatPhone(equipe.telefone),
            'Email': equipe.email || '-',
            'Responsável': equipe.responsavel || '-',
            'Total de Atletas': equipe.total_atletas || 0,
            'Data de Criação': formatDate(equipe.data_criacao)
        }));
        
        downloadCSV(csvData, `equipes_${new Date().toISOString().split('T')[0]}.csv`);
        showAlert('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar equipes:', error);
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

// Função para buscar equipes
function searchEquipes(query) {
    if (!query) {
        renderEquipesGrid(equipes);
        return;
    }
    
    const filteredEquipes = equipes.filter(equipe => 
        equipe.nome.toLowerCase().includes(query.toLowerCase()) ||
        equipe.cidade.toLowerCase().includes(query.toLowerCase()) ||
        equipe.estado.toLowerCase().includes(query.toLowerCase()) ||
        (equipe.responsavel && equipe.responsavel.toLowerCase().includes(query.toLowerCase()))
    );
    
    renderEquipesGrid(filteredEquipes);
}

// Função para obter estatísticas das equipes
function getEquipeStats() {
    const stats = {
        total: equipes.length,
        comAtletas: equipes.filter(e => e.total_atletas > 0).length,
        semAtletas: equipes.filter(e => e.total_atletas === 0).length,
        totalAtletas: equipes.reduce((sum, e) => sum + (e.total_atletas || 0), 0)
    };
    
    return stats;
}

// Função para obter top equipes por número de atletas
function getTopEquipes(limit = 5) {
    return equipes
        .filter(e => e.total_atletas > 0)
        .sort((a, b) => (b.total_atletas || 0) - (a.total_atletas || 0))
        .slice(0, limit);
}
