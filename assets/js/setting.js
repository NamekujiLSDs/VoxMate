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
    crosshairType: {
        id: 'crosshairUrlText',
        title: 'Crosshair URL',
        cat: 'Crosshair',
        type: 'text',
        val: config.get('crosshairUrl', 'url'),
    },

}