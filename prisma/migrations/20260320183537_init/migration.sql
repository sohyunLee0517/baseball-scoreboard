-- CreateEnum
CREATE TYPE "BatResult" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOME_RUN', 'INFIELD_HIT', 'GROUND_OUT_1', 'GROUND_OUT_3', 'GROUND_OUT_4', 'GROUND_OUT_5', 'GROUND_OUT_6', 'FLY_OUT_7', 'FLY_OUT_8', 'FLY_OUT_9', 'FLY_OUT_78', 'FLY_OUT_89', 'LINE_OUT_3', 'LINE_OUT_4', 'LINE_OUT_5', 'LINE_OUT_6', 'STRIKEOUT', 'WALK', 'HIT_BY_PITCH', 'REACH_ON_ERROR', 'SACRIFICE_BUNT', 'SACRIFICE_FLY', 'DOUBLE_PLAY', 'FIELDERS_CHOICE');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inning" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inningNo" INTEGER NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,

    CONSTRAINT "Inning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatRecord" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "batOrder" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,

    CONSTRAINT "BatRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InningResult" (
    "id" TEXT NOT NULL,
    "batRecordId" TEXT NOT NULL,
    "inningNo" INTEGER NOT NULL,
    "result" "BatResult" NOT NULL,

    CONSTRAINT "InningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PitchRecord" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "innings" DOUBLE PRECISION NOT NULL,
    "hits" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,

    CONSTRAINT "PitchRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inning" ADD CONSTRAINT "Inning_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatRecord" ADD CONSTRAINT "BatRecord_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InningResult" ADD CONSTRAINT "InningResult_batRecordId_fkey" FOREIGN KEY ("batRecordId") REFERENCES "BatRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitchRecord" ADD CONSTRAINT "PitchRecord_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
