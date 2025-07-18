from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from src.models.admin import Admin, Registration, db
import json

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f"Login attempt - Username: {username}")
        
        if not username or not password:
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        # Buscar admin no banco
        admin = Admin.query.filter_by(username=username, is_active=True).first()
        
        if not admin or not admin.check_password(password):
            print(f"Login failed - Admin not found or wrong password")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        print(f"Login successful - Admin ID: {admin.id}")
        
        # Atualizar último login
        admin.last_login = datetime.utcnow()
        db.session.commit()
        
        # Criar token JWT (usando configuração global de expiração)
        access_token = create_access_token(identity=str(admin.id))
        print(f"Token generated: {access_token[:50]}...")
        
        return jsonify({
            'access_token': access_token,
            'admin': admin.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        admin_id = get_jwt_identity()
        print(f"Dashboard - Admin ID do token: {admin_id}")
        
        if not admin_id:
            print("Dashboard - Token inválido: admin_id é None")
            return jsonify({'error': 'Token inválido'}), 401
            
        admin = Admin.query.get(admin_id)
        if not admin:
            print(f"Dashboard - Admin não encontrado para ID: {admin_id}")
            return jsonify({'error': 'Admin não encontrado'}), 404
            
        print(f"Dashboard - Admin encontrado: {admin.username}")
        
        # Buscar dados básicos para o dashboard
        try:
            total_registrations = Registration.query.count()
        except Exception as e:
            print(f"Erro ao contar registrations: {str(e)}")
            total_registrations = 0
            
        try:
            # Filtro simples para registros de hoje
            from datetime import date
            today = date.today()
            today_registrations = Registration.query.filter(
                Registration.created_at >= today
            ).count()
        except Exception as e:
            print(f"Erro ao contar registrations de hoje: {str(e)}")
            today_registrations = 0
        
        try:
            pending_cases = Registration.query.filter_by(status='pending').count()
        except Exception as e:
            print(f"Erro ao contar casos pendentes: {str(e)}")
            pending_cases = 0
            
        try:
            completed_cases = Registration.query.filter_by(status='completed').count()
        except Exception as e:
            print(f"Erro ao contar casos completos: {str(e)}")
            completed_cases = 0
        
        # Dados do dashboard
        dashboard_data = {
            'total_cadastros': total_registrations,
            'cadastros_hoje': today_registrations,
            'casos_pendentes': pending_cases,
            'casos_atendidos': completed_cases,
            'agendamentos_hoje': 5,  # Simulado
            'clima': {
                'cidade': 'São Paulo',
                'temperatura': '22°C',
                'condicao': 'Parcialmente nublado'
            }
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        print(f"Erro geral no dashboard: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_admin_users():
    try:
        admin_id = get_jwt_identity()
        admin = Admin.query.get(admin_id)
        
        if not admin:
            return jsonify({'error': 'Admin não encontrado'}), 404
        
        # Buscar todos os admins
        admins = Admin.query.all()
        return jsonify([admin.to_dict() for admin in admins]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_admin_user():
    try:
        admin_id = get_jwt_identity()
        admin = Admin.query.get(admin_id)
        
        if not admin or admin.access_level != 'super_admin':
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        access_level = data.get('access_level', 'admin')
        
        if not username or not password:
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        # Verificar se username já existe
        if Admin.query.filter_by(username=username).first():
            return jsonify({'error': 'Username já existe'}), 400
        
        # Criar novo admin
        new_admin = Admin(username=username, access_level=access_level)
        new_admin.set_password(password)
        
        db.session.add(new_admin)
        db.session.commit()
        
        return jsonify(new_admin.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/registrations', methods=['GET'])
@jwt_required()
def get_registrations():
    try:
        admin_id = get_jwt_identity()
        if not admin_id:
            return jsonify({'error': 'Token inválido'}), 401
            
        admin = Admin.query.get(admin_id)
        if not admin:
            return jsonify({'error': 'Admin não encontrado'}), 404
        
        try:
            # Obter parâmetros de busca
            cpf = request.args.get('cpf', '').strip()
            phone = request.args.get('phone', '').strip()
            email = request.args.get('email', '').strip()
            date = request.args.get('date', '').strip()
            time = request.args.get('time', '').strip()
            status = request.args.get('status', '').strip()
            agent = request.args.get('agent', '').strip()
            
            # Iniciar query base
            query = Registration.query
            
            # Aplicar filtros se fornecidos
            if cpf:
                query = query.filter(Registration.cpf.like(f'%{cpf}%'))
            
            if phone:
                query = query.filter(Registration.phone.like(f'%{phone}%'))
            
            if email:
                query = query.filter(Registration.email.like(f'%{email}%'))
            
            if date:
                try:
                    from datetime import datetime
                    search_date = datetime.strptime(date, '%Y-%m-%d').date()
                    query = query.filter(Registration.registration_date == search_date)
                except ValueError:
                    # Se a data não estiver no formato correto, ignorar o filtro
                    pass
            
            if time:
                try:
                    from datetime import datetime
                    search_time = datetime.strptime(time, '%H:%M:%S').time()
                    query = query.filter(Registration.registration_time == search_time)
                except ValueError:
                    # Se o horário não estiver no formato correto, ignorar o filtro
                    pass
            
            if status:
                query = query.filter(Registration.status.like(f'%{status}%'))
            
            if agent:
                query = query.filter(
                    (Registration.agent_name.like(f'%{agent}%')) |
                    (Registration.agent_id.like(f'%{agent}%'))
                )
            
            # Ordenar por data de criação (mais recentes primeiro)
            registrations = query.order_by(Registration.created_at.desc()).all()
            registrations_data = []
            
            for reg in registrations:
                try:
                    reg_dict = reg.to_dict()
                    registrations_data.append(reg_dict)
                except Exception as dict_error:
                    print(f"Erro ao converter registration {reg.id} para dict: {str(dict_error)}")
                    continue
                    
            return jsonify({
                'registrations': registrations_data,
                'total': len(registrations_data),
                'filters_applied': {
                    'cpf': cpf,
                    'phone': phone,
                    'email': email,
                    'date': date,
                    'time': time,
                    'status': status,
                    'agent': agent
                }
            }), 200
            
        except Exception as query_error:
            print(f"Erro na query de registrations: {str(query_error)}")
            # Retornar lista vazia se houver erro na query
            return jsonify({'registrations': [], 'total': 0, 'filters_applied': {}}), 200
        
    except Exception as e:
        print(f"Erro geral no endpoint registrations: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

