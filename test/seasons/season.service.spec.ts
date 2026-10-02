import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Season } from '../../src/generated/prisma/client';
import type { ParticipationService } from '../../src/modules/competition/participation.service';
import type { DatabaseService } from '../../src/modules/database/database.service';
import type { RiotApiClient } from '../../src/modules/riot/riot-api.client';
import { SeasonService } from '../../src/modules/seasons/season.service';

function paris(iso: string): Date {
  return DateTime.fromISO(iso, { zone: 'Europe/Paris' }).toJSDate();
}

function makeSeason(overrides: Partial<Season> = {}): Season {
  return {
    id: 'season-1',
    number: 1,
    frequency: 'WEEKLY',
    startsAt: paris('2026-10-05T21:00'),
    endsAt: paris('2026-10-12T21:00'),
    status: 'ACTIVE',
    autoRenew: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('SeasonService', () => {
  const soloQueue = { queueType: 'RANKED_SOLO_5x5', tier: 'GOLD', rank: 'II', leaguePoints: 45, wins: 10, losses: 8 };
  let db: {
    season: Record<'findFirst' | 'create' | 'update', ReturnType<typeof vi.fn>>;
    player: Record<'findMany', ReturnType<typeof vi.fn>>;
    seasonEntry: Record<'findMany', ReturnType<typeof vi.fn>>;
  };
  let riot: Record<'findSoloQueueEntry', ReturnType<typeof vi.fn>>;
  let participation: Record<'findActiveSeason' | 'enroll', ReturnType<typeof vi.fn>>;
  let service: SeasonService;

  beforeEach(() => {
    db = {
      season: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve(makeSeason({ id: 'season-new', ...data }))),
        update: vi.fn(),
      },
      player: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', puuid: 'puuid-1' },
          { id: 'p2', puuid: 'puuid-2' },
        ]),
      },
      seasonEntry: { findMany: vi.fn().mockResolvedValue([]) },
    };
    riot = { findSoloQueueEntry: vi.fn().mockResolvedValue(soloQueue) };
    participation = { findActiveSeason: vi.fn().mockResolvedValue(null), enroll: vi.fn() };
    service = new SeasonService(
      db as unknown as DatabaseService,
      riot as unknown as RiotApiClient,
      participation as unknown as ParticipationService,
    );
  });

  describe('create', () => {
    it('creates the next numbered season and enrolls every active player', async () => {
      db.season.findFirst.mockResolvedValue(makeSeason({ number: 3, status: 'ENDED' }));

      const { season, enrolled } = await service.create(
        { frequency: 'WEEKLY', autoRenew: true },
        paris('2026-10-05T18:00'),
      );

      expect(season.number).toBe(4);
      expect(season.endsAt).toEqual(paris('2026-10-12T21:00'));
      expect(enrolled).toBe(2);
      expect(participation.enroll).toHaveBeenCalledWith('season-new', 'p1', soloQueue);
    });

    it('refuses to start while another season is running', async () => {
      participation.findActiveSeason.mockResolvedValue(makeSeason());
      await expect(service.create({ frequency: 'WEEKLY', autoRenew: true })).rejects.toThrow('déjà en cours');
    });

    it('requires an end date for custom seasons', async () => {
      await expect(service.create({ frequency: 'CUSTOM', autoRenew: true })).rejects.toThrow('date de fin');
    });

    it('rejects an end date in the past', async () => {
      await expect(
        service.create(
          { frequency: 'CUSTOM', customEnd: paris('2026-10-01T00:00'), autoRenew: true },
          paris('2026-10-05T18:00'),
        ),
      ).rejects.toThrow('futur');
    });
  });

  describe('renew', () => {
    it('starts where the previous season ended and reuses the last known ranks', async () => {
      db.seasonEntry.findMany.mockResolvedValue([
        {
          playerId: 'p1',
          currentTier: 'PLATINUM',
          currentDivision: 'IV',
          currentLeaguePoints: 12,
          wins: 30,
          losses: 20,
        },
      ]);

      const { season } = await service.renew(makeSeason());

      expect(season.number).toBe(2);
      expect(season.startsAt).toEqual(paris('2026-10-12T21:00'));
      expect(season.endsAt).toEqual(paris('2026-10-19T21:00'));
      expect(participation.enroll).toHaveBeenCalledWith('season-new', 'p1', {
        tier: 'PLATINUM',
        rank: 'IV',
        leaguePoints: 12,
        wins: 30,
        losses: 20,
      });
      expect(riot.findSoloQueueEntry).toHaveBeenCalledTimes(1);
      expect(riot.findSoloQueueEntry).toHaveBeenCalledWith('puuid-2');
    });

    it('keeps the duration of custom seasons', async () => {
      const previous = makeSeason({
        frequency: 'CUSTOM',
        startsAt: paris('2026-10-01T21:00'),
        endsAt: paris('2026-10-11T21:00'),
      });

      const { season } = await service.renew(previous);

      expect(season.endsAt).toEqual(paris('2026-10-21T21:00'));
    });
  });
});
