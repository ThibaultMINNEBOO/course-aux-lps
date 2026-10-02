import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, type SpraxiumOnBoot, type SpraxiumOnShutdown } from '@spraxium/common';
import { AppEnv } from '../../app.env';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements SpraxiumOnBoot, SpraxiumOnShutdown {
  constructor(env: AppEnv) {
    super({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) });
  }

  async onBoot(): Promise<void> {
    await this.$connect();
  }

  async onShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
