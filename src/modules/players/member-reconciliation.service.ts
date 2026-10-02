import { Injectable, type SpraxiumOnReady } from '@spraxium/common';
import { Logger } from '@spraxium/logger';
import type { Client } from 'discord.js';
import { AppEnv } from '../../app.env';
import { PlayerService } from './player.service';

@Injectable()
export class MemberReconciliationService implements SpraxiumOnReady {
  private readonly logger = new Logger(MemberReconciliationService.name);

  constructor(
    private readonly players: PlayerService,
    private readonly env: AppEnv,
  ) {}

  async onReady(client: Client<true>): Promise<void> {
    const guild = await client.guilds.fetch(this.env.guildId);
    const members = await guild.members.fetch();
    const removed = await this.players.markMissingMembersAsLeft(new Set(members.keys()));
    if (removed > 0) {
      this.logger.info(`${removed} player(s) left the server while offline and were withdrawn`);
    }
  }
}
