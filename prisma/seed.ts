import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding... 🚀");

  // --- 1. SEED POSISI / BIDANG ---
  const bidangData = [
    "Sub Bagian Keuangan",
    "Sub Bagian Kepegawaian",
    "Sub Bagian Umum",
    "Bidang Perencanaan dan Pengembangan Mutu Pendidikan, Pemuda, dan Olahraga",
    "Bidang Pembinaan Sekolah Menengah Atas",
    "Bidang Pembinaan Sekolah Menengah Kejuruan",
    "Bidang Pendidikan Khusus dan Layanan Khusus",
  ];

  console.log("Seeding Positions...");
  for (const title of bidangData) {
    // Random quota 1-5
    const randomQuota = Math.floor(Math.random() * 5) + 1;

    // Cek dulu biar ga double kalo run seed berkali-kali
    const existingPosition = await prisma.position.findFirst({
      where: { title },
    });

    if (!existingPosition) {
      await prisma.position.create({
        data: {
          title: title,
          quota: randomQuota,
          filled: 0,
          description: `Posisi magang untuk ${title}`,
        },
      });
      console.log(`✅ Created Position: ${title} (Quota: ${randomQuota})`);
    } else {
      console.log(`⏩ Skipped Position: ${title} (Already exists)`);
    }
  }

  // --- 2. SEED ADMIN ---
  console.log("Seeding Admin...");
  const adminUsername = "admin";
  const adminPasswordRaw = "password123"; // Ganti sesuka lo

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);

  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });
    console.log(
      `✅ Created Admin: ${adminUsername} (Pass: ${adminPasswordRaw})`
    );
  } else {
    console.log(`⏩ Skipped Admin: ${adminUsername} (Already exists)`);
  }

  console.log("Seeding finished. Mantap! 🔥");
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
