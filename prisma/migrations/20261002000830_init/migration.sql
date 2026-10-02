-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'BANNED', 'LEFT');

-- CreateEnum
CREATE TYPE "SeasonFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "banReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "frequency" "SeasonFrequency" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonEntry" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "removedAt" TIMESTAMP(3),
    "baselineLp" INTEGER,
    "baselineWins" INTEGER NOT NULL DEFAULT 0,
    "baselineLosses" INTEGER NOT NULL DEFAULT 0,
    "currentLp" INTEGER,
    "currentTier" TEXT,
    "currentDivision" TEXT,
    "currentLeaguePoints" INTEGER,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "carriedLp" INTEGER NOT NULL DEFAULT 0,
    "carriedWins" INTEGER NOT NULL DEFAULT 0,
    "carriedLosses" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "seasonEntryId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" "CompetitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SideEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideEventEntry" (
    "id" TEXT NOT NULL,
    "sideEventId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SideEventEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreAdjustment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "seasonEntryId" TEXT,
    "sideEventEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_discordId_key" ON "Player"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE INDEX "Season_status_idx" ON "Season"("status");

-- CreateIndex
CREATE INDEX "SeasonEntry_seasonId_active_idx" ON "SeasonEntry"("seasonId", "active");

-- CreateIndex
CREATE INDEX "SeasonEntry_playerId_active_idx" ON "SeasonEntry"("playerId", "active");

-- CreateIndex
CREATE INDEX "DailySnapshot_seasonEntryId_takenAt_idx" ON "DailySnapshot"("seasonEntryId", "takenAt");

-- CreateIndex
CREATE INDEX "SideEvent_status_idx" ON "SideEvent"("status");

-- CreateIndex
CREATE INDEX "SideEventEntry_sideEventId_active_idx" ON "SideEventEntry"("sideEventId", "active");

-- CreateIndex
CREATE INDEX "SideEventEntry_playerId_active_idx" ON "SideEventEntry"("playerId", "active");

-- CreateIndex
CREATE INDEX "ScoreAdjustment_seasonEntryId_idx" ON "ScoreAdjustment"("seasonEntryId");

-- CreateIndex
CREATE INDEX "ScoreAdjustment_sideEventEntryId_idx" ON "ScoreAdjustment"("sideEventEntryId");

-- AddForeignKey
ALTER TABLE "SeasonEntry" ADD CONSTRAINT "SeasonEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonEntry" ADD CONSTRAINT "SeasonEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySnapshot" ADD CONSTRAINT "DailySnapshot_seasonEntryId_fkey" FOREIGN KEY ("seasonEntryId") REFERENCES "SeasonEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideEventEntry" ADD CONSTRAINT "SideEventEntry_sideEventId_fkey" FOREIGN KEY ("sideEventId") REFERENCES "SideEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideEventEntry" ADD CONSTRAINT "SideEventEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreAdjustment" ADD CONSTRAINT "ScoreAdjustment_seasonEntryId_fkey" FOREIGN KEY ("seasonEntryId") REFERENCES "SeasonEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreAdjustment" ADD CONSTRAINT "ScoreAdjustment_sideEventEntryId_fkey" FOREIGN KEY ("sideEventEntryId") REFERENCES "SideEventEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
