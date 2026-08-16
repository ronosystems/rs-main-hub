// /home/kk/RS/MAIN HUB/backend/src/config/project.js

// ============================================
// PROJECTS CONFIGURATION - SINGLE SOURCE OF TRUTH
// Each project has a type as one of its properties
// ============================================

const PROJECTS = [
    // ========================================
    // GENERAL BUSINESS (FALLBACK)
    // ========================================
    {
        name: 'BUSINESS_MASTER',
        code: 'PRJ-001',
        description: 'General Business Management for Any Industry',
        type: 'BUSINESS_MASTER',
        typeName: 'Business Master',
        icon: 'fa-briefcase',
        color: '#2d3436',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    {
        name: 'SUPERMARKET_MASTER',
        code: 'PRJ-002',
        description: 'Advanced POS & Inventory for Supermarkets & Hypermarkets',
        type: 'SUPERMARKET_MASTER',
        typeName: 'Supermarket Master',
        icon: 'fa-shopping-basket',
        color: '#00b894',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    {
        name: 'WHOLESALE_MASTER',
        code: 'PRJ-003',
        description: 'Wholesale Distribution & Bulk Inventory Management',
        type: 'WHOLESALE_MASTER',
        typeName: 'Wholesale Master',
        icon: 'fa-truck',
        color: '#fdcb6e',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // ELECTRONICS & HARDWARE
    // ========================================
    {
        name: 'TRONIC_MASTER',
        code: 'PRJ-004',
        description: 'POS & Inventory for Electronics & Gadget Shops',
        type: 'TRONIC_MASTER',
        typeName: 'Tronic Master',
        icon: 'fa-microchip',
        color: '#0d6efd',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    {
        name: 'HARDWARE_MASTER',
        code: 'PRJ-005',
        description: 'Hardware Store & Construction Materials Management',
        type: 'HARDWARE_MASTER',
        typeName: 'Hardware Master',
        icon: 'fa-tools',
        color: '#6c757d',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // HEALTHCARE CATEGORY
    // ========================================
    {
        name: 'PHARMACY_MASTER',
        code: 'PRJ-006',
        description: 'Pharmacy, Chemist & Dispensary Management',
        type: 'PHARMACY_MASTER',
        typeName: 'Pharmacy Master',
        icon: 'fa-prescription-bottle',
        color: '#dc3545',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    {
        name: 'HEALTH_MASTER',
        code: 'PRJ-007',
        description: 'Hospital, Clinic & Medical Practice Management',
        type: 'HEALTH_MASTER',
        typeName: 'Health Master',
        icon: 'fa-heartbeat',
        color: '#e74c3c',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // HOSPITALITY CATEGORY
    // ========================================
    {
        name: 'HOTEL_MASTER',
        code: 'PRJ-008',
        description: 'Hotel, Lodge & Hospitality Management',
        type: 'HOTEL_MASTER',
        typeName: 'Hotel Master',
        icon: 'fa-hotel',
        color: '#fd7e14',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    {
        name: 'RESTAURANT_MASTER',
        code: 'PRJ-009',
        description: 'Restaurant, Cafe & Food Service Management',
        type: 'RESTAURANT_MASTER',
        typeName: 'Restaurant Master',
        icon: 'fa-utensils',
        color: '#198754',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // PROPERTY & RENTAL CATEGORY
    // ========================================
    {
        name: 'RENTAL_MASTER',
        code: 'PRJ-010',
        description: 'Apartments, Rooms & Property Rental Management',
        type: 'RENTAL_MASTER',
        typeName: 'Rental Master',
        icon: 'fa-home',
        color: '#ffc107',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // FASHION & LIFESTYLE
    // ========================================
    {
        name: 'FASHION_MASTER',
        code: 'PRJ-011',
        description: 'Clothing, Boutique & Fashion Store Management',
        type: 'FASHION_MASTER',
        typeName: 'Fashion Master',
        icon: 'fa-tshirt',
        color: '#e83e8c',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // AUTOMOTIVE & SERVICES
    // ========================================
    {
        name: 'CARWASH_MASTER',
        code: 'PRJ-012',
        description: 'Car Wash & Auto Detailing Management',
        type: 'CARWASH_MASTER',
        typeName: 'Carwash Master',
        icon: 'fa-car',
        color: '#20c997',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // LIQUOR & BEVERAGE
    // ========================================
    {
        name: 'LIQUOR_MASTER',
        code: 'PRJ-013',
        description: 'Liquor Store & Beverage Shop Management',
        type: 'LIQUOR_MASTER',
        typeName: 'Liquor Master',
        icon: 'fa-wine-bottle',
        color: '#8b5cf6',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // AGRICULTURE & VETERINARY
    // ========================================
    {
        name: 'AGROVET_MASTER',
        code: 'PRJ-014',
        description: 'Agrovet, Farm Supply & Veterinary Store Management',
        type: 'AGROVET_MASTER',
        typeName: 'Agrovet Master',
        icon: 'fa-seedling',
        color: '#27ae60',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // EDUCATION & RELIGIOUS
    // ========================================
    {
        name: 'SCHOOL_MASTER',
        code: 'PRJ-015',
        description: 'School, College & Educational Institution Management',
        type: 'SCHOOL_MASTER',
        typeName: 'School Master',
        icon: 'fa-graduation-cap',
        color: '#3498db',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    {
        name: 'CHURCH_MASTER',
        code: 'PRJ-016',
        description: 'Church, Ministry & Religious Organization Management',
        type: 'CHURCH_MASTER',
        typeName: 'Church Master',
        icon: 'fa-church',
        color: '#8e44ad',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // BEAUTY & PERSONAL CARE
    // ========================================
    {
        name: 'BEAUTY_MASTER',
        code: 'PRJ-017',
        description: 'Salon, Spa & Beauty Parlor Management',
        type: 'BEAUTY_MASTER',
        typeName: 'Beauty Master',
        icon: 'fa-spa',
        color: '#fd79a8',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // RETAIL & POS CATEGORY
    // ========================================
    {
        name: 'RETAIL_MASTER',
        code: 'PRJ-018',
        description: 'POS & Inventory for Retail Shops, Kiosks & General Stores',
        type: 'RETAIL_MASTER',
        typeName: 'Retail Master',
        icon: 'fa-store',
        color: '#6f42c1',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // MEDIA & ENTERTAINMENT
    // ========================================
    {
        name: 'MEDIA_MASTER',
        code: 'PRJ-019',
        description: 'Media, Content & Digital Asset Management',
        type: 'MEDIA_MASTER',
        typeName: 'Media Master',
        icon: 'fa-film',
        color: '#e74c3c',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    },
    // ========================================
    // TRANSPORT & LOGISTICS
    // ========================================
    {
        name: 'TRANSPORT_MASTER',
        code: 'PRJ-020',
        description: 'Transport, Sacco, Fleet & Logistics Management',
        type: 'TRANSPORT_MASTER',
        typeName: 'Transport Master',
        icon: 'fa-bus',
        color: '#f39c12',
        plan: 'basic',
        status: 'active',
        isActive: true,
        port: null,
        frontendUrl: '',
        backendUrl: ''
    }
];

// ============ HELPER FUNCTIONS ============

// Get all projects
const getAllProjects = () => PROJECTS;

// Get project by ID or code
const getProjectById = (id) => PROJECTS.find(p => p.id === id || p.code === id) || null;

// Get project by type
const getProjectByType = (type) => PROJECTS.find(p => p.type === type) || null;

// Get all unique types (for dropdowns)
const getAllTypes = () => {
    const types = {};
    PROJECTS.forEach(p => {
        types[p.type] = {
            key: p.type,
            name: p.typeName,
            icon: p.icon,
            color: p.color,
            description: p.description,
            count: PROJECTS.filter(proj => proj.type === p.type).length
        };
    });
    return Object.values(types);
};

// Get projects by type
const getProjectsByType = (type) => PROJECTS.filter(p => p.type === type);

// Get project statistics
const getProjectStats = () => {
    const total = PROJECTS.length;
    const active = PROJECTS.filter(p => p.status === 'active').length;
    const inactive = PROJECTS.filter(p => p.status === 'inactive').length;
    const maintenance = PROJECTS.filter(p => p.status === 'maintenance').length;
    const archived = PROJECTS.filter(p => p.status === 'archived').length;

    const typeStats = {};
    PROJECTS.forEach(p => {
        if (!typeStats[p.type]) {
            typeStats[p.type] = 0;
        }
        typeStats[p.type]++;
    });

    return { total, active, inactive, maintenance, archived, typeStats };
};

module.exports = {
    PROJECTS,
    getAllProjects,
    getProjectById,
    getProjectByType,
    getAllTypes,
    getProjectsByType,
    getProjectStats
};