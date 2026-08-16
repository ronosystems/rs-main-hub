const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    seedDefaultRoles
} = require('../controllers/roleController');
const { protect, superAdminOnly } = require('../middleware/auth');

// All routes require authentication and super admin
router.use(protect);
router.use(superAdminOnly);

router.get('/', getRoles);
router.get('/seed', seedDefaultRoles);
router.get('/:id', getRole);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;
