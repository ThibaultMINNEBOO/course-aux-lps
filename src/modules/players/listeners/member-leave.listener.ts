import { Events, Listener, On } from '@spraxium/common';
import { Logger } from '@spraxium/logger';
import type { GuildMember, PartialGuildMember } from 'discord.js';
import { AppEnv } from '../../../app.env';
import { PlayerService } from '../player.service';

@Listener(Events.GuildMemberRemove)
export class MemberLeaveListener {
  private readonly logger = new Logger(MemberLeaveListener.name);

  constructor(
    private readonly players: PlayerService,
    private readonly env: AppEnv,
  ) {}

  @On()
  async onLeave(member: GuildMember | PartialGuildMember): Promise<void> {
    if (member.guild.id !== this.env.guildId) {
      return;
    }
    if (await this.players.markAsLeft(member.id)) {
      this.logger.info(`Player ${member.id} left the server and was withdrawn from the competition`);
    }
  }
}
