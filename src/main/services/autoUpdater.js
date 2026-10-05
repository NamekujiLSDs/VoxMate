const { autoUpdater } = require('electron-updater');

// スプラッシュが長く感じられないよう、ステータス表示後の待ちと応答なし判定を短くしている
const SPLASH_STATUS_MS = 300;
const UPDATE_CHECK_TIMEOUT_MS = 8000;

const startAutoUpdateCheck = (splashWindow, onFinish) => {
    if (!splashWindow || splashWindow.isDestroyed()) return;

    // error イベント・タイムアウト・checkForUpdates の reject が重なっても
    // ゲームウィンドウを二重に作らないよう、完了コールバックは1回だけ実行する
    let finished = false;
    const onComplete = () => {
        if (finished) return;
        finished = true;
        onFinish();
    };

    let updateCheckTimeout = null;

    autoUpdater.on('checking-for-update', () => {
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'Checking for updates...');
        }
        updateCheckTimeout = setTimeout(() => {
            if (!splashWindow.isDestroyed()) {
                splashWindow.webContents.send('status', 'Update check error!');
            }
            setTimeout(() => onComplete(), SPLASH_STATUS_MS);
        }, UPDATE_CHECK_TIMEOUT_MS);
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
        setTimeout(() => onComplete(), SPLASH_STATUS_MS);
    });

    autoUpdater.on('error', (e) => {
        if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
        if (!splashWindow.isDestroyed()) {
            splashWindow.webContents.send('status', 'Skip update check');
        }
        setTimeout(() => onComplete(), SPLASH_STATUS_MS);
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
                setTimeout(() => onComplete(), SPLASH_STATUS_MS);
            });
        }
    } catch (err) {
        console.log('AutoUpdater Exception bypassed:', err.message);
        setTimeout(() => onComplete(), SPLASH_STATUS_MS);
    }
};

module.exports = {
    startAutoUpdateCheck
};
