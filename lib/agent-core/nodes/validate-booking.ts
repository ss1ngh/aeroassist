import { prisma } from "../../db";
import type { AgentStateType } from "../state";

/**
 * Validate that the customer and booking exist in the database.
 * If the PNR doesn't match a real booking, treat it as missing information.
 * This prevents the agent from acting on hallucinated slot values.
 *
 * One PNR can cover multiple flight segments (e.g., outbound + return).
 * If a flight number is provided, we narrow to that specific segment.
 */
export async function validateBooking(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.filledSlots) {
    return {};
  }

  const pnr = state.filledSlots.pnr as string | undefined;
  const customerName = state.filledSlots.customerName as string | undefined;
  const flightNumber = state.filledSlots.flightNumber as string | undefined;

  // If no PNR provided yet, nothing to validate
  if (!pnr) {
    return {};
  }

  // Look up ALL bookings with this PNR (one PNR can cover multiple segments)
  const bookings = await prisma.booking.findMany({
    where: { pnr },
    include: { customer: true },
  });

  if (bookings.length === 0) {
    // PNR doesn't exist in database — clear it and ask again
    const cleaned = { ...state.filledSlots };
    delete cleaned.pnr;
    return {
      filledSlots: cleaned,
      missingSlots: [...state.missingSlots.filter((s) => s !== "pnr"), "pnr"],
    };
  }

  // If customerName was provided, verify it matches the booking owner
  if (customerName) {
    const nameMatches = bookings[0].customer.name.toLowerCase().includes(customerName.toLowerCase())
      || customerName.toLowerCase().includes(bookings[0].customer.name.toLowerCase());

    if (!nameMatches) {
      // Name doesn't match — clear both and ask again
      const cleaned = { ...state.filledSlots };
      delete cleaned.pnr;
      delete cleaned.customerName;
      return {
        filledSlots: cleaned,
        missingSlots: [...state.missingSlots.filter((s) => s !== "pnr" && s !== "customerName"), "pnr", "customerName"],
      };
    }
  }

  // If multiple segments exist and no flight number provided, ask which flight
  if (bookings.length > 1 && !flightNumber) {
    const flightList = bookings
      .map((b) => `${b.flightNumber} (${b.origin}→${b.destination}, ${b.status})`)
      .join(", ");
    return {
      filledSlots: { ...state.filledSlots, _availableFlights: flightList },
      missingSlots: [...state.missingSlots.filter((s) => s !== "flightNumber"), "flightNumber"],
    };
  }

  // Pick the specific booking if flight number provided, otherwise use the first (or only) one
  const booking = flightNumber
    ? bookings.find((b) => b.flightNumber.toLowerCase() === flightNumber.toLowerCase()) ?? bookings[0]
    : bookings[0];

  // Booking validated — enrich slots with real booking data
  return {
    filledSlots: {
      ...state.filledSlots,
      _validatedBookingId: booking.id,
      _validatedCustomerId: booking.customerId,
      flightNumber: booking.flightNumber,
      origin: booking.origin,
      destination: booking.destination,
      fareClass: booking.fareClass,
      bookingStatus: booking.status,
    },
  };
}
