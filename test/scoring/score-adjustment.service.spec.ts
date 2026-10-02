import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipationService } from '../../src/modules/competition/participation.service';
import type { DatabaseService } from '../../src/modules/database/database.service';
import { ScoreAdjustmentService } from '../../src/modules/scoring/score-adjustment.service';
import type { SideEventService } from '../../src/modules/side-events/side-event.service';

describe('ScoreAdjustmentService', () => {
  const input = { discordId: 'discord-1', amount: 25, reason: 'Bonus', moderatorId: 'mod-1' };
  let db: {
    player: { findUnique: ReturnType<typeof vi.fn> };
    sideEventEntry: Record<'findFirst' | 'create', ReturnType<typeof vi.fn>>;
    scoreAdjustment: { create: ReturnType<typeof vi.fn> };
  };
  let findActiveSeasonEntry: ReturnType<typeof vi.fn>;
  let requireActive: ReturnType<typeof vi.fn>;
  let service: ScoreAdjustmentService;

  beforeEach(() => {
    db = {
      player: { findUnique: vi.fn().mockResolvedValue({ id: 'player-1', status: 'ACTIVE' }) },
      sideEventEntry: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'side-entry-1' }),
      },
      scoreAdjustment: { create: vi.fn().mockResolvedValue({}) },
    };
    findActiveSeasonEntry = vi.fn().mockResolvedValue({ id: 'entry-1' });
    requireActive = vi.fn().mockResolvedValue({ id: 'event-1', name: 'Tournoi' });
    service = new ScoreAdjustmentService(
      db as unknown as DatabaseService,
      { findActiveSeasonEntry } as unknown as ParticipationService,
      { requireActive } as unknown as SideEventService,
    );
  });

  it('attaches season adjustments to the active season entry', async () => {
    await service.adjustSeason(input);

    expect(db.scoreAdjustment.create).toHaveBeenCalledWith({
      data: { amount: 25, reason: 'Bonus', moderatorId: 'mod-1', seasonEntryId: 'entry-1' },
    });
  });

  it('refuses season adjustments without a running season entry', async () => {
    findActiveSeasonEntry.mockResolvedValue(null);
    await expect(service.adjustSeason(input)).rejects.toThrow('aucune saison');
  });

  it('refuses adjustments for players who are not active', async () => {
    db.player.findUnique.mockResolvedValue({ id: 'player-1', status: 'BANNED' });
    await expect(service.adjustSeason(input)).rejects.toThrow("n'est pas inscrit");
  });

  it('creates the side event participation on first points', async () => {
    const event = await service.adjustSideEvent('event-1', input);

    expect(event.name).toBe('Tournoi');
    expect(db.sideEventEntry.create).toHaveBeenCalledWith({ data: { sideEventId: 'event-1', playerId: 'player-1' } });
    expect(db.scoreAdjustment.create).toHaveBeenCalledWith({
      data: { amount: 25, reason: 'Bonus', moderatorId: 'mod-1', sideEventEntryId: 'side-entry-1' },
    });
  });

  it('reuses an existing side event participation', async () => {
    db.sideEventEntry.findFirst.mockResolvedValue({ id: 'side-entry-9' });

    await service.adjustSideEvent('event-1', input);

    expect(db.sideEventEntry.create).not.toHaveBeenCalled();
  });
});
