from fastapi import FastAPI, Request
from fastapi.middleware.wsgi import WSGIMiddleware
from fastapi.responses import JSONResponse
import os
import sys

# Add the project root directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django
import django
django.setup()

from django.core.wsgi import get_wsgi_application

# Create FastAPI app
app = FastAPI()

# Mount Django WSGI application
django_app = get_wsgi_application()
app.mount("/", WSGIMiddleware(django_app)) 