"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from django.urls import path, re_path
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

async def application(scope, receive, send):
    if scope["type"] == "http":
        # Add CORS headers for Vercel deployment
        if scope.get("method") == "OPTIONS":
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    [b"content-type", b"text/plain"],
                    [b"access-control-allow-origin", b"*"],
                    [b"access-control-allow-methods", b"GET, POST, OPTIONS"],
                    [b"access-control-allow-headers", b"Content-Type, Authorization"],
                ],
            })
            await send({"type": "http.response.body", "body": b""})
            return

    await django_asgi_app(scope, receive, send)
