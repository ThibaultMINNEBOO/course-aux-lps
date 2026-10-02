import { Module } from '@spraxium/common';
import { DatabaseModule } from '../database/database.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { ScoringModule } from '../scoring/scoring.module';
import { SeasonsModule } from '../seasons/seasons.module';
import { SideEventsModule } from '../side-events/side-events.module';
import { SyncModule } from '../sync/sync.module';
import { RecapCommand } from './commands/recap.command';
import { CompetitionClosingService } from './competition-closing.service';
import { EndSeasonHandler } from './handlers/end-season.handler';
import { EndSideEventHandler } from './handlers/end-side-event.handler';
import { RecapPreviewHandler } from './handlers/recap-preview.handler';
import { RecapService } from './recap.service';
import { RecapChannel } from './recap-channel';

@Module({
  imports: [DatabaseModule, SeasonsModule, SideEventsModule, ScoringModule, SyncModule, LeaderboardModule],
  commands: [RecapCommand],
  handlers: [RecapPreviewHandler, EndSeasonHandler, EndSideEventHandler],
  providers: [RecapChannel, CompetitionClosingService, RecapService],
})
export class RecapModule {}
