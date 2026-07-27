const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { config, getSwapFolderPath } = require('../utils/config');

class AdBlocker {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.defaultBlockList = [];
        this.userBlockList = null;
        this.loadDefaultList();
        this.loadUserList();
    }

    loadDefaultList() {
        try {
            const jsonPath = path.join(this.baseDir, './src/assets/json/adblock-default.json');
            if (fs.existsSync(jsonPath)) {
                const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                this.defaultBlockList = data.urls || [];
            }
        } catch (e) {
            console.error('Failed to load default adblock list:', e);
        }
    }

    loadUserList() {
        try {
            const userFile = path.join(getSwapFolderPath(), 'adblock-user.json');
            if (fs.existsSync(userFile)) {
                const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
                this.userBlockList = data.urls || [];
            } else {
                this.userBlockList = null;
            }
        } catch (e) {
            console.error('Failed to load user adblock list:', e);
            this.userBlockList = null;
        }
    }

    getUserBlockList() {
        if (this.userBlockList === null) this.loadUserList();
        return this.userBlockList;
    }

    shouldBlock(url) {
        const blockEnable = config.get('enableAdBlocker', true);
        if (!blockEnable) return false;

        const blockUser = config.get('useUserAdBlockList', true);
        const userList = this.getUserBlockList();

        if (blockUser && userList) {
            if (userList.some(domain => url.includes(domain))) {
                return true;
            }
        }

        const blockDef = config.get('useDefAdBlockList', true);
        if (blockDef && this.defaultBlockList.length > 0) {
            if (this.defaultBlockList.some(domain => url.includes(domain))) {
                return true;
            }
        }

        return false;
    }
}

module.exports = AdBlocker;
