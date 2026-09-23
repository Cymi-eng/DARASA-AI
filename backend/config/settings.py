"""
Django settings for config project.
"""

import os
from pathlib import Path

import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent


# -----------------------------------------------------------------------------
# Core configuration
# -----------------------------------------------------------------------------

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-change-this",
)

DEBUG = os.getenv(
    "DJANGO_DEBUG",
    "True",
).lower() in {
    "1",
    "true",
    "yes",
    "on",
}


ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if host.strip()
]


# -----------------------------------------------------------------------------
# Applications
# -----------------------------------------------------------------------------

INSTALLED_APPS = [
     "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework_simplejwt",

    "core.apps.CoreConfig",
]


# -----------------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------------

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"


# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "",
).strip()


if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=not DEBUG,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# -----------------------------------------------------------------------------
# Password validation
# -----------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# -----------------------------------------------------------------------------
# Internationalization
# -----------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Africa/Nairobi"

USE_I18N = True

USE_TZ = True


# -----------------------------------------------------------------------------
# Static files
# -----------------------------------------------------------------------------

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


STORAGES = {
    "default": {
        "BACKEND": (
            "django.core.files.storage."
            "FileSystemStorage"
        ),
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage."
            "CompressedManifestStaticFilesStorage"
        ),
    },
}


# -----------------------------------------------------------------------------
# Default primary key
# -----------------------------------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# -----------------------------------------------------------------------------
# Django REST Framework
# -----------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        (
            "rest_framework_simplejwt."
            "authentication.JWTAuthentication"
        ),
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 25,
    "DEFAULT_THROTTLE_CLASSES": [
        (
            "rest_framework.throttling."
            "AnonRateThrottle"
        ),
        (
            "rest_framework.throttling."
            "UserRateThrottle"
        ),
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "120/minute",
    },
}


# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SECURE_SSL_REDIRECT = os.getenv(
    "DJANGO_SECURE_SSL_REDIRECT",
    "False",
).lower() in {
    "1",
    "true",
    "yes",
    "on",
}


SESSION_COOKIE_SECURE = not DEBUG

CSRF_COOKIE_SECURE = not DEBUG

SESSION_COOKIE_HTTPONLY = True

X_FRAME_OPTIONS = "DENY"

SECURE_CONTENT_TYPE_NOSNIFF = True

SECURE_REFERRER_POLICY = "same-origin"
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CORS_ALLOWED_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]


CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "",
    ).split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "",
    ).split(",")
    if origin.strip()
]


# -----------------------------------------------------------------------------
# M-Pesa / Daraja
# -----------------------------------------------------------------------------

MPESA_CONSUMER_KEY = os.getenv(
    "MPESA_CONSUMER_KEY",
    "",
)

MPESA_CONSUMER_SECRET = os.getenv(
    "MPESA_CONSUMER_SECRET",
    "",
)

MPESA_SHORTCODE = os.getenv(
    "MPESA_SHORTCODE",
    "",
)

MPESA_PASSKEY = os.getenv(
    "MPESA_PASSKEY",
    "",
)

MPESA_CALLBACK_URL = os.getenv(
    "MPESA_CALLBACK_URL",
    "",
)

MPESA_ENVIRONMENT = os.getenv(
    "MPESA_ENVIRONMENT",
    "sandbox",
).strip().lower()