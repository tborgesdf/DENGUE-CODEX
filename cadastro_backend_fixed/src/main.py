import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta

from src.models.admin import db, Admin
from src.routes.admin import admin_bp
from src.routes.public import public_bp
from src.routes.user import user_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configurações
app.config['SECRET_KEY'] = 'jwt-secret-string-change-in-production'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Sem expiração
app.config['JWT_ALGORITHM'] = 'HS256'

# Configurar CORS
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"])

# Configurar JWT
jwt = JWTManager(app)

# Configurar JWT para aceitar tokens no header Authorization
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return False

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"Token expirado: {jwt_payload}")
    return jsonify({'error': 'Token expirado', 'code': 'TOKEN_EXPIRED'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Token inválido: {error}")
    return jsonify({'error': 'Token inválido', 'code': 'TOKEN_INVALID'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Token ausente: {error}")
    return jsonify({'error': 'Token de autorização necessário', 'code': 'TOKEN_MISSING'}), 401

# Registrar blueprints
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(public_bp, url_prefix='/')
app.register_blueprint(user_bp, url_prefix='/api')

# Configurar banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def create_default_admin():
    """Criar admin padrão se não existir"""
    with app.app_context():
        if not Admin.query.filter_by(username='admin').first():
            admin = Admin(username='admin', access_level='super_admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin padrão criado: admin/admin123")

# Inicializar banco de dados
with app.app_context():
    db.create_all()
    create_default_admin()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    app.run(
        host='0.0.0.0',
        port=3000,
        debug=True
        # ssl_context removido para rodar em HTTP
    )

