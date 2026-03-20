-- CreateTable
CREATE TABLE "scoreboard_games" (
    "id" SERIAL NOT NULL,
    "ownerId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoreboard_games_pkey" PRIMARY KEY ("id")
);
