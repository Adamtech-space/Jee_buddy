#!/bin/bash

# Activate virtual environment
source .venv/bin/activate

# Export environment variables
export DJANGO_SETTINGS_MODULE=core.settings

# Run with gunicorn
gunicorn --bind 0.0.0.0:8080 --workers 3 core.wsgi:application 