const { autoUpdater } = require('electron-updater');

const startAutoUpdateCheck = (splashWindow, onComplete) => {
    if (!splashWindow || splashWindow.isDestroyed()) return;

    let updateCheckTimeout = null;

    autoUpdater.on('checking-for-update', () => {
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'Checking for updates...');
        }
        updateCheckTimeout = setTimeout(() => {
            if (!splashWindow.isDestroyed()) {
                splashWindow.webContents.send('status', 'Update check error!');
            }
            setTimeout(() => onComplete(), 1000);
        }, 15000);
    });

    autoUpdater.on('update-available', (i) => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', `Found new version v${i.version}!`);
        }
    });

    autoUpdater.on('update-not-available', () => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'You are using the latest version!');
        }
        setTimeout(() => onComplete(), 1000);
    });

    autoUpdater.on('error', (e) => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'Error! ' + (e ? e.name : ''));
        }
        setTimeout(() => onComplete(), 1000);
    });

    autoUpdater.on('download-progress', () => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'Downloading new version...');
        }
    });

    autoUpdater.on('update-downloaded', () => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'Update downloaded');
        }
        setTimeout(() => autoUpdater.quitAndInstall(), 1000);
    });

    autoUpdater.autoDownload = 'download';
    autoUpdater.allowPrerelease = false;
    autoUpdater.checkForUpdates();
};

module.exports = {
    startAutoUpdateCheck
};
