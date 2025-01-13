from django.core.wsgi import get_wsgi_application
import os
import sys

# Add the project root directory to Python path
path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.append(path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django WSGI application
app = get_wsgi_application()

# This is what Vercel looks for:
def handler(request):
    return app(request) 