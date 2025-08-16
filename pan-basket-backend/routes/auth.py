from flask import Blueprint, request, jsonify
from models.models import User
from utils.db import db
import jwt
import datetime
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Secret key for JWT 
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')

# Email configuration
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USER = os.environ.get('EMAIL_USER', 'your-email@gmail.com')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', 'your-app-password')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'no-reply@panbasket.com')

# Store reset tokens
reset_tokens = {}

def send_email(to_email, subject, body_html):
    """Send email using SMTP"""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_html, 'html'))
        
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        is_admin=data.get('is_admin', False),
        email_verified=False
    )
    new_user.set_password(data['password'])
    
    # Generate verification token
    token = secrets.token_urlsafe(32)
    new_user.verification_token = token
    new_user.verification_token_expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    
    db.session.add(new_user)
    db.session.commit()
    
    
    verification_link = f"{request.host_url.rstrip('/')}/verify-email/{token}"
    
    subject = "Verify Your Email Address"
    body_html = f"""
    <html>
      <body>
        <h2>Email Verification</h2>
        <p>Hello {new_user.username},</p>
        <p>Thank you for registering. Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>This link will expire in 7 days.</p>
      </body>
    </html>
    """
    
    send_email(new_user.email, subject, body_html)
    
    return jsonify({
        'message': 'User registered successfully. Please check your email to verify your account.',
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Check if email is verified
    if not user.email_verified and not data.get('ignore_verification'):
        return jsonify({
            'error': 'Email not verified',
            'requires_verification': True,
            'user_id': user.id
        }), 403
    
    # Check if remember me is set
    remember_me = data.get('remember_me', False)
    
    # Set token expiration based on remember me
    if remember_me:
        # 30 days if remember me is checked
        expiration = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    else:
        # 24 hours by default
        expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'username': user.username,
        'is_admin': user.is_admin,
        'exp': expiration
    }, SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict(),
        'expires_at': expiration.isoformat()
    })

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization header is missing or invalid'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

# Utility function to check if a token is valid
def token_required(f):
    from functools import wraps
    
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header is missing or invalid'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.current_user = User.query.get(payload['user_id'])
            
            if not request.current_user:
                return jsonify({'error': 'User not found'}), 404
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    
    return decorated 

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    # Always return success even if email not found (for security)
    if not user:
        return jsonify({'message': 'If your email is registered, you will receive a password reset link'}), 200
    
    # Generate a secure token
    token = secrets.token_urlsafe(32)
    
    # Store token with expiration (24 hours)
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    reset_tokens[token] = {
        'user_id': user.id,
        'expiration': expiration
    }
    
    # Create reset link
    reset_link = f"{request.host_url.rstrip('/')}/reset-password/{token}"
    
    # Email content
    subject = "Password Reset Request"
    body_html = f"""
    <html>
      <body>
        <h2>Password Reset Request</h2>
        <p>Hello {user.username},</p>
        <p>You have requested to reset your password. Click the link below to reset it:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
      </body>
    </html>
    """
    
    # Send email
    email_sent = send_email(user.email, subject, body_html)
    
    if email_sent:
        return jsonify({'message': 'If your email is registered, you will receive a password reset link'}), 200
    else:
        return jsonify({'error': 'Failed to send reset email'}), 500

@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    
    if not data or not data.get('password'):
        return jsonify({'error': 'New password is required'}), 400
    
    # Check if token exists and is valid
    if token not in reset_tokens:
        return jsonify({'error': 'Invalid or expired token'}), 400
    
    token_data = reset_tokens[token]
    
    # Check if token is expired
    if datetime.datetime.utcnow() > token_data['expiration']:
        # Remove expired token
        del reset_tokens[token]
        return jsonify({'error': 'Token has expired'}), 400
    
    # Get user and update password
    user = User.query.get(token_data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.set_password(data['password'])
    db.session.commit()
    
    # Remove used token
    del reset_tokens[token]
    
    return jsonify({'message': 'Password has been reset successfully'}), 200

@auth_bp.route('/verify-reset-token/<token>', methods=['GET'])
def verify_reset_token(token):
    # Check if token exists and is valid
    if token not in reset_tokens:
        return jsonify({'valid': False}), 200
    
    token_data = reset_tokens[token]
    
    # Check if token is expired
    if datetime.datetime.utcnow() > token_data['expiration']:
        # Remove expired token
        del reset_tokens[token]
        return jsonify({'valid': False}), 200
    
    return jsonify({'valid': True}), 200 

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400
    
    # Check if token is expired
    if datetime.datetime.utcnow() > user.verification_token_expires_at:
        return jsonify({'error': 'Verification token has expired'}), 400
    
    # Mark email as verified
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.session.commit()
    
    return jsonify({'message': 'Email verified successfully'})

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    
    if not data or not data.get('user_id'):
        return jsonify({'error': 'User ID is required'}), 400
    
    user = User.query.get(data['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.email_verified:
        return jsonify({'message': 'Email is already verified'}), 200
    
    # Generate new verification token
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    user.verification_token_expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    db.session.commit()
    
    # Send verification email
    verification_link = f"{request.host_url.rstrip('/')}/verify-email/{token}"
    
    subject = "Verify Your Email Address"
    body_html = f"""
    <html>
      <body>
        <h2>Email Verification</h2>
        <p>Hello {user.username},</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>This link will expire in 7 days.</p>
      </body>
    </html>
    """
    
    email_sent = send_email(user.email, subject, body_html)
    
    if email_sent:
        return jsonify({'message': 'Verification email sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send verification email'}), 500 