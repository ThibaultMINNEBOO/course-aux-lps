import { SlashCommand, SlashOption, SlashSubcommand } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';
import { MODERATOR_PERMISSIONS } from '../../../shared/moderation';

@SlashCommand({
  name: 'evenement',
  description: 'Gérer les évènements annexes.',
  guild: GUILD_ID,
  defaultMemberPermissions: MODERATOR_PERMISSIONS,
})
export class SideEventCommand {
  @SlashOption.String('nom', { description: "Nom de l'évènement", required: true, maxLength: 80 })
  @SlashOption.String('description', { description: "Description de l'évènement", maxLength: 300 })
  @SlashOption.String('fin', {
    description: 'Date de fin (JJ/MM/AAAA), clôture automatique à 21h',
    minLength: 10,
    maxLength: 10,
  })
  @SlashSubcommand({ name: 'creer', description: 'Créer un évènement annexe.' })
  create() {}

  @SlashOption.String('evenement', { description: 'Évènement à terminer', required: true, autocomplete: true })
  @SlashSubcommand({ name: 'terminer', description: 'Terminer un évènement et publier son classement final.' })
  end() {}

  @SlashSubcommand({ name: 'liste', description: 'Lister les évènements annexes en cours.' })
  list() {}
}
