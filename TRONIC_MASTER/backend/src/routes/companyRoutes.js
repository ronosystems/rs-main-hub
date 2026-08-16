// /home/kk/RS/TRONIC_MASTER/backend/src/routes/companyRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getCompanySettings,
    updateCompanySettings,
    uploadCompanyLogo,
    removeCompanyLogo
} = require('../controllers/companyController');

router.use(protect);

router.get('/settings', getCompanySettings);
router.put('/settings', updateCompanySettings);
router.put('/logo', upload.logo, uploadCompanyLogo);
router.delete('/logo', removeCompanyLogo);

module.exports = router;