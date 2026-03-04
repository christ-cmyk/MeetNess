"""
Modèles pour l'application accounts.
Gère les utilisateurs et leurs profils.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField
import uuid


class UserManager(BaseUserManager):
    """
    Manager personnalisé pour le modèle User.
    """
    
    def create_user(self, email, username, password=None, **extra_fields):
        """
        Créer et sauvegarder un utilisateur normal.
        """
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        if not username:
            raise ValueError("Le nom d'utilisateur est obligatoire")
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Créer et sauvegarder un superutilisateur.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser doit avoir is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser doit avoir is_superuser=True.')
        
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé pour MeedNess.
    Utilise email comme identifiant principal.
    """
    
    # Choix pour les rôles
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrateur'
        MEMBER = 'member', 'Membre'
    
    # Identifiants
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, verbose_name="Nom d'utilisateur")
    email = models.EmailField(unique=True, verbose_name="Email")
    
    # Informations personnelles
    first_name = models.CharField(max_length=150, blank=True, verbose_name="Prénom")
    last_name = models.CharField(max_length=150, blank=True, verbose_name="Nom")
    phone = PhoneNumberField(blank=True, null=True, verbose_name="Téléphone")
    country = models.CharField(max_length=100, blank=True, verbose_name="Pays")
    
    # Rôle (admin ou membre)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEMBER,
        verbose_name="Rôle"
    )
    
    # Photo de profil
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Avatar")
    
    # Statuts
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    is_staff = models.BooleanField(default=False, verbose_name="Staff")
    is_verified = models.BooleanField(default=False, verbose_name="Email vérifié")
    
    # Dates
    date_joined = models.DateTimeField(default=timezone.now, verbose_name="Date d'inscription")
    last_login = models.DateTimeField(blank=True, null=True, verbose_name="Dernière connexion")
    
    # Configuration du manager
    objects = UserManager()
    
    # Champs requis
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    def get_full_name(self):
        """
        Retourne le nom complet de l'utilisateur.
        """
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def get_short_name(self):
        """
        Retourne le prénom ou le username.
        """
        return self.first_name if self.first_name else self.username
    
    @property
    def is_admin(self):
        """
        Vérifie si l'utilisateur est administrateur.
        """
        return self.role == self.Role.ADMIN
    
    @property
    def is_member(self):
        """
        Vérifie si l'utilisateur est membre.
        """
        return self.role == self.Role.MEMBER


class Profile(models.Model):
    """
    Profil étendu de l'utilisateur.
    Contient des informations supplémentaires.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="Utilisateur"
    )
    
    bio = models.TextField(blank=True, verbose_name="Biographie")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Date de naissance")
    
    # Paramètres de notification
    email_notifications = models.BooleanField(default=True, verbose_name="Notifications email")
    push_notifications = models.BooleanField(default=True, verbose_name="Notifications push")
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    
    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"
    
    def __str__(self):
        return f"Profil de {self.user.username}"