import { Injectable } from '@spraxium/common';
import { Logger } from '@spraxium/logger';
import { AfterOnline, Cron } from '@spraxium/schedule';
import { time } from 'discord.js';
import type { Season } from '../../generated/prisma/client';
import { BRAND_COLORS } from '../../shared/brand';
import { formatDate } from '../../shared/format';
import { DatabaseService } from '../database/database.service';
import type { BoardMessage } from '../leaderboard/leaderboard.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { formatRows, formatSeasonRow } from '../leaderboard/standings-format';
import type { Ranked } from '../scoring/standings';
import { paginate } from '../scoring/standings';
import { type SeasonStandingRow, StandingsService } from '../scoring/standings.service';
import { SeasonService } from '../seasons/season.service';
import { COMPETITION_ZONE, seasonProgress } from '../seasons/season-period';
import { SideEventService } from '../side-events/side-event.service';
import { LpSyncService } from '../sync/lp-sync.service';
import { CompetitionClosingService } from './competition-closing.service';
import { RecapChannel } from './recap-channel';
import { dailyHighlights, formatDailyHighlights, formatEventHighlights } from './recap-format';

const MAX_EVENT_FIELDS = 5;
const STARTUP_DELAY_MS = 15_000;

@Injectable()
export class RecapService {
  private readonly logger = new Logger(RecapService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly seasons: SeasonService,
    private readonly sideEvents: SideEventService,
    private readonly standings: StandingsService,
    private readonly leaderboards: LeaderboardService,
    private readonly sync: LpSyncService,
    private readonly closing: CompetitionClosingService,
    private readonly channel: RecapChannel,
  ) {}

  @Cron('0 21 * * *', { name: 'daily-recap', timezone: COMPETITION_ZONE })
  async scheduledRecap(): Promise<void> {
    await this.publishDailyRecap();
  }

  @AfterOnline(STARTUP_DELAY_MS, { name: 'overdue-closing' })
  async closeOverdue(): Promise<void> {
    await this.closing.closeDue();
  }

  async publishDailyRecap(now = new Date()): Promise<void> {
    const season = await this.seasons.findActive();
    if (season) {
      await this.publishSeasonRecap(season, now);
    }
    await this.closing.closeDue(now);
  }

  async preview(now = new Date()): Promise<BoardMessage> {
    const season = await this.seasons.requireActive();
    return this.buildRecap(season, await this.standings.forSeason(season.id), now);
  }

  private async publishSeasonRecap(season: Season, now: Date): Promise<void> {
    await this.sync.syncActiveSeason();
    const standings = await this.standings.forSeason(season.id);
    try {
      await this.channel.send(await this.buildRecap(season, standings, now));
    } catch (error) {
      this.logger.error(`Failed to publish the daily recap: ${String(error)}`);
    }
    await this.db.dailySnapshot.createMany({
      data: standings.map((row) => ({
        seasonEntryId: row.entryId,
        takenAt: now,
        score: row.score,
        wins: row.wins,
        losses: row.losses,
      })),
    });
  }

  private async buildRecap(
    season: Season,
    standings: Array<Ranked<SeasonStandingRow>>,
    now: Date,
  ): Promise<BoardMessage> {
    const { day, totalDays } = seasonProgress(season, now);
    const page = paginate(standings, 1);
    const embed = this.leaderboards.buildEmbed({
      title: `📊 Récap du ${formatDate(now)} — Saison ${season.number}`,
      description: [
        `Jour ${day}/${totalDays} · fin ${time(season.endsAt, 'R')}`,
        `**🔥 Top du jour**\n${formatDailyHighlights(dailyHighlights(standings))}`,
        `**🏆 Classement général**\n${formatRows(page.items, (row) => formatSeasonRow(row, true))}`,
      ].join('\n\n'),
      color: BRAND_COLORS.primary,
      footer:
        page.totalPages > 1
          ? `Page 1/${page.totalPages} · Utilise les boutons pour parcourir le classement`
          : 'Classement complet',
    });
    const events = (await this.sideEvents.findActive()).slice(0, MAX_EVENT_FIELDS);
    for (const event of events) {
      embed.addFields({
        name: `🎯 ${event.name}`,
        value: formatEventHighlights(await this.standings.forSideEvent(event.id)),
      });
    }
    return {
      embeds: [embed],
      components: await this.leaderboards.navigation(
        { kind: 'season', id: season.id },
        page.page,
        page.totalPages,
        'ephemeral',
      ),
    };
  }
}
