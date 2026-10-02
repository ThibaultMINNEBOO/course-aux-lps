import { Injectable } from '@spraxium/common';
import { EmbedBuilder, type User } from 'discord.js';
import { BRAND_COLORS } from '../../shared/brand';
import { DomainException } from '../../shared/domain.exception';
import { placeLabel, signed } from '../../shared/format';
import { PlayerService } from '../players/player.service';
import { formatRiotId } from '../riot/riot-id';
import { StandingsService } from '../scoring/standings.service';
import { SeasonService } from '../seasons/season.service';
import { SideEventService } from '../side-events/side-event.service';

const STATUS_LABELS = { ACTIVE: 'Inscrit', BANNED: 'Banni', LEFT: 'A quitté le serveur' } as const;

@Injectable()
export class ProfileService {
  constructor(
    private readonly players: PlayerService,
    private readonly seasons: SeasonService,
    private readonly sideEvents: SideEventService,
    private readonly standings: StandingsService,
  ) {}

  async profile(user: User): Promise<EmbedBuilder> {
    const player = await this.players.findByDiscordId(user.id);
    if (!player) {
      throw new DomainException(`<@${user.id}> n'est pas inscrit à la compétition.`);
    }
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLORS.primary)
      .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
      .setTitle(formatRiotId(player))
      .addFields({ name: 'Statut', value: STATUS_LABELS[player.status], inline: true });

    const season = await this.seasons.findActive();
    if (season) {
      embed.addFields({ name: `Saison ${season.number}`, value: await this.seasonLine(season.id, user.id) });
    }
    const eventLines = await this.sideEventLines(user.id);
    if (eventLines.length > 0) {
      embed.addFields({ name: 'Évènements annexes', value: eventLines.join('\n') });
    }
    return embed;
  }

  private async seasonLine(seasonId: string, discordId: string): Promise<string> {
    const standings = await this.standings.forSeason(seasonId);
    const row = standings.find((candidate) => candidate.discordId === discordId);
    if (!row) {
      return 'Ne participe pas à cette saison.';
    }
    return [
      `${placeLabel(row.place)} sur ${standings.length} · **${signed(row.score)} LP** (${signed(row.dailyDelta)} aujourd'hui)`,
      `${row.rankLabel} · ${row.wins}V/${row.losses}D`,
    ].join('\n');
  }

  private async sideEventLines(discordId: string): Promise<Array<string>> {
    const lines: Array<string> = [];
    for (const event of await this.sideEvents.findActive()) {
      const standings = await this.standings.forSideEvent(event.id);
      const row = standings.find((candidate) => candidate.discordId === discordId);
      if (row) {
        lines.push(`**${event.name}** — ${placeLabel(row.place)} · ${signed(row.score)} pts`);
      }
    }
    return lines;
  }
}
