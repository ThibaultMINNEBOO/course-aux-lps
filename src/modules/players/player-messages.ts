import { EmbedBuilder } from 'discord.js';
import type { Season } from '../../generated/prisma/client';
import { BRAND_COLORS } from '../../shared/brand';
import { formatRiotId } from '../riot/riot-id';

interface PlayerIdentity {
  discordId: string;
  gameName: string;
  tagLine: string;
}

export function successEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(BRAND_COLORS.success).setDescription(`✅ ${description}`);
}

export function enrollmentLine(season: Season | null): string {
  return season
    ? `Il participe à la **saison ${season.number}** à partir de son rang actuel.`
    : "Aucune saison n'est en cours : il sera inclus automatiquement dans la prochaine.";
}

export function playerLabel(player: PlayerIdentity): string {
  return `<@${player.discordId}> (**${formatRiotId(player)}**)`;
}
