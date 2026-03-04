"""
Configuration Django de base pour MeedNess.
Paramètres communs à tous les environnements.
"""

from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ═══════════════════════════════════════════════════════════════
# SÉCURITÉ
# ═══════════════════════════════════════════════════════════════

SECRET_KEY = config('DJANGO_SECRET_KEY')
DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', cast=Csv())

# ═══════════════════════════════════════════════════════════════
# APPLICATIONS
# ═══════════════════════════════════════════════════════════════

INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework_simplejwt.token_blacklist',
    
    # Third party
    'rest_framework',
    'corsheaders',
    'channels',
    'phonenumber_field',
    'drf_spectacular',
    
    # Apps MeedNess
    'apps.accounts',
    'apps.organizations',
    'apps.chat',
    'apps.tasks',
    'apps.objectives',
    'apps.meetings',
    'apps.votes',
    'apps.subscriptions',
]

# ═══════════════════════════════════════════════════════════════
# MIDDLEWARE
# ═══════════════════════════════════════════════════════════════

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS avant CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ═══════════════════════════════════════════════════════════════
# URL & WSGI/ASGI
# ═══════════════════════════════════════════════════════════════

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ═══════════════════════════════════════════════════════════════
# TEMPLATES
# ═══════════════════════════════════════════════════════════════

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

# ═══════════════════════════════════════════════════════════════
# BASE DE DONNÉES
# ═══════════════════════════════════════════════════════════════

DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE'),
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', cast=int),
    }
}

# ═══════════════════════════════════════════════════════════════
# MODÈLE UTILISATEUR PERSONNALISÉ
# ═══════════════════════════════════════════════════════════════

AUTH_USER_MODEL = 'accounts.User'

# ═══════════════════════════════════════════════════════════════
# VALIDATION DES MOTS DE PASSE
# ═══════════════════════════════════════════════════════════════

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ═══════════════════════════════════════════════════════════════
# INTERNATIONALISATION
# ═══════════════════════════════════════════════════════════════

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ═══════════════════════════════════════════════════════════════
# FICHIERS STATIQUES & MÉDIA
# ═══════════════════════════════════════════════════════════════

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ═══════════════════════════════════════════════════════════════
# DEFAULT PRIMARY KEY
# ═══════════════════════════════════════════════════════════════

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ═══════════════════════════════════════════════════════════════
# DJANGO REST FRAMEWORK
# ═══════════════════════════════════════════════════════════════

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ═══════════════════════════════════════════════════════════════
# SIMPLE JWT
# ═══════════════════════════════════════════════════════════════

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# ═══════════════════════════════════════════════════════════════
# CORS (Pour React Native)
# ═══════════════════════════════════════════════════════════════

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# ═══════════════════════════════════════════════════════════════
# CHANNELS (WebSockets)
# ═══════════════════════════════════════════════════════════════

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(config('REDIS_URL'))],
        },
    },
}

# ═══════════════════════════════════════════════════════════════
# CELERY
# ═══════════════════════════════════════════════════════════════

CELERY_BROKER_URL = config('CELERY_BROKER_URL')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# ═══════════════════════════════════════════════════════════════
# EMAIL
# ═══════════════════════════════════════════════════════════════

EMAIL_BACKEND = config('EMAIL_BACKEND')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# ═══════════════════════════════════════════════════════════════
# DRF SPECTACULAR (Documentation API)
# ═══════════════════════════════════════════════════════════════

SPECTACULAR_SETTINGS = {
    'TITLE': 'MeedNess API',
    'DESCRIPTION': 'API collaborative pour entreprises et familles',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}