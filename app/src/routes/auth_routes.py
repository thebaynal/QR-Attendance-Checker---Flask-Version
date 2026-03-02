"""Authentication routes."""

from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from database.db_manager import Database
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/')
db = Database()


def login_required(f):
    """Decorator to require login."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('auth.login'))
        
        user = db.get_user(session['username'])
        if not user or user[3] != 'admin':  # role is at index 3
            return redirect(url_for('dashboard.home'))
        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and authentication."""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        if not username or not password:
            return render_template('login.html', error='Username and password required')
        
        # Authenticate user
        authenticated_user = db.authenticate_user(username, password)
        
        if authenticated_user:
            session['username'] = username
            session.permanent = True
            db.record_login(username)
            return redirect(url_for('dashboard.home'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    if 'username' in session:
        return redirect(url_for('dashboard.home'))
    
    return render_template('login.html')


@auth_bp.route('/logout', methods=['POST', 'GET'])
def logout():
    """Logout user."""
    if 'username' in session:
        username = session['username']
        db.record_logout(username)
        session.clear()
    return redirect(url_for('auth.login'))


@auth_bp.route('/api/status', methods=['GET'])
def status():
    """API status endpoint."""
    return jsonify({
        'status': 'ok',
        'service': 'MaScan QR Attendance System',
        'version': '2.0.0'
    }), 200
