"""
Serializers pour le chat - MeedNess.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatRoom, ChatRoomMember, Message, MessageMedia, MessageReaction

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class MessageReactionSerializer(serializers.ModelSerializer):
    """Serializer pour les réactions."""
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = MessageReaction
        fields = ['id', 'emoji', 'user', 'created_at']


class MessageMediaSerializer(serializers.ModelSerializer):
    """Serializer pour les médias."""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MessageMedia
        fields = [
            'id', 'media_type', 'file_url', 'filename',
            'file_size', 'mime_type', 'width', 'height',
            'thumbnail', 'created_at'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class MessageSerializer(serializers.ModelSerializer):
    """Serializer complet pour un message."""
    sender = UserMinimalSerializer(read_only=True)
    media = MessageMediaSerializer(many=True, read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    reply_to = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'room_id', 'sender', 'content',
            'message_type', 'reply_to', 'media', 'reactions',
            'is_deleted', 'is_edited', 'is_read',
            'created_at', 'updated_at'
        ]

    def get_reply_to(self, obj):
        if obj.reply_to:
            return {
                'id': str(obj.reply_to.id),
                'content': obj.reply_to.content,
                'sender': {
                    'id': str(obj.reply_to.sender.id),
                    'username': obj.reply_to.sender.username,
                } if obj.reply_to.sender else None,
            }
        return None

    def get_is_read(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        user = request.user
        membership = obj.room.members.filter(user=user).first()
        if not membership:
            return False
        return obj.created_at <= membership.last_read_at


class ChatRoomMemberSerializer(serializers.ModelSerializer):
    """Serializer pour les membres d'un salon."""
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ChatRoomMember
        fields = ['id', 'user', 'role', 'last_read_at', 'joined_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer pour un salon de chat."""
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    members = ChatRoomMemberSerializer(many=True, read_only=True)

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'name', 'type', 'organization',
            'team', 'created_by', 'last_message',
            'unread_count', 'members_count', 'members',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_last_message(self, obj):
        message = obj.last_message
        if message:
            return {
                'id': str(message.id),
                'content': message.content,
                'message_type': message.message_type,
                'sender': {
                    'id': str(message.sender.id),
                    'username': message.sender.username,
                } if message.sender else None,
                'created_at': message.created_at.isoformat(),
                'is_deleted': message.is_deleted,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.get_unread_count(request.user)
        return 0

    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()


class CreateRoomSerializer(serializers.Serializer):
    """Serializer pour créer un salon."""
    name = serializers.CharField(max_length=255)
    type = serializers.ChoiceField(
        choices=['general', 'team', 'announcement', 'direct']
    )
    team_id = serializers.UUIDField(required=False, allow_null=True)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )

    def validate(self, data):
        if data.get('type') == 'team' and not data.get('team_id'):
            raise serializers.ValidationError(
                "team_id est requis pour un salon d'équipe."
            )
        return data


class SendMessageSerializer(serializers.Serializer):
    """Serializer pour envoyer un message via REST (fallback)."""
    content = serializers.CharField(required=False, allow_blank=True)
    message_type = serializers.ChoiceField(
        choices=['text', 'image', 'file', 'audio'],
        default='text'
    )
    reply_to_id = serializers.UUIDField(required=False, allow_null=True)
    media = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=list
    )

    def validate(self, data):
        if not data.get('content') and not data.get('media'):
            raise serializers.ValidationError(
                "Le message doit contenir du texte ou un média."
            )
        return data


class UploadMediaSerializer(serializers.Serializer):
    """Serializer pour uploader un média."""
    file = serializers.FileField()
    media_type = serializers.ChoiceField(
        choices=['image', 'file', 'audio']
    )

    def validate_file(self, file):
        from django.conf import settings

        ext = file.name.split('.')[-1].lower()
        media_type = self.initial_data.get('media_type')

        allowed = {
            'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'file': ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
            'audio': ['mp3', 'ogg', 'wav'],
        }

        max_sizes = {
            'image': settings.MAX_IMAGE_SIZE,
            'file': settings.MAX_FILE_SIZE,
            'audio': settings.MAX_IMAGE_SIZE,
        }

        if media_type and ext not in allowed.get(media_type, []):
            raise serializers.ValidationError(
                f"Extension .{ext} non autorisée pour {media_type}."
            )

        max_size = max_sizes.get(media_type, settings.MAX_FILE_SIZE)
        if file.size > max_size:
            raise serializers.ValidationError(
                f"Fichier trop volumineux. Max: {max_size // (1024*1024)}MB"
            )

        return file


class UserSearchSerializer(serializers.ModelSerializer):
    """Serializer pour la recherche d'utilisateurs (DM)."""
    organization_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name',
            'avatar', 'organization_name'
        ]

    def get_organization_name(self, obj):
        membership = obj.organization_memberships.filter(
            is_active=True
        ).select_related('organization').first()
        if membership:
            return membership.organization.name
        return None