const Store = require('electron-store');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// conf (electron-store の実体) は get() の度に設定ファイルを同期読込+JSON.parse する
// (node_modules/conf/dist/source/index.js の `get store()` 参照)。
// onBeforeRequest など毎リクエスト呼ばれる経路で重いため、メモリにキャッシュする。
// 書き込みは必ずこのプロセスの set store() 経由なので、キャッシュは常に最新。
class CachedStore extends Store {
    get store() {
        if (!this._cache) this._cache = super.store;
        return this._cache;
    }

    set store(value) {
        super.store = value;
        this._cache = value;
    }
}

const config = new CachedStore();

const getSwapFolderPath = () => {
    return path.join(app.getPath('documents'), './vmc-swap');
};

const createSwapFolder = () => {
    const swapFolder = getSwapFolderPath();
    const cssFolder = path.join(swapFolder, './css');
    const crosshairFolder = path.join(swapFolder, './crosshair');
    const skyboxFolder = path.join(swapFolder, './skybox');
    const settingFolder = path.join(swapFolder, './settings');
    const userscriptFolder = path.join(swapFolder, './userscript');

    if (!fs.existsSync(swapFolder)) fs.mkdirSync(swapFolder, { recursive: true });
    if (!fs.existsSync(cssFolder)) fs.mkdirSync(cssFolder, { recursive: true });
    if (!fs.existsSync(crosshairFolder)) fs.mkdirSync(crosshairFolder, { recursive: true });
    if (!fs.existsSync(skyboxFolder)) fs.mkdirSync(skyboxFolder, { recursive: true });
    if (!fs.existsSync(settingFolder)) fs.mkdirSync(settingFolder, { recursive: true });
    if (!fs.existsSync(userscriptFolder)) fs.mkdirSync(userscriptFolder, { recursive: true });
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
