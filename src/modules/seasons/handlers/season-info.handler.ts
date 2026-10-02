import { Ctx, SlashCommandHandler, UseGuards } from '@spraxium/common';
import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { SeasonCommand } from '../commands/season.command';
import { SeasonService } from '../season.service';
import { seasonSummaryEmbed } from '../season-messages';

@SlashCommandHandler(SeasonCommand, { sub: 'infos' })
@UseGuards(...MODERATOR_GUARDS)
export class SeasonInfoHandler {
  constructor(private readonly seasons: SeasonService) {}

  async handle(@Ctx() interaction: ChatInputCommandInteraction): Promise<void> {
    const season = await this.seasons.requireActive();
    await interaction.reply({
      embeds: [seasonSummaryEmbed(season, `📅 Saison ${season.number}`)],
      flags: MessageFlags.Ephemeral,
    });
  }
}
