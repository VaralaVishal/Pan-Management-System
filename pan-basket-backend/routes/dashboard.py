from flask import Blueprint, jsonify
from models.models import BasketEntry, Payment, Wholesaler, PanShop
from utils.db import db
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard-summary')

@dashboard_bp.route('/', methods=['GET'])
def dashboard_summary():
    # --- Summary Cards
    total_basket_value = db.session.query(func.coalesce(func.sum(BasketEntry.total_price), 0)).scalar()
    total_paid = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).scalar()
    total_due = total_basket_value - total_paid
    total_transactions = db.session.query(BasketEntry).count() + db.session.query(Payment).count()

    # --- Top 5 Wholesalers by Due ---
    wholesaler_dues = []
    for party in Wholesaler.query.all():
        basket = db.session.query(func.coalesce(func.sum(BasketEntry.total_price), 0)).filter_by(party_type='wholesaler', party_id=party.id).scalar()
        paid = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter_by(party_type='wholesaler', party_id=party.id).scalar()
        due = basket - paid
        wholesaler_dues.append({"name": party.name, "due": due})
    top_wholesaler_dues = sorted(wholesaler_dues, key=lambda x: x["due"], reverse=True)[:5]

    # --- Top 5 Pan Shops by Balance ---
    panshop_balances = []
    for party in PanShop.query.all():
        basket = db.session.query(func.coalesce(func.sum(BasketEntry.total_price), 0)).filter_by(party_type='panshop', party_id=party.id).scalar()
        paid = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter_by(party_type='panshop', party_id=party.id).scalar()
        balance = basket - paid
        panshop_balances.append({"name": party.name, "balance": balance})
    top_panshop_balances = sorted(panshop_balances, key=lambda x: x["balance"], reverse=True)[:5]

    # --- Daily Basket Inflow/Outflow (last 30 days) ---
    # Inflow: baskets to wholesalers, Outflow: baskets to pan shops
    inflow_query = (
        db.session.query(
            BasketEntry.date,
            func.sum(BasketEntry.basket_count).label("inflow")
        )
        .filter(BasketEntry.party_type == 'wholesaler')
        .group_by(BasketEntry.date)
        .order_by(BasketEntry.date.desc())
        .limit(30)
    )
    outflow_query = (
        db.session.query(
            BasketEntry.date,
            func.sum(BasketEntry.basket_count).label("outflow")
        )
        .filter(BasketEntry.party_type == 'panshop')
        .group_by(BasketEntry.date)
        .order_by(BasketEntry.date.desc())
        .limit(30)
    )

    inflow_map = {row.date: row.inflow for row in inflow_query}
    outflow_map = {row.date: row.outflow for row in outflow_query}
    all_dates = set(inflow_map.keys()) | set(outflow_map.keys())
    daily_basket = []
    for d in sorted(all_dates):
        daily_basket.append({
            "date": d.strftime("%Y-%m-%d"),
            "inflow": int(inflow_map.get(d) or 0),
            "outflow": int(outflow_map.get(d) or 0)
        })

    # --- Monthly Payment Trend (last 12 months, incoming and outgoing) ---
    def monthly_sum(party_type):
        return (
            db.session.query(
                func.to_char(func.date_trunc('month', Payment.date), 'Mon').label("month"),
                func.date_trunc('month', Payment.date).label("month_start"),
                func.sum(Payment.amount).label("total")
            )
            .filter(Payment.party_type == party_type)
            .group_by(func.date_trunc('month', Payment.date))
            .order_by(func.date_trunc('month', Payment.date).desc())
            .limit(12)
            .all()
        )

    incoming = monthly_sum('panshop')
    outgoing = monthly_sum('wholesaler')

    month_map = {}
    for row in incoming:
        month_map[row.month_start] = {"month": row.month, "incoming": float(row.total or 0), "outgoing": 0}
    for row in outgoing:
        if row.month_start in month_map:
            month_map[row.month_start]["outgoing"] = float(row.total or 0)
        else:
            month_map[row.month_start] = {"month": row.month, "incoming": 0, "outgoing": float(row.total or 0)}
    monthly_payments = [month_map[k] for k in sorted(month_map.keys())]

    return jsonify({
        "total_basket_value": total_basket_value,
        "total_paid": total_paid,
        "total_due": total_due,
        "total_transactions": total_transactions,
        "top_wholesaler_dues": top_wholesaler_dues,
        "top_panshop_balances": top_panshop_balances,
        "daily_basket": daily_basket,
        "monthly_payments": monthly_payments
    })