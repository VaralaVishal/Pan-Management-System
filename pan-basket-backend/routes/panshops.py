from flask import Blueprint, request, jsonify
from utils.db import db
from models.models import PanShop

panshops_bp = Blueprint('panshops', __name__)

@panshops_bp.route('/', methods=['POST'])
def add_panshop():
    data = request.get_json()
    panshop = PanShop(
        name=data['name'],
        contact_info=data.get('contact_info', '')
    )
    db.session.add(panshop)
    db.session.commit()
    return jsonify({'message': 'Pan shop added successfully'}), 201

@panshops_bp.route('/', methods=['GET'])
def get_panshops():
    panshops = PanShop.query.all()
    return jsonify([p.to_dict() for p in panshops])
