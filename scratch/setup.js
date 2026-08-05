const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'PRINCIPAL' },
  });

  for (const user of users) {
    if (!user.schoolId) continue;

    console.log(`Checking school ${user.schoolId}...`);

    let session = await prisma.academicSession.findFirst({
      where: { schoolId: user.schoolId, name: '2026-2027' }
    });

    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          schoolId: user.schoolId,
          name: '2026-2027',
          startDate: new Date('2026-04-01T00:00:00Z'),
          endDate: new Date('2027-03-31T23:59:59Z'),
          isActive: true,
        }
      });
      console.log(`Created Academic Session '2026-2027' for school ${user.schoolId}`);
    } else if (!session.isActive) {
      await prisma.academicSession.update({
        where: { id: session.id },
        data: { isActive: true }
      });
      console.log(`Activated Academic Session '2026-2027' for school ${user.schoolId}`);
    }

    let seq = await prisma.documentSequence.findUnique({
      where: { schoolId: user.schoolId }
    });
    if (!seq) {
      try {
        await prisma.documentSequence.create({
          data: {
            schoolId: user.schoolId,
            academicSessionId: session.id,
            receiptNextSequence: 1,
            invoiceNextSequence: 1
          }
        });
        console.log(`Created Document Sequence for school ${user.schoolId}`);
      } catch (err) {
        // Ignore unique constraint error if it already exists but query missed it
      }
    }
    
    const existingClasses = await prisma.class.count({ where: { schoolId: user.schoolId } });
    if (existingClasses === 0) {
      for (let i = 1; i <= 10; i++) {
        await prisma.class.create({
          data: {
            schoolId: user.schoolId,
            name: i.toString(),
            section: 'A',
            isActive: true,
          }
        });
      }
      console.log(`Created default Classes 1-10 Section A for school ${user.schoolId}`);
    }
  }

  console.log("Done.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
