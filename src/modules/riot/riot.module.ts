import { Global, Module } from '@spraxium/common';
import { RiotApiClient } from './riot-api.client';

@Global()
@Module({
  providers: [RiotApiClient],
  exports: [RiotApiClient],
})
export class RiotModule {}
