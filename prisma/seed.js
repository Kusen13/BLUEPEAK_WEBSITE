const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log(`Admin user created/verified: ${admin.username}`);

  // 2. Default Website Settings
  const settings = [
    { key: 'hero_headline_line1', value: 'We Plan,' },
    { key: 'hero_headline_line2', value: 'We Build Dreams Fulfilled' },
    { key: 'hero_subheadline', value: 'Professional General Contracting & Design-Build Solutions.' },
    { key: 'hero_image', value: 'images/hero-construction.jpg' },
    { key: 'contact_email', value: 'bluepeakbuilderscorporation@gmail.com' },
    { key: 'contact_phone', value: '09088515155' },
    { key: 'contact_address', value: '8 Nicanor Don Manuel, Quezon City' },
    { key: 'social_facebook', value: 'https://www.facebook.com/bluepeakbuilderscorp' },
    { key: 'developer_name', value: 'Angelo Dela cruz' },
    { key: 'stats_projects_count', value: '150+' },
    { key: 'stats_clients_count', value: '120+' },
    { key: 'stats_experience_years', value: '10+' },
    { key: 'announcement_active', value: 'false' },
    { key: 'announcement_text', value: 'Welcome to Bluepeak Builders Corporation CMS Website!' },
  ];

  for (const s of settings) {
    await prisma.websiteSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('Settings seeded.');

  // 3. Projects
  const projects = [
    {
      title: 'JLC Building',
      category: 'commercial',
      beforeImage: 'images/JLC-building-before.JPG',
      afterImage: 'images/JLC-building.JPG',
      description: 'Executed structural development and sleek commercial building finishes, delivering high-efficiency office spaces and a premium exterior design.',
      duration: 'Aug 2024 – Nov 2025 (15 Months)',
      status: 'Completed',
      order: 1,
    },
    {
      title: 'Lucban Residential',
      category: 'residential',
      beforeImage: 'images/lucban-residential-before.JPG',
      afterImage: 'images/lucban-residential-after.JPG',
      description: 'Crafted a high-end, contemporary custom residential residence utilizing premium finishes, spacious layout planning, and durable modern framing.',
      duration: 'Jan 2025 – Sep 2025 (9 Months)',
      status: 'Completed',
      order: 2,
    },
    {
      title: 'Lolly Inn',
      category: 'renovation',
      beforeImage: 'images/LOLLY-INN-before.jpg',
      afterImage: 'images/LOLLY-INN-after.jpg',
      description: 'Completed full exterior and interior renovation, restoring structural integrity and applying premium updates to this beautiful commercial hospitality building.',
      duration: 'Feb 2025 – Nov 2025 (9 Months)',
      status: 'Completed',
      order: 3,
    },
  ];

  for (const p of projects) {
    const existing = await prisma.project.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.project.create({ data: p });
    }
  }
  console.log('Projects seeded.');

  // 4. Testimonials
  const testimonials = [
    {
      author: 'Robert Chen',
      position: 'Property Owner',
      quote: 'Bluepeak Builders delivered our project on time and exactly within our target budget. Their focus on structural durability, site safety, and clear communication made the construction process extremely smooth.',
      rating: 5,
    },
    {
      author: 'Maria Torres',
      position: 'Commercial Developer',
      quote: 'Their design and build solution was exactly what we needed. They managed the entire design phase, permit processing, and construction execution flawlessly, keeping us updated at every single milestone.',
      rating: 5,
    },
    {
      author: 'Jonathan Diaz',
      position: 'Business Owner',
      quote: 'Professionalism, transparency, and top-tier craftsmanship. Bluepeak Builders Corp. renovated our office headquarters and exceeded our expectations with their attention to detail and modern style.',
      rating: 5,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { author: t.author } });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }
  console.log('Testimonials seeded.');

  // 5. Services
  const services = [
    {
      name: 'General Contracting & Construction',
      icon: 'fas fa-cubes',
      description: 'From groundbreaking to the final coat of paint, we manage every phase of the construction process. Our team ensures that all structural components meet international safety standards and local building codes.',
      bullets: JSON.stringify([
        'Residential Projects: Custom-built homes, townhouses, and condominium developments.',
        'Commercial Buildings: Office spaces, retail hubs, showrooms, and mixed-use structures.'
      ]),
      order: 1,
    },
    {
      name: 'Design & Build Solutions',
      icon: 'fas fa-drafting-compass',
      description: 'We offer a streamlined "Design-Build" approach that integrates architectural design and construction services under one roof. This minimizes communication gaps, reduces project timelines, and provides clients with a single point of accountability.',
      bullets: JSON.stringify([
        'Conceptual Planning & Blueprints',
        'Interior Fit-outs and Space Planning'
      ]),
      order: 2,
    },
    {
      name: 'Project Management & Consultancy',
      icon: 'fas fa-tasks',
      description: 'For clients who already have a design team, we step in as professional project managers. We oversee subcontractors, manage procurement, and maintain strict quality control to ensure the project stays on budget and on schedule.',
      bullets: JSON.stringify([
        'Cost Estimation & Quantity Surveying',
        'Site Supervision & Safety Monitoring'
      ]),
      order: 3,
    },
    {
      name: 'Civil Works & Infrastructure',
      icon: 'fas fa-road',
      description: 'Beyond vertical structures, Bluepeak Builders Corp. handles essential horizontal construction and land development projects.',
      bullets: JSON.stringify([
        'Site Clearing & Earthworks',
        'Pavements and Drainage Systems'
      ]),
      order: 4,
    },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
    }
  }
  console.log('Services seeded.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
