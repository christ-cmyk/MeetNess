from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Comptes Utilisateurs'
    
    def ready(self):
        """
        Code à exécuter quand l'app est prête.
        Import des signals ici si nécessaire.
        """
        pass