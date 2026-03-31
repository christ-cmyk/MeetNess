"""
Modèles pour les Réunions et Votes - MeedNess.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Meeting(models.Model):
    """
    Réunion planifiée dans une organisation.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Planifiée'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]

    RECURRENCE_CHOICES = [
        ('none', 'Aucune'),
        ('daily', 'Quotidienne'),
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuelle'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)

    # Organisation et équipe
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='meetings'
    )
    team = models.ForeignKey(
        'organizations.Team',
        on_delete=models.CASCADE,
        related_name='meetings',
        null=True,
        blank=True
    )

    # Organisateur
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='organized_meetings'
    )

    # Dates
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)

    # Statut
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )

    # Récurrence
    recurrence = models.CharField(
        max_length=20,
        choices=RECURRENCE_CHOICES,
        default='none'
    )
    recurrence_end_date = models.DateField(null=True, blank=True)

    # Jitsi
    jitsi_room_name = models.CharField(max_length=255, unique=True)
    jitsi_url = models.URLField(blank=True)

    # Compte-rendu
    summary = models.TextField(blank=True)
    decisions = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        verbose_name = 'Réunion'
        verbose_name_plural = 'Réunions'

    def __str__(self):
        return f"{self.title} — {self.start_time.strftime('%d/%m/%Y %H:%M')}"

    def save(self, *args, **kwargs):
        # Générer le nom de salle Jitsi automatiquement
        if not self.jitsi_room_name:
            self.jitsi_room_name = f"meedness-{uuid.uuid4().hex[:12]}"
        if not self.jitsi_url:
            self.jitsi_url = f"https://meet.jit.si/{self.jitsi_room_name}"
        super().save(*args, **kwargs)

    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    @property
    def attendees_count(self):
        return self.attendees.filter(
            status__in=['accepted', 'tentative']
        ).count()


class MeetingAttendee(models.Model):
    """
    Participant à une réunion.
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('declined', 'Refusé'),
        ('tentative', 'Peut-être'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='attendees'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meeting_attendances'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    joined_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)
    invited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['meeting', 'user']
        verbose_name = 'Participant'
        verbose_name_plural = 'Participants'

    def __str__(self):
        return f"{self.user.username} → {self.meeting.title}"


class AgendaItem(models.Model):
    """
    Point de l'ordre du jour d'une réunion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='agenda_items'
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=10)
    order = models.PositiveIntegerField(default=0)
    is_done = models.BooleanField(default=False)
    presenter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agenda_presentations'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        verbose_name = "Point d'ordre du jour"
        verbose_name_plural = "Points d'ordre du jour"

    def __str__(self):
        return f"{self.order}. {self.title}"


class MeetingAction(models.Model):
    """
    Action à suivre après une réunion (liée aux tâches).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    title = models.CharField(max_length=500)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='meeting_actions'
    )
    due_date = models.DateField(null=True, blank=True)
    is_done = models.BooleanField(default=False)

    # Lien optionnel vers une tâche Kanban
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='meeting_actions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Action'
        verbose_name_plural = 'Actions'

    def __str__(self):
        return self.title


class Vote(models.Model):
    """
    Vote ou sondage dans une organisation.
    """
    VOTE_TYPES = [
        ('simple', 'Simple'),
        ('advanced', 'Avancé'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('active', 'Actif'),
        ('closed', 'Fermé'),
        ('cancelled', 'Annulé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)

    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='votes'
    )
    team = models.ForeignKey(
        'organizations.Team',
        on_delete=models.CASCADE,
        related_name='votes',
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_votes'
    )

    vote_type = models.CharField(
        max_length=20,
        choices=VOTE_TYPES,
        default='simple'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )

    # Options avancées
    is_anonymous = models.BooleanField(default=False)
    is_weighted = models.BooleanField(default=False)
    comment_required = models.BooleanField(default=False)
    multiple_choices = models.BooleanField(default=False)
    max_choices = models.PositiveIntegerField(default=1)

    # Dates
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'

    def __str__(self):
        return self.title

    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    @property
    def total_votes(self):
        return self.responses.count()

    @property
    def results(self):
        """Calcule les résultats en temps réel."""
        options = self.options.all()
        total = self.total_votes
        results = []
        for option in options:
            count = option.responses.count()
            percentage = round((count / total * 100) if total > 0 else 0)
            results.append({
                'option_id': str(option.id),
                'text': option.text,
                'count': count,
                'percentage': percentage,
            })
        return results


class VoteOption(models.Model):
    """
    Option d'un vote.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vote = models.ForeignKey(
        Vote,
        on_delete=models.CASCADE,
        related_name='options'
    )
    text = models.CharField(max_length=500)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Option'
        verbose_name_plural = 'Options'

    def __str__(self):
        return f"{self.vote.title} — {self.text}"


class VoteResponse(models.Model):
    """
    Réponse d'un utilisateur à un vote.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vote = models.ForeignKey(
        Vote,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    option = models.ForeignKey(
        VoteOption,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vote_responses'
    )
    comment = models.TextField(blank=True)
    weight = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['vote', 'option', 'user']
        verbose_name = 'Réponse'
        verbose_name_plural = 'Réponses'

    def __str__(self):
        return f"{self.user.username} → {self.option.text}"