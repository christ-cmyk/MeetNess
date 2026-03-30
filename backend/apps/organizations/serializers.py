"""
Serializers pour la gestion des organisations.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Organization, Team, OrganizationMember, Invitation, OwnershipTransfer
from apps.accounts.serializers import UserSerializer


class TeamSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'organization', 
                  'created_by', 'created_at', 'members_count']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_members_count(self, obj):
        return obj.members.count()


class CreateTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['name', 'description']

    def validate_name(self, value):
        organization = self.context.get('organization')
        if Team.objects.filter(name=value, organization=organization).exists():
            raise serializers.ValidationError("Une équipe avec ce nom existe déjà.")
        return value


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    team = TeamSerializer(read_only=True)

    class Meta:
        model = OrganizationMember
        fields = ['id', 'user', 'organization', 'role', 'team', 
                  'joined_at', 'is_active']
        read_only_fields = ['id', 'joined_at']


class OrganizationSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    teams_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'type', 'description', 'owner',
                  'plan', 'allow_admin_invite', 'avatar', 'is_active',
                  'created_at', 'updated_at', 'members_count', 
                  'teams_count', 'my_role']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_teams_count(self, obj):
        return obj.teams.count()

    def get_my_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.members.filter(user=request.user).first()
        return membership.role if membership else None


class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['name', 'type', 'description']

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Le nom doit contenir au moins 2 caractères."
            )
        return value.strip()

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user

        # Vérifier la limite d'organisations owned
        owned_count = Organization.objects.filter(owner=user).count()
        
        limits = {'free': 2, 'pro': 6, 'enterprise': None}
        # On utilise free par défaut pour les nouvelles organisations
        limit = limits.get('free')
        
        if limit is not None and owned_count >= limit:
            raise serializers.ValidationError({
                'limit': f"Vous avez atteint la limite de {limit} organisations "
                         f"pour le plan gratuit. Passez au plan Pro pour en créer plus."
            })
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        # Créer l'organisation
        organization = Organization.objects.create(
            owner=user,
            **validated_data
        )

        # Ajouter le créateur comme owner dans les membres
        OrganizationMember.objects.create(
            user=user,
            organization=organization,
            role='owner'
        )

        return organization


class InvitationSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    invited_by_username = serializers.CharField(
        source='invited_by.username', 
        read_only=True
    )

    class Meta:
        model = Invitation
        fields = ['id', 'organization', 'invited_by_username', 'email',
                  'team', 'status', 'expires_at', 'created_at']
        read_only_fields = ['id', 'status', 'expires_at', 'created_at']


class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    team_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_email(self, value):
        organization = self.context.get('organization')
        
        # Vérifier si une invitation pending existe déjà
        if Invitation.objects.filter(
            email=value,
            organization=organization,
            status='pending',
            expires_at__gt=timezone.now()
        ).exists():
            raise serializers.ValidationError(
                "Une invitation est déjà en attente pour cet email."
            )
        return value

    def validate_team_id(self, value):
        if value:
            organization = self.context.get('organization')
            if not Team.objects.filter(
                id=value, organization=organization
            ).exists():
                raise serializers.ValidationError(
                    "Cette équipe n'appartient pas à votre organisation."
                )
        return value


class OwnershipTransferSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = OwnershipTransfer
        fields = ['id', 'organization', 'from_user', 'to_user',
                  'status', 'expires_at', 'created_at']
        read_only_fields = ['id', 'status', 'expires_at', 'created_at']


class InitiateTransferSerializer(serializers.Serializer):
    to_user_id = serializers.UUIDField()

    def validate_to_user_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        organization = self.context.get('organization')
        request = self.context.get('request')

        # Vérifier que l'utilisateur cible existe
        try:
            to_user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Utilisateur introuvable.")

        # Vérifier que c'est un membre de l'organisation
        if not OrganizationMember.objects.filter(
            user=to_user,
            organization=organization,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "Cet utilisateur n'est pas membre de votre organisation."
            )

        # Vérifier que ce n'est pas soi-même
        if to_user == request.user:
            raise serializers.ValidationError(
                "Vous ne pouvez pas vous transférer la propriété à vous-même."
            )

        return value