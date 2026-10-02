import { Injectable } from '@spraxium/common';
import { Client, type MessageCreateOptions } from 'discord.js';
import { AppEnv } from '../../app.env';

@Injectable()
export class RecapChannel {
  constructor(
    private readonly client: Client,
    private readonly env: AppEnv,
  ) {}

  async send(message: MessageCreateOptions): Promise<void> {
    const channel = await this.client.channels.fetch(this.env.recapChannelId);
    if (!channel?.isSendable()) {
      throw new Error(`Recap channel ${this.env.recapChannelId} cannot receive messages`);
    }
    await channel.send(message);
  }
}
