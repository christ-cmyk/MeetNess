# MeedNess Phase 4 — Tâches Kanban — Documentation

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/task.ts` | Types TypeScript : Task, Board, Column, SubTask, TaskComment, TaskActivity, TaskLabel, CreateTaskData, CreateBoardData, MoveTaskData |
| `src/services/api/task.api.ts` | Appels REST Axios : boards, tasks, subtasks, comments, activity, labels |
| `src/store/stores/useTaskStore.ts` | Store Zustand : state boards/tasks, actions CRUD, move, subtasks, comments |
| `src/screens/main/TasksScreen.tsx` | Liste des tableaux avec progression, skeleton loader, pull-to-refresh, état vide |
| `src/screens/tasks/BoardScreen.tsx` | Vue Kanban horizontale : colonnes colorées, cartes de tâches, long press pour déplacer |
| `src/screens/tasks/TaskDetailScreen.tsx` | Détail tâche : description, priorité, assignés, labels, sous-tâches, commentaires, historique |
| `src/screens/tasks/CreateTaskScreen.tsx` | Formulaire création tâche : titre, description, colonne, priorité, labels, échéance |
| `src/screens/tasks/CreateBoardScreen.tsx` | Formulaire création tableau : nom, description, preview colonnes par défaut |
| `src/navigation/TasksNavigator.tsx` | Stack navigator : TasksList → Board → TaskDetail → CreateTask → CreateBoard |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/config/env.ts` | Ajout `TASK_ENDPOINTS` (13 endpoints) |
| `src/navigation/MainNavigator.tsx` | Remplacement `TasksScreen` par `TasksNavigator` dans l'onglet Tâches |

## Endpoints REST utilisés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tasks/boards/?org_id={id}` | Liste des tableaux |
| POST | `/api/tasks/boards/` | Créer un tableau |
| GET | `/api/tasks/boards/{id}/` | Détail tableau (avec colonnes et tâches) |
| DELETE | `/api/tasks/boards/{id}/` | Supprimer tableau |
| GET | `/api/tasks/boards/{id}/tasks/` | Liste tâches d'un tableau |
| POST | `/api/tasks/boards/{id}/tasks/` | Créer une tâche |
| GET | `/api/tasks/{id}/` | Détail tâche |
| PUT | `/api/tasks/{id}/` | Modifier tâche |
| DELETE | `/api/tasks/{id}/` | Archiver tâche |
| POST | `/api/tasks/{id}/move/` | Déplacer tâche (column_id, order) |
| POST | `/api/tasks/{id}/subtasks/` | Ajouter sous-tâche |
| PATCH | `/api/tasks/{id}/subtasks/{sub_id}/` | Toggle sous-tâche |
| DELETE | `/api/tasks/{id}/subtasks/{sub_id}/` | Supprimer sous-tâche |
| GET | `/api/tasks/{id}/comments/` | Liste commentaires |
| POST | `/api/tasks/{id}/comments/` | Ajouter commentaire |
| DELETE | `/api/tasks/{id}/comments/{comment_id}/` | Supprimer commentaire |
| GET | `/api/tasks/{id}/activity/` | Historique d'activité |
| GET | `/api/tasks/labels/?org_id={id}` | Liste labels |
| POST | `/api/tasks/labels/` | Créer label |

## Structure du Store Zustand (useTaskStore)

### State
- `boards: Board[]` — liste des tableaux
- `activeBoard: Board | null` — tableau actif (avec colonnes et tâches)
- `tasks: Record<string, Task[]>` — tâches par boardId
- `isLoading: boolean`
- `error: string | null`

### Actions
- `fetchBoards(orgId)` — charge les tableaux de l'organisation
- `setActiveBoard(board)` — définit le tableau actif
- `createBoard(data)` — crée un tableau
- `deleteBoard(boardId)` — supprime un tableau
- `fetchTasks(boardId)` — charge le détail du tableau (colonnes + tâches)
- `createTask(boardId, data)` — crée une tâche puis refresh
- `updateTask(taskId, data)` — modifie une tâche
- `moveTask(taskId, columnId, order)` — déplace entre colonnes
- `archiveTask(taskId)` — archive une tâche
- `addSubTask(taskId, title)` — ajoute une sous-tâche
- `toggleSubTask(taskId, subtaskId)` — toggle sous-tâche
- `addComment(taskId, content)` — ajoute un commentaire
- `clearTasks()` — reset le store

## Navigation

```
MainNavigator (Tab)
  └── Tasks (TasksNavigator - Stack)
        ├── TasksList (TasksScreen) — liste des tableaux
        ├── Board (BoardScreen) — vue Kanban
        ├── TaskDetail (TaskDetailScreen) — détail tâche
        ├── CreateTask (CreateTaskScreen) — création tâche
        └── CreateBoard (CreateBoardScreen) — création tableau
```

## Permissions

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Créer tableau | ✅ | ✅ | ❌ |
| Supprimer tableau | ✅ | ❌ | ❌ |
| Créer tâche | ✅ | ✅ | ✅ |
| Modifier tâche | ✅ | ✅ | ✅ (assigné) |
| Archiver tâche | ✅ | ✅ | ✅ (créateur) |
| Déplacer tâche | ✅ | ✅ | ✅ |

## Dépendances npm ajoutées

Aucune nouvelle dépendance — utilise les packages existants (React Navigation, Zustand, Axios, Expo Vector Icons).

## Instructions de test

1. **Liste tableaux** : Ouvrir l'onglet Tâches → vérifier l'état vide avec bouton "Créer un tableau"
2. **Création tableau** : Tap "+" → remplir nom → Créer → vérifier apparition dans la liste
3. **Vue Kanban** : Tap un tableau → vérifier les 5 colonnes (Backlog, À faire, En cours, En révision, Terminé)
4. **Création tâche** : Tap "+" ou "Ajouter" dans une colonne → remplir formulaire → Créer → vérifier carte
5. **Détail tâche** : Tap une carte → vérifier sections (description, priorité, assignés, sous-tâches, commentaires)
6. **Sous-tâches** : Ajouter une sous-tâche → toggle checkbox → vérifier progression
7. **Commentaires** : Ajouter un commentaire → vérifier affichage
8. **Déplacer tâche** : Long press sur carte → choisir colonne destination → vérifier déplacement
9. **Archiver** : Détail tâche → icône archive → confirmer → vérifier disparition
10. **Pull-to-refresh** : Tirer vers le bas sur liste tableaux et vue Kanban
