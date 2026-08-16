const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔑 Login attempt:', email);
        
        const user = await User.findOne({ email })
            .populate('role', 'name code permissions')
            .populate('project', 'name code')
            .populate('company', 'name code');
            
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        if (!user.isActive) {
            console.log('❌ User inactive:', email);
            return res.status(401).json({ message: 'Account deactivated' });
        }
        
        console.log('✅ User found:', user.email);
        console.log('🔒 Password hash:', user.password);
        
        const isMatch = await user.comparePassword(password);
        console.log('✅ Password match:', isMatch);
        
        if (!isMatch) {
            console.log('❌ Password mismatch for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                project: user.project,
                company: user.company
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
            .populate('role', 'name code permissions')
            .populate('project', 'name code')
            .populate('company', 'name code');
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: error.message });
    }
};