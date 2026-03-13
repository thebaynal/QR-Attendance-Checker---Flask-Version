"""QR Code Management routes - CSV import and QR code generation."""

from flask import Blueprint, render_template, request, session, jsonify, send_file, redirect, url_for
from database.db_manager import Database
from routes.auth_routes import login_required, admin_required
import csv
import io
import qrcode
from datetime import datetime
import uuid
import json
import zipfile

qr_mgmt_bp = Blueprint('qr_mgmt', __name__, url_prefix='/qr-management')
db = Database()


@qr_mgmt_bp.route('/')
@admin_required
def manage_qr():
    """QR Management page - CSV upload and QR generation."""
    username = session.get('username')
    user = db.get_user(username)
    
    # Get all students with QR codes including section, year, and course info
    students = db._execute(
        "SELECT school_id, name, last_name, first_name, middle_initial, qr_data, section, year_level, course FROM students_qrcodes ORDER BY created_at DESC",
        fetch_all=True
    ) or []
    
    return render_template(
        'qr/manage.html',
        username=username,
        user_role=user[3],
        students=students
    )


@qr_mgmt_bp.route('/upload-csv', methods=['POST'])
@admin_required
def upload_csv():
    """Handle CSV file upload and generate QR codes."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV file'}), 400
        
        # Read CSV file
        stream = io.StringIO(file.stream.read().decode('utf-8'), newline=None)
        csv_data = csv.DictReader(stream)
        
        if not csv_data.fieldnames:
            return jsonify({'error': 'Invalid CSV file'}), 400
        
        generated_students = []
        errors = []
        
        for idx, row in enumerate(csv_data, start=2):  # Start at 2 (after header)
            try:
                # Extract data from CSV - adjust field names as needed
                school_id = row.get('School ID') or row.get('ID') or row.get('StudentID')
                name = row.get('Name') or row.get('Full Name') or row.get('Student Name')
                first_name = row.get('First Name', '')
                last_name = row.get('Last Name', '')
                middle_initial = row.get('Middle Initial', '')
                year_level = row.get('Year', '') or row.get('Year Level', '')
                section = row.get('Section', '') or row.get('Class', '')
                course = row.get('Course', '')
                
                # Validate required fields
                if not school_id or not name:
                    errors.append(f"Row {idx}: Missing School ID or Name")
                    continue
                
                # Check if student already exists
                existing = db._execute(
                    "SELECT school_id FROM students_qrcodes WHERE school_id = ?",
                    (school_id,),
                    fetch_one=True
                )
                
                # Generate QR code
                qr_data = f"{school_id}:{name}"
                
                # Create QR code image
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(qr_data)
                qr.make(fit=True)
                
                # Convert QR to base64 encoded image
                img = qr.make_image(fill_color="black", back_color="white")
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='PNG')
                img_byte_arr.seek(0)
                import base64
                qr_data_encoded = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
                
                # Store CSV data as JSON
                csv_record = {
                    'Course': course,
                    'Year': year_level,
                    'Section': section,
                    'FirstName': first_name,
                    'LastName': last_name,
                    'MiddleInitial': middle_initial
                }
                csv_data_json = json.dumps(csv_record)
                
                if existing:
                    # Update existing student
                    db.update_student(
                        school_id=school_id,
                        name=name,
                        qr_data=qr_data,
                        qr_data_encoded=qr_data_encoded,
                        csv_data=csv_data_json,
                        first_name=first_name,
                        last_name=last_name,
                        middle_initial=middle_initial,
                        year_level=year_level,
                        section=section,
                        course=course
                    )
                    generated_students.append({
                        'school_id': school_id,
                        'name': name,
                        'action': 'updated',
                        'qr_data_encoded': qr_data_encoded
                    })
                else:
                    # Create new student
                    db.create_student(
                        school_id=school_id,
                        name=name,
                        qr_data=qr_data,
                        qr_data_encoded=qr_data_encoded,
                        csv_data=csv_data_json,
                        first_name=first_name,
                        last_name=last_name,
                        middle_initial=middle_initial,
                        year_level=year_level,
                        section=section,
                        course=course
                    )
                    generated_students.append({
                        'school_id': school_id,
                        'name': name,
                        'action': 'created',
                        'qr_data_encoded': qr_data_encoded
                    })
                
            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")
                continue
        
        if not generated_students and errors:
            return jsonify({
                'success': False,
                'message': 'No students processed',
                'errors': errors
            }), 400
        
        return jsonify({
            'success': True,
            'message': f'Successfully processed {len(generated_students)} students',
            'count': len(generated_students),
            'students': generated_students,
            'errors': errors if errors else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error processing CSV: {str(e)}'}), 500


@qr_mgmt_bp.route('/generate-single', methods=['POST'])
@admin_required
def generate_single():
    """Generate a single QR code from form data."""
    try:
        data = request.get_json()
        
        school_id = data.get('school_id')
        name = data.get('name')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        middle_initial = data.get('middle_initial', '')
        year_level = data.get('year_level', '')
        section = data.get('section', '')
        course = data.get('course', '')
        
        # Validate required fields
        if not school_id or not name:
            return jsonify({'success': False, 'message': 'School ID and Name are required'}), 400
            
        # Check if student already exists
        existing = db._execute(
            "SELECT school_id FROM students_qrcodes WHERE school_id = ?",
            (school_id,),
            fetch_one=True
        )
        
        # Generate QR code
        qr_data = f"{school_id}:{name}"
        
        # Create QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Convert QR to base64 encoded image
        img = qr.make_image(fill_color="black", back_color="white")
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        import base64
        qr_data_encoded = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        # Store CSV data as JSON
        csv_record = {
            'Course': course,
            'Year': year_level,
            'Section': section,
            'FirstName': first_name,
            'LastName': last_name,
            'MiddleInitial': middle_initial
        }
        csv_data_json = json.dumps(csv_record)
        
        action_msg = ''
        if existing:
            # Update existing student
            db.update_student(
                school_id=school_id,
                name=name,
                qr_data=qr_data,
                qr_data_encoded=qr_data_encoded,
                csv_data=csv_data_json,
                first_name=first_name,
                last_name=last_name,
                middle_initial=middle_initial,
                year_level=year_level,
                section=section,
                course=course
            )
            action_msg = 'updated'
        else:
            # Create new student
            db.create_student(
                school_id=school_id,
                name=name,
                qr_data=qr_data,
                qr_data_encoded=qr_data_encoded,
                csv_data=csv_data_json,
                first_name=first_name,
                last_name=last_name,
                middle_initial=middle_initial,
                year_level=year_level,
                section=section,
                course=course
            )
            action_msg = 'created'
            
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (datetime.now().isoformat(), 'GENERATE_SINGLE_QR', username, f'{action_msg.capitalize()} QR code for {school_id}'),
            commit=True
        )
            
        return jsonify({
            'success': True,
            'message': f'Successfully {action_msg} QR code for {name}',
            'action': action_msg
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error generating QR code: {str(e)}'}), 500


@qr_mgmt_bp.route('/qr-codes', methods=['GET'])
@admin_required
def get_qr_codes():
    """Get all QR codes with section, year, and course information."""
    try:
        students = db._execute(
            "SELECT school_id, name, qr_data_encoded, section, year_level, course FROM students_qrcodes ORDER BY created_at DESC",
            fetch_all=True
        ) or []
        
        qr_codes = [
            {
                'school_id': row[0],
                'name': row[1],
                'qr_image': row[2],
                'section': row[3],
                'year': row[4],
                'course': row[5]
            }
            for row in students
        ]
        
        return jsonify({
            'success': True,
            'qr_codes': qr_codes,
            'count': len(qr_codes)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@qr_mgmt_bp.route('/download-all-qr', methods=['GET'])
@admin_required
def download_all_qr():
    """Download all QR codes as a ZIP file."""
    try:
        students = db._execute(
            "SELECT school_id, name, qr_data_encoded FROM students_qrcodes ORDER BY school_id",
            fetch_all=True
        ) or []
        
        if not students:
            return jsonify({'error': 'No QR codes to download'}), 404
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for student in students:
                school_id, name, qr_encoded = student
                
                # Decode base64 image
                import base64
                qr_image_data = base64.b64decode(qr_encoded)
                
                # Add to ZIP with filename
                filename = f"{school_id}_{name.replace(' ', '_')}.png"
                zip_file.writestr(filename, qr_image_data)
        
        zip_buffer.seek(0)
        
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (datetime.now().isoformat(), 'DOWNLOAD_QR_CODES', username, f'Downloaded {len(students)} QR codes'),
            commit=True
        )
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'QR_Codes_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@qr_mgmt_bp.route('/download-qr/<school_id>', methods=['GET'])
@admin_required
def download_single_qr(school_id):
    """Download a single QR code."""
    try:
        student = db._execute(
            "SELECT name, qr_data_encoded FROM students_qrcodes WHERE school_id = ?",
            (school_id,),
            fetch_one=True
        )
        
        if not student:
            return jsonify({'error': 'QR code not found'}), 404
        
        name, qr_encoded = student
        
        # Decode base64 image
        import base64
        qr_image_data = base64.b64decode(qr_encoded)
        
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (datetime.now().isoformat(), 'DOWNLOAD_QR_CODE', username, f'Downloaded QR code for {school_id}'),
            commit=True
        )
        
        return send_file(
            io.BytesIO(qr_image_data),
            mimetype='image/png',
            as_attachment=True,
            download_name=f'{school_id}_{name.replace(" ", "_")}.png'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@qr_mgmt_bp.route('/delete-qr/<school_id>', methods=['POST'])
@admin_required
def delete_qr(school_id):
    """Delete a QR code entry."""
    try:
        db._execute(
            "DELETE FROM students_qrcodes WHERE school_id = ?",
            (school_id,),
            commit=True
        )
        
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (datetime.now().isoformat(), 'DELETE_QR_CODE', username, f'Deleted QR code for {school_id}'),
            commit=True
        )
        
        return jsonify({
            'success': True,
            'message': 'QR code deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@qr_mgmt_bp.route('/delete-bulk-qr', methods=['POST'])
@admin_required
def delete_bulk_qr():
    """Delete multiple QR code entries."""
    try:
        data = request.get_json()
        school_ids = data.get('school_ids', [])
        
        if not school_ids:
            return jsonify({'error': 'No QR codes selected'}), 400
        
        # Delete multiple records
        placeholders = ','.join('?' * len(school_ids))
        db._execute(
            f"DELETE FROM students_qrcodes WHERE school_id IN ({placeholders})",
            tuple(school_ids),
            commit=True
        )
        
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (datetime.now().isoformat(), 'DELETE_BULK_QR_CODES', username, f'Deleted {len(school_ids)} QR codes'),
            commit=True
        )
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {len(school_ids)} QR codes',
            'deleted_count': len(school_ids)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@qr_mgmt_bp.route('/export-csv', methods=['GET'])
@admin_required
def export_csv():
    """Export all students with QR codes as CSV."""
    try:
        students = db._execute(
            "SELECT school_id, name, first_name, last_name, middle_initial, qr_data FROM students_qrcodes ORDER BY school_id",
            fetch_all=True
        ) or []
        
        if not students:
            return jsonify({'error': 'No students to export'}), 404
        
        # Create CSV in memory
        csv_buffer = io.StringIO()
        fieldnames = ['School ID', 'Full Name', 'First Name', 'Last Name', 'Middle Initial', 'QR Data']
        writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
        
        writer.writeheader()
        for student in students:
            writer.writerow({
                'School ID': student[0],
                'Full Name': student[1],
                'First Name': student[2],
                'Last Name': student[3],
                'Middle Initial': student[4],
                'QR Data': student[5]
            })
        
        # Record activity
        username = session.get('username')
        db._execute(
            """INSERT INTO activity_log 
               (timestamp, action, user, details)
               VALUES (?, ?, ?, ?)""",
            (datetime.now().isoformat(), 'EXPORT_STUDENTS_CSV', username, f'Exported {len(students)} student records'),
            commit=True
        )
        
        return send_file(
            io.BytesIO(csv_buffer.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'Students_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
