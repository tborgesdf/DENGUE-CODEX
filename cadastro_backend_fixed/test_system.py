#!/usr/bin/env python3
"""
Script para testar o sistema completo
"""

import requests
import json
import time

def test_system():
    base_url = "http://localhost:3000"
    
    print("🧪 Testando Sistema de Cadastro e Captura de Fotos")
    print("=" * 50)
    
    # Teste 1: Health Check
    print("\n1. Testando Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health Check: OK")
        else:
            print(f"❌ Health Check: Erro {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Health Check: Erro de conexão - {e}")
        return
    
    # Teste 2: Login Admin
    print("\n2. Testando Login Admin...")
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{base_url}/admin/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("✅ Login Admin: OK")
            print(f"   Token: {token[:20]}...")
        else:
            print(f"❌ Login Admin: Erro {response.status_code}")
            print(f"   Resposta: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login Admin: Erro - {e}")
        return
    
    # Teste 3: Dashboard
    print("\n3. Testando Dashboard...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/admin/dashboard", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("✅ Dashboard: OK")
            print(f"   Total cadastros: {data.get('total_cadastros', 0)}")
        else:
            print(f"❌ Dashboard: Erro {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Dashboard: Erro - {e}")
        return
    
    # Teste 4: Registrations
    print("\n4. Testando Lista de Registrations...")
    try:
        response = requests.get(f"{base_url}/admin/registrations", headers=headers)
        if response.status_code == 200:
            registrations = response.json()
            print(f"✅ Registrations: OK - {len(registrations)} registros encontrados")
            
            if registrations:
                latest = registrations[0]
                print(f"   Último registro: ID {latest.get('id')}")
                print(f"   CPF: {latest.get('cpf')}")
                
                # Verificar fotos
                photos_str = latest.get('photos', '[]')
                if photos_str:
                    photos = json.loads(photos_str)
                    print(f"   Fotos: {len(photos)}")
                else:
                    print(f"   Fotos: 0")
                
                # Verificar relatórios Gemini
                relatorios_str = latest.get('relatoriosGemini', '[]')
                if relatorios_str:
                    relatorios = json.loads(relatorios_str)
                    print(f"   Relatórios Gemini: {len(relatorios)}")
                else:
                    print(f"   Relatórios Gemini: 0")
        else:
            print(f"❌ Registrations: Erro {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Registrations: Erro - {e}")
        return
    
    # Teste 5: Simular Cadastro
    print("\n5. Testando Cadastro Simulado...")
    try:
        # Dados de teste
        test_data = {
            "cpf": "123.456.789-00",
            "phone": "(11) 99999-9999",
            "email": "teste@exemplo.com",
            "latitude": -23.5505,
            "longitude": -46.6333,
            "device_info": {"test": True},
            "photos": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
            "photo_locations": [[-23.5505, -46.6333]],
            "relatoriosGemini": [[
                {
                    "prompt": "Teste de prompt",
                    "resposta": "Teste de resposta do Gemini"
                }
            ]]
        }
        
        response = requests.post(f"{base_url}/register", json=test_data)
        if response.status_code == 201:
            result = response.json()
            print("✅ Cadastro Simulado: OK")
            print(f"   ID do registro: {result.get('id')}")
        else:
            print(f"❌ Cadastro Simulado: Erro {response.status_code}")
            print(f"   Resposta: {response.text}")
            return
    except Exception as e:
        print(f"❌ Cadastro Simulado: Erro - {e}")
        return
    
    print("\n" + "=" * 50)
    print("🎉 Todos os testes passaram! Sistema funcionando corretamente.")
    print("\n📱 URLs para acesso:")
    print(f"   - Página inicial: {base_url}/")
    print(f"   - Captura de fotos: {base_url}/capture-photo.html")
    print(f"   - Admin login: {base_url}/admin-login.html")
    print(f"   - Admin dashboard: {base_url}/admin/dashboard")

if __name__ == "__main__":
    test_system() 