import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '../../src/app.env';
import { RiotApiClient } from '../../src/modules/riot/riot-api.client';
import { RiotApiError } from '../../src/modules/riot/riot-api.error';

function respond(status: number, body: unknown = {}, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('RiotApiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: RiotApiClient;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    client = new RiotApiClient({ riotApiKey: 'RGAPI-test' } as AppEnv);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends the API key and returns the solo queue entry', async () => {
    fetchMock.mockResolvedValue(
      respond(200, [
        { queueType: 'RANKED_FLEX_SR', tier: 'IRON', rank: 'IV', leaguePoints: 0, wins: 0, losses: 0 },
        { queueType: 'RANKED_SOLO_5x5', tier: 'GOLD', rank: 'II', leaguePoints: 45, wins: 1, losses: 2 },
      ]),
    );

    const entry = await client.findSoloQueueEntry('puuid-1');

    expect(entry?.tier).toBe('GOLD');
    expect(fetchMock).toHaveBeenCalledWith('https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/puuid-1', {
      headers: { 'X-Riot-Token': 'RGAPI-test' },
    });
  });

  it('returns null for unknown accounts', async () => {
    fetchMock.mockResolvedValue(respond(404));

    await expect(client.findAccountByRiotId({ gameName: 'Ghost', tagLine: 'EUW' })).resolves.toBeNull();
  });

  it('waits for Retry-After before retrying a rate limited call', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(429, {}, { 'Retry-After': '3' }))
      .mockResolvedValueOnce(respond(200, { puuid: 'puuid-1', gameName: 'Faker', tagLine: 'EUW' }));

    const pending = client.findAccountByRiotId({ gameName: 'Faker', tagLine: 'EUW' });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(pending).resolves.toMatchObject({ puuid: 'puuid-1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails immediately on non retryable errors', async () => {
    fetchMock.mockResolvedValue(respond(403));

    await expect(client.findSoloQueueEntry('puuid-1')).rejects.toBeInstanceOf(RiotApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
