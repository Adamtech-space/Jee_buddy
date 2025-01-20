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
        if not apps.apps_ready:
            django.setup()
        super().__init__()

    def __call__(self, environ, start_response):
        # Remove the custom CORS header addition since Django's CORS middleware handles it
        return super().__call__(environ, start_response)

# Initialize the application
application = VercelWSGIHandler()

# For Vercel
app = application