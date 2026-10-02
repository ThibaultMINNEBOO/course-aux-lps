# CALP Bot — Course aux LP

Bot Discord (framework [Spraxium](https://spraxium.com)) dédié à un seul serveur. Il suit automatiquement la progression en **Solo/Duo (EUW)** des joueurs inscrits via l'API Riot, publie chaque jour à **21h (heure de Paris)** un récapitulatif dans un salon dédié et gère des **saisons** (hebdomadaires, mensuelles ou personnalisées) ainsi que des **évènements annexes** à points.

## Fonctionnalités

- Inscription des joueurs par la modération (`/joueur inscrire`) avec leur Riot ID.
- Synchronisation des rangs toutes les 15 minutes et juste avant chaque récap.
- Score **net** : LP absolus actuels − LP au début de la saison (promotions et rétrogradations incluses) + bonus/malus manuels.
- Récap quotidien à 21h : top progressions du jour, plus grosse chute, classement général paginé, podium des évènements annexes.
- Fin de saison automatique avec classement final, puis **renouvellement automatique** (désactivable).
- Évènements annexes : leaderboards dont les points sont attribués par la modération.
- Classements paginés avec boutons de navigation (persistants après un redémarrage).
- Bannissement, débannissement, changement de Riot ID, retrait automatique des membres qui quittent le serveur.

## Prérequis

- Node.js `>= 22.23.2`
- Docker (pour PostgreSQL en local) ou une base PostgreSQL existante
- Une application Discord avec un bot :
  - intent privilégié **Server Members Intent** activé (Developer Portal → Bot → Privileged Gateway Intents) ;
  - invité avec les scopes `bot` et `applications.commands` ;
  - permissions `Voir le salon`, `Envoyer des messages` et `Intégrer des liens` sur le salon du récap.
- Une clé API Riot **personnelle ou production** ([developer.riotgames.com](https://developer.riotgames.com)). Une clé de développement expire toutes les 24h.

## Installation

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:deploy
npm run dev
```

### Variables d'environnement

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot Discord |
| `RIOT_API_KEY` | Clé API Riot |
| `DATABASE_URL` | URL PostgreSQL (`postgresql://calp:calp@localhost:5432/calp` avec le docker-compose fourni) |
| `GUILD_ID` | ID du serveur Discord (les commandes y sont enregistrées) |
| `RECAP_CHANNEL_ID` | ID du salon qui reçoit le récap quotidien et les classements finaux |
| `POSTGRES_PORT` | Port exposé par docker-compose (défaut `5432`) |

## Commandes

Les commandes de modération sont réservées aux membres ayant la permission **Gérer le serveur**.

| Commande | Accès | Description |
|---|---|---|
| `/joueur inscrire membre riot_id` | Modération | Inscrit un membre (`Pseudo#TAG`) et l'ajoute à la saison en cours |
| `/joueur tag membre riot_id` | Modération | Change le Riot ID. Même compte : renommage. Autre compte : les LP acquis sont conservés et la progression repart du rang du nouveau compte |
| `/joueur bannir membre raison` | Modération | Bannit le joueur et le retire des classements en cours |
| `/joueur debannir membre` | Modération | Lève le bannissement ; le joueur repart de zéro |
| `/saison creer frequence [fin] [renouvellement]` | Modération | Lance une saison (`fin` au format `JJ/MM/AAAA` pour une saison personnalisée) |
| `/saison terminer` | Modération | Termine la saison immédiatement et publie le classement final (sans renouvellement) |
| `/saison renouvellement actif` | Modération | Active ou désactive le renouvellement automatique |
| `/saison infos` | Modération | Informations sur la saison en cours |
| `/evenement creer nom [description] [fin]` | Modération | Crée un évènement annexe (clôture automatique à 21h le jour de `fin`) |
| `/evenement terminer evenement` | Modération | Termine un évènement et publie son classement final |
| `/evenement liste` | Modération | Liste les évènements en cours |
| `/points membre montant raison [evenement]` | Modération | Ajoute (ou retire si négatif) des points sur la saison ou un évènement |
| `/recap apercu` | Modération | Prévisualise le récap du jour (visible uniquement par toi) |
| `/classement [evenement]` | Tous | Classement paginé de la saison ou d'un évènement |
| `/profil [membre]` | Tous | Progression d'un joueur |

## Règles de calcul

- Échelle de LP absolus : `palier × 400 + division × 100 + LP` (Fer IV 0 LP = 0). Maître, Grand Maître et Challenger partagent la même échelle à partir de 2800.
- La référence d'un joueur est posée à son inscription dans la saison (ou à son premier match classé s'il n'est pas encore classé).
- Le « gain du jour » est la différence avec le score enregistré lors du récap précédent.
- Une saison hebdomadaire ou mensuelle se termine à 21h, 7 jours ou 1 mois après son lancement ; une saison renouvelée démarre exactement à la fin de la précédente avec les rangs connus à ce moment.
- Un joueur banni ou qui quitte le serveur est retiré de la saison et des évènements en cours. S'il est réinscrit, il repart de zéro.
- Si le bot était hors ligne à l'heure de fin d'une saison, elle est clôturée au redémarrage.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Lancement en mode développement (rechargement à chaud) |
| `npm run build` / `npm start` | Build et lancement en production |
| `npm test` | Tests unitaires |
| `npm run test:integration` | Tests d'intégration sur la base `DATABASE_URL` (⚠️ vide les tables) |
| `npm run lint` / `npm run format` | Vérification et formatage (Biome) |
| `npm run db:migrate` | Crée/applique une migration en développement |
| `npm run db:deploy` | Applique les migrations en production |

## Architecture

```
src/
├── main.ts / app.module.ts / app.env.ts
├── shared/                 Garde de modération, erreurs métier, formatage
└── modules/
    ├── database/           PrismaClient (PostgreSQL)
    ├── riot/               Client API Riot (file d'attente + retries), échelle de LP, Riot ID
    ├── competition/        Participations aux saisons, calcul de progression
    ├── players/            /joueur, départs du serveur
    ├── seasons/            /saison, périodes et renouvellement
    ├── side-events/        /evenement
    ├── scoring/            /points, calcul des classements
    ├── sync/               Synchronisation des rangs (toutes les 15 min)
    ├── leaderboard/        /classement, /profil, pagination
    └── recap/              Récap de 21h, clôture des saisons et évènements, /recap
```
