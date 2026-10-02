import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import type { Season } from '../../src/generated/prisma/client';
import { helpEmbed } from '../../src/modules/help/help-embed';

function paris(iso: string): Date {
  return DateTime.fromISO(iso, { zone: 'Europe/Paris' }).toJSDate();
}

const season: Season = {
  id: 'season-1',
  number: 4,
  frequency: 'WEEKLY',
  startsAt: paris('2026-10-05T18:00'),
  endsAt: paris('2026-10-12T21:00'),
  status: 'ACTIVE',
  autoRenew: true,
  createdAt: new Date(),
};

function fieldNames(isModerator: boolean, current: Season | null): Array<string> {
  return (helpEmbed({ isModerator, season: current, now: paris('2026-10-07T12:00') }).toJSON().fields ?? []).map(
    (field) => field.name,
  );
}

describe('helpEmbed', () => {
  it('explains the competition and public commands to everyone', () => {
    const embed = helpEmbed({ isModerator: false, season: null, now: new Date() }).toJSON();
    const text = JSON.stringify(embed);

    expect(text).toContain('/classement');
    expect(text).toContain('/profil');
    expect(text).toContain('21h');
    expect(text).not.toContain('/joueur inscrire');
  });

  it('adds the moderation commands for moderators', () => {
    const text = JSON.stringify(helpEmbed({ isModerator: true, season: null, now: new Date() }).toJSON());

    for (const command of ['/joueur inscrire', '/saison creer', '/evenement creer', '/points', '/recap apercu']) {
      expect(text).toContain(command);
    }
  });

  it('shows the running season when there is one', () => {
    const embed = helpEmbed({ isModerator: false, season, now: paris('2026-10-07T12:00') }).toJSON();
    const field = embed.fields?.find((candidate) => candidate.name.includes('Saison 4'));

    expect(field?.value).toContain('Jour 3/8');
  });

  it('says when no season is running', () => {
    expect(fieldNames(false, null)).not.toContain('🗓️ Saison 4 en cours');
    expect(JSON.stringify(helpEmbed({ isModerator: false, season: null, now: new Date() }).toJSON())).toContain(
      "Aucune saison n'est en cours",
    );
  });

  it('keeps every field within Discord limits', () => {
    const embed = helpEmbed({ isModerator: true, season, now: paris('2026-10-07T12:00') }).toJSON();

    expect(embed.fields?.length).toBeLessThanOrEqual(25);
    for (const field of embed.fields ?? []) {
      expect(field.value.length).toBeLessThanOrEqual(1024);
    }
  });
});
