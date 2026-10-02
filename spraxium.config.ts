import { defineComponents } from '@spraxium/components';
import { defineConfig } from '@spraxium/core';
import { defineSchedule } from '@spraxium/schedule';
import { developmentConfig } from './config/development.config';

export default defineConfig((env) => ({
  debug: env.isNeutral,
  plugins: [
    defineSchedule({ timezone: 'Europe/Paris' }),
    defineComponents({ context: { storage: { type: 'file', dir: '.spraxium/context' } } }),
  ],
  dev: developmentConfig,
}));
