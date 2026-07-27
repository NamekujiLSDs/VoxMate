const Store = require('electron-store');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const config = new Store();

const getSwapFolderPath = () => {
    return path.join(app.getPath('documents'), './vmc-swap');
};

const createSwapFolder = () => {
    const swapFolder = getSwapFolderPath();
    const cssFolder = path.join(swapFolder, './css');
    const crosshairFolder = path.join(swapFolder, './crosshair');
    const skyboxFolder = path.join(swapFolder, './skybox');
    const settingFolder = path.join(swapFolder, './settings');

    if (!fs.existsSync(swapFolder)) fs.mkdirSync(swapFolder, { recursive: true });
    if (!fs.existsSync(cssFolder)) fs.mkdirSync(cssFolder, { recursive: true });
    if (!fs.existsSync(crosshairFolder)) fs.mkdirSync(crosshairFolder, { recursive: true });
    if (!fs.existsSync(skyboxFolder)) fs.mkdirSync(skyboxFolder, { recursive: true });
    if (!fs.existsSync(settingFolder)) fs.mkdirSync(settingFolder, { recursive: true });
};

const initFirstTimeAssets = (baseDir) => {
    if (!config.get('isFirstTime', true)) return;

    const swapFolder = getSwapFolderPath();
    const titleLogo = path.join(baseDir, './src/assets/img/title_logo.png');
    const menuBg = path.join(baseDir, './src/assets/img/menu_background.jpg');

    if (!fs.existsSync(path.join(swapFolder, 'title_logo.png')) && fs.existsSync(titleLogo)) {
        fs.copyFileSync(titleLogo, path.join(swapFolder, 'title_logo.png'));
    }

    if (!fs.existsSync(path.join(swapFolder, 'menu_background.jpg')) && fs.existsSync(menuBg)) {
        fs.copyFileSync(menuBg, path.join(swapFolder, 'menu_background.jpg'));
    }

    config.set('isFirstTime', false);
};

module.exports = {
    config,
    getSwapFolderPath,
    createSwapFolder,
    initFirstTimeAssets
};
