import { Ctx, SlashCommandHandler, SlashUserOption, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { PlayerCommand } from '../commands/player.command';
import { enrollmentLine, playerLabel, successEmbed } from '../player-messages';
import { PlayerService } from '../player.service';

@SlashCommandHandler(PlayerCommand, { sub: 'debannir' })
@UseGuards(...MODERATOR_GUARDS)
export class UnbanPlayerHandler {
  constructor(private readonly players: PlayerService) {}

  async handle(@Ctx() interaction: ChatInputCommandInteraction, @SlashUserOption('membre') member: User): Promise<void> {
    await interaction.deferReply();
    const { player, season } = await this.players.unban(member.id);
    await interaction.editReply({
      embeds: [successEmbed(`${playerLabel(player)} n'est plus banni et repart de zéro.\n${enrollmentLine(season)}`)],
    });
  }
}
