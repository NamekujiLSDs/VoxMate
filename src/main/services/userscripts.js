const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { app } = require('electron');
const { config } = require('../utils/config');

const parseUserscriptHeader = (content, filename) => {
    const meta = {
        filename,
        name: filename,
        version: '1.0',
        description: 'No description provided.',
        author: 'Unknown',
        requires: []
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
            else if (cleanKey === 'require') meta.requires.push(cleanVal);
        }
    }
    return meta;
};

const getCachePath = (url, cacheDir) => {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return path.join(cacheDir, `${hash}.js`);
};

const fetchRequireScript = (url, cacheDir) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const cacheFile = getCachePath(url, cacheDir);
        if (fs.existsSync(cacheFile)) {
            try {
                const cachedContent = fs.readFileSync(cacheFile, 'utf8');
                return resolve(cachedContent);
            } catch (e) {}
        }

        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchRequireScript(res.headers.location, cacheDir).then(resolve);
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data) {
                    try {
                        fs.writeFileSync(cacheFile, data, 'utf8');
                    } catch (e) {}
                }
                resolve(data);
            });
        }).on('error', (err) => {
            console.error(`Failed to fetch @require script (${url}):`, err);
            resolve('');
        });
    });
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

const loadUserScripts = async (webContents) => {
    try {
        if (!config.get('enableUserScripts', true)) return;

        const scriptFolderPath = path.join(app.getPath('documents'), './vmc-swap/userscript');
        if (!fs.existsSync(scriptFolderPath)) return;

        const cacheDir = path.join(scriptFolderPath, '.cache');

        const files = fs.readdirSync(scriptFolderPath);
        const userJsFiles = files.filter(file => file.endsWith('.user.js'));

        for (const file of userJsFiles) {
            const isEnabled = config.get(`userscript_${file}`, true);
            if (!isEnabled) continue;

            const filePath = path.join(scriptFolderPath, file);
            try {
                const scriptContent = fs.readFileSync(filePath, 'utf8');
                if (!scriptContent) continue;

                const meta = parseUserscriptHeader(scriptContent, file);
                let fullScript = '';

                if (meta.requires && meta.requires.length > 0) {
                    for (const reqUrl of meta.requires) {
                        const reqCode = await fetchRequireScript(reqUrl, cacheDir);
                        if (reqCode) {
                            fullScript += reqCode + '\n;\n';
                        }
                    }
                }

                fullScript = `window.__currentExecutingUserscript = ${JSON.stringify(file)};\n` + fullScript + `\nwindow.__currentExecutingUserscript = null;`;

                webContents.executeJavaScript(fullScript)
                    .catch(error => console.error(`Error executing userscript (${file}):`, error));
            } catch (err) {
                console.error(`Error reading userscript (${file}):`, err);
            }
        }
    } catch (error) {
        console.error('Error loading userscripts:', error);
    }
};

module.exports = {
    getUserScriptsList,
    loadUserScripts
};
