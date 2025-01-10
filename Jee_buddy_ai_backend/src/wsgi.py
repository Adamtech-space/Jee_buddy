"""
WSGI config for Django project.
"""

import os
import sys

# Add the project root directory to the Python path
root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_path = os.path.join(root_path, 'src')
if root_path not in sys.path:
    sys.path.append(root_path)
if src_path not in sys.path:
    sys.path.append(src_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')

try:
    from django.core.wsgi import get_wsgi_application
    print("Python path:", sys.path)
    print("Current directory:", os.getcwd())
    print("Settings module:", os.environ.get('DJANGO_SETTINGS_MODULE'))
    
    application = get_wsgi_application()
    print("WSGI application created successfully")
except Exception as e:
    print(f"Error creating WSGI application: {str(e)}")
    print(f"Python path: {sys.path}")
    print(f"Current working directory: {os.getcwd()}")
    raise

# Vercel needs the variable to be named 'app'
app = application 