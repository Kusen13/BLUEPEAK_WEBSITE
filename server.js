require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsPath));

// API routes
const apiRoutes = require('./src/routes/api');
app.use('/api', apiRoutes);

// Admin dashboard static route (before wildcards)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve general static website pages
app.use(express.static(path.join(__dirname)));

// Fallback for HTML routing
app.use((req, res, next) => {
  // If request is for an API or assets, don't serve index.html
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.includes('.')) {
    return next();
  }
  // If the user goes to /admin, send the admin panel entry point
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }
  // Otherwise send the home page
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  BLUEPEAK CMS SERVER IS RUNNING ON PORT ${PORT}`);
  console.log(`  Access Site: http://localhost:${PORT}`);
  console.log(`  Access Admin: http://localhost:${PORT}/admin`);
  console.log(`==================================================`);
});
