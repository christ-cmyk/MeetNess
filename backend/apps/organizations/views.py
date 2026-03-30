"""
Views pour la gestion des organisations.
"""
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import Organization, Team, OrganizationMember, Invitation, OwnershipTransfer
from .serializers import (
    OrganizationSerializer,
    CreateOrganizationSerializer,
    TeamSerializer,
    CreateTeamSerializer,
    OrganizationMemberSerializer,
    InvitationSerializer,
    CreateInvitationSerializer,
    OwnershipTransferSerializer,
    InitiateTransferSerializer,
)

User = get_user_model()


class IsOrganizationOwner(permissions.BasePermission):
    """Permission : uniquement le owner."""
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            return obj.owner == request.user
        return False


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """Permission : owner ou admin de l'organisation."""
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            return OrganizationMember.objects.filter(
                user=request.user,
                organization=obj,
                role__in=['owner', 'admin'],
                is_active=True
            ).exists()
        return False


# ─────────────────────────────────────────────
# ORGANISATIONS
# ─────────────────────────────────────────────

class CreateOrganizationView(generics.CreateAPIView):
    """
    POST /api/organizations/
    Créer une nouvelle organisation.
    """
    serializer_class = CreateOrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        organization = serializer.save()

        return Response(
            OrganizationSerializer(
                organization, 
                context={'request': request}
            ).data,
            status=status.HTTP_201_CREATED
        )


class MyOrganizationView(APIView):
    """
    GET /api/organizations/my/
    Récupérer l'organisation principale de l'utilisateur connecté.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        membership = OrganizationMember.objects.filter(
            user=request.user,
            is_active=True
        ).select_related('organization').first()

        if not membership:
            return Response(
                {'detail': 'Aucune organisation trouvée.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrganizationSerializer(
            membership.organization,
            context={'request': request}
        )

        return Response({
            'organization': serializer.data,
            'role': membership.role,
        })

class OrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/organizations/{id}/
    Détail, modification et suppression d'une organisation.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        org_id = self.kwargs.get('org_id')
        organization = get_object_or_404(Organization, id=org_id)

        # Vérifier que l'utilisateur est membre
        if not OrganizationMember.objects.filter(
            user=self.request.user,
            organization=organization,
            is_active=True
        ).exists():
            self.permission_denied(self.request)

        return organization

    def update(self, request, *args, **kwargs):
        organization = self.get_object()

        # Seul le owner peut modifier
        if organization.owner != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut modifier l\'organisation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            organization,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        organization = self.get_object()

        if organization.owner != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut supprimer l\'organisation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        organization.is_active = False
        organization.save()
        return Response(
            {'message': 'Organisation désactivée avec succès.'},
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────
# MEMBRES
# ─────────────────────────────────────────────

class OrganizationMembersView(APIView):
    """
    GET /api/organizations/{org_id}/members/
    Liste des membres d'une organisation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)

        # Vérifier que l'utilisateur est membre
        if not OrganizationMember.objects.filter(
            user=request.user,
            organization=organization,
            is_active=True
        ).exists():
            return Response(
                {'error': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        members = OrganizationMember.objects.filter(
            organization=organization,
            is_active=True
        ).select_related('user', 'team')

        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)


class PromoteMemberView(APIView):
    """
    POST /api/organizations/{org_id}/members/{user_id}/promote/
    Promouvoir un membre en admin (owner uniquement).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, org_id, user_id):
        organization = get_object_or_404(Organization, id=org_id)

        if organization.owner != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut promouvoir des membres.'},
                status=status.HTTP_403_FORBIDDEN
            )

        membership = get_object_or_404(
            OrganizationMember,
            user__id=user_id,
            organization=organization,
            is_active=True
        )

        if membership.role == 'owner':
            return Response(
                {'error': 'Impossible de modifier le rôle du propriétaire.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership.role = 'admin'
        membership.save()

        return Response(
            {'message': f'{membership.user.username} est maintenant admin.'}
        )


class RemoveMemberView(APIView):
    """
    DELETE /api/organizations/{org_id}/members/{user_id}/
    Retirer un membre (owner uniquement).
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, org_id, user_id):
        organization = get_object_or_404(Organization, id=org_id)

        if organization.owner != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut retirer des membres.'},
                status=status.HTTP_403_FORBIDDEN
            )

        membership = get_object_or_404(
            OrganizationMember,
            user__id=user_id,
            organization=organization,
            is_active=True
        )

        if membership.role == 'owner':
            return Response(
                {'error': 'Impossible de retirer le propriétaire.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership.is_active = False
        membership.save()

        return Response(
            {'message': 'Membre retiré avec succès.'},
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────
# ÉQUIPES
# ─────────────────────────────────────────────

class TeamListCreateView(APIView):
    """
    GET/POST /api/organizations/{org_id}/teams/
    Lister et créer des équipes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)

        if not OrganizationMember.objects.filter(
            user=request.user,
            organization=organization,
            is_active=True
        ).exists():
            return Response(
                {'error': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        teams = Team.objects.filter(organization=organization)
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data)

    def post(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)

        # Owner ou admin peuvent créer des équipes
        membership = OrganizationMember.objects.filter(
            user=request.user,
            organization=organization,
            role__in=['owner', 'admin'],
            is_active=True
        ).first()

        if not membership:
            return Response(
                {'error': 'Seuls les owners et admins peuvent créer des équipes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateTeamSerializer(
            data=request.data,
            context={'organization': organization}
        )
        serializer.is_valid(raise_exception=True)
        team = serializer.save(
            organization=organization,
            created_by=request.user
        )

        return Response(
            TeamSerializer(team).data,
            status=status.HTTP_201_CREATED
        )


class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/organizations/{org_id}/teams/{team_id}/
    """
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            Team,
            id=self.kwargs.get('team_id'),
            organization__id=self.kwargs.get('org_id')
        )

    def destroy(self, request, *args, **kwargs):
        team = self.get_object()
        organization = team.organization

        # Seul le owner peut supprimer une équipe
        if organization.owner != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut supprimer une équipe.'},
                status=status.HTTP_403_FORBIDDEN
            )

        team.delete()
        return Response(
            {'message': 'Équipe supprimée avec succès.'},
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────
# INVITATIONS
# ─────────────────────────────────────────────

class SendInvitationView(APIView):
    """
    POST /api/organizations/{org_id}/invitations/
    Envoyer une invitation par email.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)

        # Vérifier les permissions d'invitation
        membership = OrganizationMember.objects.filter(
            user=request.user,
            organization=organization,
            is_active=True
        ).first()

        if not membership:
            return Response(
                {'error': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        can_invite = (
            membership.role == 'owner' or
            (membership.role == 'admin' and organization.allow_admin_invite)
        )

        if not can_invite:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'inviter des membres.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateInvitationSerializer(
            data=request.data,
            context={'organization': organization, 'request': request}
        )
        serializer.is_valid(raise_exception=True)

        team = None
        team_id = serializer.validated_data.get('team_id')
        if team_id:
            team = Team.objects.get(id=team_id)

        invitation = Invitation.objects.create(
            organization=organization,
            invited_by=request.user,
            email=serializer.validated_data['email'],
            team=team
        )

        # Envoyer l'email
        self._send_invitation_email(invitation, request)

        return Response(
            InvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED
        )

    def _send_invitation_email(self, invitation, request):
        invite_link = (
            f"{settings.FRONTEND_URL}/invitation/accept/{invitation.token}"
        )
        send_mail(
            subject=f'Invitation à rejoindre {invitation.organization.name}',
            message=(
                f'Bonjour,\n\n'
                f'{invitation.invited_by.username} vous invite à rejoindre '
                f'"{invitation.organization.name}" sur MeedNess.\n\n'
                f'Cliquez sur ce lien pour accepter (valable 72h) :\n'
                f'{invite_link}\n\n'
                f'L\'équipe MeedNess'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=True,
        )


class PendingInvitationsView(APIView):
    """
    GET /api/organizations/invitations/pending/
    Invitations en attente pour l'utilisateur connecté.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        invitations = Invitation.objects.filter(
            email=request.user.email,
            status='pending',
            expires_at__gt=timezone.now()
        ).select_related('organization', 'invited_by')

        serializer = InvitationSerializer(invitations, many=True)
        return Response(serializer.data)


class AcceptInvitationView(APIView):
    """
    POST /api/organizations/invitations/{token}/accept/
    Accepter une invitation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        invitation = get_object_or_404(Invitation, token=token)

        if not invitation.is_valid():
            return Response(
                {'error': 'Cette invitation a expiré ou a déjà été utilisée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if invitation.email != request.user.email:
            return Response(
                {'error': 'Cette invitation ne vous est pas destinée.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Vérifier si déjà membre
        if OrganizationMember.objects.filter(
            user=request.user,
            organization=invitation.organization
        ).exists():
            return Response(
                {'error': 'Vous êtes déjà membre de cette organisation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer le membership
        OrganizationMember.objects.create(
            user=request.user,
            organization=invitation.organization,
            role='member',
            team=invitation.team
        )

        # Marquer l'invitation comme acceptée
        invitation.status = 'accepted'
        invitation.save()

        return Response(
            OrganizationSerializer(
                invitation.organization,
                context={'request': request}
            ).data,
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────
# TRANSFERT DE PROPRIÉTÉ
# ─────────────────────────────────────────────

class InitiateOwnershipTransferView(APIView):
    """
    POST /api/organizations/{org_id}/transfer/
    Initier un transfert de propriété.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)

        if organization.owner != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut transférer la propriété.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = InitiateTransferSerializer(
            data=request.data,
            context={'organization': organization, 'request': request}
        )
        serializer.is_valid(raise_exception=True)

        to_user = User.objects.get(
            id=serializer.validated_data['to_user_id']
        )

        # Annuler les transferts précédents en attente
        OwnershipTransfer.objects.filter(
            organization=organization,
            status='pending'
        ).update(status='cancelled')

        transfer = OwnershipTransfer.objects.create(
            organization=organization,
            from_user=request.user,
            to_user=to_user
        )

        # Envoyer email de confirmation
        self._send_transfer_email(transfer)

        return Response(
            OwnershipTransferSerializer(transfer).data,
            status=status.HTTP_201_CREATED
        )

    def _send_transfer_email(self, transfer):
        accept_link = (
            f"{settings.FRONTEND_URL}/transfer/accept/{transfer.token}"
        )
        send_mail(
            subject=f'Transfert de propriété - {transfer.organization.name}',
            message=(
                f'Bonjour {transfer.to_user.username},\n\n'
                f'{transfer.from_user.username} souhaite vous transférer '
                f'la propriété de "{transfer.organization.name}".\n\n'
                f'Cliquez sur ce lien pour accepter (valable 48h) :\n'
                f'{accept_link}\n\n'
                f'L\'équipe MeedNess'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[transfer.to_user.email],
            fail_silently=True,
        )


class AcceptOwnershipTransferView(APIView):
    """
    POST /api/organizations/transfer/{token}/accept/
    Accepter un transfert de propriété.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        transfer = get_object_or_404(OwnershipTransfer, token=token)

        if not transfer.is_valid():
            return Response(
                {'error': 'Ce transfert a expiré ou a déjà été traité.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if transfer.to_user != request.user:
            return Response(
                {'error': 'Ce transfert ne vous est pas destiné.'},
                status=status.HTTP_403_FORBIDDEN
            )

        organization = transfer.organization

        # Changer le owner
        organization.owner = request.user
        organization.save()

        # Mettre à jour les rôles
        OrganizationMember.objects.filter(
            user=transfer.to_user,
            organization=organization
        ).update(role='owner')

        OrganizationMember.objects.filter(
            user=transfer.from_user,
            organization=organization
        ).update(role='admin')

        # Marquer le transfert comme accepté
        transfer.status = 'accepted'
        transfer.save()

        return Response(
            {'message': 'Transfert de propriété accepté avec succès.'}
        )