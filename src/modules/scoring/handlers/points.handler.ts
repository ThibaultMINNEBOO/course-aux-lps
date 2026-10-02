import {
  Ctx,
  SlashCommandHandler,
  SlashIntegerOption,
  SlashStringOption,
  SlashUserOption,
  UseGuards,
} from '@spraxium/common';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { DomainException } from '../../../shared/domain.exception';
import { signed } from '../../../shared/format';
import { successEmbed } from '../../../shared/messages';
import { MODERATOR_GUARDS } from '../../../shared/moderation';
import { PointsCommand } from '../commands/points.command';
import { type AdjustmentInput, ScoreAdjustmentService } from '../score-adjustment.service';

@SlashCommandHandler(PointsCommand)
@UseGuards(...MODERATOR_GUARDS)
export class PointsHandler {
  constructor(private readonly adjustments: ScoreAdjustmentService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashUserOption('membre') member: User,
    @SlashIntegerOption('montant') amount: number,
    @SlashStringOption('raison') reason: string,
    @SlashStringOption('evenement') sideEventId: string | null,
  ): Promise<void> {
    if (amount === 0) {
      throw new DomainException('Le montant doit être différent de zéro.');
    }
    const target = await this.apply(sideEventId, {
      discordId: member.id,
      amount,
      reason,
      moderatorId: interaction.user.id,
    });
    await interaction.reply({
      embeds: [successEmbed(`**${signed(amount)} pts** pour <@${member.id}> sur ${target}.\nRaison : ${reason}`)],
    });
  }

  private async apply(sideEventId: string | null, input: AdjustmentInput): Promise<string> {
    if (!sideEventId) {
      await this.adjustments.adjustSeason(input);
      return 'la saison en cours';
    }
    const event = await this.adjustments.adjustSideEvent(sideEventId, input);
    return `l'évènement **${event.name}**`;
  }
}
