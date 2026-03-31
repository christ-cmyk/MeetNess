"""
Views REST pour les Réunions et Votes - MeedNess.
"""
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import (
    Meeting, MeetingAttendee, AgendaItem,
    MeetingAction, Vote, VoteOption, VoteResponse
)
from .serializers import (
    MeetingSerializer, MeetingMinimalSerializer,
    CreateMeetingSerializer, UpdateMeetingSerializer,
    AgendaItemSerializer, CreateAgendaItemSerializer,
    MeetingActionSerializer, CreateMeetingActionSerializer,
    VoteSerializer, VoteMinimalSerializer,
    CreateVoteSerializer, CastVoteSerializer,
    MeetingAttendeeSerializer
)
from apps.organizations.models import OrganizationMember

User = get_user_model()


def get_org_membership(user, org_id):
    return OrganizationMember.objects.filter(
        user=user,
        organization_id=org_id,
        is_active=True
    ).first()


class MeetingListCreateView(APIView):
    """
    GET  /api/meetings/?org_id={id} → Liste des réunions
    POST /api/meetings/             → Créer une réunion
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org_id = request.query_params.get('org_id')
        if not org_id:
            return Response(
                {'detail': 'org_id requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership = get_org_membership(request.user, org_id)
        if not membership:
            return Response(
                {'detail': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        meetings = Meeting.objects.filter(
            organization_id=org_id,
            is_active=True
        ).select_related(
            'organizer', 'team'
        ).prefetch_related('attendees', 'attendees__user')

        # Filtres
        status_filter = request.query_params.get('status')
        if status_filter:
            meetings = meetings.filter(status=status_filter)

        upcoming = request.query_params.get('upcoming')
        if upcoming:
            meetings = meetings.filter(
                start_time__gte=timezone.now()
            ).order_by('start_time')

        serializer = MeetingMinimalSerializer(
            meetings, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        org_id = request.data.get('organization_id')

        membership = get_org_membership(request.user, org_id)
        if not membership:
            return Response(
                {'detail': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        meeting = Meeting.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            organization_id=org_id,
            team_id=data.get('team_id'),
            organizer=request.user,
            start_time=data['start_time'],
            end_time=data['end_time'],
            duration_minutes=data.get('duration_minutes', 60),
            recurrence=data.get('recurrence', 'none'),
            recurrence_end_date=data.get('recurrence_end_date'),
        )

        # Ajouter l'organisateur comme participant
        MeetingAttendee.objects.create(
            meeting=meeting,
            user=request.user,
            status='accepted'
        )

        # Ajouter les participants
        for user_id in data.get('attendee_ids', []):
            try:
                user = User.objects.get(id=user_id)
                MeetingAttendee.objects.get_or_create(
                    meeting=meeting,
                    user=user,
                    defaults={'status': 'pending'}
                )
            except User.DoesNotExist:
                pass

        # Créer les points d'agenda
        for i, item in enumerate(data.get('agenda_items', [])):
            AgendaItem.objects.create(
                meeting=meeting,
                title=item.get('title', ''),
                description=item.get('description', ''),
                duration_minutes=item.get('duration_minutes', 10),
                order=i,
            )

        response_serializer = MeetingSerializer(
            meeting, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class MeetingDetailView(APIView):
    """
    GET    /api/meetings/{id}/ → Détail réunion
    PUT    /api/meetings/{id}/ → Modifier réunion
    DELETE /api/meetings/{id}/ → Annuler réunion
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_meeting(self, meeting_id, user):
        try:
            meeting = Meeting.objects.get(id=meeting_id, is_active=True)
            membership = get_org_membership(user, meeting.organization_id)
            if not membership:
                return None, Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return meeting, None
        except Meeting.DoesNotExist:
            return None, Response(
                {'detail': 'Réunion introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get(self, request, meeting_id):
        meeting, error = self.get_meeting(meeting_id, request.user)
        if error:
            return error
        serializer = MeetingSerializer(meeting, context={'request': request})
        return Response(serializer.data)

    def put(self, request, meeting_id):
        meeting, error = self.get_meeting(meeting_id, request.user)
        if error:
            return error

        serializer = UpdateMeetingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        for field, value in data.items():
            setattr(meeting, field, value)
        meeting.save()

        response_serializer = MeetingSerializer(
            meeting, context={'request': request}
        )
        return Response(response_serializer.data)

    def delete(self, request, meeting_id):
        meeting, error = self.get_meeting(meeting_id, request.user)
        if error:
            return error

        if meeting.organizer != request.user:
            membership = get_org_membership(
                request.user, meeting.organization_id
            )
            if not membership or membership.role != 'owner':
                return Response(
                    {'detail': 'Permission refusée.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        meeting.status = 'cancelled'
        meeting.save()
        return Response({'detail': 'Réunion annulée.'})


class MeetingAttendeeView(APIView):
    """
    PATCH /api/meetings/{id}/attend/ → Répondre à l'invitation
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(id=meeting_id, is_active=True)
            attendee = MeetingAttendee.objects.get(
                meeting=meeting,
                user=request.user
            )
        except (Meeting.DoesNotExist, MeetingAttendee.DoesNotExist):
            return Response(
                {'detail': 'Introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get('status')
        if new_status not in ['accepted', 'declined', 'tentative']:
            return Response(
                {'detail': 'Statut invalide.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attendee.status = new_status
        attendee.save()

        return Response(MeetingAttendeeSerializer(attendee).data)


class AgendaItemView(APIView):
    """
    POST  /api/meetings/{id}/agenda/        → Ajouter point agenda
    PATCH /api/meetings/{id}/agenda/{item_id}/ → Toggle item
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(id=meeting_id, is_active=True)
        except Meeting.DoesNotExist:
            return Response(
                {'detail': 'Réunion introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateAgendaItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        presenter = None
        if data.get('presenter_id'):
            try:
                presenter = User.objects.get(id=data['presenter_id'])
            except User.DoesNotExist:
                pass

        item = AgendaItem.objects.create(
            meeting=meeting,
            title=data['title'],
            description=data.get('description', ''),
            duration_minutes=data.get('duration_minutes', 10),
            order=data.get('order', 0),
            presenter=presenter,
        )

        return Response(
            AgendaItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )

    def patch(self, request, meeting_id, item_id):
        try:
            item = AgendaItem.objects.get(
                id=item_id, meeting_id=meeting_id
            )
        except AgendaItem.DoesNotExist:
            return Response(
                {'detail': 'Point introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        item.is_done = not item.is_done
        item.save()
        return Response(AgendaItemSerializer(item).data)


class MeetingActionView(APIView):
    """
    POST  /api/meetings/{id}/actions/       → Ajouter action
    PATCH /api/meetings/{id}/actions/{action_id}/ → Toggle action
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(id=meeting_id, is_active=True)
        except Meeting.DoesNotExist:
            return Response(
                {'detail': 'Réunion introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateMeetingActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        assigned_to = None
        if data.get('assigned_to_id'):
            try:
                assigned_to = User.objects.get(id=data['assigned_to_id'])
            except User.DoesNotExist:
                pass

        action = MeetingAction.objects.create(
            meeting=meeting,
            title=data['title'],
            assigned_to=assigned_to,
            due_date=data.get('due_date'),
            task_id=data.get('task_id'),
        )

        return Response(
            MeetingActionSerializer(action).data,
            status=status.HTTP_201_CREATED
        )

    def patch(self, request, meeting_id, action_id):
        try:
            action = MeetingAction.objects.get(
                id=action_id, meeting_id=meeting_id
            )
        except MeetingAction.DoesNotExist:
            return Response(
                {'detail': 'Action introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        action.is_done = not action.is_done
        action.save()
        return Response(MeetingActionSerializer(action).data)


class VoteListCreateView(APIView):
    """
    GET  /api/meetings/votes/?org_id={id} → Liste des votes
    POST /api/meetings/votes/             → Créer un vote
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org_id = request.query_params.get('org_id')
        if not org_id:
            return Response(
                {'detail': 'org_id requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership = get_org_membership(request.user, org_id)
        if not membership:
            return Response(
                {'detail': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        votes = Vote.objects.filter(
            organization_id=org_id,
            is_active=True
        ).select_related(
            'created_by'
        ).prefetch_related('options', 'responses')

        status_filter = request.query_params.get('status')
        if status_filter:
            votes = votes.filter(status=status_filter)

        serializer = VoteMinimalSerializer(
            votes, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateVoteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        org_id = request.data.get('organization_id')

        membership = get_org_membership(request.user, org_id)
        if not membership:
            return Response(
                {'detail': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        vote = Vote.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            organization_id=org_id,
            team_id=data.get('team_id'),
            created_by=request.user,
            vote_type=data.get('vote_type', 'simple'),
            is_anonymous=data.get('is_anonymous', False),
            is_weighted=data.get('is_weighted', False),
            comment_required=data.get('comment_required', False),
            multiple_choices=data.get('multiple_choices', False),
            max_choices=data.get('max_choices', 1),
            expires_at=data.get('expires_at'),
            status='active',
        )

        # Créer les options
        for i, option_text in enumerate(data['options']):
            VoteOption.objects.create(
                vote=vote,
                text=option_text,
                order=i
            )

        response_serializer = VoteSerializer(
            vote, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class VoteDetailView(APIView):
    """
    GET    /api/meetings/votes/{id}/ → Détail vote
    DELETE /api/meetings/votes/{id}/ → Fermer/annuler vote
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, vote_id):
        try:
            vote = Vote.objects.get(id=vote_id, is_active=True)
        except Vote.DoesNotExist:
            return Response(
                {'detail': 'Vote introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = VoteSerializer(vote, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, vote_id):
        try:
            vote = Vote.objects.get(id=vote_id, is_active=True)
        except Vote.DoesNotExist:
            return Response(
                {'detail': 'Vote introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if vote.created_by != request.user:
            return Response(
                {'detail': 'Permission refusée.'},
                status=status.HTTP_403_FORBIDDEN
            )

        vote.status = 'closed'
        vote.save()
        return Response({'detail': 'Vote fermé.'})


class CastVoteView(APIView):
    """
    POST /api/meetings/votes/{id}/cast/ → Voter
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, vote_id):
        try:
            vote = Vote.objects.get(
                id=vote_id,
                is_active=True,
                status='active'
            )
        except Vote.DoesNotExist:
            return Response(
                {'detail': 'Vote introuvable ou fermé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if vote.is_expired:
            return Response(
                {'detail': 'Ce vote a expiré.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si déjà voté
        if vote.responses.filter(user=request.user).exists():
            return Response(
                {'detail': 'Vous avez déjà voté.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CastVoteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        option_ids = data['option_ids']

        # Vérifier le nombre de choix
        if not vote.multiple_choices and len(option_ids) > 1:
            return Response(
                {'detail': 'Un seul choix autorisé.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(option_ids) > vote.max_choices:
            return Response(
                {'detail': f'Maximum {vote.max_choices} choix autorisés.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier commentaire obligatoire
        comment = data.get('comment', '')
        if vote.comment_required and not comment:
            return Response(
                {'detail': 'Un commentaire est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculer le poids
        weight = 1
        if vote.is_weighted:
            membership = get_org_membership(
                request.user, vote.organization_id
            )
            if membership and membership.role == 'owner':
                weight = 2

        # Enregistrer les votes
        for option_id in option_ids:
            try:
                option = VoteOption.objects.get(id=option_id, vote=vote)
                VoteResponse.objects.create(
                    vote=vote,
                    option=option,
                    user=request.user,
                    comment=comment,
                    weight=weight,
                )
            except VoteOption.DoesNotExist:
                pass

        response_serializer = VoteSerializer(
            vote, context={'request': request}
        )
        return Response(response_serializer.data)