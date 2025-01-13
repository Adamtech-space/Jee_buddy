from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import sys
import traceback
from typing import Union
import asyncio
from urllib.parse import urlparse

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

from django.core.handlers.wsgi import WSGIHandler
from django.core.wsgi import get_wsgi_application
from django.urls import resolve
import django.core.handlers.wsgi

# Create FastAPI app
app = FastAPI(title="JEE Buddy API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Django WSGI handler
django_application = get_wsgi_application()

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Main catch-all route for Django
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def catch_all(request: Request, path: str):
    try:
        # Prepare the WSGI environment
        environ = {
            'REQUEST_METHOD': request.method,
            'SCRIPT_NAME': '',
            'PATH_INFO': request.url.path,
            'QUERY_STRING': str(request.url.query),
            'SERVER_PROTOCOL': 'HTTP/1.1',
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': request.url.scheme or 'https',
            'wsgi.input': request.scope.get('_body', b''),
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': False,
            'wsgi.run_once': False,
        }

        # Add headers
        for key, value in request.headers.items():
            key = key.upper().replace('-', '_')
            if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
                key = f'HTTP_{key}'
            environ[key] = value

        # Get the response from Django
        response_body = []
        def start_response(status, headers):
            nonlocal response_body
            return response_body.append

        # Call Django application
        response_content = django_application(environ, start_response)
        if isinstance(response_content, (bytes, str)):
            response_body = [response_content]
        else:
            response_body.extend(response_content)

        # Convert response to string if it's bytes
        content = b''.join(response_body) if isinstance(response_body[0], bytes) else ''.join(response_body)
        
        return Response(
            content=content,
            status_code=200,
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Server error: {str(e)}"}
        ) 