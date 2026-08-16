// /home/kk/RS/MAIN HUB/backend/src/routes/projectRoutes.js

const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const projectService = require('../services/projectService');

// All routes require authentication
router.use(protect);

// ===== PROJECT ROUTES (Direct from Config) =====

// Get all projects
router.get('/', authorize('super_admin', 'admin', 'manager', 'staff'), (req, res) => {
    const result = projectService.getProjects(req.query);
    res.status(result.success ? 200 : 500).json(result);
});

// Get project types
router.get('/types', (req, res) => {
    const result = projectService.getProjectTypes();
    res.status(result.success ? 200 : 500).json(result);
});

// Get project by ID
router.get('/:id', authorize('super_admin', 'admin', 'manager'), (req, res) => {
    const result = projectService.getProject(req.params.id);
    res.status(result.success ? 200 : 404).json(result);
});

// Get projects by type
router.get('/type/:type', authorize('super_admin', 'admin', 'manager'), (req, res) => {
    const result = projectService.getProjectsByTypeService(req.params.type);
    res.status(result.success ? 200 : 500).json(result);
});

// Get project statistics
router.get('/stats', authorize('super_admin', 'admin'), (req, res) => {
    const result = projectService.getStats();
    res.status(result.success ? 200 : 500).json(result);
});

// Sync projects
router.post('/sync', authorize('super_admin'), (req, res) => {
    const result = projectService.syncProjects();
    res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;