"""
Configuration dynamique des settings selon l'environnement.
Charge le fichier .env depuis le dossier backend/ pour que toutes les variables soient lues.
"""
from pathlib import Path

# Charger .env depuis backend/ (pour que tu puisses mettre ton .env à la racine du backend)
try:
    from dotenv import load_dotenv
    _backend_dir = Path(__file__).resolve().parent.parent.parent
    load_dotenv(_backend_dir / '.env')
except ImportError:
    pass  # python-dotenv non installé : les variables doivent être dans l'environnement ou dans config/settings/.env

from decouple import config

environment = config('DJANGO_ENV', default='dev')

if environment == 'prod':
    from .prod import *
else:
    from .dev import *