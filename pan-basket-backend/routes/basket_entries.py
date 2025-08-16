from flask import Blueprint, request, jsonify
from models.models import BasketEntry, Wholesaler, PanShop
from utils.db import db
from datetime import datetime

basket_entries_bp = Blueprint('basket_entries', __name__, url_prefix='/api/basket-entries')

# route to basket_entries.py
@basket_entries_bp.route('/add', methods=['POST'])
def add_basket_entry():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['party_type', 'party_id', 'date', 'basket_count', 'price_per_basket']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        if data['party_type'] == 'wholesaler':
            party = Wholesaler.query.get(data['party_id'])
        else:
            party = PanShop.query.get(data['party_id'])
            
        if not party:
            return jsonify({'error': f'{data["party_type"].capitalize()} not found'}), 404

        # Calculate total price
        total_price = data['basket_count'] * data['price_per_basket']

        # Create new entry
        entry = BasketEntry(
            party_type=data['party_type'],
            party_id=data['party_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            basket_count=data['basket_count'],
            price_per_basket=data['price_per_basket'],
            total_price=total_price,
            mark=data.get('mark', '')
        )

        db.session.add(entry)
        db.session.commit()

        return jsonify({
            'message': 'Basket entry added successfully',
            'entry': {
                'id': entry.id,
                'party_type': entry.party_type,
                'party_id': entry.party_id,
                'date': entry.date.isoformat(),
                'basket_count': entry.basket_count,
                'price_per_basket': entry.price_per_basket,
                'total_price': entry.total_price,
                'mark': entry.mark
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add basket entry: {str(e)}'}), 500


@basket_entries_bp.route('', methods=['GET'])
def get_basket_entries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    party_type = request.args.get('party_type')
    party_id = request.args.get('party_id')
    date = request.args.get('date')
    
    query = BasketEntry.query
    
    if party_type:
        query = query.filter_by(party_type=party_type)
    
    if party_id:
        query = query.filter_by(party_id=party_id)
    
    if date:
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            query = query.filter(BasketEntry.date == date_obj)
        except ValueError:
            pass
    
    total = query.count()
    
    # Apply pagination
    entries = query.order_by(BasketEntry.date.desc(), BasketEntry.id.desc()).paginate(page=page, per_page=per_page)
    
    result = []
    for entry in entries.items:
        result.append({
            'id': entry.id,
            'party_type': entry.party_type,
            'party_id': entry.party_id,
            'date': entry.date.isoformat(),
            'basket_count': entry.basket_count,
            'price_per_basket': entry.price_per_basket,
            'total_price': entry.total_price,
            'mark': entry.mark
        })
    
    return jsonify({
        'entries': result,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': entries.pages
    })

@basket_entries_bp.route('/<int:entry_id>', methods=['PUT'])
def update_basket_entry(entry_id):
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    entry = BasketEntry.query.get(entry_id)
    if not entry:
        return jsonify({'error': f'Basket entry with ID {entry_id} not found'}), 404
    
    # Check if party exists
    if data.get('party_type') and data.get('party_id'):
        party_type = data.get('party_type')
        party_id = data.get('party_id')
        
        if party_type == 'wholesaler':
            party = Wholesaler.query.get(party_id)
        else:
            party = PanShop.query.get(party_id)
            
        if not party:
            return jsonify({'error': f'{party_type.capitalize()} with ID {party_id} not found'}), 400
    
    # Update the entry
    if 'party_type' in data:
        entry.party_type = data['party_type']
    
    if 'party_id' in data:
        entry.party_id = data['party_id']
    
    if 'date' in data:
        try:
            entry.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    if 'basket_count' in data:
        entry.basket_count = data['basket_count']
    
    if 'price_per_basket' in data:
        entry.price_per_basket = data['price_per_basket']
    
    if 'total_price' in data:
        entry.total_price = data['total_price']
    
    if 'mark' in data:
        entry.mark = data['mark']
    
    # Update related entries if requested
    related_updated = 0
    if data.get('update_related') and entry.mark:
        # Get the original mark before any changes
        original_mark = data.get('original_mark', entry.mark)
        
        # Find all entries with the same mark
        related_entries = BasketEntry.query.filter(
            BasketEntry.mark == original_mark,
            BasketEntry.id != entry_id
        ).all()
        
        for related in related_entries:
            # Only update party information, not other fields
            if data.get('party_type'):
                related.party_type = data['party_type']
            
            if data.get('party_id'):
                related.party_id = data['party_id']
            
            # Update the mark if it was changed
            if 'mark' in data and data['mark'] != original_mark:
                related.mark = data['mark']
            
            related_updated += 1
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Basket entry updated successfully',
            'related_updated': related_updated
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update entry: {str(e)}'}), 500

@basket_entries_bp.route('/<int:entry_id>', methods=['DELETE'])
def delete_basket_entry(entry_id):
    entry = BasketEntry.query.get(entry_id)
    if not entry:
        return jsonify({'error': f'Basket entry with ID {entry_id} not found'}), 404
    
    try:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Basket entry deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete entry: {str(e)}'}), 500
