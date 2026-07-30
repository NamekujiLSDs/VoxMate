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

    const isMac = process.platform === 'darwin';

    autoUpdater.on('update-available', (i) => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (isMac) {
            const { shell } = require('electron');
            if (!splashWindow.isDestroyed()) {
                splashWindow.webContents.send('status', `New version v${i.version} available! Opening download page...`);
            }
            shell.openExternal('https://github.com/NamekujiLSDs/VoxMate/releases/latest');
            setTimeout(() => onComplete(), 2500);
        } else {
            if (!splashWindow.isDestroyed()) {
                splashWindow.webContents.send('status', `Found new version v${i.version}! Downloading...`);
            }
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
            splashWindow.webContents.send('status', 'Skip update check');
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

    try {
        const p = autoUpdater.checkForUpdates();
        if (p && typeof p.catch === 'function') {
            p.catch((err) => {
                console.log('AutoUpdater check bypassed (dev/test):', err.message);
                if (!splashWindow.isDestroyed()) {
                    splashWindow.webContents.send('status', 'Bypassed update check');
                }
                setTimeout(() => onComplete(), 1000);
            });
        }
    } catch (err) {
        console.log('AutoUpdater Exception bypassed:', err.message);
        setTimeout(() => onComplete(), 1000);
    }
};

module.exports = {
    startAutoUpdateCheck
};
