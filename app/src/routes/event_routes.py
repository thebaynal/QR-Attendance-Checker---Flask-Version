"""Event management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from database.db_manager import Database
from routes.auth_routes import login_required, admin_required
import uuid
from datetime import datetime, timezone, timedelta

# Philippine timezone (UTC+8)
PH_TZ = timezone(timedelta(hours=8))

def now_ph():
    """Return current datetime in Philippine time."""
    return datetime.now(PH_TZ)

event_bp = Blueprint('event', __name__, url_prefix='/events')
db = Database()


def safe_parse_date(date_str):
    """Safely parse a date string. Returns a date object or a very future date if invalid."""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        # Return a date far in the future so invalid dates appear at the end of future events
        return datetime(9999, 12, 31).date()


@event_bp.route('/')
@login_required
def list_events():
    """List all events."""
    username = session.get('username')
    user = db.get_user(username)
    
    events = db.get_all_events()
    
    # Sort events: today first, then past (descending), then future (ascending)
    today = now_ph().date()
    
    today_events = []
    past_events = []
    future_events = []
    
    for event in events:
        try:
            # Parse event date (assuming format: YYYY-MM-DD)
            event_date = datetime.strptime(event[2], '%Y-%m-%d').date()
            
            if event_date == today:
                today_events.append(event)
            elif event_date < today:
                past_events.append(event)
            else:
                future_events.append(event)
        except ValueError:
            # If date parsing fails, put event in future events
            future_events.append(event)
    
    # Sort past events by date descending (most recent first)
    past_events.sort(key=lambda e: safe_parse_date(e[2]), reverse=True)
    
    # Sort future events by date ascending (soonest first)
    future_events.sort(key=lambda e: safe_parse_date(e[2]))
    
    return render_template(
        'events/list.html',
        username=username,
        user_role=user[3],
        today_events=today_events,
        past_events=past_events,
        future_events=future_events
    )


@event_bp.route('/create', methods=['GET', 'POST'])
@admin_required
def create_event():
    """Create new event."""
    username = session.get('username')
    user = db.get_user(username)
    
    if request.method == 'POST':
        event_name = request.form.get('name', '').strip()
        event_date = request.form.get('date', '').strip()
        description = request.form.get('description', '').strip()
        
        if not event_name or not event_date:
            return render_template(
                'events/create.html',
                username=username,
                user_role=user[3],
                error='Event name and date are required'
            )
        
        # Validate date format
        try:
            event_date_obj = datetime.strptime(event_date, '%Y-%m-%d').date()
        except ValueError:
            return render_template(
                'events/create.html',
                username=username,
                user_role=user[3],
                error='Invalid date format. Please use YYYY-MM-DD.'
            )
        
        # Restrict to today or future
        today = now_ph().date()
        if event_date_obj < today:
            return render_template(
                'events/create.html',
                username=username,
                user_role=user[3],
                error='Event date cannot be in the past.'
            )
        
        # Create event
        event_id = str(uuid.uuid4())
        db.add_event(event_id, event_name, event_date, description)
        
        return redirect(url_for('event.list_events'))
    
    return render_template(
        'events/create.html',
        username=username,
        user_role=user[3]
    )


@event_bp.route('/<event_id>')
@login_required
def view_event(event_id):
    """View event details and attendance."""
    username = session.get('username')
    user = db.get_user(username)
    
    event = db.get_event(event_id)
    if not event:
        return redirect(url_for('event.list_events'))
    
    # Get attendance for this event
    attendance = db._execute(
        "SELECT * FROM attendance WHERE event_id = ? ORDER BY timestamp DESC",
        (event_id,),
        fetch_all=True
    ) or []
    
    return render_template(
        'events/view.html',
        username=username,
        user_role=user[3],
        event=event,
        attendance=attendance
    )


@event_bp.route('/<event_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_event(event_id):
    """Edit event."""
    username = session.get('username')
    user = db.get_user(username)
    
    event = db.get_event(event_id)
    if not event:
        return redirect(url_for('event.list_events'))
    
    if request.method == 'POST':
        event_name = request.form.get('name', '').strip()
        event_date = request.form.get('date', '').strip()
        description = request.form.get('description', '').strip()
        
        if not event_name or not event_date:
            return render_template(
                'events/edit.html',
                username=username,
                user_role=user[3],
                event=event,
                error='Event name and date are required'
            )
        
        # Validate date format
        try:
            event_date_obj = datetime.strptime(event_date, '%Y-%m-%d').date()
        except ValueError:
            return render_template(
                'events/edit.html',
                username=username,
                user_role=user[3],
                event=event,
                error='Invalid date format. Please use YYYY-MM-DD.'
            )
            
        # Restrict to today or future
        today = now_ph().date()
        if event_date_obj < today:
            return render_template(
                'events/edit.html',
                username=username,
                user_role=user[3],
                event=event,
                error='Event date cannot be in the past.'
            )
        
        db._execute(
            "UPDATE events SET name = ?, date = ?, description = ? WHERE id = ?",
            (event_name, event_date, description, event_id),
            commit=True
        )
        
        return redirect(url_for('event.view_event', event_id=event_id))
    
    return render_template(
        'events/edit.html',
        username=username,
        user_role=user[3],
        event=event
    )


@event_bp.route('/<event_id>/delete', methods=['POST'])
@admin_required
def delete_event(event_id):
    """Delete event."""
    event = db.get_event(event_id)
    if event:
        db._execute("DELETE FROM events WHERE id = ?", (event_id,), commit=True)
        db._execute("DELETE FROM attendance WHERE event_id = ?", (event_id,), commit=True)
    
    return redirect(url_for('event.list_events'))


@event_bp.route('/<event_id>/export-api', methods=['GET'])
@login_required
def export_event_api(event_id):
    """API endpoint for PDF export with JSON error responses."""
    try:
        event = db.get_event(event_id)
        if not event:
            return jsonify({'success': False, 'error': 'Event not found'}), 404
        
        # Check if there's any attendance data
        try:
            attendance_data = db.get_attendance_by_section(event_id)
            has_data = attendance_data and any(students for students in attendance_data.values())
        except:
            # Fallback check
            attendance_count = db._execute(
                "SELECT COUNT(*) FROM attendance WHERE event_id = ?",
                (event_id,),
                fetch_all=True
            )
            has_data = attendance_count and attendance_count[0][0] > 0
        
        if not has_data:
            return jsonify({
                'success': False, 
                'error': 'No attendance records found',
                'message': 'Please mark some attendance before exporting'
            }), 400
        
        from utils.pdf_export import AttendancePDFExporter
        from flask import send_file
        import io
        
        exporter = AttendancePDFExporter(db)
        buffer = io.BytesIO()
        exporter.export_attendance(event_id, buffer)
        buffer.seek(0)
        
        # Clean event name for filename
        safe_name = "".join(c for c in event[1] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:
            safe_name = "event"
        
        # Log the activity
        username = session.get('username')
        db._execute(
            "INSERT INTO activity_log (timestamp, action, user, details) VALUES (?, ?, ?, ?)",
            (datetime.now().isoformat(), 'EXPORT_ATTENDANCE_PDF', username, f'Exported attendance for event {event[1]}'),
            commit=True
        )
            
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"attendance_{safe_name}.pdf"
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to generate PDF', 'message': str(e)}), 500


@event_bp.route('/<event_id>/export')
@login_required
def export_event(event_id):
    """Export event attendance as PDF (redirects to API endpoint)."""
    return redirect(url_for('event.export_event_api', event_id=event_id))
