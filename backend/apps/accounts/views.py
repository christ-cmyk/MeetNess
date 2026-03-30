"""
Views pour l'application accounts.
Gestion de l'authentification et des profils utilisateurs.
"""

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import logout


from .models import User, Profile
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ProfileSerializer,
    ChooseRoleSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    Endpoint pour l'inscription d'un nouvel utilisateur.
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        print("📥 Register data reçue:", request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Préparer la réponse
        user_data = UserSerializer(user).data
        
        return Response({
            'user': user_data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Inscription réussie !',
            'needs_role_selection': True  # ← AJOUTER CETTE LIGNE !
        }, status=status.HTTP_201_CREATED)
        
class LoginView(APIView):
    """
    Endpoint pour la connexion utilisateur.
    POST /api/auth/login/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
def post(self, request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response(
            {'message': 'Déconnexion réussie.'},
            status=status.HTTP_200_OK
        )
    except Exception:
        # Ignorer les erreurs de blacklist
        return Response(
            {'message': 'Déconnexion réussie.'},
            status=status.HTTP_200_OK
        )


class LogoutView(APIView):
    """
    Endpoint pour la déconnexion utilisateur.
    POST /api/auth/logout/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logout(request)
            return Response({
                'message': 'Déconnexion réussie !'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Erreur lors de la déconnexion.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint pour récupérer et modifier le profil de l'utilisateur connecté.
    GET/PUT/PATCH /api/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    Endpoint pour changer le mot de passe.
    POST /api/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Mot de passe modifié avec succès !'
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    Endpoint pour demander la réinitialisation du mot de passe.
    POST /api/auth/password-reset/
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        # TODO: Envoyer l'email avec le lien de réinitialisation
        # Pour l'instant, on retourne juste un message de succès
        
        return Response({
            'message': 'Si cet email existe, un lien de réinitialisation a été envoyé.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Endpoint pour confirmer la réinitialisation du mot de passe.
    POST /api/auth/password-reset/confirm/
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # TODO: Vérifier le token et réinitialiser le mot de passe
        # Pour l'instant, on retourne juste un message
        
        return Response({
            'message': 'Mot de passe réinitialisé avec succès !'
        }, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """
    Endpoint pour lister tous les utilisateurs.
    GET /api/auth/users/
    (Réservé aux administrateurs)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """
        Optionnel: Filtrer par rôle, organisation, etc.
        """
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        
        if role:
            queryset = queryset.filter(role=role)
        
        return queryset
    
class ChooseRoleView(APIView):
    """
    Endpoint pour choisir le rôle après l'inscription.
    POST /api/auth/choose-role/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChooseRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        role = serializer.validated_data['role']
        
        # Mettre à jour le rôle
        user.role = role
        user.save(update_fields=['role'])
        
        # Retourner l'utilisateur mis à jour
        user_data = UserSerializer(user).data
        
        return Response({
            'user': user_data,
            'message': f'Rôle mis à jour : {user.get_role_display()}'
        }, status=status.HTTP_200_OK)

    