-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiFootballId" INTEGER,
    "country" TEXT NOT NULL DEFAULT 'Brazil',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "apiFootballId" INTEGER NOT NULL,
    "leagueName" TEXT NOT NULL,
    "leagueApiId" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "round" TEXT,
    "homeTeamName" TEXT NOT NULL,
    "homeTeamApiId" INTEGER NOT NULL,
    "homeTeamLogo" TEXT,
    "awayTeamName" TEXT NOT NULL,
    "awayTeamApiId" INTEGER NOT NULL,
    "awayTeamLogo" TEXT,
    "homeGoals" INTEGER,
    "awayGoals" INTEGER,
    "homeGoalsHT" INTEGER,
    "awayGoalsHT" INTEGER,
    "venueName" TEXT,
    "venueCity" TEXT,
    "kickoff" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "statusShort" TEXT,
    "rawStatsJson" TEXT,
    "rawPredictionJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fixture_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fixtureId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT,
    "body" TEXT,
    "dataJson" TEXT,
    "error" TEXT,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Content_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Club_apiFootballId_key" ON "Club"("apiFootballId");

-- CreateIndex
CREATE INDEX "Club_active_idx" ON "Club"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_apiFootballId_key" ON "Fixture"("apiFootballId");

-- CreateIndex
CREATE INDEX "Fixture_clubId_kickoff_idx" ON "Fixture"("clubId", "kickoff");

-- CreateIndex
CREATE INDEX "Fixture_status_idx" ON "Fixture"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Content_fixtureId_stage_key" ON "Content"("fixtureId", "stage");
