import { Injectable } from '@spraxium/common';
import type { Player, ScoreAdjustment, SideEvent } from '../../generated/prisma/client';
import { DomainException } from '../../shared/domain.exception';
import { ParticipationService } from '../competition/participation.service';
import { DatabaseService } from '../database/database.service';
import { SideEventService } from '../side-events/side-event.service';

export interface AdjustmentInput {
  discordId: string;
  amount: number;
  reason: string;
  moderatorId: string;
}

@Injectable()
export class ScoreAdjustmentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly participation: ParticipationService,
    private readonly sideEvents: SideEventService,
  ) {}

  async adjustSeason(input: AdjustmentInput): Promise<ScoreAdjustment> {
    const player = await this.requireActivePlayer(input.discordId);
    const entry = await this.participation.findActiveSeasonEntry(player.id);
    if (!entry) {
      throw new DomainException('Ce joueur ne participe à aucune saison en cours.');
    }
    return this.db.scoreAdjustment.create({
      data: { amount: input.amount, reason: input.reason, moderatorId: input.moderatorId, seasonEntryId: entry.id },
    });
  }

  async adjustSideEvent(sideEventId: string, input: AdjustmentInput): Promise<SideEvent> {
    const event = await this.sideEvents.requireActive(sideEventId);
    const player = await this.requireActivePlayer(input.discordId);
    const entry =
      (await this.db.sideEventEntry.findFirst({
        where: { sideEventId: event.id, playerId: player.id, active: true },
      })) ?? (await this.db.sideEventEntry.create({ data: { sideEventId: event.id, playerId: player.id } }));
    await this.db.scoreAdjustment.create({
      data: { amount: input.amount, reason: input.reason, moderatorId: input.moderatorId, sideEventEntryId: entry.id },
    });
    return event;
  }

  private async requireActivePlayer(discordId: string): Promise<Player> {
    const player = await this.db.player.findUnique({ where: { discordId } });
    if (player?.status !== 'ACTIVE') {
      throw new DomainException("Ce membre n'est pas inscrit à la compétition.");
    }
    return player;
  }
}
