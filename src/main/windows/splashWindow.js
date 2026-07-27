const { BrowserWindow, app } = require('electron');
const path = require('path');
const { startAutoUpdateCheck } = require('../services/autoUpdater');

let splashWindow = null;

const createSplashWindow = (baseDir, onSplashFinish) => {
    splashWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 450,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(baseDir, './src/preload/splash-preload.js')
        }
    });

    splashWindow.loadFile(path.join(baseDir, './src/assets/html/splash.html'));

    splashWindow.webContents.on('did-finish-load', () => {
        if (!splashWindow || splashWindow.isDestroyed()) return;
        splashWindow.webContents.send('ver', app.getVersion());
        splashWindow.show();
        startAutoUpdateCheck(splashWindow, onSplashFinish);
    });

    return splashWindow;
};

const destroySplashWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
    }
};

const getSplashWindow = () => splashWindow;

module.exports = {
    createSplashWindow,
    destroySplashWindow,
    getSplashWindow
};
