const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rs_hub');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const companiesCollection = db.collection('companies');
        const plansCollection = db.collection('plans');

        // ============================================
        // CHECK IF SUPER ADMIN ALREADY EXISTS
        // ============================================
        const existingAdmin = await usersCollection.findOne({ role: 'super_admin' });
        if (existingAdmin) {
            console.log('⚠️ Super Admin already exists');
            console.log('📧 Existing Super Admin:', existingAdmin.email);
            process.exit(0);
        }

        console.log('🔑 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Kiprono@1997', salt);

        // ============================================
        // CREATE USERS
        // ============================================
        console.log('👤 Creating users...');
        
        const users = [
            {
                name: 'Rono Systems',
                email: 'ronosystems@gmail.com',
                password: hashedPassword,
                role: 'super_admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                }
            },
            {
                name: 'Kiprotich Trevor',
                email: 'kiprotichtrevor@gmail.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                }
            },
            {
                name: 'Elkana Kiprono',
                email: 'elkanakiprono@gmail.com',
                password: hashedPassword,
                role: 'manager',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                }
            },
            {
                name: 'Kiprotich Kiprono',
                email: 'kiprotichkiprono@gmail.com',
                password: hashedPassword,
                role: 'staff',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                }
            }
        ];

        for (const user of users) {
            await usersCollection.insertOne(user);
            console.log(`✅ Created user: ${user.name} (${user.role})`);
        }

        // ============================================
        // CREATE DEFAULT PLANS (if needed)
        // ============================================
        const existingPlans = await plansCollection.findOne({});
        if (!existingPlans) {
            console.log('📋 Creating default plans...');
            
            const plans = [
                {
                    name: 'Basic',
                    code: 'BASIC',
                    description: 'Basic plan for small businesses',
                    price: 0,
                    currency: 'KES',
                    billingCycle: 'monthly',
                    features: {
                        maxUsers: 5,
                        maxProducts: 100,
                        maxBranches: 1,
                        hasPOS: false,
                        hasReports: false,
                        hasInventory: true
                    },
                    isActive: true,
                    isDefault: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Standard',
                    code: 'STANDARD',
                    description: 'Standard plan for growing businesses',
                    price: 5000,
                    currency: 'KES',
                    billingCycle: 'monthly',
                    features: {
                        maxUsers: 20,
                        maxProducts: 500,
                        maxBranches: 3,
                        hasPOS: true,
                        hasReports: true,
                        hasInventory: true
                    },
                    isActive: true,
                    isDefault: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Premium',
                    code: 'PREMIUM',
                    description: 'Premium plan for large businesses',
                    price: 10000,
                    currency: 'KES',
                    billingCycle: 'monthly',
                    features: {
                        maxUsers: 50,
                        maxProducts: 1000,
                        maxBranches: 10,
                        hasPOS: true,
                        hasReports: true,
                        hasInventory: true
                    },
                    isActive: true,
                    isDefault: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Enterprise',
                    code: 'ENTERPRISE',
                    description: 'Enterprise plan for large organizations',
                    price: 25000,
                    currency: 'KES',
                    billingCycle: 'monthly',
                    features: {
                        maxUsers: 100,
                        maxProducts: 10000,
                        maxBranches: 50,
                        hasPOS: true,
                        hasReports: true,
                        hasInventory: true
                    },
                    isActive: true,
                    isDefault: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            await plansCollection.insertMany(plans);
            console.log(`✅ ${plans.length} default plans created`);
        }

        // ============================================
        // SUMMARY
        // ============================================
        const userCount = await usersCollection.countDocuments();
        const planCount = await plansCollection.countDocuments();
        const companyCount = await companiesCollection.countDocuments();

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`  👤 Users: ${userCount}`);
        console.log(`  📋 Plans: ${planCount}`);
        console.log(`  🏢 Companies: ${companyCount}`);
        console.log('\n🔑 Login Credentials:');
        console.log('  Super Admin: ronosystems@gmail.com / Kiprono@1997');
        console.log('  Admin:       kiprotichtrevor@gmail.com / Kiprono@1997');
        console.log('  Manager:     elkanakiprono@gmail.com / Kiprono@1997');
        console.log('  Staff:       kiprotichkiprono@gmail.com / Kiprono@1997');
        console.log('\n💡 Next Steps:');
        console.log('  1. Login as Super Admin');
        console.log('  2. Create companies through the frontend');
        console.log('  3. Create company users through the frontend');
        console.log('  4. Assign plans to companies');
        console.log('\n✅ All done!');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedUsers();