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
                this.isLoggedIn = false;
                if (this.rpc) {
                    try {
                        const p = this.rpc.destroy();
                        if (p && typeof p.catch === 'function') p.catch(() => {});
                    } catch (e) {}
                    this.rpc = null;
                }
            });
        } catch (e) {
            console.log('Discord RPC error:', e.message);
            this.rpc = null;
            this.isLoggedIn = false;
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
            if (this.isLoggedIn) {
                try {
                    const p = this.rpc.destroy();
                    if (p && typeof p.catch === 'function') p.catch(() => {});
                } catch (e) {}
            }
            this.rpc = null;
            this.isLoggedIn = false;
        }
    }
}

module.exports = DiscordRpcService;
