const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const loadUserScripts = (webContents) => {
    try {
        const scriptFolderPath = path.join(app.getPath('documents'), './vmc-swap/userscript');
        if (!fs.existsSync(scriptFolderPath)) return;

        const files = fs.readdirSync(scriptFolderPath);
        const userJsFiles = files.filter(file => file.endsWith('.user.js'));

        for (const file of userJsFiles) {
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
    loadUserScripts
};
