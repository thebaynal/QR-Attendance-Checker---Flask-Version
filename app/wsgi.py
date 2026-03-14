"""
WSGI entry point for production deployment.
Used by Gunicorn to run the Flask application.
"""

import os
import sys

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from flask_app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
