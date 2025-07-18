document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const errorMessage = document.getElementById('errorMessage');
    
    // Limpar token antigo para evitar problemas
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }
    
    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    
    async function performLogin(username, password) {
        try {
            loginButton.disabled = true;
            loginButton.textContent = 'Entrando...';
            hideError();
            
            console.log('Fazendo login com:', { username, password: '***' });
            
            const response = await apiRequest('LOGIN', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            console.log('Resposta do login:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Login bem-sucedido, dados recebidos:', data);
                
                // Armazenar token e dados do admin
                localStorage.setItem('admin_token', data.access_token);
                localStorage.setItem('admin_data', JSON.stringify(data.admin));
                
                console.log('Token salvo no localStorage:', data.access_token.substring(0, 50) + '...');
                
                // Redirecionar para dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                const error = await response.json();
                console.error('Erro no login:', error);
                showError(error.error || 'Erro ao fazer login');
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            showError('Erro de conexão. Tente novamente.');
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    }
    
    // Event listener para o formulário
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!username || !password) {
                showError('Por favor, preencha todos os campos');
                return;
            }
            
            performLogin(username, password);
        });
    }
    
    // Event listener para o botão de login
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!username || !password) {
                showError('Por favor, preencha todos os campos');
                return;
            }
            
            performLogin(username, password);
        });
    }
    
    // Limpar erro quando usuário digita
    [usernameInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', hideError);
        }
    });
});

