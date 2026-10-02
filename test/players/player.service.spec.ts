import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '../../src/generated/prisma/client';
import type { ParticipationService } from '../../src/modules/competition/participation.service';
import type { DatabaseService } from '../../src/modules/database/database.service';
import { PlayerService } from '../../src/modules/players/player.service';
import type { RiotApiClient } from '../../src/modules/riot/riot-api.client';
import { DomainException } from '../../src/shared/domain.exception';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    discordId: 'discord-1',
    puuid: 'puuid-1',
    gameName: 'Faker',
    tagLine: 'EUW',
    status: 'ACTIVE',
    banReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PlayerService', () => {
  const soloQueue = { queueType: 'RANKED_SOLO_5x5', tier: 'GOLD', rank: 'II', leaguePoints: 45, wins: 10, losses: 8 };
  let db: {
    player: Record<'findUnique' | 'findFirst' | 'findMany' | 'upsert' | 'update', ReturnType<typeof vi.fn>>;
  };
  let riot: Record<'findAccountByRiotId' | 'findSoloQueueEntry', ReturnType<typeof vi.fn>>;
  let participation: Record<'enrollInActiveSeason' | 'switchAccount' | 'withdraw', ReturnType<typeof vi.fn>>;
  let service: PlayerService;

  beforeEach(() => {
    db = {
      player: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve(makePlayer(create))),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve(makePlayer(data))),
      },
    };
    riot = {
      findAccountByRiotId: vi.fn().mockResolvedValue({ puuid: 'puuid-1', gameName: 'Faker', tagLine: 'EUW' }),
      findSoloQueueEntry: vi.fn().mockResolvedValue(soloQueue),
    };
    participation = {
      enrollInActiveSeason: vi.fn().mockResolvedValue(null),
      switchAccount: vi.fn().mockResolvedValue(undefined),
      withdraw: vi.fn().mockResolvedValue(undefined),
    };
    service = new PlayerService(
      db as unknown as DatabaseService,
      riot as unknown as RiotApiClient,
      participation as unknown as ParticipationService,
    );
  });

  describe('register', () => {
    it('creates the player and enrolls them in the active season', async () => {
      const { player } = await service.register('discord-1', 'Faker#EUW');

      expect(player.puuid).toBe('puuid-1');
      expect(participation.enrollInActiveSeason).toHaveBeenCalledWith('player-1', soloQueue);
    });

    it('rejects an invalid Riot ID', async () => {
      await expect(service.register('discord-1', 'Faker')).rejects.toBeInstanceOf(DomainException);
    });

    it('rejects an unknown Riot account', async () => {
      riot.findAccountByRiotId.mockResolvedValue(null);
      await expect(service.register('discord-1', 'Ghost#EUW')).rejects.toThrow('Aucun compte Riot');
    });

    it('rejects a member already registered', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      await expect(service.register('discord-1', 'Faker#EUW')).rejects.toThrow('déjà inscrit');
    });

    it('rejects a banned member', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ status: 'BANNED' }));
      await expect(service.register('discord-1', 'Faker#EUW')).rejects.toThrow('banni');
    });

    it('rejects a Riot account owned by another member', async () => {
      db.player.findFirst.mockResolvedValue(makePlayer({ discordId: 'discord-2' }));
      await expect(service.register('discord-1', 'Faker#EUW')).rejects.toThrow('déjà associé');
    });

    it('reactivates a member who previously left', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ status: 'LEFT' }));
      await service.register('discord-1', 'Faker#EUW');
      expect(db.player.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });
  });

  describe('changeRiotId', () => {
    beforeEach(() => {
      db.player.findUnique.mockResolvedValue(makePlayer());
    });

    it('only renames when the account is the same', async () => {
      riot.findAccountByRiotId.mockResolvedValue({ puuid: 'puuid-1', gameName: 'NewName', tagLine: 'EUW' });
      const { accountSwitched } = await service.changeRiotId('discord-1', 'NewName#EUW');

      expect(accountSwitched).toBe(false);
      expect(participation.switchAccount).not.toHaveBeenCalled();
    });

    it('carries progress over when the account changes', async () => {
      riot.findAccountByRiotId.mockResolvedValue({ puuid: 'puuid-2', gameName: 'Smurf', tagLine: 'EUW' });
      const { accountSwitched } = await service.changeRiotId('discord-1', 'Smurf#EUW');

      expect(accountSwitched).toBe(true);
      expect(participation.switchAccount).toHaveBeenCalledWith('player-1', soloQueue);
    });

    it('rejects players who are not active', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ status: 'BANNED' }));
      await expect(service.changeRiotId('discord-1', 'Faker#EUW')).rejects.toBeInstanceOf(DomainException);
    });
  });

  describe('ban', () => {
    it('withdraws the player from running competitions', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer());
      const player = await service.ban('discord-1', 'Triche');

      expect(participation.withdraw).toHaveBeenCalledWith('player-1');
      expect(player.status).toBe('BANNED');
    });

    it('rejects unknown members', async () => {
      await expect(service.ban('discord-1', 'Triche')).rejects.toBeInstanceOf(DomainException);
    });
  });

  describe('unban', () => {
    it('reactivates and re-enrolls the player', async () => {
      db.player.findUnique.mockResolvedValue(makePlayer({ status: 'BANNED' }));
      const { player } = await service.unban('discord-1');

      expect(player.status).toBe('ACTIVE');
      expect(participation.enrollInActiveSeason).toHaveBeenCalled();
    });
  });

  describe('markMissingMembersAsLeft', () => {
    it('withdraws active players who are no longer members', async () => {
      const stillHere = makePlayer({ id: 'p1', discordId: 'here' });
      const gone = makePlayer({ id: 'p2', discordId: 'gone' });
      db.player.findMany.mockResolvedValue([stillHere, gone]);
      db.player.findUnique.mockResolvedValue(gone);

      const removed = await service.markMissingMembersAsLeft(new Set(['here']));

      expect(removed).toBe(1);
      expect(participation.withdraw).toHaveBeenCalledWith('p2');
    });
  });
});
