"""
URLs pour les Objectifs - MeedNess.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Objectifs
    path('', views.GoalListCreateView.as_view(), name='goal-list-create'),
    path('<uuid:goal_id>/', views.GoalDetailView.as_view(), name='goal-detail'),

    # Key Results
    path(
        '<uuid:goal_id>/key-results/',
        views.KeyResultListCreateView.as_view(),
        name='kr-list-create'
    ),
    path(
        'key-results/<uuid:kr_id>/update/',
        views.KeyResultUpdateView.as_view(),
        name='kr-update'
    ),

    # Commentaires
    path(
        '<uuid:goal_id>/comments/',
        views.GoalCommentView.as_view(),
        name='goal-comments'
    ),
    path(
        '<uuid:goal_id>/comments/<uuid:comment_id>/',
        views.GoalCommentView.as_view(),
        name='goal-comment-detail'
    ),

    # Stats globales (cercle de progression)
    path(
        'stats/',
        views.OrganizationStatsView.as_view(),
        name='org-stats'
    ),
]