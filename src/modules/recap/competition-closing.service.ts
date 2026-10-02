import { Injectable } from '@spraxium/common';
import { Logger } from '@spraxium/logger';
import type { Season, SideEvent } from '../../generated/prisma/client';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { StandingsService } from '../scoring/standings.service';
import { SeasonService } from '../seasons/season.service';
import { seasonSummaryEmbed } from '../seasons/season-messages';
import { SideEventService } from '../side-events/side-event.service';
import { LpSyncService } from '../sync/lp-sync.service';
import { RecapChannel } from './recap-channel';

const DUE_TOLERANCE_MS = 60_000;

export type SeasonClosing = 'scheduled' | 'manual';

@Injectable()
export class CompetitionClosingService {
  private readonly logger = new Logger(CompetitionClosingService.name);

  constructor(
    private readonly seasons: SeasonService,
    private readonly sideEvents: SideEventService,
    private readonly standings: StandingsService,
    private readonly leaderboards: LeaderboardService,
    private readonly sync: LpSyncService,
    private readonly channel: RecapChannel,
  ) {}

  async closeDue(now = new Date()): Promise<void> {
    const deadline = now.getTime() + DUE_TOLERANCE_MS;
    const season = await this.seasons.findActive();
    if (season && season.endsAt.getTime() <= deadline) {
      await this.closeSeason(season, 'scheduled');
    }
    for (const event of await this.sideEvents.findDue(new Date(deadline))) {
      await this.closeSideEvent(event);
    }
  }

  async closeSeason(season: Season, closing: SeasonClosing): Promise<Season | null> {
    await this.sync.syncActiveSeason();
    const ended = closing === 'manual' ? await this.seasons.closeNow(season) : await this.seasons.close(season);
    this.logger.info(`Season ${ended.number} closed (${closing})`);
    await this.channel.send({
      content: await this.seasonWinnerAnnouncement(ended),
      ...(await this.leaderboards.seasonBoard(ended, 1, 'ephemeral')),
    });
    if (closing === 'manual' || !ended.autoRenew) {
      return null;
    }
    const { season: next, enrolled } = await this.seasons.renew(ended);
    await this.channel.send({
      embeds: [
        seasonSummaryEmbed(next, `🚀 Saison ${next.number} lancée !`).setDescription(
          `${enrolled} joueur(s) repartent de zéro. Que la meilleure grimpe gagne !`,
        ),
      ],
    });
    return next;
  }

  async closeSideEvent(event: SideEvent): Promise<SideEvent> {
    const ended = await this.sideEvents.close(event);
    const [winner] = await this.standings.forSideEvent(ended.id);
    const congratulations = winner ? ` Bravo à <@${winner.discordId}> 🎉` : '';
    await this.channel.send({
      content: `🏁 Fin de l'évènement **${ended.name}** !${congratulations}`,
      ...(await this.leaderboards.sideEventBoard(ended, 1, 'ephemeral')),
    });
    return ended;
  }

  private async seasonWinnerAnnouncement(season: Season): Promise<string> {
    const winners = (await this.standings.forSeason(season.id)).filter((row) => row.place === 1);
    const headline = `🏁 **Fin de la saison ${season.number} !**`;
    if (winners.length === 0) {
      return headline;
    }
    return `${headline} Victoire de ${winners.map((row) => `<@${row.discordId}>`).join(', ')} 🎉`;
  }
}
