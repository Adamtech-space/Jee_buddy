"""
WSGI config for Django project.
"""

import os
from django.core.wsgi import get_wsgi_application
from django.conf import settings
from django.contrib.staticfiles.handlers import StaticFilesHandler

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')

if settings.DEBUG:
    application = StaticFilesHandler(get_wsgi_application())
else:
    application = get_wsgi_application()

# Vercel needs the variable to be named 'app'
app = application 