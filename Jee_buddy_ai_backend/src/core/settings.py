"""
Django settings for core project.

Generated by 'django-admin startproject' using Django 5.1.4.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
import dj_database_url
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-dd16kn&trh7p3@j5r8917v9ac4z4!2&49f-544+4d6f1#d)4uv'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


<<<<<<< HEAD
DEBUG = os.getenv('DEBUG', 'False') == 'True'

<<<<<<< HEAD
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '.vercel.app,localhost,127.0.0.1').split(',')
=======
=======
>>>>>>> 678225a023db042a2589713d3a262852255f01a6
ALLOWED_HOSTS = [
    'localhost',
    'python-backend-env-1.eba-5hzqwm2u.ap-south-1.elasticbeanstalk.com',
    '127.0.0.1',
    '[::1]',  # IPv6 localhost
    '.amazonaws.com',
    '.vercel.app'
]
<<<<<<< HEAD
>>>>>>> 510a5637e79fe504f442834022d9db4a8f774a73
=======
>>>>>>> 678225a023db042a2589713d3a262852255f01a6


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'main',
    'user',
    'subscription',
]


ASGI_APPLICATION = 'config.asgi.application'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
<<<<<<< HEAD
<<<<<<< HEAD
=======
    'whitenoise.middleware.WhiteNoiseMiddleware',
>>>>>>> 510a5637e79fe504f442834022d9db4a8f774a73
=======
    'whitenoise.middleware.WhiteNoiseMiddleware',
>>>>>>> 678225a023db042a2589713d3a262852255f01a6
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]



REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # Change this to False
CORS_ALLOW_CREDENTIALS = True



CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Remove any duplicate INSTALLED_APPS
if 'rest_framework.authtoken' in INSTALLED_APPS:
    INSTALLED_APPS.remove('rest_framework.authtoken')

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('SUPABASE_DB_NAME', 'postgres'),
        'USER': os.getenv('SUPABASE_DB_USER', 'postgres'),
        'PASSWORD': os.getenv('SUPABASE_DB_PASSWORD'),
        'HOST': os.getenv('SUPABASE_DB_HOST'),
        'PORT': os.getenv('SUPABASE_DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require' if os.getenv('DATABASE_SSL_REQUIRE', 'true').lower() == 'true' else 'disable',
        }
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
<<<<<<< HEAD
<<<<<<< HEAD
=======
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

>>>>>>> 510a5637e79fe504f442834022d9db4a8f774a73
=======
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

>>>>>>> 678225a023db042a2589713d3a262852255f01a6
# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# AWS Lambda Settings
if 'LAMBDA_TASK_ROOT' in os.environ:
    ALLOWED_HOSTS = ['*']
    DEBUG = False
    
    # Static files
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
    
    # Security settings
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True











































