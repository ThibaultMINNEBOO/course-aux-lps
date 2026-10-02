import { Env, EnvSchema, IsDiscordId, IsString, MinLength, SpraxiumBaseEnv } from '@spraxium/env';

@EnvSchema()
export class AppEnv extends SpraxiumBaseEnv {
  @Env('DATABASE_URL', { secret: true })
  @IsString()
  databaseUrl!: string;

  @Env('RIOT_API_KEY', { secret: true })
  @IsString()
  @MinLength(10)
  riotApiKey!: string;

  @Env('GUILD_ID')
  @IsDiscordId()
  guildId!: string;

  @Env('RECAP_CHANNEL_ID')
  @IsDiscordId()
  recapChannelId!: string;
}
