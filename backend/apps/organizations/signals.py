from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Organization, OrganizationMember


@receiver(post_save, sender=Organization)
def create_general_chat_room(sender, instance, created, **kwargs):
    """Crée automatiquement le salon Général à la création d'une organisation."""
    if created:
        from apps.chat.models import ChatRoom, ChatRoomMember
        
        # Créer le salon Général
        room = ChatRoom.objects.create(
            name='Général',
            type='general',
            organization=instance,
            created_by=instance.owner,
        )
        
        # Ajouter le owner comme admin du salon
        ChatRoomMember.objects.create(
            room=room,
            user=instance.owner,
            role='admin'
        )