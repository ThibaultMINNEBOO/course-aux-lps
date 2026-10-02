import { PrismaPg } from '@prisma/adapter-pg';
import { loadEnv } from '@spraxium/env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma/client';
import { ParticipationService } from '../../src/modules/competition/participation.service';
import type { DatabaseService } from '../../src/modules/database/database.service';
import { PlayerService } from '../../src/modules/players/player.service';
import type { RiotApiClient } from '../../src/modules/riot/riot-api.client';
import type { RiotId } from '../../src/modules/riot/riot-id';
import { ScoreAdjustmentService } from '../../src/modules/scoring/score-adjustment.service';
import { StandingsService } from '../../src/modules/scoring/standings.service';
import { SeasonService } from '../../src/modules/seasons/season.service';
import { SideEventService } from '../../src/modules/side-events/side-event.service';
import { LpSyncService } from '../../src/modules/sync/lp-sync.service';

loadEnv();

const ranks = new Map([
  ['puuid-a', { tier: 'GOLD', rank: 'II', leaguePoints: 40, wins: 10, losses: 10 }],
  ['puuid-b', { tier: 'SILVER', rank: 'I', leaguePoints: 90, wins: 5, losses: 5 }],
  ['puuid-c', { tier: 'PLATINUM', rank: 'IV', leaguePoints: 0, wins: 50, losses: 50 }],
]);

const riot = {
  findAccountByRiotId: async ({ gameName, tagLine }: RiotId) => ({
    puuid: `puuid-${gameName.slice(-1).toLowerCase()}`,
    gameName,
    tagLine,
  }),
  findSoloQueueEntry: async (puuid: string) => ({ queueType: 'RANKED_SOLO_5x5', ...ranks.get(puuid) }),
} as unknown as RiotApiClient;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }) });
const db = prisma as unknown as DatabaseService;
const participation = new ParticipationService(db);
const players = new PlayerService(db, riot, participation);
const seasons = new SeasonService(db, riot, participation);
const sideEvents = new SideEventService(db);
const adjustments = new ScoreAdjustmentService(db, participation, sideEvents);
const standings = new StandingsService(db);
const sync = new LpSyncService(db, riot, participation);

const scoresOf = async (seasonId: string) =>
  (await standings.forSeason(seasonId)).map((row) => [row.place, row.discordId, row.score]);

describe('competition flow', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE "Player", "Season", "SideEvent" CASCADE');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('runs a season from registration to renewal', async () => {
    await players.register('user-a', 'PlayerA#EUW');
    const { season } = await seasons.create({ frequency: 'WEEKLY', autoRenew: true });
    await players.register('user-b', 'PlayerB#EUW');

    ranks.set('puuid-a', { tier: 'GOLD', rank: 'I', leaguePoints: 10, wins: 13, losses: 11 });
    ranks.set('puuid-b', { tier: 'GOLD', rank: 'IV', leaguePoints: 15, wins: 6, losses: 5 });
    expect(await sync.syncActiveSeason()).toEqual({ synced: 2, failed: 0 });

    await adjustments.adjustSeason({ discordId: 'user-b', amount: 50, reason: 'Bonus', moderatorId: 'mod' });
    expect(await scoresOf(season.id)).toEqual([
      [1, 'user-b', 75],
      [2, 'user-a', 70],
    ]);

    const rows = await standings.forSeason(season.id);
    await prisma.dailySnapshot.createMany({
      data: rows.map((row) => ({ seasonEntryId: row.entryId, score: row.score, wins: row.wins, losses: row.losses })),
    });
    expect((await standings.forSeason(season.id)).every((row) => row.dailyDelta === 0)).toBe(true);

    await players.changeRiotId('user-a', 'PlayerC#EUW');
    expect(await scoresOf(season.id)).toContainEqual([2, 'user-a', 70]);

    await players.ban('user-b', 'Triche');
    expect(await scoresOf(season.id)).toEqual([[1, 'user-a', 70]]);
    await players.unban('user-b');
    expect(await scoresOf(season.id)).toContainEqual([2, 'user-b', 0]);

    const { season: next, enrolled } = await seasons.renew(await seasons.close(season));
    expect([next.number, enrolled]).toEqual([2, 2]);
    expect((await standings.forSeason(next.id)).every((row) => row.score === 0)).toBe(true);

    expect(await players.markMissingMembersAsLeft(new Set(['user-a']))).toBe(1);
    expect((await standings.forSeason(next.id)).map((row) => row.discordId)).toEqual(['user-a']);
  });

  it('tracks side event points', async () => {
    const event = await sideEvents.create({ name: 'Tournoi ARAM' });
    await adjustments.adjustSideEvent(event.id, {
      discordId: 'user-a',
      amount: 7,
      reason: 'Victoire',
      moderatorId: 'mod',
    });
    await adjustments.adjustSideEvent(event.id, {
      discordId: 'user-a',
      amount: -2,
      reason: 'Retard',
      moderatorId: 'mod',
    });

    expect((await sideEvents.search('aram', false)).map((found) => found.id)).toEqual([event.id]);
    expect((await standings.forSideEvent(event.id)).map((row) => [row.discordId, row.score])).toEqual([['user-a', 5]]);
  });
});
