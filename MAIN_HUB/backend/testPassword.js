const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const User = require('./src/models/User');

async function testPassword() {
    try {
        const user = await User.findOne({ email: 'vincent@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('✅ User found:', user.email);
        console.log('🔒 Password hash:', user.password);
        
        const isMatch = await user.comparePassword('Kiprono@1997');
        console.log('✅ Password match:', isMatch);
        
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        mongoose.disconnect();
    }
}

testPassword();
