import { Ctx, SlashCommandHandler } from '@spraxium/common';
import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { MODERATOR_PERMISSIONS } from '../../../shared/moderation';
import { SeasonService } from '../../seasons/season.service';
import { HelpCommand } from '../commands/help.command';
import { helpEmbed } from '../help-embed';

@SlashCommandHandler(HelpCommand)
export class HelpHandler {
  constructor(private readonly seasons: SeasonService) {}

  async handle(@Ctx() interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = helpEmbed({
      isModerator: interaction.memberPermissions?.has(MODERATOR_PERMISSIONS) ?? false,
      season: await this.seasons.findActive(),
      now: new Date(),
    });
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
