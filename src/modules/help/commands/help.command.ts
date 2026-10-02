import { SlashCommand } from '@spraxium/common';
import { GUILD_ID } from '../../../shared/guild';

@SlashCommand({ name: 'aide', description: 'Comprendre la course aux LP et les commandes du bot.', guild: GUILD_ID })
export class HelpCommand {
  build() {}
}
