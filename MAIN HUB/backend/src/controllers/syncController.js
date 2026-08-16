// /home/kk/RS/MAIN HUB/backend/src/controllers/syncController.js

const fs = require('fs');
const path = require('path');
const { syncProjects } = require('../services/projectSync');

const RS_ROOT = process.env.RS_ROOT || path.join(__dirname, '../../../..');

// =============== SYNC PROJECTS ===============
exports.syncProjects = async (req, res) => {
    try {
        const result = await syncProjects();
        res.json({ 
            success: true, 
            message: 'Projects synced successfully',
            ...result
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// =============== CREATE A NEW PROJECT FOLDER ===============
exports.createProjectFolder = async (req, res) => {
    try {
        const { projectName } = req.body;
        
        if (!projectName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Project name is required' 
            });
        }

        // Sanitize project name - convert to uppercase and replace spaces with underscores
        const cleanName = projectName.toUpperCase().replace(/\s+/g, '_');
        const folderPath = path.join(RS_ROOT, cleanName);

        // Check if folder already exists
        if (fs.existsSync(folderPath)) {
            return res.status(400).json({ 
                success: false, 
                message: `Folder '${cleanName}' already exists` 
            });
        }

        // Create the folder
        fs.mkdirSync(folderPath, { recursive: true });
        
        // Create backend and frontend subfolders
        fs.mkdirSync(path.join(folderPath, 'backend'), { recursive: true });
        fs.mkdirSync(path.join(folderPath, 'frontend'), { recursive: true });

        // Create a basic package.json for backend
        const packageJson = {
            name: cleanName.toLowerCase(),
            version: "1.0.0",
            main: "src/index.js",
            scripts: {
                "start": "node src/index.js",
                "dev": "nodemon src/index.js"
            },
            dependencies: {
                "express": "^4.18.2",
                "mongoose": "^7.0.0",
                "dotenv": "^16.0.3",
                "cors": "^2.8.5"
            },
            devDependencies: {
                "nodemon": "^2.0.20"
            }
        };

        fs.writeFileSync(
            path.join(folderPath, 'backend', 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // Create src folder
        fs.mkdirSync(path.join(folderPath, 'backend', 'src'), { recursive: true });

        // Create a basic index.js for backend
        const indexJs = `
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: '${projectName} API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('🚀 ${projectName} API running on port', PORT);
});
`;

        fs.writeFileSync(
            path.join(folderPath, 'backend', 'src', 'index.js'),
            indexJs
        );

        // Create .env file
        const envContent = `
PORT=5000
MONGODB_URI=mongodb://localhost:27017/${cleanName.toLowerCase().replace(/_/g, '_')}
NODE_ENV=development
`;
        fs.writeFileSync(path.join(folderPath, 'backend', '.env'), envContent);

        console.log(`✅ Created project folder: ${cleanName}`);

        // Sync projects after creating folder
        await syncProjects();

        res.json({ 
            success: true, 
            message: `Project folder '${cleanName}' created successfully`,
            data: {
                folder: cleanName,
                path: folderPath
            }
        });
    } catch (error) {
        console.error('❌ Create folder error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};