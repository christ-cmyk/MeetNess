"""
Modèles pour les Objectifs (OKR) - MeedNess.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Goal(models.Model):
    """
    Objectif principal (OKR - Objective).
    """
    STATUS_CHOICES = [
        ('on_track', 'Dans les temps'),
        ('at_risk', 'À risque'),
        ('behind', 'En retard'),
        ('completed', 'Complété'),
        ('cancelled', 'Annulé'),
    ]

    VISIBILITY_CHOICES = [
        ('organization', 'Organisation'),
        ('team', 'Équipe'),
        ('private', 'Privé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)

    # Appartenance
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='goals'
    )
    team = models.ForeignKey(
        'organizations.Team',
        on_delete=models.CASCADE,
        related_name='goals',
        null=True,
        blank=True
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_goals'
    )

    # Dates
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()

    # Statut et visibilité
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='on_track'
    )
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='organization'
    )

    # Objectif parent (pour les sous-objectifs)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Objectif'
        verbose_name_plural = 'Objectifs'

    def __str__(self):
        return self.title

    @property
    def progress(self):
        """Calcule la progression basée sur les Key Results."""
        key_results = self.key_results.filter(is_active=True)
        if not key_results.exists():
            return 0
        total = sum(kr.progress for kr in key_results)
        return round(total / key_results.count())

    @property
    def days_remaining(self):
        """Nombre de jours restants."""
        today = timezone.now().date()
        if self.end_date < today:
            return 0
        return (self.end_date - today).days

    @property
    def is_overdue(self):
        return timezone.now().date() > self.end_date and self.status != 'completed'

    def update_status(self):
        """Met à jour le statut automatiquement selon la progression."""
        progress = self.progress
        if progress >= 100:
            self.status = 'completed'
        elif self.is_overdue:
            self.status = 'behind'
        elif progress >= 70:
            self.status = 'on_track'
        elif progress >= 40:
            self.status = 'at_risk'
        else:
            self.status = 'behind'
        self.save()


class KeyResult(models.Model):
    """
    Résultat clé d'un objectif (KR).
    Mesure concrète et chiffrable de l'avancement.
    """
    METRIC_TYPES = [
        ('number', 'Nombre'),
        ('percentage', 'Pourcentage'),
        ('currency', 'Montant'),
        ('boolean', 'Oui/Non'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='key_results'
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)

    # Métrique
    metric_type = models.CharField(
        max_length=20,
        choices=METRIC_TYPES,
        default='number'
    )
    start_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    target_value = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )
    current_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        help_text="Ex: clients, FCFA, %, contrats"
    )

    # Responsable
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_key_results'
    )

    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Résultat clé'
        verbose_name_plural = 'Résultats clés'

    def __str__(self):
        return f"{self.title} ({self.current_value}/{self.target_value})"

    @property
    def progress(self):
        """Calcule le pourcentage de progression."""
        if self.metric_type == 'boolean':
            return 100 if self.current_value >= 1 else 0

        if self.target_value == self.start_value:
            return 100 if self.current_value >= self.target_value else 0

        total_range = float(self.target_value - self.start_value)
        current_range = float(self.current_value - self.start_value)

        if total_range == 0:
            return 0

        progress = (current_range / total_range) * 100
        return max(0, min(100, round(progress)))


class KeyResultUpdate(models.Model):
    """
    Historique des mises à jour d'un Key Result.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key_result = models.ForeignKey(
        KeyResult,
        on_delete=models.CASCADE,
        related_name='updates'
    )
    previous_value = models.DecimalField(max_digits=15, decimal_places=2)
    new_value = models.DecimalField(max_digits=15, decimal_places=2)
    note = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='kr_updates'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Mise à jour KR'
        verbose_name_plural = 'Mises à jour KR'

    def __str__(self):
        return f"{self.key_result.title}: {self.previous_value} → {self.new_value}"


class GoalComment(models.Model):
    """
    Commentaire sur un objectif.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='goal_comments'
    )
    content = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Commentaire objectif'
        verbose_name_plural = 'Commentaires objectifs'

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"


class GoalMember(models.Model):
    """
    Membre contribuant à un objectif.
    """
    ROLE_CHOICES = [
        ('owner', 'Responsable'),
        ('contributor', 'Contributeur'),
        ('viewer', 'Observateur'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='goal_memberships'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='contributor'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['goal', 'user']
        verbose_name = 'Membre objectif'
        verbose_name_plural = 'Membres objectifs'

    def __str__(self):
        return f"{self.user.username} → {self.goal.title}"