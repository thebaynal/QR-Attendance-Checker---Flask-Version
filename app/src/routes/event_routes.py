"""Event management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from database.db_manager import Database
from routes.auth_routes import login_required, admin_required
import uuid
from datetime import datetime

event_bp = Blueprint('event', __name__, url_prefix='/events')
db = Database()


@event_bp.route('/')
@login_required
def list_events():
    """List all events."""
    username = session.get('username')
    user = db.get_user(username)
    
    events = db.get_all_events()
    
    return render_template(
        'events/list.html',
        username=username,
        user_role=user[3],
        events=events
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


@event_bp.route('/<event_id>/export')
@login_required
def export_event(event_id):
    """Export event attendance as PDF."""
    event = db.get_event(event_id)
    if not event:
        return redirect(url_for('event.list_events'))
    
    # Get attendance for this event
    attendance = db._execute(
        "SELECT * FROM attendance WHERE event_id = ? ORDER BY user_name",
        (event_id,),
        fetch_all=True
    ) or []
    
    # Generate PDF using the pdf_export utility
    from utils.pdf_export import generate_attendance_pdf
    from flask import send_file
    import io
    
    pdf_bytes = generate_attendance_pdf(event, attendance)
    
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"attendance_{event_id}.pdf"
    )
