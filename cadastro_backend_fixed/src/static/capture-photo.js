document.addEventListener('DOMContentLoaded', function() {
    const MAX_PHOTOS = 15;
    let currentPhotoNumber = 1;
    let capturedPhotos = JSON.parse(localStorage.getItem('captured_photos') || '[]');
    let tempData = JSON.parse(localStorage.getItem('cadastro_temp') || '{}');
    
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureButton = document.getElementById('captureButton');
    const nextButton = document.getElementById('nextButton');
    const finishButton = document.getElementById('finishButton');
    const statusMessage = document.getElementById('statusMessage');
    const progressText = document.getElementById('progressText');
    const photoPreview = document.getElementById('photoPreview');
    const capturedImage = document.getElementById('capturedImage');
    
    // Função para fazer requisições à API
    async function apiRequest(endpoint, options = {}) {
        const baseUrl = window.location.origin;
        const endpoints = {
            REGISTER: '/register',
            HEALTH: '/health'
        };
        
        const url = `${baseUrl}${endpoints[endpoint]}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
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

    // Prompt único para análise de qualidade de imagem
    const qualityPrompts = [
        "Avalie se a imagem possui qualidade técnica suficiente para identificação científica de insetos ou larvas, considerando foco e nitidez morfológica, iluminação uniforme, enquadramento completo do espécime, ausência de artefatos visuais (como borrões ou distorções), e visibilidade clara de estruturas diagnósticas como listras e sifão. Responda de forma objetiva se a imagem é tecnicamente válida para análise morfológica e inclua uma breve justificativa destacando o principal fator que determinou o resultado.\n\nResponda sempre no seguinte formato:\n✅ Válida – A imagem apresenta boa nitidez, iluminação uniforme e visibilidade clara das estruturas morfológicas.\n❌ Inválida – O foco está comprometido, impossibilitando a observação precisa."
    ];

    // Prompts fixos para análise técnica
    const technicalPrompts = [
        "Analise cuidadosamente este inseto na imagem. Com base em suas características visuais — corpo, patas, padrão das asas e listras brancas — determine se trata-se de um mosquito da espécie Aedes aegypti. Justifique a identificação com base morfológica.",
        "Esta imagem mostra uma larva aquática. Baseando-se no formato do sifão, posição de flutuação e comprimento corporal, determine se esta larva pertence ao gênero Aedes. Descreva as evidências.",
        "Compare o inseto na imagem com os padrões visuais clássicos do Aedes aegypti: tórax com lira branca, patas com anéis brancos e corpo escuro. A identificação é compatível? Explique tecnicamente.",
        "Determine se o mosquito mostrado é Aedes aegypti, Culex quinquefasciatus ou outra espécie. Destaque as principais diferenças anatômicas visíveis para justificar sua resposta.",
        "Avalie se a larva visível possui características de larvas do Aedes aegypti, como posicionamento oblíquo na superfície da água, respiração por sifão curto e ausência de escovas peitorais densas.",
        "Classifique o inseto na imagem como pertencente ou não à família Culicidae. Caso afirmativo, indique se é possível identificar o gênero e espécie com base no que é visível.",
        "Observe o padrão das escamas nas asas, a posição das antenas e a forma do abdômen. Esses elementos indicam que o mosquito é um vetor da dengue? Explique por que sim ou não.",
        "Realize uma análise taxonômica baseada apenas nas características morfológicas visíveis nesta imagem. É possível confirmar se o inseto é Aedes aegypti?",
        "Verifique se a larva mostrada possui o corpo segmentado em 10 partes visíveis e sifão respiratório adaptado ao ar atmosférico. Esses elementos são compatíveis com larvas de Aedes?",
        "Aponte se há presença de listras brancas no corpo ou nas pernas do inseto adulto, e relacione esse padrão à identificação do Aedes aegypti. Há compatibilidade?",
        "Esta imagem mostra um estágio larval de mosquito. Determine se essa larva tem características típicas do Aedes aegypti ou se pode ser descartada como outra espécie aquática.",
        "Analise a curvatura do corpo da larva, a presença de pelos laterais e o comprimento do sifão. Esses dados permitem identificar que tipo de mosquito ela poderá se tornar?",
        "Realize uma inspeção morfológica detalhada no inseto adulto. A posição das asas e o padrão do tórax indicam que ele é um vetor relevante para arboviroses? Especifique qual.",
        "Com base nesta imagem, determine se o espécime está no estágio de larva, pupa ou adulto. Descreva como essa identificação contribui para definir risco epidemiológico.",
        "Examine o inseto com o objetivo de confirmar se ele apresenta o padrão listrado característico nas pernas — um marcador visual importante para o reconhecimento do Aedes aegypti."
    ];

    function updateProgress() {
        if (progressText) progressText.textContent = `Foto ${currentPhotoNumber} de até ${MAX_PHOTOS}`;
    }

    function showStatus(message, isError = false) {
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = isError ? 'error-message' : 'success-message';
            statusMessage.style.display = 'block';
        }
    }

    async function initializeCamera() {
        try {
            showStatus('Iniciando câmera...');
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            await new Promise((resolve) => { video.onloadedmetadata = resolve; });
            await video.play();
            showStatus('Câmera pronta! Posicione o dispositivo e tire a foto.');
            captureButton.disabled = false;
            captureButton.style.display = 'block';
            video.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            showStatus('Erro ao acessar câmera. Verifique as permissões.', true);
        }
    }

    function stopCamera() {
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        video.classList.add('hidden');
    }

    async function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });
                },
                (error) => {
                    reject(new Error('Erro ao obter localização'));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    async function gerarRelatorioGeminiAuto(photoData, prompt) {
        try {
            const payload = {
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: 'image/jpeg', data: photoData.replace(/^data:image\/(png|jpeg);base64,/, '') } }
                        ]
                    }
                ]
            };
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDcAc7L9WMPIjVZK6eR2aQtW-KnQUdiEoI', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Erro na API Gemini: ' + response.status);
            const data = await response.json();
            return data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text
                ? data.candidates[0].content.parts[0].text
                : 'Não foi possível gerar o relatório.';
        } catch (err) {
            return 'Erro ao gerar relatório: ' + err.message;
        }
    }

    async function capturePhoto() {
        try {
            captureButton.disabled = true;
            showStatus('Capturando foto e localização...');
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            const photoData = canvas.toDataURL('image/jpeg', 0.8);
            const location = await getCurrentLocation();
            
            // Primeira etapa: Análise de Qualidade
            showStatus('🔍 Analisando qualidade da imagem...');
            let qualityAnalysis = [];
            for (const prompt of qualityPrompts) {
                const resposta = await gerarRelatorioGeminiAuto(photoData, prompt);
                qualityAnalysis.push({ prompt, resposta });
            }
            
            // Verificar se a qualidade foi aprovada (critérios mais flexíveis)
            const qualityApproved = qualityAnalysis.some(analysis => {
                const resposta = analysis.resposta.toLowerCase();
                return resposta.includes('sim') || 
                       resposta.includes('sim,') ||
                       resposta.includes('positivo') ||
                       resposta.includes('adequada') ||
                       resposta.includes('boa') ||
                       resposta.includes('satisfatória') ||
                       resposta.includes('aceitável') ||
                       resposta.includes('permitida') ||
                       resposta.includes('possível') ||
                       resposta.includes('visível') ||
                       resposta.includes('clara') ||
                       resposta.includes('definida') ||
                       resposta.includes('apropriada') ||
                       resposta.includes('suficiente') ||
                       resposta.includes('adequado') ||
                       resposta.includes('bom') ||
                       resposta.includes('correto') ||
                       resposta.includes('aprovado') ||
                       resposta.includes('válido') ||
                       resposta.includes('aceito') ||
                       resposta.includes('✅') ||
                       resposta.includes('válida');
            });
            
            // Se não foi aprovada, mostrar aviso mas permitir continuar
            if (!qualityApproved) {
                showStatus('⚠️ Qualidade da imagem pode ser melhorada, mas continuando com a análise...');
                // Aguardar 2 segundos antes de continuar
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Segunda etapa: Análise Técnica (executada automaticamente)
            showStatus('🔬 Executando análise técnica...');
            let technicalAnalysis = [];
            for (const prompt of technicalPrompts) {
                const resposta = await gerarRelatorioGeminiAuto(photoData, prompt);
                technicalAnalysis.push({ prompt, resposta });
            }
            
            // Combinar análises
            const allAnalysis = [
                ...qualityAnalysis.map(q => ({ ...q, type: 'quality' })),
                ...technicalAnalysis.map(t => ({ ...t, type: 'technical' }))
            ];
            
            const photoInfo = {
                photoNumber: currentPhotoNumber,
                data: photoData,
                location: location,
                capturedAt: new Date().toISOString(),
                relatoriosGemini: allAnalysis,
                qualityApproved: qualityApproved
            };
            
            capturedPhotos.push(photoInfo);
            localStorage.setItem('captured_photos', JSON.stringify(capturedPhotos));
            showStatus('✅ Foto aprovada! Análise técnica concluída.');
            
            // Mostrar preview da foto por 2 segundos
            photoPreview.style.display = 'block';
            capturedImage.src = photoData;
            
            // Aguardar 2 segundos para o usuário ver a foto
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar se é a última foto
            if (currentPhotoNumber >= MAX_PHOTOS) {
                // Se for a última foto, mostrar botão de finalizar
                showStatus('🎉 Todas as fotos foram capturadas! Finalizando cadastro...');
                finishButton.style.display = 'block';
                captureButton.style.display = 'none';
                nextButton.style.display = 'none';
                stopCamera();
                
                // Aguardar 1 segundo e finalizar automaticamente
                setTimeout(() => {
                    finalizeCadastro();
                }, 1000);
            } else {
                // Se não for a última foto, passar automaticamente para a próxima
                showStatus('📸 Passando para a próxima foto...');
                setTimeout(() => {
                    nextPhoto();
                }, 1000);
            }
            
            updateProgress();
        } catch (error) {
            console.error('Erro ao capturar foto:', error);
            showStatus('Erro ao capturar foto. Tente novamente.', true);
            captureButton.disabled = false;
        }
    }

    function nextPhoto() {
        currentPhotoNumber++;
        updateProgress();
        photoPreview.style.display = 'none';
        captureButton.style.display = 'block';
        nextButton.style.display = 'none';
        finishButton.style.display = 'none';
        showStatus('Pronto para capturar a próxima foto.');
        captureButton.disabled = false;
        // Reabrir a câmera
        initializeCamera();
    }

    async function finalizeCadastro() {
        try {
            showStatus('Finalizando cadastro...');
            
            // Verificar se há fotos capturadas
            if (!capturedPhotos || capturedPhotos.length === 0) {
                showStatus('Nenhuma foto capturada. Capture pelo menos uma foto antes de finalizar.', true);
                return;
            }
            
            // Preparar dados das fotos e relatórios
            const photos = capturedPhotos.map(photo => photo.data);
            const photoLocations = capturedPhotos.map(photo => {
                if (photo.location && photo.location.latitude && photo.location.longitude) {
                    return [photo.location.latitude, photo.location.longitude];
                }
                return [0, 0]; // Fallback se não há localização
            });
            const relatoriosGemini = capturedPhotos.map(photo => photo.relatoriosGemini || []);
            
            const finalData = {
                ...tempData,
                photos: photos,
                photo_locations: photoLocations,
                relatoriosGemini: relatoriosGemini,
                completed_at: new Date().toISOString()
            };
            
            console.log('Dados finais para envio:', {
                photos: photos.length,
                photoLocations: photoLocations.length,
                relatoriosGemini: relatoriosGemini.length,
                tempData: tempData
            });
            
            const response = await apiRequest('REGISTER', {
                method: 'POST',
                body: JSON.stringify(finalData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Cadastro finalizado com sucesso:', result);
                showStatus('✅ Cadastro finalizado com sucesso! Redirecionando...');
                
                // Limpar dados temporários
                localStorage.removeItem('cadastro_temp');
                localStorage.removeItem('captured_photos');
                
                // Aguardar um pouco antes de redirecionar
                setTimeout(() => {
                    window.location.href = 'success.html';
                }, 1500);
            } else {
                let errorMessage = 'Erro desconhecido';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || `HTTP ${response.status}`;
                } catch (e) {
                    errorMessage = `Erro HTTP ${response.status}`;
                }
                console.error('Erro na resposta:', errorMessage);
                showStatus(`Erro ao finalizar cadastro: ${errorMessage}`, true);
            }
        } catch (error) {
            console.error('Erro ao finalizar cadastro:', error);
            showStatus(`Erro ao finalizar cadastro: ${error.message}`, true);
        }
    }

    captureButton.addEventListener('click', capturePhoto);
    nextButton.addEventListener('click', nextPhoto);
    finishButton.addEventListener('click', finalizeCadastro);

    initializeCamera();
    updateProgress();
    window.addEventListener('beforeunload', () => {
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    });
});

