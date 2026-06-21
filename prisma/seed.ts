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
    // Quota bawaan sesuai revisi (Keuangan = 4, SMA = 3), sisanya random 1-5
    let quota = Math.floor(Math.random() * 5) + 1;
    if (title === "Sub Bagian Keuangan") {
      quota = 4;
    } else if (title === "Bidang Pembinaan Sekolah Menengah Atas") {
      quota = 3;
    }

    // Cek dulu biar ga double kalo run seed berkali-kali
    const existingPosition = await prisma.position.findFirst({
      where: { title },
    });

    if (!existingPosition) {
      await prisma.position.create({
        data: {
          title: title,
          quota: quota,
          filled: 0,
          description: `Posisi magang untuk ${title}`,
        },
      });
      console.log(`✅ Created Position: ${title} (Quota: ${quota})`);
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
