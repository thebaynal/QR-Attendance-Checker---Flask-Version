"""Main Flask application for MaScan Attendance System."""

from flask import Flask, render_template
from flask_cors import CORS
from flask_session import Session
import os
from dotenv import load_dotenv
from config.constants import *

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__, 
                template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
                static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mascan-attendance-secret-key-2024')
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = os.getenv('SESSION_FILE_DIR', os.path.join(os.path.dirname(__file__), '..', '..', 'flask_session'))
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file upload
    
    # Enable CORS
    CORS(app)
    
    # Initialize Flask-Session
    Session(app)
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.event_routes import event_bp
    from routes.attendance_routes import attendance_bp
    from routes.user_routes import user_bp
    from routes.api_routes import api_bp
    from routes.qr_management_routes import qr_mgmt_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(qr_mgmt_bp)
    
    # Custom error handlers
    @app.errorhandler(404)
    def not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html'), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
