"""
Modèles pour le système de chat en temps réel - MeedNess.
"""
import uuid
import os
from django.db import models
from django.conf import settings
from django.utils import timezone


def message_media_path(instance, filename):
    """Génère le chemin de stockage pour les médias des messages."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('chat', 'media', str(instance.room.id), filename)


class ChatRoom(models.Model):
    """
    Salon de discussion.
    Peut être général, lié à une équipe, une annonce ou un DM.
    """
    ROOM_TYPES = [
        ('general', 'Général'),
        ('team', 'Équipe'),
        ('announcement', 'Annonce'),
        ('direct', 'Message Direct'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20, choices=ROOM_TYPES, default='general')

    # Organisation (null pour les DM inter-organisations)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='chat_rooms',
        null=True,
        blank=True
    )

    # Équipe (uniquement pour les salons de type 'team')
    team = models.ForeignKey(
        'organizations.Team',
        on_delete=models.CASCADE,
        related_name='chat_rooms',
        null=True,
        blank=True
    )

    # Créateur du salon
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_rooms'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Salon'
        verbose_name_plural = 'Salons'

    def __str__(self):
        if self.type == 'direct':
            members = self.members.values_list('user__username', flat=True)
            return f"DM: {' & '.join(members)}"
        return f"{self.name} ({self.type})"

    @property
    def last_message(self):
        return self.messages.filter(
            is_deleted=False
        ).order_by('-created_at').first()

    def get_unread_count(self, user):
        """Retourne le nombre de messages non lus pour un utilisateur."""
        membership = self.members.filter(user=user).first()
        if not membership:
            return 0
        return self.messages.filter(
            created_at__gt=membership.last_read_at,
            is_deleted=False
        ).exclude(sender=user).count()


class ChatRoomMember(models.Model):
    """
    Membre d'un salon de discussion.
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Membre'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    last_read_at = models.DateTimeField(default=timezone.now)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['room', 'user']
        ordering = ['joined_at']
        verbose_name = 'Membre du salon'
        verbose_name_plural = 'Membres des salons'

    def __str__(self):
        return f"{self.user.username} → {self.room.name}"


class Message(models.Model):
    """
    Message dans un salon de discussion.
    """
    MESSAGE_TYPES = [
        ('text', 'Texte'),
        ('image', 'Image'),
        ('file', 'Fichier'),
        ('audio', 'Audio'),
        ('system', 'Système'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True)
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPES,
        default='text'
    )

    # Réponse à un message
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )

    # Suppression logique
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_messages'
    )

    # Modification
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

    def soft_delete(self, deleted_by):
        """Suppression logique avec conservation de l'historique."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.content = "Ce message a été supprimé."
        self.save()


class MessageMedia(models.Model):
    """
    Média attaché à un message (image, fichier, audio).
    """
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('file', 'Fichier'),
        ('audio', 'Audio'),
    ]

    # Extensions autorisées
    ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx']
    ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'ogg', 'wav']

    # Tailles max en bytes
    MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10MB
    MAX_FILE_SIZE = 25 * 1024 * 1024    # 25MB
    MAX_AUDIO_SIZE = 10 * 1024 * 1024   # 10MB

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='media'
    )
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    file = models.FileField(upload_to=message_media_path)
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()  # en bytes
    mime_type = models.CharField(max_length=100)

    # Pour les images uniquement
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    thumbnail = models.ImageField(
        upload_to=message_media_path,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Média'
        verbose_name_plural = 'Médias'

    def __str__(self):
        return f"{self.media_type}: {self.filename}"


class MessageReaction(models.Model):
    """
    Réaction emoji sur un message.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reactions'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_reactions'
    )
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['message', 'user', 'emoji']
        verbose_name = 'Réaction'
        verbose_name_plural = 'Réactions'

    def __str__(self):
        return f"{self.user.username} {self.emoji} → {self.message.id}"


class BlockedUser(models.Model):
    """
    Utilisateur bloqué pour les DM.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blocked_users'
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blocked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['blocker', 'blocked']
        verbose_name = 'Utilisateur bloqué'
        verbose_name_plural = 'Utilisateurs bloqués'

    def __str__(self):
        return f"{self.blocker.username} bloque {self.blocked.username}"