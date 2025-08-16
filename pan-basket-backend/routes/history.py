from flask import Blueprint, request, jsonify
from models.models import BasketEntry, Payment, Wholesaler, PanShop
from datetime import datetime

history_bp = Blueprint('history', __name__, url_prefix='/api/history')

@history_bp.route('/', methods=['GET'])
def get_transaction_history():
    party_type = request.args.get('party_type')
    party_id = request.args.get('party_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not all([party_type, party_id, start_date, end_date]):
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    # Fetch baskets
    baskets = BasketEntry.query.filter(
        BasketEntry.party_type == party_type,
        BasketEntry.party_id == int(party_id),
        BasketEntry.date >= start,
        BasketEntry.date <= end
    ).all()

    # Fetch payments
    payments = Payment.query.filter(
        Payment.party_type == party_type,
        Payment.party_id == int(party_id),
        Payment.date >= start,
        Payment.date <= end
    ).all()

    basket_list = [{
        "date": b.date.strftime('%Y-%m-%d'),
        "basket_count": b.basket_count,
        "price_per_basket": b.price_per_basket,
        "total_price": b.total_price,
        "mark": b.mark
    } for b in baskets]

    payment_list = [{
        "date": p.date.strftime('%Y-%m-%d'),
        "amount": p.amount,
        "payment_mode": p.payment_mode,
        "upi_account": p.upi_account,
        "note": p.note
    } for p in payments]

    total_basket_value = sum(b.total_price for b in baskets)
    total_paid = sum(p.amount for p in payments)

    return jsonify({
        "baskets": basket_list,
        "payments": payment_list,
        "summary": {
            "total_basket_value": total_basket_value,
            "total_paid": total_paid,
            "balance": total_basket_value - total_paid
        }
    })
