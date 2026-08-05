import { prisma } from './lib/prisma';

async function main() {
  await prisma.invoice.updateMany({
    data: { pdfUrl: null }
  });
  console.log("Cleared PDF cache for all invoices.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
