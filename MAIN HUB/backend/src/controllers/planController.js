const Plan = require('../models/Plan');

// Get all plans
exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true })
            .sort({ price: 1 });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single plan
exports.getPlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create plan
exports.createPlan = async (req, res) => {
    try {
        const { name, description, price, currency, billingCycle, features, status } = req.body;
        
        const existingPlan = await Plan.findOne({ name });
        if (existingPlan) {
            return res.status(400).json({ message: 'Plan with this name already exists' });
        }

        const plan = await Plan.create({
            name,
            description: description || '',
            price: price || 0,
            currency: currency || 'KES',
            billingCycle: billingCycle || 'monthly',
            features: features || {
                maxUsers: 1,
                maxProjects: 1,
                maxCompanies: 1,
                maxStorage: '1GB',
                customDomain: false,
                apiAccess: false,
                prioritySupport: false,
                advancedReports: false
            },
            status: status || 'active'
        });

        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update plan
exports.updatePlan = async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete plan
exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ message: error.message });
    }
};
