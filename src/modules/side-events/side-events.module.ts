import { Global, Module } from '@spraxium/common';
import { DatabaseModule } from '../database/database.module';
import { SideEventCommand } from './commands/side-event.command';
import { CreateSideEventHandler } from './handlers/create-side-event.handler';
import { ListSideEventsHandler } from './handlers/list-side-events.handler';
import { SideEventAutocomplete } from './handlers/side-event.autocomplete';
import { SideEventService } from './side-event.service';

@Global()
@Module({
  imports: [DatabaseModule],
  commands: [SideEventCommand],
  handlers: [CreateSideEventHandler, ListSideEventsHandler, SideEventAutocomplete],
  providers: [SideEventService],
  exports: [SideEventService],
})
export class SideEventsModule {}
