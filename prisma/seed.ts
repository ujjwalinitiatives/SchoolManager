import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create a School
  let school = await prisma.school.findFirst({
    where: { name: "Springfield High School" },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "Springfield High School",
        address: "123 Evergreen Terrace",
      },
    });
  }

  console.log(`Verified school: ${school.name}`);

  // 2. Create Admin Users
  const principal = await prisma.user.upsert({
    where: { email: "principal@springfield.edu" },
    update: {},
    create: {
      email: "principal@springfield.edu",
      name: "Seymour Skinner",
      role: Role.PRINCIPAL,
      schoolId: school.id,
      emailVerified: true,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: "accountant@springfield.edu" },
    update: {},
    create: {
      email: "accountant@springfield.edu",
      name: "Gary Chalmers",
      role: Role.ACCOUNTANT,
      schoolId: school.id,
      emailVerified: true,
    },
  });

  console.log("Created admin users:", principal.email, accountant.email);

  // 3. Create an Academic Session
  const session = await prisma.academicSession.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "2026-27",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "2026-27",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isActive: true,
    },
  });

  console.log(`Created academic session: ${session.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
