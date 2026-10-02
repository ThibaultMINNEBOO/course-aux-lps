import { Global, Module } from '@spraxium/common';
import { CompetitionModule } from '../competition/competition.module';
import { DatabaseModule } from '../database/database.module';
import { RiotModule } from '../riot/riot.module';
import { PlayerCommand } from './commands/player.command';
import { BanPlayerHandler } from './handlers/ban-player.handler';
import { ChangeRiotIdHandler } from './handlers/change-riot-id.handler';
import { RegisterPlayerHandler } from './handlers/register-player.handler';
import { UnbanPlayerHandler } from './handlers/unban-player.handler';
import { MemberLeaveListener } from './listeners/member-leave.listener';
import { MemberReconciliationService } from './member-reconciliation.service';
import { PlayerService } from './player.service';

@Global()
@Module({
  imports: [DatabaseModule, RiotModule, CompetitionModule],
  commands: [PlayerCommand],
  handlers: [RegisterPlayerHandler, ChangeRiotIdHandler, BanPlayerHandler, UnbanPlayerHandler],
  listeners: [MemberLeaveListener],
  providers: [PlayerService, MemberReconciliationService],
  exports: [PlayerService],
})
export class PlayersModule {}
