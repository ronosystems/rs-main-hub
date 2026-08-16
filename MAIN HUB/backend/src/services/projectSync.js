// /home/kk/RS/MAIN HUB/backend/src/services/projectSync.js

const fs = require('fs');
const path = require('path');
const { getAllProjects, getProjectTypeKeys } = require('../config/project');

// =============== SYNC PROJECTS FROM FILESYSTEM ===============
const syncProjects = async () => {
    try {
        const rsRoot = process.env.RS_ROOT || '/home/kk/RS';
        console.log(`📁 Syncing projects from: ${rsRoot}`);
        
        const items = fs.readdirSync(rsRoot);
        console.log(`📁 Found items in RS:`, items);
        
        // Get all project type keys from config
        const projectTypeKeys = getProjectTypeKeys();
        
        // Filter only directories that match project types
        const projectFolders = items.filter(item => {
            const itemPath = path.join(rsRoot, item);
            try {
                const stats = fs.statSync(itemPath);
                const isDirectory = stats.isDirectory();
                const isProjectType = projectTypeKeys.includes(item);
                const isMainHub = item === 'MAIN HUB';
                return isDirectory && isProjectType && !isMainHub;
            } catch (err) {
                return false;
            }
        });

        console.log(`📁 Found ${projectFolders.length} project folders:`, projectFolders);

        // Get all projects from config
        const allProjects = getAllProjects();

        // Create missing folders
        let createdFolders = 0;
        for (const project of allProjects) {
            const folderName = project.name;
            const folderPath = path.join(rsRoot, folderName);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                createdFolders++;
                console.log(`📁 Created folder: ${folderName}`);
            }
        }

        // Check for folders that don't have corresponding config
        const unmatchedFolders = projectFolders.filter(folder => {
            return !allProjects.some(p => p.name === folder);
        });

        if (unmatchedFolders.length > 0) {
            console.log(`⚠️ Found folders without config:`, unmatchedFolders);
        }

        console.log(`📊 Sync complete:`);
        console.log(`   ✅ ${allProjects.length} projects in config`);
        console.log(`   📁 ${projectFolders.length} folders found`);
        console.log(`   📁 ${createdFolders} new folders created`);
        
        return {
            success: true,
            message: 'Projects synced successfully',
            synced: createdFolders,
            total: allProjects.length,
            folders: projectFolders.length,
            created: createdFolders,
            unmatched: unmatchedFolders
        };

    } catch (error) {
        console.error('❌ Error syncing projects:', error);
        return {
            success: false,
            message: 'Error syncing projects',
            error: error.message
        };
    }
};

// =============== CREATE PROJECT FOLDER ===============
const createProjectFolder = async (projectName) => {
    try {
        const rsRoot = process.env.RS_ROOT || '/home/kk/RS';
        const cleanName = projectName.toUpperCase().replace(/\s+/g, '_');
        const folderPath = path.join(rsRoot, cleanName);
        
        // Check if folder already exists
        if (fs.existsSync(folderPath)) {
            return {
                success: false,
                message: `Folder '${cleanName}' already exists`
            };
        }
        
        // Create the folder
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`📁 Created folder: ${cleanName}`);
        
        return {
            success: true,
            message: `Folder '${cleanName}' created successfully`,
            data: {
                folder: cleanName,
                path: folderPath
            }
        };
        
    } catch (error) {
        console.error('❌ Error creating folder:', error);
        return {
            success: false,
            message: 'Error creating folder',
            error: error.message
        };
    }
};

module.exports = {
    syncProjects,
    createProjectFolder
};