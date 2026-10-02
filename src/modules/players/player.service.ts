import { Injectable } from '@spraxium/common';
import type { Player, Season } from '../../generated/prisma/client';
import { DomainException } from '../../shared/domain.exception';
import { ParticipationService } from '../competition/participation.service';
import { DatabaseService } from '../database/database.service';
import type { RiotAccount } from '../riot/riot.types';
import { RiotApiClient } from '../riot/riot-api.client';
import { formatRiotId, parseRiotId } from '../riot/riot-id';

export interface RegistrationResult {
  player: Player;
  season: Season | null;
}

export interface RiotIdChangeResult {
  player: Player;
  accountSwitched: boolean;
}

@Injectable()
export class PlayerService {
  constructor(
    private readonly db: DatabaseService,
    private readonly riot: RiotApiClient,
    private readonly participation: ParticipationService,
  ) {}

  findByDiscordId(discordId: string): Promise<Player | null> {
    return this.db.player.findUnique({ where: { discordId } });
  }

  async register(discordId: string, riotIdInput: string): Promise<RegistrationResult> {
    const existing = await this.findByDiscordId(discordId);
    if (existing?.status === 'ACTIVE') {
      throw new DomainException('Ce membre est déjà inscrit à la compétition.');
    }
    if (existing?.status === 'BANNED') {
      throw new DomainException('Ce membre est banni de la compétition. Débannis-le avant de le réinscrire.');
    }
    const account = await this.resolveAccount(riotIdInput);
    await this.assertAccountAvailable(account.puuid, discordId);

    const identity = { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine };
    const player = await this.db.player.upsert({
      where: { discordId },
      create: { discordId, ...identity },
      update: { ...identity, status: 'ACTIVE', banReason: null },
    });
    const season = await this.enroll(player);
    return { player, season };
  }

  async changeRiotId(discordId: string, riotIdInput: string): Promise<RiotIdChangeResult> {
    const player = await this.requireActive(discordId);
    const account = await this.resolveAccount(riotIdInput);
    const accountSwitched = account.puuid !== player.puuid;
    if (accountSwitched) {
      await this.assertAccountAvailable(account.puuid, discordId);
    }
    const updated = await this.db.player.update({
      where: { id: player.id },
      data: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine },
    });
    if (accountSwitched) {
      await this.participation.switchAccount(player.id, await this.riot.findSoloQueueEntry(account.puuid));
    }
    return { player: updated, accountSwitched };
  }

  async ban(discordId: string, reason: string): Promise<Player> {
    const player = await this.findByDiscordId(discordId);
    if (!player) {
      throw new DomainException("Ce membre n'est pas inscrit à la compétition.");
    }
    if (player.status === 'BANNED') {
      throw new DomainException('Ce membre est déjà banni de la compétition.');
    }
    await this.participation.withdraw(player.id);
    return this.db.player.update({ where: { id: player.id }, data: { status: 'BANNED', banReason: reason } });
  }

  async unban(discordId: string): Promise<RegistrationResult> {
    const player = await this.findByDiscordId(discordId);
    if (player?.status !== 'BANNED') {
      throw new DomainException("Ce membre n'est pas banni de la compétition.");
    }
    const restored = await this.db.player.update({
      where: { id: player.id },
      data: { status: 'ACTIVE', banReason: null },
    });
    const season = await this.enroll(restored);
    return { player: restored, season };
  }

  async markAsLeft(discordId: string): Promise<boolean> {
    const player = await this.findByDiscordId(discordId);
    if (player?.status !== 'ACTIVE') {
      return false;
    }
    await this.participation.withdraw(player.id);
    await this.db.player.update({ where: { id: player.id }, data: { status: 'LEFT' } });
    return true;
  }

  async markMissingMembersAsLeft(memberIds: ReadonlySet<string>): Promise<number> {
    const players = await this.db.player.findMany({ where: { status: 'ACTIVE' } });
    const missing = players.filter((player) => !memberIds.has(player.discordId));
    for (const player of missing) {
      await this.markAsLeft(player.discordId);
    }
    return missing.length;
  }

  private async enroll(player: Player): Promise<Season | null> {
    const snapshot = await this.riot.findSoloQueueEntry(player.puuid);
    return this.participation.enrollInActiveSeason(player.id, snapshot);
  }

  private async requireActive(discordId: string): Promise<Player> {
    const player = await this.findByDiscordId(discordId);
    if (player?.status !== 'ACTIVE') {
      throw new DomainException("Ce membre n'est pas inscrit à la compétition.");
    }
    return player;
  }

  private async resolveAccount(riotIdInput: string): Promise<RiotAccount> {
    const riotId = parseRiotId(riotIdInput);
    if (!riotId) {
      throw new DomainException('Riot ID invalide. Format attendu : `Pseudo#TAG`.');
    }
    const account = await this.riot.findAccountByRiotId(riotId);
    if (!account) {
      throw new DomainException(`Aucun compte Riot trouvé pour **${formatRiotId(riotId)}**.`);
    }
    return account;
  }

  private async assertAccountAvailable(puuid: string, discordId: string): Promise<void> {
    const owner = await this.db.player.findFirst({
      where: { puuid, status: { not: 'LEFT' }, discordId: { not: discordId } },
    });
    if (owner) {
      throw new DomainException(`Ce compte Riot est déjà associé à <@${owner.discordId}>.`);
    }
  }
}
