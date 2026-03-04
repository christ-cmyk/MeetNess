MeedNess
MeedNess est une plateforme collaborative open-source conçue pour optimiser la communication, la gestion des tâches et l'atteinte des objectifs au sein des entreprises, des équipes de travail, des organisations et des familles. Elle centralise les outils essentiels pour une collaboration efficace et sécurisée.

Table des Matières
1	Introduction
◦	Présentation
◦	Philosophie du Projet
2	Fonctionnalités Clés
◦	Communication
◦	Gestion des Tâches
◦	Objectifs
◦	Réunions
◦	Système de Vote
◦	Gestion des Utilisateurs et Organisations
3	Architecture Technique
◦	Vue d'ensemble
◦	Technologies Utilisées
◦	Structure du Projet
4	Démarrage Rapide
◦	Prérequis
◦	Installation
◦	Configuration de l'Environnement
◦	Configuration de la Base de Données
◦	Lancement du Serveur
◦	WebSockets et Mode Asynchrone
◦	Gestion des Environnements
5	Bonnes Pratiques de Développement
6	Contribution
7	Feuille de Route
8	Licence
9	Contact

1. Introduction
Présentation
MeedNess est une application collaborative open-source conçue pour répondre aux besoins de communication et d'organisation de divers groupes, qu'il s'agisse d'entreprises, d'équipes de projet, d'associations ou de cellules familiales. Elle offre une solution centralisée pour discuter, gérer des tâches, suivre des objectifs, organiser des réunions et favoriser l'engagement des membres.

Philosophie du Projet
Le projet MeedNess est développé avec une approche scalable, modulaire et maintenable, en adhérant aux bonnes pratiques modernes de développement backend et frontend. L'accent est mis sur la séparation des responsabilités, la réutilisation du code et la sécurité des données. Le modèle de monétisation est conçu pour offrir une base gratuite solide tout en proposant des fonctionnalités avancées et des options spécifiques pour les entreprises et les familles, garantissant ainsi la pérennité et l'évolution du projet.

2. Fonctionnalités Clés
Communication
•	Chat en temps réel via WebSockets pour des échanges instantanés.
•	Conversations privées et de groupe pour une communication ciblée.
•	Séparation stricte des discussions par organisation ou groupe, assurant la confidentialité.

Gestion des Tâches
•	Création et assignation de tâches personnelles ou à d'autres membres.
•	Organisation visuelle par colonnes (style Kanban) pour un suivi intuitif.
•	Dates limites et rappels configurables pour ne rien oublier.
•	Suivi de l'avancement des tâches en temps réel.

Objectifs
•	Objectifs globaux définis par les administrateurs pour l'ensemble de l'organisation.
•	Objectifs personnels pour chaque utilisateur, alignés avec les buts collectifs.
•	Suivi de progression des objectifs individuels et collectifs.
•	Alignement stratégique entre les aspirations individuelles et la vision de l'organisation.

Réunions
•	Réunions audio et vidéo intégrées pour des échanges fluides.
•	Planification de réunions à l'avance ou lancement de sessions instantanées.
•	Accès contrôlé par organisation ou groupe pour la sécurité des échanges.

Système de Vote
•	Votes mensuels pour des initiatives internes (ex: employé du mois), gérés par les administrateurs.
•	Fonctionnalité orientée engagement et motivation des membres.

Gestion des Utilisateurs et Organisations
•	Profils utilisateurs détaillés avec gestion des informations personnelles.
•	Système de rôles et permissions granulaire pour un contrôle d'accès précis.
•	Création et gestion d'organisations, d'équipes et de groupes familiaux.

3. Architecture Technique
Vue d'ensemble
MeedNess est une application mobile full-stack construite sur une architecture robuste et modulaire. Le backend est développé avec Django, offrant une API RESTful et une gestion des WebSockets pour le temps réel. Le frontend sera une application mobile moderne, probablement développée avec React Native, interagissant avec le backend via l'API.

Technologies Utilisées
•	Backend (API & Logique Métier):
◦	Langage: Python 3.10+
◦	Framework: Django, Django REST Framework
◦	Temps Réel: Django Channels (WebSockets)
◦	Base de Données: PostgreSQL
◦	Cache/Broker: Redis
◦	Tâches Asynchrones: Celery
◦	Communication Audio/Vidéo: WebRTC (intégration avec des services comme Jitsi ou équivalent)
◦	Authentification: JWT (JSON Web Tokens)
•	Frontend (Application Mobile):
◦	Framework: React Native (ou Flutter, à confirmer)
◦	Langage: TypeScript
◦	Gestion d'état: Redux, Zustand ou Context API
◦	UI/UX: Tailwind CSS (ou équivalent pour mobile)
•	Infrastructure:
◦	Conteneurisation: Docker
◦	Serveur Web/Proxy: Nginx
◦	Intégration Continue/Déploiement Continu (CI/CD): GitHub Actions (ou GitLab CI/CD)

Structure du Projet
Le projet est organisé de manière logique pour faciliter la navigation et la maintenance :

meedness/
│
├── backend/                         # Backend Django (API + logique métier)
│   │
│   ├── manage.py                    # Point d’entrée Django
│   │
│   ├── config/                      # Configuration globale du projet
│   │   ├── __init__.py
│   │   ├── asgi.py                  # ASGI (WebSocket / temps réel)
│   │   ├── wsgi.py                  # WSGI (HTTP classique)
│   │   ├── urls.py                  # Routes principales
│   │   └── settings/
│   │       ├── __init__.py
│   │       ├── base.py              # Settings communs (apps, middleware)
│   │       ├── dev.py               # Settings développement
│   │       └── prod.py              # Settings production
│   │
│   ├── core/                        # Fondations du projet (réutilisable partout)
│   │   ├── __init__.py
│   │   ├── base_models.py           # BaseModel (id, created_at, updated_at)
│   │   ├── mixins.py                # Mixins (SoftDelete, Timestamp, etc.)
│   │   ├── constants.py             # Constantes globales (rôles, plans)
│   │   ├── utils.py                 # Fonctions utilitaires génériques
│   │   └── exceptions.py            # Exceptions personnalisées
│   │
│   ├── apps/                        # Applications métier (UNE FEATURE = UNE APP)
│   │   │
│   │   ├── accounts/                # Utilisateurs & profils
│   │   │   ├── models.py            # User, Profile
│   │   │   ├── serializers.py       # Validation & transformation données
│   │   │   ├── views.py             # Login, register, profil
│   │   │   ├── permissions.py       # Qui peut faire quoi
│   │   │   ├── services.py          # Logique métier user
│   │   │   └── urls.py
│   │   │
│   │   ├── organizations/           # Entreprises / familles / groupes
│   │   │   ├── models.py            # Organization, Membership
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py          # Invitation, rôles, gestion membres
│   │   │   └── urls.py
│   │   │
│   │   ├── chat/                    # Chat temps réel
│   │   │   ├── models.py            # Message, Conversation
│   │   │   ├── serializers.py
│   │   │   ├── views.py             # Historique messages
│   │   │   ├── consumers.py         # WebSocket (temps réel)
│   │   │   ├── services.py          # Règles premium (limites, export)
│   │   │   └── urls.py
│   │   │
│   │   ├── tasks/                   # Gestion des tâches
│   │   │   ├── models.py            # Task, SubTask
│   │   │   ├── serializers.py
│   │   │   ├── views.py             # CRUD tâches
│   │   │   ├── services.py          # Priorités, dépendances, rappels
│   │   │   ├── permissions.py
│   │   │   └── urls.py
│   │   │
│   │   ├── objectives/              # Objectifs (entreprise / personnel)
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── services.py
│   │   │
│   │   ├── meetings/                # Réunions audio / vidéo
│   │   │   ├── models.py            # Meeting, Participant
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py          # Création meeting, règles premium
│   │   │   └── webrtc.py             # Intégration WebRTC / Jitsi
│   │   │
│   │   ├── votes/                   # Vote employé du mois
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── services.py           # Règles : 1 vote / mois
│   │   │
│   │   └── subscriptions/           # Plans & monétisation
│   │       ├── models.py            # Plan, Subscription
│   │       ├── services.py          # Vérification droits & limites
│   │       ├── permissions.py
│   │       └── payments.py          # Stripe / Paystack
│   │
│   ├── notifications/               # Notifications & rappels
│   │   ├── email.py                 # Emails
│   │   ├── push.py                  # Push notifications
│   │   ├── scheduler.py             # Rappels automatiques
│   │   └── services.py
│   │
│   ├── realtime/                    # Temps réel global
│   │   ├── routing.py               # Routes WebSocket
│   │   └── auth.py                  # Auth WebSocket
│   │
│   └── tests/                       # Tests unitaires & intégration
│
├── frontend/                        # Frontend (React Native)
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── app/                     # Configuration globale (App, Router, Providers)
│   │   │   ├── App.tsx
│   │   │   ├── Router.tsx
│   │   │   └── Providers.tsx
│   │   │
│   │   ├── assets/                  # Ressources statiques
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   │
│   │   ├── components/              # Composants UI
│   │   │   ├── ui/                  # Composants atomiques (Button, Input...)
│   │   │   ├── layout/              # Structure (Navbar, Sidebar...)
│   │   │   └── common/              # Composants partagés (Avatar, ProtectedRoute...)
│   │   │
│   │   ├── features/                # Fonctionnalités métier (Pages + Logique)
│   │   │   ├── auth/                # Authentification
│   │   │   ├── chat/                # Messagerie
│   │   │   ├── tasks/               # Gestion des tâches
│   │   │   ├── goals/               # Objectifs
│   │   │   ├── meetings/            # Visioconférence
│   │   │   └── votes/               # Système de vote
│   │   │
│   │   ├── services/                # Services globaux (API, Socket, Auth)
│   │   ├── store/                   # Gestion d'état global (Zustand/Redux)
│   │   ├── hooks/                   # Hooks personnalisés
│   │   ├── utils/                   # Utilitaires et helpers
│   │   ├── types/                   # Définitions TypeScript
│   │   ├── main.tsx                 # Point d'entrée
│   │   └── vite-env.d.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── infra/                           # Infrastructure
│   ├── docker/                      # Dockerfiles
│   ├── nginx/                       # Reverse proxy
│   └── ci/                          # CI/CD (GitHub Actions, etc.)
│
├── docs/                            # Documentation projet (API, UX/UI, etc.)
│
├── .env.example                     # Exemple de variables d’environnement
├── requirements.txt                 # Dépendances backend (production)
├── requirements-dev.txt             # Dépendances backend (développement)
└── README.md                        # Présentation du projet

4. Démarrage Rapide
Ce guide vous aidera à configurer et lancer le projet MeedNess en environnement de développement local.
"
Prérequis
Assurez-vous d'avoir installé les éléments suivants sur votre machine :

•	Python 3.10 ou supérieur
•	PostgreSQL (serveur de base de données)
•	Redis (serveur de cache et broker de messages)
•	Git (système de contrôle de version)
•	Un outil de virtualisation Python (recommandé : venv ou virtualenv)
•	Node.js et npm/yarn (pour le frontend React Native)
•	Expo CLI (si vous utilisez Expo pour React Native)

Installation
10	Cloner le dépôt

git clone https://github.com/votre-username/meedness.git
cd meedness
11	Créer et activer un environnement virtuel (Backend)
"
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows
.\venv\Scripts\activate
12	Installer les dépendances Backend

pip install -r backend/requirements-dev.txt
13	Installer les dépendances Frontend

cd frontend
npm install # ou yarn install
cd ..

Configuration de l'Environnement
Créez un fichier .env.dev à la racine du dossier backend/ (basé sur .env.example) et remplissez-le avec vos informations de configuration. Ce fichier ne doit jamais être commité dans le contrôle de version.

Exemple de .env.dev :

DJANGO_ENV=dev
DJANGO_SECRET_KEY=votre_clé_secrète_très_longue_et_aléatoire
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
 
DB_NAME=meedness_dev
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres
DB_HOST=localhost
DB_PORT=5432
 
REDIS_URL=redis://127.0.0.1:6379/0
 
# Ajoutez ici d'autres variables pour les APIs externes (Jitsi, Stripe, etc.)

Configuration de la Base de Données
14	Créer la base de données PostgreSQL (si elle n'existe pas) :

CREATE DATABASE meedness_dev;
15	Appliquer les migrations Django :

python backend/manage.py migrate
16	Créer un superutilisateur (pour accéder à l'interface d'administration Django) :

python backend/manage.py createsuperuser

Lancement du Serveur
17	Lancer Redis

18	Assurez-vous que le serveur Redis est en cours d'exécution :

redis-server
19	Lancer le serveur de développement Backend

python backend/manage.py runserver
20	L'API sera accessible à l'adresse : http://127.0.0.1:8000
21	Lancer l'application Frontend (React Native)

cd frontend
npm start # ou yarn start
22	Suivez les instructions de l'Expo CLI pour lancer l'application sur un émulateur ou un appareil physique.

WebSockets et Mode Asynchrone
Le projet utilise Django Channels pour la gestion des WebSockets, permettant la communication en temps réel (chat, notifications). En production, l'application backend doit être lancée via un serveur ASGI (comme Daphne ou Uvicorn) plutôt que le serveur de développement Django classique.

Gestion des Environnements
MeedNess utilise une configuration par environnement pour séparer les paramètres de développement et de production. L'environnement actif est défini par la variable DJANGO_ENV dans votre fichier .env.

•	Développement : .env.dev
•	Production : .env.prod

Cette approche garantit un développement local sécurisé, une configuration de production propre et un déploiement simplifié.

5. Bonnes Pratiques de Développement
•	Applications Django modulaires : Chaque fonctionnalité majeure est une application Django distincte.
•	Vues légères, logique métier centralisée : Les vues (views) sont minimalistes, déléguant la logique métier complexe aux services (services.py).
•	Séparation claire des responsabilités : Chaque composant a un rôle unique et bien défini.
•	Aucune donnée sensible dans le code : Toutes les informations sensibles sont gérées via les variables d'environnement.
•	Configuration par environnement : Adaptabilité et sécurité des configurations.
•	Tests unitaires et d'intégration : Assurer la fiabilité et la robustesse du code.

6. Contribution
Nous encourageons les contributions à ce projet open-source. Pour contribuer :

23	Forker le dépôt sur GitHub.
24	Créer une branche de fonctionnalité (git checkout -b feature/nom-de-votre-fonctionnalite).
25	Écrire un code clair, bien documenté et respectant les bonnes pratiques du projet.
26	Assurer la couverture des tests pour les nouvelles fonctionnalités.
27	Respecter l'architecture existante et les conventions de nommage.
28	Soumettre une Pull Request détaillée pour examen.

7. Feuille de Route
Les développements futurs incluent :

•	Versionnement de l'API pour une meilleure gestion des évolutions.
•	Amélioration continue de l'application frontend (nouvelles fonctionnalités, optimisation UX/UI).
•	Développement de l'application mobile native (si non déjà faite avec React Native).
•	Tableaux de bord avancés pour les administrateurs et les utilisateurs Premium.
•	Intégration poussée de l'automatisation assistée par IA pour des fonctionnalités intelligentes (ex: résumé de discussions, suggestions de tâches).

8. Licence
Ce projet est distribué sous la licence MIT. Voir le fichier LICENSE à la racine du dépôt pour plus de détails.

9. Contact
Le projet est maintenu par l'équipe MeedNess.
Pour toute suggestion, question ou problème, veuillez utiliser le système d'issues du dépôt GitHub.
