import { withOptions } from '@spraxium/common';
import { GuildOnly, PermissionGuard } from '@spraxium/core';
import { PermissionFlagsBits } from 'discord.js';

export const MODERATOR_PERMISSIONS = PermissionFlagsBits.ManageGuild;

export const MODERATOR_GUARDS = [GuildOnly, withOptions(PermissionGuard, { permissions: ['ManageGuild'] })] as const;
