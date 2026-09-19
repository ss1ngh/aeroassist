import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.event.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();

  const priya = await prisma.customer.create({
    data: {
      name: "Priya Nair",
      email: "priya.nair@example.com",
      loyaltyTier: "gold",
    },
  });

  const arvind = await prisma.customer.create({
    data: {
      name: "Arvind Kulkarni",
      email: "arvind.kulkarni@example.com",
      loyaltyTier: "silver",
    },
  });

  const meher = await prisma.customer.create({
    data: {
      name: "Meher Kaur",
      email: "meher.kaur@example.com",
      loyaltyTier: "platinum",
    },
  });

  console.log(`Created customers: ${priya.id}, ${arvind.id}, ${meher.id}`);

  // Create bookings
  const bookings = await Promise.all([
    // Priya Nair - Cancelled flight (Delhi → Goa) Wed 23 Sep 2026
    prisma.booking.create({
      data: {
        customerId: priya.id,
        pnr: "SK4821X",
        flightNumber: "SK-204",
        origin: "DEL",
        destination: "GOI",
        scheduledDeparture: new Date("2026-09-23T13:10:00Z"), // 18:40 IST = 13:10 UTC
        status: "cancelled",
        fareClass: "economy",
      },
    }),
    // Priya Nair - Return flight (Goa → Delhi) Fri 25 Sep 2026 (Unaffected)
    prisma.booking.create({
      data: {
        customerId: priya.id,
        pnr: "SK4821R",
        flightNumber: "SK-204R",
        origin: "GOI",
        destination: "DEL",
        scheduledDeparture: new Date("2026-09-25T10:50:00Z"), // 16:20 IST = 10:50 UTC
        status: "on_time",
        fareClass: "economy",
      },
    }),
    // Arvind Kulkarni - Delayed 4h (Mumbai → Bengaluru) Wed 23 Sep 2026
    prisma.booking.create({
      data: {
        customerId: arvind.id,
        pnr: "TR1190B",
        flightNumber: "SK-118",
        origin: "BOM",
        destination: "BLR",
        scheduledDeparture: new Date("2026-09-22T23:40:00Z"), // 07:10 IST = 23:40 UTC (Sep 22)
        status: "delayed",
        fareClass: "economy",
      },
    }),
    // Meher Kaur - Delayed 6h (Delhi → Hyderabad) Wed 23 Sep 2026
    prisma.booking.create({
      data: {
        customerId: meher.id,
        pnr: "WL7742",
        flightNumber: "SK-305",
        origin: "DEL",
        destination: "HYD",
        scheduledDeparture: new Date("2026-09-23T08:30:00Z"), // 14:00 IST = 08:30 UTC
        status: "delayed",
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
