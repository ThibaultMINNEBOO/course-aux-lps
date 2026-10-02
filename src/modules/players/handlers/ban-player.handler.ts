import { Ctx, SlashCommandHandler, SlashStringOption, SlashUserOption, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { successEmbed } from '../../../shared/messages';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { PlayerCommand } from '../commands/player.command';
import { PlayerService } from '../player.service';
import { playerLabel } from '../player-messages';

@SlashCommandHandler(PlayerCommand, { sub: 'bannir' })
@UseGuards(...MODERATOR_GUARDS)
export class BanPlayerHandler {
  constructor(private readonly players: PlayerService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashUserOption('membre') member: User,
    @SlashStringOption('raison') reason: string,
  ): Promise<void> {
    const player = await this.players.ban(member.id, reason);
    await interaction.reply({
      embeds: [
        successEmbed(
          `${playerLabel(player)} est banni de la compétition et retiré des classements en cours.\nRaison : ${reason}`,
        ),
      ],
    });
  }
}
