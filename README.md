MeedNess
Présentation

MeedNess est une application collaborative open-source conçue pour les entreprises, équipes de travail, organisations et familles.
Elle centralise la communication, la gestion des tâches, les objectifs, les réunions et les outils d’engagement dans une seule plateforme sécurisée.

Le projet est pensé pour être scalable, modulaire et maintenable, en respectant les bonnes pratiques modernes de développement backend.

Fonctionnalités principales
Communication

Chat en temps réel via WebSockets

Conversations privées et de groupe

Séparation stricte des discussions par organisation ou groupe

Gestion des tâches

Tâches personnelles ou assignées

Organisation par colonnes (style Kanban)

Dates limites et rappels

Suivi de l’avancement

Objectifs

Objectifs globaux définis par les administrateurs

Objectifs personnels par utilisateur

Suivi de progression

Alignement entre objectifs individuels et collectifs

Réunions

Réunions audio et vidéo

Réunions planifiées ou instantanées

Accès contrôlé par organisation ou groupe

Système de vote

Votes mensuels (exemple : employé du mois)

Gestion par les administrateurs

Fonctionnalité orientée engagement et motivation

Gestion des utilisateurs et organisations

Profils utilisateurs

Rôles et permissions

Organisations, équipes et groupes familiaux

Modèle de monétisation

Offre gratuite (fonctionnalités de base)

Offre Premium (fonctionnalités avancées individuelles)

Offre Entreprise (équipes, sécurité, statistiques)

Offre Familiale (groupes privés et outils partagés)

Technologies utilisées
Backend

Python

Django

Django REST Framework

Django Channels (WebSockets)

PostgreSQL

Redis

Celery

WebRTC

Authentification JWT

Infrastructure

Configuration par environnement

Architecture prête pour Docker

Conception scalable et modulaire

Structure du projet
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
├── frontend/                        # Frontend (React)
│   ├── src/
│   │   ├── api/                     # Appels API centralisés
│   │   ├── components/              # Composants UI réutilisables
│   │   ├── pages/                   # Pages (Chat, Tasks, Meetings)
│   │   ├── hooks/                   # Logique React
│   │   ├── context/                 # Auth, User, Theme
│   │   ├── services/                # Logique métier frontend
│   │   ├── routes/                  # Routing
│   │   └── utils/                   # Helpers
│   └── public/
│
├── infra/                           # Infrastructure
│   ├── docker/                      # Dockerfiles
│   ├── nginx/                       # Reverse proxy
│   └── ci/                          # CI/CD
│
├── docs/                            # Documentation projet
│
├── .env                             # Variables d’environnement
├── requirements.txt                 # Dépendances backend
└── README.md                        # Présentation du projet


Démarrage du projet
Prérequis

Assurez-vous d’avoir installé :

Python 3.10 ou supérieur

PostgreSQL

Redis

Git

Un outil de virtualisation Python (venv ou virtualenv)

Installation
1. Cloner le dépôt
git clone https://github.com/votre-username/meedness.git
cd meedness

2. Créer un environnement virtuel
python -m venv venv


Activation :

Linux / macOS

source venv/bin/activate


Windows

venv\Scripts\activate

3. Installer les dépendances
pip install -r requirements/dev.txt

4. Configuration de l’environnement

Créer un fichier .env.dev à la racine du projet :

DJANGO_ENV=dev
DJANGO_SECRET_KEY=dev_secret_key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=meedness_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://127.0.0.1:6379


Les fichiers .env ne doivent jamais être commités.

5. Configuration de la base de données

Créer la base de données PostgreSQL :

CREATE DATABASE meedness_dev;


Appliquer les migrations :

python manage.py migrate

6. Créer un superutilisateur
python manage.py createsuperuser

7. Lancer Redis

Assurez-vous que Redis est en cours d’exécution :

redis-server

8. Lancer le serveur de développement
python manage.py runserver


Application accessible à l’adresse :

http://127.0.0.1:8000

WebSockets et mode asynchrone

Le projet utilise Django Channels.
En production, l’application doit être lancée via ASGI.

Séparation des environnements

MeedNess utilise plusieurs environnements :

Développement : .env.dev

Production : .env.prod

L’environnement actif est défini par :

DJANGO_ENV=dev


Cela permet :

Un développement local sécurisé

Une configuration production propre

Un déploiement simplifié

Bonnes pratiques du projet

Applications Django modulaires

Vues légères, logique métier centralisée

Séparation claire des responsabilités

Aucune donnée sensible dans le code

Configuration par environnement

Contribution

Forker le dépôt

Créer une branche de fonctionnalité

Écrire un code clair et documenté

Respecter l’architecture existante

Soumettre une pull request

Feuille de route

Versionnement de l’API

Application frontend

Application mobile

Tableaux de bord avancés

Automatisation assistée par IA

Licence

Ce projet est open-source sous licence MIT.

Contact

Projet maintenu par l’équipe MeedNess.
Pour toute suggestion ou problème, veuillez utiliser le système d’issues du dépôt.