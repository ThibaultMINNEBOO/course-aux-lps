import { Ctx, SlashCommandHandler, SlashStringOption, SlashUserOption, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { PlayerCommand } from '../commands/player.command';
import { enrollmentLine, playerLabel, successEmbed } from '../player-messages';
import { PlayerService } from '../player.service';

@SlashCommandHandler(PlayerCommand, { sub: 'inscrire' })
@UseGuards(...MODERATOR_GUARDS)
export class RegisterPlayerHandler {
  constructor(private readonly players: PlayerService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashUserOption('membre') member: User,
    @SlashStringOption('riot_id') riotId: string,
  ): Promise<void> {
    await interaction.deferReply();
    const { player, season } = await this.players.register(member.id, riotId);
    await interaction.editReply({
      embeds: [successEmbed(`${playerLabel(player)} est inscrit à la course aux LP.\n${enrollmentLine(season)}`)],
    });
  }
}
