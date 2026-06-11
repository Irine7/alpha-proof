import { prisma } from "../src/db/prisma.js";

async function main() {
  if (process.env.CONFIRM_DEV_CLEAN_SIGNALS !== "YES") {
    throw new Error(
      "Refusing to clean signals. Set CONFIRM_DEV_CLEAN_SIGNALS=YES only for disposable dev data. This script is not run automatically."
    );
  }

  const result = await prisma.signal.deleteMany();
  console.log(`Deleted ${result.count} Signal records from the configured database.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
