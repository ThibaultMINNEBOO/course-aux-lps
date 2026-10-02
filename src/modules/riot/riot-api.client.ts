import { Injectable } from '@spraxium/common';
import { Logger } from '@spraxium/logger';
import { AppEnv } from '../../app.env';
import { RequestThrottle, sleep } from './request-throttle';
import type { LeagueEntry, RiotAccount } from './riot.types';
import { RiotApiError } from './riot-api.error';
import type { RiotId } from './riot-id';

const REGIONAL_HOST = 'https://europe.api.riotgames.com';
const PLATFORM_HOST = 'https://euw1.api.riotgames.com';
const SOLO_QUEUE = 'RANKED_SOLO_5x5';
const REQUEST_SPACING_MS = 1250;
const MAX_ATTEMPTS = 4;
const SERVER_ERROR_BACKOFF_MS = 2000;

@Injectable()
export class RiotApiClient {
  private readonly logger = new Logger(RiotApiClient.name);
  private readonly throttle = new RequestThrottle(REQUEST_SPACING_MS);

  constructor(private readonly env: AppEnv) {}

  findAccountByRiotId(riotId: RiotId): Promise<RiotAccount | null> {
    const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(riotId.gameName)}/${encodeURIComponent(riotId.tagLine)}`;
    return this.get<RiotAccount>(`${REGIONAL_HOST}${path}`);
  }

  findAccountByPuuid(puuid: string): Promise<RiotAccount | null> {
    return this.get<RiotAccount>(`${REGIONAL_HOST}/riot/account/v1/accounts/by-puuid/${puuid}`);
  }

  async findSoloQueueEntry(puuid: string): Promise<LeagueEntry | null> {
    const entries = await this.get<Array<LeagueEntry>>(`${PLATFORM_HOST}/lol/league/v4/entries/by-puuid/${puuid}`);
    return entries?.find((entry) => entry.queueType === SOLO_QUEUE) ?? null;
  }

  private async get<T>(url: string): Promise<T | null> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const response = await this.throttle.schedule(() =>
        fetch(url, { headers: { 'X-Riot-Token': this.env.riotApiKey } }),
      );
      if (response.ok) {
        return (await response.json()) as T;
      }
      if (response.status === 404) {
        return null;
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw new RiotApiError(response.status, url);
      }
      const delay = this.retryDelay(response, attempt);
      this.logger.warn(`Riot API ${response.status}, retrying in ${delay}ms`);
      await sleep(delay);
    }
    throw new RiotApiError(0, url);
  }

  private retryDelay(response: Response, attempt: number): number {
    const retryAfter = Number(response.headers.get('Retry-After'));
    if (response.status === 429 && retryAfter > 0) {
      return retryAfter * 1000;
    }
    return SERVER_ERROR_BACKOFF_MS * attempt;
  }
}
