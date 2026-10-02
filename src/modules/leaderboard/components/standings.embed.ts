import { Embed, EmbedColor, EmbedDescription, EmbedFooter, EmbedTimestamp, EmbedTitle } from '@spraxium/components';

export interface StandingsEmbedData {
  title: string;
  description: string;
  color: number;
  footer: string;
}

@Embed()
export class StandingsEmbed {
  @EmbedTitle<StandingsEmbedData>((data) => data.title)
  title!: never;

  @EmbedDescription<StandingsEmbedData>((data) => data.description)
  description!: never;

  @EmbedColor<StandingsEmbedData>((data) => data.color)
  color!: never;

  @EmbedFooter<StandingsEmbedData>((data) => ({ text: data.footer }))
  footer!: never;

  @EmbedTimestamp(true)
  timestamp!: never;
}
