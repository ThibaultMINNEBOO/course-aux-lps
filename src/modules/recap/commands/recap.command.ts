import { SlashCommand, SlashSubcommand } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';
import { MODERATOR_PERMISSIONS } from '../../../shared/moderation';

@SlashCommand({
  name: 'recap',
  description: 'Outils du récapitulatif quotidien.',
  guild: GUILD_ID,
  defaultMemberPermissions: MODERATOR_PERMISSIONS,
})
export class RecapCommand {
  @SlashSubcommand({ name: 'apercu', description: 'Prévisualiser le récap du jour (visible par toi seul).' })
  preview() {}
}
