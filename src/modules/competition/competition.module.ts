import { Module } from '@spraxium/common';
import { DatabaseModule } from '../database/database.module';
import { ParticipationService } from './participation.service';

@Module({
  imports: [DatabaseModule],
  providers: [ParticipationService],
  exports: [ParticipationService],
})
export class CompetitionModule {}
