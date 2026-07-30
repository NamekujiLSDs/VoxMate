const path = require('path');
const fs = require('fs');
const { config, getSwapFolderPath } = require('../utils/config');
const { getUserScriptsList } = require('../services/userscripts');

class SettingsTemplate {
    constructor(baseDir) {
        this.baseDir = baseDir;
    }

    loadSettingStylesheets() {
        const useTailwind = config.get('useTailwindCss', true);
        const cssFile = useTailwind ? 'settings-tailwind.css' : 'settings.css';
        const cssPath = path.join(this.baseDir, `./src/assets/css/${cssFile}`);
        return `<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
    <link id="voxmateMenuStylesheet" rel="stylesheet" href="vmc://${cssPath}">`;
    }

    renderSettingsFrame() {
        const lastOpen = config.get('lastOpen', 'quickSetting');

        return `
            <div id="settingWindow" class="settingShow">
                <div id="menuHider" onclick="window.vmc.closeSetting()"></div>
                <div id="settingContainer">
                    <div id="menuItemHolder">
                        <div id="quickSetting" class="menuItem ${lastOpen === 'quickSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">rocket_launch</span></div>
                            <div class="menuItemTitle">Quick</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="renderingSetting" class="menuItem ${lastOpen === 'renderingSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">palette</span></div>
                            <div class="menuItemTitle">Rendering</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="crosshairSetting" class="menuItem ${lastOpen === 'crosshairSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">point_scan</span></div>
                            <div class="menuItemTitle">Crosshair</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="cssSetting" class="menuItem ${lastOpen === 'cssSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">code_blocks</span></div>
                            <div class="menuItemTitle">CSS</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="swapperSetting" class="menuItem ${lastOpen === 'swapperSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">swap_horiz</span></div>
                            <div class="menuItemTitle">Swapper</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="adblockSetting" class="menuItem ${lastOpen === 'adblockSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">security</span></div>
                            <div class="menuItemTitle">Ad Blocker</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="infoSetting" class="menuItem ${lastOpen === 'infoSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">monitoring</span></div>
                            <div class="menuItemTitle">HUD Info</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="userscriptSetting" class="menuItem ${lastOpen === 'userscriptSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">extension</span></div>
                            <div class="menuItemTitle">UserScript</div>
                        </div>
                        <div class="menuSplitter"></div>
                        <div id="performanceSetting" class="menuItem ${lastOpen === 'performanceSetting' ? 'menuSelected' : ''}" onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                            <div class="menuItemIcon"><span class="material-symbols-outlined">manufacturing</span></div>
                            <div class="menuItemTitle">Advanced</div>
                        </div>
                    </div>
                    <div id="menuBodyHolder">
                        <div id="menuBody"></div>
                    </div>
                </div>
            </div>`;
    }

    getCssListOptions() {
        const cssFolder = path.join(getSwapFolderPath(), './css');
        let cssList = [];
        if (fs.existsSync(cssFolder)) {
            cssList = fs.readdirSync(cssFolder, { withFileTypes: true })
                .filter(dirent => dirent.isFile())
                .map(({ name }) => name)
                .filter(file => path.extname(file).toLowerCase() === '.css');
        }

        const defVal = config.get('localCssList', 'NONE');
        let options = `<option value="NONE" ${defVal === 'NONE' ? 'selected' : ''}>NONE</option>\n`;
        for (const name of cssList) {
            options += `<option value="${name}" ${defVal === name ? 'selected' : ''}>${name}</option>\n`;
        }
        return options;
    }

    getCrosshairListOptions() {
        const crosshairFolder = path.join(getSwapFolderPath(), './crosshair');
        let crosshairList = [];
        if (fs.existsSync(crosshairFolder)) {
            crosshairList = fs.readdirSync(crosshairFolder, { withFileTypes: true })
                .filter(dirent => dirent.isFile())
                .map(({ name }) => name)
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ext === '.png' || ext === '.gif' || ext === '.apng';
                });
        }

        const defVal = config.get('localCrosshairList', 'NONE');
        let options = `<option value="NONE" ${defVal === 'NONE' ? 'selected' : ''}>NONE</option>\n`;
        for (const name of crosshairList) {
            options += `<option value="${name}" ${defVal === name ? 'selected' : ''}>${name}</option>\n`;
        }
        return options;
    }

    renderTab(tabName) {
        if (tabName === 'onload') {
            tabName = config.get('lastOpen', 'quickSetting');
        }

        switch (tabName) {
            case 'quickSetting':
                return this.renderQuickSetting();
            case 'renderingSetting':
                return this.renderRenderingSetting();
            case 'crosshairSetting':
                return this.renderCrosshairSetting();
            case 'cssSetting':
                return this.renderCssSetting();
            case 'swapperSetting':
                return this.renderSwapperSetting();
            case 'adblockSetting':
                return this.renderAdblockSetting();
            case 'infoSetting':
                return this.renderInfoSetting();
            case 'userscriptSetting':
                return this.renderUserscriptSetting();
            case 'performanceSetting':
                return this.renderPerformanceSetting();
            default:
                return this.renderQuickSetting();
        }
    }

    renderQuickSetting() {
        return `<div class="tabContainer" style="--tab-accent: var(--col-quick);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">rocket_launch</span>
            Quick Setting
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Join Game
            <div id="joinHolder">
                <input type="text" name="joinGame" id="joinGame" placeholder="Enter Game URL or code">
                <input type="button" id="menuButton" value="JOIN" onclick="window.vmc.joinGame()">
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Invite Friends
            <div id="inviteHolder">
                <input type="text" name="inviteGame" id="inviteGame" value="" readonly>
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Server Hooker (WIP)
            <div id="serverHookHolder">
                <input type="text" name="serverHooker" id="serverHooker" value="" readonly>
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable SimpleInfo HUD
            <input type="checkbox" name="enableSimpleInfo" id="enableSimpleInfo"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('enableSimpleInfo', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Custom Crosshair
            <input type="checkbox" name="enableCustomCrosshair" id="enableCustomCrosshair"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.crosshairChange(this.id,this.checked)"
                ${config.get('enableCustomCrosshair', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Custom CSS
            <input type="checkbox" name="enableCustomCss" id="enableCustomCss"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.customCssChange(this.id,this.checked)"
                ${config.get('enableCustomCss', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Resource Swapper
            <input type="checkbox" name="enableResourceSwapper" id="enableResourceSwapper"
                oninput="window.vmc.saveSetting(this.id,this.checked)"
                ${config.get('enableResourceSwapper', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Ad Blocker
            <input type="checkbox" name="enableAdBlocker" id="enableAdBlocker"
                oninput="window.vmc.saveSetting(this.id,this.checked)"
                ${config.get('enableAdBlocker', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Unlimited FPS
            <input type="checkbox" name="unlimitedFps" id="unlimitedFps"
                oninput="window.vmc.saveSetting(this.id,this.checked)"
                ${config.get('unlimitedFps', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Raw Input (Low Latency Mouse)
            <input type="checkbox" name="enableRawInput" id="enableRawInput"
                oninput="window.vmc.saveSetting(this.id,this.checked)"
                ${config.get('enableRawInput', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable WebGL Desynchronized (Low Latency Canvas)
            <input type="checkbox" name="enableDesynchronized" id="enableDesynchronized"
                oninput="window.vmc.saveSetting(this.id,this.checked)"
                ${config.get('enableDesynchronized', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Open GOOGLE
            <input type="button" id="menuButton" value="OPEN" onclick="location.href = 'https://www.google.com/'">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            OPEN Discord
            <input type="button" id="menuButton" value="OPEN" onclick="location.href = 'https://www.google.com/'">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            OPEN Facebook
            <input type="button" id="menuButton" value="OPEN" onclick="location.href = 'https://www.google.com/'">
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderRenderingSetting() {
        return `<div class="tabContainer" style="--tab-accent: var(--col-rendering);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">palette</span>
            Rendering Settings
        </div>
        
        <div class="settingSectionHeader">Crosshair Rendering</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair Rendering Method
            <select name="crosshairRenderType" id="crosshairRenderType"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)">
                <option value="pixelated" ${config.get('crosshairRenderType', 'pixelated') === 'pixelated' ? 'selected' : ''}>
                    Pixelated
                </option>
                <option value="crisp-edges" ${config.get('crosshairRenderType', 'pixelated') === 'crisp-edges' ? 'selected' : ''}>
                    Crisp Edges
                </option>
            </select>
        </div>
        <div class="horizonalLine"></div>

        <div class="settingSectionHeader">GPU & Hardware Acceleration</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Disable GPU Vsync
            <input type="checkbox" name="disableGpuVsync" id="disableGpuVsync"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('disableGpuVsync', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Change Angle Backend
            <select name="angleBackend" id="angleBackend" onchange="window.vmc.saveSetting(this.id,this.value)">
                <option value="default" ${config.get('angleBackend', 'default') === 'default' ? 'selected' : ''}>Default</option>
                <option value="opengl" ${config.get('angleBackend', 'default') === 'opengl' ? 'selected' : ''}>openGL</option>
                <option value="d3d11" ${config.get('angleBackend', 'default') === 'd3d11' ? 'selected' : ''}>D3D11</option>
                <option value="d3d9" ${config.get('angleBackend', 'default') === 'd3d9' ? 'selected' : ''}>D3D9</option>
                <option value="d3d11on12" ${config.get('angleBackend', 'default') === 'd3d11on12' ? 'selected' : ''}>D3D11on12</option>
            </select>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable In-process-gpu
            <input type="checkbox" name="inProcess" id="inProcess"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('inProcess', false) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable GPU Rasterization
            <input type="checkbox" name="enableGpuRasterization" id="enableGpuRasterization"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableGpuRasterization', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Zero Copy
            <input type="checkbox" name="enableZerocopy" id="enableZerocopy"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableZerocopy', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderCrosshairSetting() {
        let crosshairUrl;
        const urlType = config.get('crosshairType', 'url');
        if (urlType === 'url') {
            crosshairUrl = config.get('crosshairUrl', 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png');
        } else if (urlType === 'local') {
            crosshairUrl = 'vmc://' + config.get('crosshairPath', path.join(this.baseDir, './src/assets/img/Cross-lime.png'));
        } else if (urlType === 'list') {
            crosshairUrl = 'vmc://' + path.join(getSwapFolderPath(), 'crosshair', config.get('localCrosshairList', ''));
        }

        return `<div class="tabContainer" style="--tab-accent: var(--col-crosshair);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">point_scan</span>
            Crosshair Setting
        </div>
        <div id="crosshairPreview">
            <div id="crosshairPreviewTitle">Crosshair Preview</div>
            <div id="previewBody">
                <img id="crosshairPreviewImage" src="${crosshairUrl}">
            </div>
        </div>
        <div id="menuBodyItem">
            Enable Custom Crosshair
            <input type="checkbox" name="enableCustomCrosshair" id="enableCustomCrosshair"
                oninput="window.vmc.saveSetting(this.id ,this.checked);window.vmc.crosshairChange(this.id,this.checked)"
                ${config.get('enableCustomCrosshair', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair Type
            <select name="crosshairType" id="crosshairType"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)">
                <option value="url" ${config.get('crosshairType', 'url') === 'url' ? 'selected' : ''}>URL</option>
                <option value="local" ${config.get('crosshairType', 'url') === 'local' ? 'selected' : ''}>Local File</option>
                <option value="list" ${config.get('crosshairType', 'url') === 'list' ? 'selected' : ''}>List</option>
            </select>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair URL
            <input type="url" name="crosshairUrl" id="crosshairUrl"
                onchange="window.vmc.saveSetting(this.id ,this.value);window.vmc.crosshairChange(this.id,this.value)"
                value="${config.get('crosshairUrl', 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png')}">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Local Crosshair File
            <input type="button" name="openLocaCrosshair" id="menuButton" value="OPEN"
                onclick="window.vmc.openLocal('crosshairPath')">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Local Crosshair List
            <select id="localCrosshairList" name="localCrosshairList" onchange="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)">
            ${this.getCrosshairListOptions()}
            </select>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Auto Set Size
            <input type="button" name="autoSetSize" id="menuButton" value="SET"
                onclick="window.vmc.crosshairSizeSet()">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair width
            <div id="rangeNumHolder">
                <input type="number" class="sizeInput" name="crosshairWidthNum" id="crosshairWidthNum"
                    oninput="window.vmc.crosshairChange(this.id,this.value)"
                    value="${config.get('crosshairWidth', '20')}" min="0" max="1024" step="1">
                <input type="range" name="crosshairWidth" id="crosshairWidth"
                    value="${config.get('crosshairWidth', '20')}"
                    oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)"
                    min="0" max="1024" step="1">
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair Height
            <div id="rangeNumHolder">
                <input type="number" class="sizeInput" name="crosshairHeightNum" id="crosshairHeightNum"
                    oninput="window.vmc.crosshairChange(this.id,this.value)"
                    value="${config.get('crosshairHeight', '20')}" min="0" max="1024" step="1">
                <input type="range" name="crosshairHeight" id="crosshairHeight"
                    value="${config.get('crosshairHeight', '20')}"
                    oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)"
                    min="0" max="1024" step="1">
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair Opacity
            <div id="rangeNumHolder">
                <input type="number" class="sizeInput" name="crosshairOpacityNum" id="crosshairOpacityNum"
                    oninput="window.vmc.crosshairChange(this.id,this.value)"
                    value="${config.get('crosshairOpacity', '1')}" min="0" max="1" step=".1">
                <input type="range" name="crosshairOpacity" id="crosshairOpacity"
                    value="${config.get('crosshairOpacity', '1')}"
                    oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)"
                    min="0" max="1" step=".1">
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Crosshair Rendering Method
            <select name="crosshairRenderType" id="crosshairRenderType"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)">
                <option value="pixelated" ${config.get('crosshairRenderType', 'pixelated') === 'pixelated' ? 'selected' : ''}>
                    Pixelated
                </option>
                <option value="crisp-edges" ${config.get('crosshairRenderType', 'pixelated') === 'crisp-edges' ? 'selected' : ''}>
                    Crisp Edges
                </option>
            </select>
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderCssSetting() {
        const cssPath = config.get('cssPath', '');
        const displayCssName = cssPath.length > 0 ? path.basename(cssPath) : 'NONE';

        return `<div class="tabContainer" style="--tab-accent: var(--col-css);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">code_blocks</span>
            CSS Setting
        </div>
        <div id="menuBodyItem">
            Enable Custom CSS
            <input type="checkbox" name="enableCustomCss" id="enableCustomCss"
                oninput="window.vmc.saveSetting(this.id ,this.checked);window.vmc.customCssChange(this.id,this.checked)"
                ${config.get('enableCustomCss', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Tailwind CSS Menu Theme
            <input type="checkbox" name="useTailwindCss" id="useTailwindCss"
                oninput="window.vmc.saveSetting(this.id, this.checked); window.vmc.toggleMenuTheme(this.checked)"
                ${config.get('useTailwindCss', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            CSS Type
            <select name="cssType" id="cssType"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.customCssChange(this.id,this.value)">
                <option value="url" ${config.get('cssType', 'url') === 'url' ? 'selected' : ''}>URL</option>
                <option value="local" ${config.get('cssType', 'url') === 'local' ? 'selected' : ''}>Local File</option>
                <option value="list" ${config.get('cssType', 'url') === 'list' ? 'selected' : ''}>List</option>
            </select>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Custom CSS URL
            <input type="url" name="cssUrl" id="cssUrl"
                onchange="window.vmc.saveSetting(this.id ,this.value);window.vmc.customCssChange(this.id,this.value)"
                value="${config.get('cssUrl', '')}">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Local CSS File
            <div id="fileNameDisplay">
                <div id="cssName" class="filename">
                    Current : ${displayCssName}
                </div>
                <input type="button" name="openLocaCss" id="menuButton" value="OPEN"
                    onclick="window.vmc.openLocal('cssPath')">
            </div>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Local CSS List
            <select name="localCssList" id="localCssList" onchange="window.vmc.saveSetting(this.id,this.value);window.vmc.customCssChange(this.id,this.value)">
            ${this.getCssListOptions()}
            </select>
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderSwapperSetting() {
        return `<div class="tabContainer" style="--tab-accent: var(--col-swapper);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">swap_horiz</span>
            Resource Swapper
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem" class="requireRestart">*Require Restart Client</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Resource Swapper
            <input type="checkbox" name="enableResourceSwapper" id="enableResourceSwapper"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableResourceSwapper', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Use Default Swapper List
            <input type="checkbox" name="useDefSwapList" id="useDefSwapList"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useDefSwapList', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Use User Swapper List
            <input type="checkbox" name="useUserSwapList" id="useUserSwapList"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useUserSwapList', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Open Swapper Folder
            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openSwapperFolder()">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Open Tutorial <div id="warn">*Open in browser</div>
            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openTutorial('resourceSwapper')">
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderAdblockSetting() {
        return `<div class="tabContainer" style="--tab-accent: var(--col-adblock);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">security</span>
            Ad Blocker
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem" class="requireRestart">*Require Restart Client</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Ad Blocker
            <input type="checkbox" name="enableAdBlocker" id="enableAdBlocker"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableAdBlocker', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Use Default Adblock List
            <input type="checkbox" name="useDefAdBlockList" id="useDefAdBlockList"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useDefAdBlockList', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Use User Adblock List
            <input type="checkbox" name="useUserAdBlockList" id="useUserAdBlockList"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useUserAdBlockList', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Open Tutorial <div id="warn">*Open in browser</div>
            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openTutorial('adBlock')">
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderPerformanceSetting() {
        return `<div class="tabContainer" style="--tab-accent: var(--col-advanced);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">manufacturing</span>
            Performance Settings
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem" class="requireRestart">*Require Restart Client</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Unlimited FPS
            <input type="checkbox" name="unlimitedFps" id="unlimitedFps"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('unlimitedFps', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Raw Input (Low Latency Mouse)
            <input type="checkbox" name="enableRawInput" id="enableRawInput"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableRawInput', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable WebGL Desynchronized (Low Latency Canvas)
            <input type="checkbox" name="enableDesynchronized" id="enableDesynchronized"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableDesynchronized', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Discord RPC
            <input type="checkbox" name="discordRpc" id="discordRpc"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('discordRpc', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable QUIC
            <input type="checkbox" name="enableQuic" id="enableQuic"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableQuic', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Pointer Lock Options
            <input type="checkbox" name="enablePointerLockOptions" id="enablePointerLockOptions"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enablePointerLockOptions', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Heavy Ad Intervention
            <input type="checkbox" name="enableHeavyAdIntervention" id="enableHeavyAdIntervention"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableHeavyAdIntervention', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Ignore GPU Blocklist
            <input type="checkbox" name="ignoreGpuBlocklist" id="ignoreGpuBlocklist"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('ignoreGpuBlocklist', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable V8 JIT Aggressive Optimization
            <input type="checkbox" name="enableV8Opt" id="enableV8Opt"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableV8Opt', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable Parallel Shader Compilation
            <input type="checkbox" name="enableParallelShader" id="enableParallelShader"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableParallelShader', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable WebAudio Buffer Optimization
            <input type="checkbox" name="enableAudioOpt" id="enableAudioOpt"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableAudioOpt', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Clear Cache
            <input type="button" value="CLEAR" onclick="window.vmc.clearCache()">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Reset All Data
            <input type="button" value="RESET" onclick="window.vmc.resetAllData()">
        </div>
        <div class="horizonalLine"></div>
        </div>`;
    }

    renderInfoSetting() {
        return `<div class="tabContainer" style="--tab-accent: var(--col-info, #3B82F6);">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">monitoring</span>
            SimpleInfo HUD Settings
        </div>
        
        <div class="settingSectionHeader">General HUD Display</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable SimpleInfo HUD
            <input type="checkbox" name="enableSimpleInfo" id="enableSimpleInfo"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('enableSimpleInfo', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>

        <div class="settingSectionHeader">Position & Margins</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Display Position
            <select name="infoPosition" id="infoPosition"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.infoGuiChange(this.id,this.value)">
                <option value="top-left" ${config.get('infoPosition', 'top-left') === 'top-left' ? 'selected' : ''}>Top Left</option>
                <option value="top-right" ${config.get('infoPosition', 'top-left') === 'top-right' ? 'selected' : ''}>Top Right</option>
                <option value="bottom-left" ${config.get('infoPosition', 'top-left') === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                <option value="bottom-right" ${config.get('infoPosition', 'top-left') === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
            </select>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Top / Vertical Margin (px)
            <input type="number" class="sizeInput" name="infoMarginTop" id="infoMarginTop"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.infoGuiChange(this.id,this.value)"
                value="${config.get('infoMarginTop', 60)}" min="0" max="1000" step="5">
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Left / Horizontal Margin (px)
            <input type="number" class="sizeInput" name="infoMarginLeft" id="infoMarginLeft"
                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.infoGuiChange(this.id,this.value)"
                value="${config.get('infoMarginLeft', 20)}" min="0" max="1000" step="5">
        </div>
        <div class="horizonalLine"></div>

        <div class="settingSectionHeader">Individual Items Toggle</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show FPS
            <input type="checkbox" name="infoShowFPS" id="infoShowFPS"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowFPS', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Ping (Latency)
            <input type="checkbox" name="infoShowPing" id="infoShowPing"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowPing', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Player Position (XYZ)
            <input type="checkbox" name="infoShowPos" id="infoShowPos"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowPos', true) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Block Position
            <input type="checkbox" name="infoShowBlockPos" id="infoShowBlockPos"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowBlockPos', false) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Chunk Position
            <input type="checkbox" name="infoShowChunkPos" id="infoShowChunkPos"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowChunkPos', false) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Player Velocity
            <input type="checkbox" name="infoShowVelocity" id="infoShowVelocity"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowVelocity', false) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Yaw / Pitch Angles
            <input type="checkbox" name="infoShowAngles" id="infoShowAngles"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowAngles', false) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Loaded Chunks Count
            <input type="checkbox" name="infoShowChunks" id="infoShowChunks"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowChunks', false) ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Show Network Transfer Speed (B/s)
            <input type="checkbox" name="infoShowNetBps" id="infoShowNetBps"
                oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.infoGuiChange(this.id,this.checked)"
                ${config.get('infoShowNetBps', false) ? 'checked' : ''}>
        </div>
        </div>`;
    }

    renderUserscriptSetting() {
        const scripts = getUserScriptsList();
        const enableGlobal = config.get('enableUserScripts', true);

        let listHtml = '';
        if (scripts.length === 0) {
            listHtml = `
            <div style="padding: 20px; text-align: center; color: #888; background: rgba(0,0,0,0.2); border-radius: 8px; margin-top: 15px; font-size: 13px;">
                No <code>*.user.js</code> scripts found in <code>/vmc-swap/userscript</code> folder.<br>
                Click <b>OPEN</b> above to add UserScripts to the folder.
            </div>`;
        } else {
            for (const s of scripts) {
                listHtml += `
                <div class="horizonalLine"></div>
                <div id="menuBodyItem" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <div style="font-weight: bold; color: #60a5fa; font-size: 14px;">
                            ${s.name} <span style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-left: 6px;">v${s.version} (${s.author})</span>
                        </div>
                        <input type="checkbox" name="userscript_${s.filename}" id="userscript_${s.filename}"
                            oninput="window.vmc.saveSetting(this.id, this.checked)"
                            ${s.enabled ? 'checked' : ''}>
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; word-break: break-word;">
                        ${s.description}
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-family: monospace; display: flex; align-items: center; gap: 6px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">description</span>
                        ${s.filename}
                    </div>
                </div>`;
            }
        }

        return `<div class="tabContainer" style="--tab-accent: #3b82f6;">
        <div id="menuBodyTitle">
            <span class="material-symbols-outlined">extension</span>
            UserScript Settings
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem" class="requireRestart">*Require Restart Client</div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Enable UserScripts
            <input type="checkbox" name="enableUserScripts" id="enableUserScripts"
                oninput="window.vmc.saveSetting(this.id,this.checked);" ${enableGlobal ? 'checked' : ''}>
        </div>
        <div class="horizonalLine"></div>
        <div id="menuBodyItem">
            Open UserScript Folder
            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openUserscriptFolder()">
        </div>
        
        <div class="settingSectionHeader" style="margin-top: 15px;">Installed UserScripts (${scripts.length})</div>
        ${listHtml}
        
        <div id="customUserScriptSettingsContainer"></div>
        </div>`;
    }
}

module.exports = SettingsTemplate;
