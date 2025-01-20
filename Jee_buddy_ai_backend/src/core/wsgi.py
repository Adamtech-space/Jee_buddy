"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import django
from django.core.wsgi import get_wsgi_application
from django.core.handlers.wsgi import WSGIHandler
from django.apps import apps

# Set up Django's settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django
django.setup()

class VercelWSGIHandler(WSGIHandler):
    def __init__(self):
        # Ensure apps are loaded
        if not apps.apps_ready:
            django.setup()
        super().__init__()

    def __call__(self, environ, start_response):
        # Add CORS headers for Vercel
        def custom_start_response(status, headers, exc_info=None):
            cors_headers = [
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
            ]
            headers.extend(cors_headers)
            return start_response(status, headers, exc_info)
        
        return super().__call__(environ, custom_start_response)

# Initialize the application
application = VercelWSGIHandler()

# For Vercel
app = application