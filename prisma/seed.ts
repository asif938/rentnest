import bcrypt from "bcrypt";
import { Role } from "../generated/prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@rentnest.com",
    },
    update: {},
    create: {
      name: "Admin",
      email: "admin@rentnest.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });


  const categories = [
    "Apartment",
    "House",
    "Studio",
    "Villa",
    "Duplex",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


