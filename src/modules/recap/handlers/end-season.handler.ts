import { Ctx, SlashCommandHandler, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction } from 'discord.js';
import { successEmbed } from '../../../shared/messages';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { SeasonCommand } from '../../seasons/commands/season.command';
import { SeasonService } from '../../seasons/season.service';
import { CompetitionClosingService } from '../competition-closing.service';

@SlashCommandHandler(SeasonCommand, { sub: 'terminer' })
@UseGuards(...MODERATOR_GUARDS)
export class EndSeasonHandler {
  constructor(
    private readonly seasons: SeasonService,
    private readonly closing: CompetitionClosingService,
  ) {}

  async handle(@Ctx() interaction: ChatInputCommandInteraction): Promise<void> {
    const season = await this.seasons.requireActive();
    await interaction.deferReply();
    await this.closing.closeSeason(season, 'manual');
    await interaction.editReply({
      embeds: [
        successEmbed(
          `Saison ${season.number} terminée, classement final publié.\nLance la suivante avec \`/saison creer\`.`,
        ),
      ],
    });
  }
}
