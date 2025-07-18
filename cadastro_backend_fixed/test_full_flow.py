import requests
import base64
import time

BASE_URL = 'http://localhost:3000'

# Dados simulados
user_data = {
    'cpf': '123.456.789-99',
    'phone': '(11) 99999-9999',
    'email': 'teste5fotos@exemplo.com',
    'latitude': -23.5505,
    'longitude': -46.6333,
    'device_info': {'os': 'test', 'browser': 'test'},
}

# Simular 5 fotos base64 (imagem preta pequena)
def fake_photo():
    return 'data:image/jpeg;base64,' + base64.b64encode(b'\xff\xd8\xff\xd9').decode()

# Simular prompts e relatórios para cada foto (usando os prompts da implementação)
prompts_por_foto = [
    [f'Prompt 1.{i+1}' for i in range(10)],
    [f'Prompt 2.{i+1}' for i in range(10)],
    [f'Prompt 3.{i+1}' for i in range(10)],
    [f'Prompt 4.{i+1}' for i in range(15)],
    [f'Prompt 5.{i+1}' for i in range(15)],
]

photos = []
photo_locations = []
for i in range(5):
    relatoriosGemini = [
        {'prompt': prompt, 'resposta': f'Resposta simulada para {prompt}'}
        for prompt in prompts_por_foto[i]
    ]
    photos.append({
        'photoNumber': i+1,
        'data': fake_photo(),
        'location': {'latitude': -23.5505, 'longitude': -46.6333, 'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')},
        'capturedAt': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'relatoriosGemini': relatoriosGemini
    })
    photo_locations.append({'latitude': -23.5505, 'longitude': -46.6333, 'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')})

# Enviar cadastro
final_data = {
    **user_data,
    'photos': [p['data'] for p in photos],
    'photo_locations': [p['location'] for p in photos],
    # Os relatórios Gemini são salvos dentro de cada foto (como no frontend)
}

resp = requests.post(f'{BASE_URL}/register', json=final_data)
print('Status cadastro:', resp.status_code)
print('Resposta:', resp.json())
assert resp.status_code == 201, 'Cadastro de usuário com 5 fotos falhou'

print('Teste automatizado de cadastro com 5 fotos e múltiplos relatórios concluído com sucesso!') 