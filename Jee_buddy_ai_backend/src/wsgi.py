# WSGI config for Django project
import os
import sys
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    application = get_wsgi_application()
    print("WSGI application created successfully")
except Exception as e:
    print(f"Error creating WSGI application: {str(e)}")
    print(f"Python path: {sys.path}")
    print(f"Current working directory: {os.getcwd()}")
    raise

app = application