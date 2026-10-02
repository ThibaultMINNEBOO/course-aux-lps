import { EmbedBuilder } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../../src/modules/database/database.service';
import type { LeaderboardService } from '../../src/modules/leaderboard/leaderboard.service';
import type { CompetitionClosingService } from '../../src/modules/recap/competition-closing.service';
import { RecapService } from '../../src/modules/recap/recap.service';
import type { RecapChannel } from '../../src/modules/recap/recap-channel';
import type { StandingsService } from '../../src/modules/scoring/standings.service';
import type { SeasonService } from '../../src/modules/seasons/season.service';
import type { SideEventService } from '../../src/modules/side-events/side-event.service';
import type { LpSyncService } from '../../src/modules/sync/lp-sync.service';

const NOW = new Date('2026-10-08T19:00:00Z');

describe('RecapService', () => {
  const season = {
    id: 'season-1',
    number: 3,
    startsAt: new Date('2026-10-05T19:00:00Z'),
    endsAt: new Date('2026-10-12T19:00:00Z'),
  };
  const standings = [
    {
      entryId: 'entry-1',
      name: 'Alpha',
      discordId: 'a',
      score: 40,
      dailyDelta: 15,
      rankLabel: 'Or II · 40 LP',
      wins: 4,
      losses: 2,
      place: 1,
    },
  ];
  let findActive: ReturnType<typeof vi.fn>;
  let createMany: ReturnType<typeof vi.fn>;
  let send: ReturnType<typeof vi.fn>;
  let closeDue: ReturnType<typeof vi.fn>;
  let syncActiveSeason: ReturnType<typeof vi.fn>;
  let service: RecapService;

  beforeEach(() => {
    findActive = vi.fn().mockResolvedValue(season);
    createMany = vi.fn().mockResolvedValue({ count: 1 });
    send = vi.fn().mockResolvedValue(undefined);
    closeDue = vi.fn().mockResolvedValue(undefined);
    syncActiveSeason = vi.fn().mockResolvedValue({ synced: 1, failed: 0 });
    service = new RecapService(
      { dailySnapshot: { createMany } } as unknown as DatabaseService,
      { findActive } as unknown as SeasonService,
      {
        findActive: vi.fn().mockResolvedValue([{ id: 'event-1', name: 'Tournoi' }]),
      } as unknown as SideEventService,
      {
        forSeason: vi.fn().mockResolvedValue(standings),
        forSideEvent: vi.fn().mockResolvedValue([]),
      } as unknown as StandingsService,
      {
        buildEmbed: vi
          .fn()
          .mockImplementation(({ title, description }) =>
            new EmbedBuilder().setTitle(title).setDescription(description),
          ),
        navigation: vi.fn().mockResolvedValue([]),
      } as unknown as LeaderboardService,
      { syncActiveSeason } as unknown as LpSyncService,
      { closeDue } as unknown as CompetitionClosingService,
      { send } as unknown as RecapChannel,
    );
  });

  it('syncs, publishes the recap, snapshots scores and closes due competitions', async () => {
    await service.publishDailyRecap(NOW);

    expect(syncActiveSeason).toHaveBeenCalled();
    const [message] = send.mock.calls[0];
    const embed = message.embeds[0].toJSON();
    expect(embed.title).toBe('📊 Récap du 08/10/2026 — Saison 3');
    expect(embed.description).toContain('Jour 4/8');
    expect(embed.description).toContain('🥇 **Alpha** +15 LP');
    expect(embed.fields?.[0].name).toBe('🎯 Tournoi');
    expect(createMany).toHaveBeenCalledWith({
      data: [{ seasonEntryId: 'entry-1', takenAt: NOW, score: 40, wins: 4, losses: 2 }],
    });
    expect(closeDue).toHaveBeenCalledWith(NOW);
  });

  it('still snapshots scores when the channel is unavailable', async () => {
    send.mockRejectedValue(new Error('missing channel'));

    await service.publishDailyRecap(NOW);

    expect(createMany).toHaveBeenCalled();
  });

  it('only closes due competitions when no season is running', async () => {
    findActive.mockResolvedValue(null);

    await service.publishDailyRecap(NOW);

    expect(send).not.toHaveBeenCalled();
    expect(closeDue).toHaveBeenCalledWith(NOW);
  });
});
