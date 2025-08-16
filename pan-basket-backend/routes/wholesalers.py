from flask import Blueprint, request, jsonify
from models.models import Wholesaler
from utils.db import db

wholesalers_bp = Blueprint('wholesalers_bp', __name__)

@wholesalers_bp.route('/', methods=['GET'])
def get_wholesalers():
    wholesalers = Wholesaler.query.all()
    return jsonify([w.to_dict() for w in wholesalers])


@wholesalers_bp.route('/', methods=['POST'])
def add_wholesaler():
    data = request.json
    print("Received in backend:", data)  

    name = data.get("name")
    contact_info = data.get("contact_info")
    mark = data.get("mark")

    new_wholesaler = Wholesaler(
        name=name,
        contact_info=contact_info,
        mark=mark
    )
    db.session.add(new_wholesaler)
    db.session.commit()

    return jsonify({"message": "Wholesaler added"}), 201


