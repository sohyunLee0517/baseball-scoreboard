/*
  Warnings:

  - The primary key for the `Inning` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `awayScore` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `homeScore` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `inningNo` on the `Inning` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `Inning` table. All the data in the column will be lost.
  - The `id` column on the `Inning` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `BatRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Match` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PitchRecord` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gameId` to the `Inning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inningNumber` to the `Inning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topBottom` to the `Inning` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "TopBottom" AS ENUM ('TOP', 'BOTTOM');

-- DropForeignKey
ALTER TABLE "BatRecord" DROP CONSTRAINT "BatRecord_matchId_fkey";

-- DropForeignKey
ALTER TABLE "Inning" DROP CONSTRAINT "Inning_matchId_fkey";

-- DropForeignKey
ALTER TABLE "PitchRecord" DROP CONSTRAINT "PitchRecord_matchId_fkey";

-- AlterTable
ALTER TABLE "Inning" DROP CONSTRAINT "Inning_pkey",
DROP COLUMN "awayScore",
DROP COLUMN "homeScore",
DROP COLUMN "inningNo",
DROP COLUMN "matchId",
ADD COLUMN     "errors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameId" INTEGER NOT NULL,
ADD COLUMN     "hits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inningNumber" INTEGER NOT NULL,
ADD COLUMN     "runs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topBottom" "TopBottom" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Inning_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "BatRecord";

-- DropTable
DROP TABLE "Match";

-- DropTable
DROP TABLE "PitchRecord";

-- DropEnum
DROP TYPE "BatResult";

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "team" "TeamSide" NOT NULL,
    "position" TEXT,
    "backNumber" TEXT,
    "lineupOrder" INTEGER,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inning" ADD CONSTRAINT "Inning_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
