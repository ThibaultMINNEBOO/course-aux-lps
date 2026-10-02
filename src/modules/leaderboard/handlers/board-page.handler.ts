import { Ctx, Injectable } from '@spraxium/common';
import { ButtonParams, DynamicButtonHandler } from '@spraxium/components';
import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { BoardPageButton, decodeBoardParams } from '../components/board-page.button';
import { LeaderboardService } from '../leaderboard.service';

@Injectable()
@DynamicButtonHandler(BoardPageButton)
export class BoardPageHandler {
  constructor(private readonly leaderboards: LeaderboardService) {}

  async handle(
    @Ctx() interaction: ButtonInteraction,
    @ButtonParams() params: Record<string, string | number | boolean>,
  ): Promise<void> {
    const { target, page, opening } = decodeBoardParams(params);
    if (opening === 'update') {
      await interaction.update(await this.leaderboards.board(target, page, 'update'));
      return;
    }
    await interaction.reply({
      ...(await this.leaderboards.board(target, page, 'update')),
      flags: MessageFlags.Ephemeral,
    });
  }
}
