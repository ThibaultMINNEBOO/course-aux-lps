import { EmbedBuilder } from 'discord.js';
import { BRAND_COLORS } from './brand';

export function successEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(BRAND_COLORS.success).setDescription(`✅ ${description}`);
}
