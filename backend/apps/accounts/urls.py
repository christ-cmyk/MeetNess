"""
URLs pour l'application accounts.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserListView,
    ChooseRoleView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentification
    path('register/', RegisterView.as_view(), name='register'),
    path('choose-role/', ChooseRoleView.as_view(), name='choose-role'), 
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profil utilisateur
    path('me/', UserProfileView.as_view(), name='user-profile'),
    
    # Gestion mot de passe
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Liste utilisateurs (admin)
    path('users/', UserListView.as_view(), name='user-list'),
]