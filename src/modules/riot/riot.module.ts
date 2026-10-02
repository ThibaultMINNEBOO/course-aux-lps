import { Module } from '@spraxium/common';
import { RiotApiClient } from './riot-api.client';

@Module({
  providers: [RiotApiClient],
  exports: [RiotApiClient],
})
export class RiotModule {}
