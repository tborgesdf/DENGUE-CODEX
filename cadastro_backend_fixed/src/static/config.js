// Configuração da API
const API_CONFIG = {
    // URL base da API - será atualizada automaticamente para produção
    BASE_URL: window.location.origin,
    
    // Endpoints da API
    ENDPOINTS: {
        LOGIN: '/admin/login',
        DASHBOARD: '/admin/dashboard',
        ADMIN_USERS: '/admin/users',
        REGISTRATIONS: '/admin/registrations',
        REGISTER: '/register',
        HEALTH: '/health'
    }
};

// Função para fazer requisições à API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    // Adicionar token JWT se disponível
    const token = localStorage.getItem('admin_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, finalOptions);
        return response;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

