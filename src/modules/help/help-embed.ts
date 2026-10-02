import { EmbedBuilder, time } from 'discord.js';
import type { Season } from '../../generated/prisma/client';
import { BRAND_COLORS } from '../../shared/brand';
import { seasonProgress } from '../seasons/season-period';

export interface HelpContext {
  isModerator: boolean;
  season: Season | null;
  now: Date;
}

const COMPETITION = [
  'Chaque joueur inscrit est suivi automatiquement en **Solo/Duo (EUW)**.',
  'Tous les soirs à **21h**, un récap est publié avec les progressions du jour et le classement de la saison.',
  'À la fin de la saison, le classement final est annoncé et une nouvelle saison démarre.',
  "L'inscription se fait auprès de la modération.",
].join('\n');

const SCORING = [
  '• Score = LP actuels − LP au début de la saison, promotions et rétrogradations comprises.',
  '• La modération peut ajouter ou retirer des points (bonus, malus).',
  "• Le « gain du jour » est l'évolution depuis le récap de la veille.",
  '• Des évènements annexes peuvent avoir leur propre classement à points.',
].join('\n');

const PUBLIC_COMMANDS = [
  '`/classement` — classement de la saison en cours',
  "`/classement evenement:` — classement d'un évènement annexe",
  "`/profil [membre]` — rang, score et progression d'un joueur",
  '`/aide` — affiche ce message',
].join('\n');

const MODERATION_PLAYERS = [
  '`/joueur inscrire membre riot_id` — inscrire un joueur (`Pseudo#TAG`)',
  '`/joueur tag membre riot_id` — changer son Riot ID',
  "`/joueur bannir membre raison` — l'exclure de la compétition",
  '`/joueur debannir membre` — le réintégrer (repart de zéro)',
  '`/saison creer frequence [fin] [renouvellement]` — lancer une saison',
  '`/saison terminer` — clôturer la saison maintenant',
  '`/saison renouvellement actif` — relance automatique on/off',
  '`/saison infos` — détails de la saison',
].join('\n');

const MODERATION_POINTS = [
  '`/points membre montant raison [evenement]` — ajouter ou retirer des points',
  '`/evenement creer nom [description] [fin]` — créer un évènement annexe',
  '`/evenement terminer evenement` — le clôturer',
  '`/evenement liste` — évènements en cours',
  '`/recap apercu` — prévisualiser le récap du jour',
].join('\n');

export function helpEmbed(context: HelpContext): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLORS.primary)
    .setTitle('📖 Course aux LP — Aide')
    .setDescription(COMPETITION)
    .addFields(seasonField(context.season, context.now))
    .addFields({ name: '📈 Calcul du score', value: SCORING }, { name: '🎮 Commandes', value: PUBLIC_COMMANDS });
  if (context.isModerator) {
    embed.addFields(
      { name: '🛡️ Modération — joueurs et saisons', value: MODERATION_PLAYERS },
      { name: '🛡️ Modération — points et évènements', value: MODERATION_POINTS },
    );
  }
  return embed;
}

function seasonField(season: Season | null, now: Date): { name: string; value: string } {
  if (!season) {
    return { name: '🗓️ Saison', value: "Aucune saison n'est en cours pour le moment." };
  }
  const { day, totalDays } = seasonProgress(season, now);
  return {
    name: `🗓️ Saison ${season.number} en cours`,
    value: `Jour ${day}/${totalDays} · fin ${time(season.endsAt, 'F')} (${time(season.endsAt, 'R')})`,
  };
}
