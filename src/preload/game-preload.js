const { contextBridge, ipcRenderer } = require('electron');
const { injectSkyChanger } = require('./skyChanger');
const { injectSimpleInfoGui } = require('./simpleInfoGui');

let serverId = '';
let isRawInputEnabled = true;
let isDesynchronizedEnabled = true;

const registeredCustomSettings = new Map();
const registeredCustomTabs = new Map();

ipcRenderer.invoke('getSetting', 'enableRawInput').then(val => {
    if (typeof val === 'boolean') isRawInputEnabled = val;
});

ipcRenderer.invoke('getSetting', 'enableDesynchronized').then(val => {
    if (typeof val === 'boolean') isDesynchronizedEnabled = val;
});

const originalRequestPointerLock = Element.prototype.requestPointerLock;
Element.prototype.requestPointerLock = function(options) {
    if (isRawInputEnabled) {
        const opts = Object.assign({}, options, { unadjustedMovement: true });
        return originalRequestPointerLock.call(this, opts).catch(() => {
            return originalRequestPointerLock.call(this, options);
        });
    }
    return originalRequestPointerLock.call(this, options);
};

// WebGL Desynchronized & High Performance Hook
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, attributes) {
    if (isDesynchronizedEnabled && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl')) {
        attributes = Object.assign({}, attributes, {
            desynchronized: true,
            powerPreference: 'high-performance'
        });
    }
    return originalGetContext.call(this, type, attributes);
};

// Crosshair CSS Helper
const refreshCrosshairCss = async () => {
    const w = await ipcRenderer.invoke('getSetting', 'crosshairWidth') || 20;
    const h = await ipcRenderer.invoke('getSetting', 'crosshairHeight') || 20;
    const o = await ipcRenderer.invoke('getSetting', 'crosshairOpacity') || 1;
    const r = await ipcRenderer.invoke('getSetting', 'crosshairRenderType') || 'pixelated';

    const css = `
    #crosshair {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: ${w}px;
        height: ${h}px;
        opacity: ${o};
        image-rendering: ${r};
    }`;

    const cssElement = document.getElementById('crosshairCss');
    if (cssElement) {
        cssElement.innerText = css;
    }
};

// Dynamic UserScript Custom Settings UI Renderer (Category Grouping & Custom Tabs)
const renderCustomSettingsUI = async (targetTabId = 'userscriptSetting') => {
    let container = document.getElementById('customUserScriptSettingsContainer');
    if (!container && targetTabId !== 'userscriptSetting') {
        container = document.getElementById('menuBody');
    }
    if (!container || !window.vmc?.getRegisteredCustomSettings) return;

    const allList = await window.vmc.getRegisteredCustomSettings();
    if (!allList || allList.length === 0) {
        if (container.id === 'customUserScriptSettingsContainer') container.innerHTML = '';
        return;
    }

    const list = allList.filter(item => {
        if (targetTabId === 'userscriptSetting') {
            return !item.tab || item.tab === 'userscriptSetting';
        }
        return item.tab === targetTabId;
    });

    if (list.length === 0) {
        if (container.id === 'customUserScriptSettingsContainer') container.innerHTML = '';
        return;
    }

    // Group items by category
    const categoriesMap = new Map();
    for (const item of list) {
        const cat = item.category || 'UserScript Dynamic Settings';
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
        categoriesMap.get(cat).push(item);
    }

    let html = '';
    for (const [catName, items] of categoriesMap.entries()) {
        html += `
        <div class="settingSectionHeader" style="margin-top: 20px; color: #a855f7;">${catName} (${items.length})</div>
        <div class="horizonalLine"></div>`;

        for (const item of items) {
            const id = item.id;
            const key = `custom_${id}`;
            const label = item.label || id;
            const type = item.type || 'text';
            const val = item.value !== undefined ? item.value : (item.default !== undefined ? item.default : '');

            html += `<div id="menuBodyItem" style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-top:8px;">`;
            html += `<span>${label}</span>`;

            if (type === 'checkbox') {
                html += `<input type="checkbox" name="${key}" id="${key}" oninput="window.vmc.saveSetting(this.id, this.checked)" ${val ? 'checked' : ''}>`;
            } else if (type === 'range') {
                const min = item.min ?? 0;
                const max = item.max ?? 100;
                const step = item.step ?? 1;
                html += `<div id="rangeNumHolder">
                    <input type="number" class="sizeInput" value="${val}" min="${min}" max="${max}" step="${step}" oninput="document.getElementById('${key}').value=this.value;window.vmc.saveSetting('${key}', parseFloat(this.value));">
                    <input type="range" name="${key}" id="${key}" value="${val}" min="${min}" max="${max}" step="${step}" oninput="window.vmc.saveSetting(this.id, parseFloat(this.value));">
                </div>`;
            } else if (type === 'number') {
                const min = item.min ?? 0;
                const max = item.max ?? 999999;
                const step = item.step ?? 1;
                html += `<input type="number" class="sizeInput" name="${key}" id="${key}" value="${val}" min="${min}" max="${max}" step="${step}" oninput="window.vmc.saveSetting(this.id, parseFloat(this.value));">`;
            } else if (type === 'select') {
                const options = Array.isArray(item.options) ? item.options : [];
                let optHtml = '';
                for (const opt of options) {
                    const optVal = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    optHtml += `<option value="${optVal}" ${String(val) === String(optVal) ? 'selected' : ''}>${optLabel}</option>`;
                }
                html += `<select name="${key}" id="${key}" onchange="window.vmc.saveSetting(this.id, this.value)">${optHtml}</select>`;
            } else if (type === 'button') {
                const btnText = item.buttonText || 'RUN';
                html += `<input type="button" id="menuButton" value="${btnText}" onclick="window.vmc.triggerCustomButton('${id}')">`;
            } else {
                html += `<input type="text" name="${key}" id="${key}" value="${val}" onchange="window.vmc.saveSetting(this.id, this.value)">`;
            }

            html += `</div><div class="horizonalLine"></div>`;
        }
    }

    if (container.id === 'menuBody' && targetTabId !== 'userscriptSetting') {
        const tabInfo = registeredCustomTabs.get(targetTabId);
        const title = tabInfo ? tabInfo.title : targetTabId;
        const icon = tabInfo ? tabInfo.icon : 'tune';

        container.innerHTML = `
        <div class="tabContainer" style="--tab-accent: #a855f7;">
            <div id="menuBodyTitle">
                <span class="material-symbols-outlined">${icon}</span>
                ${title}
            </div>
            <div class="horizonalLine"></div>
            ${html}
        </div>`;
    } else {
        container.innerHTML = html;
    }
};

const renderCustomSidebarTabs = () => {
    const itemHolder = document.getElementById('menuItemHolder');
    if (!itemHolder) return;

    for (const t of registeredCustomTabs.values()) {
        if (document.getElementById(t.id)) continue;

        const splitter = document.createElement('div');
        splitter.className = 'menuSplitter';

        const tabDiv = document.createElement('div');
        tabDiv.id = t.id;
        tabDiv.className = `menuItem`;
        tabDiv.onclick = () => {
            window.vmc.showSetting(t.id);
            window.vmc.saveSetting('lastOpen', t.id);
        };
        tabDiv.innerHTML = `
            <div class="menuItemIcon"><span class="material-symbols-outlined">${t.icon}</span></div>
            <div class="menuItemTitle">${t.title}</div>
        `;

        itemHolder.appendChild(splitter);
        itemHolder.appendChild(tabDiv);
    }
};

// Expose APIs to window.vmc
contextBridge.exposeInMainWorld('vmc', {
    closeSetting: () => {
        const settingWin = document.getElementById('settingWindow');
        if (settingWin) settingWin.classList.remove('settingShow');
    },

    showSetting: async (tabId) => {
        const settingDom = await ipcRenderer.invoke('settingTabChange', tabId);
        const selected = document.getElementsByClassName('menuSelected');
        if (selected.length > 0) {
            selected[0].classList.remove('menuSelected');
        }
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('menuSelected');

        const menuBody = document.getElementById('menuBody');
        if (menuBody) {
            menuBody.innerHTML = settingDom;
            if (tabId === 'userscriptSetting') {
                renderCustomSettingsUI();
            }
        }
    },

    saveSetting: (name, value) => {
        if (name === 'enableRawInput') {
            isRawInputEnabled = Boolean(value);
        }
        if (name === 'enableDesynchronized') {
            isDesynchronizedEnabled = Boolean(value);
        }
        if (name.startsWith('custom_')) {
            const customId = name.replace('custom_', '');
            document.dispatchEvent(new CustomEvent('vmc-setting-change', { detail: { id: customId, value } }));
        }
        ipcRenderer.send('saveSettingValue', name, value);
    },

    skyColorChange: async (id, value) => {
        // SkyColor is disabled
    },

    infoGuiChange: async (id, value) => {
        const detail = {};
        switch (id) {
            case 'enableSimpleInfo': detail.enabled = value; break;
            case 'infoPosition': detail.position = value; break;
            case 'infoMarginTop': detail.marginTop = parseInt(value) || 0; break;
            case 'infoMarginLeft': detail.marginLeft = parseInt(value) || 0; break;
            case 'infoShowFPS': detail.showFPS = value; break;
            case 'infoShowPing': detail.showPing = value; break;
            case 'infoShowPos': detail.showPos = value; break;
            case 'infoShowBlockPos': detail.showBlockPos = value; break;
            case 'infoShowChunkPos': detail.showChunkPos = value; break;
            case 'infoShowVelocity': detail.showVelocity = value; break;
            case 'infoShowAngles': detail.showAngles = value; break;
            case 'infoShowChunks': detail.showChunks = value; break;
            case 'infoShowNetBps': detail.showNetBps = value; break;
        }
        document.dispatchEvent(new CustomEvent('vmc-info-update', { detail }));
    },

    crosshairChange: async (id, value) => {
        const crosshairImg = document.getElementById('crosshair');
        const previewImg = document.getElementById('crosshairPreviewImage');

        switch (id) {
            case 'enableCustomCrosshair':
                if (crosshairImg) {
                    value ? crosshairImg.classList.remove('hidden') : crosshairImg.classList.add('hidden');
                }
                break;
            case 'crosshairType':
                if (value === 'url') {
                    const url = await ipcRenderer.invoke('getSetting', 'crosshairUrl') || 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png';
                    if (previewImg) previewImg.setAttribute('src', url);
                    if (crosshairImg) crosshairImg.setAttribute('src', url);
                } else if (value === 'local') {
                    const path = await ipcRenderer.invoke('getSetting', 'crosshairPath') || await ipcRenderer.invoke('dirName', './src/assets/img/Cross-lime.png');
                    const fullSrc = 'vmc://' + path;
                    if (previewImg) previewImg.setAttribute('src', fullSrc);
                    if (crosshairImg) crosshairImg.setAttribute('src', fullSrc);
                } else if (value === 'list') {
                    let path = await ipcRenderer.invoke('getSetting', 'localCrosshairList');
                    path = await ipcRenderer.invoke('localCrosshairFullPath', path);
                    const fullSrc = 'vmc://' + path;
                    if (previewImg) previewImg.setAttribute('src', fullSrc);
                    if (crosshairImg) crosshairImg.setAttribute('src', fullSrc);
                }
                break;
            case 'localCrosshairList':
                const filePath = await ipcRenderer.invoke('localCrosshairFullPath', value);
                const fullSrc = 'vmc://' + filePath;
                if (previewImg) previewImg.setAttribute('src', fullSrc);
                if (crosshairImg) crosshairImg.setAttribute('src', fullSrc);
                break;
            case 'crosshairUrl':
                const nowType = await ipcRenderer.invoke('getSetting', 'crosshairType');
                if (nowType === 'url') {
                    if (previewImg) previewImg.setAttribute('src', value);
                    if (crosshairImg) crosshairImg.setAttribute('src', value);
                }
                break;
            case 'crosshairWidthNum':
            case 'crosshairWidth':
                const widthInput = document.getElementById(id === 'crosshairWidthNum' ? 'crosshairWidth' : 'crosshairWidthNum');
                if (widthInput) widthInput.value = value;
                ipcRenderer.send('saveSettingValue', 'crosshairWidthNum', value);
                ipcRenderer.send('saveSettingValue', 'crosshairWidth', value);
                refreshCrosshairCss();
                break;
            case 'crosshairHeightNum':
            case 'crosshairHeight':
                const heightInput = document.getElementById(id === 'crosshairHeightNum' ? 'crosshairHeight' : 'crosshairHeightNum');
                if (heightInput) heightInput.value = value;
                ipcRenderer.send('saveSettingValue', 'crosshairHeightNum', value);
                ipcRenderer.send('saveSettingValue', 'crosshairHeight', value);
                refreshCrosshairCss();
                break;
            case 'crosshairOpacityNum':
            case 'crosshairOpacity':
                const opacityInput = document.getElementById(id === 'crosshairOpacityNum' ? 'crosshairOpacity' : 'crosshairOpacityNum');
                if (opacityInput) opacityInput.value = value;
                ipcRenderer.send('saveSettingValue', 'crosshairOpacityNum', value);
                ipcRenderer.send('saveSettingValue', 'crosshairOpacity', value);
                refreshCrosshairCss();
                break;
            case 'crosshairRenderType':
                refreshCrosshairCss();
                break;
        }
    },

    crosshairSizeSet: () => {
        const crosshair = document.getElementById('crosshair');
        if (!crosshair) return;
        const w = crosshair.naturalWidth;
        const h = crosshair.naturalHeight;

        const wInput = document.getElementById('crosshairWidth');
        const wNumInput = document.getElementById('crosshairWidthNum');
        const hInput = document.getElementById('crosshairHeight');
        const hNumInput = document.getElementById('crosshairHeightNum');

        if (wInput) wInput.value = w;
        if (wNumInput) wNumInput.value = w;
        if (hInput) hInput.value = h;
        if (hNumInput) hNumInput.value = h;

        ipcRenderer.send('saveSettingValue', 'crosshairWidth', w);
        ipcRenderer.send('saveSettingValue', 'crosshairWidthNum', w);
        ipcRenderer.send('saveSettingValue', 'crosshairHeight', h);
        ipcRenderer.send('saveSettingValue', 'crosshairHeightNum', h);
        refreshCrosshairCss();
    },

    customCssChange: async (id, value) => {
        const enable = await ipcRenderer.invoke('getSetting', 'enableCustomCss') ?? true;
        const cssType = await ipcRenderer.invoke('getSetting', 'cssType') || 'url';
        const customCssElem = document.getElementById('customCss');
        if (!customCssElem) return;

        switch (id) {
            case 'enableCustomCss':
                if (value) {
                    if (cssType === 'url') {
                        customCssElem.href = await ipcRenderer.invoke('getSetting', 'cssUrl');
                    } else if (cssType === 'local') {
                        customCssElem.href = 'vmc://' + await ipcRenderer.invoke('getSetting', 'cssPath');
                    } else if (cssType === 'list') {
                        let path = await ipcRenderer.invoke('getSetting', 'localCssList');
                        path = await ipcRenderer.invoke('localCssFullPath', path);
                        customCssElem.href = 'vmc://' + path;
                    }
                } else {
                    customCssElem.href = '';
                }
                break;
            case 'cssType':
                if (enable) {
                    if (value === 'url') {
                        customCssElem.href = await ipcRenderer.invoke('getSetting', 'cssUrl');
                    } else if (value === 'local') {
                        customCssElem.href = 'vmc://' + await ipcRenderer.invoke('getSetting', 'cssPath');
                    } else if (value === 'list') {
                        let path = await ipcRenderer.invoke('getSetting', 'localCssList');
                        path = await ipcRenderer.invoke('localCssFullPath', path);
                        customCssElem.href = 'vmc://' + path;
                    }
                }
                break;
            case 'cssUrl':
                if (cssType === 'url' && enable) {
                    customCssElem.href = value;
                }
                break;
            case 'localCssList':
                if (cssType === 'list' && enable) {
                    let listPath = await ipcRenderer.invoke('getSetting', 'localCssList');
                    listPath = await ipcRenderer.invoke('localCssFullPath', listPath);
                    customCssElem.href = 'vmc://' + listPath;
                }
                break;
        }
    },

    toggleMenuTheme: async (useTailwind) => {
        const link = document.getElementById('voxmateMenuStylesheet');
        const dir = await ipcRenderer.invoke('dirName', '');
        const cssFile = useTailwind ? 'settings-tailwind.css' : 'settings.css';
        if (link) {
            link.href = 'vmc://' + dir + '/src/assets/css/' + cssFile;
        }
    },

    openSwapperFolder: () => {
        ipcRenderer.send('openExplorer', 'swapper');
    },

    openUserscriptFolder: () => {
        ipcRenderer.send('openExplorer', 'userscript');
    },

    registerTab: (tabConfig) => {
        if (!tabConfig || !tabConfig.id) return;
        registeredCustomTabs.set(tabConfig.id, {
            id: tabConfig.id,
            title: tabConfig.title || tabConfig.id,
            icon: tabConfig.icon || 'tune'
        });
    },

    getRegisteredCustomTabs: () => {
        return Array.from(registeredCustomTabs.values());
    },

    registerSetting: async (configObj) => {
        if (!configObj || !configObj.id) return;
        const key = `custom_${configObj.id}`;
        registeredCustomSettings.set(configObj.id, configObj);

        const currentVal = await ipcRenderer.invoke('getSetting', key);
        if (currentVal === undefined && configObj.default !== undefined) {
            ipcRenderer.send('saveSettingValue', key, configObj.default);
        }
    },

    getCustomSetting: async (id) => {
        const key = `custom_${id}`;
        const val = await ipcRenderer.invoke('getSetting', key);
        if (val !== undefined) return val;
        const item = registeredCustomSettings.get(id);
        return item ? item.default : undefined;
    },

    setCustomSetting: (id, value) => {
        const key = `custom_${id}`;
        ipcRenderer.send('saveSettingValue', key, value);
        document.dispatchEvent(new CustomEvent('vmc-setting-change', { detail: { id, value } }));
    },

    getRegisteredCustomSettings: async () => {
        const list = [];
        for (const [id, item] of registeredCustomSettings.entries()) {
            const key = `custom_${id}`;
            const val = await ipcRenderer.invoke('getSetting', key);
            list.push({
                ...item,
                value: val !== undefined ? val : item.default
            });
        }
        return list;
    },

    triggerCustomButton: (id) => {
        document.dispatchEvent(new CustomEvent('vmc-setting-change', { detail: { id, value: true } }));
    },

    openLocal: (name) => {
        ipcRenderer.send('openFile', name);
    },

    openTutorial: (val) => {
        ipcRenderer.send('openTutorial', val);
    },

    clearCache: () => {
        ipcRenderer.send('clear-cache');
    },

    resetAllData: () => {
        ipcRenderer.send('clear-all-data-and-restart');
    },

    importSetting: () => {
        ipcRenderer.send('importSetting');
    },

    exportSetting: () => {
        const set = localStorage.getItem('persist:root');
        ipcRenderer.send('exportSetting', set);
    },

    joinGame: async () => {
        const joinElem = document.getElementById('joinGame');
        if (!joinElem) return;
        let v = joinElem.value;

        try {
            const hostName = new URL(v).hostname;
            if (hostName === 'voxiom.io') {
                location.href = v;
                location.reload();
            }
        } catch (e) {
            if (v.startsWith('#')) {
                v = v.slice(1);
                fetch(`https://voxiom.io/find?region=3&game_mode=ctg&version=135&tag=${v}`, { method: 'GET' })
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        if (data.success && data.tag === v) {
                            location.href = 'https://voxiom.io/#' + v;
                            location.reload();
                        }
                    })
                    .catch(error => console.error('Fetch error:', error));
            }
        }
    },

    sendLog: (val) => {
        ipcRenderer.send('log', val);
    },

    serverLogger: (val) => {
        if (Array.isArray(val) && val[0] && typeof val[0] === 'string') {
            if (val[0].startsWith('Connected to game-server-')) {
                const match = val[0].match(/game-server-([^.]+)\.voxiom\.io/);
                if (match) {
                    serverId = match[1];
                    return true;
                }
            }
        }
        return false;
    }
});

// IPC Event Listeners
ipcRenderer.on('openSetting', async () => {
    if (!document.getElementById('settingWindow')) {
        const settingDom = await ipcRenderer.invoke('settingDom');
        const settingTabDom = await ipcRenderer.invoke('settingTabChange', 'onload');
        const appElem = document.getElementById('app');
        if (appElem) {
            appElem.insertAdjacentHTML('afterbegin', settingDom);
            const menuBody = document.getElementById('menuBody');
            if (menuBody) menuBody.innerHTML = settingTabDom;
            renderCustomSidebarTabs();
        }
    } else {
        const settingWindow = document.getElementById('settingWindow');
        if (settingWindow) {
            settingWindow.classList.toggle('settingShow');
            if (settingWindow.classList.contains('settingShow')) {
                renderCustomSidebarTabs();
            }
        }
    }

    const inviteGameElem = document.getElementById('inviteGame');
    if (inviteGameElem) {
        inviteGameElem.value = location.href;
        const serverHooker = document.getElementById('serverHooker');
        if (serverHooker) serverHooker.value = 'https://voxiom.io/#' + serverId;
    }
});

ipcRenderer.on('reload', () => {
    location.reload();
});

ipcRenderer.on('localPath', async (e, id, val, fileName) => {
    let type;
    const previewImg = document.getElementById('crosshairPreviewImage');
    const crosshairImg = document.getElementById('crosshair');

    switch (id) {
        case 'crosshairPath':
            type = await ipcRenderer.invoke('getSetting', 'crosshairType');
            if (type === 'local') {
                if (previewImg) previewImg.setAttribute('src', 'vmc://' + val);
                if (crosshairImg) crosshairImg.setAttribute('src', 'vmc://' + val);
            }
            break;
        case 'cssPath':
            type = await ipcRenderer.invoke('getSetting', 'cssType');
            if (type === 'local') {
                const customCss = document.getElementById('customCss');
                if (customCss) customCss.href = 'vmc://' + val;
            }
            const cssName = document.getElementById('cssName');
            if (cssName && fileName) cssName.innerText = fileName;
            break;
        case 'skyboxPath':
            type = await ipcRenderer.invoke('getSetting', 'skyboxType');
            if (type === 'local') {
                window.dispatchEvent(new CustomEvent('vmc-sky-update', { detail: { skyboxUrl: 'vmc://' + val } }));
            }
            const skyboxName = document.getElementById('skyboxName');
            if (skyboxName && fileName) skyboxName.innerText = 'Current : ' + fileName;
            break;
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // SkyColor is completely disabled even if enableSkyColor was saved as true
    // injectSkyChanger() is bypassed.

    // SimpleInfoGUI setup
    injectSimpleInfoGui();
    const infoEnabled = await ipcRenderer.invoke('getSetting', 'enableSimpleInfo') ?? true;
    const infoPosition = await ipcRenderer.invoke('getSetting', 'infoPosition') || 'top-left';
    const infoMarginTop = await ipcRenderer.invoke('getSetting', 'infoMarginTop') ?? 60;
    const infoMarginLeft = await ipcRenderer.invoke('getSetting', 'infoMarginLeft') ?? 20;
    const showFPS = await ipcRenderer.invoke('getSetting', 'infoShowFPS') ?? true;
    const showPing = await ipcRenderer.invoke('getSetting', 'infoShowPing') ?? true;
    const showPos = await ipcRenderer.invoke('getSetting', 'infoShowPos') ?? true;
    const showBlockPos = await ipcRenderer.invoke('getSetting', 'infoShowBlockPos') ?? false;
    const showChunkPos = await ipcRenderer.invoke('getSetting', 'infoShowChunkPos') ?? false;
    const showVelocity = await ipcRenderer.invoke('getSetting', 'infoShowVelocity') ?? false;
    const showAngles = await ipcRenderer.invoke('getSetting', 'infoShowAngles') ?? false;
    const showChunks = await ipcRenderer.invoke('getSetting', 'infoShowChunks') ?? false;
    const showNetBps = await ipcRenderer.invoke('getSetting', 'infoShowNetBps') ?? false;

    document.dispatchEvent(new CustomEvent('vmc-info-update', {
        detail: {
            enabled: infoEnabled,
            position: infoPosition,
            marginTop: infoMarginTop,
            marginLeft: infoMarginLeft,
            showFPS, showPing, showPos, showBlockPos, showChunkPos, showVelocity, showAngles, showChunks, showNetBps
        }
    }));

    const settingStyle = await ipcRenderer.invoke('loadSettingStylesheets');
    document.body.insertAdjacentHTML('afterbegin', settingStyle);

    const crosshair = await ipcRenderer.invoke('crosshairDom');
    const appElem = document.getElementById('app');
    if (appElem) {
        appElem.insertAdjacentHTML('afterbegin', crosshair);
    }
    refreshCrosshairCss();

    const cssDom = await ipcRenderer.invoke('cssDom');
    if (cssDom && cssDom[0]) {
        document.body.insertAdjacentHTML('afterbegin', cssDom[0]);
    }

    const ver = await ipcRenderer.invoke('version');
    document.body.insertAdjacentHTML('afterbegin', `<div id="version" style="position:fixed;right:0;bottom:0;font-size:12px;color:white;text-shadow:0 0 2px black;z-index:1">VoxMate - ${ver}</div>`);
});

ipcRenderer.on('importSettingValue', (e, val) => {
    console.log('Import setting:', val);
});

// Observe URL changes for invite URL updates cleanly
let lastUrl = location.href;
const updateInviteUrls = () => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        const inviteElem = document.getElementById('inviteGame');
        if (inviteElem) {
            inviteElem.value = location.href;
            const serverElem = document.getElementById('serverHooker');
            if (serverElem) serverElem.value = 'https://voxiom.io/#' + serverId;
        }
    }
};
window.addEventListener('hashchange', updateInviteUrls);
window.addEventListener('popstate', updateInviteUrls);

// Hook console.log to identify connected server (auto-unhook once captured)
window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.textContent = `
    const originalLog = console.log;
    console.log = function (...args) {
        originalLog.apply(console, args);
        if (window.vmc?.serverLogger?.(args)) {
            console.log = originalLog;
        }
    };`;
    document.head.appendChild(script);
});