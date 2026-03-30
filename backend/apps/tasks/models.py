"""
Modèles pour la gestion des tâches (Kanban) - MeedNess.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Board(models.Model):
    """
    Tableau Kanban lié à une organisation ou une équipe.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='boards'
    )
    team = models.ForeignKey(
        'organizations.Team',
        on_delete=models.CASCADE,
        related_name='boards',
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_boards'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Tableau'
        verbose_name_plural = 'Tableaux'

    def __str__(self):
        return f"{self.name} — {self.organization.name}"


class Column(models.Model):
    """
    Colonne d'un tableau Kanban.
    """
    COLUMN_TYPES = [
        ('backlog', 'Backlog'),
        ('todo', 'À faire'),
        ('in_progress', 'En cours'),
        ('in_review', 'En révision'),
        ('done', 'Terminé'),
        ('custom', 'Personnalisé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='columns'
    )
    name = models.CharField(max_length=100)
    column_type = models.CharField(
        max_length=20,
        choices=COLUMN_TYPES,
        default='custom'
    )
    order = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=7, default='#6B7280')
    task_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Limite de tâches dans cette colonne (WIP limit)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Colonne'
        verbose_name_plural = 'Colonnes'

    def __str__(self):
        return f"{self.name} — {self.board.name}"


class Task(models.Model):
    """
    Tâche dans une colonne Kanban.
    """
    PRIORITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    column = models.ForeignKey(
        Column,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    order = models.PositiveIntegerField(default=0)

    # Assignation
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_tasks',
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )

    # Dates
    due_date = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Métadonnées
    estimated_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True
    )
    actual_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True
    )

    # Labels/Tags
    labels = models.ManyToManyField(
        'TaskLabel',
        related_name='tasks',
        blank=True
    )

    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Tâche'
        verbose_name_plural = 'Tâches'

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        if self.due_date and not self.completed_at:
            return timezone.now() > self.due_date
        return False

    @property
    def progress(self):
        total = self.subtasks.count()
        if total == 0:
            return 0
        done = self.subtasks.filter(is_done=True).count()
        return int((done / total) * 100)


class SubTask(models.Model):
    """
    Sous-tâche d'une tâche principale.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='subtasks'
    )
    title = models.CharField(max_length=500)
    is_done = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_subtasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Sous-tâche'
        verbose_name_plural = 'Sous-tâches'

    def __str__(self):
        return f"{self.title} ({'✓' if self.is_done else '○'})"


class TaskLabel(models.Model):
    """
    Label/Tag pour catégoriser les tâches.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='task_labels'
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3B82F6')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['organization', 'name']
        verbose_name = 'Label'
        verbose_name_plural = 'Labels'

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class TaskComment(models.Model):
    """
    Commentaire sur une tâche.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='task_comments'
    )
    content = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Commentaire'
        verbose_name_plural = 'Commentaires'

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"


class TaskAttachment(models.Model):
    """
    Pièce jointe sur une tâche.
    """
    def attachment_path(instance, filename):
        ext = filename.split('.')[-1]
        return f"tasks/attachments/{instance.task.id}/{uuid.uuid4()}.{ext}"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='task_attachments'
    )
    file = models.FileField(upload_to=attachment_path)
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pièce jointe'
        verbose_name_plural = 'Pièces jointes'

    def __str__(self):
        return self.filename


class TaskActivity(models.Model):
    """
    Historique des actions sur une tâche.
    """
    ACTION_TYPES = [
        ('created', 'Créée'),
        ('moved', 'Déplacée'),
        ('assigned', 'Assignée'),
        ('unassigned', 'Désassignée'),
        ('priority_changed', 'Priorité modifiée'),
        ('due_date_changed', 'Date modifiée'),
        ('commented', 'Commentée'),
        ('completed', 'Terminée'),
        ('archived', 'Archivée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='task_activities'
    )
    action = models.CharField(max_length=30, choices=ACTION_TYPES)
    detail = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Activité'
        verbose_name_plural = 'Activités'

    def __str__(self):
        return f"{self.user.username} — {self.action} — {self.task.title}"