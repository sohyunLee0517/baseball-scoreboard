/*
  Warnings:

  - The primary key for the `Inning` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `errors` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `hits` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `inningNumber` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `runs` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `topBottom` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `awayScore` to the `Inning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeScore` to the `Inning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inningNo` to the `Inning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchId` to the `Inning` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BatResult" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'HOME_RUN', 'INFIELD_HIT', 'GROUND_OUT_1', 'GROUND_OUT_3', 'GROUND_OUT_4', 'GROUND_OUT_5', 'GROUND_OUT_6', 'FLY_OUT_7', 'FLY_OUT_8', 'FLY_OUT_9', 'FLY_OUT_78', 'FLY_OUT_89', 'LINE_OUT_3', 'LINE_OUT_4', 'LINE_OUT_5', 'LINE_OUT_6', 'STRIKEOUT', 'WALK', 'HIT_BY_PITCH', 'REACH_ON_ERROR', 'SACRIFICE_BUNT', 'SACRIFICE_FLY', 'DOUBLE_PLAY', 'FIELDERS_CHOICE');

-- DropForeignKey
ALTER TABLE "Inning" DROP CONSTRAINT "Inning_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_gameId_fkey";

-- AlterTable
ALTER TABLE "Inning" DROP CONSTRAINT "Inning_pkey",
DROP COLUMN "errors",
DROP COLUMN "gameId",
DROP COLUMN "hits",
DROP COLUMN "inningNumber",
DROP COLUMN "runs",
DROP COLUMN "topBottom",
ADD COLUMN     "awayScore" INTEGER NOT NULL,
ADD COLUMN     "homeScore" INTEGER NOT NULL,
ADD COLUMN     "inningNo" INTEGER NOT NULL,
ADD COLUMN     "matchId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Inning_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Inning_id_seq";

-- DropTable
DROP TABLE "Game";

-- DropTable
DROP TABLE "Player";

-- DropEnum
DROP TYPE "GameStatus";

-- DropEnum
DROP TYPE "TeamSide";

-- DropEnum
DROP TYPE "TopBottom";

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
CREATE TABLE "BatRecord" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "batOrder" INTEGER NOT NULL,
    "inningNo" INTEGER NOT NULL,
    "result" "BatResult" NOT NULL,

    CONSTRAINT "BatRecord_pkey" PRIMARY KEY ("id")
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
ALTER TABLE "PitchRecord" ADD CONSTRAINT "PitchRecord_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
