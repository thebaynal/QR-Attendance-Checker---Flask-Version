"""QR Scanning and attendance routes."""

from flask import Blueprint, render_template, request, session, jsonify, redirect, url_for
from database.db_manager import Database
from routes.auth_routes import login_required
from datetime import datetime
import uuid

attendance_bp = Blueprint('attendance', __name__, url_prefix='/scan')
db = Database()


@attendance_bp.route('/')
@login_required
def scanner():
    """QR Scanner page."""
    username = session.get('username')
    user = db.get_user(username)
    
    # Get active events
    events = db.get_all_events()
    
    return render_template(
        'scanner.html',
        username=username,
        user_role=user[3],
        events=events
    )


@attendance_bp.route('/mark', methods=['POST'])
@login_required
def mark_attendance():
    """Mark attendance for a user via QR code."""
    try:
        data = request.get_json()
        event_id = data.get('event_id', '').strip()
        qr_data = data.get('qr_data', '').strip()
        time_slot = data.get('time_slot', 'morning').strip()
        
        if not event_id or not qr_data:
            return jsonify({'error': 'Event ID and QR data required'}), 400
        
        # Verify event exists
        event = db.get_event(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Parse QR data - format: "E101:Alice Smith" or employee code
        from config.constants import EMPLOYEES
        
        if ':' in qr_data:
            user_id, user_name = qr_data.split(':', 1)
            user_name = user_name.strip()
        else:
            user_id = qr_data
            user_name = EMPLOYEES.get(user_id, f'Unknown ({user_id})')
        
        # Check if already marked attendance in this time slot
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
        
        # Add attendance record
        timestamp = datetime.now().isoformat()
        db._execute(
            """INSERT INTO attendance 
               (event_id, user_id, user_name, timestamp, status, time_slot)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (event_id, user_id, user_name, timestamp, 'present', time_slot),
            commit=True
        )
        
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (timestamp, 'MARK_ATTENDANCE', username, f'{user_name} marked at {event_id}'),
            commit=True
        )
        
        return jsonify({
            'success': True,
            'message': f'{user_name} marked as present',
            'user_id': user_id,
            'user_name': user_name
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/history/<event_id>')
@login_required
def attendance_history(event_id):
    """View attendance history for an event."""
    username = session.get('username')
    user = db.get_user(username)
    
    event = db.get_event(event_id)
    if not event:
        return redirect(url_for('event.list_events'))
    
    # Get attendance grouped by time slot
    attendance = db._execute(
        "SELECT * FROM attendance WHERE event_id = ? ORDER BY time_slot, timestamp",
        (event_id,),
        fetch_all=True
    ) or []
    
    # Group by time slot
    by_slot = {}
    for record in attendance:
        slot = record[5] if len(record) > 5 else 'morning'
        if slot not in by_slot:
            by_slot[slot] = []
        by_slot[slot].append(record)
    
    return render_template(
        'attendance_history.html',
        username=username,
        user_role=user[3],
        event=event,
        attendance_by_slot=by_slot
    )


@attendance_bp.route('/api/attendees/<event_id>', methods=['GET'])
@login_required
def get_event_attendees(event_id):
    """Get all marked attendees for an event."""
    try:
        time_slot = request.args.get('time_slot', 'morning')
        
        # Fetch all attendance records for this event and time slot
        attendees = db._execute(
            """SELECT user_id, user_name, timestamp 
               FROM attendance 
               WHERE event_id = ? AND time_slot = ?
               ORDER BY timestamp DESC""",
            (event_id, time_slot),
            fetch_all=True
        ) or []
        
        return jsonify({
            'success': True,
            'attendees': [
                {
                    'user_id': record[0],
                    'user_name': record[1],
                    'timestamp': record[2]
                }
                for record in attendees
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/api/quick-mark', methods=['POST'])
@login_required
def quick_mark():
    """Quick mark attendance endpoint."""
    try:
        data = request.get_json()
        event_id = data.get('event_id')
        user_id = data.get('user_id')
        
        if not event_id or not user_id:
            return jsonify({'error': 'Missing parameters'}), 400
        
        from config.constants import EMPLOYEES
        user_name = EMPLOYEES.get(user_id, f'Unknown ({user_id})')
        
        timestamp = datetime.now().isoformat()
        db._execute(
            """INSERT OR IGNORE INTO attendance 
               (event_id, user_id, user_name, timestamp, status, time_slot)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (event_id, user_id, user_name, timestamp, 'present', 'morning'),
            commit=True
        )
        
        return jsonify({'success': True, 'message': f'Marked {user_name}'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
