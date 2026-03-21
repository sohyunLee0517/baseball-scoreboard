/*
  Warnings:

  - You are about to drop the column `atBats` on the `BatRecord` table. All the data in the column will be lost.
  - You are about to drop the column `hits` on the `BatRecord` table. All the data in the column will be lost.
  - You are about to drop the column `homeRuns` on the `BatRecord` table. All the data in the column will be lost.
  - You are about to drop the column `strikeouts` on the `BatRecord` table. All the data in the column will be lost.
  - You are about to drop the column `walks` on the `BatRecord` table. All the data in the column will be lost.
  - You are about to drop the `InningResult` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `inningNo` to the `BatRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `result` to the `BatRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InningResult" DROP CONSTRAINT "InningResult_batRecordId_fkey";

-- AlterTable
ALTER TABLE "BatRecord" DROP COLUMN "atBats",
DROP COLUMN "hits",
DROP COLUMN "homeRuns",
DROP COLUMN "strikeouts",
DROP COLUMN "walks",
ADD COLUMN     "inningNo" INTEGER NOT NULL,
ADD COLUMN     "result" "BatResult" NOT NULL;

-- DropTable
DROP TABLE "InningResult";
