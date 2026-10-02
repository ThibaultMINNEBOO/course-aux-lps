import { Global, Module } from '@spraxium/common';
import { CompetitionModule } from '../competition/competition.module';
import { DatabaseModule } from '../database/database.module';
import { RiotModule } from '../riot/riot.module';
import { SeasonCommand } from './commands/season.command';
import { CreateSeasonHandler } from './handlers/create-season.handler';
import { SeasonAutoRenewHandler } from './handlers/season-auto-renew.handler';
import { SeasonInfoHandler } from './handlers/season-info.handler';
import { SeasonService } from './season.service';

@Global()
@Module({
  imports: [DatabaseModule, RiotModule, CompetitionModule],
  commands: [SeasonCommand],
  handlers: [CreateSeasonHandler, SeasonAutoRenewHandler, SeasonInfoHandler],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonsModule {}
