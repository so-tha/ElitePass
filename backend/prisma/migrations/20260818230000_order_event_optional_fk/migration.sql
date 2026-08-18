-- Order.eventId can reference an external (Ticketmaster/TMDB) id that has no
-- row in "Event", so it must not be constrained by a foreign key. The FK now
-- lives on a separate nullable "localEventId" column, populated only when
-- the order is for a locally-organized event.

ALTER TABLE "Order" DROP CONSTRAINT "Order_eventId_fkey";

ALTER TABLE "Order" ADD COLUMN "localEventId" TEXT;

ALTER TABLE "Order" ADD CONSTRAINT "Order_localEventId_fkey" FOREIGN KEY ("localEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
