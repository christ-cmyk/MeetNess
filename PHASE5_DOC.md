# MeedNess Phase 5 — Objectifs OKR + Dashboard Accueil

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/goal.ts` | Types TypeScript : Goal, KeyResult, OrganizationStats, etc. |
| `src/services/api/goal.api.ts` | Service API Axios pour tous les endpoints Objectifs |
| `src/store/stores/useGoalStore.ts` | Store Zustand — goals, activeGoal, stats |
| `src/screens/main/GoalsScreen.tsx` | Liste des objectifs avec filtres, cercles de progression, skeleton |
| `src/screens/goals/GoalDetailScreen.tsx` | Détail objectif : KR, commentaires, cercle animé, modal update |
| `src/screens/goals/CreateGoalScreen.tsx` | Formulaire création objectif avec date pickers natifs |
| `src/navigation/GoalsNavigator.tsx` | Stack Navigator pour les écrans Objectifs |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/screens/main/HomeScreen.tsx` | Refonte complète → Dashboard avec triple cercle SVG, stats, équipe |
| `src/navigation/MainNavigator.tsx` | GoalsScreen → GoalsNavigator ; HomeScreen mis à jour |
| `src/config/env.ts` | Ajout GOAL_ENDPOINTS (7 endpoints) |

## Endpoints utilisés

| Méthode | Endpoint | Action |
|---------|----------|--------|
| GET | `/api/goals/?org_id={id}` | Liste objectifs |
| POST | `/api/goals/` | Créer objectif |
| GET | `/api/goals/{id}/` | Détail objectif |
| PUT | `/api/goals/{id}/` | Modifier objectif |
| DELETE | `/api/goals/{id}/` | Archiver objectif |
| GET | `/api/goals/{id}/key-results/` | Liste KR |
| POST | `/api/goals/{id}/key-results/` | Créer KR |
| POST | `/api/goals/key-results/{kr_id}/update/` | Mettre à jour valeur KR |
| GET | `/api/goals/{id}/comments/` | Commentaires |
| POST | `/api/goals/{id}/comments/` | Ajouter commentaire |
| DELETE | `/api/goals/{id}/comments/{cid}/` | Supprimer commentaire |
| GET | `/api/goals/stats/?org_id={id}` | Stats globales dashboard |

## Structure du store Zustand (useGoalStore)

```
State:
  goals: Goal[]
  activeGoal: Goal | null
  stats: OrganizationStats | null
  isLoading: boolean
  error: string | null

Actions:
  fetchGoals(orgId, filters?)
  setActiveGoal(goal)
  createGoal(data)
  updateGoal(goalId, data)
  archiveGoal(goalId)
  createKeyResult(goalId, data)
  updateKeyResultValue(krId, value, note?)
  addComment(goalId, content)
  fetchStats(orgId)
  clearGoals()
  clearError()
```

## Cercle de progression (SVG)

### Triple Ring (HomeScreen)
- Taille : 200×200px
- 3 arcs concentriques via `react-native-svg` `<Circle>` :
  - Extérieur (rayon 90) : Tâches → bleu #3B82F6
  - Moyen (rayon 76) : Objectifs → violet #8B5CF6
  - Intérieur (rayon 62) : Ponctualité → vert #10B981
- `strokeDasharray` + `strokeDashoffset` pour le remplissage
- `strokeLinecap="round"` pour les bords arrondis
- Score global au centre (40px bold)

### Mini Circle (GoalsScreen)
- Taille : 52×52px par objectif
- Couleur selon statut (on_track=vert, at_risk=orange, behind=rouge)

### Big Circle (GoalDetailScreen)
- Taille : 160×160px centré
- Couleur selon statut de l'objectif

## Instructions de test

1. **Dashboard Accueil** :
   - Lancer l'app → vérifier la salutation "Bonjour [username] 👋"
   - Vérifier le triple cercle de progression SVG
   - Vérifier les 4 cartes de résumé (messages, tâches, objectifs, retards)
   - Vérifier la liste horizontale des membres
   - Pull-to-refresh fonctionne

2. **Liste Objectifs** :
   - Aller dans l'onglet "Objectifs"
   - Vérifier les filtres (Tous, En cours, À risque, Complétés)
   - Vérifier les cercles de progression par objectif
   - État vide affiché si aucun objectif

3. **Création Objectif** :
   - Taper sur "+" → formulaire s'ouvre
   - Remplir titre + date de fin avec date picker natif
   - Sélectionner la visibilité
   - Créer → retour à la liste avec nouvel objectif

4. **Détail Objectif** :
   - Taper sur un objectif → écran détail
   - Grand cercle de progression affiché
   - Liste des KR avec barres de progression
   - Bouton éditer un KR → modal avec input numérique
   - Commentaires en bas

## Dépendances ajoutées

- `react-native-svg` — Cercles de progression SVG animés
- `@react-native-community/datetimepicker` — (déjà installé Phase 4)
