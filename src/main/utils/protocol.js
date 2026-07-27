const { app, protocol } = require('electron');

let registered = false;

const registerVmcProtocol = () => {
    if (registered) return;

    protocol.registerSchemesAsPrivileged([
        {
            scheme: 'vmc',
            privileges: {
                secure: true,
                corsEnabled: true
            }
        }
    ]);

    app.on('ready', () => {
        protocol.registerFileProtocol('vmc', (request, callback) => {
            const urlPath = decodeURI(request.url.toString().replace(/^vmc:\/\//, '').replace(/^vmc:\//, ''));
            callback(urlPath);
        });
    });

    registered = true;
};

module.exports = {
    registerVmcProtocol
};
