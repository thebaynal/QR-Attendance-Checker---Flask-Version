"""WSGI entry point for Azure App Service."""
import sys
import os

# Add app/src to path so flask_app can be found
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'src'))

from flask_app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
