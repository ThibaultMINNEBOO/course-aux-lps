import { SlashAutocompleteHandler, SlashFocused } from '@spraxium/common';
import type { AutocompleteInteraction } from 'discord.js';
import { SideEventService } from '../../side-events/side-event.service';
import { respondWithSideEvents } from '../../side-events/side-event-autocomplete';
import { PointsCommand } from '../commands/points.command';

@SlashAutocompleteHandler(PointsCommand, 'evenement')
export class PointsEventAutocomplete {
  constructor(private readonly sideEvents: SideEventService) {}

  async build(interaction: AutocompleteInteraction, @SlashFocused() query: string): Promise<void> {
    await respondWithSideEvents(interaction, this.sideEvents, query, false);
  }
}
