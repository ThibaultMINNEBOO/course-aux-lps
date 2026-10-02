import { Ctx, SlashCommandHandler, SlashStringOption, UseGuards } from '@spraxium/common';
import type { ChatInputCommandInteraction } from 'discord.js';
import { successEmbed } from '../../../shared/messages';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { SideEventCommand } from '../../side-events/commands/side-event.command';
import { SideEventService } from '../../side-events/side-event.service';
import { CompetitionClosingService } from '../competition-closing.service';

@SlashCommandHandler(SideEventCommand, { sub: 'terminer' })
@UseGuards(...MODERATOR_GUARDS)
export class EndSideEventHandler {
  constructor(
    private readonly sideEvents: SideEventService,
    private readonly closing: CompetitionClosingService,
  ) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashStringOption('evenement') sideEventId: string,
  ): Promise<void> {
    const event = await this.sideEvents.requireActive(sideEventId);
    await interaction.deferReply();
    await this.closing.closeSideEvent(event);
    await interaction.editReply({
      embeds: [successEmbed(`Évènement **${event.name}** terminé, classement final publié.`)],
    });
  }
}
