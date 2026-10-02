import { SlashCommand, SlashOption, SlashSubcommand } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';
import { MODERATOR_PERMISSIONS } from '../../../shared/moderation';

@SlashCommand({
  name: 'joueur',
  description: 'Gérer les joueurs de la course aux LP.',
  guild: GUILD_ID,
  defaultMemberPermissions: MODERATOR_PERMISSIONS,
})
export class PlayerCommand {
  @SlashOption.User('membre', { description: 'Membre du serveur à inscrire', required: true })
  @SlashOption.String('riot_id', { description: 'Riot ID au format Pseudo#TAG', required: true, maxLength: 22 })
  @SlashSubcommand({ name: 'inscrire', description: 'Inscrire un membre à la compétition.' })
  register() {}

  @SlashOption.User('membre', { description: 'Joueur concerné', required: true })
  @SlashOption.String('riot_id', { description: 'Nouveau Riot ID au format Pseudo#TAG', required: true, maxLength: 22 })
  @SlashSubcommand({ name: 'tag', description: "Changer le Riot ID d'un joueur." })
  changeTag() {}

  @SlashOption.User('membre', { description: 'Joueur à bannir', required: true })
  @SlashOption.String('raison', { description: 'Raison du bannissement', required: true, maxLength: 200 })
  @SlashSubcommand({ name: 'bannir', description: 'Bannir un joueur de la compétition.' })
  ban() {}

  @SlashOption.User('membre', { description: 'Joueur à débannir', required: true })
  @SlashSubcommand({ name: 'debannir', description: 'Lever le bannissement et réinscrire un joueur.' })
  unban() {}
}
