import { Global, Module } from '@spraxium/common';
import { DatabaseModule } from '../database/database.module';
import { PlayersModule } from '../players/players.module';
import { ScoringModule } from '../scoring/scoring.module';
import { SeasonsModule } from '../seasons/seasons.module';
import { SideEventsModule } from '../side-events/side-events.module';
import { LeaderboardCommand } from './commands/leaderboard.command';
import { ProfileCommand } from './commands/profile.command';
import { BoardPageHandler } from './handlers/board-page.handler';
import { LeaderboardHandler } from './handlers/leaderboard.handler';
import { LeaderboardEventAutocomplete } from './handlers/leaderboard-event.autocomplete';
import { ProfileHandler } from './handlers/profile.handler';
import { LeaderboardService } from './leaderboard.service';
import { ProfileService } from './profile.service';

@Global()
@Module({
  imports: [DatabaseModule, PlayersModule, SeasonsModule, SideEventsModule, ScoringModule],
  commands: [LeaderboardCommand, ProfileCommand],
  handlers: [LeaderboardHandler, LeaderboardEventAutocomplete, ProfileHandler],
  providers: [LeaderboardService, ProfileService, BoardPageHandler],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
