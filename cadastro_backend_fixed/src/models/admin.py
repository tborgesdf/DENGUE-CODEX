from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib
import uuid

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    access_level = db.Column(db.String(20), nullable=False, default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    def set_password(self, password):
        """Hash e armazena a senha usando SHA256"""
        self.password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    def check_password(self, password):
        """Verifica se a senha está correta"""
        return hashlib.sha256(password.encode('utf-8')).hexdigest() == self.password_hash
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'access_level': self.access_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

class Registration(db.Model):
    __tablename__ = 'registrations'
    
    id = db.Column(db.Integer, primary_key=True)
    registration_uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    cpf = db.Column(db.String(14), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    device_info = db.Column(db.Text)
    photos = db.Column(db.Text)  # JSON string com as fotos
    photo_locations = db.Column(db.Text)  # JSON string com localizações das fotos
    relatoriosGemini = db.Column(db.Text)  # JSON string com relatórios do Gemini
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    registration_date = db.Column(db.Date, default=datetime.utcnow().date)
    registration_time = db.Column(db.Time, default=datetime.utcnow().time)
    agent_name = db.Column(db.String(100))  # Nome do agente que fez o cadastro
    agent_id = db.Column(db.String(50))     # ID do agente
    status = db.Column(db.String(20), default='pending')
    
    def to_dict(self):
        return {
            'id': self.id,
            'registration_uuid': self.registration_uuid,
            'cpf': self.cpf,
            'phone': self.phone,
            'email': self.email,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'device_info': self.device_info,
            'photos': self.photos,
            'photo_locations': self.photo_locations,
            'relatoriosGemini': self.relatoriosGemini,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'registration_time': self.registration_time.isoformat() if self.registration_time else None,
            'agent_name': self.agent_name,
            'agent_id': self.agent_id,
            'status': self.status
        }

