import { Injectable } from '@spraxium/common';
import type { Season, SeasonEntry } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { type EntryProgress, type RankedSnapshot, applyRankedSnapshot, carryOver } from './entry-progress';

const EMPTY_PROGRESS: EntryProgress = {
  baselineLp: null,
  baselineWins: 0,
  baselineLosses: 0,
  currentLp: null,
  wins: 0,
  losses: 0,
  carriedLp: 0,
  carriedWins: 0,
  carriedLosses: 0,
};

@Injectable()
export class ParticipationService {
  constructor(private readonly db: DatabaseService) {}

  findActiveSeason(): Promise<Season | null> {
    return this.db.season.findFirst({ where: { status: 'ACTIVE' } });
  }

  findActiveSeasonEntry(playerId: string): Promise<SeasonEntry | null> {
    return this.db.seasonEntry.findFirst({
      where: { playerId, active: true, season: { status: 'ACTIVE' } },
    });
  }

  async enrollInActiveSeason(playerId: string, snapshot: RankedSnapshot | null): Promise<Season | null> {
    const season = await this.findActiveSeason();
    if (!season) {
      return null;
    }
    await this.enroll(season.id, playerId, snapshot);
    return season;
  }

  async enroll(seasonId: string, playerId: string, snapshot: RankedSnapshot | null): Promise<SeasonEntry> {
    const existing = await this.db.seasonEntry.findFirst({ where: { seasonId, playerId, active: true } });
    if (existing) {
      return existing;
    }
    return this.db.seasonEntry.create({
      data: {
        seasonId,
        playerId,
        ...applyRankedSnapshot(EMPTY_PROGRESS, snapshot),
        lastSyncedAt: new Date(),
      },
    });
  }

  async recordSnapshot(entry: SeasonEntry, snapshot: RankedSnapshot | null): Promise<SeasonEntry> {
    return this.db.seasonEntry.update({
      where: { id: entry.id },
      data: { ...applyRankedSnapshot(entry, snapshot), lastSyncedAt: new Date() },
    });
  }

  async switchAccount(playerId: string, snapshot: RankedSnapshot | null): Promise<void> {
    const entry = await this.findActiveSeasonEntry(playerId);
    if (!entry) {
      return;
    }
    const reset = { ...entry, ...carryOver(entry) };
    await this.db.seasonEntry.update({
      where: { id: entry.id },
      data: { ...carryOver(entry), ...applyRankedSnapshot(reset, snapshot), lastSyncedAt: new Date() },
    });
  }

  async withdraw(playerId: string): Promise<void> {
    const removal = { active: false, removedAt: new Date() };
    await this.db.$transaction([
      this.db.seasonEntry.updateMany({ where: { playerId, active: true }, data: removal }),
      this.db.sideEventEntry.updateMany({ where: { playerId, active: true }, data: removal }),
    ]);
  }
}
