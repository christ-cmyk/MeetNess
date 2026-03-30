"""
Configuration des URLs principales de MeedNess.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    # Admin Django
    path('admin/', admin.site.urls),
    path('api/organizations/', include('apps.organizations.urls')),
    # API Authentification
    path('api/auth/', include('apps.accounts.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
]

# Media files en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)