import { EmbedBuilder, time } from 'discord.js';
import type { Season, SeasonFrequency } from '../../generated/prisma/client';
import { BRAND_COLORS } from '../../shared/brand';
import { seasonProgress } from './season-period';

export const FREQUENCY_LABELS: Record<SeasonFrequency, string> = {
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuelle',
  CUSTOM: 'Personnalisée',
};

export function seasonSummaryEmbed(season: Season, title: string, now = new Date()): EmbedBuilder {
  const { day, totalDays } = seasonProgress(season, now);
  return new EmbedBuilder()
    .setColor(BRAND_COLORS.primary)
    .setTitle(title)
    .addFields(
      { name: 'Format', value: FREQUENCY_LABELS[season.frequency], inline: true },
      { name: 'Progression', value: `Jour ${day}/${totalDays}`, inline: true },
      { name: 'Renouvellement', value: season.autoRenew ? 'Automatique' : 'Désactivé', inline: true },
      { name: 'Début', value: time(season.startsAt, 'F'), inline: true },
      { name: 'Fin', value: `${time(season.endsAt, 'F')} (${time(season.endsAt, 'R')})`, inline: true },
    );
}
