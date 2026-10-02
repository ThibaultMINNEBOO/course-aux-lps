import { Module } from '@spraxium/common';
import { ComponentsModule } from '@spraxium/components';
import { ScheduleModule } from '@spraxium/schedule';
import { CompetitionModule } from './modules/competition/competition.module';
import { DatabaseModule } from './modules/database/database.module';
import { HelpModule } from './modules/help/help.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { PlayersModule } from './modules/players/players.module';
import { RecapModule } from './modules/recap/recap.module';
import { RiotModule } from './modules/riot/riot.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { SideEventsModule } from './modules/side-events/side-events.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ScheduleModule,
    ComponentsModule,
    DatabaseModule,
    RiotModule,
    CompetitionModule,
    PlayersModule,
    SeasonsModule,
    SideEventsModule,
    ScoringModule,
    SyncModule,
    LeaderboardModule,
    RecapModule,
    HelpModule,
  ],
})
export class AppModule {}
