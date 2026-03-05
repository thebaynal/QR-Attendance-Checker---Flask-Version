"""Dashboard routes."""

from flask import Blueprint, render_template, session, redirect, url_for, jsonify
from database.db_manager import Database
from routes.auth_routes import login_required, admin_required
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/')
db = Database()


@dashboard_bp.route('/')
@dashboard_bp.route('/home')
@login_required
def home():
    """Home/Dashboard page."""
    username = session.get('username')
    user = db.get_user(username)
    
    if not user:
        return redirect(url_for('auth.logout'))
    
    # Get statistics
    events = db.get_all_events()
    total_events = len(events)
    total_attendance = len(db._execute("SELECT * FROM attendance", fetch_all=True) or [])
    users = db._execute("SELECT * FROM users", fetch_all=True) or []
    total_users = len(users)
    
    # Get recent attendance
    recent_attendance = db._execute(
        """SELECT * FROM attendance ORDER BY timestamp DESC LIMIT 10""",
        fetch_all=True
    ) or []
    
    return render_template(
        'dashboard.html',
        username=username,
        user_role=user[3],
        total_events=total_events,
        total_attendance=total_attendance,
        total_users=total_users,
        recent_attendance=recent_attendance
    )


@dashboard_bp.route('/activity-log')
@login_required
def activity_log():
    """Activity log page."""
    username = session.get('username')
    user = db.get_user(username)
    
    # Get activity logs
    activities = db._execute(
        """SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100""",
        fetch_all=True
    ) or []
    
    return render_template(
        'activity_log.html',
        username=username,
        user_role=user[3],
        activities=activities
    )


@dashboard_bp.route('/stats')
@login_required
def stats():
    """Statistics API endpoint."""
    username = session.get('username')
    
    # Get various statistics
    events = db.get_all_events()
    attendance_data = db._execute("SELECT * FROM attendance", fetch_all=True) or []
    
    # Prepare data for charts
    event_attendance = {}
    for event_id, user_id, user_name, timestamp, status, time_slot in attendance_data:
        if event_id not in event_attendance:
            event_attendance[event_id] = 0
        event_attendance[event_id] += 1
    
    return jsonify({
        'total_events': len(events) if events else 0,
        'total_attendance': len(attendance_data),
        'event_attendance': event_attendance,
        'username': username
    }), 200
