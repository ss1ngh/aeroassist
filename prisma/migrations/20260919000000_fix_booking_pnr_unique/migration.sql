-- Drop the incorrect solo unique index on pnr
DROP INDEX "Booking_pnr_key";

-- Create the correct composite unique index on (pnr, flightNumber)
CREATE UNIQUE INDEX "Booking_pnr_flightNumber_key" ON "Booking"("pnr", "flightNumber");
