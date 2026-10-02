import { type ButtonRenderConfig, DynamicButton } from '@spraxium/components';

export type BoardKind = 'season' | 'event';
export type BoardOpening = 'update' | 'ephemeral';

export interface BoardTarget {
  kind: BoardKind;
  id: string;
}

export interface BoardPageLink {
  target: BoardTarget;
  page: number;
  opening: BoardOpening;
  slot: number;
  label: string;
  emoji?: string;
  disabled: boolean;
}

@DynamicButton({ baseId: 'board', encoding: 'inline' })
export class BoardPageButton {
  static render(link: BoardPageLink): ButtonRenderConfig {
    return {
      label: link.label,
      emoji: link.emoji,
      style: link.slot === 2 ? 'primary' : 'secondary',
      disabled: link.disabled,
      params: {
        k: link.target.kind === 'season' ? 's' : 'e',
        i: link.target.id,
        p: link.page,
        o: link.opening === 'update' ? 'u' : 'n',
        s: link.slot,
      },
    };
  }
}

export function decodeBoardParams(params: Record<string, string | number | boolean>): {
  target: BoardTarget;
  page: number;
  opening: BoardOpening;
} {
  return {
    target: { kind: params.k === 's' ? 'season' : 'event', id: String(params.i) },
    page: Number(params.p) || 1,
    opening: params.o === 'u' ? 'update' : 'ephemeral',
  };
}
