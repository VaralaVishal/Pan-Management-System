# models/models.py
from datetime import datetime
from utils.db import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), nullable=True)
    verification_token_expires_at = db.Column(db.DateTime, nullable=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Wholesaler(db.Model):
    __tablename__ = 'wholesalers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_info = db.Column(db.String(200), nullable=True)
    mark = db.Column(db.String(50), nullable=True) 

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_info": self.contact_info,
            "mark": self.mark  
        }

class BasketEntry(db.Model):
    __tablename__ = 'basket_entries'
    id = db.Column(db.Integer, primary_key=True)
    party_type = db.Column(db.String(20))  
    party_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    basket_count = db.Column(db.Integer, nullable=False)
    price_per_basket = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    mark = db.Column(db.String(50), nullable=True)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    party_type = db.Column(db.String(50), nullable=False)
    party_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    note = db.Column(db.String(200))
    payment_mode = db.Column(db.String(20), nullable=False)  # 'cash' or 'upi'
    upi_account = db.Column(db.String(100))  

class PanShop(db.Model):
    __tablename__ = 'panshops'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_info = db.Column(db.String(200))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'contact_info': self.contact_info
        }
