const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/db');

// ============================================
// ENVIRONMENT CONFIGURATION - LOAD .env FIRST
// ============================================

// Try multiple paths to find .env
const envPaths = [
    path.join(__dirname, '../.env'),    // backend/.env
    path.join(__dirname, '.env'),       // backend/src/.env
    './.env'                            // current working directory
];

let envLoaded = false;
let loadedPath = '';

for (const envPath of envPaths) {
    try {
        if (fs.existsSync(envPath)) {
            const result = dotenv.config({ path: envPath });
            if (!result.error) {
                envLoaded = true;
                loadedPath = envPath;
                break;
            }
        }
    } catch (error) {
        // Continue to next path
    }
}

// ============================================
// ENVIRONMENT DEBUG
// ============================================

console.log('\n========================================');
console.log('🔍 ENVIRONMENT CONFIGURATION');
console.log('========================================');

if (envLoaded) {
    console.log(`✅ .env loaded from: ${loadedPath}`);
} else {
    console.log('❌ No .env file found. Using defaults.');
}

console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not Set'}`);
console.log(`📁 PORT: ${process.env.PORT || '5001 (default)'}`);
console.log(`📁 PROJECT_ID: ${process.env.PROJECT_ID || 'Not Set'}`);
console.log(`📁 MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not Set'}`);
console.log('========================================\n');

// ============================================
// EXPRESS APP
// ============================================

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://*.herokuapp.com'],
    credentials: true
}));

// Request logging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

// Body size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================

const uploadsDir = path.join(__dirname, 'uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');
const logosDir = path.join(uploadsDir, 'logos');
const productImagesDir = path.join(uploadsDir, 'product-images');

// Create directories if they don't exist
const dirs = [uploadsDir, profilePicturesDir, logosDir, productImagesDir];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir, {
    maxAge: '1d',
    etag: true
}));
app.use('/api/uploads', express.static(uploadsDir, {
    maxAge: '1d',
    etag: true
}));

// ============================================
// ✅ SERVE REACT FRONTEND (For Heroku)
// ============================================

// The frontend build directory
const frontendBuildPath = path.join(__dirname, '../../frontend/build');

// Check if frontend build exists
if (fs.existsSync(frontendBuildPath)) {
    console.log(`✅ Frontend build found at: ${frontendBuildPath}`);
    
    // Serve static files from React build
    app.use(express.static(frontendBuildPath, {
        maxAge: '1d',
        etag: true
    }));
} else {
    console.log(`⚠️ Frontend build not found at: ${frontendBuildPath}`);
    console.log('   Frontend will not be served from this server.');
}

// ============================================
// ROUTES
// ============================================

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const posRoutes = require('./routes/posRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const reportRoutes = require('./routes/reportRoutes');
const branchRoutes = require('./routes/branchRoutes');
const saleRoutes = require('./routes/saleRoutes');
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const phoneRoutes = require('./routes/phoneRoutes');
const electronicsRoutes = require('./routes/electronicsRoutes');

// ============================================
// API ENDPOINTS
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/electronics', electronicsRoutes);
app.use('/api/products/electronics', electronicsRoutes);

// ============================================
// HEALTH CHECK & ROOT ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'TRONIC_MASTER API is healthy',
        project: process.env.PROJECT_ID || 'TRONIC_MASTER',
        port: process.env.PORT || 5001,
        timestamp: new Date().toISOString(),
        database: 'MongoDB connected'
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 TRONIC_MASTER API is running',
        version: '1.0.0',
        project: 'TRONIC_MASTER',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            dashboard: '/api/dashboard',
            products: '/api/products',
            pos: '/api/pos',
            sales: '/api/sales',
            reports: '/api/reports',
            users: '/api/users',
            phones: '/api/phones',
            electronics: '/api/electronics'
        }
    });
});

// ============================================
// ✅ CATCH-ALL: Serve React App (for Heroku)
// ============================================

// If frontend build exists, serve index.html for any non-API routes
if (fs.existsSync(frontendBuildPath)) {
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({
                success: false,
                message: `API route ${req.path} not found`
            });
        }
        // Serve React index.html
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
} else {
    // Health check when frontend is not built
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: '🚀 TRONIC_MASTER API is running',
            version: '1.0.0',
            project: 'TRONIC_MASTER',
            note: 'Frontend build not found. Run `npm run build` in frontend directory.'
        });
    });
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler for API routes
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        console.log(`❌ API Route ${req.originalUrl} not found`);
        res.status(404).json({
            success: false,
            message: `Route ${req.originalUrl} not found`
        });
    }
    // For non-API routes, the catch-all above handles it
});

// Enhanced global error handler
app.use((err, req, res, next) => {
    console.error('❌ Global error:', err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err.details || null
        })
    });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`\n🚀 TRONIC_MASTER Server running on port ${PORT}`);
        console.log(`🌐 http://localhost:${PORT}\n`);
        console.log('📦 API Endpoints:');
        console.log('   📊 Dashboard: /api/dashboard');
        console.log('   📱 Products:   /api/products');
        console.log('   📂 Categories: /api/categories');
        console.log('   📦 Inventory:  /api/inventory');
        console.log('   🛒 POS:        /api/pos');
        console.log('   📋 Orders:     /api/orders');
        console.log('   👥 Customers:  /api/customers');
        console.log('   🏭 Suppliers:  /api/suppliers');
        console.log('   📈 Reports:    /api/reports');
        console.log('   🏪 Branches:   /api/branches');
        console.log('   💰 Sales:      /api/sales');
        console.log('   👤 Users:      /api/users');
        console.log('   🏢 Companies:  /api/companies');
        console.log('   📱 Phones:     /api/phones');
        console.log('   💻 Electronics: /api/electronics');
        console.log('   ❤️  Health:     /api/health\n');
        
        if (fs.existsSync(frontendBuildPath)) {
            console.log('✅ React Frontend is being served from:');
            console.log(`   📁 ${frontendBuildPath}\n`);
        } else {
            console.log('⚠️ React Frontend NOT FOUND.');
            console.log('   To serve the frontend, build it first:');
            console.log('   cd frontend && npm run build\n');
        }
        
        console.log('📁 Static Files:');
        console.log('   📸 Profile Pictures: /uploads/profile-pictures/');
        console.log('   🏢 Company Logos:    /uploads/logos/');
        console.log('   📦 Product Images:   /uploads/product-images/\n');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
        console.log(`\n🛑 ${signal} received. Closing server...`);
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

}).catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});

