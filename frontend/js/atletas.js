// Gerenciamento de Atletas

let atletas = [];
let equipes = [];

// Carregar atletas
async function loadAtletas() {
    const tableBody = document.getElementById('atletasTableBody');
    if (!tableBody) return;
    
    try {
        showLoading(tableBody);
        
        // Carregar atletas e equipes em paralelo
        const [atletasResponse, equipesResponse] = await Promise.all([
            apiRequest('/atletas'),
            apiRequest('/equipes')
        ]);
        
        atletas = atletasResponse;
        equipes = equipesResponse;
        
        renderAtletasTable(atletas);
        
    } catch (error) {
        console.error('Erro ao carregar atletas:', error);
        showAlert('Erro ao carregar atletas: ' + error.message, 'error');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-red-600">Erro ao carregar dados</td></tr>';
    }
}

// Renderizar tabela de atletas
function renderAtletasTable(atletasData) {
    const tableBody = document.getElementById('atletasTableBody');
    if (!tableBody) return;
    
    if (atletasData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">Nenhum atleta encontrado</td></tr>';
        return;
    }
    
    tableBody.innerHTML = atletasData.map(atleta => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-700">${atleta.nome.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${atleta.nome}</div>
                        <div class="text-sm text-gray-500">${atleta.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatCPF(atleta.cpf)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${atleta.nome_equipe || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${atleta.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}">
                    ${atleta.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="viewAtleta('${atleta._id}')" class="btn-view">
                        <i class="fas fa-eye mr-1"></i>Ver
                    </button>
                    ${hasPermission('edit_atleta') ? `
                        <button onclick="editAtleta('${atleta._id}')" class="btn-edit">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                    ` : ''}
                    ${hasPermission('delete_atleta') ? `
                        <button onclick="deleteAtleta('${atleta._id}')" class="btn-danger">
                            <i class="fas fa-trash mr-1"></i>Excluir
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Visualizar atleta
function viewAtleta(atletaId) {
    const atleta = atletas.find(a => a._id === atletaId);
    if (!atleta) {
        showAlert('Atleta não encontrado', 'error');
        return;
    }
    
    const modal = document.getElementById('atletaModal');
    const modalTitle = document.getElementById('atletaModalTitle');
    
    modalTitle.textContent = 'Detalhes do Atleta';
    
    // Preencher formulário com dados do atleta
    fillAtletaForm(atleta);
    
    // Desabilitar campos para visualização
    disableAtletaForm();
    
    showModal('atletaModal');
}

// Editar atleta
function editAtleta(atletaId) {
    const atleta = atletas.find(a => a._id === atletaId);
    if (!atleta) {
        showAlert('Atleta não encontrado', 'error');
        return;
    }
    
    const modal = document.getElementById('atletaModal');
    const modalTitle = document.getElementById('atletaModalTitle');
    
    modalTitle.textContent = 'Editar Atleta';
    
    // Preencher formulário com dados do atleta
    fillAtletaForm(atleta);
    
    // Habilitar campos para edição
    enableAtletaForm();
    
    // Configurar formulário para edição
    const form = document.getElementById('atletaForm');
    form.dataset.mode = 'edit';
    form.dataset.atletaId = atletaId;
    
    showModal('atletaModal');
}

// Excluir atleta
async function deleteAtleta(atletaId) {
    const atleta = atletas.find(a => a._id === atletaId);
    if (!atleta) {
        showAlert('Atleta não encontrado', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o atleta "${atleta.nome}"?`)) {
        return;
    }
    
    try {
        await apiRequest(`/atletas/${atletaId}`, {
            method: 'DELETE'
        });
        
        showAlert('Atleta excluído com sucesso!', 'success');
        loadAtletas();
        
    } catch (error) {
        console.error('Erro ao excluir atleta:', error);
        showAlert('Erro ao excluir atleta: ' + error.message, 'error');
    }
}

// Preencher formulário de atleta
function fillAtletaForm(atleta) {
    document.getElementById('atletaNome').value = atleta.nome || '';
    document.getElementById('atletaCpf').value = atleta.cpf || '';
    document.getElementById('atletaEmail').value = atleta.email || '';
    document.getElementById('atletaTelefone').value = atleta.telefone || '';
    document.getElementById('atletaSexo').value = atleta.sexo || '';
    document.getElementById('atletaDataNascimento').value = atleta.data_nascimento || '';
    document.getElementById('atletaDataFiliacao').value = atleta.data_filiacao || '';
    document.getElementById('atletaPeso').value = atleta.peso || '';
    document.getElementById('atletaAltura').value = atleta.altura || '';
    document.getElementById('atletaMaiorTotal').value = atleta.maior_total || '';
    document.getElementById('atletaEndereco').value = atleta.endereco || '';
    document.getElementById('atletaObservacoes').value = atleta.observacoes || '';
    
    // Preencher select de equipe
    const equipeSelect = document.getElementById('atletaEquipe');
    equipeSelect.innerHTML = '<option value="">Selecione</option>';
    equipes.forEach(equipe => {
        const option = document.createElement('option');
        option.value = equipe._id;
        option.textContent = equipe.nome;
        if (atleta.id_equipe === equipe._id) {
            option.selected = true;
        }
        equipeSelect.appendChild(option);
    });
}

// Desabilitar formulário de atleta
function disableAtletaForm() {
    const form = document.getElementById('atletaForm');
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

// Habilitar formulário de atleta
function enableAtletaForm() {
    const form = document.getElementById('atletaForm');
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

// Limpar formulário de atleta
function clearAtletaForm() {
    const form = document.getElementById('atletaForm');
    form.reset();
    form.dataset.mode = 'create';
    delete form.dataset.atletaId;
    
    // Limpar select de equipe
    const equipeSelect = document.getElementById('atletaEquipe');
    equipeSelect.innerHTML = '<option value="">Selecione</option>';
    equipes.forEach(equipe => {
        const option = document.createElement('option');
        option.value = equipe._id;
        option.textContent = equipe.nome;
        equipeSelect.appendChild(option);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botão adicionar atleta
    const addAtletaBtn = document.getElementById('addAtletaBtn');
    if (addAtletaBtn) {
        addAtletaBtn.addEventListener('click', function() {
            const modal = document.getElementById('atletaModal');
            const modalTitle = document.getElementById('atletaModalTitle');
            
            modalTitle.textContent = 'Novo Atleta';
            
            clearAtletaForm();
            enableAtletaForm();
            
            showModal('atletaModal');
        });
    }
    
    // Formulário de atleta
    const atletaForm = document.getElementById('atletaForm');
    if (atletaForm) {
        atletaForm.addEventListener('submit', handleAtletaSubmit);
    }
    
    // Máscara para CPF
    const cpfInput = document.getElementById('atletaCpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                e.target.value = value;
            }
        });
    }
    
    // Máscara para telefone
    const telefoneInput = document.getElementById('atletaTelefone');
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

// Manipular envio do formulário de atleta
async function handleAtletaSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const mode = form.dataset.mode || 'create';
    const atletaId = form.dataset.atletaId;
    
    // Coletar dados do formulário
    const atletaData = {
        nome: document.getElementById('atletaNome').value.trim(),
        cpf: document.getElementById('atletaCpf').value.replace(/\D/g, ''),
        email: document.getElementById('atletaEmail').value.trim(),
        telefone: document.getElementById('atletaTelefone').value.replace(/\D/g, ''),
        sexo: document.getElementById('atletaSexo').value,
        data_nascimento: document.getElementById('atletaDataNascimento').value,
        data_filiacao: document.getElementById('atletaDataFiliacao').value,
        peso: parseFloat(document.getElementById('atletaPeso').value) || null,
        altura: parseFloat(document.getElementById('atletaAltura').value) || null,
        maior_total: parseFloat(document.getElementById('atletaMaiorTotal').value) || null,
        endereco: document.getElementById('atletaEndereco').value.trim(),
        observacoes: document.getElementById('atletaObservacoes').value.trim(),
        id_equipe: document.getElementById('atletaEquipe').value || null
    };
    
    // Validações
    if (!atletaData.nome) {
        showAlert('Nome é obrigatório', 'error');
        return;
    }
    
    if (!atletaData.cpf || atletaData.cpf.length !== 11) {
        showAlert('CPF inválido', 'error');
        return;
    }
    
    if (!validateCPF(atletaData.cpf)) {
        showAlert('CPF inválido', 'error');
        return;
    }
    
    if (!atletaData.email || !validateEmail(atletaData.email)) {
        showAlert('Email inválido', 'error');
        return;
    }
    
    if (!atletaData.sexo) {
        showAlert('Sexo é obrigatório', 'error');
        return;
    }
    
    if (!atletaData.data_filiacao) {
        showAlert('Data de filiação é obrigatória', 'error');
        return;
    }
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        submitBtn.disabled = true;
        
        if (mode === 'edit') {
            // Atualizar atleta
            await apiRequest(`/atletas/${atletaId}`, {
                method: 'PUT',
                body: JSON.stringify(atletaData)
            });
            showAlert('Atleta atualizado com sucesso!', 'success');
        } else {
            // Criar novo atleta
            await apiRequest('/atletas', {
                method: 'POST',
                body: JSON.stringify(atletaData)
            });
            showAlert('Atleta criado com sucesso!', 'success');
        }
        
        hideModal('atletaModal');
        loadAtletas();
        
    } catch (error) {
        console.error('Erro ao salvar atleta:', error);
        showAlert('Erro ao salvar atleta: ' + error.message, 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Função para filtrar atletas
function filterAtletas(query) {
    if (!query) {
        renderAtletasTable(atletas);
        return;
    }
    
    const filteredAtletas = atletas.filter(atleta => 
        atleta.nome.toLowerCase().includes(query.toLowerCase()) ||
        atleta.cpf.includes(query) ||
        atleta.email.toLowerCase().includes(query.toLowerCase()) ||
        (atleta.nome_equipe && atleta.nome_equipe.toLowerCase().includes(query.toLowerCase()))
    );
    
    renderAtletasTable(filteredAtletas);
}

// Exportar atletas para CSV
async function exportAtletasCSV() {
    try {
        const atletasData = await apiRequest('/atletas');
        
        const csvData = atletasData.map(atleta => ({
            'Nome': atleta.nome,
            'CPF': formatCPF(atleta.cpf),
            'Email': atleta.email,
            'Telefone': formatPhone(atleta.telefone),
            'Sexo': atleta.sexo === 'M' ? 'Masculino' : 'Feminino',
            'Data de Nascimento': formatDate(atleta.data_nascimento),
            'Data de Filiação': formatDate(atleta.data_filiacao),
            'Equipe': atleta.nome_equipe || '-',
            'Peso (kg)': atleta.peso || '-',
            'Altura (cm)': atleta.altura || '-',
            'Maior Total': atleta.maior_total || '-',
            'Status': atleta.status,
            'Endereço': atleta.endereco || '-',
            'Observações': atleta.observacoes || '-'
        }));
        
        downloadCSV(csvData, `atletas_${new Date().toISOString().split('T')[0]}.csv`);
        showAlert('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar atletas:', error);
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

// Event listener para exportar atletas
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportAtletasBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAtletasCSV);
    }
});
