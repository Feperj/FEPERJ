// Variáveis globais
let currentUser = null;
let currentSection = 'dashboard';
let charts = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadDashboard();
});

// Verificar autenticação
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userType = localStorage.getItem('userType');
    
    if (!token || !username) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = {
        nome: username,
        tipo: userType
    };
    
    // Configurar interface do usuário
    document.getElementById('userName').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
    
    // Mostrar/ocultar itens de admin
    if (userType === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Busca de atletas
    document.getElementById('searchAtleta').addEventListener('input', function() {
        filterAtletas(this.value);
    });
}

// Mostrar seção
function showSection(section) {
    // Ocultar todas as seções
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    
    // Mostrar seção selecionada
    document.getElementById(section + '-section').style.display = 'block';
    
    // Atualizar navegação
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Atualizar título
    const titles = {
        dashboard: 'Dashboard',
        atletas: 'Gestão de Atletas',
        equipes: 'Gestão de Equipes',
        competicoes: 'Gestão de Competições',
        inscricoes: 'Gestão de Inscrições',
        usuarios: 'Gestão de Usuários',
        log: 'Log de Atividades'
    };
    
    document.getElementById('pageTitle').textContent = titles[section];
    currentSection = section;
    
    // Carregar dados da seção
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'atletas':
            loadAtletas();
            break;
        case 'equipes':
            loadEquipes();
            break;
        case 'competicoes':
            loadCompeticoes();
            break;
        case 'inscricoes':
            loadInscricoes();
            break;
        case 'usuarios':
            loadUsuarios();
            break;
        case 'log':
            loadLog();
            break;
    }
}

// Função de logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// Funções de API
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const response = await fetch(`/api/${endpoint}`, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return response.json();
}

// Carregar dashboard
async function loadDashboard() {
    try {
        const data = await apiRequest('dashboard');
        if (!data) return;
        
        // Atualizar estatísticas
        document.getElementById('totalAtletas').textContent = data.totalAtletas;
        document.getElementById('atletasAtivos').textContent = data.atletasAtivos;
        document.getElementById('totalEquipes').textContent = data.totalEquipes;
        document.getElementById('totalCompeticoes').textContent = data.totalCompeticoes;
        
        // Criar gráfico de equipes
        createEquipesChart(data.atletasPorEquipe);
        
        // Criar gráfico de top atletas
        createTopAtletasChart(data.topMasculino, data.topFeminino);
        
    } catch (error) {
        showAlert('Erro ao carregar dashboard', 'danger');
    }
}

// Criar gráfico de equipes
function createEquipesChart(atletasPorEquipe) {
    const ctx = document.getElementById('chartEquipes').getContext('2d');
    
    if (charts.equipes) {
        charts.equipes.destroy();
    }
    
    const labels = Object.keys(atletasPorEquipe);
    const data = Object.values(atletasPorEquipe);
    
    charts.equipes = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Criar gráfico de top atletas
function createTopAtletasChart(topMasculino, topFeminino) {
    const ctx = document.getElementById('chartTopAtletas').getContext('2d');
    
    if (charts.topAtletas) {
        charts.topAtletas.destroy();
    }
    
    const allAtletas = [...topMasculino, ...topFeminino]
        .sort((a, b) => b.maior_total - a.maior_total)
        .slice(0, 10);
    
    const labels = allAtletas.map(a => a.nome);
    const data = allAtletas.map(a => a.maior_total);
    
    charts.topAtletas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Maior Total (kg)',
                data: data,
                backgroundColor: '#667eea',
                borderColor: '#764ba2',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Carregar atletas
async function loadAtletas() {
    try {
        const atletas = await apiRequest('atletas');
        if (!atletas) return;
        
        renderAtletasTable(atletas);
        
    } catch (error) {
        showAlert('Erro ao carregar atletas', 'danger');
    }
}

// Renderizar tabela de atletas
function renderAtletasTable(atletas) {
    const tbody = document.getElementById('atletasTableBody');
    tbody.innerHTML = '';
    
    atletas.forEach(atleta => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${atleta.nome}</td>
            <td>${atleta.cpf}</td>
            <td>${atleta.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
            <td>${atleta.nome_equipe || 'Sem equipe'}</td>
            <td>${atleta.peso ? atleta.peso + ' kg' : '-'}</td>
            <td>${atleta.maior_total ? atleta.maior_total + ' kg' : '-'}</td>
            <td><span class="badge badge-${atleta.status === 'ATIVO' ? 'success' : 'danger'}">${atleta.status}</span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editAtleta(${atleta.id_atleta})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAtleta(${atleta.id_atleta})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filtrar atletas
function filterAtletas(searchTerm) {
    const rows = document.querySelectorAll('#atletasTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const match = text.includes(searchTerm.toLowerCase());
        row.style.display = match ? '' : 'none';
    });
}

// Carregar equipes
async function loadEquipes() {
    try {
        const equipes = await apiRequest('equipes');
        if (!equipes) return;
        
        renderEquipesTable(equipes);
        
    } catch (error) {
        showAlert('Erro ao carregar equipes', 'danger');
    }
}

// Renderizar tabela de equipes
function renderEquipesTable(equipes) {
    const tbody = document.getElementById('equipesTableBody');
    tbody.innerHTML = '';
    
    equipes.forEach(equipe => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${equipe.nome_equipe}</td>
            <td>${equipe.cidade}</td>
            <td>${equipe.tecnico || '-'}</td>
            <td>${equipe.telefone || '-'}</td>
            <td>${equipe.email || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editEquipe(${equipe.id_equipe})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEquipe(${equipe.id_equipe})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar competições
async function loadCompeticoes() {
    try {
        const competicoes = await apiRequest('competicoes');
        if (!competicoes) return;
        
        renderCompeticoesTable(competicoes);
        
    } catch (error) {
        showAlert('Erro ao carregar competições', 'danger');
    }
}

// Renderizar tabela de competições
function renderCompeticoesTable(competicoes) {
    const tbody = document.getElementById('competicoesTableBody');
    tbody.innerHTML = '';
    
    competicoes.forEach(competicao => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${competicao.nome_competicao}</td>
            <td>${formatDate(competicao.data_competicao)}</td>
            <td>${competicao.local || '-'}</td>
            <td>R$ ${competicao.valor_inscricao}</td>
            <td><span class="badge badge-${competicao.status === 'AGENDADA' ? 'warning' : 'success'}">${competicao.status}</span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editCompeticao(${competicao.id_competicao})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCompeticao(${competicao.id_competicao})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar inscrições
async function loadInscricoes() {
    try {
        const inscricoes = await apiRequest('inscricoes');
        if (!inscricoes) return;
        
        renderInscricoesTable(inscricoes);
        
    } catch (error) {
        showAlert('Erro ao carregar inscrições', 'danger');
    }
}

// Renderizar tabela de inscrições
function renderInscricoesTable(inscricoes) {
    const tbody = document.getElementById('inscricoesTableBody');
    tbody.innerHTML = '';
    
    inscricoes.forEach(inscricao => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${inscricao.nome_atleta}</td>
            <td>${inscricao.nome_competicao}</td>
            <td>${formatDate(inscricao.data_inscricao)}</td>
            <td><span class="badge badge-${inscricao.status_inscricao === 'INSCRITO' ? 'success' : 'danger'}">${inscricao.status_inscricao}</span></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="cancelarInscricao(${inscricao.id_inscricao})">❌</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar usuários (admin)
async function loadUsuarios() {
    try {
        const usuarios = await apiRequest('usuarios');
        if (!usuarios) return;
        
        renderUsuariosTable(usuarios);
        
    } catch (error) {
        showAlert('Erro ao carregar usuários', 'danger');
    }
}

// Renderizar tabela de usuários
function renderUsuariosTable(usuarios) {
    const tbody = document.getElementById('usuariosTableBody');
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${usuario.nome}</td>
            <td>${usuario.login}</td>
            <td><span class="badge badge-${usuario.tipo === 'admin' ? 'danger' : 'info'}">${usuario.tipo}</span></td>
            <td>${formatDate(usuario.data_criacao)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editUsuario(${usuario.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUsuario(${usuario.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar log (admin)
async function loadLog() {
    try {
        const log = await apiRequest('log');
        if (!log) return;
        
        renderLogTable(log);
        
    } catch (error) {
        showAlert('Erro ao carregar log', 'danger');
    }
}

// Renderizar tabela de log
function renderLogTable(log) {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';
    
    log.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(entry.data_hora)}</td>
            <td>${entry.usuario}</td>
            <td>${entry.acao}</td>
            <td>${entry.detalhes || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Funções de modal
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <span class="close" onclick="closeModal(this)">&times;</span>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.getElementById('modals').appendChild(modal);
    modal.style.display = 'block';
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal.querySelector('.close'));
        }
    });
}

function closeModal(element) {
    const modal = element.closest('.modal');
    modal.remove();
}

// Modal de adicionar atleta
function showAddAtletaModal() {
    const content = `
        <form id="addAtletaForm">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Nome Completo</label>
                    <input type="text" class="form-control" name="nome" required>
                </div>
                <div class="form-group">
                    <label class="form-label">CPF</label>
                    <input type="text" class="form-control" name="cpf" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Sexo</label>
                    <select class="form-control" name="sexo" required>
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Telefone</label>
                    <input type="text" class="form-control" name="telefone">
                </div>
                <div class="form-group">
                    <label class="form-label">Data de Nascimento</label>
                    <input type="date" class="form-control" name="data_nascimento">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Data de Filiação</label>
                    <input type="date" class="form-control" name="data_filiacao" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Peso (kg)</label>
                    <input type="number" step="0.1" class="form-control" name="peso">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Altura (cm)</label>
                    <input type="number" step="0.1" class="form-control" name="altura">
                </div>
                <div class="form-group">
                    <label class="form-label">Maior Total (kg)</label>
                    <input type="number" step="0.1" class="form-control" name="maior_total">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" name="status">
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                </select>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>
    `;
    
    showModal('Adicionar Atleta', content);
    
    // Event listener para o formulário
    document.getElementById('addAtletaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await apiRequest('atletas', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response) {
                showAlert('Atleta adicionado com sucesso!', 'success');
                closeModal(document.querySelector('.close'));
                loadAtletas();
            }
        } catch (error) {
            showAlert('Erro ao adicionar atleta', 'danger');
        }
    });
}

// Modal de importar CSV
function showImportModal() {
    const content = `
        <form id="importForm" enctype="multipart/form-data">
            <div class="form-group">
                <label class="form-label">Selecionar arquivo CSV</label>
                <input type="file" class="form-control" name="arquivo" accept=".csv" required>
            </div>
            <div class="alert alert-info">
                <strong>Formato esperado:</strong> nome,cpf,sexo,email,telefone,data_nascimento,data_filiacao,peso,altura,maior_total
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button type="submit" class="btn btn-primary">Importar</button>
            </div>
        </form>
    `;
    
    showModal('Importar Atletas CSV', content);
    
    // Event listener para o formulário
    document.getElementById('importForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        try {
            const response = await fetch('/api/importar-csv', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert(data.mensagem, 'success');
                closeModal(document.querySelector('.close'));
                loadAtletas();
            } else {
                showAlert(data.erro, 'danger');
            }
        } catch (error) {
            showAlert('Erro ao importar arquivo', 'danger');
        }
    });
}

// Exportar CSV de atletas
async function exportAtletasCSV() {
    try {
        const response = await fetch('/api/exportar-atletas-csv', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'atletas_feperj.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            showAlert('Erro ao exportar CSV', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao exportar CSV', 'danger');
    }
}

// Funções utilitárias
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
}

function showAlert(message, type) {
    const alertsContainer = document.getElementById('alerts');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertsContainer.appendChild(alert);
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Funções de edição e exclusão (serão implementadas conforme necessário)
function editAtleta(id) {
    showAlert('Funcionalidade de edição será implementada', 'info');
}

function deleteAtleta(id) {
    if (confirm('Tem certeza que deseja excluir este atleta?')) {
        apiRequest(`atletas/${id}`, { method: 'DELETE' })
            .then(() => {
                showAlert('Atleta excluído com sucesso!', 'success');
                loadAtletas();
            })
            .catch(() => {
                showAlert('Erro ao excluir atleta', 'danger');
            });
    }
}

function editEquipe(id) {
    showAlert('Funcionalidade de edição será implementada', 'info');
}

function deleteEquipe(id) {
    if (confirm('Tem certeza que deseja excluir esta equipe?')) {
        apiRequest(`equipes/${id}`, { method: 'DELETE' })
            .then(() => {
                showAlert('Equipe excluída com sucesso!', 'success');
                loadEquipes();
            })
            .catch(() => {
                showAlert('Erro ao excluir equipe', 'danger');
            });
    }
}

function editCompeticao(id) {
    showAlert('Funcionalidade de edição será implementada', 'info');
}

function deleteCompeticao(id) {
    if (confirm('Tem certeza que deseja excluir esta competição?')) {
        apiRequest(`competicoes/${id}`, { method: 'DELETE' })
            .then(() => {
                showAlert('Competição excluída com sucesso!', 'success');
                loadCompeticoes();
            })
            .catch(() => {
                showAlert('Erro ao excluir competição', 'danger');
            });
    }
}

function cancelarInscricao(id) {
    if (confirm('Tem certeza que deseja cancelar esta inscrição?')) {
        showAlert('Funcionalidade de cancelamento será implementada', 'info');
    }
}

function editUsuario(id) {
    showAlert('Funcionalidade de edição será implementada', 'info');
}

function deleteUsuario(id) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        showAlert('Funcionalidade de exclusão será implementada', 'info');
    }
}

function limparLog() {
    if (confirm('Tem certeza que deseja limpar todo o log de atividades?')) {
        showAlert('Funcionalidade de limpeza será implementada', 'info');
    }
}

// Funções de modal para outras entidades (serão implementadas conforme necessário)
function showAddEquipeModal() {
    showAlert('Modal de adicionar equipe será implementado', 'info');
}

function showAddCompeticaoModal() {
    showAlert('Modal de adicionar competição será implementado', 'info');
}

function showAddInscricaoModal() {
    showAlert('Modal de adicionar inscrição será implementado', 'info');
}

function showAddUsuarioModal() {
    showAlert('Modal de adicionar usuário será implementado', 'info');
}
