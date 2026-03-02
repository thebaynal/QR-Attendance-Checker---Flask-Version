"""User management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from database.db_manager import Database
from routes.auth_routes import login_required, admin_required
import uuid
from datetime import datetime

user_bp = Blueprint('user', __name__, url_prefix='/users')
db = Database()


@user_bp.route('/')
@admin_required
def list_users():
    """List all users."""
    username = session.get('username')
    user = db.get_user(username)
    
    users = db._execute("SELECT username, full_name, role, created_at FROM users", fetch_all=True) or []
    
    return render_template(
        'users/list.html',
        username=username,
        user_role=user[3],
        users=users
    )


@user_bp.route('/create', methods=['GET', 'POST'])
@admin_required
def create_user():
    """Create new user."""
    username = session.get('username')
    user = db.get_user(username)
    
    if request.method == 'POST':
        new_username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        full_name = request.form.get('full_name', '').strip()
        role = request.form.get('role', 'scanner').strip()
        
        if not new_username or not password or not full_name:
            return render_template(
                'users/create.html',
                username=username,
                user_role=user[3],
                error='All fields are required'
            )
        
        # Check if user already exists
        if db.get_user(new_username):
            return render_template(
                'users/create.html',
                username=username,
                user_role=user[3],
                error='Username already exists'
            )
        
        # Create user
        db.add_user(new_username, password, full_name, role)
        
        return redirect(url_for('user.list_users'))
    
    return render_template(
        'users/create.html',
        username=username,
        user_role=user[3]
    )


@user_bp.route('/<target_username>/edit', methods=['GET', 'POST'])
@admin_required
def edit_user(target_username):
    """Edit user."""
    username = session.get('username')
    user = db.get_user(username)
    
    target_user = db.get_user(target_username)
    if not target_user:
        return redirect(url_for('user.list_users'))
    
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        role = request.form.get('role', 'scanner').strip()
        password = request.form.get('password', '').strip()
        
        if not full_name:
            return render_template(
                'users/edit.html',
                username=username,
                user_role=user[3],
                target_user=target_user,
                error='Full name is required'
            )
        
        # Update user
        if password:
            db._execute(
                "UPDATE users SET full_name = ?, role = ?, password = ? WHERE username = ?",
                (full_name, role, db.hash_password(password), target_username),
                commit=True
            )
        else:
            db._execute(
                "UPDATE users SET full_name = ?, role = ? WHERE username = ?",
                (full_name, role, target_username),
                commit=True
            )
        
        return redirect(url_for('user.list_users'))
    
    return render_template(
        'users/edit.html',
        username=username,
        user_role=user[3],
        target_user=target_user
    )


@user_bp.route('/<target_username>/delete', methods=['POST'])
@admin_required
def delete_user(target_username):
    """Delete user."""
    username = session.get('username')
    
    # Don't allow deleting yourself
    if username == target_username:
        return redirect(url_for('user.list_users'))
    
    # Don't allow deleting admin unless it's the only option
    target_user = db.get_user(target_username)
    if target_user and target_user[3] == 'admin':
        admins = db._execute("SELECT COUNT(*) FROM users WHERE role = 'admin'", fetch_one=True)
        if admins[0] <= 1:
            return redirect(url_for('user.list_users'))
    
    db._execute("DELETE FROM users WHERE username = ?", (target_username,), commit=True)
    
    return redirect(url_for('user.list_users'))
