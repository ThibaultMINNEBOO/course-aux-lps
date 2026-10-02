import { SlashCommand, SlashOption } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';
import { MODERATOR_PERMISSIONS } from '../../../shared/moderation';

export const MAX_ADJUSTMENT = 10_000;

@SlashCommand({
  name: 'points',
  description: 'Ajouter ou retirer des points à un joueur (saison en cours ou évènement annexe).',
  guild: GUILD_ID,
  defaultMemberPermissions: MODERATOR_PERMISSIONS,
})
export class PointsCommand {
  @SlashOption.User('membre', { description: 'Joueur concerné', required: true })
  @SlashOption.Integer('montant', {
    description: 'Points à ajouter (négatif pour en retirer)',
    required: true,
    min: -MAX_ADJUSTMENT,
    max: MAX_ADJUSTMENT,
  })
  @SlashOption.String('raison', { description: 'Raison de la modification', required: true, maxLength: 200 })
  @SlashOption.String('evenement', {
    description: 'Évènement annexe ciblé (par défaut : la saison en cours)',
    autocomplete: true,
  })
  build() {}
}
