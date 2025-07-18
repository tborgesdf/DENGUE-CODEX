from flask import Blueprint, request, jsonify
from src.models.admin import Registration, db
from datetime import datetime
import json

public_bp = Blueprint('public', __name__)

@public_bp.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['cpf', 'phone', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} é obrigatório'}), 400
        
        # Capturar IP do usuário
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        # Consultar localização baseada no IP (usando ip-api.com)
        import requests as pyrequests
        ip_location = {}
        try:
            resp = pyrequests.get(f'http://ip-api.com/json/{user_ip}?fields=status,country,regionName,city,query')
            if resp.ok:
                ip_location = resp.json()
        except Exception as e:
            ip_location = {'error': str(e)}
        
        # Atualizar device_info
        device_info = data.get('device_info', {})
        device_info['ip'] = user_ip
        device_info['ip_location'] = {
            'city': ip_location.get('city'),
            'region': ip_location.get('regionName'),
            'country': ip_location.get('country'),
            'query': ip_location.get('query'),
            'status': ip_location.get('status')
        }
        
        # Obter data e hora atual do sistema
        now = datetime.now()
        
        # Criar novo registro com todos os campos
        registration = Registration(
            cpf=data.get('cpf'),
            phone=data.get('phone'),
            email=data.get('email'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            device_info=json.dumps(device_info),
            photos=json.dumps(data.get('photos', [])),
            photo_locations=json.dumps(data.get('photo_locations', [])),
            relatoriosGemini=json.dumps(data.get('relatoriosGemini', [])),
            registration_date=now.date(),
            registration_time=now.time(),
            agent_name=data.get('agent_name', 'Sistema'),
            agent_id=data.get('agent_id', 'AUTO'),
            status='completed'
        )
        
        db.session.add(registration)
        db.session.commit()
        
        return jsonify({
            'message': 'Cadastro realizado com sucesso',
            'id': registration.id,
            'registration_uuid': registration.registration_uuid,
            'registration_date': registration.registration_date.isoformat(),
            'registration_time': registration.registration_time.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@public_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

