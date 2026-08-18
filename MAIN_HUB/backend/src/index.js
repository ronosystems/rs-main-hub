const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const companyRoutes = require('./routes/companyRoutes');
const planRoutes = require('./routes/planRoutes');
const roleRoutes = require('./routes/roleRoutes');
const syncRoutes = require('./routes/syncRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

dotenv.config();

const app = express();

// ============================================
// ✅ CORS CONFIGURATION - FIXED FOR HEROKU
// ============================================
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'https://main-hub-frontend-48e11f192f94.herokuapp.com'
        ];
        
        // Check if origin is allowed
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.herokuapp.com')) {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// STATIC FILE SERVING FOR UPLOADS
// ============================================

const uploadsDir = path.join(__dirname, 'uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

if (!fs.existsSync(profilePicturesDir)) {
    fs.mkdirSync(profilePicturesDir, { recursive: true });
    console.log('✅ Created profile-pictures directory');
}

app.use('/uploads', express.static(uploadsDir));
console.log('✅ Static files served from /uploads');

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/', (req, res) => {
    res.json({
        message: 'MAIN HUB API is running',
        version: '2.0',
        ports: {
            backend: 5000,
            frontend: 3000,
            tronicMaster: {
                backend: 5001,
                frontend: 3001
            }
        },
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            projects: '/api/projects',
            companies: '/api/companies',
            plans: '/api/plans',
            roles: '/api/roles',
            sync: '/api/sync',
            settings: '/api/settings',
            notifications: '/api/notifications',
            calendar: '/api/calendar'
        }
    });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 MAIN HUB Server running on port ${PORT}`);
        console.log(`📁 Uploads directory: ${uploadsDir}`);
        console.log(`🖼️  Profile pictures: ${profilePicturesDir}`);
        console.log(`🌐 http://localhost:${PORT}\n`);
        console.log(`🔗 CORS enabled for: ${corsOptions.origin}`);
        console.log(`📅 Calendar API available at: http://localhost:${PORT}/api/calendar`);
    });
}).catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});