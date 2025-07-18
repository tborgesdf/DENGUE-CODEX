import requests

BASE_URL = 'http://localhost:3000'

# 1. Testar login admin
login_resp = requests.post(f'{BASE_URL}/admin/login', json={
    'username': 'admin',
    'password': 'admin123'
})
assert login_resp.status_code == 200, f'Login admin falhou: {login_resp.text}'
admin_token = login_resp.json()['access_token']
print('Login admin OK')

headers = {'Authorization': f'Bearer {admin_token}'}

# 2. Testar cadastro de usuário
user_data = {
    'cpf': '123.456.789-00',
    'phone': '(11) 91234-5678',
    'email': 'teste@exemplo.com',
    'latitude': -23.5505,
    'longitude': -46.6333,
    'device_info': {'os': 'test', 'browser': 'test'},
    'photos': ['base64photo1', 'base64photo2', 'base64photo3', 'base64photo4'],
    'photo_locations': [[-23.5505, -46.6333]]*4
}
reg_resp = requests.post(f'{BASE_URL}/register', json=user_data)
assert reg_resp.status_code == 201, f'Cadastro usuário falhou: {reg_resp.text}'
print('Cadastro usuário OK')

# 3. Listar cadastros (admin)
regs_resp = requests.get(f'{BASE_URL}/admin/registrations', headers=headers)
assert regs_resp.status_code == 200, f'Listagem de cadastros falhou: {regs_resp.text}'
print('Listagem de cadastros OK')

# 4. Dashboard (admin)
dash_resp = requests.get(f'{BASE_URL}/admin/dashboard', headers=headers)
assert dash_resp.status_code == 200, f'Dashboard falhou: {dash_resp.text}'
print('Dashboard OK')

print('Todos os testes passaram!') 