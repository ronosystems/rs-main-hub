const router = require('express').Router();
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ===== SPECIFIC ROUTES (NO :id PARAM) =====
router.get('/statuses', authorize('super_admin', 'admin', 'manager'), companyController.getCompanyStatuses);
router.get('/expiring', authorize('super_admin', 'admin'), companyController.getExpiringCompanies);

// ===== CRUD ROUTES =====
router.post('/', authorize('super_admin', 'admin'), companyController.createCompany);
router.get('/', authorize('super_admin', 'admin', 'manager'), companyController.getAllCompanies);
router.get('/:id', authorize('super_admin', 'admin', 'manager'), companyController.getCompanyById);
router.put('/:id', authorize('super_admin', 'admin'), companyController.updateCompany);

// ===== DELETE ROUTES =====
// Permanent delete - removes company and all associated data
router.delete('/:id/permanent', authorize('super_admin'), companyController.permanentDeleteCompany);

// Soft delete - deactivates company
router.delete('/:id', authorize('super_admin'), companyController.deleteCompany);

// ===== OTHER ROUTES =====
router.put('/:id/reactivate', authorize('super_admin'), companyController.reactivateCompany);
router.put('/:id/subscription', authorize('super_admin', 'admin'), companyController.updateSubscription);
router.post('/:id/renew', authorize('super_admin', 'admin'), companyController.renewSubscription);

// ============================================
// ✅ LOGIN AS COMPANY - Super Admin only
// ============================================
router.post('/:id/login-as', authorize('super_admin'), companyController.loginAsCompany);

// ============================================
// ✅ DEBUG ROUTE - To test if routes are working
// ============================================
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Company routes are working!',
        routes: [
            'GET /statuses',
            'GET /expiring',
            'POST /',
            'GET /',
            'GET /:id',
            'PUT /:id',
            'DELETE /:id/permanent',
            'DELETE /:id',
            'PUT /:id/reactivate',
            'PUT /:id/subscription',
            'POST /:id/renew',
            'POST /:id/login-as',  // ✅ New route
            'GET /test'
        ]
    });
});

console.log('✅ Company routes registered with login-as endpoint');

module.exports = router;