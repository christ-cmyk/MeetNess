"""
Views REST pour les tâches - MeedNess.
"""
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Board, Column, Task, SubTask, TaskLabel, TaskComment, TaskAttachment, TaskActivity
from .serializers import (
    BoardSerializer, ColumnSerializer, TaskSerializer,
    TaskMinimalSerializer, TaskCommentSerializer,
    TaskActivitySerializer, TaskLabelSerializer,
    CreateBoardSerializer, CreateColumnSerializer,
    CreateTaskSerializer, MoveTaskSerializer,
    CreateSubTaskSerializer, CreateCommentSerializer,
    CreateLabelSerializer
)
from apps.organizations.models import OrganizationMember

User = get_user_model()


def get_org_membership(user, org_id):
    """Récupère le membership d'un user dans une organisation."""
    return OrganizationMember.objects.filter(
        user=user,
        organization_id=org_id,
        is_active=True
    ).first()


class BoardListCreateView(APIView):
    """
    GET  /api/tasks/boards/?org_id={id}  → Liste des tableaux
    POST /api/tasks/boards/              → Créer un tableau
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

        boards = Board.objects.filter(
            organization_id=org_id,
            is_active=True
        ).prefetch_related(
            'columns',
            'columns__tasks',
            'columns__tasks__assigned_to',
            'columns__tasks__labels',
            'columns__tasks__subtasks',
        )

        serializer = BoardSerializer(boards, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateBoardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        org_id = request.data.get('organization_id')

        membership = get_org_membership(request.user, org_id)
        if not membership or membership.role not in ['owner', 'admin']:
            return Response(
                {'detail': 'Seuls les owners et admins peuvent créer un tableau.'},
                status=status.HTTP_403_FORBIDDEN
            )

        board = Board.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            organization_id=org_id,
            team_id=data.get('team_id'),
            created_by=request.user,
        )

        # Créer les colonnes par défaut
        default_columns = [
            {'name': 'Backlog', 'type': 'backlog', 'color': '#6B7280', 'order': 0},
            {'name': 'À faire', 'type': 'todo', 'color': '#3B82F6', 'order': 1},
            {'name': 'En cours', 'type': 'in_progress', 'color': '#F59E0B', 'order': 2},
            {'name': 'En révision', 'type': 'in_review', 'color': '#8B5CF6', 'order': 3},
            {'name': 'Terminé', 'type': 'done', 'color': '#10B981', 'order': 4},
        ]

        for col in default_columns:
            Column.objects.create(
                board=board,
                name=col['name'],
                column_type=col['type'],
                color=col['color'],
                order=col['order']
            )

        response_serializer = BoardSerializer(board, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class BoardDetailView(APIView):
    """
    GET    /api/tasks/boards/{id}/ → Détail d'un tableau
    PUT    /api/tasks/boards/{id}/ → Modifier un tableau
    DELETE /api/tasks/boards/{id}/ → Supprimer un tableau
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_board(self, board_id, user):
        try:
            board = Board.objects.get(id=board_id, is_active=True)
            membership = get_org_membership(user, board.organization_id)
            if not membership:
                return None, Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return board, None
        except Board.DoesNotExist:
            return None, Response(
                {'detail': 'Tableau introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get(self, request, board_id):
        board, error = self.get_board(board_id, request.user)
        if error:
            return error
        serializer = BoardSerializer(board, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, board_id):
        board, error = self.get_board(board_id, request.user)
        if error:
            return error

        membership = get_org_membership(request.user, board.organization_id)
        if membership.role != 'owner':
            return Response(
                {'detail': 'Seul le owner peut supprimer un tableau.'},
                status=status.HTTP_403_FORBIDDEN
            )

        board.is_active = False
        board.save()
        return Response({'detail': 'Tableau supprimé.'})


class TaskListCreateView(APIView):
    """
    GET  /api/tasks/boards/{id}/tasks/ → Liste des tâches
    POST /api/tasks/boards/{id}/tasks/ → Créer une tâche
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, board_id):
        try:
            board = Board.objects.get(id=board_id, is_active=True)
            membership = get_org_membership(request.user, board.organization_id)
            if not membership:
                return Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Board.DoesNotExist:
            return Response(
                {'detail': 'Tableau introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        tasks = Task.objects.filter(
            board=board,
            is_archived=False
        ).select_related(
            'created_by', 'column'
        ).prefetch_related(
            'assigned_to', 'labels', 'subtasks'
        )

        serializer = TaskMinimalSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, board_id):
        try:
            board = Board.objects.get(id=board_id, is_active=True)
            membership = get_org_membership(request.user, board.organization_id)
            if not membership:
                return Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Board.DoesNotExist:
            return Response(
                {'detail': 'Tableau introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            column = Column.objects.get(id=data['column_id'], board=board)
        except Column.DoesNotExist:
            return Response(
                {'detail': 'Colonne introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        task = Task.objects.create(
            board=board,
            column=column,
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            due_date=data.get('due_date'),
            estimated_hours=data.get('estimated_hours'),
            created_by=request.user,
        )

        # Assigner les membres
        for user_id in data.get('assigned_to', []):
            try:
                user = User.objects.get(id=user_id)
                task.assigned_to.add(user)
            except User.DoesNotExist:
                pass

        # Ajouter les labels
        for label_id in data.get('label_ids', []):
            try:
                label = TaskLabel.objects.get(id=label_id, organization=board.organization)
                task.labels.add(label)
            except TaskLabel.DoesNotExist:
                pass

        # Log activité
        TaskActivity.objects.create(
            task=task,
            user=request.user,
            action='created',
            detail={'title': task.title}
        )

        response_serializer = TaskSerializer(task, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """
    GET    /api/tasks/{id}/ → Détail d'une tâche
    PUT    /api/tasks/{id}/ → Modifier une tâche
    DELETE /api/tasks/{id}/ → Archiver une tâche
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_task(self, task_id, user):
        try:
            task = Task.objects.get(id=task_id, is_archived=False)
            membership = get_org_membership(user, task.board.organization_id)
            if not membership:
                return None, Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return task, None
        except Task.DoesNotExist:
            return None, Response(
                {'detail': 'Tâche introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get(self, request, task_id):
        task, error = self.get_task(task_id, request.user)
        if error:
            return error
        serializer = TaskSerializer(task, context={'request': request})
        return Response(serializer.data)

    def put(self, request, task_id):
        task, error = self.get_task(task_id, request.user)
        if error:
            return error

        updatable_fields = [
            'title', 'description', 'priority',
            'due_date', 'estimated_hours', 'actual_hours'
        ]

        for field in updatable_fields:
            if field in request.data:
                setattr(task, field, request.data[field])

        task.save()

        serializer = TaskSerializer(task, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, task_id):
        task, error = self.get_task(task_id, request.user)
        if error:
            return error

        task.is_archived = True
        task.save()

        TaskActivity.objects.create(
            task=task,
            user=request.user,
            action='archived',
        )

        return Response({'detail': 'Tâche archivée.'})


class MoveTaskView(APIView):
    """
    POST /api/tasks/{id}/move/ → Déplacer une tâche (drag & drop)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id, is_archived=False)
            membership = get_org_membership(request.user, task.board.organization_id)
            if not membership:
                return Response(
                    {'detail': 'Accès refusé.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Task.DoesNotExist:
            return Response(
                {'detail': 'Tâche introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MoveTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        old_column = task.column

        try:
            new_column = Column.objects.get(id=data['column_id'], board=task.board)
        except Column.DoesNotExist:
            return Response(
                {'detail': 'Colonne introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        task.column = new_column
        task.order = data.get('order', 0)

        # Gérer les timestamps automatiques
        if new_column.column_type == 'in_progress' and not task.started_at:
            task.started_at = timezone.now()
        elif new_column.column_type == 'done' and not task.completed_at:
            task.completed_at = timezone.now()

        task.save()

        TaskActivity.objects.create(
            task=task,
            user=request.user,
            action='moved',
            detail={
                'from': old_column.name,
                'to': new_column.name
            }
        )

        serializer = TaskSerializer(task, context={'request': request})
        return Response(serializer.data)


class SubTaskView(APIView):
    """
    POST   /api/tasks/{id}/subtasks/        → Ajouter une sous-tâche
    PATCH  /api/tasks/{id}/subtasks/{sub_id}/ → Toggler une sous-tâche
    DELETE /api/tasks/{id}/subtasks/{sub_id}/ → Supprimer une sous-tâche
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id, is_archived=False)
        except Task.DoesNotExist:
            return Response(
                {'detail': 'Tâche introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateSubTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        subtask = SubTask.objects.create(
            task=task,
            title=serializer.validated_data['title'],
            order=serializer.validated_data.get('order', 0),
            created_by=request.user,
        )

        return Response(
            {'id': str(subtask.id), 'title': subtask.title, 'is_done': subtask.is_done},
            status=status.HTTP_201_CREATED
        )

    def patch(self, request, task_id, subtask_id):
        try:
            subtask = SubTask.objects.get(id=subtask_id, task_id=task_id)
        except SubTask.DoesNotExist:
            return Response(
                {'detail': 'Sous-tâche introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        subtask.is_done = not subtask.is_done
        subtask.save()

        return Response({'id': str(subtask.id), 'is_done': subtask.is_done})

    def delete(self, request, task_id, subtask_id):
        try:
            subtask = SubTask.objects.get(id=subtask_id, task_id=task_id)
        except SubTask.DoesNotExist:
            return Response(
                {'detail': 'Sous-tâche introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        subtask.delete()
        return Response({'detail': 'Sous-tâche supprimée.'})


class TaskCommentView(APIView):
    """
    GET    /api/tasks/{id}/comments/ → Liste des commentaires
    POST   /api/tasks/{id}/comments/ → Ajouter un commentaire
    DELETE /api/tasks/{id}/comments/{comment_id}/ → Supprimer
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id):
        comments = TaskComment.objects.filter(
            task_id=task_id,
            is_deleted=False
        ).select_related('author')

        serializer = TaskCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id, is_archived=False)
        except Task.DoesNotExist:
            return Response(
                {'detail': 'Tâche introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreateCommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        comment = TaskComment.objects.create(
            task=task,
            author=request.user,
            content=serializer.validated_data['content']
        )

        TaskActivity.objects.create(
            task=task,
            user=request.user,
            action='commented',
            detail={'comment': comment.content[:100]}
        )

        response_serializer = TaskCommentSerializer(comment, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, task_id, comment_id):
        try:
            comment = TaskComment.objects.get(
                id=comment_id,
                task_id=task_id
            )
        except TaskComment.DoesNotExist:
            return Response(
                {'detail': 'Commentaire introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if comment.author != request.user:
            return Response(
                {'detail': 'Vous ne pouvez supprimer que vos commentaires.'},
                status=status.HTTP_403_FORBIDDEN
            )

        comment.is_deleted = True
        comment.save()
        return Response({'detail': 'Commentaire supprimé.'})


class TaskActivityView(APIView):
    """
    GET /api/tasks/{id}/activity/ → Historique d'une tâche
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id):
        activities = TaskActivity.objects.filter(
            task_id=task_id
        ).select_related('user')[:50]

        serializer = TaskActivitySerializer(activities, many=True)
        return Response(serializer.data)


class TaskLabelView(APIView):
    """
    GET  /api/tasks/labels/?org_id={id} → Liste des labels
    POST /api/tasks/labels/             → Créer un label
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org_id = request.query_params.get('org_id')
        labels = TaskLabel.objects.filter(organization_id=org_id)
        serializer = TaskLabelSerializer(labels, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateLabelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        org_id = request.data.get('organization_id')
        label = TaskLabel.objects.create(
            organization_id=org_id,
            name=serializer.validated_data['name'],
            color=serializer.validated_data.get('color', '#3B82F6')
        )

        return Response(
            TaskLabelSerializer(label).data,
            status=status.HTTP_201_CREATED
        )