#!/usr/bin/env python3
"""
Flask Application Entry Point
Run this to start the MaScan Flask Application
"""

import os
import sys

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from flask_app import create_app

app = create_app()

if __name__ == '__main__':
<<<<<<< HEAD
    app = create_app()

=======
    
>>>>>>> ffd5a9f305cae5c744fb7f1aa1b902697aef5ea6
    # Configuration
    debug_mode = os.getenv('DEBUG', 'True').lower() == 'true'
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    
    print(f"""
    ========================================================
    MaScan - QR Attendance System
    Flask Web Application
    ========================================================
    
    Starting server...
    - Debug Mode: {debug_mode}
    - URL: http://{host if host != '0.0.0.0' else 'localhost'}:{port}
    - Press CTRL+C to stop
    """)
    
    app.run(debug=debug_mode, host=host, port=port, use_reloader=True)
