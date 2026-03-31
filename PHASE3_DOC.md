# MeedNess — Phase 3 : Chat en Temps Réel (Version Finale)

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/chat.ts` | Types TypeScript : ChatMessage, ChatRoom, MessageReaction, MessageMedia, TypingIndicator, WebSocketMessage |
| `src/services/websocket/ChatWebSocket.ts` | Classe WebSocket avec reconnexion automatique, heartbeat, et callbacks multi-events |
| `src/services/api/chat.api.ts` | Service REST complet (rooms, messages, DM, search users, block/unblock) |
| `src/store/stores/useChatStore.ts` | Store Zustand : rooms, messages, typing, onlineUsers, reactions, delete |
| `src/screens/main/ChatScreen.tsx` | Liste des salons avec filtres (Tous/Groupes/DM), skeleton loader, pull-to-refresh |
| `src/screens/chat/ChatRoomScreen.tsx` | Conversation : bulles, long press menu, reply, reactions, suppression, typing |
| `src/screens/chat/CreateRoomScreen.tsx` | Formulaire création salon (Groupe/Annonce) avec validation Zod |
| `src/screens/chat/UserSearchScreen.tsx` | Recherche utilisateurs pour créer un DM (debounced, min 2 chars) |
| `src/navigation/ChatNavigator.tsx` | Stack navigator : ChatList → ChatRoom / CreateRoom / UserSearch |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/config/env.ts` | Ajout `WS_BASE_URL`, `CHAT_ENDPOINTS` (ROOMS, MESSAGES, MARK_READ, DIRECT, USERS_SEARCH, BLOCK_USER), `WS_CHAT_URL` helper |
| `src/navigation/MainNavigator.tsx` | Remplacement ChatScreen par ChatNavigator + badge unread dynamique |

## Endpoints API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/chat/rooms/` | Lister les salons |
| POST | `/api/chat/rooms/` | Créer un salon `{ name, type, team_id?, member_ids? }` |
| GET | `/api/chat/rooms/{id}/` | Détail d'un salon |
| GET | `/api/chat/rooms/{id}/messages/` | Historique paginé `?page=1&limit=50` |
| POST | `/api/chat/rooms/{id}/messages/` | Envoyer message (fallback REST) |
| POST | `/api/chat/rooms/{id}/read/` | Marquer comme lu |
| GET | `/api/chat/direct/{user_id}/` | Obtenir ou créer un salon DM |
| GET | `/api/chat/users/search/?q=query` | Rechercher utilisateurs pour DM |
| POST | `/api/chat/users/{user_id}/block/` | Bloquer un utilisateur |
| DELETE | `/api/chat/users/{user_id}/block/` | Débloquer un utilisateur |

## WebSocket

**Connexion** : `ws://{host}/ws/chat/{room_id}/?token={jwt_access_token}`

### Messages reçus (serveur → client)

```json
{ "type": "message", "message": { "id", "content", "sender": { "id", "username", "avatar" }, "created_at", "message_type", "is_read", "is_deleted", "is_edited", "reply_to", "media", "reactions" } }
{ "type": "typing", "user_id": "uuid", "username": "string", "is_typing": true }
{ "type": "read", "user_id": "uuid", "room_id": "uuid" }
{ "type": "message_deleted", "message_id": "uuid", "deleted_by": "uuid" }
{ "type": "reaction_added", "message_id": "uuid", "emoji": "string", "user_id": "uuid", "username": "string" }
{ "type": "reaction_removed", "message_id": "uuid", "emoji": "string", "user_id": "uuid" }
{ "type": "user_online", "user_id": "uuid", "username": "string" }
{ "type": "user_offline", "user_id": "uuid", "username": "string" }
{ "type": "error", "error": "string" }
```

### Messages envoyés (client → serveur)

```json
{ "type": "send_message", "content": "string", "message_type": "text", "reply_to_id": "uuid?" }
{ "type": "typing", "is_typing": true/false }
{ "type": "mark_read", "message_id": "uuid" }
{ "type": "delete_message", "message_id": "uuid" }
{ "type": "add_reaction", "message_id": "uuid", "emoji": "string" }
{ "type": "remove_reaction", "message_id": "uuid", "emoji": "string" }
```

**Reconnexion** : automatique (max 5 tentatives, backoff exponentiel)
**Heartbeat** : ping toutes les 30s

## Variables d'environnement

| Variable | Valeur dev | Description |
|----------|-----------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://192.168.1.5:8000/api` | URL API REST |
| `EXPO_PUBLIC_WS_URL` | `ws://192.168.1.5:8000/ws` | URL WebSocket |

## Flux de navigation Chat

```
Tab Chat (avec badge unread)
  └─ ChatNavigator (Stack)
       ├─ ChatList (liste des salons)
       │    ├─ Filtres : Tous | Groupes | DM
       │    ├─ → ChatRoom (tap sur un salon)
       │    ├─ → CreateRoom (bouton +)
       │    └─ → UserSearch (bouton person-add)
       ├─ ChatRoom (conversation)
       │    ├─ Long press → Répondre / Réagir / Copier / Supprimer
       │    ├─ Reply preview dans la barre d'envoi
       │    ├─ Réactions emoji sous les bulles
       │    └─ ← retour vers ChatList
       ├─ CreateRoom (formulaire Groupe/Annonce)
       │    └─ ← retour vers ChatList
       └─ UserSearch (recherche DM)
             └─ → ChatRoom (tap sur un utilisateur)
```

## Fonctionnalités ChatRoomScreen

- **Long press** : menu contextuel (Répondre, Réagir 👍❤️😂😮😢🔥, Copier, Supprimer)
- **Reply** : preview au-dessus de l'input avec bouton X, envoi avec `reply_to_id`
- **Réactions** : affichées sous les bulles, tap pour toggle, groupées par emoji avec compteur
- **Suppression** : suppression logique, affichage "🚫 Ce message a été supprimé" en italique
- **Messages édités** : label "(modifié)" sous le contenu
- **Indicateur en ligne** : nombre de membres en ligne dans le header
- **Typing** : animation 3 points, envoi après 500ms de saisie, arrêt après 2s d'inactivité
- **Pagination** : chargement au scroll vers le haut
- **Séparateurs de date** : Aujourd'hui, Hier, ou date complète

## Dépendances npm

- `expo-clipboard` — copie de messages
- `@react-navigation/native-stack` (déjà installé)

## Permissions implémentées

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Créer salon général | ✅ | ❌ | ❌ |
| Créer salon d'équipe | ✅ | ✅ | ❌ |
| Créer salon annonce | ✅ | ❌ | ❌ |
| Créer DM | ✅ | ✅ | ✅ |
| Supprimer ses messages | ✅ | ✅ | ✅ |
| Supprimer tous messages | ✅ | ✅ (équipe) | ❌ |

## Instructions de test

1. **Liste des salons** : Ouvrir l'onglet Chat → vérifier skeleton loader → état vide → pull-to-refresh
2. **Filtres** : Tester onglets Tous / Groupes / DM → vérifier le filtrage
3. **Création salon** : Bouton + → formulaire → créer → retour à la liste
4. **Recherche DM** : Bouton person-add → rechercher utilisateur → tap → ouvrir DM
5. **Conversation** : Tap sur salon → connexion WebSocket → envoyer message
6. **Long press** : Long press sur message → Répondre / Réagir / Copier / Supprimer
7. **Reply** : Répondre → preview visible → envoyer → vérifier reply_to dans la bulle
8. **Réactions** : Réagir → emoji sous la bulle → tap pour toggle
9. **Suppression** : Supprimer → message remplacé par texte grisé
10. **Typing** : Taper du texte → vérifier l'indicateur de frappe
11. **Badge** : Recevoir un message non lu → vérifier badge onglet Chat
12. **Reconnexion** : Couper réseau → vérifier reconnexion automatique
