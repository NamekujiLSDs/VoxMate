const fs = require('fs');
const path = require('path');
const { config, getSwapFolderPath } = require('../utils/config');

class ResourceSwapper {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.defaultSwapList = {};
        this.userSwapList = null;
        this.loadDefaultList();
        this.loadUserList();
    }

    loadDefaultList() {
        try {
            const jsonPath = path.join(this.baseDir, './src/assets/json/swapper-default.json');
            if (fs.existsSync(jsonPath)) {
                this.defaultSwapList = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            }
        } catch (e) {
            console.error('Failed to load default swapper list:', e);
        }
    }

    loadUserList() {
        try {
            const userFile = path.join(getSwapFolderPath(), 'swapper-user.json');
            if (fs.existsSync(userFile)) {
                this.userSwapList = JSON.parse(fs.readFileSync(userFile, 'utf8'));
            } else {
                this.userSwapList = null;
            }
        } catch (e) {
            console.error('Failed to load user swapper list:', e);
            this.userSwapList = null;
        }
    }

    getUserSwapList() {
        if (this.userSwapList === null) this.loadUserList();
        return this.userSwapList;
    }

    getRedirectUrl(url) {
        const swapEnable = config.get('enableResourceSwapper', true);
        if (!swapEnable) return null;

        const swapUser = config.get('useUserSwapList', true);
        const swapFolder = getSwapFolderPath();
        const userSwapList = this.getUserSwapList();

        // Try user swap list first if enabled
        if (swapUser && userSwapList && userSwapList[url]) {
            const relativePath = userSwapList[url];
            const targetPath = path.join(swapFolder, relativePath);
            if (fs.existsSync(targetPath)) {
                return 'vmc://' + targetPath;
            }
        }

        // Fallback to default swap list if enabled
        const swapDef = config.get('useDefSwapList', true);
        if (swapDef && this.defaultSwapList[url]) {
            const relativePath = this.defaultSwapList[url];
            const targetPath = path.join(swapFolder, relativePath);
            if (fs.existsSync(targetPath)) {
                return 'vmc://' + targetPath;
            }
        }

        return null;
    }
}

module.exports = ResourceSwapper;
