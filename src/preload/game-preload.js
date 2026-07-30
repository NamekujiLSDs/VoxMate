const { contextBridge, ipcRenderer } = require('electron');
const { injectSimpleInfoGui } = require('./simpleInfoGui');
const { validateTabRegistration, validateSettingRegistration, isReservedSettingId, DEFAULT_CATEGORY_NAME } = require('./customSettingsRegistry');

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
const switchSettingTab = async (tabId, persistLastOpen = false) => {
    const selected = document.getElementsByClassName('menuSelected');
    if (selected.length > 0) {
        selected[0].classList.remove('menuSelected');
    }

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('menuSelected');

    const menuBody = document.getElementById('menuBody');
    if (!menuBody) return;

    const builtinTabs = new Set([
        'quickSetting',
        'renderingSetting',
        'crosshairSetting',
        'cssSetting',
        'swapperSetting',
        'adblockSetting',
        'infoSetting',
        'userscriptSetting',
        'performanceSetting'
    ]);

    if (builtinTabs.has(tabId)) {
        const settingDom = await ipcRenderer.invoke('settingTabChange', tabId);
        menuBody.innerHTML = settingDom;
        if (tabId === 'userscriptSetting' || registeredCustomTabs.has(tabId)) {
            await renderCustomSettingsUI(tabId);
        }
    } else {
        const tabInfo = registeredCustomTabs.get(tabId);
        const title = tabInfo ? tabInfo.title : tabId;
        const icon = tabInfo ? tabInfo.icon : 'tune';
        menuBody.innerHTML = `
        <div class="tabContainer" style="--tab-accent: #a855f7;">
            <div id="menuBodyTitle">
                <span class="material-symbols-outlined">${icon}</span>
                ${title}
            </div>
            <div class="horizonalLine"></div>
            <div id="customTabContent"></div>
        </div>`;
        await renderCustomSettingsUI(tabId);
    }

    if (persistLastOpen) {
        ipcRenderer.send('saveSettingValue', 'lastOpen', tabId);
    }
};

const getRegisteredCustomSettingsList = async () => {
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
};

const refreshCustomMenuUI = async () => {
    const selectedTab = document.getElementsByClassName('menuSelected')[0];
    const activeTabId = selectedTab?.id || 'userscriptSetting';
    if (activeTabId === 'userscriptSetting' || registeredCustomTabs.has(activeTabId)) {
        await renderCustomSettingsUI(activeTabId);
    }
};

const renderCustomSettingsUI = async (targetTabId = 'userscriptSetting') => {
    let container = document.getElementById('customUserScriptSettingsContainer');
    if (!container && targetTabId !== 'userscriptSetting') {
        container = document.getElementById('customTabContent') || document.getElementById('menuBody');
    }
    if (!container) return;

    const allList = await getRegisteredCustomSettingsList();
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
        const cat = item.category || DEFAULT_CATEGORY_NAME;
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

            html += `<div id="menuBodyItem">`;
            html += `<div class="customSettingLabel">${label}</div>`;

            if (type === 'checkbox') {
                const savedKey = await ipcRenderer.invoke('getSetting', `keybind_${id}`);
                const displayKey = (savedKey && typeof savedKey === 'string' && savedKey.trim()) ? savedKey.trim().toUpperCase() : 'NONE';
                const isBound = displayKey !== 'NONE';
                const btnColor = isBound ? '#ffffff' : '#64748b';
                const borderColor = isBound ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
                const bgColor = isBound ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.3)';
                html += `<div style="display: flex; align-items: center;">
                    <input type="button" class="keybindBtn" style="min-width: 95px; width: auto; height: 26px; font-weight: 600; font-size: 11px; padding: 0 10px; background: ${bgColor}; color: ${btnColor}; border: 1px solid ${borderColor}; cursor: pointer; text-transform: uppercase; border-radius: 4px; margin-right: 8px; transition: all 0.15s ease; box-sizing: border-box;" id="kb_btn_${id}" value="${displayKey}" onclick="window.vmc.listenKeybind('${id}', this.id)" title="Assign shortcut key (Backspace/Esc to clear)">
                    <input type="checkbox" name="${key}" id="${key}" oninput="window.vmc.saveSetting(this.id, this.checked)" ${val ? 'checked' : ''}>
                </div>`;
            } else if (type === 'range') {
                const min = item.min ?? 0;
                const max = item.max ?? 100;
                const step = item.step ?? 1;
                html += `<div id="rangeNumHolder">
                    <input type="number" id="${key}_number" class="sizeInput" value="${val}" min="${min}" max="${max}" step="${step}" oninput="document.getElementById('${key}').value=this.value;window.vmc.saveSetting('${key}', parseFloat(this.value));">
                    <input type="range" name="${key}" id="${key}" value="${val}" min="${min}" max="${max}" step="${step}" oninput="document.getElementById('${key}_number').value=this.value;window.vmc.saveSetting(this.id, parseFloat(this.value));">
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
            } else if (type === 'keybind') {
                const keyVal = (val && String(val).trim()) ? String(val).toUpperCase() : 'None';
                html += `<input type="button" class="sizeInput" style="min-width: 90px; font-weight: bold; background: rgba(0,0,0,0.5); color: ${keyVal !== 'None' ? '#00ff00' : '#888888'}; border: 1px solid ${keyVal !== 'None' ? '#00ff00' : '#444444'}; cursor: pointer; text-transform: uppercase;" id="${key}" value="${keyVal}" onclick="window.vmc.listenKeybind('${id}', this.id)">`;
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
            <div id="customTabContent"></div>
        </div>`;
        const contentContainer = document.getElementById('customTabContent');
        if (contentContainer) contentContainer.innerHTML = html;
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
            switchSettingTab(t.id);
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
        await switchSettingTab(tabId, true);
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
        const validation = validateTabRegistration(tabConfig, registeredCustomTabs);
        if (!validation.ok) {
            console.warn(`[VoxMate] ${validation.reason}`);
            return;
        }

        const tabId = validation.tabId;
        registeredCustomTabs.set(tabId, {
            id: tabId,
            title: tabConfig.title || tabId,
            icon: tabConfig.icon || 'tune'
        });
        renderCustomSidebarTabs();
    },

    getRegisteredCustomTabs: () => {
        return Array.from(registeredCustomTabs.values());
    },

    registerSetting: async (configObj) => {
        const validation = validateSettingRegistration(configObj, registeredCustomSettings);
        if (!validation.ok) {
            console.warn(`[VoxMate] ${validation.reason}`);
            return;
        }

        const settingId = validation.id;
        if (isReservedSettingId(settingId)) {
            console.warn(`[VoxMate] Setting id "${settingId}" is reserved by VoxMate.`);
            return;
        }
        const key = `custom_${settingId}`;
        registeredCustomSettings.set(settingId, configObj);

        const currentVal = await ipcRenderer.invoke('getSetting', key);
        const initialValue = currentVal !== undefined ? currentVal : (configObj.default !== undefined ? configObj.default : undefined);
        if (currentVal === undefined && configObj.default !== undefined) {
            ipcRenderer.send('saveSettingValue', key, configObj.default);
        }

        if (document.getElementById('menuItemHolder')) {
            renderCustomSidebarTabs();
        }
        await refreshCustomMenuUI();

        if (initialValue !== undefined) {
            document.dispatchEvent(new CustomEvent('vmc-setting-change', { detail: { id: settingId, value: initialValue } }));
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
        return getRegisteredCustomSettingsList();
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
    },

    showToast: (msg, type, duration) => showToast(msg, type, duration),
    registerKeybind: (config) => registerKeybind(config),
    listenKeybind: (settingId, buttonId) => listenKeybind(settingId, buttonId)
});

const formatSettingLabel = (rawLabel) => {
    if (!rawLabel) return '';
    if (rawLabel.includes(' ')) return rawLabel;
    return rawLabel
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
};

const showToast = (message, duration = 1600) => {
    try {
        let container = document.getElementById('vmcToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'vmcToastContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 18px;
                right: 18px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 5px;
                pointer-events: none;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            (document.body || document.documentElement).appendChild(container);
        }

        const isOff = message.includes('OFF') || message.includes('CLOSED') || message.includes('BLANK');
        const accentColor = isOff ? '#ef4444' : '#10b981';

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: rgba(15, 23, 42, 0.82);
            color: #e2e8f0;
            border-left: 3px solid ${accentColor};
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 11.5px;
            font-weight: 500;
            letter-spacing: 0.2px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(8px);
            transform: translateX(12px);
            opacity: 0;
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            white-space: nowrap;
        `;
        toast.innerHTML = message;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(12px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 200);
        }, duration);
    } catch (e) {}
};

const BUILTIN_SETTING_IDS = new Set([
    'enableSimpleInfo', 'enableCustomCrosshair', 'enableCustomCss', 'enableResourceSwapper',
    'enableAdBlocker', 'unlimitedFps', 'enableRawInput', 'enableDesynchronized', 'discordRpc',
    'disableGpuVsync', 'inProcess', 'enableGpuRasterization', 'enableZerocopy', 'useTailwindCss',
    'useDefSwapList', 'useUserSwapList', 'useDefAdBlockList', 'useUserAdBlockList',
    'infoShowFPS', 'infoShowPing', 'infoShowPos', 'infoShowBlockPos', 'infoShowChunkPos',
    'infoShowVelocity', 'infoShowAngles', 'infoShowChunks', 'infoShowNetBps',
    'enableQuic', 'enablePointerLockOptions', 'enableHeavyAdIntervention', 'ignoreGpuBlocklist',
    'enableV8Opt', 'enableParallelShader', 'enableAudioOpt'
]);

const registeredKeybinds = new Map();

const loadAllSavedKeybinds = async () => {
    try {
        const keybindMap = await ipcRenderer.invoke('getAllKeybinds');
        if (keybindMap && typeof keybindMap === 'object') {
            for (const [settingId, key] of Object.entries(keybindMap)) {
                if (key && typeof key === 'string' && key.trim() !== '') {
                    const cleanSettingId = settingId.replace(/^custom_/, '');
                    registeredKeybinds.set(`kb_${cleanSettingId}`, {
                        id: `kb_${cleanSettingId}`,
                        key: key.trim().toLowerCase(),
                        label: cleanSettingId,
                        settingId: cleanSettingId,
                        callback: null
                    });
                }
            }
        }
    } catch (e) {
        console.error('[VoxMate Keybind Auto-Load Error]', e);
    }
};

const registerKeybind = async (config) => {
    if (!config) return;
    const cleanSettingId = config.settingId ? config.settingId.replace(/^custom_/, '') : null;
    const id = config.id || (cleanSettingId ? `kb_${cleanSettingId}` : `keybind_${Date.now()}_${Math.random()}`);

    let key = config.key;

    // Check if user saved a custom shortcut key in config
    if (cleanSettingId) {
        try {
            const savedKey = await ipcRenderer.invoke('getSetting', `keybind_${cleanSettingId}`);
            if (typeof savedKey === 'string' && savedKey.trim() !== '') {
                key = savedKey.trim();
            }
        } catch (e) {}
    }

    if (!key || key === '' || String(key).toLowerCase() === 'none' || String(key).toLowerCase() === 'blank') {
        registeredKeybinds.delete(id);
        if (cleanSettingId) {
            for (const [k, v] of registeredKeybinds.entries()) {
                if (v.settingId === cleanSettingId) registeredKeybinds.delete(k);
            }
        }
        return;
    }

    const keyLower = String(key).toLowerCase();
    registeredKeybinds.set(id, {
        id,
        key: keyLower,
        label: config.label || cleanSettingId || id,
        settingId: cleanSettingId,
        callback: config.callback || null
    });
};

const listenKeybind = (settingId, buttonId) => {
    const btn = document.getElementById(buttonId) || (typeof event !== 'undefined' && event ? event.target : null);
    if (!btn) return;

    btn.value = 'PRESS KEY';
    btn.style.color = '#f59e0b';
    btn.style.borderColor = '#f59e0b';
    btn.style.background = 'rgba(245, 158, 11, 0.1)';

    const onKeyCaptured = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        window.removeEventListener('keydown', onKeyCaptured, true);

        const pressedKey = e.key;
        const keyLower = pressedKey.toLowerCase();

        const cleanSettingId = settingId.replace(/^custom_/, '');
        const keyStorageKey = `keybind_${cleanSettingId}`;

        // Backspace or Escape -> CLEAR SHORTCUT KEY (Blank)
        if (keyLower === 'backspace' || keyLower === 'escape') {
            ipcRenderer.send('saveSettingValue', keyStorageKey, '');
            btn.value = 'NONE';
            btn.style.color = '#64748b';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btn.style.background = 'rgba(0, 0, 0, 0.3)';

            await registerKeybind({ id: `kb_${cleanSettingId}`, settingId: cleanSettingId, key: '' });
            showToast(`${formatSettingLabel(cleanSettingId)} Keybind: <span style="color:#ef4444; font-weight:600;">BLANK</span>`);
            return;
        }

        // Normal Key Assignment
        const displayKey = pressedKey.length === 1 ? pressedKey.toUpperCase() : pressedKey;
        ipcRenderer.send('saveSettingValue', keyStorageKey, keyLower);
        btn.value = displayKey;
        btn.style.color = '#ffffff';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        btn.style.background = 'rgba(255, 255, 255, 0.08)';

        await registerKeybind({
            id: `kb_${cleanSettingId}`,
            key: keyLower,
            settingId: cleanSettingId,
            label: cleanSettingId
        });

        showToast(`${formatSettingLabel(cleanSettingId)} Keybind: <span style="color:#10b981; font-weight:600;">${displayKey}</span>`);
    };

    window.addEventListener('keydown', onKeyCaptured, true);
};

document.addEventListener('keydown', async (e) => {
    const isInputField = e.target && (e.target.isContentEditable || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement);
    if (isInputField) return;

    const pressedKey = e.key.toLowerCase();

    // Match all registered keybinds for this key so multiple functions bound to the same key execute cleanly
    const matchingBinds = [];
    for (const bind of registeredKeybinds.values()) {
        if (bind.key === pressedKey) {
            matchingBinds.push(bind);
        }
    }

    for (const bind of matchingBinds) {
        try {
            if (bind.settingId) {
                const cleanId = bind.settingId.replace(/^custom_/, '');
                const isBuiltIn = BUILTIN_SETTING_IDS.has(cleanId);
                const isCustom = !isBuiltIn;

                if (isCustom) {
                    const globalUserScriptsEnabled = await ipcRenderer.invoke('getSetting', 'enableUserScripts');
                    if (globalUserScriptsEnabled === false) {
                        continue;
                    }

                    const customSettingObj = registeredCustomSettings.get(cleanId) || registeredCustomSettings.get(`custom_${cleanId}`);
                    if (!customSettingObj) {
                        continue;
                    }
                }

                const storageKey = isCustom ? `custom_${cleanId}` : cleanId;

                const currentVal = await ipcRenderer.invoke('getSetting', storageKey);
                const newVal = !currentVal;

                // Save setting value in config
                ipcRenderer.send('saveSettingValue', storageKey, newVal);

                // Update UI checkbox in DOM if settings menu is open
                const elemId = isCustom ? `custom_${cleanId}` : cleanId;
                const checkboxElem = document.getElementById(elemId) || document.getElementById(cleanId);
                if (checkboxElem && checkboxElem.type === 'checkbox') {
                    checkboxElem.checked = newVal;
                }

                // Always dispatch vmc-setting-change for UserScripts
                document.dispatchEvent(new CustomEvent('vmc-setting-change', { detail: { id: cleanId, value: newVal } }));
                if (cleanId !== storageKey) {
                    document.dispatchEvent(new CustomEvent('vmc-setting-change', { detail: { id: storageKey, value: newVal } }));
                }

                // Handle built-in setting side effects
                if (isBuiltIn) {
                    if (cleanId === 'enableRawInput') isRawInputEnabled = newVal;
                    if (cleanId === 'enableDesynchronized') isDesynchronizedEnabled = newVal;
                    if (cleanId.startsWith('enableCustomCrosshair') || cleanId.startsWith('crosshair')) {
                        const crosshairImg = document.getElementById('crosshair');
                        if (crosshairImg) newVal ? crosshairImg.classList.remove('hidden') : crosshairImg.classList.add('hidden');
                    }
                    if (cleanId.startsWith('enableCustomCss') || cleanId.startsWith('css')) {
                        const customCssElem = document.getElementById('customCss');
                        if (customCssElem && cleanId === 'enableCustomCss') {
                            if (newVal) {
                                const cssUrl = await ipcRenderer.invoke('getSetting', 'cssUrl');
                                if (cssUrl) customCssElem.href = cssUrl;
                            } else {
                                customCssElem.href = '';
                            }
                        }
                    }
                    if (cleanId.startsWith('enableSimpleInfo') || cleanId.startsWith('info')) {
                        document.dispatchEvent(new CustomEvent('vmc-info-update', { detail: { enabled: newVal } }));
                    }
                }

                const settingConfig = registeredCustomSettings.get(cleanId);
                const rawLabel = bind.label && bind.label !== bind.id ? bind.label : (settingConfig ? (settingConfig.label || cleanId) : cleanId);
                const formattedLabel = formatSettingLabel(rawLabel);
                showToast(`${formattedLabel}: <span style="color:${newVal ? '#10b981' : '#ef4444'}; font-weight:600;">${newVal ? 'ON' : 'OFF'}</span>`);
            }

            if (typeof bind.callback === 'function') {
                bind.callback();
            }
        } catch (err) {
            console.error('[VoxMate Keybind Error]', err);
        }
    }
}, true);

// IPC Event Listeners
ipcRenderer.on('openSetting', async () => {
    let isOpen = false;
    if (!document.getElementById('settingWindow')) {
        const settingDom = await ipcRenderer.invoke('settingDom');
        const settingTabDom = await ipcRenderer.invoke('settingTabChange', 'onload');
        const appElem = document.getElementById('app');
        if (appElem) {
            appElem.insertAdjacentHTML('afterbegin', settingDom);
            const menuBody = document.getElementById('menuBody');
            if (menuBody) menuBody.innerHTML = settingTabDom;
            renderCustomSidebarTabs();
            const win = document.getElementById('settingWindow');
            if (win) {
                win.classList.add('settingShow');
                isOpen = true;
            }
        }
    } else {
        const settingWindow = document.getElementById('settingWindow');
        if (settingWindow) {
            settingWindow.classList.toggle('settingShow');
            isOpen = settingWindow.classList.contains('settingShow');
            if (isOpen) {
                renderCustomSidebarTabs();
            }
        }
    }

    showToast(`⚙ Menu: <span style="color:${isOpen ? '#10b981' : '#ef4444'}; font-weight:600;">${isOpen ? 'OPEN' : 'CLOSED'}</span>`);

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
                const skyboxName = document.getElementById('skyboxName');
                if (skyboxName && fileName) skyboxName.innerText = 'Current : ' + fileName;
            }
            break;
    }
});

document.addEventListener('DOMContentLoaded', async () => {
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

    // Dynamic auto-load of ALL stored keybinds (both built-in client settings and UserScript custom settings)
    await loadAllSavedKeybinds();
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