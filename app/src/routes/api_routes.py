"""API routes."""

from flask import Blueprint, request, jsonify, session
from database.db_manager import Database
from functools import wraps
import os
from dotenv import load_dotenv
from datetime import datetime
from config.constants import EMPLOYEES

# Load environment variables
load_dotenv()

api_bp = Blueprint('api', __name__)
db = Database()

API_KEY = os.getenv('API_KEY', 'mascan-api-key-2024')


def require_api_key(f):
    """Decorator to require API key."""
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != API_KEY:
            return jsonify({'error': 'Invalid or missing API key'}), 401
        return f(*args, **kwargs)
    return decorated


@api_bp.route('/status', methods=['GET'])
def status():
    """Status endpoint - no auth required."""
    return jsonify({
        'status': 'ok',
        'service': 'MaScan QR Attendance System',
        'version': '2.0.0'
    }), 200


@api_bp.route('/login', methods=['POST'])
def api_login():
    """API login endpoint."""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        authenticated_user = db.authenticate_user(username, password)
        
        if authenticated_user:
            db.record_login(username)
            return jsonify({
                'success': True,
                'username': username,
                'message': 'Login successful'
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/events', methods=['GET'])
@require_api_key
def api_get_events():
    """Get all events."""
    try:
        events = db.get_all_events()
        events_list = []
        
        if events:
            for event in events:
                events_list.append({
                    'id': event[0],
                    'name': event[1],
                    'date': event[2],
                    'description': event[3] if len(event) > 3 else ''
                })
        
        return jsonify({
            'success': True,
            'events': events_list
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/events/<event_id>/attendance', methods=['GET'])
@require_api_key
def api_get_attendance(event_id):
    """Get attendance for an event."""
    try:
        attendance = db._execute(
            "SELECT * FROM attendance WHERE event_id = ?",
            (event_id,),
            fetch_all=True
        ) or []
        
        attendance_list = []
        for record in attendance:
            attendance_list.append({
                'event_id': record[0],
                'user_id': record[1],
                'user_name': record[2],
                'timestamp': record[3],
                'status': record[4],
                'time_slot': record[5] if len(record) > 5 else 'morning'
            })
        
        return jsonify({
            'success': True,
            'attendance': attendance_list
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/attendance/mark', methods=['POST'])
@require_api_key
def api_mark_attendance():
    """Mark attendance via API."""
    try:
        data = request.get_json()
        event_id = data.get('event_id', '').strip()
        user_id = data.get('user_id', '').strip()
        time_slot = data.get('time_slot', 'morning').strip()
        
        if not event_id or not user_id:
            return jsonify({'error': 'Event ID and user ID required'}), 400
        
        # Verify event exists
        event = db.get_event(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        user_name = EMPLOYEES.get(user_id, f'Unknown ({user_id})')
        
        # Check if already marked
        existing = db._execute(
            "SELECT * FROM attendance WHERE event_id = ? AND user_id = ? AND time_slot = ?",
            (event_id, user_id, time_slot),
            fetch_one=True
        )
        
        if existing:
            return jsonify({
                'success': False,
                'message': f'{user_name} already marked for {time_slot}'
            }), 200
        
        # Add attendance
        timestamp = datetime.now().isoformat()
        db._execute(
            """INSERT INTO attendance 
               (event_id, user_id, user_name, timestamp, status, time_slot)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (event_id, user_id, user_name, timestamp, 'present', time_slot),
            commit=True
        )
        
        return jsonify({
            'success': True,
            'message': f'{user_name} marked as present'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/users', methods=['GET'])
@require_api_key
def api_get_users():
    """Get all users."""
    try:
        users = db._execute(
            "SELECT username, full_name, role FROM users",
            fetch_all=True
        ) or []
        
        users_list = []
        for user in users:
            users_list.append({
                'username': user[0],
                'full_name': user[1],
                'role': user[2]
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
