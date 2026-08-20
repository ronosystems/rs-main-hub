const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const Image = require('./src/models/Image');
const User = require('./src/models/User');
const Company = require('./src/models/Company');

const migrateImages = async () => {
    try {
        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mainhub');
        console.log('✅ Connected to MongoDB');

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // ============================================
        // MIGRATE PROFILE PICTURES
        // ============================================
        const profilePaths = [
            path.join(__dirname, 'src/uploads/profile-pictures'),
            path.join(__dirname, 'uploads/profile-pictures')
        ];

        for (const profilePath of profilePaths) {
            if (!fs.existsSync(profilePath)) {
                console.log(`⚠️ Path not found: ${profilePath}`);
                continue;
            }
            
            const files = fs.readdirSync(profilePath);
            console.log(`📸 Found ${files.length} profile pictures in ${profilePath}`);
            
            for (const file of files) {
                if (file === '.' || file === '..') continue;
                
                // Extract user ID from filename
                const match = file.match(/profile-([a-f0-9]+)-/);
                if (!match) {
                    console.log(`⚠️ Skipping ${file} - invalid filename format`);
                    skippedCount++;
                    continue;
                }
                
                const userId = match[1];
                const filePath = path.join(profilePath, file);
                const data = fs.readFileSync(filePath);
                const ext = path.extname(file).toLowerCase();
                
                let contentType = 'image/jpeg';
                if (ext === '.png') contentType = 'image/png';
                else if (ext === '.gif') contentType = 'image/gif';
                else if (ext === '.webp') contentType = 'image/webp';
                else if (ext === '.svg') contentType = 'image/svg+xml';
                
                // Check if user exists in MAIN_HUB
                let user;
                try {
                    user = await User.findById(userId);
                } catch (err) {
                    console.log(`⚠️ Invalid user ID format: ${userId}, skipping ${file}`);
                    skippedCount++;
                    continue;
                }
                
                if (!user) {
                    console.log(`⚠️ User ${userId} not found in MAIN_HUB, skipping ${file}`);
                    skippedCount++;
                    continue;
                }
                
                // Check if image already exists
                const existingImage = await Image.findOne({ 
                    entityType: 'user', 
                    entityId: userId,
                    isPrimary: true 
                });
                
                if (existingImage) {
                    console.log(`⏭️ Image already exists for user ${userId}, skipping`);
                    skippedCount++;
                    continue;
                }
                
                try {
                    // Create image document
                    const image = new Image({
                        entityType: 'user',
                        entityId: userId,
                        data: data,
                        contentType: contentType,
                        filename: file,
                        size: data.length,
                        isPrimary: true,
                        uploadedBy: userId,
                        companyId: user.company || null
                    });
                    
                    await image.save();
                    
                    // Update user with image reference
                    user.profilePicture = image._id;
                    await user.save();
                    
                    migratedCount++;
                    console.log(`✅ Migrated profile: ${file} -> ${image._id}`);
                } catch (err) {
                    console.error(`❌ Failed to migrate ${file}:`, err.message);
                    errorCount++;
                }
            }
        }

        // ============================================
        // MIGRATE COMPANY LOGOS
        // ============================================
        const logoPaths = [
            path.join(__dirname, 'src/uploads/logos'),
            path.join(__dirname, 'uploads/logos')
        ];

        for (const logoPath of logoPaths) {
            if (!fs.existsSync(logoPath)) {
                console.log(`⚠️ Path not found: ${logoPath}`);
                continue;
            }
            
            const files = fs.readdirSync(logoPath);
            console.log(`\n🏢 Found ${files.length} logos in ${logoPath}`);
            
            for (const file of files) {
                if (file === '.' || file === '..') continue;
                
                // Extract company ID from filename - try multiple patterns
                let companyId = null;
                
                // Pattern 1: logo-{id}-{timestamp}.ext
                let match = file.match(/logo-([a-f0-9]+)-/);
                if (match) {
                    companyId = match[1];
                }
                
                // Pattern 2: logo-{id}.ext (no timestamp)
                if (!companyId) {
                    match = file.match(/logo-([a-f0-9]+)\./);
                    if (match) {
                        companyId = match[1];
                    }
                }
                
                // Pattern 3: system-logo-{timestamp}.ext (system logos - skip)
                if (!companyId) {
                    if (file.startsWith('system-logo')) {
                        console.log(`⏭️ Skipping system logo: ${file}`);
                        skippedCount++;
                        continue;
                    }
                }
                
                if (!companyId) {
                    console.log(`⚠️ Skipping ${file} - invalid filename format`);
                    skippedCount++;
                    continue;
                }
                
                // Validate that companyId is a valid ObjectId (24 hex chars)
                if (!/^[a-f0-9]{24}$/.test(companyId)) {
                    console.log(`⚠️ Skipping ${file} - invalid company ID: ${companyId}`);
                    skippedCount++;
                    continue;
                }
                
                const filePath = path.join(logoPath, file);
                const data = fs.readFileSync(filePath);
                const ext = path.extname(file).toLowerCase();
                
                let contentType = 'image/jpeg';
                if (ext === '.png') contentType = 'image/png';
                else if (ext === '.gif') contentType = 'image/gif';
                else if (ext === '.webp') contentType = 'image/webp';
                else if (ext === '.svg') contentType = 'image/svg+xml';
                
                // Check if company exists
                let company;
                try {
                    company = await Company.findById(companyId);
                } catch (err) {
                    console.log(`⚠️ Invalid company ID format: ${companyId}, skipping ${file}`);
                    skippedCount++;
                    continue;
                }
                
                if (!company) {
                    console.log(`⚠️ Company ${companyId} not found, skipping ${file}`);
                    skippedCount++;
                    continue;
                }
                
                // Check if image already exists
                const existingImage = await Image.findOne({ 
                    entityType: 'company', 
                    entityId: companyId,
                    isPrimary: true 
                });
                
                if (existingImage) {
                    console.log(`⏭️ Logo already exists for company ${companyId}, skipping`);
                    skippedCount++;
                    continue;
                }
                
                try {
                    // Create image document
                    const image = new Image({
                        entityType: 'company',
                        entityId: companyId,
                        data: data,
                        contentType: contentType,
                        filename: file,
                        size: data.length,
                        isPrimary: true,
                        companyId: companyId
                    });
                    
                    await image.save();
                    
                    // Update company with logo reference
                    company.logo = image._id;
                    await company.save();
                    
                    migratedCount++;
                    console.log(`✅ Migrated logo: ${file} -> ${image._id}`);
                } catch (err) {
                    console.error(`❌ Failed to migrate ${file}:`, err.message);
                    errorCount++;
                }
            }
        }

        console.log(`\n🎉 Migration completed!`);
        console.log(`📊 Summary:`);
        console.log(`   ✅ Migrated: ${migratedCount} images`);
        console.log(`   ⏭️  Skipped: ${skippedCount} images`);
        console.log(`   ❌ Errors: ${errorCount} images`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateImages();