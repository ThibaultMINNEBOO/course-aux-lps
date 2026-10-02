import { SlashCommand, SlashOption } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';

@SlashCommand({
  name: 'classement',
  description: "Afficher le classement de la course aux LP ou d'un évènement.",
  guild: GUILD_ID,
})
export class LeaderboardCommand {
  @SlashOption.String('evenement', { description: 'Évènement annexe (par défaut : la saison)', autocomplete: true })
  build() {}
}
