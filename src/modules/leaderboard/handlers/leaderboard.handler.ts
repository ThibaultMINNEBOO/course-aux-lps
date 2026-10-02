import { Ctx, SlashCommandHandler, SlashStringOption, UseGuards } from '@spraxium/common';
import { GuildOnly } from '@spraxium/core';
import type { ChatInputCommandInteraction } from 'discord.js';
import { LeaderboardCommand } from '../commands/leaderboard.command';
import { LeaderboardService } from '../leaderboard.service';

@SlashCommandHandler(LeaderboardCommand)
@UseGuards(GuildOnly)
export class LeaderboardHandler {
  constructor(private readonly leaderboards: LeaderboardService) {}

  async handle(
    @Ctx() interaction: ChatInputCommandInteraction,
    @SlashStringOption('evenement') sideEventId: string | null,
  ): Promise<void> {
    const board = sideEventId
      ? await this.leaderboards.board({ kind: 'event', id: sideEventId }, 1, 'update')
      : await this.leaderboards.currentSeasonBoard(1, 'update');
    await interaction.reply(board);
  }
}
