const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { config, getSwapFolderPath } = require('../utils/config');
const { getCrosshairDom, getCustomCssDom } = require('../ui/crosshairTemplate');

const registerSettingHandlers = (baseDir, settingsTemplate, getGameWindow) => {
    ipcMain.handle('settingDom', async () => {
        return settingsTemplate.renderSettingsFrame();
    });

    ipcMain.handle('loadSettingStylesheets', () => {
        return settingsTemplate.loadSettingStylesheets();
    });

    ipcMain.handle('settingTabChange', async (e, name) => {
        return settingsTemplate.renderTab(name);
    });

    ipcMain.on('saveSettingValue', (e, name, value) => {
        config.set(name, value);
    });

    ipcMain.handle('getSetting', async (e, value) => {
        return config.get(value);
    });

    ipcMain.handle('dirName', (e, v) => {
        return path.join(baseDir, v);
    });

    ipcMain.handle('localCssFullPath', (e, v) => {
        return path.join(getSwapFolderPath(), 'css', v);
    });

    ipcMain.handle('localCrosshairFullPath', (e, v) => {
        return path.join(getSwapFolderPath(), 'crosshair', v);
    });

    ipcMain.handle('localSkyboxFullPath', (e, v) => {
        return path.join(getSwapFolderPath(), 'skybox', v);
    });

    ipcMain.on('openFile', (e, v) => {
        const gameWindow = getGameWindow();
        if (!gameWindow || gameWindow.isDestroyed()) return;

        switch (v) {
            case 'crosshairPath':
                dialog.showOpenDialog(gameWindow, {
                    properties: ['openFile'],
                    filters: [{ name: 'crosshair image', extensions: ['png', 'apng', 'gif'] }]
                }).then(result => {
                    if (!result.canceled && result.filePaths[0]) {
                        gameWindow.webContents.send('localPath', v, result.filePaths[0]);
                        config.set(v, result.filePaths[0]);
                    }
                });
                break;
            case 'cssPath':
                dialog.showOpenDialog(gameWindow, {
                    properties: ['openFile'],
                    filters: [{ name: 'cascade style sheet', extensions: ['css'] }]
                }).then(result => {
                    if (!result.canceled && result.filePaths[0]) {
                        const selectedPath = result.filePaths[0];
                        gameWindow.webContents.send('localPath', v, selectedPath, path.basename(selectedPath));
                        config.set(v, selectedPath);
                    }
                });
                break;
            case 'skyboxPath':
                dialog.showOpenDialog(gameWindow, {
                    properties: ['openFile'],
                    filters: [{ name: 'skybox image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
                }).then(result => {
                    if (!result.canceled && result.filePaths[0]) {
                        const selectedPath = result.filePaths[0];
                        gameWindow.webContents.send('localPath', v, selectedPath, path.basename(selectedPath));
                        config.set(v, selectedPath);
                    }
                });
                break;
        }
    });

    ipcMain.handle('crosshairDom', () => {
        return getCrosshairDom(baseDir);
    });

    ipcMain.handle('cssDom', () => {
        return getCustomCssDom();
    });

    ipcMain.on('exportSetting', async (e, val) => {
        const folderPath = path.join(getSwapFolderPath(), 'settings');
        try {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            const now = new Date();
            const timestamp = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
            const filePath = path.join(folderPath, `${timestamp}-voxiom-setting.txt`);
            fs.writeFileSync(filePath, val || '', 'utf8');
            return { success: true, filePath };
        } catch (error) {
            console.error('Error saving setting file:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.on('importSetting', async () => {
        const gameWindow = getGameWindow();
        if (!gameWindow || gameWindow.isDestroyed()) return;

        dialog.showOpenDialog(gameWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Settings', extensions: ['txt'] }]
        }).then(result => {
            if (!result.canceled && result.filePaths[0]) {
                const filePath = result.filePaths[0];
                const fileContent = fs.readFileSync(filePath, 'utf8');
                gameWindow.webContents.send('importSettingValue', fileContent);
            }
        });
    });
};

module.exports = {
    registerSettingHandlers
};
