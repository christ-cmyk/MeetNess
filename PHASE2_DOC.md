# Phase 2 — Navigation Principale + Gestion des Organisations

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/organization.ts` | Types TypeScript : Organization, Team, OrganizationMember, Invitation, OwnershipTransfer, CreateOrganizationData |
| `src/services/api/organization.api.ts` | Service API Axios pour les organisations (CRUD + invitations + équipes) |
| `src/store/stores/useOrganizationStore.ts` | Store Zustand pour l'état des organisations (avec myRole et teams) |
| `src/screens/main/HomeScreen.tsx` | Écran placeholder Accueil |
| `src/screens/main/ChatScreen.tsx` | Écran placeholder Chat |
| `src/screens/main/TasksScreen.tsx` | Écran placeholder Tâches |
| `src/screens/main/GoalsScreen.tsx` | Écran placeholder Objectifs |
| `src/screens/main/ProfileScreen.tsx` | Écran Profil (infos utilisateur + organisation + rôle + déconnexion) |
| `src/screens/organization/CreateOrganizationScreen.tsx` | Formulaire de création d'organisation (admin/owner) |
| `src/screens/organization/WaitingInvitationScreen.tsx` | Écran d'attente d'invitation (member) avec auto-refresh |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/types/user.types.ts` | Ajout `UserRole`, `role` sur `User`, `needs_role_selection` sur `AuthResponse` |
| `src/config/env.ts` | Ajout endpoints `MY`, `TEAMS`, `PENDING_INVITATIONS`, `ACCEPT_INVITATION` dans `ORG_ENDPOINTS` |
| `src/navigation/MainNavigator.tsx` | Bottom Tab Navigator (5 onglets) |
| `src/navigation/AppNavigator.tsx` | Flux complet Auth → Rôle → Organisation → Main |

## Types principaux

| Type | Description |
|------|-------------|
| `OrganizationType` | `'company' \| 'family' \| 'team'` |
| `OrganizationPlan` | `'free' \| 'pro' \| 'enterprise'` |
| `MemberRole` | `'owner' \| 'admin' \| 'member'` |
| `InvitationStatus` | `'pending' \| 'accepted' \| 'expired' \| 'cancelled'` |
| `Organization` | Org complète avec plan, avatar, is_active, updated_at |
| `Team` | Équipe au sein d'une organisation |
| `OrganizationMember` | Membre avec rôle, équipe, statut actif |
| `Invitation` | Invitation avec email, team, expires_at |
| `OwnershipTransfer` | Transfert de propriété entre utilisateurs |

## Endpoints API utilisés

| Méthode | Endpoint | Body | Description |
|---------|----------|------|-------------|
| POST | `/api/organizations/` | `{ name, type, description? }` | Créer une organisation |
| GET | `/api/organizations/my/` | — | Récupérer mon organisation + rôle |
| GET | `/api/organizations/teams/` | — | Lister les équipes de mon organisation |
| GET | `/api/organizations/invitations/pending/` | — | Lister invitations en attente |
| POST | `/api/organizations/invitations/{id}/accept/` | — | Accepter une invitation |

## Store useOrganizationStore

### State
- `organization: Organization | null` — Organisation actuelle
- `myRole: MemberRole | null` — Rôle de l'utilisateur dans l'organisation
- `teams: Team[]` — Équipes de l'organisation
- `pendingInvitations: Invitation[]` — Invitations en attente
- `isLoading: boolean`
- `error: string | null`

### Actions
- `createOrganization(data)` — Crée une org, set myRole='owner'
- `fetchMyOrganization()` — Charge l'org + rôle depuis l'API
- `fetchTeams()` — Charge les équipes
- `checkPendingInvitations()` — Vérifie les invitations pending
- `acceptInvitation(id)` — Accepte et stocke l'org + rôle
- `clearOrganization()` — Reset complet

## Dépendances npm à installer

```bash
npx expo install @react-navigation/bottom-tabs @expo/vector-icons
```

## Flux de navigation

```
App Start
  │
  ├── !isInitialized ──────────► LoadingSpinner
  │
  ├── !isAuthenticated ────────► AuthNavigator
  │                                ├── Login
  │                                ├── Register
  │                                ├── ForgotPassword
  │                                └── ResetPassword
  │
  ├── needsRoleSelection ─────► RoleSelectionScreen
  │                                ├── admin → CreateOrganization
  │                                └── member → WaitingInvitation
  │
  ├── !hasOrganization
  │   ├── role=admin ──────────► CreateOrganizationScreen
  │   └── role=member ─────────► WaitingInvitationScreen
  │
  └── hasOrganization ─────────► MainNavigator (Bottom Tabs)
                                   ├── 🏠 Accueil
                                   ├── 💬 Chat
                                   ├── ✅ Tâches
                                   ├── 🏆 Objectifs
                                   └── 👤 Profil
```

## Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://192.168.1.8:8000/api` | URL de l'API Django |

## Comment tester

### 1. Navigation Bottom Tab
- Se connecter avec un compte qui a déjà une organisation
- Vérifier que les 5 onglets s'affichent
- Naviguer entre les onglets

### 2. Flux Admin (création d'organisation)
- Créer un compte, choisir le rôle "admin"
- L'écran CreateOrganization doit apparaître
- Remplir le formulaire et soumettre
- Après succès → redirigé vers MainNavigator

### 3. Flux Member (attente d'invitation)
- Créer un compte, choisir le rôle "member"
- L'écran WaitingInvitation doit apparaître
- Le refresh automatique toutes les 30s doit fonctionner
- Bouton "Vérifier mes invitations" → appel API manuel
- Quand une invitation est acceptée → redirigé vers MainNavigator

### 4. Profil
- Aller sur l'onglet Profil
- Les infos utilisateur doivent s'afficher
- Le nom de l'organisation et le rôle doivent s'afficher
- Le bouton "Se déconnecter" doit fonctionner
