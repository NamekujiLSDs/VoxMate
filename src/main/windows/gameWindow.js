const { BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { config } = require('../utils/config');
const { registerShortcuts, unregisterShortcuts } = require('../services/shortcuts');
const { loadUserScripts } = require('../services/userscripts');

let gameWindow = null;
let dummyWindow = null;

const storeWindowPos = () => {
    if (!gameWindow || gameWindow.isDestroyed()) return;
    const { x, y, width, height } = gameWindow.getBounds();
    if (!gameWindow.isFullScreen()) {
        config.set('windowHeight', height || 1080);
        config.set('windowWidth', width || 1920);
        config.set('windowX', x || 0);
        config.set('windowY', y || 0);
    }
    config.set('fullscreen', gameWindow.isFullScreen());
    config.set('maxsize', gameWindow.isMaximized());
};

const createGameWindow = (baseDir, onGameReady, discordRpcService) => {
    gameWindow = new BrowserWindow({
        show: false,
        width: config.get('windowWidth', 1536),
        height: config.get('windowHeight', 864),
        fullscreen: config.get('fullscreen', true),
        webPreferences: {
            preload: path.join(baseDir, './src/preload/game-preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false
        }
    });

    dummyWindow = new BrowserWindow({
        parent: gameWindow,
        show: false,
        width: 0,
        height: 0,
        frame: false,
        transparent: true
    });

    gameWindow.setPosition(config.get('windowX') || 0, config.get('windowY') || 0);
    gameWindow.loadURL('https://voxiom.io/');
    Menu.setApplicationMenu(null);

    // 初回描画の準備ができた時点で通知する (全リソース/広告の読込完了を待たない)。
    // 表示は showGameWindow() で、アップデート確認の完了とそろってから行う。
    gameWindow.once('ready-to-show', () => {
        if (onGameReady) onGameReady();
    });

    // オフライン等でページが読めない場合も、スプラッシュに居座らず先へ進める (-3 はリダイレクト等の中断)
    gameWindow.webContents.on('did-fail-load', (e, errorCode, desc, url, isMainFrame) => {
        if (isMainFrame && errorCode !== -3 && onGameReady) onGameReady();
    });

    // did-finish-load はリロードの度に発火する (RPC は多重接続しないようガード済み)
    gameWindow.webContents.on('did-finish-load', () => {
        if (!gameWindow || gameWindow.isDestroyed()) return;
        if (config.get('discordRpc', true) && discordRpcService) {
            discordRpcService.init();
        }
        loadUserScripts(gameWindow.webContents);
    });

    registerShortcuts(gameWindow, dummyWindow);

    gameWindow.on('close', () => {
        if (gameWindow && !gameWindow.isDestroyed()) {
            storeWindowPos();
        }
        if (dummyWindow && !dummyWindow.isDestroyed()) {
            dummyWindow.destroy();
            dummyWindow = null;
        }
        unregisterShortcuts(gameWindow);
    });

    // Handle external links and auth popups
    gameWindow.webContents.on('new-window', (e, url) => {
        switch (url) {
            case 'https://voxiom.io/auth/discord':
            case 'https://voxiom.io/auth/google':
            case 'https://voxiom.io/auth/facebook':
                gameWindow.webContents.loadURL(url);
                e.preventDefault();
                break;
            default:
                if (url.startsWith('https://www.youtube.com/') ||
                    url.startsWith('https://www.twitch.tv/') ||
                    url.startsWith('https://discord.gg/') ||
                    url.startsWith('https://x.com/') ||
                    url.startsWith('https://twitter.com/') ||
                    url.startsWith('https://reddit.com/') ||
                    url.startsWith('https://voxiom.io/assets/') ||
                    url.startsWith('https://cuberealm.io/')) {
                    shell.openExternal(url);
                    e.preventDefault();
                }
                break;
        }
    });

    gameWindow.webContents.on('will-navigate', (e, url) => {
        if (url.startsWith('https://voxiom.io/assets/')) {
            shell.openExternal(url);
            e.preventDefault();
        }
    });

    gameWindow.webContents.on('will-prevent-unload', (e) => {
        e.preventDefault();
    });

    return { gameWindow, dummyWindow };
};

const showGameWindow = () => {
    if (!gameWindow || gameWindow.isDestroyed() || gameWindow.isVisible()) return;
    gameWindow.show();
    if (config.get('maxsize')) gameWindow.maximize();
};

const getGameWindow = () => gameWindow;
const getDummyWindow = () => dummyWindow;

module.exports = {
    createGameWindow,
    showGameWindow,
    getGameWindow,
    getDummyWindow
};
