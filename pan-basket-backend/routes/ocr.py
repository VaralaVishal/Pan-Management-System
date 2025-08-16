from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import easyocr
from models.models import BasketEntry, Wholesaler, PanShop
from utils.db import db
from datetime import datetime

ocr_bp = Blueprint('ocr', __name__, url_prefix='/api/ocr')

UPLOAD_FOLDER = "uploads"

@ocr_bp.route('/upload', methods=['POST'])
def upload_and_ocr():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file.save(filepath)

    # OCR
    reader = easyocr.Reader(['en'])
    result = reader.readtext(filepath, detail=0)
    text = "\n".join(result)

    return jsonify({'text': text})

@ocr_bp.route('/save', methods=['POST'])
def save_ocr_data():
    data = request.get_json()
    rows = data.get('rows', [])
    transaction_type = data.get('transactionType')
    pan_shop_id = data.get('panShopId')
    auto_create_wholesaler = data.get('autoCreateWholesaler', False)
    
    print(f"Received data: {data}")
    print(f"Transaction type: {transaction_type}")
    print(f"Pan shop ID: {pan_shop_id}")
    print(f"Auto create wholesaler: {auto_create_wholesaler}")
    print(f"Rows: {rows}")

    if not rows:
        return jsonify({'error': 'No data provided'}), 400

    inserted = []
    errors = []

    for row in rows:
        try:
            print(f"Processing row: {row}")
            
            # Validate required fields
            if not row.get('amount'):
                errors.append(f"Missing amount in row: {row}")
                continue
                
            if not row.get('mark') and transaction_type == 'wholesaler':
                errors.append(f"Missing mark in row: {row}")
                continue
            
            if not row.get('date'):
                errors.append(f"Missing date in row: {row}")
                continue
            
            # Convert amount to float
            try:
                amount = float(str(row.get('amount', '0')).replace(',', ''))
                print(f"Parsed amount: {amount}")
            except ValueError as e:
                errors.append(f"Invalid amount format in row: {row}. Error: {str(e)}")
                continue
                
            mark = row.get('mark', '').strip()
            date_str = row.get('date', '').strip()
            
            print(f"Mark: '{mark}', Date string: '{date_str}'")

            if transaction_type == "wholesaler":
                # Find wholesaler by mark
                party = Wholesaler.query.filter_by(mark=mark).first()
                party_type = 'wholesaler'
                
                if not party and auto_create_wholesaler:
                    # Create a new wholesaler with the mark
                    try:
                        new_wholesaler = Wholesaler(
                            name=f"Auto-created: {mark}",
                            mark=mark,
                            phone="",
                            address=""
                        )
                        db.session.add(new_wholesaler)
                        db.session.flush()  # Get the ID without committing
                        party = new_wholesaler
                        print(f"Created new wholesaler: {party.id}, {party.name}")
                    except Exception as e:
                        errors.append(f"Failed to create wholesaler with mark '{mark}': {str(e)}")
                        continue
                
                if not party:
                    errors.append(f"Wholesaler with mark '{mark}' not found for row: {row}")
                    continue
                print(f"Found wholesaler: {party.id}, {party.name}")
            elif transaction_type == "panshop":
                # Use selected pan shop, allow any mark
                party = PanShop.query.filter_by(id=pan_shop_id).first()
                party_type = 'panshop'
                if not party:
                    errors.append(f"Pan Shop with ID '{pan_shop_id}' not found for row: {row}")
                    continue
                print(f"Using pan shop: {party.id}, {party.name}")
            else:
                errors.append(f"Invalid transaction type '{transaction_type}' for row: {row}")
                continue

            # Parse date
            try:
                date_formats = ["%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%d %m %Y"]
                date = None
                
                for fmt in date_formats:
                    try:
                        date = datetime.strptime(date_str, fmt).date()
                        print(f"Date parsed with format {fmt}: {date}")
                        break
                    except ValueError:
                        continue
                
                if not date:
                    # Try to handle year format like "2025" without leading zeros
                    parts = date_str.replace('-', '/').replace('.', '/').split('/')
                    if len(parts) == 3:
                        try:
                            day = int(parts[0])
                            month = int(parts[1])
                            year = int(parts[2])
                            if year < 100:  # Assume 2-digit year
                                year += 2000
                            date = datetime(year, month, day).date()
                            print(f"Date parsed from parts: {date}")
                        except (ValueError, IndexError) as e:
                            raise ValueError(f"Could not parse date parts: {parts}. Error: {str(e)}")
                
                if not date:
                    raise ValueError(f"Could not parse date: {date_str}")
                    
            except Exception as e:
                errors.append(f"Invalid date format in row: {row}. Error: {str(e)}")
                continue

            entry = BasketEntry(
                party_type=party_type,
                party_id=party.id,
                date=date,
                basket_count=1,
                price_per_basket=amount,
                total_price=amount,
                mark=mark
            )
            db.session.add(entry)
            inserted.append(row)
            print(f"Added entry: {entry}")
        except Exception as e:
            errors.append(f"Error processing row '{row}': {str(e)}")
            print(f"Exception: {str(e)}")

    if inserted:
        db.session.commit()
        print(f"Committed {len(inserted)} entries")
    else:
        print("No entries to commit")
        
    return jsonify({
        "inserted": inserted,
        "errors": errors,
        "message": f"Inserted {len(inserted)} entries, {len(errors)} errors."
    })