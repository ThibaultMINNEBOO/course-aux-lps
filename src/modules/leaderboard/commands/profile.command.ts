import { SlashCommand, SlashOption } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';

@SlashCommand({ name: 'profil', description: "Afficher la progression d'un joueur.", guild: GUILD_ID })
export class ProfileCommand {
  @SlashOption.User('membre', { description: 'Joueur à afficher (par défaut : toi)' })
  build() {}
}
