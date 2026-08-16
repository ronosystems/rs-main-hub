const express = require('express');
const router = express.Router();
const { syncProjects, createProjectFolder } = require('../controllers/syncController');
const { protect, superAdminOnly } = require('../middleware/auth');

router.post('/projects', protect, superAdminOnly, syncProjects);
router.get('/projects', protect, superAdminOnly, syncProjects);
router.post('/create-folder', protect, superAdminOnly, createProjectFolder);

module.exports = router;
