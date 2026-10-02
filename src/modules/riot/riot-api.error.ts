import { DomainException } from '../../shared/domain.exception';

export class RiotApiError extends DomainException {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`L'API Riot a répondu avec une erreur (${status}). Réessaie dans quelques instants.`);
    this.name = 'RiotApiError';
  }
}
