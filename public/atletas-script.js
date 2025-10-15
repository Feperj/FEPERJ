// =====================================================
// GESTÃO DE ATLETAS - JavaScript Completo
// =====================================================

const API_BASE_URL = window.location.origin;
let currentUser = null;
let atletas = [];
let atletasFiltrados = [];
let equipes = [];
let categorias = [];
let editingId = null;
let selectedAtletaId = null;

// =====================================================
// AUTENTICAÇÃO E INICIALIZAÇÃO
// =====================================================

window.addEventListener('load', function() {
    verificarAutenticacao();
    loadData();
});

function verificarAutenticacao() {
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
}

function configurarPermissoes() {
    if (currentUser.tipo === 'admin') {
        // Admin pode ver botão de exportar e importar modelo
        document.getElementById('btnExportExcel').style.display = 'inline-block';
        document.getElementById('btnImportarModelo').style.display = 'inline-block';
        document.getElementById('pageSubtitle').textContent = 'Cadastro e gerenciamento de atletas de todas as equipes';
    } else {
        // Usuário comum vê apenas sua equipe
        document.getElementById('filtroEquipeContainer').style.display = 'none';
        document.getElementById('pageSubtitle').textContent = `Atletas da equipe: ${currentUser.nomeEquipe || 'Sua Equipe'}`;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// =====================================================
// FUNÇÕES DE ALERTA
// =====================================================

function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : (type === 'error' ? 'alert-error' : 'alert-info');
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
    
    alertContainer.innerHTML = `
        <div class="${alertClass}">
            <i class="fas fa-${icon} mr-2"></i>
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// =====================================================
// CARREGAR DADOS
// =====================================================

async function loadData() {
    try {
        const token = localStorage.getItem('authToken');
        
        // Carregar atletas
        const atletasResponse = await fetch(`${API_BASE_URL}/api/atletas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const atletasData = await atletasResponse.json();
        
        if (atletasData.success) {
            atletas = atletasData.data.atletas || [];
            
            
            // Se não for admin, filtrar apenas atletas da sua equipe
            if (currentUser.tipo !== 'admin' && currentUser.id_equipe) {
                atletas = atletas.filter(a => a.id_equipe === currentUser.id_equipe);
            }
        }
        
        // Carregar equipes
        const equipesResponse = await fetch(`${API_BASE_URL}/api/equipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const equipesData = await equipesResponse.json();
        
        if (equipesData.success) {
            equipes = equipesData.data.equipes || [];
            preencherSelectEquipes();
        }
        
        // Carregar categorias
        const categoriasResponse = await fetch(`${API_BASE_URL}/api/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categoriasData = await categoriasResponse.json();
        
        if (categoriasData.success) {
            categorias = categoriasData.data.categorias || [];
            preencherSelectCategorias();
        }
        
        renderAtletas();
        updateStats();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados. Tente recarregar a página.', 'error');
    } finally {
        document.getElementById('loadingContainer').style.display = 'none';
    }
}

// =====================================================
// RENDERIZAR ATLETAS
// =====================================================

function renderAtletas() {
    const tbody = document.getElementById('atletasTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (atletasFiltrados.length === 0 && atletas.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    const atletasParaExibir = atletasFiltrados.length > 0 || document.getElementById('searchInput').value ? atletasFiltrados : atletas;
    
    tbody.innerHTML = atletasParaExibir.map(atleta => {
        const podeEditar = currentUser.tipo === 'admin' || atleta.id_equipe === currentUser.id_equipe;
        
        
        // Extrair nome da equipe
        let equipeNome = '-';
        if (atleta.equipes && atleta.equipes.length > 0) {
            equipeNome = atleta.equipes[0].nome_equipe || '-';
        } else if (atleta.id_equipe) {
            // Se não tem objeto equipe mas tem id_equipe, buscar na lista de equipes
            const equipeEncontrada = equipes.find(e => e.id === atleta.id_equipe);
            equipeNome = equipeEncontrada ? equipeEncontrada.nome_equipe : 'Equipe não encontrada';
        }
        
        const categoriaNome = atleta.categoria && atleta.categoria.length > 0 ? atleta.categoria[0].nome_categoria : '-';
        
        // Verificar documentos
        const temFoto = atleta.foto_3x4;
        const temComprovante = atleta.comprovante_residencia;
        const temAdel = atleta.certificado_adel;
        const documentosCompletos = temFoto && temComprovante;
        
        return `
            <tr>
                <td class="font-semibold text-gray-800">${atleta.nome}</td>
                <td>${atleta.cpf}</td>
                <td>
                    <span class="badge badge-info">
                        <i class="fas fa-id-card mr-1"></i>
                        ${atleta.matricula || 'N/A'}
                    </span>
                </td>
                <td>
                    <span class="badge ${atleta.sexo === 'M' ? 'badge-primary' : 'badge-danger'}">
                        ${atleta.sexo === 'M' ? 'M' : 'F'}
                    </span>
                </td>
                <td>${atleta.email}</td>
                <td>${equipeNome}</td>
                <td>
                    <span class="badge ${atleta.status === 'ATIVO' ? 'badge-success' : 'badge-danger'}">
                        ${atleta.status}
                    </span>
                </td>
                <td>
                    ${documentosCompletos 
                        ? '<span class="badge badge-success"><i class="fas fa-check-circle mr-1"></i>Completo</span>'
                        : '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle mr-1"></i>Incompleto</span>'
                    }
                    <br>
                    <small class="text-gray-500">
                        ${temFoto ? '✅' : '❌'} Foto |
                        ${temComprovante ? '✅' : '❌'} Comp. |
                        ${temAdel ? '✅' : '❌'} ADEL
                    </small>
                </td>
                <td>
                    ${podeEditar ? `
                        <div class="dropdown" id="dropdown-${atleta.id}">
                            <button onclick="toggleDropdown('${atleta.id}')" class="btn-info">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-content" id="dropdown-content-${atleta.id}">
                                <div class="dropdown-item" onclick="editAtleta('${atleta.id}')">
                                    <i class="fas fa-edit"></i>
                                    Editar
                                </div>
                                <div class="dropdown-item" onclick="openDocumentosModal('${atleta.id}')">
                                    <i class="fas fa-file-upload"></i>
                                    Documentos
                                </div>
                                ${documentosCompletos ? `
                                    <div class="dropdown-item" onclick="gerarCarteirinha('${atleta.id}')">
                                        <i class="fas fa-id-card"></i>
                                        Gerar Carteirinha
                                    </div>
                                ` : ''}
                                ${currentUser.tipo === 'admin' ? `
                                    <div class="dropdown-item" onclick="deleteAtleta('${atleta.id}', '${atleta.nome}')">
                                        <i class="fas fa-trash"></i>
                                        Excluir
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : '<span class="text-gray-400 text-sm">Sem permissão</span>'}
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('atletasExibidos').textContent = atletasParaExibir.length;
}

// =====================================================
// ESTATÍSTICAS
// =====================================================

function updateStats() {
    const total = atletas.length;
    const ativos = atletas.filter(a => a.status === 'ATIVO').length;
    const masculino = atletas.filter(a => a.sexo === 'M').length;
    const feminino = atletas.filter(a => a.sexo === 'F').length;
    
    document.getElementById('totalAtletas').textContent = total;
    document.getElementById('atletasAtivos').textContent = ativos;
    document.getElementById('atletasMasculino').textContent = masculino;
    document.getElementById('atletasFeminino').textContent = feminino;
}

// =====================================================
// FILTROS
// =====================================================

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const equipeFilter = document.getElementById('filtroEquipe')?.value || '';
    const statusFilter = document.getElementById('filtroStatus').value;
    
    atletasFiltrados = atletas.filter(atleta => {
        const matchSearch = !searchTerm || 
            atleta.nome.toLowerCase().includes(searchTerm) ||
            atleta.cpf.includes(searchTerm) ||
            atleta.email.toLowerCase().includes(searchTerm) ||
            (atleta.matricula && atleta.matricula.toLowerCase().includes(searchTerm));
        
        const matchEquipe = !equipeFilter || atleta.id_equipe === equipeFilter;
        const matchStatus = !statusFilter || atleta.status === statusFilter;
        
        return matchSearch && matchEquipe && matchStatus;
    });
    
    renderAtletas();
}

// =====================================================
// MODAL DE ATLETA
// =====================================================

function openModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Novo Atleta';
    document.getElementById('atletaForm').reset();
    document.getElementById('atletaId').value = '';
    document.getElementById('matricula').value = '';
    
    // Configurar data de filiação padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataFiliacao').value = hoje;
    
    // Se não for admin, forçar equipe do usuário
    if (currentUser.tipo !== 'admin') {
        document.getElementById('equipe').value = currentUser.id_equipe || '';
        document.getElementById('equipe').disabled = true;
        document.getElementById('equipeHint').textContent = 'Atleta será automaticamente vinculado à sua equipe';
        
        // Ocultar campo de status
        document.getElementById('statusFormGroup').style.display = 'none';
    } else {
        document.getElementById('equipe').disabled = false;
        document.getElementById('equipeHint').textContent = '';
        document.getElementById('statusFormGroup').style.display = 'block';
        document.getElementById('statusHint').textContent = 'Apenas administradores podem alterar o status';
    }
    
    document.getElementById('atletaModal').classList.add('active');
}

function closeModal() {
    document.getElementById('atletaModal').classList.remove('active');
    editingId = null;
    document.getElementById('cpfFeedback').innerHTML = '';
}

function editAtleta(id) {
    const atleta = atletas.find(a => a.id === id);
    if (!atleta) return;
    
    // Verificar permissão
    if (currentUser.tipo !== 'admin' && atleta.id_equipe !== currentUser.id_equipe) {
        showAlert('Você só pode editar atletas da sua equipe', 'error');
        return;
    }
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Atleta';
    document.getElementById('atletaId').value = atleta.id;
    document.getElementById('nome').value = atleta.nome;
    document.getElementById('cpf').value = atleta.cpf;
    document.getElementById('matricula').value = atleta.matricula || '';
    document.getElementById('sexo').value = atleta.sexo;
    document.getElementById('email').value = atleta.email;
    document.getElementById('telefone').value = atleta.telefone || '';
    document.getElementById('dataNascimento').value = atleta.data_nascimento || '';
    document.getElementById('dataFiliacao').value = atleta.data_filiacao || '';
    document.getElementById('equipe').value = atleta.id_equipe || '';
    document.getElementById('categoria').value = atleta.id_categoria || '';
    document.getElementById('status').value = atleta.status;
    document.getElementById('endereco').value = atleta.endereco || '';
    document.getElementById('observacoes').value = atleta.observacoes || '';
    
    // Configurar permissões
    if (currentUser.tipo !== 'admin') {
        document.getElementById('equipe').disabled = true;
        document.getElementById('statusFormGroup').style.display = 'none';
    }
    
    document.getElementById('atletaModal').classList.add('active');
}

// =====================================================
// CPF - VALIDAÇÃO E FORMATAÇÃO
// =====================================================

function handleCPFInput(event) {
    let cpf = event.target.value.replace(/\D/g, '');
    
    // Formatação: 000.000.000-00
    if (cpf.length <= 11) {
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    event.target.value = cpf;
    
    // Gerar matrícula automaticamente
    if (cpf.replace(/\D/g, '').length >= 5) {
        const matricula = gerarMatricula(cpf);
        document.getElementById('matricula').value = matricula;
    }
    
    // Validar CPF quando completo
    if (cpf.replace(/\D/g, '').length === 11) {
        validarCPF(cpf);
    }
}

function gerarMatricula(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const primeirosDigitos = cpfLimpo.substring(0, 5);
    const anoAtual = new Date().getFullYear();
    return `FEPERJ - ${primeirosDigitos}${anoAtual}`;
}

async function validarCPF(cpf) {
    const feedbackDiv = document.getElementById('cpfFeedback');
    const inputCPF = document.getElementById('cpf');
    
    feedbackDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Verificando CPF...';
    feedbackDiv.className = 'feedback';
    
    // Validar apenas se tem 11 números
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
        feedbackDiv.innerHTML = '❌ CPF deve ter 11 números';
        feedbackDiv.className = 'feedback invalid';
        inputCPF.className = inputCPF.className.replace('valid', '') + ' invalid';
        return false;
    }
    
    // Verificar se CPF já existe (apenas se não estiver editando ou se mudou o CPF)
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/atletas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const cpfExiste = data.data.atletas.some(a => 
                a.cpf === cpf && a.id !== editingId
            );
            
            if (cpfExiste) {
                feedbackDiv.innerHTML = '❌ CPF já cadastrado no sistema';
                feedbackDiv.className = 'feedback invalid';
                inputCPF.className = inputCPF.className.replace('valid', '') + ' invalid';
                return false;
            }
        }
        
        feedbackDiv.innerHTML = '✅ CPF válido e disponível';
        feedbackDiv.className = 'feedback valid';
        inputCPF.className = inputCPF.className.replace('invalid', '') + ' valid';
        return true;
        
    } catch (error) {
        console.error('Erro ao validar CPF:', error);
        feedbackDiv.innerHTML = '⚠️ Erro ao verificar CPF';
        feedbackDiv.className = 'feedback';
        return false;
    }
}

// Função removida - validação simplificada implementada em validarCPF()

// =====================================================
// SUBMIT FORMULÁRIO
// =====================================================

async function handleSubmit(event) {
    event.preventDefault();
    
    // Validar CPF novamente antes de salvar
    const cpf = document.getElementById('cpf').value;
    const cpfValido = await validarCPF(cpf);
    if (!cpfValido) {
        showAlert('CPF inválido ou já cadastrado', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    
    const formData = {
        nome: document.getElementById('nome').value,
        cpf: cpf,
        matricula: document.getElementById('matricula').value,
        sexo: document.getElementById('sexo').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        data_nascimento: document.getElementById('dataNascimento').value || null,
        data_filiacao: document.getElementById('dataFiliacao').value,
        id_equipe: document.getElementById('equipe').value || null,
        id_categoria: document.getElementById('categoria').value || null,
        status: document.getElementById('status').value,
        endereco: document.getElementById('endereco').value,
        observacoes: document.getElementById('observacoes').value
    };
    
    // Se não for admin, forçar equipe do usuário
    if (currentUser.tipo !== 'admin') {
        formData.id_equipe = currentUser.id_equipe;
        formData.status = 'ATIVO'; // Usuário não pode alterar status
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const url = editingId 
            ? `${API_BASE_URL}/api/atletas/${editingId}`
            : `${API_BASE_URL}/api/atletas`;
        const method = editingId ? 'PUT' : 'POST';
        
        console.log('📤 Enviando para:', url);
        console.log('📦 Dados:', formData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📥 Status:', response.status, response.statusText);
        
        // Tentar pegar o texto primeiro para debug
        const responseText = await response.text();
        console.log('📄 Resposta (texto):', responseText);
        
        // Tentar fazer parse do JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Resposta não é JSON válido:', responseText);
            throw new Error('Servidor retornou resposta inválida');
        }
        
        console.log('📊 Resposta (JSON):', data);
        
        if (response.ok && data.success) {
            showAlert(editingId ? 'Atleta atualizado com sucesso!' : 'Atleta cadastrado com sucesso!', 'success');
            closeModal();
            loadData();
        } else {
            throw new Error(data.error || 'Erro ao salvar atleta');
        }
    } catch (error) {
        console.error('Erro ao salvar atleta:', error);
        showAlert('Erro ao salvar: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar';
    }
}

// =====================================================
// EXCLUIR ATLETA
// =====================================================

async function deleteAtleta(id, nome) {
    // Verificar permissão - apenas admin pode excluir
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem excluir atletas', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o atleta "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/atletas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Atleta excluído com sucesso!', 'success');
            loadData();
        } else {
            throw new Error(data.error || 'Erro ao excluir');
        }
    } catch (error) {
        console.error('Erro ao excluir atleta:', error);
        showAlert('Erro ao excluir atleta', 'error');
    }
}

// =====================================================
// SELECT EQUIPES E CATEGORIAS
// =====================================================

function preencherSelectEquipes() {
    const selectEquipe = document.getElementById('equipe');
    const filtroEquipe = document.getElementById('filtroEquipe');
    
    const options = ['<option value="">Selecione uma equipe...</option>'];
    equipes.forEach(equipe => {
        options.push(`<option value="${equipe.id}">${equipe.nome_equipe}</option>`);
    });
    
    selectEquipe.innerHTML = options.join('');
    if (filtroEquipe) {
        filtroEquipe.innerHTML = ['<option value="">Todas as equipes</option>', ...options.slice(1)].join('');
    }
}

function preencherSelectCategorias() {
    const selectCategoria = document.getElementById('categoria');
    
    const options = ['<option value="">Selecione uma categoria...</option>'];
    categorias.forEach(categoria => {
        options.push(`<option value="${categoria.id}">${categoria.nome_categoria}</option>`);
    });
    
    selectCategoria.innerHTML = options.join('');
}

// =====================================================
// DROPDOWN ACTIONS
// =====================================================

function toggleDropdown(id) {
    const dropdown = document.getElementById(`dropdown-content-${id}`);
    
    // Fechar outros dropdowns
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d.id !== `dropdown-content-${id}`) {
            d.classList.remove('active');
        }
    });
    
    dropdown.classList.toggle('active');
}

// Fechar dropdown ao clicar fora
window.onclick = function(event) {
    if (!event.target.matches('.btn-info') && !event.target.matches('.fa-ellipsis-v')) {
        document.querySelectorAll('.dropdown-content').forEach(d => {
            d.classList.remove('active');
        });
    }
    
    // Fechar modal ao clicar fora
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// =====================================================
// DOCUMENTOS
// =====================================================

function openDocumentosModal(id) {
    const atleta = atletas.find(a => a.id === id);
    if (!atleta) return;
    
    // Verificar permissão
    if (currentUser.tipo !== 'admin' && atleta.id_equipe !== currentUser.id_equipe) {
        showAlert('Você só pode acessar documentos de atletas da sua equipe', 'error');
        return;
    }
    
    selectedAtletaId = id;
    document.getElementById('documentosAtletaNome').textContent = atleta.nome;
    document.getElementById('documentosAtletaCPF').textContent = `CPF: ${atleta.cpf} | Matrícula: ${atleta.matricula || 'N/A'}`;
    
    // Atualizar status dos documentos
    updateDocumentosStatus(atleta);
    
    document.getElementById('documentosModal').classList.add('active');
}

function closeDocumentosModal() {
    document.getElementById('documentosModal').classList.remove('active');
    selectedAtletaId = null;
    loadData(); // Recarregar para atualizar status dos documentos
}

async function updateDocumentosStatus(atleta) {
    try {
        // Buscar documentos do atleta via API
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/documentos/atleta/${atleta.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        const documentos = data.data.documentos;
        
        // Foto 3x4
        const foto3x4 = documentos.find(d => d.tipo === 'foto_3x4');
        const foto3x4Status = document.getElementById('foto3x4Status');
        if (foto3x4) {
            foto3x4Status.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="badge badge-success">
                        <i class="fas fa-check-circle mr-1"></i>
                        Enviado
                    </span>
                    <a href="${foto3x4.url}" target="_blank" class="btn-info">
                        <i class="fas fa-eye mr-1"></i>Visualizar
                    </a>
                    <button onclick="baixarDocumento('${atleta.id}', 'foto_3x4', 'foto_3x4.jpg')" class="btn-success">
                        <i class="fas fa-download mr-1"></i>Baixar
                    </button>
                    <button onclick="excluirDocumento('${atleta.id}', 'foto_3x4', 'Foto 3x4')" class="btn-danger">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </div>
            `;
        } else {
            foto3x4Status.innerHTML = '<span class="badge badge-warning"><i class="fas fa-clock mr-1"></i>Pendente</span>';
        }
        
        // Comprovante
        const comprovante = documentos.find(d => d.tipo === 'comprovante_residencia');
        const comprovanteStatus = document.getElementById('comprovanteStatus');
        if (comprovante) {
            comprovanteStatus.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="badge badge-success">
                        <i class="fas fa-check-circle mr-1"></i>
                        Enviado
                    </span>
                    <a href="${comprovante.url}" target="_blank" class="btn-info">
                        <i class="fas fa-eye mr-1"></i>Visualizar
                    </a>
                    <button onclick="baixarDocumento('${atleta.id}', 'comprovante_residencia', 'comprovante.pdf')" class="btn-success">
                        <i class="fas fa-download mr-1"></i>Baixar
                    </button>
                    <button onclick="excluirDocumento('${atleta.id}', 'comprovante_residencia', 'Comprovante de Residência')" class="btn-danger">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </div>
            `;
        } else {
            comprovanteStatus.innerHTML = '<span class="badge badge-warning"><i class="fas fa-clock mr-1"></i>Pendente</span>';
        }
        
        // ADEL
        const adel = documentos.find(d => d.tipo === 'certificado_adel');
        const adelStatus = document.getElementById('adelStatus');
        if (adel) {
            adelStatus.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="badge badge-success">
                        <i class="fas fa-check-circle mr-1"></i>
                        Enviado
                    </span>
                    <a href="${adel.url}" target="_blank" class="btn-info">
                        <i class="fas fa-eye mr-1"></i>Visualizar
                    </a>
                    <button onclick="baixarDocumento('${atleta.id}', 'certificado_adel', 'certificado_adel.pdf')" class="btn-success">
                        <i class="fas fa-download mr-1"></i>Baixar
                    </button>
                    <button onclick="excluirDocumento('${atleta.id}', 'certificado_adel', 'Certificado ADEL')" class="btn-danger">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </div>
            `;
        } else {
            adelStatus.innerHTML = '<span class="badge badge-warning"><i class="fas fa-clock mr-1"></i>Pendente</span>';
        }
        
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        // Se der erro, usar dados locais do atleta
        updateDocumentosStatusLocal(atleta);
    }
}

// Função auxiliar para atualizar status com dados locais
function updateDocumentosStatusLocal(atleta) {
    // Foto 3x4
    const foto3x4Status = document.getElementById('foto3x4Status');
    if (atleta.foto_3x4) {
        foto3x4Status.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="badge badge-success">
                    <i class="fas fa-check-circle mr-1"></i>
                    Enviado
                </span>
                <a href="${atleta.foto_3x4}" target="_blank" class="btn-info">
                    <i class="fas fa-eye mr-1"></i>Visualizar
                </a>
                <button onclick="baixarDocumento('${atleta.id}', 'foto_3x4', 'foto_3x4.jpg')" class="btn-success">
                    <i class="fas fa-download mr-1"></i>Baixar
                </button>
                <button onclick="excluirDocumento('${atleta.id}', 'foto_3x4', 'Foto 3x4')" class="btn-danger">
                    <i class="fas fa-trash mr-1"></i>Excluir
                </button>
            </div>
        `;
    } else {
        foto3x4Status.innerHTML = '<span class="badge badge-warning"><i class="fas fa-clock mr-1"></i>Pendente</span>';
    }
    
    // Comprovante
    const comprovanteStatus = document.getElementById('comprovanteStatus');
    if (atleta.comprovante_residencia) {
        comprovanteStatus.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="badge badge-success">
                    <i class="fas fa-check-circle mr-1"></i>
                    Enviado
                </span>
                <a href="${atleta.comprovante_residencia}" target="_blank" class="btn-info">
                    <i class="fas fa-eye mr-1"></i>Visualizar
                </a>
                <button onclick="baixarDocumento('${atleta.id}', 'comprovante_residencia', 'comprovante.pdf')" class="btn-success">
                    <i class="fas fa-download mr-1"></i>Baixar
                </button>
                <button onclick="excluirDocumento('${atleta.id}', 'comprovante_residencia', 'Comprovante de Residência')" class="btn-danger">
                    <i class="fas fa-trash mr-1"></i>Excluir
                </button>
            </div>
        `;
    } else {
        comprovanteStatus.innerHTML = '<span class="badge badge-warning"><i class="fas fa-clock mr-1"></i>Pendente</span>';
    }
    
    // ADEL
    const adelStatus = document.getElementById('adelStatus');
    if (atleta.certificado_adel) {
        adelStatus.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="badge badge-success">
                    <i class="fas fa-check-circle mr-1"></i>
                    Enviado
                </span>
                <a href="${atleta.certificado_adel}" target="_blank" class="btn-info">
                    <i class="fas fa-eye mr-1"></i>Visualizar
                </a>
                <button onclick="baixarDocumento('${atleta.id}', 'certificado_adel', 'certificado_adel.pdf')" class="btn-success">
                    <i class="fas fa-download mr-1"></i>Baixar
                </button>
                <button onclick="excluirDocumento('${atleta.id}', 'certificado_adel', 'Certificado ADEL')" class="btn-danger">
                    <i class="fas fa-trash mr-1"></i>Excluir
                </button>
            </div>
        `;
    } else {
        adelStatus.innerHTML = '<span class="badge badge-warning"><i class="fas fa-clock mr-1"></i>Pendente</span>';
    }
}

// Função para baixar documento (usa URL assinada do backend)
async function baixarDocumento(atletaId, tipo, nomeArquivo) {
    try {
        showAlert('Preparando download...', 'info');
        
        // Buscar URL assinada do backend
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/documentos/atleta/${atletaId}/${tipo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erro ao obter URL do documento');
        }
        
        // Usar URL assinada (funciona mesmo com bucket privado)
        const url = data.data.url;
        
        console.log('📥 Baixando documento via URL assinada:', url);
        showAlert('Baixando arquivo...', 'info');
        
        // Fazer fetch do arquivo usando a URL assinada
        const fileResponse = await fetch(url);
        
        if (!fileResponse.ok) {
            throw new Error('Erro ao baixar arquivo do servidor');
        }
        
        // Converter para blob
        const blob = await fileResponse.blob();
        
        console.log('📦 Arquivo baixado, tamanho:', blob.size, 'bytes');
        
        // Criar URL do blob e forçar download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nomeArquivo;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Limpar
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        showAlert('Download concluído!', 'success');
        console.log('✅ Download concluído:', nomeArquivo);
        
    } catch (error) {
        console.error('Erro ao baixar documento:', error);
        showAlert('Erro ao baixar: ' + error.message, 'error');
    }
}

// Função para excluir documento
async function excluirDocumento(atletaId, tipo, nomeDocumento) {
    if (!confirm(`Tem certeza que deseja excluir o documento "${nomeDocumento}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/documentos/atleta/${atletaId}/${tipo}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Documento excluído com sucesso!', 'success');
            // Recarregar dados e reabrir modal
            await loadData();
            openDocumentosModal(atletaId);
        } else {
            throw new Error(data.error || 'Erro ao excluir documento');
        }
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        showAlert('Erro ao excluir: ' + error.message, 'error');
    }
}

async function handleFileUpload(tipo, file) {
    if (!file) return;
    
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
        showAlert('Arquivo muito grande. Tamanho máximo: 20MB', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const formData = new FormData();
        formData.append('arquivo', file);
        
        const response = await fetch(`${API_BASE_URL}/api/upload/atleta/${selectedAtletaId}/${tipo}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Documento enviado com sucesso!', 'success');
            // Recarregar dados do atleta
            loadData();
            // Reabrir modal para atualizar status
            setTimeout(() => {
                openDocumentosModal(selectedAtletaId);
            }, 500);
        } else {
            throw new Error(data.error || 'Erro ao enviar documento');
        }
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        showAlert('Erro ao enviar documento: ' + error.message, 'error');
    }
}

// =====================================================
// MODAL DE MODELO DE CARTEIRINHA
// =====================================================

function openModeloModal() {
    document.getElementById('modeloModal').classList.add('active');
    document.getElementById('modeloPdfInput').value = '';
    document.getElementById('modeloSelectedFile').style.display = 'none';
    document.getElementById('btnUploadModelo').disabled = true;
}

function closeModeloModal() {
    document.getElementById('modeloModal').classList.remove('active');
}

// Listener para seleção de arquivo
document.addEventListener('DOMContentLoaded', () => {
    const modeloPdfInput = document.getElementById('modeloPdfInput');
    if (modeloPdfInput) {
        modeloPdfInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (!file) {
                document.getElementById('modeloSelectedFile').style.display = 'none';
                document.getElementById('btnUploadModelo').disabled = true;
                return;
            }
            
            // Validar tipo
            if (file.type !== 'application/pdf') {
                showAlert('Apenas arquivos PDF são aceitos', 'error');
                e.target.value = '';
                return;
            }
            
            // Validar tamanho (10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showAlert('Arquivo muito grande. Tamanho máximo: 10MB', 'error');
                e.target.value = '';
                return;
            }
            
            // Mostrar informações do arquivo
            document.getElementById('modeloFileName').textContent = file.name;
            document.getElementById('modeloFileSize').textContent = formatFileSize(file.size);
            document.getElementById('modeloSelectedFile').style.display = 'block';
            document.getElementById('btnUploadModelo').disabled = false;
        });
    }
});

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadModelo() {
    const fileInput = document.getElementById('modeloPdfInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Selecione um arquivo PDF', 'error');
        return;
    }
    
    try {
        const btnUpload = document.getElementById('btnUploadModelo');
        btnUpload.disabled = true;
        btnUpload.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Importando...';
        
        console.log('📤 Fazendo upload do modelo de carteirinha...');
        
        const formData = new FormData();
        formData.append('arquivo', file);
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/carteirinha/modelo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        console.log('📥 Resposta do servidor:', data);
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao fazer upload');
        }
        
        showAlert('Modelo de carteirinha importado com sucesso!', 'success');
        closeModeloModal();
        
        console.log('✅ Modelo importado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao fazer upload:', error);
        showAlert('Erro ao importar modelo: ' + error.message, 'error');
    } finally {
        const btnUpload = document.getElementById('btnUploadModelo');
        btnUpload.disabled = false;
        btnUpload.innerHTML = '<i class="fas fa-upload mr-2"></i>Importar Modelo';
    }
}

// =====================================================
// GERAR CARTEIRINHA
// =====================================================

async function gerarCarteirinha(id) {
    const atleta = atletas.find(a => a.id === id);
    if (!atleta) return;
    
    // Verificar documentos
    if (!atleta.foto_3x4 || !atleta.comprovante_residencia) {
        showAlert('Atleta deve ter foto 3x4 e comprovante de residência cadastrados', 'error');
        return;
    }
    
    if (!confirm(`Gerar carteirinha de ${atleta.nome}?`)) {
        return;
    }
    
    try {
        showAlert('Gerando carteirinha... Por favor, aguarde.', 'info');
        console.log('🎯 Gerando carteirinha para:', atleta.nome);
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/carteirinha/gerar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                atletaId: id
            })
        });
        
        const data = await response.json();
        
        console.log('📥 Resposta do servidor:', data);
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao gerar carteirinha');
        }
        
        // Converter base64 para blob e fazer download
        const pdfData = data.data.pdf;
        const fileName = data.data.fileName;
        
        console.log('📄 Baixando PDF...');
        
        const byteCharacters = atob(pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        showAlert('Carteirinha gerada com sucesso!', 'success');
        console.log('✅ Carteirinha gerada e baixada');
        
    } catch (error) {
        console.error('❌ Erro ao gerar carteirinha:', error);
        showAlert('Erro ao gerar carteirinha: ' + error.message, 'error');
    }
}

// =====================================================
// EXPORT EXCEL
// =====================================================

function exportarExcel() {
    if (currentUser.tipo !== 'admin') {
        showAlert('Apenas administradores podem exportar dados', 'error');
        return;
    }
    
    try {
        // Preparar dados para Excel
        const dados = atletas.map(atleta => {
            // Extrair nome da equipe (pode ser objeto ou array)
            let equipeNome = '-';
            if (atleta.equipe) {
                if (Array.isArray(atleta.equipe) && atleta.equipe.length > 0) {
                    equipeNome = atleta.equipe[0].nome_equipe || '-';
                } else if (atleta.equipe.nome_equipe) {
                    equipeNome = atleta.equipe.nome_equipe;
                }
            }
            
            // Extrair nome da categoria (pode ser objeto ou array)
            let categoriaNome = '-';
            if (atleta.categoria) {
                if (Array.isArray(atleta.categoria) && atleta.categoria.length > 0) {
                    categoriaNome = atleta.categoria[0].nome_categoria || '-';
                } else if (atleta.categoria.nome_categoria) {
                    categoriaNome = atleta.categoria.nome_categoria;
                }
            }
            
            return {
                'Nome': atleta.nome,
                'CPF': atleta.cpf,
                'Matrícula': atleta.matricula || '',
                'Sexo': atleta.sexo === 'M' ? 'M' : 'F',
                'Email': atleta.email,
                'Telefone': atleta.telefone || '',
                'Data Nascimento': atleta.data_nascimento || '',
                'Data Filiação': atleta.data_filiacao || '',
                'Equipe': equipeNome,
                'Categoria': categoriaNome,
                'Status': atleta.status,
                'Endereço': atleta.endereco || '',
                'Observações': atleta.observacoes || ''
            };
        });
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // Criar worksheet
        const ws = XLSX.utils.json_to_sheet(dados);
        
        // Ajustar largura das colunas
        const colWidths = [
            { wch: 25 }, // Nome
            { wch: 15 }, // CPF
            { wch: 20 }, // Matrícula
            { wch: 10 }, // Sexo
            { wch: 30 }, // Email
            { wch: 15 }, // Telefone
            { wch: 12 }, // Data Nascimento
            { wch: 12 }, // Data Filiação
            { wch: 20 }, // Equipe
            { wch: 20 }, // Categoria
            { wch: 10 }, // Status
            { wch: 30 }, // Endereço
            { wch: 30 }  // Observações
        ];
        ws['!cols'] = colWidths;
        
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Atletas');
        
        // Gerar arquivo Excel
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // Criar blob e fazer download
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `atletas_feperj_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        
        // Limpar URL
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
        
        showAlert(`${atletas.length} atletas exportados para Excel com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        showAlert('Erro ao exportar dados para Excel', 'error');
    }
}

