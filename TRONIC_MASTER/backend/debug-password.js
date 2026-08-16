const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function debugPassword() {
    try {
        await mongoose.connect('mongodb://localhost:27017/rs_hub');
        console.log('📊 Connected to MongoDB\n');

        // Get the user directly from the collection
        const db = mongoose.connection.db;
        const users = db.collection('users');
        
        const user = await users.findOne({ email: 'kalwal@gmail.com' });
        
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('✅ User found:');
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   Password hash:', user.password);
        console.log('   Project:', user.project);
        console.log('   Company:', user.company);
        console.log('');

        // Test the password
        const testPassword = 'Kiprono@1997';
        console.log('🔐 Testing password:', testPassword);
        
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log('   Result:', isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH');
        console.log('');

        // Generate a new hash for comparison
        console.log('🔄 Generating new hash for the same password...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('   New hash:', newHash);
        console.log('');

        // Compare the new hash with the old one
        console.log('🔍 Comparing hashes:');
        console.log('   Old hash length:', user.password.length);
        console.log('   New hash length:', newHash.length);
        console.log('   Old hash starts with:', user.password.substring(0, 10));
        console.log('   New hash starts with:', newHash.substring(0, 10));
        console.log('');

        // Update the password with the new hash
        console.log('🔄 Updating password with new hash...');
        const result = await users.updateOne(
            { email: 'kalwal@gmail.com' },
            { $set: { password: newHash } }
        );
        console.log('   Updated:', result.modifiedCount > 0 ? '✅ YES' : '❌ NO');
        console.log('');

        // Verify the new password works
        const updatedUser = await users.findOne({ email: 'kalwal@gmail.com' });
        const verifyMatch = await bcrypt.compare(testPassword, updatedUser.password);
        console.log('🔐 Verifying new password:');
        console.log('   Result:', verifyMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH');
        console.log('');

        await mongoose.disconnect();
        console.log('✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugPassword();
