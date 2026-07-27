const RPC = require('discord-rpc');
const { config } = require('../utils/config');

class DiscordRpcService {
    constructor(clientId = '1319464002295824404') {
        this.clientId = clientId;
        this.rpc = null;
        this.isLoggedIn = false;
    }

    init() {
        if (!config.get('discordRpc', true)) return;

        try {
            this.rpc = new RPC.Client({ transport: 'ipc' });
            this.rpc.on('ready', () => {
                this.isLoggedIn = true;
                this.setActivity();
            });

            this.rpc.login({ clientId: this.clientId }).catch(err => {
                console.log('Discord RPC login failed:', err.message);
            });
        } catch (e) {
            console.log('Discord RPC error:', e.message);
        }
    }

    setActivity(details = 'Next generation...', state = 'Playing Voxiom.io') {
        if (!this.rpc || !this.isLoggedIn) return;

        this.rpc.setActivity({
            pid: process.pid,
            state: state,
            details: details,
            startTimestamp: new Date(),
            largeImageText: 'VMC by Namekuji',
            buttons: [
                {
                    label: 'About VMC',
                    url: 'https://namekujilsds.github.io/VoxMate'
                }
            ]
        }).catch(err => {
            console.log('Failed to set Discord activity:', err.message);
        });
    }

    destroy() {
        if (this.rpc) {
            try {
                this.rpc.destroy();
            } catch (e) {}
            this.rpc = null;
            this.isLoggedIn = false;
        }
    }
}

module.exports = DiscordRpcService;
