export const mapFailureToUserMessage = (failure: { type: string; userMessage?: string; retryable?: boolean }): string => {
  switch (failure.type) {
    case 'invalid_credentials':
      return 'Email ou mot de passe incorrect.';
    case 'network_error':
      return 'Impossible de se connecter. Vérifiez votre connexion.';
    case 'session_expired':
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    default:
      return failure.userMessage ?? 'Une erreur est survenue. Veuillez réessayer.';
  }
};
