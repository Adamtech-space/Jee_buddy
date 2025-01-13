import os
import sys

# Add the project root directory to Python path
path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.append(path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.wsgi import get_wsgi_application
from django.core.handlers.wsgi import WSGIRequest

# Initialize Django WSGI application
django_application = get_wsgi_application()

async def handler(request):
    """
    Vercel serverless function handler
    """
    # Create a WSGI environment from the request
    environ = {
        'REQUEST_METHOD': request.method,
        'SCRIPT_NAME': '',
        'PATH_INFO': request.url.path,
        'QUERY_STRING': request.url.query,
        'SERVER_PROTOCOL': 'HTTP/1.1',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'https',
        'wsgi.input': request.body,
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }

    # Add HTTP headers
    for key, value in request.headers.items():
        key = key.upper().replace('-', '_')
        if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            key = f'HTTP_{key}'
        environ[key] = value

    # Call Django application
    response = django_application(environ)
    
    # Return response
    return {
        'statusCode': response.status_code,
        'headers': dict(response.headers),
        'body': response.content
    } 