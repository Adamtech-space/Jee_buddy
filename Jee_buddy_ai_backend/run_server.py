import os
import sys

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from waitress import serve
from core.wsgi import application

if __name__ == '__main__':
    # Run the server on port 8000
    print('Starting Waitress server on http://localhost:8000...')
    serve(application, host='0.0.0.0', port=8000, threads=4) 