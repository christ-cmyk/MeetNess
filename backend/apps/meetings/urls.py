"""
URLs pour les Réunions et Votes - MeedNess.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Réunions
    path('', views.MeetingListCreateView.as_view(), name='meeting-list-create'),
    path('<uuid:meeting_id>/', views.MeetingDetailView.as_view(), name='meeting-detail'),
    path('<uuid:meeting_id>/attend/', views.MeetingAttendeeView.as_view(), name='meeting-attend'),
    path('<uuid:meeting_id>/agenda/', views.AgendaItemView.as_view(), name='agenda-list-create'),
    path('<uuid:meeting_id>/agenda/<uuid:item_id>/', views.AgendaItemView.as_view(), name='agenda-detail'),
    path('<uuid:meeting_id>/actions/', views.MeetingActionView.as_view(), name='meeting-actions'),
    path('<uuid:meeting_id>/actions/<uuid:action_id>/', views.MeetingActionView.as_view(), name='meeting-action-detail'),

    # Votes
    path('votes/', views.VoteListCreateView.as_view(), name='vote-list-create'),
    path('votes/<uuid:vote_id>/', views.VoteDetailView.as_view(), name='vote-detail'),
    path('votes/<uuid:vote_id>/cast/', views.CastVoteView.as_view(), name='cast-vote'),
]