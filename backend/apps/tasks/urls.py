"""
URLs pour les tâches - MeedNess.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Tableaux
    path('boards/', views.BoardListCreateView.as_view(), name='board-list-create'),
    path('boards/<uuid:board_id>/', views.BoardDetailView.as_view(), name='board-detail'),

    # Tâches
    path('boards/<uuid:board_id>/tasks/', views.TaskListCreateView.as_view(), name='task-list-create'),
    path('<uuid:task_id>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('<uuid:task_id>/move/', views.MoveTaskView.as_view(), name='task-move'),

    # Sous-tâches
    path('<uuid:task_id>/subtasks/', views.SubTaskView.as_view(), name='subtask-create'),
    path('<uuid:task_id>/subtasks/<uuid:subtask_id>/', views.SubTaskView.as_view(), name='subtask-detail'),

    # Commentaires
    path('<uuid:task_id>/comments/', views.TaskCommentView.as_view(), name='task-comments'),
    path('<uuid:task_id>/comments/<uuid:comment_id>/', views.TaskCommentView.as_view(), name='task-comment-detail'),

    # Activité
    path('<uuid:task_id>/activity/', views.TaskActivityView.as_view(), name='task-activity'),

    # Labels
    path('labels/', views.TaskLabelView.as_view(), name='task-labels'),
]