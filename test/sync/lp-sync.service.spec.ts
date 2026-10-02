import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipationService } from '../../src/modules/competition/participation.service';
import type { DatabaseService } from '../../src/modules/database/database.service';
import type { RiotApiClient } from '../../src/modules/riot/riot-api.client';
import { LpSyncService } from '../../src/modules/sync/lp-sync.service';

describe('LpSyncService', () => {
  const entries = [
    { id: 'e1', player: { puuid: 'puuid-1', gameName: 'A', tagLine: 'EUW' } },
    { id: 'e2', player: { puuid: 'puuid-2', gameName: 'B', tagLine: 'EUW' } },
  ];
  let findMany: ReturnType<typeof vi.fn>;
  let findSoloQueueEntry: ReturnType<typeof vi.fn>;
  let recordSnapshot: ReturnType<typeof vi.fn>;
  let service: LpSyncService;

  beforeEach(() => {
    findMany = vi.fn().mockResolvedValue(entries);
    findSoloQueueEntry = vi.fn().mockResolvedValue(null);
    recordSnapshot = vi.fn().mockResolvedValue(true);
    service = new LpSyncService(
      { seasonEntry: { findMany } } as unknown as DatabaseService,
      { findSoloQueueEntry } as unknown as RiotApiClient,
      { recordSnapshot } as unknown as ParticipationService,
    );
  });

  it('records a snapshot for every active entry', async () => {
    const report = await service.syncActiveSeason();

    expect(report).toEqual({ synced: 2, failed: 0 });
    expect(recordSnapshot).toHaveBeenCalledWith('e1', 'puuid-1', null);
  });

  it('keeps going when one player fails', async () => {
    findSoloQueueEntry.mockRejectedValueOnce(new Error('boom'));

    const report = await service.syncActiveSeason();

    expect(report).toEqual({ synced: 1, failed: 1 });
  });

  it('shares a single run between concurrent callers', async () => {
    const [first, second] = await Promise.all([service.syncActiveSeason(), service.syncActiveSeason()]);

    expect(first).toBe(second);
    expect(findMany).toHaveBeenCalledTimes(1);
  });
});
