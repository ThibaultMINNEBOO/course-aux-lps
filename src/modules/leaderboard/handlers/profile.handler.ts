import { Ctx, SlashCommandHandler, SlashUserOption, UseGuards } from '@spraxium/common';
import { GuildOnly } from '@spraxium/core';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { ProfileCommand } from '../commands/profile.command';
import { ProfileService } from '../profile.service';

@SlashCommandHandler(ProfileCommand)
@UseGuards(GuildOnly)
export class ProfileHandler {
  constructor(private readonly profiles: ProfileService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashUserOption('membre') member: User | null,
  ): Promise<void> {
    await interaction.reply({ embeds: [await this.profiles.profile(member ?? interaction.user)] });
  }
}
