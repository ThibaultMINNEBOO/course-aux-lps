export interface RiotId {
  gameName: string;
  tagLine: string;
}

const RIOT_ID_PATTERN = /^([^#]{3,16})#([\p{L}\p{N}]{3,5})$/u;

export function parseRiotId(input: string): RiotId | null {
  const match = RIOT_ID_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }
  const gameName = match[1].trim();
  if (gameName.length < 3) {
    return null;
  }
  return { gameName, tagLine: match[2] };
}

export function formatRiotId(riotId: RiotId): string {
  return `${riotId.gameName}#${riotId.tagLine}`;
}
