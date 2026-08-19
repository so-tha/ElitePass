-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('HELD', 'SOLD');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "seatLabels" JSONB;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "seatLabel" TEXT;

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL,
    "heldByUserId" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_eventId_label_key" ON "Seat"("eventId", "label");

-- CreateIndex
CREATE INDEX "Seat_eventId_idx" ON "Seat"("eventId");
