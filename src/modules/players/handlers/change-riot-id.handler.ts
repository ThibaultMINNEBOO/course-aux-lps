import { Ctx, SlashCommandHandler, SlashStringOption, SlashUserOption, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { PlayerCommand } from '../commands/player.command';
import { playerLabel, successEmbed } from '../player-messages';
import { PlayerService } from '../player.service';

@SlashCommandHandler(PlayerCommand, { sub: 'tag' })
@UseGuards(...MODERATOR_GUARDS)
export class ChangeRiotIdHandler {
  constructor(private readonly players: PlayerService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashUserOption('membre') member: User,
    @SlashStringOption('riot_id') riotId: string,
  ): Promise<void> {
    await interaction.deferReply();
    const { player, accountSwitched } = await this.players.changeRiotId(member.id, riotId);
    const detail = accountSwitched
      ? 'Nouveau compte détecté : les LP déjà gagnés sont conservés et la progression reprend depuis le rang de ce compte.'
      : 'Même compte Riot : seul le nom affiché change.';
    await interaction.editReply({ embeds: [successEmbed(`Riot ID mis à jour pour ${playerLabel(player)}.\n${detail}`)] });
  }
}
