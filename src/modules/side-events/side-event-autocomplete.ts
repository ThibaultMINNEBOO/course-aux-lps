import type { AutocompleteInteraction } from 'discord.js';
import type { SideEventService } from './side-event.service';

const CHOICE_NAME_LIMIT = 100;

export async function respondWithSideEvents(
  interaction: AutocompleteInteraction,
  events: SideEventService,
  query: string,
  includeEnded: boolean,
): Promise<void> {
  const matches = await events.search(query ?? '', includeEnded);
  await interaction.respond(
    matches.map((event) => ({
      name: `${event.name}${event.status === 'ENDED' ? ' (terminé)' : ''}`.slice(0, CHOICE_NAME_LIMIT),
      value: event.id,
    })),
  );
}
