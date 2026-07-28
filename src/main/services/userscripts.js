const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { config } = require('../utils/config');

const parseUserscriptHeader = (content, filename) => {
    const meta = {
        filename,
        name: filename,
        version: '1.0',
        description: 'No description provided.',
        author: 'Unknown'
    };
    const headerMatch = content.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
    if (!headerMatch) return meta;

    const lines = headerMatch[1].split('\n');
    for (const line of lines) {
        const match = line.match(/\/\/\s*@(\w+)\s+(.+)/);
        if (match) {
            const [, key, val] = match;
            const cleanKey = key.trim().toLowerCase();
            const cleanVal = val.trim();
            if (cleanKey === 'name') meta.name = cleanVal;
            else if (cleanKey === 'version') meta.version = cleanVal;
            else if (cleanKey === 'description') meta.description = cleanVal;
            else if (cleanKey === 'author') meta.author = cleanVal;
        }
    }
    return meta;
};

const getUserScriptsList = () => {
    try {
        const scriptFolderPath = path.join(app.getPath('documents'), './vmc-swap/userscript');
        if (!fs.existsSync(scriptFolderPath)) return [];

        const files = fs.readdirSync(scriptFolderPath);
        const userJsFiles = files.filter(file => file.endsWith('.user.js'));

        const list = [];
        for (const file of userJsFiles) {
            const filePath = path.join(scriptFolderPath, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const meta = parseUserscriptHeader(content, file);
                meta.enabled = config.get(`userscript_${file}`, true);
                list.push(meta);
            } catch (err) {
                console.error(`Error reading userscript (${file}):`, err);
            }
        }
        return list;
    } catch (error) {
        console.error('Error fetching userscripts list:', error);
        return [];
    }
};

const loadUserScripts = (webContents) => {
    try {
        if (!config.get('enableUserScripts', true)) return;

        const scriptFolderPath = path.join(app.getPath('documents'), './vmc-swap/userscript');
        if (!fs.existsSync(scriptFolderPath)) return;

        const files = fs.readdirSync(scriptFolderPath);
        const userJsFiles = files.filter(file => file.endsWith('.user.js'));

        for (const file of userJsFiles) {
            const isEnabled = config.get(`userscript_${file}`, true);
            if (!isEnabled) continue;

            const filePath = path.join(scriptFolderPath, file);
            fs.readFile(filePath, 'utf8', (err, scriptContent) => {
                if (err || !scriptContent) return;

                webContents.executeJavaScript(scriptContent)
                    .catch(error => console.error(`Error executing userscript (${file}):`, error));
            });
        }
    } catch (error) {
        console.error('Error loading userscripts:', error);
    }
};

module.exports = {
    getUserScriptsList,
    loadUserScripts
};
