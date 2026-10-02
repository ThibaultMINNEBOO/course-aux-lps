import { Ctx, SlashCommandHandler, UseGuards } from '@spraxium/common';
import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags, time } from 'discord.js';
import { BRAND_COLORS } from '../../../shared/brand';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { SideEventCommand } from '../commands/side-event.command';
import { SideEventService } from '../side-event.service';

@SlashCommandHandler(SideEventCommand, { sub: 'liste' })
@UseGuards(...MODERATOR_GUARDS)
export class ListSideEventsHandler {
  constructor(private readonly sideEvents: SideEventService) {}

  async handle(@Ctx() interaction: ChatInputCommandInteraction): Promise<void> {
    const events = await this.sideEvents.findActive();
    const lines = events.map((event) => {
      const closing = event.endsAt ? `fin ${time(event.endsAt, 'R')}` : 'sans date de fin';
      return `• **${event.name}** — ${closing}`;
    });
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.primary)
      .setTitle('🎯 Évènements annexes en cours')
      .setDescription(lines.length > 0 ? lines.join('\n') : 'Aucun évènement en cours.');
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
