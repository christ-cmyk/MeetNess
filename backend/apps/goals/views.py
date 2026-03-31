"""
Views REST pour les Objectifs - MeedNess.
"""
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Goal, KeyResult, KeyResultUpdate, GoalComment, GoalMember
from .serializers import (
    GoalSerializer, GoalMinimalSerializer,
    CreateGoalSerializer, KeyResultSerializer,
    CreateKeyResultSerializer, UpdateKeyResultValueSerializer,
    GoalCommentSerializer, CreateGoalCommentSerializer,
    GoalMemberSerializer, OrganizationStatsSerializer
)
from apps.organizations.models import OrganizationMember

User = get_user_model()


def get_org_membership(user, org_id):
    return OrganizationMember.objects.filter(
        user=user,
        organization_id=org_id,
        is_active=True
    ).first()


class GoalListCreateView(APIView):
    """
    GET  /api/goals/?org_id={id} → Liste des objectifs
    POST /api/goals/             → Créer un objectif
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

        # Filtrer selon la visibilité
        goals = Goal.objects.filter(
            organization_id=org_id,
            is_active=True
        ).filter(
            Q(visibility='organization') |
            Q(visibility='team', team__members__user=request.user) |
            Q(visibility='private', owner=request.user)
        ).distinct().select_related(
            'owner', 'team'
        ).prefetch_related(
            'key_results', 'members', 'members__user'
        )

        # Filtres optionnels
        status_filter = request.query_params.get('status')
        if status_filter:
            goals = goals.filter(status=status_filter)

        team_filter = request.query_params.get('team_id')
        if team_filter:
            goals = goals.filter(team_id=team_filter)

        serializer = GoalMinimalSerializer(
            goals, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateGoalSerializer(data=request.data)
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

        goal = Goal.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            organization_id=org_id,
            team_id=data.get('team_id'),
            owner=request.user,
            start_date=data.get('start_date', timezone.now().date()),
            end_date=data['end_date'],
            visibility=data.get('visibility', 'organization'),
            parent_id=data.get('parent_id'),
        )

        # Ajouter le créateur comme owner
        GoalMember.objects.create(
            goal=goal,
            user=request.user,
            role='owner'
        )

        # Ajouter les membres
        for user_id in data.get('member_ids', []):
            try:
                user = User.objects.get(id=user_id)
                GoalMember.objects.get_or_create(
                    goal=goal,
                    user=user,
                    defaults={'role': 'contributor'}
                )
            except User.DoesNotExist:
                pass

        response_serializer = GoalSerializer(
            goal, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class GoalDetailView(APIView):
    """
    GET    /api/goals/{id}/ → Détail d'un objectif
    PUT    /api/goals/{id}/ → Modifier un objectif
    DELETE /api/goals/{id}/ → Archiver un objectif
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_goal(self, goal_id, user):
        try:
            goal = Goal.objects.get(id=goal_id, is_active=True)
            membership = get_org_membership(user, goal.organization_id)
            if not membership:
                return None, Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return goal, None
        except Goal.DoesNotExist:
            return None, Response(
                {'detail': 'Objectif introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get(self, request, goal_id):
        goal, error = self.get_goal(goal_id, request.user)
        if error:
            return error
        serializer = GoalSerializer(goal, context={'request': request})
        return Response(serializer.data)

    def put(self, request, goal_id):
        goal, error = self.get_goal(goal_id, request.user)
        if error:
            return error

        updatable = [
            'title', 'description', 'end_date',
            'status', 'visibility'
        ]
        for field in updatable:
            if field in request.data:
                setattr(goal, field, request.data[field])

        goal.save()
        serializer = GoalSerializer(goal, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, goal_id):
        goal, error = self.get_goal(goal_id, request.user)
        if error:
            return error

        if goal.owner != request.user:
            membership = get_org_membership(request.user, goal.organization_id)
            if not membership or membership.role != 'owner':
                return Response(
                    {'detail': 'Permission refusée.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        goal.is_active = False
        goal.save()
        return Response({'detail': 'Objectif archivé.'})


class KeyResultListCreateView(APIView):
    """
    GET  /api/goals/{id}/key-results/ → Liste des KR
    POST /api/goals/{id}/key-results/ → Créer un KR
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id, is_active=True)
        except Goal.DoesNotExist:
            return Response(
                {'detail': 'Objectif introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        key_results = goal.key_results.filter(
            is_active=True
        ).select_related('owner').prefetch_related('updates')

        serializer = KeyResultSerializer(
            key_results, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id, is_active=True)
        except Goal.DoesNotExist:
            return Response(
                {'detail': 'Objectif introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateKeyResultSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        owner = None
        if data.get('owner_id'):
            try:
                owner = User.objects.get(id=data['owner_id'])
            except User.DoesNotExist:
                pass

        kr = KeyResult.objects.create(
            goal=goal,
            title=data['title'],
            description=data.get('description', ''),
            metric_type=data.get('metric_type', 'number'),
            start_value=data.get('start_value', 0),
            target_value=data['target_value'],
            current_value=data.get('start_value', 0),
            unit=data.get('unit', ''),
            owner=owner or request.user,
            order=data.get('order', 0),
        )

        response_serializer = KeyResultSerializer(
            kr, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class KeyResultUpdateView(APIView):
    """
    POST /api/goals/key-results/{kr_id}/update/ → Mettre à jour la valeur
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, kr_id):
        try:
            kr = KeyResult.objects.get(id=kr_id, is_active=True)
        except KeyResult.DoesNotExist:
            return Response(
                {'detail': 'Résultat clé introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateKeyResultValueSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        previous_value = kr.current_value
        new_value = data['value']

        # Sauvegarder l'historique
        KeyResultUpdate.objects.create(
            key_result=kr,
            previous_value=previous_value,
            new_value=new_value,
            note=data.get('note', ''),
            updated_by=request.user,
        )

        # Mettre à jour la valeur
        kr.current_value = new_value
        kr.save()

        # Mettre à jour le statut de l'objectif
        kr.goal.update_status()

        response_serializer = KeyResultSerializer(
            kr, context={'request': request}
        )
        return Response(response_serializer.data)


class GoalCommentView(APIView):
    """
    GET    /api/goals/{id}/comments/ → Liste commentaires
    POST   /api/goals/{id}/comments/ → Ajouter commentaire
    DELETE /api/goals/{id}/comments/{comment_id}/ → Supprimer
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, goal_id):
        comments = GoalComment.objects.filter(
            goal_id=goal_id,
            is_deleted=False
        ).select_related('author')

        serializer = GoalCommentSerializer(
            comments, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id, is_active=True)
        except Goal.DoesNotExist:
            return Response(
                {'detail': 'Objectif introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateGoalCommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = GoalComment.objects.create(
            goal=goal,
            author=request.user,
            content=serializer.validated_data['content']
        )

        response_serializer = GoalCommentSerializer(
            comment, context={'request': request}
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, goal_id, comment_id):
        try:
            comment = GoalComment.objects.get(
                id=comment_id,
                goal_id=goal_id
            )
        except GoalComment.DoesNotExist:
            return Response(
                {'detail': 'Commentaire introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if comment.author != request.user:
            return Response(
                {'detail': 'Permission refusée.'},
                status=status.HTTP_403_FORBIDDEN
            )

        comment.is_deleted = True
        comment.save()
        return Response({'detail': 'Commentaire supprimé.'})


class OrganizationStatsView(APIView):
    """
    GET /api/goals/stats/?org_id={id}
    Stats globales pour le cercle de progression (écran Accueil).
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

        from apps.tasks.models import Task, Column

        # Stats tâches
        all_tasks = Task.objects.filter(
            board__organization_id=org_id,
            is_archived=False
        )
        tasks_total = all_tasks.count()
        tasks_completed = all_tasks.filter(
            column__column_type='done'
        ).count()
        tasks_progress = round(
            (tasks_completed / tasks_total * 100) if tasks_total > 0 else 0
        )

        # Stats ponctualité
        tasks_overdue = all_tasks.filter(
            due_date__lt=timezone.now(),
            completed_at__isnull=True
        ).count()
        tasks_on_time = tasks_total - tasks_overdue
        punctuality_progress = round(
            (tasks_on_time / tasks_total * 100) if tasks_total > 0 else 100
        )

        # Stats objectifs
        all_goals = Goal.objects.filter(
            organization_id=org_id,
            is_active=True
        )
        goals_total = all_goals.count()
        goals_completed = all_goals.filter(status='completed').count()
        goals_progress = round(
            sum(g.progress for g in all_goals) / goals_total
            if goals_total > 0 else 0
        )

        # Score global
        global_score = round(
            (tasks_progress + goals_progress + punctuality_progress) / 3
        )

        # Stats par membre
        members = OrganizationMember.objects.filter(
            organization_id=org_id,
            is_active=True
        ).select_related('user')

        members_stats = []
        for member in members:
            member_tasks = all_tasks.filter(
                assigned_to=member.user
            )
            member_total = member_tasks.count()
            member_done = member_tasks.filter(
                column__column_type='done'
            ).count()
            members_stats.append({
                'user_id': str(member.user.id),
                'username': member.user.username,
                'avatar': member.user.avatar.url if member.user.avatar else None,
                'tasks_total': member_total,
                'tasks_completed': member_done,
                'progress': round(
                    (member_done / member_total * 100)
                    if member_total > 0 else 0
                ),
            })

        return Response({
            'tasks_total': tasks_total,
            'tasks_completed': tasks_completed,
            'tasks_progress': tasks_progress,
            'goals_total': goals_total,
            'goals_completed': goals_completed,
            'goals_progress': goals_progress,
            'tasks_on_time': tasks_on_time,
            'tasks_overdue': tasks_overdue,
            'punctuality_progress': punctuality_progress,
            'global_score': global_score,
            'members_stats': members_stats,
        })