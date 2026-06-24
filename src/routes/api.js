const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const auth = require('../middleware/auth');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'bluepeak_builders_secret_key_2026_xyz';

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed!'));
  }
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: req.admin.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
});

router.get('/auth/me', auth, (req, res) => {
  res.json({ id: req.admin.id, username: req.admin.username });
});

// ==========================================
// 2. PROJECTS CRUD
// ==========================================
router.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { order: 'asc' },
      include: { images: true }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
});

router.post('/projects', auth, upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.beforeImage) data.beforeImage = 'uploads/' + req.files.beforeImage[0].filename;
      if (req.files.afterImage) data.afterImage = 'uploads/' + req.files.afterImage[0].filename;
    }

    // Convert order if present
    if (data.order) data.order = parseInt(data.order, 10);

    const project = await prisma.project.create({ data });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
});

router.put('/projects/:id', auth, upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.beforeImage) data.beforeImage = 'uploads/' + req.files.beforeImage[0].filename;
      if (req.files.afterImage) data.afterImage = 'uploads/' + req.files.afterImage[0].filename;
    }

    if (data.order) data.order = parseInt(data.order, 10);
    delete data.id; // Avoid modifying primary key

    const project = await prisma.project.update({
      where: { id: parseInt(id, 10) },
      data
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
});

router.delete('/projects/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.project.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
});

// ==========================================
// 3. SERVICES CRUD
// ==========================================
router.get('/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
});

router.post('/services', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.isFeatured) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
    if (data.order) data.order = parseInt(data.order, 10);
    if (data.bullets && typeof data.bullets === 'string') {
      try {
        data.bullets = JSON.parse(data.bullets);
      } catch (e) {
        data.bullets = data.bullets.split('\n').filter(b => b.trim() !== '');
      }
    }

    const service = await prisma.service.create({ data });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
});

router.put('/services/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = { ...req.body };
    if (data.isFeatured) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
    if (data.order) data.order = parseInt(data.order, 10);
    if (data.bullets && typeof data.bullets === 'string') {
      try {
        data.bullets = JSON.parse(data.bullets);
      } catch (e) {
        data.bullets = data.bullets.split('\n').filter(b => b.trim() !== '');
      }
    }
    delete data.id;

    const service = await prisma.service.update({
      where: { id: parseInt(id, 10) },
      data
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
});

router.delete('/services/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.service.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
});

// ==========================================
// 4. TESTIMONIALS CRUD
// ==========================================
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch testimonials', error: error.message });
  }
});

router.get('/testimonials/all', auth, async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all testimonials', error: error.message });
  }
});

router.post('/testimonials', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.rating) data.rating = parseInt(data.rating, 10);
    // Unauthenticated submissions are not approved by default
    data.isApproved = req.headers.authorization ? true : false;

    const testimonial = await prisma.testimonial.create({ data });
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit testimonial', error: error.message });
  }
});

router.put('/testimonials/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = { ...req.body };
    if (data.rating) data.rating = parseInt(data.rating, 10);
    if (data.isApproved !== undefined) data.isApproved = data.isApproved === 'true' || data.isApproved === true;
    delete data.id;

    const testimonial = await prisma.testimonial.update({
      where: { id: parseInt(id, 10) },
      data
    });
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update testimonial', error: error.message });
  }
});

router.delete('/testimonials/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.testimonial.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete testimonial', error: error.message });
  }
});

// ==========================================
// 5. QUOTE REQUESTS
// ==========================================
router.post('/quotes', async (req, res) => {
  try {
    const quote = await prisma.quoteRequest.create({ data: req.body });
    res.status(201).json({ message: 'Quote request submitted successfully!', quote });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit quote request', error: error.message });
  }
});

router.get('/quotes', auth, async (req, res) => {
  try {
    const quotes = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quote requests', error: error.message });
  }
});

router.patch('/quotes/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const quote = await prisma.quoteRequest.update({
      where: { id: parseInt(id, 10) },
      data: { status }
    });
    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quote request status', error: error.message });
  }
});

router.delete('/quotes/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.quoteRequest.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: 'Quote request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quote request', error: error.message });
  }
});

// ==========================================
// 6. WEBSITE SETTINGS
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const allSettings = await prisma.websiteSettings.findMany();
    const settingsMap = {};
    allSettings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
});

router.post('/settings', auth, async (req, res) => {
  const settings = req.body; // Key-value object
  try {
    const promises = Object.keys(settings).map(key => {
      return prisma.websiteSettings.upsert({
        where: { key },
        update: { value: String(settings[key]) },
        create: { key, value: String(settings[key]) }
      });
    });
    await Promise.all(promises);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
});

// ==========================================
// 7. MEDIA LIBRARY
// ==========================================
router.post('/media', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'File uploaded successfully',
    url: 'uploads/' + req.file.filename
  });
});

router.get('/media', auth, (req, res) => {
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(uploadDir).map(file => {
      const stats = fs.statSync(path.join(uploadDir, file));
      return {
        name: file,
        url: 'uploads/' + file,
        size: stats.size,
        createdAt: stats.mtime
      };
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list media files', error: error.message });
  }
});

router.delete('/media/:filename', auth, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted successfully' });
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

// ==========================================
// 8. ANNOUNCEMENTS
// ==========================================
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
});

router.get('/announcements/all', auth, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all announcements', error: error.message });
  }
});

router.post('/announcements', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    const ann = await prisma.announcement.create({ data });
    res.status(201).json(ann);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
});

router.put('/announcements/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = { ...req.body };
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    delete data.id;
    const ann = await prisma.announcement.update({
      where: { id: parseInt(id, 10) },
      data
    });
    res.json(ann);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update announcement', error: error.message });
  }
});

router.delete('/announcements/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.announcement.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
});

// ==========================================
// 9. BLOG POSTS
// ==========================================
router.get('/blog', async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch published blog posts', error: error.message });
  }
});

router.get('/blog/all', auth, async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all blog posts', error: error.message });
  }
});

router.post('/blog', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.published !== undefined) data.published = data.published === 'true' || data.published === true;
    const post = await prisma.blogPost.create({ data });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create blog post', error: error.message });
  }
});

router.put('/blog/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = { ...req.body };
    if (data.published !== undefined) data.published = data.published === 'true' || data.published === true;
    delete data.id;
    const post = await prisma.blogPost.update({
      where: { id: parseInt(id, 10) },
      data
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update blog post', error: error.message });
  }
});

router.delete('/blog/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.blogPost.delete({ where: { id: parseInt(id, 10) } });
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete blog post', error: error.message });
  }
});

module.exports = router;
