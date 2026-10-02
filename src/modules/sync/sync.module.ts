import { Global, Module } from '@spraxium/common';
import { CompetitionModule } from '../competition/competition.module';
import { DatabaseModule } from '../database/database.module';
import { RiotModule } from '../riot/riot.module';
import { LpSyncService } from './lp-sync.service';

@Global()
@Module({
  imports: [DatabaseModule, RiotModule, CompetitionModule],
  providers: [LpSyncService],
  exports: [LpSyncService],
})
export class SyncModule {}
