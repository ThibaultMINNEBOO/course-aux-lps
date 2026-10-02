import { describe, expect, it } from 'vitest';
import { boardPageLinks } from '../../src/modules/leaderboard/board-navigation';
import { BoardPageButton, decodeBoardParams } from '../../src/modules/leaderboard/components/board-page.button';

const target = { kind: 'season' as const, id: 'season-1' };

describe('boardPageLinks', () => {
  it('points each control to the right page', () => {
    const links = boardPageLinks(target, 2, 4, 'update');
    expect(links.map((link) => link.page)).toEqual([1, 1, 2, 3, 4]);
  });

  it('disables controls leading to the current page when updating in place', () => {
    const links = boardPageLinks(target, 1, 3, 'update');
    expect(links.map((link) => link.disabled)).toEqual([true, true, true, false, false]);
  });

  it('keeps every control enabled on shared messages', () => {
    const links = boardPageLinks(target, 1, 3, 'ephemeral');
    expect(links.map((link) => link.disabled)).toEqual([false, false, false, false, false]);
  });

  it('produces unique params for every control', () => {
    const params = boardPageLinks(target, 1, 1, 'update').map((link) =>
      JSON.stringify(BoardPageButton.render(link).params),
    );
    expect(new Set(params).size).toBe(params.length);
  });
});

describe('decodeBoardParams', () => {
  it('round-trips the rendered params', () => {
    const [, , , next] = boardPageLinks({ kind: 'event', id: 'event-7' }, 2, 5, 'ephemeral');
    const decoded = decodeBoardParams(BoardPageButton.render(next).params ?? {});
    expect(decoded).toEqual({ target: { kind: 'event', id: 'event-7' }, page: 3, opening: 'ephemeral' });
  });
});
