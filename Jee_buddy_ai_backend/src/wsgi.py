"""
WSGI config for Django project.
"""

import os
import sys
from django.core.wsgi import get_wsgi_application
from django.conf import settings

# Add the project directory to the Python path
path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.append(path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')

try:
    application = get_wsgi_application()
    print("WSGI application created successfully")
except Exception as e:
    print(f"Error creating WSGI application: {str(e)}")
    raise

# Vercel needs the variable to be named 'app'
app = application 