import { Injectable } from '@spraxium/common';
import { entryGames, entryScore } from '../competition/entry-progress';
import { DatabaseService } from '../database/database.service';
import { formatRank } from '../riot/rank';
import { type Rankable, type Ranked, rankStandings } from './standings';

export interface SeasonStandingRow extends Rankable {
  entryId: string;
  discordId: string;
  dailyDelta: number;
  rankLabel: string;
  wins: number;
  losses: number;
}

export interface SideEventStandingRow extends Rankable {
  discordId: string;
}

function sumAmounts(adjustments: ReadonlyArray<{ amount: number }>): number {
  return adjustments.reduce((total, adjustment) => total + adjustment.amount, 0);
}

@Injectable()
export class StandingsService {
  constructor(private readonly db: DatabaseService) {}

  async forSeason(seasonId: string): Promise<Array<Ranked<SeasonStandingRow>>> {
    const entries = await this.db.seasonEntry.findMany({
      where: { seasonId, active: true },
      include: {
        player: true,
        adjustments: { select: { amount: true } },
        snapshots: { orderBy: { takenAt: 'desc' }, take: 1 },
      },
    });
    return rankStandings(
      entries.map((entry) => {
        const score = entryScore(entry, sumAmounts(entry.adjustments));
        const games = entryGames(entry);
        const ranked =
          entry.currentTier && entry.currentDivision && entry.currentLeaguePoints !== null
            ? { tier: entry.currentTier, rank: entry.currentDivision, leaguePoints: entry.currentLeaguePoints }
            : null;
        return {
          entryId: entry.id,
          name: entry.player.gameName,
          discordId: entry.player.discordId,
          score,
          dailyDelta: score - (entry.snapshots[0]?.score ?? 0),
          rankLabel: formatRank(ranked),
          wins: games.wins,
          losses: games.losses,
        };
      }),
    );
  }

  async forSideEvent(sideEventId: string): Promise<Array<Ranked<SideEventStandingRow>>> {
    const entries = await this.db.sideEventEntry.findMany({
      where: { sideEventId, active: true },
      include: { player: true, adjustments: { select: { amount: true } } },
    });
    return rankStandings(
      entries.map((entry) => ({
        name: entry.player.gameName,
        discordId: entry.player.discordId,
        score: sumAmounts(entry.adjustments),
      })),
    );
  }
}
