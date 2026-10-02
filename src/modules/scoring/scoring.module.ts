import { Global, Module } from '@spraxium/common';
import { CompetitionModule } from '../competition/competition.module';
import { DatabaseModule } from '../database/database.module';
import { SideEventsModule } from '../side-events/side-events.module';
import { PointsCommand } from './commands/points.command';
import { PointsHandler } from './handlers/points.handler';
import { PointsEventAutocomplete } from './handlers/points-event.autocomplete';
import { ScoreAdjustmentService } from './score-adjustment.service';
import { StandingsService } from './standings.service';

@Global()
@Module({
  imports: [DatabaseModule, CompetitionModule, SideEventsModule],
  commands: [PointsCommand],
  handlers: [PointsHandler, PointsEventAutocomplete],
  providers: [ScoreAdjustmentService, StandingsService],
  exports: [ScoreAdjustmentService, StandingsService],
})
export class ScoringModule {}
