// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai seeding...");

  // Bikin data Divisi
  const divisions = [
    {
      name: "Dinas Kominfo",
      quota: 5,
      description: "Ngurusin jaringan dan website dinas.",
    },
    {
      name: "Dinas Pariwisata",
      quota: 3,
      description: "Promosi wisata daerah.",
    },
    { name: "Bagian Umum", quota: 2, description: "Administrasi perkantoran." },
    { name: "Bagian Keuangan", quota: 4, description: "Audit dan akuntansi." },
  ];

  for (const div of divisions) {
    await prisma.division.upsert({
      where: { headOfDivisionId: "dummy-id" }, // Hack dikit biar ga error unique, nanti di-adjust
      update: {},
      create: {
        name: div.name,
        quota: div.quota,
        description: div.description,
      },
    });
  }

  console.log("Seeding selesai!");
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
