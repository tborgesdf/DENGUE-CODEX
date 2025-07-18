#!/usr/bin/env python3
"""
Teste do fluxo de captura de fotos com análise de qualidade automática
"""

import requests
import json
import time
import base64
from PIL import Image
import io

def test_photo_quality_flow():
    """Testa o fluxo de captura de fotos com análise de qualidade"""
    
    base_url = "http://localhost:3000"
    
    print("🧪 Testando fluxo de captura de fotos com análise de qualidade automática...")
    
    # 1. Testar se o servidor está rodando
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Servidor está rodando")
        else:
            print(f"❌ Servidor retornou status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar ao servidor")
        return False
    
    # 2. Criar uma imagem de teste (simulando foto capturada)
    def create_test_image():
        """Cria uma imagem de teste para simular foto capturada"""
        img = Image.new('RGB', (640, 480), color='white')
        
        # Adicionar alguns elementos para simular uma foto real
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Desenhar um retângulo simples
        draw.rectangle([100, 100, 300, 200], fill='blue', outline='black')
        draw.text((150, 150), "Teste", fill='white')
        
        # Converter para base64
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=80)
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')
    
    # 3. Simular dados de cadastro
    test_data = {
        "nome": "Teste Automático",
        "email": "teste@exemplo.com",
        "telefone": "11999999999",
        "cpf": "12345678901",
        "photos": [create_test_image()],
        "photo_locations": [[-23.5505, -46.6333]],  # São Paulo
        "relatoriosGemini": [
            {
                "type": "quality",
                "prompt": "Análise de qualidade",
                "resposta": "✅ Válida – A imagem apresenta boa nitidez e iluminação adequada."
            },
            {
                "type": "technical", 
                "prompt": "Análise técnica",
                "resposta": "Análise técnica concluída com sucesso."
            }
        ],
        "agent_name": "Sistema Automático",
        "agent_id": "TEST001",
        "completed_at": time.strftime("%Y-%m-%dT%H:%M:%S")
    }
    
    # 4. Testar registro
    try:
        print("📝 Testando registro de cadastro...")
        response = requests.post(
            f"{base_url}/register",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Cadastro registrado com sucesso!")
            print(f"   ID: {result.get('id', 'N/A')}")
            print(f"   Status: {result.get('status', 'N/A')}")
            return True
        else:
            print(f"❌ Erro no registro: {response.status_code}")
            try:
                error = response.json()
                print(f"   Erro: {error}")
            except:
                print(f"   Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro durante teste: {e}")
        return False

def test_admin_dashboard():
    """Testa o dashboard administrativo"""
    
    base_url = "http://localhost:3000"
    
    print("\n🔐 Testando dashboard administrativo...")
    
    # 1. Login administrativo
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/admin/login",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            token = result.get('access_token')
            print("✅ Login administrativo realizado com sucesso")
            
            # 2. Testar acesso ao dashboard
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{base_url}/admin/dashboard", headers=headers)
            
            if response.status_code == 200:
                dashboard_data = response.json()
                print("✅ Dashboard acessado com sucesso")
                print(f"   Total de cadastros: {dashboard_data.get('total_registrations', 0)}")
                print(f"   Cadastros hoje: {dashboard_data.get('registrations_today', 0)}")
                return True
            else:
                print(f"❌ Erro ao acessar dashboard: {response.status_code}")
                return False
        else:
            print(f"❌ Erro no login: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro durante teste do dashboard: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando testes do sistema de captura de fotos...")
    print("=" * 60)
    
    # Testar fluxo de fotos
    photo_test = test_photo_quality_flow()
    
    # Testar dashboard
    dashboard_test = test_admin_dashboard()
    
    print("\n" + "=" * 60)
    print("📊 RESULTADOS DOS TESTES:")
    print(f"   Fluxo de fotos: {'✅ PASSOU' if photo_test else '❌ FALHOU'}")
    print(f"   Dashboard admin: {'✅ PASSOU' if dashboard_test else '❌ FALHOU'}")
    
    if photo_test and dashboard_test:
        print("\n🎉 Todos os testes passaram! Sistema funcionando corretamente.")
    else:
        print("\n⚠️ Alguns testes falharam. Verifique os logs acima.") 