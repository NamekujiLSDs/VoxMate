const store = require('electron-store');
const log = require('electron-log');
const config = new store()

module.exports = {
    preview: {
        id: 'preview',
        title: 'Preview Crosshair',
        cat: 'Crosshair',
        type: 'preview',
    },
    crosshairType: {
        id: 'crosshairType',
        title: 'Crosshair Type',
        cat: 'Crosshair',
        type: 'select',
        val: config.get('crosshairType', 'url'),
        options: {
            url: 'URL',
            localFile: 'Local File',
        },
    },
    crosshairUrl: {
        id: 'crosshairUrlText',
        title: 'Crosshair URL',
        cat: 'Crosshair',
        type: 'text',
        val: config.get('crosshairUrl', 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png'),
    },
    crosshairFile: {
        id: 'crosshairLocalFile',
        title: 'Crosshair File',
        cat: 'Crosshair',
        type: 'file',
        val: config.get('crosshairUrl', ''),
    },
    crosshairFile: {
        id: 'crosshairLocalFile',
        title: 'Crosshair File',
        cat: 'Crosshair',
        type: 'file',
        val: config.get('crosshairFilePath', ''),
    },
    crosshairFilePath: {
        id: 'crosshairLocalFile',
        title: 'Crosshair File Path',
        cat: 'Crosshair',
        type: 'display',
        val: config.get('crosshairFilePath', ''),
    },
}