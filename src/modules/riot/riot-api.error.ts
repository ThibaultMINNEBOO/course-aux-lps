export class RiotApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Riot API responded ${status} for ${url}`);
    this.name = 'RiotApiError';
  }
}
