import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.event.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();

  // Create 3 customers with varying loyalty tiers
  const customer1 = await prisma.customer.create({
    data: {
      name: "Alice Johnson",
      email: "alice.johnson@email.com",
      loyaltyTier: "platinum",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Bob Martinez",
      email: "bob.martinez@email.com",
      loyaltyTier: "gold",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: "Charlie Kim",
      email: "charlie.kim@email.com",
      loyaltyTier: "silver",
    },
  });

  console.log(`Created customers: ${customer1.id}, ${customer2.id}, ${customer3.id}`);

  // Create 5-6 bookings covering different disruption scenarios
  const bookings = await Promise.all([
    // Alice - Cancelled flight (London to NYC)
    prisma.booking.create({
      data: {
        customerId: customer1.id,
        pnr: "ABC123",
        flightNumber: "AA100",
        origin: "LHR",
        destination: "JFK",
        scheduledDeparture: new Date("2026-09-20T08:00:00Z"),
        status: "cancelled",
        fareClass: "business",
      },
    }),
    // Alice - Delayed flight (NYC to LA)
    prisma.booking.create({
      data: {
        customerId: customer1.id,
        pnr: "DEF456",
        flightNumber: "AA200",
        origin: "JFK",
        destination: "LAX",
        scheduledDeparture: new Date("2026-09-22T14:00:00Z"),
        status: "delayed",
        fareClass: "business",
      },
    }),
    // Bob - Cancelled flight (Chicago to Miami)
    prisma.booking.create({
      data: {
        customerId: customer2.id,
        pnr: "GHI789",
        flightNumber: "UA300",
        origin: "ORD",
        destination: "MIA",
        scheduledDeparture: new Date("2026-09-21T10:30:00Z"),
        status: "cancelled",
        fareClass: "premium_economy",
      },
    }),
    // Bob - Delayed flight (Miami to Seattle)
    prisma.booking.create({
      data: {
        customerId: customer2.id,
        pnr: "JKL012",
        flightNumber: "UA400",
        origin: "MIA",
        destination: "SEA",
        scheduledDeparture: new Date("2026-09-23T16:00:00Z"),
        status: "delayed",
        fareClass: "economy",
      },
    }),
    // Charlie - Cancelled flight (SF to Denver)
    prisma.booking.create({
      data: {
        customerId: customer3.id,
        pnr: "MNO345",
        flightNumber: "DL500",
        origin: "SFO",
        destination: "DEN",
        scheduledDeparture: new Date("2026-09-19T09:00:00Z"),
        status: "cancelled",
        fareClass: "economy",
      },
    }),
    // Charlie - Delayed flight (Denver to Boston)
    prisma.booking.create({
      data: {
        customerId: customer3.id,
        pnr: "PQR678",
        flightNumber: "DL600",
        origin: "DEN",
        destination: "BOS",
        scheduledDeparture: new Date("2026-09-24T12:00:00Z"),
        status: "on_time",
        fareClass: "economy",
      },
    }),
  ]);

  console.log(`Created ${bookings.length} bookings`);
  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
