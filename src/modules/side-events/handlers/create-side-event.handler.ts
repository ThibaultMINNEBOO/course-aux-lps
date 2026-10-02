import { Ctx, SlashCommandHandler, SlashStringOption, UseGuards } from '@spraxium/common';
import { type ChatInputCommandInteraction, time } from 'discord.js';
import { DomainException } from '../../../shared/domain.exception';
import { successEmbed } from '../../../shared/messages';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { parseLocalDate } from '../../seasons/season-period';
import { SideEventCommand } from '../commands/side-event.command';
import { SideEventService } from '../side-event.service';

@SlashCommandHandler(SideEventCommand, { sub: 'creer' })
@UseGuards(...MODERATOR_GUARDS)
export class CreateSideEventHandler {
  constructor(private readonly sideEvents: SideEventService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashStringOption('nom') name: string,
    @SlashStringOption('description') description: string | null,
    @SlashStringOption('fin') endInput: string | null,
  ): Promise<void> {
    const endsOn = endInput ? parseLocalDate(endInput) : undefined;
    if (endsOn === null) {
      throw new DomainException('Date de fin invalide. Format attendu : `JJ/MM/AAAA`.');
    }
    const event = await this.sideEvents.create({ name, description: description ?? undefined, endsOn });
    const closing = event.endsAt
      ? `Clôture automatique ${time(event.endsAt, 'F')}.`
      : 'Clôture manuelle avec `/evenement terminer`.';
    await interaction.reply({
      embeds: [successEmbed(`Évènement **${event.name}** créé.\nAttribue des points avec \`/points\`. ${closing}`)],
    });
  }
}
