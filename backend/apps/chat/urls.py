"""
URLs pour le chat - MeedNess.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Salons
    path(
        'rooms/',
        views.RoomListCreateView.as_view(),
        name='room-list-create'
    ),
    path(
        'rooms/<uuid:room_id>/',
        views.RoomDetailView.as_view(),
        name='room-detail'
    ),

    # Messages
    path(
        'rooms/<uuid:room_id>/messages/',
        views.MessageListCreateView.as_view(),
        name='message-list-create'
    ),
    path(
        'rooms/<uuid:room_id>/read/',
        views.MarkRoomReadView.as_view(),
        name='room-mark-read'
    ),

    # DM
    path(
        'direct/<uuid:user_id>/',
        views.DirectRoomView.as_view(),
        name='direct-room'
    ),

    # Recherche utilisateurs
    path(
        'users/search/',
        views.UserSearchView.as_view(),
        name='user-search'
    ),

    # Bloquer/Débloquer
    path(
        'users/<uuid:user_id>/block/',
        views.BlockUserView.as_view(),
        name='block-user'
    ),
]