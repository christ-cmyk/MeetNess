"""
Serializers pour l'application accounts.
Validation et transformation des données utilisateur.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User.
    Utilisé pour afficher les informations utilisateur.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'country', 'role', 'avatar',
            'is_active', 'is_verified', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'inscription d'un nouvel utilisateur.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'country'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone': {'required': True},
            'country': {'required': True},
        }
    
    def validate(self, attrs):
        """
        Vérifier que les deux mots de passe correspondent.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return attrs
    
    def validate_email(self, value):
        """
        Vérifier que l'email n'existe pas déjà.
        """
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value.lower()
    
    def validate_username(self, value):
        """
        Vérifier que le username n'existe pas déjà.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value
    
    def create(self, validated_data):
        """
        Créer un nouvel utilisateur.
        """
        # Retirer password_confirm des données
        validated_data.pop('password_confirm')
        
        # Créer l'utilisateur
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone'),
            country=validated_data.get('country'),
        )
        
        # Créer le profil associé
        Profile.objects.create(user=user)
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer pour la connexion utilisateur.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """
        Vérifier les identifiants de l'utilisateur.
        """
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        
        if email and password:
            # Vérifier si l'utilisateur existe
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    "email": "Aucun compte ne correspond à cet email."
                })
            
            # Vérifier si l'utilisateur est actif
            if not user.is_active:
                raise serializers.ValidationError({
                    "email": "Ce compte a été désactivé."
                })
            
            # Authentifier l'utilisateur
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError({
                    "password": "Mot de passe incorrect."
                })
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError({
                "email": "L'email et le mot de passe sont requis."
            })


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer pour changer le mot de passe.
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_old_password(self, value):
        """
        Vérifier que l'ancien mot de passe est correct.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value
    
    def validate(self, attrs):
        """
        Vérifier que les nouveaux mots de passe correspondent.
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return attrs
    
    def save(self, **kwargs):
        """
        Sauvegarder le nouveau mot de passe.
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer pour demander la réinitialisation du mot de passe.
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Vérifier que l'email existe.
        """
        if not User.objects.filter(email=value.lower()).exists():
            # Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
            # On retourne toujours un message de succès
            pass
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer pour confirmer la réinitialisation du mot de passe.
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """
        Vérifier que les mots de passe correspondent.
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Les mots de passe ne correspondent pas."
            })
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pour le profil utilisateur.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user', 'bio', 'birth_date',
            'email_notifications', 'push_notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
        
class ChooseRoleSerializer(serializers.Serializer):
    """
    Serializer pour choisir le rôle après l'inscription.
    """
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        required=True
    )
    
    def validate_role(self, value):
        """
        Vérifier que le rôle est valide.
        """
        if value not in [User.Role.ADMIN, User.Role.MEMBER]:
            raise serializers.ValidationError("Rôle invalide.")
        return value