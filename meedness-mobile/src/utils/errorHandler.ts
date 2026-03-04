// Gestionnaire d'erreurs pour MeedNess

export function formatApiError(error: any): string {
  // Si c'est une erreur Axios
  if (error.response) {
    const { data, status } = error.response;
    
    // Erreur 400 : Validation
    if (status === 400 && data) {
      // Si Django retourne des erreurs de champs
      if (typeof data === 'object') {
        const firstError = Object.values(data)[0];
        if (Array.isArray(firstError)) {
          return firstError[0] as string;
        }
        if (typeof firstError === 'string') {
          return firstError;
        }
      }
      
      // Message générique
      return data.message || data.detail || 'Données invalides';
    }
    
    // Erreur 401 : Non autorisé
    if (status === 401) {
      return 'Email ou mot de passe incorrect';
    }
    
    // Erreur 403 : Interdit
    if (status === 403) {
      return 'Accès refusé';
    }
    
    // Erreur 404 : Non trouvé
    if (status === 404) {
      return 'Ressource introuvable';
    }
    
    // Erreur 500 : Serveur
    if (status >= 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }
  }
  
  // Erreur réseau
  if (error.message === 'Network Error') {
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }
  
  // Erreur générique
  return error.message || 'Une erreur est survenue';
}