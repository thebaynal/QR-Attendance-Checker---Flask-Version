#!/bin/bash
mkdir -p /home/data /home/flask_session
cd /home/site/wwwroot/app/src
gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 120 "flask_app:create_app()"
