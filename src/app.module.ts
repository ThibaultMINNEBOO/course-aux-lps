import { Module } from '@spraxium/common';
import { ComponentsModule } from '@spraxium/components';
import { ScheduleModule } from '@spraxium/schedule';
import { DatabaseModule } from './modules/database/database.module';

@Module({
  imports: [ScheduleModule, ComponentsModule, DatabaseModule],
})
export class AppModule {}
