import { defineExceptionLayout, SpraxiumException } from '@spraxium/core';
import { EmbedBuilder } from 'discord.js';
import { BRAND_COLORS } from './brand';

const DomainExceptionLayout = defineExceptionLayout((exception) => ({
  embeds: [new EmbedBuilder().setColor(BRAND_COLORS.danger).setDescription(`❌ ${exception.message}`)],
  ephemeral: true,
}));

export class DomainException extends SpraxiumException {
  constructor(message: string) {
    super({ code: 'DOMAIN_RULE', message, layout: DomainExceptionLayout });
    this.name = 'DomainException';
  }
}
