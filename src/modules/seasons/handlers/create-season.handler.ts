import { Ctx, SlashBooleanOption, SlashCommandHandler, SlashStringOption, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { SeasonFrequency } from '../../../generated/prisma/client';
import { DomainException } from '../../../shared/domain.exception';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { SeasonCommand } from '../commands/season.command';
import { SeasonService } from '../season.service';
import { seasonSummaryEmbed } from '../season-messages';
import { parseLocalDate } from '../season-period';

@SlashCommandHandler(SeasonCommand, { sub: 'creer' })
@UseGuards(...MODERATOR_GUARDS)
export class CreateSeasonHandler {
  constructor(private readonly seasons: SeasonService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashStringOption('frequence') frequency: SeasonFrequency,
    @SlashStringOption('fin') endInput: string | null,
    @SlashBooleanOption('renouvellement') autoRenew: boolean | null,
  ): Promise<void> {
    const customEnd = endInput ? parseLocalDate(endInput) : undefined;
    if (customEnd === null) {
      throw new DomainException('Date de fin invalide. Format attendu : `JJ/MM/AAAA`.');
    }
    await interaction.deferReply();
    const { season, enrolled } = await this.seasons.create({ frequency, customEnd, autoRenew: autoRenew ?? true });
    const embed = seasonSummaryEmbed(season, `🚀 Saison ${season.number} lancée !`).setDescription(
      `${enrolled} joueur(s) inscrit(s). Les LP sont comptés à partir de leur rang actuel.`,
    );
    await interaction.editReply({ embeds: [embed] });
  }
}
