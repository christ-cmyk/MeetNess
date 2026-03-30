"""
URLs pour la gestion des organisations.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Organisations
    path('', views.CreateOrganizationView.as_view(), name='organization-create'),
    path('my/', views.MyOrganizationView.as_view(), name='organization-my'),
    path('<uuid:org_id>/', views.OrganizationDetailView.as_view(), name='organization-detail'),

    # Membres
    path('<uuid:org_id>/members/', views.OrganizationMembersView.as_view(), name='organization-members'),
    path('<uuid:org_id>/members/<uuid:user_id>/promote/', views.PromoteMemberView.as_view(), name='member-promote'),
    path('<uuid:org_id>/members/<uuid:user_id>/', views.RemoveMemberView.as_view(), name='member-remove'),

    # Équipes
    path('<uuid:org_id>/teams/', views.TeamListCreateView.as_view(), name='team-list-create'),
    path('<uuid:org_id>/teams/<uuid:team_id>/', views.TeamDetailView.as_view(), name='team-detail'),

    # Invitations
    path('<uuid:org_id>/invitations/', views.SendInvitationView.as_view(), name='invitation-send'),
    path('invitations/pending/', views.PendingInvitationsView.as_view(), name='invitation-pending'),
    path('invitations/<uuid:token>/accept/', views.AcceptInvitationView.as_view(), name='invitation-accept'),

    # Transfert de propriété
    path('<uuid:org_id>/transfer/', views.InitiateOwnershipTransferView.as_view(), name='transfer-initiate'),
    path('transfer/<uuid:token>/accept/', views.AcceptOwnershipTransferView.as_view(), name='transfer-accept'),
]