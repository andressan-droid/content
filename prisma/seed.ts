import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { CLUB_SEEDS } from "../src/lib/clubs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const seed of CLUB_SEEDS) {
    await prisma.club.upsert({
      where: { slug: seed.slug },
      create: {
        name: seed.name,
        shortName: seed.shortName,
        slug: seed.slug,
      },
      update: {
        name: seed.name,
        shortName: seed.shortName,
      },
    });
  }
  console.log(`Seed concluído: ${CLUB_SEEDS.length} clubes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
