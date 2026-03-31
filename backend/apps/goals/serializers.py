"""
Serializers pour les Objectifs - MeedNess.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Goal, KeyResult, KeyResultUpdate, GoalComment, GoalMember

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class KeyResultUpdateSerializer(serializers.ModelSerializer):
    updated_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = KeyResultUpdate
        fields = [
            'id', 'previous_value', 'new_value',
            'note', 'updated_by', 'created_at'
        ]


class KeyResultSerializer(serializers.ModelSerializer):
    owner = UserMinimalSerializer(read_only=True)
    progress = serializers.IntegerField(read_only=True)
    updates = KeyResultUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = KeyResult
        fields = [
            'id', 'goal', 'title', 'description',
            'metric_type', 'start_value', 'target_value',
            'current_value', 'unit', 'owner', 'progress',
            'updates', 'order', 'is_active',
            'created_at', 'updated_at'
        ]


class KeyResultMinimalSerializer(serializers.ModelSerializer):
    progress = serializers.IntegerField(read_only=True)
    owner = UserMinimalSerializer(read_only=True)

    class Meta:
        model = KeyResult
        fields = [
            'id', 'title', 'metric_type',
            'start_value', 'target_value',
            'current_value', 'unit',
            'owner', 'progress', 'order'
        ]


class GoalCommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = GoalComment
        fields = [
            'id', 'content', 'author',
            'is_deleted', 'created_at', 'updated_at'
        ]


class GoalMemberSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = GoalMember
        fields = ['id', 'user', 'role', 'joined_at']


class GoalSerializer(serializers.ModelSerializer):
    owner = UserMinimalSerializer(read_only=True)
    key_results = KeyResultMinimalSerializer(many=True, read_only=True)
    members = GoalMemberSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    progress = serializers.IntegerField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    key_results_count = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'description',
            'organization', 'team', 'owner',
            'start_date', 'end_date', 'status',
            'visibility', 'parent',
            'key_results', 'key_results_count',
            'members', 'comments_count',
            'progress', 'days_remaining', 'is_overdue',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_key_results_count(self, obj):
        return obj.key_results.filter(is_active=True).count()


class GoalMinimalSerializer(serializers.ModelSerializer):
    """Serializer minimal pour la liste des objectifs."""
    owner = UserMinimalSerializer(read_only=True)
    progress = serializers.IntegerField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    key_results_count = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'status', 'visibility',
            'owner', 'start_date', 'end_date',
            'progress', 'days_remaining', 'is_overdue',
            'key_results_count', 'team',
            'created_at', 'updated_at'
        ]

    def get_key_results_count(self, obj):
        return obj.key_results.filter(is_active=True).count()


class CreateGoalSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    end_date = serializers.DateField()
    start_date = serializers.DateField(required=False)
    visibility = serializers.ChoiceField(
        choices=['organization', 'team', 'private'],
        default='organization'
    )
    team_id = serializers.UUIDField(required=False, allow_null=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )


class CreateKeyResultSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    metric_type = serializers.ChoiceField(
        choices=['number', 'percentage', 'currency', 'boolean'],
        default='number'
    )
    start_value = serializers.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )
    target_value = serializers.DecimalField(
        max_digits=15, decimal_places=2
    )
    unit = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    owner_id = serializers.UUIDField(required=False, allow_null=True)
    order = serializers.IntegerField(default=0)


class UpdateKeyResultValueSerializer(serializers.Serializer):
    value = serializers.DecimalField(max_digits=15, decimal_places=2)
    note = serializers.CharField(required=False, allow_blank=True)


class CreateGoalCommentSerializer(serializers.Serializer):
    content = serializers.CharField()


class OrganizationStatsSerializer(serializers.Serializer):
    """Stats globales pour le cercle de progression."""
    tasks_total = serializers.IntegerField()
    tasks_completed = serializers.IntegerField()
    tasks_progress = serializers.IntegerField()
    goals_total = serializers.IntegerField()
    goals_completed = serializers.IntegerField()
    goals_progress = serializers.IntegerField()
    tasks_on_time = serializers.IntegerField()
    tasks_overdue = serializers.IntegerField()
    punctuality_progress = serializers.IntegerField()
    global_score = serializers.IntegerField()
    members_stats = serializers.ListField()