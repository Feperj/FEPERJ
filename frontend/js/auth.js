// Gerenciamento de autenticação

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // Limpar erro anterior
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
    
    // Validação básica
    if (!username || !password) {
        showLoginError('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Entrando...';
        submitBtn.disabled = true;
        
        // Fazer requisição de login
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        console.log('Tentando login para:', API_BASE_URL);
        console.log('Username:', username);
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Credenciais inválidas');
        }
        
        const data = await response.json();
        
        // Salvar token e informações do usuário
        authToken = data.access_token;
        currentUser = data.usuario;
        
        console.log('Token salvo:', authToken);
        console.log('Usuário salvo:', currentUser);
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userInfo', JSON.stringify(currentUser));
        
        console.log('Dados salvos no localStorage');
        
        // Mostrar sistema principal
        console.log('Chamando showMainSystem()...');
        showMainSystem();
        
        // Atualizar informações do usuário no header
        console.log('Chamando updateUserInfo()...');
        updateUserInfo();
        
        // Carregar dashboard
        console.log('Chamando loadDashboard()...');
        loadDashboard();
        
        showAlert('Login realizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
        // Restaurar botão
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function updateUserInfo() {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && currentUser) {
        userInfoElement.textContent = `Olá, ${currentUser.nome}`;
    }
}

// Função para mostrar o sistema principal após login
function showMainSystem() {
    console.log('showMainSystem() chamada');
    
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    console.log('loginScreen:', loginScreen);
    console.log('mainSystem:', mainSystem);
    
    if (loginScreen && mainSystem) {
        console.log('Escondendo loginScreen e mostrando mainSystem');
        loginScreen.classList.add('hidden');
        mainSystem.classList.remove('hidden');
        
        // Forçar reflow para garantir que a transição funcione
        mainSystem.offsetHeight;
        
        console.log('Transição concluída');
    } else {
        console.error('Elementos não encontrados:', { loginScreen, mainSystem });
    }
}

// Função para fazer logout
function logout() {
    // Limpar dados de autenticação
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Mostrar tela de login
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    if (loginScreen && mainSystem) {
        mainSystem.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
    
    // Limpar formulário
    document.getElementById('loginForm').reset();
    
    showAlert('Logout realizado com sucesso!', 'info');
}

// Função para verificar se usuário está logado
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
        try {
            authToken = token;
            currentUser = JSON.parse(userInfo);
            
            // Verificar se o token ainda é válido fazendo uma requisição
            apiRequest('/relatorios/dashboard')
                .then(() => {
                    console.log('Token válido, mostrando sistema');
                    showMainSystem();
                    updateUserInfo();
                    loadDashboard();
                })
                .catch(() => {
                    console.log('Token inválido, fazendo logout');
                    logout();
                });
        } catch (error) {
            console.error('Erro ao restaurar sessão:', error);
            logout();
        }
    }
}

// Função para criar usuário administrador inicial
async function createInitialAdmin() {
    try {
        console.log('Tentando criar admin em:', `${API_BASE_URL}/setup-admin`);
        
        const response = await fetch(`${API_BASE_URL}/setup-admin`, {
            method: 'POST'
        });
        
        const result = await response.json();
        console.log('Resultado da criação do admin:', result);
        
        return result;
    } catch (error) {
        console.error('Erro ao criar admin:', error);
        return { message: 'Erro ao criar admin' };
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando autenticação...');
    
    // Verificar status de autenticação
    checkAuthStatus();
    
    // Criar admin inicial se necessário
    createInitialAdmin();
    
    // Event listener para formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Event listener para logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    console.log('Autenticação inicializada');
});
