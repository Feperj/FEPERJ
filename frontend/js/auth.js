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
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userInfo', JSON.stringify(currentUser));
        
        // Mostrar sistema principal
        showMainSystem();
        
        // Atualizar informações do usuário no header
        updateUserInfo();
        
        // Carregar dashboard
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

// Função para criar usuário administrador inicial
async function createInitialAdmin() {
    try {
        console.log('Tentando criar admin em:', `${API_BASE_URL}/setup-admin`);
        
        const response = await fetch(`${API_BASE_URL}/setup-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Setup admin:', result.message);
            return true;
        } else {
            console.error('Erro ao criar admin:', response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Erro ao criar admin:', error);
        return false;
    }
}
            email: 'admin@feperj.com',
            nivel_acesso: 'admin'
        };
        
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminUser)
        });
        
        if (response.ok) {
            console.log('Usuário administrador criado com sucesso');
            return true;
        } else {
            const error = await response.json();
            if (error.detail === 'Usuário já existe') {
                console.log('Usuário administrador já existe');
                return true;
            }
            throw new Error(error.detail);
        }
    } catch (error) {
        console.error('Erro ao criar usuário administrador:', error);
        return false;
    }
}

// Função para verificar se o usuário tem permissão
function hasPermission(permission) {
    if (!currentUser) return false;
    
    // Se for admin, tem todas as permissões
    if (currentUser.nivel_acesso === 'admin') return true;
    
    // Verificar permissões específicas
    switch (permission) {
        case 'create_atleta':
        case 'edit_atleta':
        case 'delete_atleta':
            return ['admin', 'coordenador'].includes(currentUser.nivel_acesso);
        
        case 'create_equipe':
        case 'edit_equipe':
        case 'delete_equipe':
            return ['admin', 'coordenador'].includes(currentUser.nivel_acesso);
        
        case 'create_competicao':
        case 'edit_competicao':
        case 'delete_competicao':
            return ['admin'].includes(currentUser.nivel_acesso);
        
        case 'create_inscricao':
        case 'edit_inscricao':
        case 'delete_inscricao':
            return ['admin', 'coordenador', 'usuario'].includes(currentUser.nivel_acesso);
        
        case 'view_reports':
            return ['admin', 'coordenador'].includes(currentUser.nivel_acesso);
        
        default:
            return false;
    }
}

// Função para mostrar/esconder elementos baseado em permissões
function updateUIByPermissions() {
    // Botões de criação
    const createButtons = [
        { id: 'addAtletaBtn', permission: 'create_atleta' },
        { id: 'addEquipeBtn', permission: 'create_equipe' },
        { id: 'addCompeticaoBtn', permission: 'create_competicao' },
        { id: 'addInscricaoBtn', permission: 'create_inscricao' }
    ];
    
    createButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            if (hasPermission(button.permission)) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        }
    });
    
    // Seção de relatórios
    const relatoriosSection = document.querySelector('[data-section="relatorios"]');
    if (relatoriosSection) {
        if (hasPermission('view_reports')) {
            relatoriosSection.style.display = '';
        } else {
            relatoriosSection.style.display = 'none';
        }
    }
}

// Função para obter informações do usuário atual
function getCurrentUser() {
    return currentUser;
}

// Função para verificar se o token ainda é válido
async function validateToken() {
    if (!authToken) return false;
    
    try {
        const response = await apiRequest('/relatorios/dashboard');
        return true;
    } catch (error) {
        if (error.message.includes('Sessão expirada')) {
            logout();
            return false;
        }
        return true;
    }
}

// Função para renovar token
async function refreshToken() {
    // Implementar renovação de token se necessário
    // Por enquanto, apenas retorna o token atual
    return authToken;
}

// Event listener para verificar token periodicamente
setInterval(async () => {
    if (isAuthenticated()) {
        const isValid = await validateToken();
        if (!isValid) {
            showAlert('Sua sessão expirou. Faça login novamente.', 'warning');
        }
    }
}, 5 * 60 * 1000); // Verificar a cada 5 minutos

// Função para limpar dados de autenticação
function clearAuthData() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
}



// Inicializar autenticação quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    // Tentar criar usuário administrador inicial
    try {
        await createInitialAdmin();
    } catch (error) {
        console.error('Erro ao criar admin inicial:', error);
    }
    
    // Event listener para o formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Verificar se há token salvo
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userInfo');
    
    if (savedToken && savedUser) {
        try {
            authToken = savedToken;
            currentUser = JSON.parse(savedUser);
            
            // Validar token
            const isValid = await validateToken();
            if (isValid) {
                showMainSystem();
                updateUserInfo();
                updateUIByPermissions();
                loadDashboard();
            } else {
                clearAuthData();
                showLoginScreen();
            }
        } catch (error) {
            console.error('Erro ao restaurar sessão:', error);
            clearAuthData();
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
});
