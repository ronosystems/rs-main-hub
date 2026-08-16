const express = require('express');
const router = express.Router();
const {
    getPlans,
    getPlan,
    createPlan,
    updatePlan,
    deletePlan
} = require('../controllers/planController');
const { protect, superAdminOnly } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Super Admin only routes
router.post('/', superAdminOnly, createPlan);
router.put('/:id', superAdminOnly, updatePlan);
router.delete('/:id', superAdminOnly, deletePlan);

// All authenticated users can view
router.get('/', getPlans);
router.get('/:id', getPlan);

module.exports = router;
