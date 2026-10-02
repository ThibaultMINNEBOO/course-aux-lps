import { Injectable } from '@spraxium/common';
import { Logger } from '@spraxium/logger';
import { Cron, CronExpression } from '@spraxium/schedule';
import { ParticipationService } from '../competition/participation.service';
import { DatabaseService } from '../database/database.service';
import { RiotApiClient } from '../riot/riot-api.client';

export interface SyncReport {
  synced: number;
  failed: number;
}

@Injectable()
export class LpSyncService {
  private readonly logger = new Logger(LpSyncService.name);
  private running: Promise<SyncReport> | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly riot: RiotApiClient,
    private readonly participation: ParticipationService,
  ) {}

  @Cron(CronExpression.EVERY_15_MINUTES, { name: 'lp-sync' })
  async scheduledSync(): Promise<void> {
    await this.syncActiveSeason();
  }

  syncActiveSeason(): Promise<SyncReport> {
    if (!this.running) {
      this.running = this.run().finally(() => {
        this.running = null;
      });
    }
    return this.running;
  }

  private async run(): Promise<SyncReport> {
    const entries = await this.db.seasonEntry.findMany({
      where: { active: true, season: { status: 'ACTIVE' } },
      include: { player: true },
    });
    const report: SyncReport = { synced: 0, failed: 0 };
    for (const entry of entries) {
      try {
        const snapshot = await this.riot.findSoloQueueEntry(entry.player.puuid);
        if (await this.participation.recordSnapshot(entry.id, entry.player.puuid, snapshot)) {
          report.synced++;
        }
      } catch (error) {
        report.failed++;
        this.logger.warn(`Failed to sync ${entry.player.gameName}#${entry.player.tagLine}: ${String(error)}`);
      }
    }
    if (entries.length > 0) {
      this.logger.info(`LP sync done: ${report.synced} synced, ${report.failed} failed`);
    }
    return report;
  }
}
