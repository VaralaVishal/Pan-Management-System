# Pan Basket Management System

A full-stack web application for managing pan basket inventory, transactions, and payments between wholesalers and pan shops.

## Features

- **Dashboard**
  - Real-time summary of basket transactions
  - Monthly payment trends
  - Top wholesaler dues and pan shop balances
  - Daily basket inflow/outflow visualization

- **Party Management**
  - Add/view wholesalers and pan shops
  - Track basket marks for wholesalers
  - Manage contact information

- **Transaction Management**
  - Record basket entries
  - Track payments
  - View transaction history
  - Generate balance summaries

- **OCR Integration**
  - Upload bill images
  - Extract transaction data automatically
  - Edit and verify before saving

- **Authentication & Security**
  - User registration and login
  - Email verification
  - Password reset functionality
  - Protected routes

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- Context API for state management
- Bootstrap for styling

### Backend
- Flask (Python)
- SQLAlchemy for database ORM
- JWT for authentication
- EasyOCR for image processing
- PostgreSQL database

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- PostgreSQL

### Backend Setup
```bash
cd pan-basket-backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database and email credentials

# Initialize database
flask db upgrade

# Run the server
python app.py
```

### Frontend Setup
```bash
cd pan-basket-frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/panbasket
JWT_SECRET_KEY=your_jwt_secret
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Routes

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### Parties
- GET `/api/parties`
- POST `/api/parties`
- GET `/api/parties/:id`

### Transactions
- GET `/api/basket-entries`
- POST `/api/basket-entries`
- GET `/api/payments`
- POST `/api/payments`

### OCR
- POST `/api/ocr/upload`
- POST `/api/ocr/save`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- **Varala Vishal** - *Initial work*

## Acknowledgments

- Thanks to all contributors
- Inspired by the need for efficient pan basket management
