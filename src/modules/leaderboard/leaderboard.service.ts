import { Injectable } from '@spraxium/common';
import { ButtonService, EmbedService } from '@spraxium/components';
import { type ActionRowBuilder, type ButtonBuilder, type EmbedBuilder, time } from 'discord.js';
import type { Season, SideEvent } from '../../generated/prisma/client';
import { BRAND_COLORS } from '../../shared/brand';
import { DomainException } from '../../shared/domain.exception';
import { DatabaseService } from '../database/database.service';
import { type Page, paginate } from '../scoring/standings';
import { StandingsService } from '../scoring/standings.service';
import { SeasonService } from '../seasons/season.service';
import { seasonProgress } from '../seasons/season-period';
import { boardPageLinks } from './board-navigation';
import { type BoardOpening, BoardPageButton, type BoardTarget } from './components/board-page.button';
import { StandingsEmbed, type StandingsEmbedData } from './components/standings.embed';
import { formatRows, formatSeasonRow, formatSideEventRow } from './standings-format';

export interface BoardMessage {
  embeds: Array<EmbedBuilder>;
  components: Array<ActionRowBuilder<ButtonBuilder>>;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly standings: StandingsService,
    private readonly seasons: SeasonService,
    private readonly embeds: EmbedService,
    private readonly buttons: ButtonService,
  ) {}

  async currentSeasonBoard(page: number, opening: BoardOpening): Promise<BoardMessage> {
    const season = (await this.seasons.findActive()) ?? (await this.seasons.findLatestEnded());
    if (!season) {
      throw new DomainException("Aucune saison n'a encore été lancée.");
    }
    return this.seasonBoard(season, page, opening);
  }

  async board(target: BoardTarget, page: number, opening: BoardOpening): Promise<BoardMessage> {
    if (target.kind === 'season') {
      const season = await this.db.season.findUnique({ where: { id: target.id } });
      if (!season) {
        throw new DomainException('Cette saison est introuvable.');
      }
      return this.seasonBoard(season, page, opening);
    }
    const event = await this.db.sideEvent.findUnique({ where: { id: target.id } });
    if (!event) {
      throw new DomainException('Cet évènement est introuvable.');
    }
    return this.sideEventBoard(event, page, opening);
  }

  async seasonBoard(season: Season, page: number, opening: BoardOpening): Promise<BoardMessage> {
    const rows = paginate(await this.standings.forSeason(season.id), page);
    const active = season.status === 'ACTIVE';
    const header = active ? this.activeSeasonHeader(season) : `Saison terminée ${time(season.endsAt, 'D')}`;
    return this.compose({ kind: 'season', id: season.id }, rows, opening, {
      title: active ? `🏆 Course aux LP — Saison ${season.number}` : `🏁 Saison ${season.number} — Classement final`,
      description: `${header}\n\n${formatRows(rows.items, (row) => formatSeasonRow(row, active))}`,
      color: active ? BRAND_COLORS.primary : BRAND_COLORS.gold,
      footer: this.pageFooter(rows),
    });
  }

  async sideEventBoard(event: SideEvent, page: number, opening: BoardOpening): Promise<BoardMessage> {
    const rows = paginate(await this.standings.forSideEvent(event.id), page);
    const active = event.status === 'ACTIVE';
    const header = [event.description, active && event.endsAt ? `Fin ${time(event.endsAt, 'R')}` : null]
      .filter(Boolean)
      .join('\n');
    return this.compose({ kind: 'event', id: event.id }, rows, opening, {
      title: active ? `🎯 ${event.name}` : `🏁 ${event.name} — Classement final`,
      description: [header, formatRows(rows.items, formatSideEventRow)].filter(Boolean).join('\n\n'),
      color: active ? BRAND_COLORS.primary : BRAND_COLORS.gold,
      footer: this.pageFooter(rows),
    });
  }

  async navigation(
    target: BoardTarget,
    page: number,
    totalPages: number,
    opening: BoardOpening,
  ): Promise<Array<ActionRowBuilder<ButtonBuilder>>> {
    if (totalPages <= 1) {
      return [];
    }
    const [rows] = await this.buttons.buildDynamic(BoardPageButton, boardPageLinks(target, page, totalPages, opening));
    return rows;
  }

  buildEmbed(data: StandingsEmbedData): EmbedBuilder {
    return this.embeds.build(StandingsEmbed, data);
  }

  private async compose<T>(
    target: BoardTarget,
    rows: Page<T>,
    opening: BoardOpening,
    data: StandingsEmbedData,
  ): Promise<BoardMessage> {
    return {
      embeds: [this.buildEmbed(data)],
      components: await this.navigation(target, rows.page, rows.totalPages, opening),
    };
  }

  private activeSeasonHeader(season: Season): string {
    const { day, totalDays } = seasonProgress(season, new Date());
    return `Jour ${day}/${totalDays} · fin ${time(season.endsAt, 'R')}`;
  }

  private pageFooter(rows: Page<unknown>): string {
    return `Page ${rows.page}/${rows.totalPages}`;
  }
}
