from fastapi import FastAPI, Request
from fastapi.middleware.wsgi import WSGIMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import sys
import traceback

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
from django.core.exceptions import ValidationError

# Create FastAPI app
app = FastAPI(title="JEE Buddy API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"An error occurred: {str(exc)}"
    print(f"Error: {error_msg}")
    print(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mount Django WSGI application
django_app = get_wsgi_application()
app.mount("/", WSGIMiddleware(django_app)) 