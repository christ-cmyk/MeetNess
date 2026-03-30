"""
WebSocket Consumer pour le chat en temps réel - MeedNess.
Gère les connexions WebSocket avec Django Channels.
"""
import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket pour un salon de chat.
    URL : ws://host/ws/chat/{room_id}/?token={jwt_token}
    """

    async def connect(self):
        """Connexion WebSocket."""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope.get('user')

        # Vérifier l'authentification
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Vérifier que l'utilisateur est membre du salon
        is_member = await self.check_room_membership()
        if not is_member:
            await self.close(code=4003)
            return

        # Rejoindre le groupe du salon
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Notifier les autres membres de la connexion
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_online',
                'user_id': str(self.user.id),
                'username': self.user.username,
            }
        )

    async def disconnect(self, close_code):
        """Déconnexion WebSocket."""
        if hasattr(self, 'room_group_name'):
            # Notifier les autres membres de la déconnexion
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_offline',
                    'user_id': str(self.user.id),
                    'username': self.user.username,
                }
            )

            # Quitter le groupe
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Réception d'un message du client."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            handlers = {
                'send_message': self.handle_send_message,
                'typing': self.handle_typing,
                'mark_read': self.handle_mark_read,
                'delete_message': self.handle_delete_message,
                'add_reaction': self.handle_add_reaction,
                'remove_reaction': self.handle_remove_reaction,
            }

            handler = handlers.get(message_type)
            if handler:
                await handler(data)
            else:
                await self.send_error(f"Type de message inconnu: {message_type}")

        except json.JSONDecodeError:
            await self.send_error("Format JSON invalide")
        except Exception as e:
            await self.send_error(str(e))

    # ─────────────────────────────────────────────
    # HANDLERS
    # ─────────────────────────────────────────────

    async def handle_send_message(self, data):
        """Gère l'envoi d'un message texte."""
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'text')
        reply_to_id = data.get('reply_to_id')

        if not content:
            await self.send_error("Le message ne peut pas être vide")
            return

        # Sauvegarder en base de données
        message = await self.save_message(
            content=content,
            message_type=message_type,
            reply_to_id=reply_to_id
        )

        if not message:
            await self.send_error("Erreur lors de la sauvegarde du message")
            return

        # Diffuser à tous les membres du salon
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
            }
        )

    async def handle_typing(self, data):
        """Gère l'indicateur de frappe."""
        is_typing = data.get('is_typing', False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'is_typing': is_typing,
            }
        )

    async def handle_mark_read(self, data):
        """Marque les messages comme lus."""
        await self.update_last_read()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'messages_read',
                'user_id': str(self.user.id),
                'room_id': self.room_id,
            }
        )

    async def handle_delete_message(self, data):
        """Supprime un message (soft delete)."""
        message_id = data.get('message_id')
        if not message_id:
            await self.send_error("message_id requis")
            return

        success = await self.soft_delete_message(message_id)
        if not success:
            await self.send_error(
                "Message introuvable ou permission refusée"
            )
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'message_deleted',
                'message_id': message_id,
                'deleted_by': str(self.user.id),
            }
        )

    async def handle_add_reaction(self, data):
        """Ajoute une réaction à un message."""
        message_id = data.get('message_id')
        emoji = data.get('emoji')

        if not message_id or not emoji:
            await self.send_error("message_id et emoji requis")
            return

        reaction = await self.save_reaction(message_id, emoji)
        if not reaction:
            await self.send_error("Erreur lors de l'ajout de la réaction")
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'reaction_added',
                'message_id': message_id,
                'emoji': emoji,
                'user_id': str(self.user.id),
                'username': self.user.username,
            }
        )

    async def handle_remove_reaction(self, data):
        """Supprime une réaction d'un message."""
        message_id = data.get('message_id')
        emoji = data.get('emoji')

        if not message_id or not emoji:
            await self.send_error("message_id et emoji requis")
            return

        await self.remove_reaction(message_id, emoji)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'reaction_removed',
                'message_id': message_id,
                'emoji': emoji,
                'user_id': str(self.user.id),
            }
        )

    # ─────────────────────────────────────────────
    # EVENTS (envoyés à tous les membres du groupe)
    # ─────────────────────────────────────────────

    async def chat_message(self, event):
        """Envoie un message à ce client WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
        }))

    async def typing_indicator(self, event):
        """Envoie l'indicateur de frappe."""
        if str(self.user.id) != event['user_id']:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))

    async def messages_read(self, event):
        """Notifie que les messages ont été lus."""
        await self.send(text_data=json.dumps({
            'type': 'read',
            'user_id': event['user_id'],
            'room_id': event['room_id'],
        }))

    async def message_deleted(self, event):
        """Notifie la suppression d'un message."""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
            'deleted_by': event['deleted_by'],
        }))

    async def reaction_added(self, event):
        """Notifie l'ajout d'une réaction."""
        await self.send(text_data=json.dumps({
            'type': 'reaction_added',
            'message_id': event['message_id'],
            'emoji': event['emoji'],
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    async def reaction_removed(self, event):
        """Notifie la suppression d'une réaction."""
        await self.send(text_data=json.dumps({
            'type': 'reaction_removed',
            'message_id': event['message_id'],
            'emoji': event['emoji'],
            'user_id': event['user_id'],
        }))

    async def user_online(self, event):
        """Notifie qu'un utilisateur est en ligne."""
        if str(self.user.id) != event['user_id']:
            await self.send(text_data=json.dumps({
                'type': 'user_online',
                'user_id': event['user_id'],
                'username': event['username'],
            }))

    async def user_offline(self, event):
        """Notifie qu'un utilisateur est hors ligne."""
        if str(self.user.id) != event['user_id']:
            await self.send(text_data=json.dumps({
                'type': 'user_offline',
                'user_id': event['user_id'],
                'username': event['username'],
            }))

    # ─────────────────────────────────────────────
    # DATABASE OPERATIONS (sync_to_async)
    # ─────────────────────────────────────────────

    @database_sync_to_async
    def check_room_membership(self):
        """Vérifie que l'utilisateur est membre du salon."""
        from .models import ChatRoom, ChatRoomMember
        try:
            room = ChatRoom.objects.get(id=self.room_id, is_active=True)
            return ChatRoomMember.objects.filter(
                room=room,
                user=self.user,
                is_active=True
            ).exists()
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, message_type='text', reply_to_id=None):
        """Sauvegarde un message en base de données."""
        from .models import ChatRoom, Message
        from .serializers import MessageSerializer

        try:
            room = ChatRoom.objects.get(id=self.room_id)
            reply_to = None

            if reply_to_id:
                try:
                    reply_to = Message.objects.get(
                        id=reply_to_id,
                        room=room
                    )
                except Message.DoesNotExist:
                    pass

            message = Message.objects.create(
                room=room,
                sender=self.user,
                content=content,
                message_type=message_type,
                reply_to=reply_to
            )

            # Mettre à jour updated_at du salon
            room.save()

            serializer = MessageSerializer(message)
            return serializer.data

        except Exception as e:
            print(f"Erreur save_message: {e}")
            return None

    @database_sync_to_async
    def update_last_read(self):
        """Met à jour le timestamp de dernière lecture."""
        from .models import ChatRoomMember
        ChatRoomMember.objects.filter(
            room_id=self.room_id,
            user=self.user
        ).update(last_read_at=timezone.now())

    @database_sync_to_async
    def soft_delete_message(self, message_id):
        """Supprime logiquement un message."""
        from .models import Message
        from apps.organizations.models import OrganizationMember

        try:
            message = Message.objects.get(
                id=message_id,
                room_id=self.room_id
            )

            # Vérifier les permissions
            is_author = message.sender == self.user
            is_org_admin = False

            if message.room.organization:
                is_org_admin = OrganizationMember.objects.filter(
                    user=self.user,
                    organization=message.room.organization,
                    role__in=['owner', 'admin'],
                    is_active=True
                ).exists()

            if not (is_author or is_org_admin):
                return False

            message.soft_delete(deleted_by=self.user)
            return True

        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def save_reaction(self, message_id, emoji):
        """Sauvegarde une réaction."""
        from .models import Message, MessageReaction

        try:
            message = Message.objects.get(
                id=message_id,
                room_id=self.room_id,
                is_deleted=False
            )
            reaction, created = MessageReaction.objects.get_or_create(
                message=message,
                user=self.user,
                emoji=emoji
            )
            return reaction if created else None

        except Message.DoesNotExist:
            return None

    @database_sync_to_async
    def remove_reaction(self, message_id, emoji):
        """Supprime une réaction."""
        from .models import MessageReaction

        MessageReaction.objects.filter(
            message_id=message_id,
            user=self.user,
            emoji=emoji
        ).delete()

    async def send_error(self, message):
        """Envoie un message d'erreur au client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
        }))