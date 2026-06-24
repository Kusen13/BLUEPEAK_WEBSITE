const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bluepeak CMS database...\n');

  // ──────────────────────────────────────────
  // 1. DEFAULT ADMIN USER
  // ──────────────────────────────────────────
  const existingAdmin = await prisma.admin.findFirst();
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('bluepeak2026', 10);
    await prisma.admin.create({
      data: {
        username: 'bluepeakadmin',
        password: hashedPassword
      }
    });
    console.log('✅ Admin user created:');
    console.log('   Username : bluepeakadmin');
    console.log('   Password : bluepeak2026');
  } else {
    console.log('ℹ️  Admin user already exists — skipping.');
  }

  // ──────────────────────────────────────────
  // 2. DEFAULT WEBSITE SETTINGS
  // ──────────────────────────────────────────
  const defaultSettings = [
    { key: 'hero_headline_line1',    value: 'Building Reliability,' },
    { key: 'hero_headline_line2',    value: 'One Structure at a Time.' },
    { key: 'hero_subheadline',       value: 'Bluepeak Builders Corp. delivers premium construction and renovation services across the Philippines with precision, integrity, and excellence.' },
    { key: 'contact_email',          value: 'info@bluepeakbuilderscorp.com' },
    { key: 'contact_phone',          value: '+63 917 123 4567' },
    { key: 'contact_address',        value: 'Quezon City, Metro Manila, Philippines' },
    { key: 'social_facebook',        value: 'https://facebook.com/bluepeakbuilderscorp' },
    { key: 'developer_name',         value: 'Bluepeak Digital Team' },
    { key: 'stats_projects_count',   value: '150+' },
    { key: 'stats_clients_count',    value: '200+' },
    { key: 'stats_experience_years', value: '10+' }
  ];

  let settingsCreated = 0;
  for (const setting of defaultSettings) {
    const existing = await prisma.websiteSettings.findUnique({ where: { key: setting.key } });
    if (!existing) {
      await prisma.websiteSettings.create({ data: setting });
      settingsCreated++;
    }
  }
  console.log(`✅ Website settings seeded (${settingsCreated} new entries).`);

  // ──────────────────────────────────────────
  // 3. SAMPLE SERVICES
  // ──────────────────────────────────────────
  const existingServices = await prisma.service.count();
  if (existingServices === 0) {
    const services = [
      {
        name: 'Commercial Construction',
        icon: 'fas fa-building',
        description: 'Full-scale commercial building construction for offices, retail, and mixed-use developments.',
        isFeatured: true,
        bullets: JSON.stringify(['Design & Build', 'Structural Engineering', 'Project Management']),
        order: 1
      },
      {
        name: 'Residential Construction',
        icon: 'fas fa-home',
        description: 'Custom residential homes and subdivisions built to the highest quality standards.',
        isFeatured: true,
        bullets: JSON.stringify(['Custom Home Design', 'Budget Planning', 'Quality Materials']),
        order: 2
      },
      {
        name: 'Renovation & Fit-Out',
        icon: 'fas fa-paint-roller',
        description: 'Complete interior and exterior renovation services for existing structures.',
        isFeatured: true,
        bullets: JSON.stringify(['Interior Renovation', 'Facade Upgrades', 'Space Planning']),
        order: 3
      },
      {
        name: 'Infrastructure Projects',
        icon: 'fas fa-road',
        description: 'Roads, bridges, drainage systems and public utility infrastructure construction.',
        isFeatured: false,
        bullets: JSON.stringify(['Road Construction', 'Drainage Systems', 'Bridge Works']),
        order: 4
      }
    ];

    for (const s of services) {
      await prisma.service.create({ data: s });
    }
    console.log(`✅ ${services.length} sample services seeded.`);
  } else {
    console.log(`ℹ️  Services already exist — skipping.`);
  }

  // ──────────────────────────────────────────
  // 4. SAMPLE TESTIMONIALS
  // ──────────────────────────────────────────
  const existingTestimonials = await prisma.testimonial.count();
  if (existingTestimonials === 0) {
    const testimonials = [
      {
        author: 'Maria Santos',
        position: 'Homeowner, Quezon City',
        rating: 5,
        quote: 'Bluepeak Builders transformed our dream home into reality. Their team was professional, on time, and the quality exceeded our expectations. Highly recommended!',
        isApproved: true
      },
      {
        author: 'Roberto Dela Cruz',
        position: 'CEO, DLC Holdings',
        rating: 5,
        quote: 'We contracted Bluepeak for our commercial building project and they delivered outstanding results. Their project management and construction quality is world-class.',
        isApproved: true
      },
      {
        author: 'Jennifer Lim',
        position: 'Property Developer',
        rating: 5,
        quote: 'Excellent craftsmanship and attention to detail. Bluepeak handled our renovation project flawlessly — on budget and ahead of schedule.',
        isApproved: true
      }
    ];

    for (const t of testimonials) {
      await prisma.testimonial.create({ data: t });
    }
    console.log(`✅ ${testimonials.length} sample testimonials seeded.`);
  } else {
    console.log(`ℹ️  Testimonials already exist — skipping.`);
  }

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📋 Admin Login Credentials:');
  console.log('   URL      : http://localhost:5000/admin');
  console.log('   Username : bluepeakadmin');
  console.log('   Password : bluepeak2026');
  console.log('\nChange your password after first login.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
