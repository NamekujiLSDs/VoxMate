const shortcut = require('electron-localshortcut');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const registerShortcuts = (gameWindow, dummyWindow) => {
    // Esc: unfocus via dummy window then return focus
    shortcut.register(gameWindow, 'Esc', async () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        gameWindow.webContents.send('escape');
        if (dummyWindow && !dummyWindow.isDestroyed()) {
            await dummyWindow.show();
            await dummyWindow.focus();
            await dummyWindow.hide();
        }
        await sleep(100);
        if (!gameWindow.isDestroyed()) {
            await gameWindow.focus();
        }
    });

    // F1: open settings window
    shortcut.register(gameWindow, 'F1', async () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        if (dummyWindow && !dummyWindow.isDestroyed()) {
            await dummyWindow.show();
            await dummyWindow.focus();
            await dummyWindow.hide();
        }
        if (!gameWindow.isDestroyed()) {
            await gameWindow.focus();
            gameWindow.webContents.send('openSetting');
        }
    });

    // F11: toggle fullscreen
    shortcut.register(gameWindow, 'F11', () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        gameWindow.setFullScreen(!gameWindow.isFullScreen());
    });

    // F5: reload page
    shortcut.register(gameWindow, 'F5', () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        gameWindow.webContents.send('reload');
    });

    // F12: toggle dev tools
    shortcut.register(gameWindow, 'F12', () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        gameWindow.webContents.toggleDevTools();
    });
};

const unregisterShortcuts = (gameWindow) => {
    if (gameWindow && !gameWindow.isDestroyed()) {
        shortcut.unregisterAll(gameWindow);
    }
};

module.exports = {
    registerShortcuts,
    unregisterShortcuts
};
