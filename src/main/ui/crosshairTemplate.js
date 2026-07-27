const path = require('path');
const { app } = require('electron');
const { config, getSwapFolderPath } = require('../utils/config');

const getCrosshairDom = (baseDir) => {
    let crosshairUrl = '';
    const type = config.get('crosshairType', 'url');

    switch (type) {
        case 'url':
            crosshairUrl = config.get('crosshairUrl', 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png');
            break;
        case 'local':
            const localPath = config.get('crosshairPath', path.join(baseDir, './src/assets/img/Cross-lime.png'));
            crosshairUrl = 'vmc://' + localPath;
            break;
        case 'list':
            const listPath = path.join(getSwapFolderPath(), 'crosshair', config.get('localCrosshairList', ''));
            crosshairUrl = 'vmc://' + listPath;
            break;
    }

    const isEnabled = config.get('enableCustomCrosshair', true);
    return `<img src="${crosshairUrl}" id="crosshair" class="${isEnabled ? '' : 'hidden'}">\n<style id='crosshairCss'></style>`;
};

const getCustomCssDom = () => {
    const enable = config.get('enableCustomCss', true);
    const type = config.get('cssType');
    let link = '';

    switch (type) {
        case 'local':
            link = 'vmc://' + config.get('cssPath');
            break;
        case 'url':
            link = config.get('cssUrl');
            break;
        case 'list':
            link = 'vmc://' + path.join(getSwapFolderPath(), 'css', config.get('localCssList'));
            break;
    }

    const dom = enable ? `<link rel="stylesheet" id="customCss" href="${link}">` : '<link rel="stylesheet" id="customCss" href="">';
    const cssPath = config.get('cssPath', '');
    const fileName = cssPath.length > 0 ? path.basename(cssPath) : 'NONE';

    return [dom, fileName];
};

module.exports = {
    getCrosshairDom,
    getCustomCssDom
};
