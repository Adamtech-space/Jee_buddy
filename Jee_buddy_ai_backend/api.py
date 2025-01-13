from fastapi import FastAPI, Request
from fastapi.middleware.wsgi import WSGIMiddleware
from fastapi.responses import JSONResponse
import os
import sys

# Add the project root directory to Python path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django
import django
django.setup()

from django.core.wsgi import get_wsgi_application

# Create FastAPI app
app = FastAPI()

# Mount Django WSGI application
app.mount("/", WSGIMiddleware(get_wsgi_application())) 