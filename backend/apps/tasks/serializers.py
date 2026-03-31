"""
Serializers pour les tâches - MeedNess.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Board, Column, Task, SubTask, TaskLabel, TaskComment, TaskAttachment, TaskActivity

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class TaskLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskLabel
        fields = ['id', 'name', 'color']


class SubTaskSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = SubTask
        fields = ['id', 'title', 'is_done', 'order', 'created_by', 'created_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserMinimalSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'file_url', 'filename',
            'file_size', 'mime_type',
            'uploaded_by', 'created_at'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = [
            'id', 'content', 'author',
            'is_deleted', 'created_at', 'updated_at'
        ]


class TaskActivitySerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TaskActivity
        fields = ['id', 'action', 'detail', 'user', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserMinimalSerializer(many=True, read_only=True)
    created_by = UserMinimalSerializer(read_only=True)
    labels = TaskLabelSerializer(many=True, read_only=True)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'board', 'column', 'title', 'description',
            'priority', 'order', 'assigned_to', 'created_by',
            'labels', 'subtasks', 'attachments', 'comments_count',
            'due_date', 'started_at', 'completed_at',
            'estimated_hours', 'actual_hours',
            'is_overdue', 'progress', 'is_archived',
            'created_at', 'updated_at'
        ]

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()


class TaskMinimalSerializer(serializers.ModelSerializer):
    """Serializer minimal pour la vue Kanban."""
    assigned_to = UserMinimalSerializer(many=True, read_only=True)
    labels = TaskLabelSerializer(many=True, read_only=True)
    subtasks_count = serializers.SerializerMethodField()
    subtasks_done = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'column', 'title', 'priority', 'order',
            'assigned_to', 'labels', 'due_date',
            'subtasks_count', 'subtasks_done',
            'is_overdue', 'progress',
            'created_at', 'updated_at'
        ]

    def get_subtasks_count(self, obj):
        return obj.subtasks.count()

    def get_subtasks_done(self, obj):
        return obj.subtasks.filter(is_done=True).count()


class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskMinimalSerializer(many=True, read_only=True)
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Column
        fields = [
            'id', 'board', 'name', 'column_type',
            'order', 'color', 'task_limit',
            'tasks', 'tasks_count', 'is_active', 'created_at'
        ]

    def get_tasks_count(self, obj):
        return obj.tasks.filter(is_archived=False).count()


class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    created_by = UserMinimalSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Board
        fields = [
            'id', 'name', 'description', 'organization',
            'team', 'created_by', 'columns',
            'tasks_count', 'members_count',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_tasks_count(self, obj):
        return obj.tasks.filter(is_archived=False).count()

    def get_members_count(self, obj):
        if obj.team:
            return obj.team.members.filter(is_active=True).count()
        return obj.organization.members.filter(is_active=True).count()


class CreateBoardSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    team_id = serializers.UUIDField(required=False, allow_null=True)


class CreateColumnSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    column_type = serializers.ChoiceField(
        choices=['backlog', 'todo', 'in_progress', 'in_review', 'done', 'custom'],
        default='custom'
    )
    color = serializers.CharField(max_length=7, default='#6B7280')
    task_limit = serializers.IntegerField(required=False, allow_null=True)
    order = serializers.IntegerField(default=0)


class CreateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    column_id = serializers.UUIDField()
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'urgent'],
        default='medium'
    )
    assigned_to = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
    label_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
    due_date = serializers.DateTimeField(
    required=False,
    allow_null=True,
    input_formats=['%Y-%m-%d', '%Y %m %d', '%d/%m/%Y', 'iso-8601']
)
    estimated_hours = serializers.DecimalField(
        max_digits=5, decimal_places=1,
        required=False, allow_null=True
    )


class MoveTaskSerializer(serializers.Serializer):
    column_id = serializers.UUIDField()
    order = serializers.IntegerField(default=0)


class CreateSubTaskSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    order = serializers.IntegerField(default=0)


class CreateCommentSerializer(serializers.Serializer):
    content = serializers.CharField()


class CreateLabelSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    color = serializers.CharField(max_length=7, default='#3B82F6')