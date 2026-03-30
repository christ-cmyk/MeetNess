"""
Views REST pour le chat - MeedNess.
"""
import mimetypes
from PIL import Image
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import ChatRoom, ChatRoomMember, Message, MessageMedia
from .serializers import (
    ChatRoomSerializer, MessageSerializer, CreateRoomSerializer,
    SendMessageSerializer, UploadMediaSerializer, UserSearchSerializer
)

User = get_user_model()


class RoomListCreateView(APIView):
    """
    GET  /api/chat/rooms/         → Liste les salons de l'utilisateur
    POST /api/chat/rooms/         → Crée un nouveau salon
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rooms = ChatRoom.objects.filter(
            members__user=request.user,
            members__is_active=True,
            is_active=True
        ).distinct().order_by('-updated_at')

        serializer = ChatRoomSerializer(
            rooms, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateRoomSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        room_type = data['type']

        # Vérifier les permissions selon le type
        error = self._check_create_permissions(request.user, room_type, data)
        if error:
            return Response(
                {'detail': error},
                status=status.HTTP_403_FORBIDDEN
            )

        # Créer le salon
        room = self._create_room(request.user, data)
        response_serializer = ChatRoomSerializer(
            room, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def _check_create_permissions(self, user, room_type, data):
        """Vérifie les permissions de création selon le type de salon."""
        from apps.organizations.models import OrganizationMember, Team

        if room_type == 'direct':
            return None  # Tout le monde peut créer un DM

        org_id = data.get('organization_id')
        if not org_id:
            return "organization_id requis pour ce type de salon."

        membership = OrganizationMember.objects.filter(
            user=user,
            organization_id=org_id,
            is_active=True
        ).first()

        if not membership:
            return "Vous n'êtes pas membre de cette organisation."

        if room_type == 'general' and membership.role not in ['owner']:
            return "Seul le owner peut créer un salon général."

        if room_type == 'announcement' and membership.role not in ['owner']:
            return "Seul le owner peut créer un salon d'annonce."

        if room_type == 'team':
            team_id = data.get('team_id')
            if membership.role == 'admin':
                # L'admin ne peut créer que pour son équipe
                in_team = Team.objects.filter(
                    id=team_id,
                    members__user=user
                ).exists()
                if not in_team:
                    return "Vous n'êtes pas membre de cette équipe."
            elif membership.role not in ['owner']:
                return "Vous n'avez pas la permission de créer ce salon."

        return None

    def _create_room(self, creator, data):
        """Crée le salon et ajoute les membres."""
        from apps.organizations.models import OrganizationMember

        room = ChatRoom.objects.create(
            name=data['name'],
            type=data['type'],
            organization_id=data.get('organization_id'),
            team_id=data.get('team_id'),
            created_by=creator,
        )

        # Ajouter le créateur comme admin du salon
        ChatRoomMember.objects.create(
            room=room,
            user=creator,
            role='admin'
        )

        # Ajouter les membres spécifiés
        member_ids = data.get('member_ids', [])
        for user_id in member_ids:
            if str(user_id) != str(creator.id):
                try:
                    user = User.objects.get(id=user_id)
                    ChatRoomMember.objects.get_or_create(
                        room=room,
                        user=user,
                        defaults={'role': 'member'}
                    )
                except User.DoesNotExist:
                    pass

        # Pour les salons d'équipe, ajouter tous les membres de l'équipe
        if room.type == 'team' and room.team:
            from apps.organizations.models import Team
            team_members = room.team.members.filter(
                is_active=True
            ).values_list('user', flat=True)
            for user_id in team_members:
                ChatRoomMember.objects.get_or_create(
                    room=room,
                    user_id=user_id,
                    defaults={'role': 'member'}
                )

        return room


class RoomDetailView(APIView):
    """
    GET /api/chat/rooms/{id}/ → Détail d'un salon
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_room(self, room_id, user):
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
            if not room.members.filter(user=user, is_active=True).exists():
                return None, Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return room, None
        except ChatRoom.DoesNotExist:
            return None, Response(
                {'detail': 'Salon introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get(self, request, room_id):
        room, error = self.get_room(room_id, request.user)
        if error:
            return error
        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data)


class MessageListCreateView(APIView):
    """
    GET  /api/chat/rooms/{id}/messages/ → Historique des messages
    POST /api/chat/rooms/{id}/messages/ → Envoyer un message (fallback REST)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
            if not room.members.filter(
                user=request.user, is_active=True
            ).exists():
                return Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except ChatRoom.DoesNotExist:
            return Response(
                {'detail': 'Salon introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Pagination manuelle
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 50))
        offset = (page - 1) * limit

        messages = Message.objects.filter(
            room=room
        ).select_related(
            'sender', 'reply_to', 'reply_to__sender'
        ).prefetch_related(
            'media', 'reactions', 'reactions__user'
        ).order_by('-created_at')[offset:offset + limit]

        # Inverser pour ordre chronologique
        messages = list(reversed(messages))

        serializer = MessageSerializer(
            messages, many=True, context={'request': request}
        )

        # Marquer comme lu
        ChatRoomMember.objects.filter(
            room=room,
            user=request.user
        ).update(last_read_at=timezone.now())

        return Response({
            'results': serializer.data,
            'page': page,
            'limit': limit,
            'has_more': len(messages) == limit,
        })

    def post(self, request, room_id):
        """Fallback REST pour envoyer un message."""
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
            if not room.members.filter(
                user=request.user, is_active=True
            ).exists():
                return Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except ChatRoom.DoesNotExist:
            return Response(
                {'detail': 'Salon introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        message = Message.objects.create(
            room=room,
            sender=request.user,
            content=data.get('content', ''),
            message_type=data.get('message_type', 'text'),
        )

        # Gérer les médias
        files = request.FILES.getlist('media')
        for file in files:
            self._save_media(message, file)

        room.save()  # Mettre à jour updated_at

        response_serializer = MessageSerializer(
            message, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def _save_media(self, message, file):
        """Sauvegarde un fichier média attaché à un message."""
        mime_type, _ = mimetypes.guess_type(file.name)
        ext = file.name.split('.')[-1].lower()

        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            media_type = 'image'
        elif ext in ['mp3', 'ogg', 'wav']:
            media_type = 'audio'
        else:
            media_type = 'file'

        media = MessageMedia.objects.create(
            message=message,
            media_type=media_type,
            file=file,
            filename=file.name,
            file_size=file.size,
            mime_type=mime_type or 'application/octet-stream',
        )

        # Générer thumbnail pour les images
        if media_type == 'image':
            try:
                img = Image.open(file)
                media.width = img.width
                media.height = img.height
                media.save()
            except Exception:
                pass


class MarkRoomReadView(APIView):
    """
    POST /api/chat/rooms/{id}/read/ → Marquer le salon comme lu
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        updated = ChatRoomMember.objects.filter(
            room_id=room_id,
            user=request.user,
            is_active=True
        ).update(last_read_at=timezone.now())

        if not updated:
            return Response(
                {'detail': 'Salon introuvable ou accès refusé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({'detail': 'Messages marqués comme lus.'})


class DirectRoomView(APIView):
    """
    GET /api/chat/direct/{user_id}/ → Obtenir ou créer un DM
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            other_user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if other_user == request.user:
            return Response(
                {'detail': 'Vous ne pouvez pas créer un DM avec vous-même.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si un DM existe déjà entre ces 2 utilisateurs
        existing_room = ChatRoom.objects.filter(
            type='direct',
            members__user=request.user,
            is_active=True
        ).filter(
            members__user=other_user
        ).first()

        if existing_room:
            serializer = ChatRoomSerializer(
                existing_room, context={'request': request}
            )
            return Response(serializer.data)

        # Vérifier si l'autre utilisateur a bloqué les DM
        from .models import BlockedUser
        is_blocked = BlockedUser.objects.filter(
            blocker=other_user,
            blocked=request.user
        ).exists()

        if is_blocked:
            return Response(
                {'detail': 'Cet utilisateur ne accepte pas les DM.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Créer le salon DM
        room = ChatRoom.objects.create(
            name=f"DM: {request.user.username} & {other_user.username}",
            type='direct',
            created_by=request.user,
        )

        ChatRoomMember.objects.bulk_create([
            ChatRoomMember(room=room, user=request.user, role='admin'),
            ChatRoomMember(room=room, user=other_user, role='admin'),
        ])

        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserSearchView(APIView):
    """
    GET /api/chat/users/search/?q=username → Recherche d'utilisateurs pour DM
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if len(query) < 2:
            return Response(
                {'detail': 'Minimum 2 caractères requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query),
            is_active=True
        ).exclude(
            id=request.user.id
        ).select_related().prefetch_related(
            'organization_memberships__organization'
        )[:20]

        serializer = UserSearchSerializer(users, many=True)
        return Response(serializer.data)


class BlockUserView(APIView):
    """
    POST   /api/chat/users/{user_id}/block/   → Bloquer un utilisateur
    DELETE /api/chat/users/{user_id}/block/   → Débloquer un utilisateur
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        from .models import BlockedUser

        try:
            user_to_block = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        _, created = BlockedUser.objects.get_or_create(
            blocker=request.user,
            blocked=user_to_block
        )

        if created:
            return Response({'detail': 'Utilisateur bloqué.'})
        return Response({'detail': 'Déjà bloqué.'})

    def delete(self, request, user_id):
        from .models import BlockedUser

        BlockedUser.objects.filter(
            blocker=request.user,
            blocked_id=user_id
        ).delete()

        return Response({'detail': 'Utilisateur débloqué.'})