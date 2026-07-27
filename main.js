const { app, session } = require('electron');

// 1. Utilities & Config
const { createSwapFolder, initFirstTimeAssets } = require('./src/main/utils/config');
const { registerVmcProtocol } = require('./src/main/utils/protocol');
const { applyChromiumFlags } = require('./src/main/utils/flags');

// 2. Services
const AdBlocker = require('./src/main/services/adblocker');
const ResourceSwapper = require('./src/main/services/swapper');
const DiscordRpcService = require('./src/main/services/discordRpc');

// 3. UI & Window Managers
const SettingsTemplate = require('./src/main/ui/settingsTemplate');
const { createSplashWindow, destroySplashWindow } = require('./src/main/windows/splashWindow');
const { createGameWindow, getGameWindow, getDummyWindow } = require('./src/main/windows/gameWindow');

// 4. IPC Handlers
const { registerAllIpcHandlers } = require('./src/main/ipc');

// Override isPackaged behavior as in original app
Object.defineProperty(app, 'isPackaged', { get: () => true });

// Register custom protocol and flags before app ready
registerVmcProtocol();
applyChromiumFlags();

const adBlocker = new AdBlocker(__dirname);
const resourceSwapper = new ResourceSwapper(__dirname);
const discordRpcService = new DiscordRpcService();
const settingsTemplate = new SettingsTemplate(__dirname);

registerAllIpcHandlers(__dirname, settingsTemplate, getGameWindow);

app.on('ready', () => {
    createSwapFolder();
    initFirstTimeAssets(__dirname);

    // WebRequest Interceptor (AdBlock & ResourceSwapper)
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = details.url;

        // 1. AdBlocker Check
        if (adBlocker.shouldBlock(url)) {
            return callback({ cancel: true });
        }

        // 2. Resource Swapper Check
        const redirectURL = resourceSwapper.getRedirectUrl(url);
        if (redirectURL) {
            return callback({ redirectURL });
        }

        callback({});
    });

    // Launch Splash Window -> transition to Game Window
    createSplashWindow(__dirname, () => {
        createGameWindow(__dirname, () => {
            destroySplashWindow();
        }, discordRpcService);
    });
});

app.on('quit', () => {
    const gameWin = getGameWindow();
    const dummyWin = getDummyWindow();
    if (gameWin && !gameWin.isDestroyed()) gameWin.destroy();
    if (dummyWin && !dummyWin.isDestroyed()) dummyWin.destroy();
    discordRpcService.destroy();
});
