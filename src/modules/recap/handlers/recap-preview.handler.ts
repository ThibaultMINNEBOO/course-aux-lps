import { Ctx, SlashCommandHandler, UseGuards } from '@spraxium/common';
import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { RecapCommand } from '../commands/recap.command';
import { RecapService } from '../recap.service';

@SlashCommandHandler(RecapCommand, { sub: 'apercu' })
@UseGuards(...MODERATOR_GUARDS)
export class RecapPreviewHandler {
  constructor(private readonly recaps: RecapService) {}

  async handle(@Ctx() interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply(await this.recaps.preview());
  }
}
