// Verificar se o token ainda é válido
function isTokenValid() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        return false;
    }
    
    try {
        // Decodificar o payload do JWT (sem verificar assinatura)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Verificar se o token não expirou
        if (payload.exp && payload.exp < currentTime) {
            console.log('Token expirado localmente');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se está logado e se o token é válido
    if (!isTokenValid()) {
        console.log('Token inválido ou expirado, redirecionando para login');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
        window.location.href = '/admin-login.html';
        return;
    }

    // Carregar dados do dashboard
    loadDashboardData();
    loadRegistrations();
    
    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('manageUsersBtn').addEventListener('click', showUserManagement);
    document.getElementById('viewRegistrationsBtn').addEventListener('click', showRegistrations);
    
    // Event listeners para busca
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    
    // Busca ao pressionar Enter nos campos
    document.getElementById('searchCpf').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('searchPhone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('searchEmail').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('searchAgent').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // Atualizar dados a cada 30 segundos
    setInterval(loadDashboardData, 30000);
});

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            console.error('Token não encontrado');
            window.location.href = '/admin-login.html';
            return;
        }
        
        console.log('Fazendo requisição para:', `${API_CONFIG.BASE_URL}/admin/dashboard`);
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/dashboard`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Status da resposta dashboard:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Tentar obter detalhes do erro antes de redirecionar
                try {
                    const errorData = await response.json();
                    console.error('Erro 401 detalhado:', errorData);
                    
                    // Se for erro de token expirado, tentar renovar
                    if (errorData.code === 'TOKEN_EXPIRED') {
                        console.log('Token expirado, tentando renovar...');
                        // Por enquanto, redirecionar para login
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_data');
                        window.location.href = '/admin-login.html';
                        return;
                    }
                    
                    // Se for token inválido ou ausente, redirecionar
                    if (errorData.code === 'TOKEN_INVALID' || errorData.code === 'TOKEN_MISSING') {
                        console.error('Token inválido ou ausente, redirecionando para login');
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_data');
                        window.location.href = '/admin-login.html';
                        return;
                    }
                } catch (e) {
                    console.error('Erro ao processar resposta 401:', e);
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_data');
                    window.location.href = '/admin-login.html';
                    return;
                }
            }
            
            // Tentar obter detalhes do erro
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.log('Não foi possível obter detalhes do erro');
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Dados do dashboard recebidos:', data);
        
        updateDashboardMetrics(data);
        updateWeatherInfo(data.clima);
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Exibir erro na interface
        const errorElement = document.getElementById('dashboard-error');
        if (errorElement) {
            errorElement.textContent = `Erro ao carregar dashboard: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }
}

async function loadRegistrations(filters = {}) {
    try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            console.error('Token não encontrado');
            window.location.href = '/admin-login.html';
            return;
        }
        
        // Construir URL com filtros
        const url = new URL(`${API_CONFIG.BASE_URL}/admin/registrations`);
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                url.searchParams.append(key, filters[key]);
            }
        });
        
        console.log('Fazendo requisição para:', url.toString());
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Tentar obter detalhes do erro antes de redirecionar
                try {
                    const errorData = await response.json();
                    console.error('Erro 401 detalhado (registrations):', errorData);
                    
                    // Se for erro de token expirado, tentar renovar
                    if (errorData.code === 'TOKEN_EXPIRED') {
                        console.log('Token expirado, tentando renovar...');
                        // Por enquanto, redirecionar para login
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_data');
                        window.location.href = '/admin-login.html';
                        return;
                    }
                    
                    // Se for token inválido ou ausente, redirecionar
                    if (errorData.code === 'TOKEN_INVALID' || errorData.code === 'TOKEN_MISSING') {
                        console.error('Token inválido ou ausente, redirecionando para login');
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_data');
                        window.location.href = '/admin-login.html';
                        return;
                    }
                } catch (e) {
                    console.error('Erro ao processar resposta 401:', e);
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_data');
                    window.location.href = '/admin-login.html';
                    return;
                }
            }
            
            // Tentar obter detalhes do erro
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.log('Não foi possível obter detalhes do erro');
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        // Verificar se a resposta tem a nova estrutura
        const registrations = data.registrations || data;
        const total = data.total || registrations.length;
        const filtersApplied = data.filters_applied || {};
        
        displayRegistrations(registrations, total, filtersApplied);
        
    } catch (error) {
        console.error('Erro ao carregar registrations:', error);
        displayRegistrations([], 0, {});
    }
}

// Função para realizar busca
async function performSearch() {
    const filters = {
        cpf: document.getElementById('searchCpf').value.trim(),
        phone: document.getElementById('searchPhone').value.trim(),
        email: document.getElementById('searchEmail').value.trim(),
        date: document.getElementById('searchDate').value,
        time: document.getElementById('searchTime').value,
        status: document.getElementById('searchStatus').value,
        agent: document.getElementById('searchAgent').value.trim()
    };
    
    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
        if (!filters[key]) {
            delete filters[key];
        }
    });
    
    console.log('Realizando busca com filtros:', filters);
    await loadRegistrations(filters);
}

// Função para limpar busca
function clearSearch() {
    document.getElementById('searchCpf').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchEmail').value = '';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchTime').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchAgent').value = '';
    
    // Ocultar resultados da busca
    document.getElementById('searchResults').classList.add('hidden');
    
    // Recarregar todos os registros
    loadRegistrations();
}

function updateDashboardMetrics(data) {
    // Atualizar métricas principais
    document.getElementById('totalCadastros').textContent = data.total_cadastros || 0;
    document.getElementById('cadastrosHoje').textContent = data.cadastros_hoje || 0;
    document.getElementById('casosAtendidos').textContent = data.casos_atendidos || 0;
    document.getElementById('casosAnalise').textContent = data.casos_pendentes || 0;
    document.getElementById('agendamentosHoje').textContent = data.agendamentos_hoje || 0;
}

function updateWeatherInfo(clima) {
    if (clima) {
        document.getElementById('weatherInfo').innerHTML = `
            <div class="weather-card">
                <h4>${clima.cidade}</h4>
                <p class="temperature">${clima.temperatura}</p>
                <p class="condition">${clima.condicao}</p>
            </div>
        `;
    }
}

function displayRegistrations(registrations, total, filtersApplied) {
    const tableBody = document.getElementById('registrationsTable');
    
    // Mostrar resultados da busca se houver filtros aplicados
    if (Object.keys(filtersApplied).length > 0) {
        const searchResults = document.getElementById('searchResults');
        const searchCount = document.getElementById('searchCount');
        const searchFilters = document.getElementById('searchFilters');
        
        searchCount.textContent = total;
        searchFilters.textContent = `Filtros: ${Object.keys(filtersApplied).join(', ')}`;
        searchResults.classList.remove('hidden');
    } else {
        document.getElementById('searchResults').classList.add('hidden');
    }
    
    if (!registrations || registrations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="px-6 py-4 text-center text-gray-500">
                    Nenhum cadastro encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = registrations.map(reg => {
        const statusClass = getStatusClass(reg.status);
        const statusText = getStatusText(reg.status);
        const formattedDate = formatDate(reg.registration_date || reg.created_at);
        const formattedTime = reg.registration_time ? reg.registration_time.substring(0, 5) : 'N/A';
        const agentInfo = reg.agent_name ? `${reg.agent_name} (${reg.agent_id || 'N/A'})` : 'Sistema';
        const uuidShort = reg.registration_uuid ? reg.registration_uuid.substring(0, 8) + '...' : 'N/A';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${reg.id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title="${reg.registration_uuid || 'N/A'}">
                    ${uuidShort}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${reg.cpf || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${reg.phone || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${reg.email || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formattedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formattedTime}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${agentInfo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewRegistrationDetails(${reg.id})" 
                            class="text-blue-600 hover:text-blue-900 mr-2">
                        👁️ Ver
                    </button>
                    <button onclick="downloadRegistration(${reg.id})" 
                            class="text-green-600 hover:text-green-900">
                        📥 PDF
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'recebido': return 'status-recebido';
        case 'em_analise': return 'status-analise';
        case 'visita_marcada': return 'status-visita';
        case 'concluido': return 'status-concluido';
        default: return 'status-recebido';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'recebido': return 'RECEBIDO';
        case 'em_analise': return 'EM ANÁLISE';
        case 'visita_marcada': return 'VISITA MARCADA';
        case 'concluido': return 'PROCESSO CONCLUÍDO';
        default: return 'RECEBIDO';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
}

function viewRegistrationDetails(id) {
    // Buscar dados completos do cadastro
    const token = localStorage.getItem('admin_token');
    fetch(`${API_CONFIG.BASE_URL}/admin/registrations`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(registrations => {
        const registration = registrations.find(reg => reg.id === id);
        if (registration) {
            showRegistrationModal(registration);
        }
    })
    .catch(error => {
        console.error('Erro ao buscar detalhes:', error);
        alert('Erro ao carregar detalhes do cadastro');
    });
}

function showRegistrationModal(registration) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';

    // Fotos e localizações
    let photos = [];
    let photoLocations = [];
    let relatoriosGemini = [];
    
    try {
        photos = JSON.parse(registration.photos || '[]');
    } catch (e) { 
        console.error('Erro ao parsear fotos:', e);
        photos = []; 
    }
    
    try {
        photoLocations = JSON.parse(registration.photo_locations || '[]');
    } catch (e) { 
        console.error('Erro ao parsear localizações:', e);
        photoLocations = []; 
    }
    
    try {
        relatoriosGemini = JSON.parse(registration.relatoriosGemini || '[]');
    } catch (e) { 
        console.error('Erro ao parsear relatórios Gemini:', e);
        relatoriosGemini = []; 
    }
    
    console.log('Dados do cadastro:', {
        photos: photos,
        photoLocations: photoLocations,
        relatoriosGemini: relatoriosGemini
    });
    
    // Parse device_info para exibir de forma detalhada
    let deviceInfoObj = {};
    try {
        deviceInfoObj = typeof registration.device_info === 'string' ? JSON.parse(registration.device_info) : (registration.device_info || {});
    } catch (e) { deviceInfoObj = {}; }
    // Parse photo_locations para exibir detalhes de cada foto
    let photoLocationsArr = [];
    try {
        photoLocationsArr = Array.isArray(photoLocations) ? photoLocations : JSON.parse(photoLocations || '[]');
    } catch (e) { photoLocationsArr = []; }
    // Metadados do relatório
    const now = new Date();
    // Cabeçalho do relatório
    let headerHtml = `
        <div class="text-center mb-6">
            <h2 class="text-xl font-bold">Relatório Fotográfico de Serviço</h2>
            <div class="text-gray-600 text-sm">(${now.toLocaleDateString('pt-BR')})</div>
        </div>
    `;
    // Empresa responsável (dados fictícios ou do sistema)
    let empresaHtml = `
        <div class="mb-4">
            <div class="font-bold bg-gray-100 px-2 py-1 border-b">Empresa responsável</div>
            <table class="w-full text-sm border">
                <tr><td class="font-semibold w-1/4">Nome</td><td>Produtirio</td><td class="font-semibold w-1/4">Telefone fixo</td><td>(11) 11111-1111</td></tr>
                <tr><td class="font-semibold">CPF / CNPJ</td><td>00000000000000</td><td class="font-semibold">Endereço</td><td>Av. Paulista - Bela Vista, São Paulo - State of São Paulo, Brazil</td></tr>
            </table>
        </div>
    `;
    // Cliente (dados do usuário)
    let clienteHtml = `
        <div class="mb-4">
            <div class="font-bold bg-gray-100 px-2 py-1 border-b">Cliente</div>
            <table class="w-full text-sm border">
                <tr><td class="font-semibold w-1/4">Nome</td><td>Industria</td><td class="font-semibold w-1/4">Razão social</td><td>Industria LTDA</td></tr>
                <tr><td class="font-semibold">CPF / CNPJ</td><td>${registration.cpf ? registration.cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.***.***-**') : 'N/A'}</td><td class="font-semibold">Endereço</td><td>Av. Paulista - Bela Vista, São Paulo - State of São Paulo, Brazil</td></tr>
            </table>
        </div>
    `;
    // URL de abertura de chamado (exemplo)
    let urlChamadoHtml = `
        <div class="mb-4">
            <div class="font-bold bg-gray-100 px-2 py-1 border-b">URL de abertura de chamados</div>
            <div class="text-blue-700 underline text-sm px-2 py-1"><a href="#" target="_blank">Clique aqui para abertura de chamado</a></div>
        </div>
    `;
    // Local (dados do cadastro)
    let localHtml = `
        <div class="mb-4">
            <div class="font-bold bg-gray-100 px-2 py-1 border-b">Local</div>
            <table class="w-full text-sm border">
                <tr><td class="font-semibold w-1/4">Nome</td><td>Parque Industrial II</td><td class="font-semibold w-1/4">Endereço</td><td>Av. Paulista - Bela Vista, São Paulo - State of São Paulo, Brazil</td></tr>
            </table>
        </div>
    `;
    // Informações do serviço (datas, tempos)
    let infoServicoHtml = `
        <div class="mb-4">
            <div class="font-bold bg-gray-100 px-2 py-1 border-b">Informações do serviço</div>
            <table class="w-full text-sm border">
                <tr><td class="font-semibold w-1/4">Horário planejado</td><td>${formatDate(registration.created_at)}</td><td class="font-semibold w-1/4">Horário realizado</td><td>${formatDate(registration.created_at)}</td></tr>
                <tr><td class="font-semibold">Tempo de execução</td><td>3 minutos e 31 segundos</td><td class="font-semibold">Tempo de início do atendimento</td><td>1 dia, 17 horas, 59 minutos e 8 segundos</td></tr>
            </table>
        </div>
    `;
    // Início do trabalho (localização GPS)
    let inicioTrabalhoHtml = `
        <div class="mb-4">
            <div class="font-bold bg-gray-100 px-2 py-1 border-b">Início do Trabalho</div>
            <table class="w-full text-sm border">
                <tr><td class="font-semibold w-1/4">Localização GPS</td><td>${registration.latitude || 'N/A'}, ${registration.longitude || 'N/A'}</td></tr>
            </table>
        </div>
    `;
    // 1. Status do Cadastro (agora item 1)
    let statusHtml = `
        <h4 class="font-bold text-gray-900 mb-2 mt-4">1. Status do Cadastro</h4>
        <table class="w-full text-sm border mb-4">
            <tr>
                <td class="font-semibold w-1/4">Status</td>
                <td><span class="status-badge ${getStatusClass(registration.status)}">${getStatusText(registration.status)}</span></td>
            </tr>
            <tr style="white-space:nowrap;">
                <td class="font-semibold w-1/4">Data/Hora do Cadastro</td>
                <td>${formatDate(registration.created_at)}</td>
            </tr>
        </table>
    `;
    // 2. Dados do Usuário
    let userHtml = `
        <h4 class="font-bold text-gray-900 mb-2 mt-4">2. Dados do Usuário</h4>
        <table class="w-full text-sm border mb-4">
            <tr><td class="font-semibold w-1/4">CPF</td><td>${registration.cpf || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Telefone</td><td>${registration.phone || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Email</td><td>${registration.email || 'N/A'}</td></tr>
        </table>
    `;
    // 3. Localização do Cadastro
    let locHtml = `
        <h4 class="font-bold text-gray-900 mb-2 mt-4">3. Localização do Cadastro</h4>
        <table class="w-full text-sm border mb-4">
            <tr>
                <td class="font-semibold w-1/4">Coordenadas</td>
                <td>${registration.latitude || 'N/A'}, ${registration.longitude || 'N/A'}
                    ${(registration.latitude && registration.longitude && !isNaN(Number(registration.latitude)) && !isNaN(Number(registration.longitude))) ? `<a href="https://maps.google.com/?q=${registration.latitude},${registration.longitude}" target="_blank" class="ml-2 inline-block bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">Ver no mapa</a>` : ''}
                </td>
            </tr>
        </table>
    `;
    // 4. Informações do Dispositivo
    let deviceHtml = `
        <h4 class="font-bold text-gray-900 mb-2 mt-4">4. Informações do Dispositivo</h4>
        <table class="w-full text-sm border mb-4">
            <tr><td class="font-semibold w-1/4">User Agent</td><td>${deviceInfoObj.userAgent || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Plataforma</td><td>${deviceInfoObj.platform || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Sistema Operacional</td><td>${deviceInfoObj.os || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Operadora</td><td>${deviceInfoObj.carrier || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Idioma</td><td>${deviceInfoObj.language || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Tipo de Conexão</td><td>${deviceInfoObj.connectionType || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Conexão Efetiva</td><td>${deviceInfoObj.effectiveConnectionType || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Timestamp</td><td>${deviceInfoObj.timestamp || 'N/A'}</td></tr>
        </table>
    `;
    // 5. Dados de Rede
    let networkHtml = `
        <h4 class="font-bold text-gray-900 mb-2 mt-4">5. Dados de Rede</h4>
        <table class="w-full text-sm border mb-4">
            <tr><td class="font-semibold w-1/4">IP</td><td>${deviceInfoObj.ip || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Cidade</td><td>${deviceInfoObj.ip_location && deviceInfoObj.ip_location.city || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Estado/UF</td><td>${deviceInfoObj.ip_location && deviceInfoObj.ip_location.region || 'N/A'}</td></tr>
            <tr><td class="font-semibold">País</td><td>${deviceInfoObj.ip_location && deviceInfoObj.ip_location.country || 'N/A'}</td></tr>
            <tr><td class="font-semibold">Status IP</td><td>${deviceInfoObj.ip_location && deviceInfoObj.ip_location.status || 'N/A'}</td></tr>
        </table>
    `;
    // 6. Fotos Capturadas (botão ver no mapa só se houver coordenadas válidas)
    let photosSectionHtml = '';
    if (photos.length > 0) {
        photosSectionHtml = `<h4 class="font-bold text-gray-900 mb-2 mt-4">6. Fotos Capturadas</h4><div class="flex flex-wrap gap-2 mb-4">`;
        photos.forEach((photo, idx) => {
            let mapBtn = '';
            const loc = photoLocationsArr[idx];
            if (loc && loc.latitude && loc.longitude && !isNaN(Number(loc.latitude)) && !isNaN(Number(loc.longitude))) {
                mapBtn = `<a href="https://maps.google.com/?q=${loc.latitude},${loc.longitude}" target="_blank" class="mb-1 inline-block bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">Ver no mapa</a>`;
            }
            photosSectionHtml += `<div class="flex flex-col items-center">${mapBtn ? mapBtn + '<br/>' : ''}<button onclick="verRelatorioCompleto('${registration.id}', ${idx}, '${photo.replace(/'/g, '\'')}', null, null, '', '')\" class="mt-1 bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600">Ver Relatório</button><img src="${photo}" alt="Foto ${idx+1}" class="rounded shadow w-24 h-24 object-cover mt-1"></div>`;
        });
        photosSectionHtml += '</div>';
    }
    // 7. Localização de Cada Foto
    let photoLocHtml = '';
    // if (photoLocationsArr.length > 0) {
    //     photoLocHtml = `<h4 class="font-bold text-gray-900 mb-2 mt-4">7. Localização de Cada Foto</h4><table class="w-full text-sm border mb-4"><tr><th>Foto</th><th>Latitude</th><th>Longitude</th><th>Data/Hora</th></tr>`;
    //     photoLocationsArr.forEach((loc, idx) => {
    //         if (loc && typeof loc === 'object') {
    //             photoLocHtml += `<tr><td>${idx+1}</td><td>${loc.latitude || 'N/A'}</td><td>${loc.longitude || 'N/A'}</td><td>${loc.timestamp || 'N/A'}</td></tr>`;
    //         }
    //     });
    //     photoLocHtml += '</table>';
    // }
    // Montar HTML final
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 bg-white shadow overflow-hidden sm:rounded-md w-11/12 md:w-3/4 lg:w-1/2">
            <h2 class="text-xl font-bold text-center mb-4">RELATÓRIO FOTOGRÁFICO FEITO PELO USUÁRIO</h2>
            ${statusHtml}
            ${userHtml}
            ${locHtml}
            ${deviceHtml}
            ${networkHtml}
            ${photosSectionHtml}
            <!-- ${photoLocHtml} -->
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="closeModal()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Função para fechar modal
    window.closeModal = function() {
        document.body.removeChild(modal);
        delete window.closeModal;
        delete window.ampliarFoto;
    };
    // Fechar ao clicar fora do modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.closeModal();
        }
    });
    // Função para ampliar foto
    window.ampliarFoto = function(base64, idx) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="relative">
                <img src="${base64}" alt="Foto Ampliada ${idx}" class="max-w-full max-h-[80vh] rounded shadow-2xl border-4 border-white">
                <button onclick="document.body.removeChild(this.parentNode.parentNode)" class="absolute top-2 right-2 bg-white text-black rounded-full p-2 shadow hover:bg-gray-200">&times;</button>
            </div>
        `;
        document.body.appendChild(overlay);
    };
    // Função para gerar relatório Gemini (placeholder)
    window.gerarRelatorioGemini = async function(regId, idx) {
        const textarea = document.getElementById(`relatorio-foto-${idx}`);
        const resultadoDiv = document.getElementById(`relatorio-foto-${idx}-resultado`);
        resultadoDiv.textContent = 'Gerando relatório com IA...';
        const prompt = textarea.value || 'Analise a imagem e gere um relatório detalhado.';
        // Pega a foto base64 e contexto
        const photoBase64 = photos[idx] || '';
        // Monta o payload para Gemini
        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: 'image/jpeg', data: photoBase64.replace(/^data:image\/(png|jpeg);base64,/, '') } }
                    ]
                }
            ]
        };
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDcAc7L9WMPIjVZK6eR2aQtW-KnQUdiEoI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('Erro na API Gemini: ' + response.status);
            }
            const data = await response.json();
            // Extrai o texto gerado
            const resultText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text
                ? data.candidates[0].content.parts[0].text
                : 'Não foi possível gerar o relatório.';
            resultadoDiv.textContent = resultText;
        } catch (err) {
            resultadoDiv.textContent = 'Erro ao gerar relatório: ' + err.message;
        }
    };
    
    // Função para abrir relatório completo em nova janela
    window.verRelatorioCompleto = function(regId, idx, photoData, lat, lng, date, time) {
        // Buscar relatórios Gemini para esta foto
        const relatorios = relatoriosGemini[idx] || [];
        
        // Separar análises de qualidade e técnica
        const qualityAnalysis = relatorios.filter(r => r.type === 'quality' || !r.type);
        const technicalAnalysis = relatorios.filter(r => r.type === 'technical');
        
        // Se não há type definido, assumir que os primeiros 5 são qualidade
        let finalQualityAnalysis = qualityAnalysis;
        let finalTechnicalAnalysis = technicalAnalysis;
        
        if (qualityAnalysis.length === 0 && technicalAnalysis.length === 0) {
            // Fallback para dados antigos
            finalQualityAnalysis = relatorios.slice(0, 5);
            finalTechnicalAnalysis = relatorios.slice(5);
        }
        
        // Criar HTML do relatório
        const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise - Foto ${idx + 1}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDcAc7L9WMPIjVZK6eR2aQtW-KnQUdiEoI&libraries=places"></script>
    <style>
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 0 0 20px 20px;
            margin-bottom: 2rem;
        }
        .report-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        .map-container {
            height: 400px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .photo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .photo-container img {
            max-width: 100%;
            max-height: 400px;
            border-radius: 15px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .report-text {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 15px;
            border-left: 5px solid #667eea;
            line-height: 1.8;
            font-size: 1.1rem;
        }
        .report-text h3 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .report-text p {
            margin-bottom: 1rem;
            color: #4a5568;
        }
        .report-text strong {
            color: #2d3748;
        }
        .timestamp {
            background: #e2e8f0;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            text-align: center;
        }
        .timestamp h4 {
            color: #2d3748;
            margin: 0;
            font-size: 1.2rem;
        }
        .timestamp p {
            color: #4a5568;
            margin: 0.5rem 0 0 0;
        }
        .quality-section {
            background: #f0fff4;
            border-left: 5px solid #48bb78;
            margin-bottom: 2rem;
        }
        .technical-section {
            background: #fef5e7;
            border-left: 5px solid #ed8936;
        }
        .analysis-item {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            background: white;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .analysis-item h4 {
            color: #667eea;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        .analysis-item p {
            margin: 0;
            line-height: 1.7;
            color: #2d3748;
        }
        @media (max-width: 768px) {
            .report-content {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="report-container">
        <div class="report-header">
            <h1 class="text-3xl font-bold mb-2">📋 Relatório de Análise Entomológica</h1>
            <p class="text-xl opacity-90">Inspeção de Aedes aegypti - Foto ${idx + 1}</p>
        </div>
        
        <div class="timestamp">
            <h4>📅 Informações da Captura</h4>
            <p><strong>Data:</strong> ${date} | <strong>Hora:</strong> ${time}</p>
            <p><strong>ID do Registro:</strong> ${regId} | <strong>Foto:</strong> ${idx + 1}</p>
        </div>
        
        <div class="report-content">
            <div class="map-container" id="map"></div>
            <div class="photo-container">
                <img src="${photoData}" alt="Foto ${idx + 1}" />
                <p class="text-sm text-gray-600 mt-2">Foto capturada em alta resolução</p>
            </div>
        </div>
        
        <div class="report-text">
            <div class="quality-section">
                <h3>🔍 Primeira Análise: Qualidade da Imagem</h3>
                <div class="analysis-item">
                    <p style="font-size:1.2rem;font-weight:bold;">${finalQualityAnalysis[0] && finalQualityAnalysis[0].resposta ? finalQualityAnalysis[0].resposta : 'Sem análise disponível.'}</p>
                </div>
            </div>
            <div class="technical-section">
                <h3>🔬 Segunda Análise: Análise Técnica Entomológica</h3>
                ${finalTechnicalAnalysis.map((relatorio, i) => `
                    <div class="analysis-item">
                        <h4>Análise ${i + 1}: ${relatorio.prompt.substring(0, 80)}...</h4>
                        <p>${relatorio.resposta}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: #e2e8f0; border-radius: 10px;">
            <p style="margin: 0; color: #4a5568; font-size: 0.9rem;">
                📊 Relatório gerado automaticamente pelo sistema de análise com IA Gemini
            </p>
        </div>
    </div>

    <script>
        // Inicializar mapa
        function initMap() {
            var lat = Number(${lat} || 0);
            var lng = Number(${lng} || 0);
            var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 18,
                center: { lat: lat, lng: lng },
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });
            
            // Adicionar marcador
            new google.maps.Marker({
                position: { lat: lat, lng: lng },
                map: map,
                title: 'Local da captura',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e53e3e" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 32)
                }
            });
        }
        
        // Carregar mapa quando a página estiver pronta
        window.addEventListener('load', initMap);
    </script>
</body>
</html>`;

        // Abrir em nova janela
        const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        newWindow.document.write(relatorioHTML);
        newWindow.document.close();
    };
}

function showUserManagement() {
    // Implementar modal de gestão de usuários
    alert('Gestão de usuários administrativos');
}

function showRegistrations() {
    // Scroll para a seção de cadastros
    document.getElementById('registrationsSection').scrollIntoView({ behavior: 'smooth' });
}

function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin-login.html';
}

// Função auxiliar para requisições à API
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('admin_token');
    const config = API_CONFIG.ENDPOINTS[endpoint];
    
    const defaultOptions = {
        method: config.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    return fetch(`${API_CONFIG.BASE_URL}${config.path}`, finalOptions);
}

