# app.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask
from flask_cors import CORS
from config import Config
from utils.db import db 

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

from routes.wholesalers import wholesalers_bp
from routes.basket_entries import basket_entries_bp
from routes.payments import payments_bp
from routes.panshops import panshops_bp
from routes.auth import auth_bp


app.register_blueprint(wholesalers_bp, url_prefix="/api/wholesalers")
app.register_blueprint(basket_entries_bp)
app.register_blueprint(payments_bp, url_prefix="/api/payments")
app.register_blueprint(panshops_bp, url_prefix="/api/panshops")
app.register_blueprint(auth_bp)

from routes.history import history_bp
app.register_blueprint(history_bp)


from routes.dashboard import dashboard_bp
app.register_blueprint(dashboard_bp)

from routes.ocr import ocr_bp
app.register_blueprint(ocr_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
