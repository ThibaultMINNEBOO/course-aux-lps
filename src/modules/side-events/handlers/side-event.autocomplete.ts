import { SlashAutocompleteHandler, SlashFocused } from '@spraxium/common';
import type { AutocompleteInteraction } from 'discord.js';
import { SideEventCommand } from '../commands/side-event.command';
import { SideEventService } from '../side-event.service';
import { respondWithSideEvents } from '../side-event-autocomplete';

@SlashAutocompleteHandler(SideEventCommand, 'evenement')
export class SideEventAutocomplete {
  constructor(private readonly sideEvents: SideEventService) {}

  async build(interaction: AutocompleteInteraction, @SlashFocused() query: string): Promise<void> {
    await respondWithSideEvents(interaction, this.sideEvents, query, false);
  }
}
