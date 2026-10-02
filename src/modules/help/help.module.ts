import { Module } from '@spraxium/common';
import { SeasonsModule } from '../seasons/seasons.module';
import { HelpCommand } from './commands/help.command';
import { HelpHandler } from './handlers/help.handler';

@Module({
  imports: [SeasonsModule],
  commands: [HelpCommand],
  handlers: [HelpHandler],
})
export class HelpModule {}
