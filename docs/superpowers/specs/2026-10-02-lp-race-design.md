# CALP Bot — Course aux LP (Spraxium)

## Contexte

Le repo `calp-bot` est un scaffold Spraxium 0.3 vierge (seul un module `ping`). Objectif : un bot pour **un seul serveur Discord** qui suit automatiquement la progression LP (Solo/Duo, EUW) des joueurs inscrits via l'API Riot, poste chaque jour à **21h (Europe/Paris)** un récap dans un salon dédié (gains du jour + classement cumulé de la saison), et publie le classement final en fin de saison. Des évènements annexes (leaderboards à points manuels) peuvent coexister ; la course aux LP reste l'évènement principal.

### Décisions validées
| Sujet | Choix |
|---|---|
| Source LP | API Riot auto (account-v1 + league-v4), clé perso/prod |
| File | RANKED_SOLO_5x5 uniquement, plateforme `euw1`, routage `europe` |
| Score | Net : LP absolus actuels − LP absolus de référence (promos/rétrogradations incluses) + bonus manuels |
| Events annexes | Leaderboards à points manuels uniquement |
| Saisons | Hebdo / mensuelle / dates perso, **auto-renouvelées** (désactivable) |
| Modération | Permission Discord « Gérer le serveur » (`defaultMemberPermissions` + `PermissionGuard`) |
| BDD | Prisma + PostgreSQL (docker-compose pour le dev) |
| Changement de tag | Même PUUID → renommage ; autre compte → LP acquis conservés, progression repart du rang du nouveau compte |
| Ban / départ | Retiré de la saison et des events en cours ; réinscription = repart de 0 ; banni non réinscriptible sans déban |
| Tests | Vitest sur la logique métier |

Conventions : code TypeScript propre, **aucun commentaire**, messages du bot en français, commits Conventional Commits fréquents (un par étape ci-dessous minimum), fin de message `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Modèle de domaine (Prisma)

- **Player** : `id`, `discordId` (unique), `puuid`, `gameName`, `tagLine`, `status` (`ACTIVE | BANNED | LEFT`), `banReason?`, timestamps.
- **Season** : `id`, `number`, `frequency` (`WEEKLY | MONTHLY | CUSTOM`), `startsAt`, `endsAt`, `status` (`ACTIVE | ENDED`), `autoRenew`. Une seule saison `ACTIVE` à la fois.
- **SeasonEntry** (participation, une nouvelle ligne à chaque réinscription) : `seasonId`, `playerId`, `active`, `removedAt?`, `baselineLp?`, `baselineWins`, `baselineLosses`, `currentLp?`, `currentTier?`, `currentDivision?`, `currentLeaguePoints?`, `wins`, `losses`, `carriedLp`, `carriedWins`, `carriedLosses`, `lastSyncedAt?`.
- **DailySnapshot** : `seasonEntryId`, `takenAt`, `score`, `wins`, `losses` — base du « gain du jour » (delta avec le snapshot précédent, ou la référence pour le 1er jour).
- **SideEvent** : `id`, `name`, `description?`, `startsAt`, `endsAt?`, `status`.
- **SideEventEntry** : `sideEventId`, `playerId`, `active`, `removedAt?`.
- **ScoreAdjustment** : `amount` (±), `reason`, `moderatorId`, `createdAt`, et exactement un de `seasonEntryId` / `sideEventEntryId`.

Score saison = `carriedLp + (currentLp − baselineLp) + Σ adjustments` (`baselineLp` posé à la 1re observation classée ; non classé → seuls les bonus comptent).
LP absolus : `tierIndex × 400 + divisionIndex × 100 + LP` (IRON IV = 0) ; MASTER/GM/CHALLENGER = `2800 + LP`.

## Architecture (modules sous `src/modules/`)

| Module | Contenu |
|---|---|
| `database/` | Généré par `npx spraxium database` (Prisma/PostgreSQL) → `DatabaseService` ; `prisma/schema.prisma` |
| `riot/` | `RiotApiClient` (fetch natif, header `X-Riot-Token`, file séquentielle + retry sur 429 via `Retry-After`), `rank.ts` (pur : `toAbsoluteLp`, `formatRank` FR), `riot-id.ts` (pur : parse `pseudo#tag`) |
| `players/` | `PlayerService` (inscrire, changer tag, bannir, débannir, retirer), commande `/joueur` (`inscrire`, `tag`, `bannir`, `debannir`, `infos`), `MemberLeaveListener` (`Events.GuildMemberRemove`), réconciliation au `onReady` (membres partis pendant que le bot était hors ligne) |
| `seasons/` | `SeasonService` (créer, terminer, renouveler, inscrire tous les joueurs actifs), `season-period.ts` (pur : calcul début/fin alignés sur 21h Paris), commande `/saison` (`creer`, `terminer`, `renouvellement`, `infos`) |
| `side-events/` | `SideEventService`, commande `/evenement` (`creer`, `terminer`, `ajouter-joueur`, `retirer-joueur`) avec autocomplete sur les events actifs |
| `scoring/` | `ScoreAdjustmentService`, commande `/points` (`ajouter` membre, montant ±, raison, cible = saison ou event via autocomplete), `standings.ts` (pur : calcul score, tri, rang, pagination 10/page) |
| `sync/` | `LpSyncService` : `@Interval` (15 min, configurable) + appel explicite avant le récap ; met à jour les `SeasonEntry` actives |
| `leaderboard/` | `LeaderboardService` (standings saison/event), embeds (`@Embed` dynamiques), boutons de pagination `⏮ ◀ page/total ▶ ⏭` (`@DynamicButton` + payload `{ kind, targetId, page }`), commande publique `/classement [evenement]` ; un clic met à jour le message en place avec les données fraîches |
| `recap/` | `RecapService` : `@Cron('0 21 * * *')` timezone `Europe/Paris` → sync → `DailySnapshot` → post embed récap + pagination → si `endsAt` atteint : classement final (podium) + nouvelle saison si `autoRenew` ; events annexes arrivés à échéance finalisés de même. Commande mod `/recap forcer` pour tester |
| `shared/` | Garde mod réutilisable (`GuildOnly` + `PermissionGuard` `ManageGuild`), helpers de formatage (nombres signés, médailles) |

Récap quotidien : titre « Récap du JJ/MM — Saison N (jour X/Y) », top 3 progressions du jour, LP cumulés du jour, classement saison paginé (rang, joueur, score, `+delta` du jour, rang Riot actuel, V/D), mini-section top 3 par event annexe actif.

Env (`src/app.env.ts`) : `DISCORD_TOKEN`, `RIOT_API_KEY`, `DATABASE_URL`, `GUILD_ID`, `RECAP_CHANNEL_ID`, `TIMEZONE` (défaut `Europe/Paris`), `LP_SYNC_INTERVAL_MINUTES` (défaut 15). Intent privilégié `GuildMembers` requis (à activer sur le portail dev). Commandes enregistrées au niveau du serveur `GUILD_ID`.

## Étapes d'implémentation (1 commit chacune au minimum)

0. **Spec** : copier ce design dans `docs/superpowers/specs/2026-10-02-lp-race-design.md` → `docs: add lp race design`.
1. **Fondations** : `npm i @spraxium/schedule @spraxium/components`, `spraxium database` (Prisma + PostgreSQL), `docker-compose.yml` Postgres, env étendu + `.env.example`, Vitest (+ `unplugin-swc` pour les décorateurs) avec script `test`, suppression du module `ping`.
2. **Schéma Prisma** + migration initiale.
3. **Riot** : `rank.ts`, `riot-id.ts` (TDD), `RiotApiClient`.
4. **Joueurs** : service + `/joueur` + listener de départ + réconciliation.
5. **Saisons** : `season-period.ts` (TDD), service, `/saison`.
6. **Sync LP** : `LpSyncService` (bascule de compte → `carried*`).
7. **Scoring & events annexes** : `standings.ts` (TDD), `/points`, `/evenement`.
8. **Leaderboard** : embeds, boutons de pagination, `/classement`.
9. **Récap & fin de saison** : `RecapService`, `/recap forcer`.
10. **README** (setup, clé Riot, intents, commandes) + revue finale (`/code-review`).

Points à vérifier pendant l'implémentation (lecture de `node_modules/@spraxium/*/dist/index.d.ts` et docs) : persistance des payloads de `@DynamicButton` après redémarrage (sinon encoder `kind:id:page` dans le `customId` d'un bouton statique ou via listener `InteractionCreate`) ; option d'enregistrement des commandes par guilde ; config timezone de `@spraxium/schedule`.

## Vérification

- `npm test` : calcul LP absolus (promo Gold I 90 → Plat IV 10 = +20, apex), parse Riot ID, périodes de saison (hebdo/mensuelle/perso, alignement 21h, DST), standings (tri, égalités, pagination, bonus, carried), services avec repos mockés (ban, départ, changement de compte).
- `npm run build` sans erreur TypeScript.
- Manuel sur un serveur de test (`docker compose up -d`, `npx prisma migrate dev`, `npm run dev`) : inscrire 2–3 comptes réels, `/saison creer`, attendre une sync, `/points ajouter`, `/classement` + navigation boutons, `/recap forcer`, terminer la saison et vérifier classement final + renouvellement, bannir/kick un membre et vérifier son retrait.
