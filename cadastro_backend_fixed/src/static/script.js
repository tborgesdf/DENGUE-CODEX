document.addEventListener('DOMContentLoaded', function() {
    // Solicitar localização ao abrir a página
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log('Localização obtida automaticamente:', position);
            },
            function(error) {
                function isMobile() {
                    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                }
                if (error.code === error.PERMISSION_DENIED) {
                    if (isMobile()) {
                        alert('Permissão de localização negada!\n\nPara ativar, vá em: Configurações do navegador > Permissões > Localização > Permitir para este site.\n\nNo Android: toque no ícone de cadeado na barra de endereço, depois em Permissões > Localização.\nNo iPhone: Ajustes > Safari > Localização > Permitir.');
                    } else {
                        alert('Permissão de localização negada! Ative a localização nas configurações do navegador para continuar.');
                    }
                } else {
                    alert('Erro ao obter localização: ' + error.message);
                }
            }
        );
    }
    const form = document.getElementById('registrationForm');
    const cpfInput = document.getElementById('cpf');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const nextButton = document.getElementById('nextButton');
    const successMessage = document.getElementById('successMessage');
    const generalError = document.getElementById('generalError');

    // Máscaras para os campos
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        e.target.value = value;
    });

    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });

    // Validação de CPF
    function validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
        
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    }

    // Validação de telefone
    function validatePhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length === 10 || cleanPhone.length === 11;
    }

    // Validação de email
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função para obter localização
    function getLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não é suportada pelo navegador'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let errorMessage = 'Erro ao obter localização';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização para continuar.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Localização indisponível';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Timeout ao obter localização';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Função para capturar dados do dispositivo
    function getDeviceData() {
        function parseOS(userAgent, platform) {
            if (/windows phone/i.test(userAgent)) return 'Windows Phone';
            if (/windows/i.test(platform)) return 'Windows';
            if (/android/i.test(userAgent)) return 'Android';
            if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
            if (/mac/i.test(platform)) return 'MacOS';
            if (/linux/i.test(platform)) return 'Linux';
            return 'Desconhecido';
        }
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        let connectionType = 'N/A';
        let effectiveConnectionType = 'N/A';
        if (navigator.connection) {
            connectionType = navigator.connection.type || 'N/A';
            effectiveConnectionType = navigator.connection.effectiveType || 'N/A';
        }
        return {
            userAgent: userAgent,
            platform: platform,
            os: parseOS(userAgent, platform),
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            connectionType: connectionType,
            effectiveConnectionType: effectiveConnectionType,
            timestamp: new Date().toISOString()
        };
    }

    // Função para mostrar erro
    function showError(message) {
        generalError.textContent = message;
        generalError.style.display = 'block';
        setTimeout(() => {
            generalError.style.display = 'none';
        }, 5000);
    }

    // Função para mostrar sucesso
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    // Validação em tempo real
    cpfInput.addEventListener('blur', function() {
        const cpfError = document.getElementById('cpfError');
        if (this.value && !validateCPF(this.value)) {
            cpfError.textContent = 'CPF inválido';
            cpfError.style.display = 'block';
            this.style.borderColor = '#e74c3c';
        } else {
            cpfError.style.display = 'none';
            this.style.borderColor = '#27ae60';
        }
    });

    phoneInput.addEventListener('blur', function() {
        const phoneError = document.getElementById('phoneError');
        if (this.value && !validatePhone(this.value)) {
            phoneError.textContent = 'Telefone inválido';
            phoneError.style.display = 'block';
            this.style.borderColor = '#e74c3c';
        } else {
            phoneError.style.display = 'none';
            this.style.borderColor = '#27ae60';
        }
    });

    emailInput.addEventListener('blur', function() {
        const emailError = document.getElementById('emailError');
        if (this.value && !validateEmail(this.value)) {
            emailError.textContent = 'E-mail inválido';
            emailError.style.display = 'block';
            this.style.borderColor = '#e74c3c';
        } else {
            emailError.style.display = 'none';
            this.style.borderColor = '#27ae60';
        }
    });

    // Event listener para o botão Próximo
    nextButton.addEventListener('click', async function(e) {
        e.preventDefault();

        const cpf = cpfInput.value;
        const phone = phoneInput.value;
        const email = emailInput.value;

        // Validações
        if (!validateCPF(cpf)) {
            showError('CPF inválido');
            return;
        }

        if (!validatePhone(phone)) {
            showError('Telefone inválido');
            return;
        }

        if (!validateEmail(email)) {
            showError('E-mail inválido');
            return;
        }

        try {
            // 1. Solicitar autorização de GPS
            nextButton.textContent = 'Obtendo localização...';
            nextButton.disabled = true;
            
            const location = await getLocation();
            
            // 2. Capturar dados do dispositivo
            const deviceData = getDeviceData();
            
            // 3. Salvar dados temporariamente no localStorage
            const tempData = {
                cpf: cpf,
                phone: phone,
                email: email,
                latitude: location.latitude,
                longitude: location.longitude,
                device_data: deviceData,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('cadastro_temp', JSON.stringify(tempData));
            
            // 4. Redirecionar para página de captura de foto
            showSuccess('Localização obtida! Redirecionando para captura de foto...');
            
            setTimeout(() => {
                window.location.href = 'capture-photo-1.html';
            }, 1500);

        } catch (error) {
            console.error('Erro:', error);
            showError(error.message || 'Erro ao processar dados. Verifique se permitiu acesso à localização.');
        } finally {
            nextButton.textContent = 'Próximo';
            nextButton.disabled = false;
        }
    });
});

function showLocationWarning(message) {
    let existing = document.getElementById('location-warning');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'location-warning';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.background = '#fff3cd';
    div.style.color = '#856404';
    div.style.borderBottom = '2px solid #ffe082';
    div.style.padding = '16px 12px';
    div.style.zIndex = '9999';
    div.style.fontSize = '1rem';
    div.style.textAlign = 'center';
    div.innerHTML = message + '<br><button id="try-location-btn" style="margin-top:8px;padding:6px 18px;background:#2980b9;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Tentar novamente</button>';
    document.body.appendChild(div);
    document.getElementById('try-location-btn').onclick = function() {
        div.remove();
        requestLocation();
    };
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isInsecureContext() {
    return location.protocol !== 'https:' && location.hostname !== 'localhost' && !/^127\./.test(location.hostname);
}

function requestLocation() {
    if (isInsecureContext()) {
        showLocationWarning('Seu navegador bloqueia a localização em conexões não seguras (HTTP). Acesse por HTTPS ou localhost para permitir a localização.');
        return;
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                let warn = document.getElementById('location-warning');
                if (warn) warn.remove();
                console.log('Localização obtida automaticamente:', position);
            },
            function(error) {
                let msg = '';
                if (error.code === error.PERMISSION_DENIED) {
                    if (isMobile()) {
                        msg = 'Permissão de localização negada!<br><br>' +
                            'Para ativar, vá em: <b>Configurações do navegador</b> &gt; <b>Permissões</b> &gt; <b>Localização</b> &gt; <b>Permitir para este site</b>.' +
                            '<br><br><b>No Android:</b> toque no ícone de cadeado na barra de endereço, depois em Permissões &gt; Localização.' +
                            '<br><b>No iPhone:</b> Ajustes &gt; Safari &gt; Localização &gt; Permitir.';
                    } else {
                        msg = 'Permissão de localização negada!<br><br>' +
                            'Ative a localização nas configurações do navegador para continuar. Clique no cadeado ao lado do endereço e ajuste as permissões.';
                    }
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = 'Erro ao obter localização.<br><br>' +
                        'Possíveis causas:<ul style="text-align:left;max-width:400px;margin:8px auto 0;">' +
                        '<li>O GPS do dispositivo está desligado.</li>' +
                        '<li>O sinal de GPS está fraco ou indisponível.</li>' +
                        '<li>Permissão de localização não foi concedida.</li>' +
                        '</ul>' +
                        'Ative o GPS e verifique as permissões de localização, depois tente novamente.';
                } else if (error.code === error.TIMEOUT) {
                    msg = 'Tempo esgotado ao tentar obter localização.<br><br>' +
                        'Certifique-se de que o GPS está ativado e tente novamente em um local com melhor sinal.';
                } else {
                    msg = 'Erro ao obter localização: ' + error.message + '<br><br>Verifique se o GPS está ativado e tente novamente.';
                }
                showLocationWarning(msg);
            }
        );
    } else {
        showLocationWarning('Seu navegador não suporta geolocalização.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    requestLocation();
});

// Função para exibir alerta de erro de localização no formulário
function showFormLocationError() {
    const formAlert = document.querySelector('.form-location-error');
    if (formAlert) {
        formAlert.innerHTML = '<strong>Erro ao obter localização.</strong><br>' +
            '<ul style="text-align:left;max-width:400px;margin:8px auto 0;">' +
            '<li>O GPS do dispositivo está desligado.</li>' +
            '<li>O sinal de GPS está fraco ou indisponível.</li>' +
            '<li>Permissão de localização não foi concedida.</li>' +
            '</ul>' +
            'Ative o GPS e verifique as permissões de localização, depois tente novamente.' +
            '<br><button id="try-location-btn-form" style="margin-top:8px;padding:6px 18px;background:#2980b9;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Tentar novamente</button>';
        document.getElementById('try-location-btn-form').onclick = function() {
            formAlert.innerHTML = '';
            requestLocation();
        };
    }
}

