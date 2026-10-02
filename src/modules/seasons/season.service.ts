import { Injectable } from '@spraxium/common';
import type { Season, SeasonFrequency } from '../../generated/prisma/client';
import { DomainException } from '../../shared/domain.exception';
import type { RankedSnapshot } from '../competition/entry-progress';
import { ParticipationService } from '../competition/participation.service';
import { DatabaseService } from '../database/database.service';
import { RiotApiClient } from '../riot/riot-api.client';
import { addDays, computeSeasonEnd, seasonLengthInDays } from './season-period';

export interface CreateSeasonInput {
  frequency: SeasonFrequency;
  customEnd?: Date;
  autoRenew: boolean;
}

export interface SeasonLaunch {
  season: Season;
  enrolled: number;
}

@Injectable()
export class SeasonService {
  constructor(
    private readonly db: DatabaseService,
    private readonly riot: RiotApiClient,
    private readonly participation: ParticipationService,
  ) {}

  findActive(): Promise<Season | null> {
    return this.participation.findActiveSeason();
  }

  async requireActive(): Promise<Season> {
    const season = await this.findActive();
    if (!season) {
      throw new DomainException("Aucune saison n'est en cours.");
    }
    return season;
  }

  findLatestEnded(): Promise<Season | null> {
    return this.db.season.findFirst({ where: { status: 'ENDED' }, orderBy: { number: 'desc' } });
  }

  async create(input: CreateSeasonInput, now = new Date()): Promise<SeasonLaunch> {
    if (await this.findActive()) {
      throw new DomainException("Une saison est déjà en cours. Termine-la avant d'en lancer une nouvelle.");
    }
    if (input.frequency === 'CUSTOM' && !input.customEnd) {
      throw new DomainException('Une saison personnalisée nécessite une date de fin (`fin`).');
    }
    const endsAt = computeSeasonEnd(now, input.frequency, input.customEnd);
    if (endsAt.getTime() <= now.getTime()) {
      throw new DomainException('La date de fin doit être dans le futur.');
    }
    const season = await this.db.season.create({
      data: {
        number: await this.nextNumber(),
        frequency: input.frequency,
        startsAt: now,
        endsAt,
        autoRenew: input.autoRenew,
      },
    });
    const enrolled = await this.enrollActivePlayers(season, new Map());
    return { season, enrolled };
  }

  close(season: Season): Promise<Season> {
    return this.db.season.update({ where: { id: season.id }, data: { status: 'ENDED' } });
  }

  closeNow(season: Season, now = new Date()): Promise<Season> {
    return this.db.season.update({ where: { id: season.id }, data: { status: 'ENDED', endsAt: now } });
  }

  async renew(previous: Season): Promise<SeasonLaunch> {
    const startsAt = previous.endsAt;
    const endsAt =
      previous.frequency === 'CUSTOM'
        ? computeSeasonEnd(startsAt, 'CUSTOM', addDays(startsAt, seasonLengthInDays(previous)))
        : computeSeasonEnd(startsAt, previous.frequency);
    const season = await this.db.season.create({
      data: {
        number: previous.number + 1,
        frequency: previous.frequency,
        startsAt,
        endsAt,
        autoRenew: previous.autoRenew,
      },
    });
    const enrolled = await this.enrollActivePlayers(season, await this.lastKnownSnapshots(previous));
    return { season, enrolled };
  }

  async setAutoRenew(autoRenew: boolean): Promise<Season> {
    const season = await this.requireActive();
    return this.db.season.update({ where: { id: season.id }, data: { autoRenew } });
  }

  private async enrollActivePlayers(
    season: Season,
    knownSnapshots: Map<string, RankedSnapshot | null>,
  ): Promise<number> {
    const players = await this.db.player.findMany({ where: { status: 'ACTIVE' } });
    for (const player of players) {
      const snapshot = knownSnapshots.has(player.id)
        ? (knownSnapshots.get(player.id) ?? null)
        : await this.riot.findSoloQueueEntry(player.puuid);
      await this.participation.enroll(season.id, player.id, snapshot);
    }
    return players.length;
  }

  private async lastKnownSnapshots(season: Season): Promise<Map<string, RankedSnapshot | null>> {
    const entries = await this.db.seasonEntry.findMany({ where: { seasonId: season.id, active: true } });
    return new Map(
      entries.map((entry) => [
        entry.playerId,
        entry.currentTier && entry.currentDivision && entry.currentLeaguePoints !== null
          ? {
              tier: entry.currentTier,
              rank: entry.currentDivision,
              leaguePoints: entry.currentLeaguePoints,
              wins: entry.wins,
              losses: entry.losses,
            }
          : null,
      ]),
    );
  }

  private async nextNumber(): Promise<number> {
    const latest = await this.db.season.findFirst({ orderBy: { number: 'desc' } });
    return (latest?.number ?? 0) + 1;
  }
}
