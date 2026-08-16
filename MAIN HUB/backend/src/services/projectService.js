// /home/kk/RS/MAIN HUB/backend/src/services/projectService.js

const { 
    PROJECTS, 
    getAllProjects, 
    getProjectById, 
    getProjectByType,
    getAllTypes,
    getProjectsByType,
    getProjectStats
} = require('../config/project');

// =============== GET ALL PROJECTS ===============
const getProjects = (query = {}) => {
    try {
        const {
            page = 1,
            limit = 100,
            search,
            type,
            status,
            sortBy = 'code',
            sortOrder = 'asc'
        } = query;

        let projects = getAllProjects();

        // Filter by type
        if (type) {
            projects = projects.filter(p => p.type === type);
        }

        // Filter by status
        if (status) {
            projects = projects.filter(p => p.status === status);
        }

        // Search
        if (search) {
            const term = search.toLowerCase();
            projects = projects.filter(p => 
                p.name.toLowerCase().includes(term) ||
                p.code.toLowerCase().includes(term) ||
                p.description.toLowerCase().includes(term) ||
                p.typeName.toLowerCase().includes(term)
            );
        }

        // Sort
        projects.sort((a, b) => {
            const aVal = a[sortBy] || '';
            const bVal = b[sortBy] || '';
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        const total = projects.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = projects.slice(skip, skip + parseInt(limit));

        return {
            success: true,
            data: paginated,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };

    } catch (error) {
        console.error('Error fetching projects:', error);
        return {
            success: false,
            message: 'Error fetching projects',
            error: error.message
        };
    }
};

// =============== GET PROJECT TYPES ===============
const getProjectTypes = () => {
    try {
        const types = getAllTypes();
        return { 
            success: true, 
            data: types 
        };
    } catch (error) {
        console.error('Get project types error:', error);
        return { 
            success: false,
            message: error.message 
        };
    }
};

// =============== GET SINGLE PROJECT ===============
const getProject = (id) => {
    try {
        const project = getProjectById(id);
        if (!project) {
            return {
                success: false,
                message: 'Project not found'
            };
        }
        return {
            success: true,
            data: project
        };
    } catch (error) {
        console.error('Error fetching project:', error);
        return {
            success: false,
            message: 'Error fetching project',
            error: error.message
        };
    }
};

// =============== GET PROJECTS BY TYPE ===============
const getProjectsByTypeService = (type) => {
    try {
        const projects = getProjectsByType(type);
        return {
            success: true,
            data: projects
        };
    } catch (error) {
        console.error('Error fetching projects by type:', error);
        return {
            success: false,
            message: 'Error fetching projects by type',
            error: error.message
        };
    }
};

// =============== GET PROJECT STATISTICS ===============
const getStats = () => {
    try {
        const stats = getProjectStats();
        return {
            success: true,
            data: stats
        };
    } catch (error) {
        console.error('Error getting project stats:', error);
        return {
            success: false,
            message: 'Error getting project statistics',
            error: error.message
        };
    }
};

// =============== SYNC PROJECTS ===============
const syncProjects = () => {
    try {
        const stats = getProjectStats();
        return {
            success: true,
            message: 'Projects synced successfully',
            data: {
                total: stats.total,
                active: stats.active,
                inactive: stats.inactive,
                maintenance: stats.maintenance,
                archived: stats.archived
            }
        };
    } catch (error) {
        console.error('Error syncing projects:', error);
        return {
            success: false,
            message: 'Error syncing projects',
            error: error.message
        };
    }
};

module.exports = {
    getProjects,
    getProjectTypes,
    getProject,
    getProjectsByTypeService,
    getStats,
    syncProjects
};