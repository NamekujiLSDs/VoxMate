const { ipcMain, dialog, session, app, shell } = require('electron');
const { exec } = require('child_process');
const { getSwapFolderPath } = require('../utils/config');

const registerSystemHandlers = (getGameWindow) => {
    ipcMain.on('openExplorer', (e, subFolder) => {
        const path = require('path');
        const fs = require('fs');
        const targetFolder = (typeof subFolder === 'string' && subFolder) ? path.join(getSwapFolderPath(), subFolder) : getSwapFolderPath();
        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
        shell.openPath(targetFolder).catch(err => {
            console.error('Failed to open folder:', err);
        });
    });

    ipcMain.handle('version', () => {
        return app.getVersion();
    });

    ipcMain.on('openTutorial', (e, val) => {
        switch (val) {
            case 'resourceSwapper':
                shell.openExternal('https://namekujilsds.github.io/VoxMate/tutorial#swapper');
                break;
            case 'adBlock':
                shell.openExternal('https://namekujilsds.github.io/VoxMate/tutorial#adblock');
                break;
        }
    });

    ipcMain.on('openBrowser', (e, val) => {
        if (val) shell.openExternal(val);
    });

    ipcMain.on('log', (e, val) => {
        console.log(val);
    });

    ipcMain.on('clear-cache', async () => {
        const gameWindow = getGameWindow();
        if (!gameWindow || gameWindow.isDestroyed()) return;

        const response = await dialog.showMessageBox(gameWindow, {
            type: 'question',
            buttons: ['OK', 'Cancel'],
            defaultId: 1,
            message: 'Do you really want to delete the cache?\nAfter deletion, the client will restart.'
        });

        if (response.response === 0) {
            try {
                await session.defaultSession.clearCache();
                app.relaunch();
                app.quit();
            } catch (err) {
                console.error('Error clearing cache:', err);
            }
        }
    });

    ipcMain.on('clear-all-data-and-restart', async () => {
        const gameWindow = getGameWindow();
        const response = await dialog.showMessageBox(gameWindow || {}, {
            type: 'question',
            buttons: ['OK', 'Cancel'],
            defaultId: 1,
            message: 'Delete all application data.\nAre you sure?'
        });

        if (response.response === 0) {
            try {
                await session.defaultSession.clearCache();
                await session.defaultSession.clearStorageData();
                await session.defaultSession.clearAuthCache();
                app.relaunch();
                app.quit();
            } catch (err) {
                console.error('Error clearing data:', err);
            }
        }
    });
};

module.exports = {
    registerSystemHandlers
};
