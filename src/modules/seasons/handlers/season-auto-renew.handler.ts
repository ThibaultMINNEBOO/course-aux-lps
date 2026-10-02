import { Ctx, SlashBooleanOption, SlashCommandHandler, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction } from 'discord.js';
import { successEmbed } from '../../../shared/messages';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { SeasonCommand } from '../commands/season.command';
import { SeasonService } from '../season.service';

@SlashCommandHandler(SeasonCommand, { sub: 'renouvellement' })
@UseGuards(...MODERATOR_GUARDS)
export class SeasonAutoRenewHandler {
  constructor(private readonly seasons: SeasonService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashBooleanOption('actif') enabled: boolean,
  ): Promise<void> {
    const season = await this.seasons.setAutoRenew(enabled);
    const state = enabled ? 'activé' : 'désactivé';
    await interaction.reply({
      embeds: [successEmbed(`Renouvellement automatique ${state} pour la saison ${season.number}.`)],
    });
  }
}
