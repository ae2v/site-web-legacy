ALTER TABLE "Ticket" ADD COLUMN "registrationId" TEXT;

CREATE UNIQUE INDEX "Ticket_registrationId_key" ON "Ticket"("registrationId");

CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");

CREATE INDEX "Ticket_userId_createdAt_idx" ON "Ticket"("userId", "createdAt");

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
