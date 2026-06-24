const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Show all admin users
  const admins = await prisma.admin.findMany({ select: { id: true, username: true, createdAt: true } });
  console.log('=== ADMIN USERS IN DATABASE ===');
  console.log(JSON.stringify(admins, null, 2));

  // Reset admin password to known value
  const hashedPassword = await bcrypt.hash('bluepeak2026', 10);
  if (admins.length > 0) {
    await prisma.admin.update({
      where: { id: admins[0].id },
      data: { password: hashedPassword }
    });
    console.log(`\n✅ Password RESET for admin: "${admins[0].username}"`);
    console.log('   New password: bluepeak2026');
  }

  // Show settings count
  const settingsCount = await prisma.websiteSettings.count();
  const servicesCount = await prisma.service.count();
  const testimonialsCount = await prisma.testimonial.count();
  console.log(`\n=== DATABASE RECORD COUNTS ===`);
  console.log(`Settings    : ${settingsCount}`);
  console.log(`Services    : ${servicesCount}`);
  console.log(`Testimonials: ${testimonialsCount}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
