import { SlashCommand, SlashOption, SlashSubcommand } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';
import { MODERATOR_PERMISSIONS } from '../../../shared/moderation';

@SlashCommand({
  name: 'saison',
  description: 'Gérer les saisons de la course aux LP.',
  guild: GUILD_ID,
  defaultMemberPermissions: MODERATOR_PERMISSIONS,
})
export class SeasonCommand {
  @SlashOption.String('frequence', {
    description: 'Durée de la saison',
    required: true,
    choices: [
      { name: 'Hebdomadaire', value: 'WEEKLY' },
      { name: 'Mensuelle', value: 'MONTHLY' },
      { name: 'Personnalisée', value: 'CUSTOM' },
    ],
  })
  @SlashOption.String('fin', {
    description: 'Date de fin pour une saison personnalisée (JJ/MM/AAAA)',
    minLength: 10,
    maxLength: 10,
  })
  @SlashOption.Boolean('renouvellement', {
    description: 'Relancer automatiquement une saison à la fin (oui par défaut)',
  })
  @SlashSubcommand({ name: 'creer', description: 'Lancer une nouvelle saison.' })
  create() {}

  @SlashSubcommand({ name: 'terminer', description: 'Terminer la saison en cours et publier le classement final.' })
  end() {}

  @SlashOption.Boolean('actif', { description: 'Relancer automatiquement une saison à la fin', required: true })
  @SlashSubcommand({ name: 'renouvellement', description: 'Activer ou désactiver le renouvellement automatique.' })
  autoRenew() {}

  @SlashSubcommand({ name: 'infos', description: 'Afficher les informations de la saison en cours.' })
  info() {}
}
