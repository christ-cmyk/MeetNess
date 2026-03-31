"""
Serializers pour les Réunions et Votes - MeedNess.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Meeting, MeetingAttendee, AgendaItem,
    MeetingAction, Vote, VoteOption, VoteResponse
)

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class MeetingAttendeeSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = MeetingAttendee
        fields = [
            'id', 'user', 'status',
            'joined_at', 'left_at', 'invited_at'
        ]


class AgendaItemSerializer(serializers.ModelSerializer):
    presenter = UserMinimalSerializer(read_only=True)

    class Meta:
        model = AgendaItem
        fields = [
            'id', 'title', 'description',
            'duration_minutes', 'order',
            'is_done', 'presenter', 'created_at'
        ]


class MeetingActionSerializer(serializers.ModelSerializer):
    assigned_to = UserMinimalSerializer(read_only=True)

    class Meta:
        model = MeetingAction
        fields = [
            'id', 'title', 'assigned_to',
            'due_date', 'is_done', 'task',
            'created_at'
        ]


class MeetingSerializer(serializers.ModelSerializer):
    organizer = UserMinimalSerializer(read_only=True)
    attendees = MeetingAttendeeSerializer(many=True, read_only=True)
    agenda_items = AgendaItemSerializer(many=True, read_only=True)
    actions = MeetingActionSerializer(many=True, read_only=True)
    attendees_count = serializers.IntegerField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'description',
            'organization', 'team', 'organizer',
            'start_time', 'end_time', 'duration_minutes',
            'status', 'recurrence', 'recurrence_end_date',
            'jitsi_room_name', 'jitsi_url',
            'summary', 'decisions',
            'attendees', 'attendees_count',
            'agenda_items', 'actions',
            'is_ongoing', 'is_active',
            'created_at', 'updated_at'
        ]


class MeetingMinimalSerializer(serializers.ModelSerializer):
    organizer = UserMinimalSerializer(read_only=True)
    attendees_count = serializers.IntegerField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'status',
            'organizer', 'start_time', 'end_time',
            'duration_minutes', 'jitsi_url',
            'attendees_count', 'is_ongoing',
            'recurrence', 'created_at'
        ]


class CreateMeetingSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=60)
    recurrence = serializers.ChoiceField(
        choices=['none', 'daily', 'weekly', 'monthly'],
        default='none'
    )
    recurrence_end_date = serializers.DateField(
        required=False, allow_null=True
    )
    team_id = serializers.UUIDField(required=False, allow_null=True)
    attendee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
    agenda_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

    def validate(self, data):
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError(
                "L'heure de fin doit être après l'heure de début."
            )
        return data


class UpdateMeetingSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    start_time = serializers.DateTimeField(required=False)
    end_time = serializers.DateTimeField(required=False)
    status = serializers.ChoiceField(
        choices=['scheduled', 'in_progress', 'completed', 'cancelled'],
        required=False
    )
    summary = serializers.CharField(required=False, allow_blank=True)
    decisions = serializers.CharField(required=False, allow_blank=True)


class CreateAgendaItemSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    duration_minutes = serializers.IntegerField(default=10)
    order = serializers.IntegerField(default=0)
    presenter_id = serializers.UUIDField(required=False, allow_null=True)


class CreateMeetingActionSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    task_id = serializers.UUIDField(required=False, allow_null=True)


class VoteOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = VoteOption
        fields = [
            'id', 'text', 'order',
            'votes_count', 'percentage'
        ]

    def get_votes_count(self, obj):
        return obj.responses.count()

    def get_percentage(self, obj):
        total = obj.vote.total_votes
        if total == 0:
            return 0
        return round(obj.responses.count() / total * 100)


class VoteResponseSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    option = VoteOptionSerializer(read_only=True)

    class Meta:
        model = VoteResponse
        fields = ['id', 'user', 'option', 'comment', 'weight', 'created_at']


class VoteSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    options = VoteOptionSerializer(many=True, read_only=True)
    results = serializers.SerializerMethodField()
    total_votes = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Vote
        fields = [
            'id', 'title', 'description',
            'organization', 'team', 'created_by',
            'vote_type', 'status',
            'is_anonymous', 'is_weighted',
            'comment_required', 'multiple_choices', 'max_choices',
            'starts_at', 'expires_at',
            'options', 'results',
            'total_votes', 'is_expired',
            'user_has_voted',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_results(self, obj):
        if obj.is_anonymous:
            request = self.context.get('request')
            if request and not obj.responses.filter(
                user=request.user
            ).exists():
                return None
        return obj.results

    def get_user_has_voted(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.responses.filter(user=request.user).exists()


class VoteMinimalSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    options_count = serializers.SerializerMethodField()
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Vote
        fields = [
            'id', 'title', 'status', 'vote_type',
            'created_by', 'is_anonymous',
            'expires_at', 'total_votes',
            'is_expired', 'options_count',
            'user_has_voted', 'created_at'
        ]

    def get_options_count(self, obj):
        return obj.options.count()

    def get_user_has_voted(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.responses.filter(user=request.user).exists()


class CreateVoteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    vote_type = serializers.ChoiceField(
        choices=['simple', 'advanced'],
        default='simple'
    )
    is_anonymous = serializers.BooleanField(default=False)
    is_weighted = serializers.BooleanField(default=False)
    comment_required = serializers.BooleanField(default=False)
    multiple_choices = serializers.BooleanField(default=False)
    max_choices = serializers.IntegerField(default=1)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    team_id = serializers.UUIDField(required=False, allow_null=True)
    options = serializers.ListField(
        child=serializers.CharField(max_length=500),
        min_length=2,
        max_length=10
    )


class CastVoteSerializer(serializers.Serializer):
    option_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    comment = serializers.CharField(required=False, allow_blank=True)