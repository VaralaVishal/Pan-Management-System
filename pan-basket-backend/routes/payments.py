from flask import Blueprint, request, jsonify
from utils.db import db
from datetime import datetime
from models.models import BasketEntry, Payment
from flask import jsonify
from models.models import Wholesaler, PanShop


payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route("/", methods=["POST"])
def add_payment():
    data = request.get_json()
    payment = Payment(
        party_type=data["party_type"],
        party_id=data["party_id"],
        amount=data["amount"],
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        note=data.get("note", ""),
        payment_mode=data["payment_mode"],
        upi_account=data.get("upi_account")  # Optional
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({"message": "Payment recorded successfully"}), 201


@payments_bp.route("/", methods=["GET"])
def get_payments():
    party_type = request.args.get("party_type")
    party_id = request.args.get("party_id")

    query = Payment.query
    if party_type:
        query = query.filter_by(party_type=party_type)
    if party_id:
        query = query.filter_by(party_id=int(party_id))

    payments = query.order_by(Payment.date.desc()).all()

    result = []
    for p in payments:
        party_name = "Unknown"
        if p.party_type == "wholesaler":
            party = Wholesaler.query.get(p.party_id)
            if party:
                party_name = party.name
        elif p.party_type == "panshop":
            party = PanShop.query.get(p.party_id)
            if party:
                party_name = party.name

        result.append({
            "id": p.id,
            "party_type": p.party_type,
            "party_id": p.party_id,
            "party_name": party_name,
            "amount": p.amount,
            "date": p.date.strftime("%Y-%m-%d"),
            "note": p.note,
            "payment_mode": p.payment_mode,
            "upi_account": p.upi_account
        })

    return jsonify(result)


@payments_bp.route('/wholesaler/<int:party_id>', methods=['GET'])
def wholesaler_balance(party_id):
    wholesaler = Wholesaler.query.get(party_id)
    baskets = BasketEntry.query.filter_by(party_type='wholesaler', party_id=party_id).all()
    payments = Payment.query.filter_by(party_type='wholesaler', party_id=party_id).all()

    total_basket_value = sum(b.total_price for b in baskets)
    total_paid = sum(p.amount for p in payments)
    balance = total_basket_value - total_paid

    return jsonify({
        "party_type": "wholesaler",
        "party_id": party_id,
        "party_name": wholesaler.name if wholesaler else "Unknown",
        "total_basket_value": total_basket_value,
        "total_paid": total_paid,
        "balance": balance
    })


@payments_bp.route('/panshop/<int:party_id>', methods=['GET'])
def panshop_balance(party_id):
    panshop = PanShop.query.get(party_id)
    baskets = BasketEntry.query.filter_by(party_type='panshop', party_id=party_id).all()
    payments = Payment.query.filter_by(party_type='panshop', party_id=party_id).all()

    total_basket_value = sum(b.total_price for b in baskets)
    total_received = sum(p.amount for p in payments)
    balance = total_basket_value - total_received

    return jsonify({
        "party_type": "panshop",
        "party_id": party_id,
        "party_name": panshop.name if panshop else "Unknown",
        "total_basket_value": total_basket_value,
        "total_received": total_received,
        "balance": balance
    })


# @payments_bp.route('/balance-summary', methods=['GET'])
# def get_balance_summary():
#     party_type = request.args.get('party_type')  # 'wholesaler' or 'panshop'

#     if party_type not in ['wholesaler', 'panshop']:
#         return jsonify({"error": "Invalid party type"}), 400

#     Model = Wholesaler if party_type == 'wholesaler' else PanShop

#     summaries = []
#     parties = Model.query.all()

#     for party in parties:
#         basket_value = db.session.query(
#             db.func.sum(BasketEntry.total_price)
#         ).filter_by(party_type=party_type, party_id=party.id).scalar() or 0

#         total_paid = db.session.query(
#             db.func.sum(Payment.amount)
#         ).filter_by(party_type=party_type, party_id=party.id).scalar() or 0

#         summaries.append({
#             "party_id": party.id,
#             "party_type": party_type,
#             "party_name": party.name,  # ✅ Updated key
#             "total_basket_value": basket_value,
#             "total_paid": total_paid,
#             "balance": basket_value - total_paid
#         })

#     return jsonify(summaries)




@payments_bp.route('/balance-summary', methods=['GET'])
def get_balance_summary():
    party_type = request.args.get('party_type')

    if party_type not in ['wholesaler', 'panshop']:
        return jsonify({"error": "Invalid party type"}), 400

    Model = Wholesaler if party_type == 'wholesaler' else PanShop
    parties = Model.query.all()

    summaries = []

    for party in parties:
        # Use simple .filter_by() for total basket value
        basket_value = db.session.query(
            db.func.coalesce(db.func.sum(BasketEntry.total_price), 0)
        ).filter_by(party_type=party_type, party_id=party.id).scalar()

        total_paid = db.session.query(
            db.func.coalesce(db.func.sum(Payment.amount), 0)
        ).filter_by(party_type=party_type, party_id=party.id).scalar()

        summaries.append({
            "party_id": party.id,
            "party_type": party_type,
            "party_name": party.name,
            "total_basket_value": basket_value,
            "total_paid": total_paid,
            "balance": basket_value - total_paid
        })

    return jsonify(summaries)
